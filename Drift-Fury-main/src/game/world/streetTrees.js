import {
  MeshStandardMaterial,
  Vector3,
  CylinderGeometry,
  CanvasTexture,
  RepeatWrapping,
  InstancedMesh,
  IcosahedronGeometry,
  BufferGeometry,
  Float32BufferAttribute,
  Color,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createRandom } from "../util/random.js";
import { createLeafCardMaterial } from "./foliageMaterial.js";
import { splitInstancedMesh } from "../render/meshUtils.js";
/** Trees along the sidewalks, with trunk colliders. */
export function buildStreetTrees(world) {
  const {
    addSolid,
    roadXs,
    roadZs,
    scene,
    streetlightZs,
    tmpMatrix,
    tmpPosition,
    tmpRotation,
    tmpScale,
    worldRandom,
  } = world;
  {
    /* ===== DRIFT FURY: street trees v1 (sidewalk only, with trunk colliders) ===== */
    const fc = document.createElement("canvas");
    fc.width = 256;
    fc.height = 256;
    const fg = fc.getContext("2d");
    const frnd = createRandom(5150);
    fg.fillStyle = "#2c5a2a";
    fg.fillRect(0, 0, 256, 256);
    const greens = ["#3f7a35", "#2a5a28", "#4f8a3c", "#1f4a22", "#5f9645", "#35692f"];
    for (let q = 0; q < 2600; q++) {
      fg.fillStyle = greens[Math.floor(frnd() * greens.length)];
      fg.save();
      fg.translate(frnd() * 256, frnd() * 256);
      fg.rotate(frnd() * 6.283);
      fg.beginPath();
      fg.ellipse(0, 0, 2.2 + frnd() * 3.2, 1.1 + frnd() * 1.5, 0, 0, 6.283);
      fg.fill();
      fg.restore();
    }
    for (let q = 0; q < 700; q++) {
      fg.fillStyle = `rgba(8,22,10,${0.25 + frnd() * 0.3})`;
      fg.fillRect(frnd() * 256, frnd() * 256, 3, 3);
    }
    const leafTex = new CanvasTexture(fc);
    leafTex.wrapS = RepeatWrapping;
    leafTex.wrapT = RepeatWrapping;
    leafTex.colorSpace = "srgb";
    leafTex.anisotropy = 8;
    leafTex.repeat.set(2, 2);
    const leafMat = new MeshStandardMaterial({
      map: leafTex,
      bumpMap: leafTex,
      bumpScale: 1.2,
      roughness: 0.92,
      metalness: 0,
      vertexColors: true, // the crown core is shaded darker than the leaf cards around it
    });
    const barkCanvas = document.createElement("canvas");
    barkCanvas.width = 128;
    barkCanvas.height = 256;
    const barkCtx = barkCanvas.getContext("2d");
    const barkRnd = createRandom(9271);
    const barkGradient = barkCtx.createLinearGradient(0, 0, 128, 0);
    barkGradient.addColorStop(0, "#30271f");
    barkGradient.addColorStop(0.24, "#66503a");
    barkGradient.addColorStop(0.52, "#493829");
    barkGradient.addColorStop(0.78, "#71563c");
    barkGradient.addColorStop(1, "#30271f");
    barkCtx.fillStyle = barkGradient;
    barkCtx.fillRect(0, 0, 128, 256);
    for (let line = 0; line < 70; line++) {
      const x = barkRnd() * 128;
      const shade = Math.floor(barkRnd() * 45);
      barkCtx.strokeStyle =
        line % 3
          ? `rgba(22,15,10,${0.12 + barkRnd() * 0.34})`
          : `rgba(190,151,105,${0.08 + barkRnd() * 0.2})`;
      barkCtx.lineWidth = 0.5 + barkRnd() * 2;
      barkCtx.beginPath();
      barkCtx.moveTo(x, 0);
      barkCtx.bezierCurveTo(
        x + (barkRnd() - 0.5) * 18,
        84,
        x + (barkRnd() - 0.5) * 18,
        172,
        x + (barkRnd() - 0.5) * 12,
        256,
      );
      barkCtx.stroke();
      if (line < 7) {
        barkCtx.fillStyle = `rgba(${shade},${shade * 0.78},${shade * 0.55},.08)`;
        barkCtx.fillRect(x, 0, 1 + barkRnd() * 4, 256);
      }
    }
    const barkTex = new CanvasTexture(barkCanvas);
    barkTex.wrapS = RepeatWrapping;
    barkTex.wrapT = RepeatWrapping;
    barkTex.colorSpace = "srgb";
    barkTex.anisotropy = 8;
    const barkMat = new MeshStandardMaterial({
      map: barkTex,
      bumpMap: barkTex,
      bumpScale: 0.12,
      roughness: 0.96,
      color: "#b6a18a",
    });
    const spots = [];
    for (const ax of roadXs) {
      for (const side of [-1, 1]) {
        for (let tz = roadZs[0] - 4; tz <= roadZs[roadZs.length - 1] + 4; tz += 12) {
          if (roadZs.some((sz) => Math.abs(tz - sz) < 14.5)) {
            continue;
          }
          if (streetlightZs.some((pz) => Math.abs(tz - pz) < 4.5)) {
            continue;
          }
          spots.push([ax + side * 10.2, tz, 0.88 + worldRandom() * 0.28]);
        }
      }
    }
    const CLUMPS = [
      [0, -0.12, 0, 1.2, 0.98, 1.12],
      [0, 0.72, 0, 1.22, 1.02, 1.14],
      [0.78, 0.32, 0.12, 0.94, 0.84, 0.9],
      [-0.76, 0.38, -0.14, 0.98, 0.88, 0.92],
      [0.16, 0.52, 0.76, 0.9, 0.82, 0.94],
      [-0.2, 0.28, -0.76, 0.94, 0.8, 0.9],
      [0.12, 1.35, 0.08, 0.84, 0.8, 0.86],
      [-0.34, -0.08, 0.36, 0.72, 0.7, 0.78],
    ];
    const trunkHeight = (scale) => 4.85 * scale;
    const trunks = new InstancedMesh(new CylinderGeometry(0.13, 0.24, 1, 12), barkMat, spots.length);
    const branches = new InstancedMesh(new CylinderGeometry(0.055, 0.095, 1, 8), barkMat, spots.length * 4);
    trunks.castShadow = true;
    branches.castShadow = true;
    // One crown per tree: a darker leafy core (the shaded inside of the canopy) wrapped in leaf-cluster
    // cards, whose ragged alpha edges give the irregular silhouette of a real broadleaf canopy.
    const crowns = new InstancedMesh(
      crownGeometry(CLUMPS),
      [leafMat, createLeafCardMaterial()],
      spots.length,
    );
    crowns.castShadow = true;
    crowns.receiveShadow = true;
    const crownColor = new Color();
    let crownIndex = 0;
    let ci = 0;
    let bi = 0;
    spots.forEach(([tx, tz, treeScale], ti) => {
      const ground = 0.22;
      const height = trunkHeight(treeScale);
      tmpPosition.set(tx, ground + height / 2, tz);
      tmpRotation.identity();
      tmpScale.set(
        treeScale * (0.9 + worldRandom() * 0.18),
        height,
        treeScale * (0.9 + worldRandom() * 0.18),
      );
      tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
      trunks.setMatrixAt(ti, tmpMatrix);
      for (let branch = 0; branch < 4; branch++) {
        const angle = (branch * Math.PI) / 2 + (worldRandom() - 0.5) * 0.42;
        const length = treeScale * (1.45 + worldRandom() * 0.35);
        const direction = new Vector3(
          Math.cos(angle) * 0.82,
          0.52 + worldRandom() * 0.16,
          Math.sin(angle) * 0.82,
        );
        direction.normalize();
        tmpRotation.setFromUnitVectors(new Vector3(0, 1, 0), direction);
        tmpPosition.set(
          tx + direction.x * length * 0.48,
          ground + height * (0.62 + (branch % 2) * 0.1),
          tz + direction.z * length * 0.48,
        );
        tmpScale.set(1, length, 1);
        tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
        branches.setMatrixAt(bi++, tmpMatrix);
      }
      // The world's shared random sequence must advance exactly as it did when each of the eight clumps
      // drew three values, so everything built after the trees stays where it was.
      const draws = [];
      for (let k = 0; k < CLUMPS.length * 3; k++) draws.push(worldRandom());
      const crownScale = treeScale * (1.05 + draws[0] * 0.28);
      tmpPosition.set(tx, ground + height, tz);
      tmpRotation.setFromAxisAngle(new Vector3(0, 1, 0), draws[1] * Math.PI * 2);
      tmpScale.set(crownScale, crownScale * (0.9 + draws[2] * 0.2), crownScale * (0.92 + draws[3] * 0.16));
      tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
      crowns.setMatrixAt(crownIndex, tmpMatrix);
      crownColor.setRGB(0.88 + draws[4] * 0.24, 0.9 + draws[5] * 0.2, 0.82 + draws[6] * 0.2);
      crowns.setColorAt(crownIndex++, crownColor);
      ci += CLUMPS.length;
      addSolid(tx, tz, 0.3, 0.3);
    });
    trunks.instanceMatrix.needsUpdate = true;
    branches.count = bi;
    branches.instanceMatrix.needsUpdate = true;
    crowns.count = crownIndex;
    crowns.instanceMatrix.needsUpdate = true;
    // One mesh per block-sized cell, so trees off-screen or outside the shadow camera are skipped.
    for (const mesh of [trunks, branches, crowns]) {
      for (const part of splitInstancedMesh(mesh, 60)) scene.add(part);
    }
  }
}

/**
 * Crown geometry around the trunk top (origin): group 0 is a core of low-poly blobs at the main clump
 * positions, darker than the outside; group 1 is ~90 leaf-cluster cards on the canopy surface, facing
 * outward with random roll, normals pointing up and out so both faces light like the outside of a crown.
 */
function crownGeometry(clumps) {
  const random = createRandom(4401);
  const cores = clumps.slice(0, 5).map(([ox, oy, oz, rx, ry, rz]) => {
    const blob = new IcosahedronGeometry(0.78, 1);
    blob.scale(rx, ry, rz);
    blob.translate(ox, oy, oz);
    return blob;
  });
  const core = mergeGeometries(cores.map((blob) => blob.toNonIndexed()));
  const coreCount = core.attributes.position.count;
  core.setAttribute("color", new Float32BufferAttribute(new Float32Array(coreCount * 3).fill(0.55), 3));

  const positions = [];
  const normals = [];
  const colors = [];
  const uvs = [];
  const direction = new Vector3();
  const side = new Vector3();
  const up = new Vector3();
  const normal = new Vector3();
  for (let c = 0; c < 90; c++) {
    const [ox, oy, oz, rx, ry, rz] = clumps[Math.floor(random() * clumps.length)];
    direction.set(random() - 0.5, random() - 0.45, random() - 0.5).normalize();
    const center = new Vector3(
      ox + direction.x * rx * 0.85,
      oy + direction.y * ry * 0.85,
      oz + direction.z * rz * 0.85,
    );
    const size = 0.75 + random() * 0.45;
    // Card plane facing outward, rolled randomly about the outward direction.
    side.set(-direction.z, 0, direction.x);
    if (side.lengthSq() < 1e-4) side.set(1, 0, 0);
    side.normalize().applyAxisAngle(direction, random() * Math.PI * 2);
    up.crossVectors(direction, side).normalize();
    normal
      .set(center.x, 0, center.z)
      .normalize()
      .multiplyScalar(0.8)
      .add(direction)
      .add(new Vector3(0, 0.6, 0))
      .normalize();
    const shade = 0.8 + (center.y + 1) * 0.12 + random() * 0.15;
    const corner = (u, v) => {
      positions.push(
        center.x + (side.x * (u - 0.5) + up.x * (v - 0.5)) * size * 2,
        center.y + (side.y * (u - 0.5) + up.y * (v - 0.5)) * size * 2,
        center.z + (side.z * (u - 0.5) + up.z * (v - 0.5)) * size * 2,
      );
      normals.push(normal.x, normal.y, normal.z);
      colors.push(shade, shade, shade);
      uvs.push(u, v);
    };
    corner(0, 0);
    corner(1, 0);
    corner(1, 1);
    corner(0, 0);
    corner(1, 1);
    corner(0, 1);
  }
  const cards = new BufferGeometry();
  cards.setAttribute("position", new Float32BufferAttribute(positions, 3));
  cards.setAttribute("normal", new Float32BufferAttribute(normals, 3));
  cards.setAttribute("color", new Float32BufferAttribute(colors, 3));
  cards.setAttribute("uv", new Float32BufferAttribute(uvs, 2));
  return mergeGeometries([core, cards], true);
}
