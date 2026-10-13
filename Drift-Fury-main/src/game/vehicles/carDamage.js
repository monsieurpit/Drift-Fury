// Visible damage on the player's car: crashes dent the bodywork where they hit (the panels pushed in, their
// shading following the crumple), break the headlights or tail lights on that corner, and crack the glass
// facing the impact. Everything is done once per crash on the car's own meshes (nothing per frame).
import {
  CanvasTexture,
  Box3,
  DoubleSide,
  Matrix3,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Raycaster,
  SRGBColorSpace,
  Vector3,
} from "three";

const MAX_DENT = 0.24; // m: a panel is never pushed in further than this in total
const MAX_CRACKS = 4;

let crackMaterial = null;
/** Cracked safety glass: a white impact star, radial cracks and rings of short cross-cracks. */
function crackTexture() {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const c = size / 2;
  context.lineCap = "round";
  const rays = [];
  for (let k = 0; k < 15; k++) {
    let angle = (k / 15) * Math.PI * 2 + (Math.random() - 0.5) * 0.35;
    let x = c;
    let y = c;
    const points = [[x, y]];
    const reach = size * (0.28 + Math.random() * 0.2);
    for (let r = 0; r < reach; ) {
      const step = 10 + Math.random() * 18;
      r += step;
      angle += (Math.random() - 0.5) * 0.35;
      x += Math.cos(angle) * step;
      y += Math.sin(angle) * step;
      points.push([x, y]);
    }
    rays.push(points);
  }
  const stroke = (alpha, width) => {
    context.strokeStyle = `rgba(235, 242, 248, ${alpha})`;
    context.lineWidth = width;
  };
  for (const points of rays) {
    stroke(0.85, 1.6);
    context.beginPath();
    context.moveTo(points[0][0], points[0][1]);
    for (const [x, y] of points) context.lineTo(x, y);
    context.stroke();
  }
  // Rings: short cracks joining neighbouring rays.
  for (let ring = 1; ring < 7; ring++) {
    stroke(0.6 - ring * 0.06, 1.1);
    for (let k = 0; k < rays.length; k++) {
      if (Math.random() < 0.3) continue;
      const a = rays[k][Math.min(ring, rays[k].length - 1)];
      const b = rays[(k + 1) % rays.length][Math.min(ring, rays[(k + 1) % rays.length].length - 1)];
      context.beginPath();
      context.moveTo(a[0], a[1]);
      context.quadraticCurveTo((a[0] + b[0]) / 2 + (Math.random() - 0.5) * 8, (a[1] + b[1]) / 2, b[0], b[1]);
      context.stroke();
    }
  }
  // The crushed spot where it was hit.
  const star = context.createRadialGradient(c, c, 0, c, c, 22);
  star.addColorStop(0, "rgba(240, 245, 250, 0.95)");
  star.addColorStop(1, "rgba(240, 245, 250, 0)");
  context.fillStyle = star;
  context.fillRect(c - 24, c - 24, 48, 48);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

function glassCrackMaterial() {
  crackMaterial ??= new MeshStandardMaterial({
    map: crackTexture(),
    transparent: true,
    depthWrite: false,
    roughness: 0.25,
    metalness: 0,
    emissive: "#9aa6b2",
    emissiveIntensity: 0.06,
    side: DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });
  crackMaterial.emissiveMap = crackMaterial.map;
  return crackMaterial;
}

/** A hidden mesh with the cracked-glass material, so its shader is compiled with the session's. */
export function crackPrewarm() {
  const mesh = new Mesh(new PlaneGeometry(0.01, 0.01), glassCrackMaterial());
  mesh.visible = false;
  return mesh;
}

const isGlass = (material) =>
  !!material &&
  (/glass|window|windshield|windscreen/i.test(material.name || "") ||
    (material.transparent && material.opacity < 0.95) ||
    (material.transmission ?? 0) > 0);

/** Same position, same number: the crumple noise must not tear apart vertices that share a position. */
const hash3 = (x, y, z) => {
  const s = Math.sin(Math.round(x * 50) * 12.9898 + Math.round(y * 50) * 78.233 + Math.round(z * 50) * 37.719) * 43758.5453;
  return s - Math.floor(s);
};

const carInverse = new Matrix4();
const toCar = new Matrix4();
const toMesh = new Matrix4();
const normalToMesh = new Matrix3();
const p = new Vector3();
const n = new Vector3();
const radial = new Vector3();
const shift = new Vector3();
const raycaster = new Raycaster();

/**
 * Damage for `car` (a player car Group facing -Z). hit(sideX, sideZ, strength): a crash coming from the
 * car-local direction (sideX, sideZ) (where the thing it hit is), strength 0..1.5.
 * Returns { lights: [...broken ("front"|"rear") + side], glass: bool }.
 */
export function createCarDamage(car) {
  const data = car.userData;
  const wheelParts = new Set();
  for (const wheel of data.wheels || []) wheel.traverse((object) => wheelParts.add(object));
  car.updateMatrixWorld(true);
  carInverse.copy(car.matrixWorld).invert();
  const bounds = new Box3();
  const bodies = [];
  car.traverse((object) => {
    if (!object.isMesh || object.isInstancedMesh || wheelParts.has(object)) return;
    if (object.userData.crack) return;
    bodies.push(object);
    toCar.multiplyMatrices(carInverse, object.matrixWorld);
    object.geometry.computeBoundingBox();
    bounds.union(object.geometry.boundingBox.clone().applyMatrix4(toCar));
  });
  const half = bounds.getSize(new Vector3()).multiplyScalar(0.5);
  const centre = bounds.getCenter(new Vector3());
  let cracks = 0;
  const broken = new Set();

  function dent(point, direction, depth, radius) {
    car.updateMatrixWorld(true);
    carInverse.copy(car.matrixWorld).invert();
    for (const mesh of bodies) {
      toCar.multiplyMatrices(carInverse, mesh.matrixWorld);
      toMesh.copy(toCar).invert();
      normalToMesh.getNormalMatrix(toMesh);
      let geometry = mesh.geometry;
      const position = geometry.attributes.position;
      if (!position) continue;
      // Quick reject: the mesh's bounds don't reach the dent.
      const box = geometry.boundingBox || (geometry.computeBoundingBox(), geometry.boundingBox);
      const inCar = box.clone().applyMatrix4(toCar);
      if (inCar.distanceToPoint(point) > radius) continue;
      if (!mesh.userData.ownGeometry) {
        // (The model's geometry is shared with the instanced cars of the city: dent a copy.)
        geometry = mesh.geometry = geometry.clone();
        mesh.userData.ownGeometry = true;
        mesh.userData.dentTotal = new Float32Array(geometry.attributes.position.count);
      }
      const positions = geometry.attributes.position;
      const normals = geometry.attributes.normal;
      const total = mesh.userData.dentTotal;
      let moved = false;
      for (let i = 0; i < positions.count; i++) {
        p.fromBufferAttribute(positions, i).applyMatrix4(toCar);
        const d = p.distanceTo(point);
        if (d >= radius) continue;
        const fall = 1 - d / radius;
        const crumple = 0.7 + 0.6 * hash3(p.x, p.y, p.z);
        let amount = depth * fall * fall * crumple;
        amount = Math.min(amount, MAX_DENT - total[i]);
        if (amount <= 0) continue;
        total[i] += amount;
        p.addScaledVector(direction, amount).applyMatrix4(toMesh);
        positions.setXYZ(i, p.x, p.y, p.z);
        if (normals) {
          // The panel slopes down into the dent: tilt its normal toward the dent's centre.
          p.fromBufferAttribute(positions, i).applyMatrix4(toCar);
          radial.subVectors(p, point).addScaledVector(direction, -radial.dot(direction));
          if (radial.lengthSq() > 1e-6) {
            radial.normalize();
            const slope = Math.min(0.9, (2 * depth * fall * crumple) / radius);
            shift.copy(radial).multiplyScalar(-slope).applyMatrix3(normalToMesh);
            n.fromBufferAttribute(normals, i).add(shift).normalize();
            normals.setXYZ(i, n.x, n.y, n.z);
          }
        }
        moved = true;
      }
      if (moved) {
        positions.needsUpdate = true;
        if (normals) normals.needsUpdate = true;
        geometry.computeBoundingSphere();
      }
    }
  }

  function breakLights(end, side) {
    const key = `${end}${side}`;
    if (broken.has(key)) return false;
    broken.add(key);
    const front = end === "front";
    // Headlight beams (spot lights) and the lamp meshes on that corner go dark.
    for (const beam of front ? data.headlightBeams || [] : []) {
      if (Math.sign(beam.position.x || 1) === side || side === 0) beam.userData.broken = true;
    }
    for (const lamp of front ? data.headlights || [] : data.brakeLights || []) {
      lamp.updateMatrixWorld();
      p.setFromMatrixPosition(lamp.matrixWorld).applyMatrix4(carInverse);
      const lampSide = Math.abs(p.x) < 0.2 ? 0 : Math.sign(p.x);
      if (side !== 0 && lampSide !== 0 && lampSide !== side) continue;
      if (!lamp.material || lamp.userData.broken) continue;
      lamp.material = lamp.material.clone();
      lamp.material.emissive?.setScalar(0);
      lamp.material.emissiveIntensity = 0;
      lamp.material.color?.multiplyScalar(0.25);
      lamp.userData.broken = true;
    }
    return true;
  }

  function crackGlass(direction) {
    if (cracks >= MAX_CRACKS) return false;
    // From outside the car toward its middle at window height: the first glass on the way.
    car.updateMatrixWorld(true);
    const target = new Vector3(centre.x, centre.y + half.y * 0.45, centre.z);
    const from = target.clone().addScaledVector(direction, -6).add(new Vector3(0, 0.35, 0));
    const origin = car.localToWorld(from.clone());
    const towards = car.localToWorld(target.clone()).sub(origin).normalize();
    raycaster.set(origin, towards);
    raycaster.far = 8;
    const hit = raycaster.intersectObjects(bodies, false).find((h) => isGlass(h.object.material));
    if (!hit || !hit.face) return false;
    const material = glassCrackMaterial();
    const normal = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
    if (normal.dot(towards) > 0) normal.negate(); // facing the outside
    const size = 0.6 + Math.random() * 0.35;
    const crack = new Mesh(new PlaneGeometry(size, size), material);
    crack.userData.crack = true;
    crack.castShadow = false;
    crack.receiveShadow = false;
    crack.renderOrder = 2;
    crack.position.copy(hit.point).addScaledVector(normal, 0.008);
    crack.lookAt(crack.position.clone().add(normal));
    crack.rotateZ(Math.random() * Math.PI * 2);
    car.attach(crack);
    cracks++;
    return true;
  }

  return {
    hit(sideX, sideZ, strength) {
      const length = Math.hypot(sideX, sideZ);
      if (length < 1e-6 || strength < 0.12) return { lights: [], glass: false };
      const dx = sideX / length;
      const dz = sideZ / length;
      // Where the impact meets the body's outline.
      const t = Math.min(half.x / Math.max(Math.abs(dx), 1e-3), half.z / Math.max(Math.abs(dz), 1e-3));
      const point = new Vector3(centre.x + dx * t, centre.y - half.y * 0.15, centre.z + dz * t);
      const direction = new Vector3(-dx, 0, -dz);
      const s = Math.min(strength, 1.5);
      dent(point, direction, 0.04 + s * 0.11, 0.55 + s * 0.4);
      const lights = [];
      // Corners: front (-Z) or rear, and which side.
      const end = point.z < centre.z - half.z * 0.6 ? "front" : point.z > centre.z + half.z * 0.6 ? "rear" : null;
      if (end && s > 0.35) {
        const side = Math.abs(dx) < 0.25 && s > 0.9 ? 0 : Math.sign(point.x - centre.x) || 1;
        if (side === 0) {
          if (breakLights(end, -1)) lights.push(`${end}-1`);
          if (breakLights(end, 1)) lights.push(`${end}1`);
        } else if (breakLights(end, side)) {
          lights.push(`${end}${side}`);
        }
      }
      const glass = s > 0.6 && Math.random() < 0.35 + s * 0.3 ? crackGlass(direction) : false;
      return { lights, glass };
    },
    /** Whether a headlight beam was broken (the session keeps it off). */
    isBroken(object) {
      return !!object.userData.broken;
    },
  };
}
