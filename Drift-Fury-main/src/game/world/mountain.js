// The Kuro mountain: terrain meshes, the road that climbs it (asphalt, markings, shoulders, guardrails,
// delineators, summit lookout) and its scenery (pine forest and boulders).
import {
  BoxGeometry,
  Box3,
  Sphere,
  DataTexture,
  RGBAFormat,
  LinearFilter,
  LinearMipmapLinearFilter,
  PlaneGeometry,
  SRGBColorSpace,
  BufferAttribute,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  LOD,
  Mesh,
  MeshLambertMaterial,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createRandom } from "../util/random.js";
import { fbm, smoothstep } from "../util/noise.js";
import {
  ROAD_END_Z,
  ROAD_HALF_WIDTH,
  SUMMIT,
  distanceToRoad,
  roadCenterX,
  roadElevation,
  terrainHeight,
} from "./terrain.js";
import { createTerrainMaterial } from "./terrainMaterial.js";
import { createBranchCardMaterial, createFoliageMaterial } from "./foliageMaterial.js";
import { getTerrainTextures } from "./terrainTextures.js";
import { createRoadSurfaceMaterial } from "./roadSurface.js";

// ------------------------------------------------------------------ terrain

/** Where the detailed terrain mesh is built; the coarse backdrop mesh covers everything else. */
const NEAR = { minX: -256, maxX: 160, minZ: -768, maxZ: -96, step: 2 };
const FAR = { minX: -1280, maxX: 1152, minZ: -1760, maxZ: -96, step: 8 };

function terrainNormal(x, z, out) {
  const e = 1;
  out.set(
    terrainHeight(x - e, z) - terrainHeight(x + e, z),
    2 * e,
    terrainHeight(x, z - e) - terrainHeight(x, z + e),
  );
  return out.normalize();
}

/**
 * Builds a grid mesh over [minX, maxX] x [minZ, maxZ]. `skipCell(x0, z0, x1, z1)` drops cells (used to cut the
 * detailed area out of the backdrop). `edgeStep` snaps the outer border heights to a coarser grid so the
 * detailed mesh meets the backdrop without cracks.
 */
function terrainGrid({ minX, maxX, minZ, maxZ, step }, { skipCell, edgeStep } = {}) {
  const columns = Math.round((maxX - minX) / step) + 1;
  const rows = Math.round((maxZ - minZ) / step) + 1;
  const positions = new Float32Array(columns * rows * 3);
  const normals = new Float32Array(columns * rows * 3);
  const normal = new Vector3();
  const coarse = (value, min) => min + Math.floor((value - min) / edgeStep) * edgeStep;
  for (let row = 0; row < rows; row++) {
    const z = minZ + row * step;
    for (let column = 0; column < columns; column++) {
      const x = minX + column * step;
      let y = terrainHeight(x, z);
      const onEdge = row === 0 || row === rows - 1 || column === 0 || column === columns - 1;
      if (edgeStep && onEdge) {
        // Interpolate along the border between coarse vertices, exactly as the backdrop triangle edge does.
        if (row === 0 || row === rows - 1) {
          const x0 = coarse(x, minX);
          const t = (x - x0) / edgeStep;
          y = terrainHeight(x0, z) * (1 - t) + (t > 0 ? terrainHeight(x0 + edgeStep, z) * t : 0);
        } else {
          const z0 = coarse(z, minZ);
          const t = (z - z0) / edgeStep;
          y = terrainHeight(x, z0) * (1 - t) + (t > 0 ? terrainHeight(x, z0 + edgeStep) * t : 0);
        }
      }
      const index = (row * columns + column) * 3;
      positions[index] = x;
      positions[index + 1] = y;
      positions[index + 2] = z;
      terrainNormal(x, z, normal);
      normals[index] = normal.x;
      normals[index + 1] = normal.y;
      normals[index + 2] = normal.z;
    }
  }
  const indices = [];
  for (let row = 0; row < rows - 1; row++) {
    for (let column = 0; column < columns - 1; column++) {
      const x0 = minX + column * step;
      const z0 = minZ + row * step;
      if (skipCell && skipCell(x0, z0, x0 + step, z0 + step)) continue;
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      // Split each quad along the diagonal that better follows the surface.
      if (
        Math.abs(positions[a * 3 + 1] - positions[d * 3 + 1]) <
        Math.abs(positions[b * 3 + 1] - positions[c * 3 + 1])
      ) {
        indices.push(a, c, d, a, d, b);
      } else {
        indices.push(a, c, b, b, c, d);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  return geometry;
}

/** The mountain ground: a detailed mesh around the play area and a coarse one out to the horizon. */
export function buildMountainTerrain(world) {
  const { scene } = world;
  const material = createTerrainMaterial();
  world.terrainMaterial = material;
  // The terrain only receives shadows: as a caster it doubled its triangle cost every frame for shadows the
  // slope lighting already conveys.
  for (const tile of splitIntoTiles(terrainGrid(NEAR, { edgeStep: FAR.step }), 2, 3)) {
    const near = new Mesh(tile, material);
    near.name = "mountain-terrain";
    near.receiveShadow = true;
    scene.add(near);
  }
  const insideNear = (x0, z0, x1, z1) =>
    x0 >= NEAR.minX && x1 <= NEAR.maxX && z0 >= NEAR.minZ && z1 <= NEAR.maxZ;
  for (const tile of splitIntoTiles(terrainGrid(FAR, { skipCell: insideNear }), 4, 4)) {
    const far = new Mesh(tile, material);
    far.name = "mountain-backdrop";
    far.receiveShadow = true;
    scene.add(far);
  }
  // Underlay: open ground out to the horizon in every direction, a little below the map, so no view (the
  // highway looking east, the city's outskirts) ever looks past the edge of the world into the void.
  // It is only ever seen far away, so it is a flat meadow colour (what the grass averages to at range),
  // and it is drawn after the other opaque geometry so the depth test discards the parts hidden beneath.
  const meadow = new Color().setRGB(...getTerrainTextures().grass.average).multiplyScalar(0.95);
  const underlay = new Mesh(
    new PlaneGeometry(6000, 6000).rotateX(-Math.PI / 2),
    new MeshLambertMaterial({ color: meadow }),
  );
  underlay.name = "world-underlay";
  underlay.position.set(0, -1.2, -400);
  underlay.renderOrder = 10;
  scene.add(underlay);
}

/**
 * Splits an indexed grid into `columns` x `rows` tiles by triangle centre. Tiles share the vertex buffers
 * (uploaded once) and get their own index and bounding sphere, so off-screen tiles are culled.
 */
function splitIntoTiles(geometry, columns, rows) {
  geometry.computeBoundingBox();
  const { min, max } = geometry.boundingBox;
  const position = geometry.attributes.position;
  const index = geometry.index.array;
  const buckets = Array.from({ length: columns * rows }, () => []);
  for (let i = 0; i < index.length; i += 3) {
    const a = index[i];
    const b = index[i + 1];
    const c = index[i + 2];
    const x = (position.getX(a) + position.getX(b) + position.getX(c)) / 3;
    const z = (position.getZ(a) + position.getZ(b) + position.getZ(c)) / 3;
    const column = Math.min(columns - 1, Math.floor(((x - min.x) / (max.x - min.x)) * columns));
    const row = Math.min(rows - 1, Math.floor(((z - min.z) / (max.z - min.z)) * rows));
    buckets[row * columns + column].push(a, b, c);
  }
  const point = new Vector3();
  return buckets
    .filter((bucket) => bucket.length)
    .map((bucket) => {
      const tile = new BufferGeometry();
      for (const name of Object.keys(geometry.attributes)) tile.setAttribute(name, geometry.attributes[name]);
      tile.setIndex(bucket);
      const box = new Box3();
      for (const vertex of bucket) box.expandByPoint(point.fromBufferAttribute(position, vertex));
      tile.boundingBox = box;
      tile.boundingSphere = box.getBoundingSphere(new Sphere());
      return tile;
    });
}

// ------------------------------------------------------------------ road

/** Samples the road centre line every ~`spacing` metres, with tangent, right vector and running distance. */
function sampleRoad(spacing = 1.5) {
  const startZ = -89; // the end of the city's x = 0 avenue
  const samples = [];
  let distance = 0;
  let previous = null;
  for (let z = startZ; z >= ROAD_END_Z - 6; z -= 0.5) {
    const point = new Vector3(roadCenterX(z), roadElevation(z), z);
    if (previous) {
      const step = Math.hypot(point.x - previous.x, point.z - previous.z);
      if (step < spacing && z > ROAD_END_Z - 5.5) continue;
      distance += step;
    }
    samples.push({ point, distance });
    previous = point;
  }
  samples.forEach((sample, index) => {
    const a = samples[Math.max(0, index - 1)].point;
    const b = samples[Math.min(samples.length - 1, index + 1)].point;
    const tangent = new Vector3(b.x - a.x, 0, b.z - a.z).normalize();
    sample.tangent = tangent;
    sample.right = new Vector3(-tangent.z, 0, tangent.x);
  });
  return samples;
}

/**
 * Sweeps a cross-section profile along the road. `profile` is a list of [lateral offset, height above ground]
 * points; each vertex is dropped onto the terrain at its own lateral position (plus its height), so ribbons
 * hug the ground exactly. `uScale`/`vScale` map metres across/along to texture coordinates.
 */
function sweep(samples, profile, { uScale = 1, uOffset = 0, vScale = 1, follow = "terrain" } = {}) {
  const positions = [];
  const uvs = [];
  const indices = [];
  const columns = profile.length;
  samples.forEach((sample, row) => {
    for (const [offset, lift] of profile) {
      const x = sample.point.x + sample.right.x * offset;
      const z = sample.point.z + sample.right.z * offset;
      const base = follow === "road" ? roadElevation(Math.max(z, SUMMIT.z)) : terrainHeight(x, z);
      positions.push(x, base + lift, z);
      uvs.push((offset + uOffset) * uScale, sample.distance * vScale);
    }
    if (row > 0) {
      const a = (row - 1) * columns;
      const b = row * columns;
      for (let column = 0; column < columns - 1; column++) {
        indices.push(a + column, a + column + 1, b + column, a + column + 1, b + column + 1, b + column);
      }
    }
  });
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** Splits samples into runs where `keep(sample)` holds (for guardrails that only exist above drops). */
function runs(samples, keep, minLength = 6) {
  const result = [];
  let current = [];
  for (const sample of samples) {
    if (keep(sample)) {
      current.push(sample);
    } else {
      if (current.length >= minLength) result.push(current);
      current = [];
    }
  }
  if (current.length >= minLength) result.push(current);
  return result;
}

const roadPaint = (color) =>
  new MeshStandardMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2,
  });

/** The road from the city up to the summit, with everything along it. */
export function buildMountainRoad(world) {
  const { scene } = world;
  const samples = sampleRoad();
  world.mountainRoadSamples = samples;
  const half = ROAD_HALF_WIDTH;
  const lift = 0.07; // the city road surface sits 7 cm above the ground; match it so the join is seamless

  // The city's asphalt (tiled every `tile` metres like the streets) with a lane-wear overlay.
  const tile = world.roadMaterial.userData.tile || 10;
  const asphalt = new Mesh(
    sweep(
      samples,
      [-half, -half / 2, 0, half / 2, half].map((o) => [o, lift]),
      { uScale: 1 / tile, uOffset: half, vScale: 1 / tile },
    ),
    createRoadSurfaceMaterial(world.roadMaterial, 2 * half),
  );
  asphalt.name = "mountain-road";
  asphalt.receiveShadow = true;
  scene.add(asphalt);

  // Gravel shoulders sloping down into the verge.
  const gravel = getTerrainTextures().gravel;
  const shoulderMaterial = new MeshStandardMaterial({
    map: gravel.map,
    normalMap: gravel.normalMap,
    roughness: 0.95,
    color: "#b9b2a6",
  });
  for (const side of [-1, 1]) {
    const profile = [
      [side * half, lift - 0.005],
      [side * (half + 1.2), 0.04],
      [side * (half + 2.4), 0.0],
    ];
    if (side < 0) profile.reverse();
    const shoulder = new Mesh(sweep(samples, profile, { uScale: 0.35, vScale: 0.35 }), shoulderMaterial);
    shoulder.name = "mountain-shoulder";
    shoulder.receiveShadow = true;
    scene.add(shoulder);
  }

  // Markings: double yellow centre line and white edge lines, slightly worn (vertex alpha would cost a
  // transparent pass, so wear comes from the line colour instead).
  const yellow = roadPaint("#d8b43c");
  const white = roadPaint("#dcdad0");
  const markingLift = lift + 0.012;
  const line = (center, width, material) => {
    const mesh = new Mesh(
      sweep(
        samples,
        [
          [center - width / 2, markingLift],
          [center + width / 2, markingLift],
        ],
        {},
      ),
      material,
    );
    mesh.name = "mountain-marking";
    mesh.receiveShadow = true;
    scene.add(mesh);
  };
  line(-0.14, 0.12, yellow);
  line(0.14, 0.12, yellow);
  line(-half + 0.35, 0.16, white);
  line(half - 0.35, 0.16, white);

  // Guardrails on whichever side drops away (or is a long way down), galvanized W-beam on posts.
  const railMaterial = new MeshStandardMaterial({
    color: "#a7afb4",
    metalness: 0.85,
    roughness: 0.38,
    side: DoubleSide,
  });
  const postMaterial = new MeshStandardMaterial({ color: "#7d858a", metalness: 0.7, roughness: 0.5 });
  const railOffset = half + 1.7;
  // W-beam cross-section (lateral offset from the post face, height), slightly corrugated.
  const beam = [
    [0.0, 0.52],
    [0.06, 0.58],
    [0.02, 0.66],
    [0.07, 0.74],
    [0.02, 0.82],
    [0.06, 0.86],
    [0.0, 0.9],
  ];
  const posts = [];
  for (const side of [-1, 1]) {
    const drop = (sample) => {
      const x = sample.point.x + sample.right.x * side * (railOffset + 5);
      const z = sample.point.z + sample.right.z * side * (railOffset + 5);
      return sample.point.y - terrainHeight(x, z) > 1.2 && sample.point.z < -118;
    };
    for (const run of runs(samples, drop)) {
      const profile = beam.map(([out, y]) => [side * (railOffset + out), y]);
      if (side < 0) profile.reverse();
      const rail = new Mesh(sweep(run, profile, { follow: "road" }), railMaterial);
      rail.name = "mountain-guardrail";
      rail.castShadow = true;
      rail.receiveShadow = true;
      scene.add(rail);
      // Posts every ~4 m.
      let next = run[0].distance;
      for (const sample of run) {
        if (sample.distance < next) continue;
        next = sample.distance + 4;
        const x = sample.point.x + sample.right.x * side * (railOffset - 0.12);
        const z = sample.point.z + sample.right.z * side * (railOffset - 0.12);
        posts.push([x, sample.point.y, z, Math.atan2(sample.tangent.x, sample.tangent.z)]);
      }
    }
  }
  const postMesh = new InstancedMesh(new BoxGeometry(0.16, 1.05, 0.12), postMaterial, posts.length);
  const dummy = new Object3D();
  posts.forEach(([x, y, z, yaw], index) => {
    dummy.position.set(x, y + 0.45, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.updateMatrix();
    postMesh.setMatrixAt(index, dummy.matrix);
  });
  postMesh.castShadow = true;
  postMesh.name = "mountain-guardrail-posts";
  scene.add(postMesh);

  // Delineator posts (white with a black band and an amber reflector) every 25 m on both sides.
  const delineators = [];
  for (const side of [-1, 1]) {
    let next = 30;
    for (const sample of samples) {
      if (sample.distance < next) continue;
      next = sample.distance + 25;
      const x = sample.point.x + sample.right.x * side * (half + 2.6);
      const z = sample.point.z + sample.right.z * side * (half + 2.6);
      delineators.push([x, terrainHeight(x, z), z, Math.atan2(sample.tangent.x, sample.tangent.z)]);
    }
  }
  const delineatorBody = new InstancedMesh(
    new BoxGeometry(0.12, 1.0, 0.12),
    new MeshStandardMaterial({ color: "#e9e7e0", roughness: 0.5 }),
    delineators.length,
  );
  const delineatorBand = new InstancedMesh(
    new BoxGeometry(0.125, 0.25, 0.125),
    new MeshStandardMaterial({ color: "#121314", roughness: 0.6 }),
    delineators.length,
  );
  const delineatorReflector = new InstancedMesh(
    new BoxGeometry(0.13, 0.12, 0.05),
    new MeshStandardMaterial({
      color: "#ff9a1a",
      emissive: "#ff7a00",
      emissiveIntensity: 0.6,
      roughness: 0.3,
    }),
    delineators.length,
  );
  delineators.forEach(([x, y, z, yaw], index) => {
    dummy.rotation.set(0, yaw, 0);
    dummy.position.set(x, y + 0.5, z);
    dummy.updateMatrix();
    delineatorBody.setMatrixAt(index, dummy.matrix);
    dummy.position.set(x, y + 0.78, z);
    dummy.updateMatrix();
    delineatorBand.setMatrixAt(index, dummy.matrix);
    dummy.position.set(x, y + 0.78, z);
    dummy.updateMatrix();
    delineatorReflector.setMatrixAt(index, dummy.matrix);
  });
  for (const mesh of [delineatorBody, delineatorBand, delineatorReflector]) {
    mesh.castShadow = mesh !== delineatorReflector;
    mesh.name = "mountain-delineators";
    scene.add(mesh);
  }

  buildSummit(world, { lift, postMaterial });
}

/** The lookout at the top of the road: a paved circle, a low stone wall, benches and a radio mast. */
function buildSummit(world, { lift, postMaterial }) {
  const { scene, roadMaterial, addSolid } = world;
  const centerY = roadElevation(SUMMIT.z);
  // Paved circle (a disc following the plaza's flat elevation).
  const segments = 48;
  const positions = [SUMMIT.x, centerY + lift, SUMMIT.z];
  const uvs = [SUMMIT.x * 0.1, SUMMIT.z * 0.1];
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = SUMMIT.x + Math.cos(angle) * (SUMMIT.radius + 1);
    const z = SUMMIT.z + Math.sin(angle) * (SUMMIT.radius + 1);
    positions.push(x, centerY + lift, z);
    uvs.push(x * 0.1, z * 0.1);
  }
  const indices = [];
  for (let i = 1; i <= segments; i++) indices.push(0, i + 1, i);
  const disc = new BufferGeometry();
  disc.setAttribute("position", new Float32BufferAttribute(positions, 3));
  disc.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  disc.setIndex(indices);
  disc.computeVertexNormals();
  const plaza = new Mesh(disc, roadMaterial);
  plaza.name = "summit-plaza";
  plaza.receiveShadow = true;
  scene.add(plaza);

  // Low dry-stone wall around the far side of the circle (open toward the road).
  const stone = new MeshStandardMaterial({ color: "#8b8378", roughness: 0.95 });
  const textures = getTerrainTextures();
  stone.map = textures.rock.map;
  stone.normalMap = textures.rock.normalMap;
  const entryAngle = Math.atan2(ROAD_END_Z - SUMMIT.z, 0); // the road arrives from the city side (+z)
  const blocks = [];
  for (let i = 0; i < 64; i++) {
    const angle = (i / 64) * Math.PI * 2;
    let delta = Math.abs(((angle - entryAngle + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
    if (delta < 0.42) continue;
    blocks.push(angle);
  }
  const wall = new InstancedMesh(new BoxGeometry(2.05, 0.75, 0.6), stone, blocks.length);
  const dummy = new Object3D();
  blocks.forEach((angle, index) => {
    const radius = SUMMIT.radius + 1.6;
    const x = SUMMIT.x + Math.cos(angle) * radius;
    const z = SUMMIT.z + Math.sin(angle) * radius;
    dummy.position.set(x, centerY + 0.3, z);
    dummy.rotation.set(0, -angle + Math.PI / 2, 0);
    dummy.updateMatrix();
    wall.setMatrixAt(index, dummy.matrix);
    if (index % 3 === 0) addSolid(x, z, 1.2, 1.2);
  });
  wall.castShadow = true;
  wall.receiveShadow = true;
  wall.name = "summit-wall";
  scene.add(wall);

  // Benches facing the view.
  const wood = new MeshStandardMaterial({ color: "#5a4632", roughness: 0.85 });
  for (const angle of [-2.2, -1.57, -0.9]) {
    const radius = SUMMIT.radius - 1.6;
    const bench = new Group();
    const seat = new Mesh(new BoxGeometry(1.8, 0.08, 0.45), wood);
    seat.position.y = 0.45;
    const back = new Mesh(new BoxGeometry(1.8, 0.4, 0.06), wood);
    back.position.set(0, 0.75, 0.2);
    bench.add(seat, back);
    for (const leg of [-0.75, 0.75]) {
      const support = new Mesh(new BoxGeometry(0.08, 0.45, 0.45), postMaterial);
      support.position.set(leg, 0.22, 0);
      bench.add(support);
    }
    bench.traverse((child) => {
      child.castShadow = true;
    });
    bench.position.set(
      SUMMIT.x + Math.cos(angle) * radius,
      centerY + lift,
      SUMMIT.z + Math.sin(angle) * radius,
    );
    bench.rotation.y = -angle - Math.PI / 2;
    scene.add(bench);
  }

  // Radio mast with a blinking aircraft-warning light, behind the wall.
  const mastX = SUMMIT.x - 14;
  const mastZ = SUMMIT.z - 34;
  const mastY = terrainHeight(mastX, mastZ);
  const lattice = new MeshStandardMaterial({ color: "#c9c3b8", metalness: 0.6, roughness: 0.5 });
  const mast = new Group();
  for (let level = 0; level < 9; level++) {
    const width = 1.6 - level * 0.14;
    for (const [dx, dz] of [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]) {
      const leg = new Mesh(new CylinderGeometry(0.06, 0.06, 4.2, 5), lattice);
      leg.position.set((dx * width) / 2, level * 4 + 2, (dz * width) / 2);
      mast.add(leg);
    }
    const ring = new Mesh(new BoxGeometry(width, 0.08, width), lattice);
    ring.position.y = level * 4 + 4;
    mast.add(ring);
  }
  const beaconMaterial = new MeshStandardMaterial({
    color: "#300000",
    emissive: "#ff1a10",
    emissiveIntensity: 4,
  });
  const beacon = new Mesh(new SphereGeometry(0.22, 12, 8), beaconMaterial);
  beacon.position.y = 36.4;
  mast.add(beacon);
  mast.position.set(mastX, mastY, mastZ);
  mast.traverse((child) => {
    child.castShadow = true;
  });
  scene.add(mast);
  world.summitBeacon = beaconMaterial;
  addSolid(mastX, mastZ, 1, 1);
}

// ------------------------------------------------------------------ scenery

/**
 * One pine: a trunk and drooping whorls of foliage, tapering to a spire, with ragged edges and dark-to-light
 * vertex colours (inside of the crown darker than the tips).
 */
function pineGeometry(random, variant, withCards) {
  const parts = [];
  const height = 9 + variant * 1.6;
  const crownBase = 1.4 + random() * 0.6;
  const trunk = new CylinderGeometry(0.12, 0.26, crownBase + 1.2, 7, 1);
  trunk.translate(0, (crownBase + 1.2) / 2, 0);
  const bark = new Color("#3b2c22");
  const trunkColors = [];
  for (let i = 0; i < trunk.attributes.position.count; i++) trunkColors.push(bark.r, bark.g, bark.b);
  trunk.setAttribute("color", new Float32BufferAttribute(trunkColors, 3));
  parts.push(trunk.toNonIndexed());

  const whorls = 7 + Math.floor(variant / 2);
  const cards = { positions: [], normals: [], colors: [], uvs: [] };
  // Cards draw from their own stream so the crown core is identical with and without them (no LOD pop).
  const cardRandom = createRandom(Math.floor(random() * 1e9));
  const dark = new Color("#0e2116");
  const mid = new Color("#1d3a22");
  const tip = new Color("#3f5f33");
  for (let w = 0; w < whorls; w++) {
    const t = w / (whorls - 1);
    const y =
      crownBase +
      Math.pow(t, 0.92) * (height - crownBase - 1.4) +
      (w > 0 && w < whorls - 1 ? (random() - 0.5) * 0.5 : 0);
    const fullRadius = ((1 - Math.pow(t, 1.15)) * (1.9 + variant * 0.2) + 0.3) * (0.78 + random() * 0.44);
    // Whorls carry branch cards around a slimmer, darker solid core (the shaded inside of the crown); only
    // the leader at the very top stays solid.
    const carded = withCards && w < whorls - 1;
    const radius = carded ? fullRadius * 0.62 : fullRadius;
    if (carded) {
      addBranchCards(cards, cardRandom, y, fullRadius, t);
      // Lower crown: a second, offset layer of limbs between this whorl and the next one up.
      if (t < 0.45) addBranchCards(cards, cardRandom, y + 0.55, fullRadius * 0.9, t);
    }
    const layerHeight = 1.5 - t * 0.5;
    const segments = 10;
    const positions = [];
    const colors = [];
    const rim = [];
    const twist = random() * Math.PI;
    for (let s = 0; s < segments; s++) {
      // Alternate long branch tips and short gaps (a star outline), long tips drooping lower.
      const long = s % 2 === 0;
      const angle = (s / segments) * Math.PI * 2 + twist + (random() - 0.5) * 0.25;
      const r = radius * (long ? 0.95 + random() * 0.3 : 0.55 + random() * 0.15);
      const droop = long ? 0.35 + random() * 0.45 : 0.05;
      rim.push([Math.cos(angle) * r, y - droop, Math.sin(angle) * r]);
    }
    const apex = [0, y + layerHeight, 0];
    const under = [0, y + 0.2, 0];
    const shade = (color, amount) => color.clone().lerp(tip, amount);
    for (let s = 0; s < segments; s++) {
      const a = rim[s];
      const b = rim[(s + 1) % segments];
      // Upper surface (outside of the whorl).
      positions.push(...apex, ...b, ...a);
      const top = shade(carded ? dark : mid, 0.25 + t * 0.3);
      const edge = shade(carded ? dark : mid, 0.45 + random() * 0.25);
      colors.push(top.r, top.g, top.b, edge.r, edge.g, edge.b, edge.r, edge.g, edge.b);
      // Underside of the lower branches (dark, seen when looking up at trees above the road).
      if (w < 2) {
        positions.push(...under, ...a, ...b);
        const underside = dark.clone().multiplyScalar(1.3);
        colors.push(
          dark.r,
          dark.g,
          dark.b,
          underside.r,
          underside.g,
          underside.b,
          underside.r,
          underside.g,
          underside.b,
        );
      }
    }
    const layer = new BufferGeometry();
    layer.setAttribute("position", new Float32BufferAttribute(positions, 3));
    layer.setAttribute("color", new Float32BufferAttribute(colors, 3));
    parts.push(layer);
  }
  for (const part of parts) {
    part.deleteAttribute("uv");
    part.deleteAttribute("normal");
  }
  const merged = mergeGeometries(parts.map((part) => (part.index ? part.toNonIndexed() : part)));
  merged.computeVertexNormals();
  // Soften normals toward "up and out" so the crown reads as a volume rather than facets.
  const normal = merged.attributes.normal;
  const position = merged.attributes.position;
  for (let i = 0; i < normal.count; i++) {
    const out = new Vector3(position.getX(i), 0, position.getZ(i));
    const len = out.length();
    if (len > 0.3) {
      out.multiplyScalar(1 / len);
      const n = new Vector3(normal.getX(i), normal.getY(i), normal.getZ(i))
        .lerp(out.setY(0.6).normalize(), 0.55)
        .normalize();
      normal.setXYZ(i, n.x, n.y, n.z);
    }
  }
  if (!withCards) return merged;
  merged.setAttribute("uv", new Float32BufferAttribute(new Float32Array(position.count * 2), 2));
  const cardGeometry = new BufferGeometry();
  cardGeometry.setAttribute("position", new Float32BufferAttribute(cards.positions, 3));
  cardGeometry.setAttribute("normal", new Float32BufferAttribute(cards.normals, 3));
  cardGeometry.setAttribute("color", new Float32BufferAttribute(cards.colors, 3));
  cardGeometry.setAttribute("uv", new Float32BufferAttribute(cards.uvs, 2));
  // Group 0: solid core (foliage material), group 1: branch cards (alpha-tested card material).
  return mergeGeometries([merged, cardGeometry], true);
}

/**
 * Branch cards for one whorl: each branch is a shallow V of two textured quads hinged along the twig, which
 * reads as a feathery spray from the side and from above. Branches droop toward the tip like spruce limbs.
 */
function addBranchCards(cards, random, y, radius, t) {
  const count = 8 + Math.floor(random() * 2);
  const twist = random() * Math.PI * 2;
  for (let b = 0; b < count; b++) {
    const angle = twist + (b / count) * Math.PI * 2 + (random() - 0.5) * 0.5;
    const length = radius * (0.95 + random() * 0.3);
    const halfWidth = Math.max(0.4, length * 0.42);
    const droop = (0.25 + random() * 0.35) * length * 0.45;
    const lift = halfWidth * 0.45; // the two wings rise from the twig: a shallow V
    const dirX = Math.cos(angle);
    const dirZ = Math.sin(angle);
    const sideX = -dirZ;
    const sideZ = dirX;
    const root = [dirX * 0.12, y + 0.05, dirZ * 0.12];
    const tip = [dirX * length, y - droop, dirZ * length];
    const at = (point, side, up) => [point[0] + sideX * side, point[1] + up, point[2] + sideZ * side];
    const shadeRoot = 0.5 + t * 0.15;
    const shadeTip = 0.95 + random() * 0.15;
    for (const side of [-1, 1]) {
      const rootEdge = at(root, side * halfWidth * 0.5, lift * 0.5);
      const tipEdge = at(tip, side * halfWidth, lift);
      const v = side < 0 ? 0 : 1;
      // Two triangles: root, tip, tipEdge / root, tipEdge, rootEdge.
      const quad = [
        [root, 0, 0.5, shadeRoot],
        [tip, 1, 0.5, shadeTip],
        [tipEdge, 1, v, shadeTip],
        [root, 0, 0.5, shadeRoot],
        [tipEdge, 1, v, shadeTip],
        [rootEdge, 0, v, shadeRoot],
      ];
      for (const [point, u, vv, shade] of quad) {
        cards.positions.push(point[0], point[1], point[2]);
        // "Up and out" normal: lit like the outside of a crown from any view, no dark backfaces.
        const out = new Vector3(point[0], 0, point[2]);
        const len = out.length() || 1;
        const n = new Vector3(out.x / len, 0.9, out.z / len).normalize();
        cards.normals.push(n.x, n.y, n.z);
        cards.colors.push(shade, shade, shade * 0.95);
        cards.uvs.push(u, vv);
      }
    }
  }
}

/** Distant pine (seen from far away only): three stacked cones, ~20 triangles, coloured like the near ones. */
function farPineGeometry() {
  const positions = [];
  const colors = [];
  const tiers = [
    [1.2, 2.6, 4.6],
    [3.4, 1.9, 4.0],
    [5.6, 1.2, 4.2],
  ];
  const mid = new Color("#1a3420");
  const tip = new Color("#2f4d2c");
  for (const [base, radius, height] of tiers) {
    const segments = 7;
    for (let s = 0; s < segments; s++) {
      const a0 = (s / segments) * Math.PI * 2;
      const a1 = ((s + 1) / segments) * Math.PI * 2;
      positions.push(
        0,
        base + height,
        0,
        Math.cos(a1) * radius,
        base,
        Math.sin(a1) * radius,
        Math.cos(a0) * radius,
        base,
        Math.sin(a0) * radius,
      );
      colors.push(tip.r, tip.g, tip.b, mid.r, mid.g, mid.b, mid.r, mid.g, mid.b);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));
  geometry.setAttribute("color", new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

/** A lumpy boulder: a subdivided icosahedron pushed around by noise, flattened a little. */
function boulderGeometry(seed) {
  const geometry = new IcosahedronGeometry(1, 2);
  const position = geometry.attributes.position;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const n = fbm(x * 1.7 + seed, z * 1.7 + y * 1.3, { seed, octaves: 3 });
    const scale = 0.72 + n * 0.55;
    position.setXYZ(i, x * scale, y * scale * 0.72, z * scale);
  }
  // Fracture planes: clip the lump against a few random planes so it has the flat, broken faces of split
  // rock instead of a pebble-smooth outline.
  const random = createRandom(seed * 7 + 3);
  const vertex = new Vector3();
  for (let cut = 0; cut < 6; cut++) {
    const plane = new Vector3(random() - 0.5, (random() - 0.3) * 0.8, random() - 0.5).normalize();
    const offset = 0.5 + random() * 0.3;
    for (let i = 0; i < position.count; i++) {
      vertex.fromBufferAttribute(position, i);
      const excess = vertex.dot(plane) - offset;
      if (excess > 0) vertex.addScaledVector(plane, -excess);
      position.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
  }
  geometry.deleteAttribute("uv");
  geometry.computeVertexNormals();
  return geometry;
}

const instanceDummy = new Object3D();

/** One InstancedMesh for `list` (entries: x, y, z, yaw, tilts, scales, colour), positioned relative to `origin`. */
function instancedMesh(list, geometry, material, origin, { castShadow = true, name } = {}) {
  const mesh = new InstancedMesh(geometry, material, list.length);
  list.forEach((entry, index) => {
    instanceDummy.position.set(entry.x - origin.x, entry.y - origin.y, entry.z - origin.z);
    instanceDummy.rotation.set(entry.tiltX || 0, entry.yaw || 0, entry.tiltZ || 0);
    instanceDummy.scale.set(entry.sx ?? entry.scale, entry.sy ?? entry.scale, entry.sz ?? entry.scale);
    instanceDummy.updateMatrix();
    mesh.setMatrixAt(index, instanceDummy.matrix);
    if (entry.color) mesh.setColorAt(index, entry.color);
  });
  mesh.computeBoundingSphere();
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  mesh.name = name;
  return mesh;
}

/**
 * Near forest, one LOD per 96 m chunk: branch-card crowns up close, solid crowns in the middle distance and
 * the ~20-triangle cone (one mesh for the whole chunk) far away, which is what most of the forest is from
 * the city, the highway and the road. Only the first two levels cast shadows.
 */
function buildForest(scene, variants, materials, farGeometry) {
  const chunks = new Map();
  variants.forEach((variant, variantIndex) => {
    for (const tree of variant.trees) {
      const key = Math.floor(tree.x / 96) + "," + Math.floor(tree.z / 96);
      if (!chunks.has(key))
        chunks.set(
          key,
          variants.map(() => []),
        );
      chunks.get(key)[variantIndex].push(tree);
    }
  });
  for (const perVariant of chunks.values()) {
    const all = perVariant.flat();
    const center = { x: 0, y: 0, z: 0 };
    for (const tree of all) {
      center.x += tree.x / all.length;
      center.y += tree.y / all.length;
      center.z += tree.z / all.length;
    }
    const detailed = new Group();
    const solid = new Group();
    perVariant.forEach((trees, variantIndex) => {
      if (!trees.length) return;
      const variant = variants[variantIndex];
      detailed.add(
        instancedMesh(trees, variant.geometry, [materials.foliage, materials.cards], center, {
          name: "mountain-pines",
        }),
      );
      solid.add(instancedMesh(trees, variant.simple, materials.foliage, center, { name: "mountain-pines" }));
    });
    const levels = new LOD();
    levels.name = "mountain-pines-lod";
    levels.position.set(center.x, center.y, center.z);
    levels.addLevel(detailed, 0);
    levels.addLevel(solid, 75);
    levels.addLevel(
      instancedMesh(all, farGeometry, materials.foliage, center, {
        castShadow: false,
        name: "mountain-pines",
      }),
      190,
    );
    scene.add(levels);
  }
}

/** Chunked instancing: each area of the map gets its own InstancedMesh so off-screen chunks are culled. */
function chunkedInstances(
  scene,
  entries,
  geometry,
  material,
  { chunkSize = 128, castShadow = true, name } = {},
) {
  const chunks = new Map();
  for (const entry of entries) {
    const key = Math.floor(entry.x / chunkSize) + "," + Math.floor(entry.z / chunkSize);
    if (!chunks.has(key)) chunks.set(key, []);
    chunks.get(key).push(entry);
  }
  const origin = { x: 0, y: 0, z: 0 };
  for (const list of chunks.values()) {
    scene.add(instancedMesh(list, geometry, material, origin, { castShadow, name }));
  }
}

/** Grass blade texture for verge tufts: tapered blades on transparent background (alpha-tested). */
function grassTuftTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  const random = createRandom(808);
  // Blades are drawn in grey levels (R = brightness) and the colour is rebuilt below: a canvas loses the
  // colour of fully transparent texels, which would make mipmapped blade edges fade to black.
  for (let blade = 0; blade < 46; blade++) {
    const baseX = 10 + random() * (size - 20);
    const height = size * (0.45 + random() * 0.5);
    const lean = (random() - 0.5) * 34;
    const width = 2 + random() * 3;
    const level = Math.round(90 + random() * 165);
    context.fillStyle = `rgb(${level},${level},${level})`;
    context.beginPath();
    context.moveTo(baseX - width, size);
    context.quadraticCurveTo(baseX + lean * 0.4, size - height * 0.6, baseX + lean, size - height);
    context.quadraticCurveTo(baseX + lean * 0.4 + width * 0.4, size - height * 0.6, baseX + width, size);
    context.closePath();
    context.fill();
  }
  const pixels = context.getImageData(0, 0, size, size).data;
  const data = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    // Darker toward the base (self-shadowing inside the tuft), lighter dry tips.
    const up = 1 - y / size;
    for (let x = 0; x < size; x++) {
      const source = (y * size + x) * 4;
      const target = ((size - 1 - y) * size + x) * 4; // DataTexture rows go bottom-up
      const level = pixels[source + 3] > 0 ? pixels[source] / 255 : 0.6;
      const light = 0.55 + up * 0.55;
      const dry = Math.max(0, level - 0.8) * 2.5 + up * 0.25;
      data[target] = Math.min(255, (52 + dry * 70) * level * light + 18);
      data[target + 1] = Math.min(255, (78 + dry * 40) * level * light + 22);
      data[target + 2] = Math.min(255, 30 * level * light + 10);
      data[target + 3] = pixels[source + 3];
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.colorSpace = SRGBColorSpace;
  texture.magFilter = LinearFilter;
  texture.minFilter = LinearMipmapLinearFilter;
  texture.generateMipmaps = true;
  texture.needsUpdate = true;
  return texture;
}

/** A tuft: three crossed vertical quads (looks full from every side). */
function grassTuftGeometry() {
  const quads = [0, Math.PI / 3, (2 * Math.PI) / 3].map((angle) => {
    const quad = new PlaneGeometry(1, 0.7);
    quad.translate(0, 0.35, 0);
    quad.rotateY(angle);
    return quad;
  });
  const merged = mergeGeometries(quads);
  // Normals pointing up make the blades shade like the ground they grow from (no dark backfaces).
  const normal = merged.attributes.normal;
  for (let i = 0; i < normal.count; i++) normal.setXYZ(i, 0, 1, 0);
  return merged;
}

/** Grass tufts on the verges and in clearings near the road. */
function buildGrassTufts(world, random) {
  const { scene } = world;
  const tufts = [];
  const normal = new Vector3();
  for (let i = 0; i < 26000 && tufts.length < 9000; i++) {
    const x = NEAR.minX + random() * (NEAR.maxX - NEAR.minX);
    const z = NEAR.minZ + random() * (NEAR.maxZ - NEAR.minZ);
    if (z > -105) continue;
    const road = distanceToRoad(x, z);
    if (road < ROAD_HALF_WIDTH + 2.6 || road > 45) continue;
    terrainNormal(x, z, normal);
    if (normal.y < 0.82) continue;
    if (terrainHeight(x, z) > 120) continue;
    const scale = 0.7 + random() * 0.9;
    const shade = 0.75 + random() * 0.45;
    tufts.push({
      x,
      y: terrainHeight(x, z) - 0.05,
      z,
      yaw: random() * Math.PI,
      scale,
      sy: scale * (0.7 + random() * 0.6),
      color: new Color(shade, shade * (0.95 + random() * 0.1), shade * 0.9),
    });
  }
  const material = new MeshStandardMaterial({
    map: grassTuftTexture(),
    alphaTest: 0.45,
    side: DoubleSide,
    roughness: 0.95,
  });
  // Shade every blade with the ground's (world-up) normal on both faces; the default double-sided flip
  // turns half the blades face-down and leaves them nearly black.
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "#include <normal_fragment_begin>",
      "#include <normal_fragment_begin>\nnormal = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);\nnonPerturbedNormal = normal;",
    );
  };
  material.customProgramCacheKey = () => "drift-fury-grass-tuft";
  chunkedInstances(scene, tufts, grassTuftGeometry(), material, {
    name: "mountain-grass",
    castShadow: false,
    chunkSize: 128,
  });
}

/** Pine forest and boulders over the mountain, thinning out with altitude, slope and near the road. */
export function buildMountainScenery(world) {
  const { scene, addSolid } = world;
  const random = createRandom(90210);
  const normal = new Vector3();

  // Forest: jittered grid, density from large-scale noise (stands and clearings), slope and altitude.
  const variants = [0, 1, 2, 3].map((variant) => ({
    geometry: pineGeometry(createRandom(400 + variant), variant, true),
    simple: pineGeometry(createRandom(400 + variant), variant, false),
    trees: [],
  }));
  const treeLine = (x, z) => 118 + fbm(x / 160, z / 160, { seed: 77, octaves: 3 }) * 60;
  const plant = (minX, maxX, minZ, maxZ, cell, nearArea) => {
    for (let gz = minZ; gz < maxZ; gz += cell) {
      for (let gx = minX; gx < maxX; gx += cell) {
        const x = gx + random() * cell;
        const z = gz + random() * cell;
        if (z > -112) continue;
        const inNear = x >= NEAR.minX && x <= NEAR.maxX && z >= NEAR.minZ && z <= NEAR.maxZ;
        if (inNear !== nearArea) continue;
        const road = distanceToRoad(x, z);
        if (road < ROAD_HALF_WIDTH + 5.5) continue;
        if (Math.hypot(x - SUMMIT.x, z - SUMMIT.z) < SUMMIT.radius + 26) continue; // keep the lookout's view open
        const y = terrainHeight(x, z);
        terrainNormal(x, z, normal);
        const slope = 1 - normal.y;
        const stand = fbm(x / 90, z / 90, { seed: 5, octaves: 3 });
        let density = smoothstep(0.32, 0.6, stand) * (1 - smoothstep(0.32, 0.5, slope));
        density *= 1 - smoothstep(treeLine(x, z) - 25, treeLine(x, z), y);
        density *= smoothstep(-112, -150, z); // the forest starts beyond the city edge
        if (x > 120 && x < 215) density = 0; // keep the highway corridor open
        if (random() > density) continue;
        const scale = 0.65 + random() * 0.75;
        const variant = variants[Math.floor(random() * variants.length)];
        // Tint per tree: some greener, some bluer (spruce), some browner (dry or dying).
        const tint = random();
        const color = new Color().setRGB(0.85 + random() * 0.3, 0.85 + random() * 0.3, 0.8 + random() * 0.3);
        if (tint < 0.12) color.multiply(new Color(1.25, 1.05, 0.7));
        else if (tint < 0.3) color.multiply(new Color(0.85, 0.95, 1.2));
        variant.trees.push({
          x,
          y: y - 0.3,
          z,
          yaw: random() * Math.PI * 2,
          tiltX: (random() - 0.5) * 0.06,
          tiltZ: (random() - 0.5) * 0.06,
          scale,
          sy: scale * (0.9 + random() * 0.25),
          color,
        });
        if (nearArea && road < 60) addSolid(x, z, 0.35 * scale, 0.35 * scale);
      }
    }
  };
  plant(NEAR.minX, NEAR.maxX, NEAR.minZ, NEAR.maxZ, 5.5, true);
  const foliage = createFoliageMaterial();
  const branchCards = createBranchCardMaterial();
  const farPine = farPineGeometry();
  buildForest(scene, variants, { foliage, cards: branchCards }, farPine);
  // Backdrop forest: the same placement rules, a much lighter model and no shadows.
  for (const variant of variants) variant.trees = [];
  plant(-900, 700, -1500, -100, 13, false);
  const distantTrees = variants.flatMap((variant) => variant.trees);
  chunkedInstances(scene, distantTrees, farPine, foliage, {
    name: "mountain-pines-distant",
    castShadow: false,
    chunkSize: 256,
  });

  // Boulders: scattered on slopes and along the verge, partly buried; rock material with moss/snow on top.
  const rockMaterial = createTerrainMaterial({ snowLine: [140, 70], rockBias: 0.55 });
  rockMaterial.color.set("#8a8e84"); // weathered, lichen-dulled granite rather than fresh-cut stone
  const shapes = [0, 1, 2].map((seed) => ({ geometry: boulderGeometry(11 + seed * 17), rocks: [] }));
  for (let i = 0; i < 1400; i++) {
    const x = NEAR.minX + random() * (NEAR.maxX - NEAR.minX);
    const z = NEAR.minZ + random() * (NEAR.maxZ + 20 - NEAR.minZ) - 20;
    if (z > -118) continue;
    const road = distanceToRoad(x, z);
    if (road < ROAD_HALF_WIDTH + 3) continue;
    terrainNormal(x, z, normal);
    const slope = 1 - normal.y;
    const verge = road < 20 ? 0.35 : 0;
    if (random() > Math.max(verge, smoothstep(0.15, 0.45, slope) * 0.8 + 0.08)) continue;
    const size = (0.4 + Math.pow(random(), 2.2) * 3.2) * (road < 16 ? 0.7 : 1);
    const shape = shapes[Math.floor(random() * shapes.length)];
    shape.rocks.push({
      x,
      y: terrainHeight(x, z) - size * 0.25,
      z,
      yaw: random() * Math.PI * 2,
      tiltX: (random() - 0.5) * 0.5,
      tiltZ: (random() - 0.5) * 0.5,
      scale: size,
      sx: size * (0.8 + random() * 0.5),
      sz: size * (0.8 + random() * 0.5),
    });
    if (size > 0.9 && road < 40) addSolid(x, z, size * 0.75, size * 0.75);
  }
  for (const shape of shapes) {
    chunkedInstances(scene, shape.rocks, shape.geometry, rockMaterial, {
      name: "mountain-boulders",
      chunkSize: 256,
    });
  }
  buildGrassTufts(world, random);
}

/** Blinks the summit mast's warning light (called every frame with the session time in seconds). */
export function updateMountain(world, time) {
  if (world.summitBeacon) world.summitBeacon.emissiveIntensity = Math.sin(time * 2.4) > 0.55 ? 5 : 0.15;
}
