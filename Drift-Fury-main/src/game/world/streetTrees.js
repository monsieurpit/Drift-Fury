import {
  MeshStandardMaterial,
  Vector3,
  CylinderGeometry,
  CanvasTexture,
  RepeatWrapping,
  SphereGeometry,
  InstancedMesh,
} from "three";
import { createRandom } from "../util/random.js";
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
    const crowns = new InstancedMesh(new SphereGeometry(1, 14, 12), leafMat, spots.length * CLUMPS.length);
    crowns.castShadow = true;
    crowns.receiveShadow = true;
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
      for (const [ox, oy, oz, rx, ry, rz] of CLUMPS) {
        const clumpScale = treeScale * (0.88 + worldRandom() * 0.24);
        tmpPosition.set(tx + ox * treeScale, ground + height + oy * treeScale, tz + oz * treeScale);
        tmpRotation.setFromAxisAngle(new Vector3(0, 1, 0), (worldRandom() - 0.5) * 0.7);
        tmpScale.set(rx * clumpScale, ry * clumpScale * (0.88 + worldRandom() * 0.24), rz * clumpScale);
        tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
        crowns.setMatrixAt(ci++, tmpMatrix);
      }
      addSolid(tx, tz, 0.3, 0.3);
    });
    trunks.instanceMatrix.needsUpdate = true;
    branches.count = bi;
    branches.instanceMatrix.needsUpdate = true;
    crowns.count = ci;
    crowns.instanceMatrix.needsUpdate = true;
    scene.add(trunks);
    scene.add(branches);
    scene.add(crowns);
  }
}
