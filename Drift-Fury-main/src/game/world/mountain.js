import { MeshStandardMaterial, CylinderGeometry, ConeGeometry, InstancedMesh } from "three";
import { mountainRoadX, terrainHeight } from "./terrain.js";
/** The winding Kuro mountain road and its climb out of the city. */
export function buildMountainRoad(world) {
  const { addBox, roadMaterial, sidewalkMaterial, yellowPaint } = world;
  for (let e = -155; e > -520; e -= 4) {
    const t = e - 4;
    const n = mountainRoadX(e);
    const i = mountainRoadX(t);
    const o = terrainHeight(n, e);
    const s = Math.hypot(4, i - n) + 1;
    const c = addBox(14, 0.18, s, n, o, e, roadMaterial);
    c.rotation.y = -Math.atan2(i - n, 4);
    if (Math.round(e / 8) % 2 == 0) {
      const t = addBox(0.22, 0.02, 2, n, o + 0.13, e, yellowPaint);
      t.rotation.y = c.rotation.y;
    }
    for (let t of [-1, 1]) {
      const r = addBox(0.3, 0.65, s, n + t * 7.5, o + 0.42, e, sidewalkMaterial);
      r.rotation.y = c.rotation.y;
    }
  }
  addBox(18, 0.1, 36, 0, 0, -130, roadMaterial);
  for (let e = 0; e < 10; e++) {
    const t = -132 - e * 3.4;
    const n = t - 3.4;
    const i = (-25 * e) / 10;
    const a = (-25 * (e + 1)) / 10;
    const o = addBox(15, 0.15, 5.4, (i + a) / 2, terrainHeight(i, t), (t + n) / 2, roadMaterial);
    o.rotation.y = -Math.atan2(a - i, 3.4);
  }
}
/** Rock peaks and pine trees around the mountain road. */
export function buildMountainScenery(world) {
  const { addSolid, scene, tmpMatrix, tmpPosition, tmpRotation, tmpScale, worldRandom } = world;
  const rockMaterial = new MeshStandardMaterial({
    color: "#2c3a36",
    roughness: 0.95,
  });
  const rockPeaks = new InstancedMesh(new ConeGeometry(1, 1, 14), rockMaterial, 60);
  rockPeaks.castShadow = true;
  for (let e = 0; e < 60; e++) {
    const t = -185 - worldRandom() * 350;
    const n = worldRandom() > 0.5 ? 1 : -1;
    const i = 18 + worldRandom() * 55;
    const a = 18 + worldRandom() * 26;
    const r = mountainRoadX(t) + n * Math.max(30 + worldRandom() * 70, a * 1.7 + 12);
    tmpPosition.set(r, terrainHeight(r, t) + i / 2 - 4, t);
    tmpRotation.identity();
    tmpScale.set(a, i, a);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    rockPeaks.setMatrixAt(e, tmpMatrix);
    addSolid(r, t, a * 0.6, a * 0.6);
  }
  rockPeaks.instanceMatrix.needsUpdate = true;
  scene.add(rockPeaks);
  const trunkMaterial = new MeshStandardMaterial({
    color: "#423d34",
    roughness: 0.9,
  });
  const foliageMaterial = new MeshStandardMaterial({
    color: "#1f4736",
    roughness: 0.9,
  });
  const treeTrunks = new InstancedMesh(new CylinderGeometry(0.25, 0.4, 4, 12), trunkMaterial, 120);
  const treeCrowns = [
    new ConeGeometry(2.8, 3.5, 16),
    new ConeGeometry(2.3, 3.5, 16),
    new ConeGeometry(1.8, 3.5, 16),
  ].map((e) => {
    const t = new InstancedMesh(e, foliageMaterial, 120);
    t.castShadow = true;
    return t;
  });
  for (let e = 0; e < 120; e++) {
    const t = -165 - worldRandom() * 360;
    const n = mountainRoadX(t) + (worldRandom() > 0.5 ? 1 : -1) * (12 + worldRandom() * 14);
    const r = terrainHeight(n, t);
    tmpPosition.set(n, r + 2, t);
    tmpRotation.identity();
    tmpScale.set(1, 1, 1);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    treeTrunks.setMatrixAt(e, tmpMatrix);
    for (let i = 0; i < 3; i++) {
      tmpPosition.set(n, r + 4 + i * 2, t);
      tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
      treeCrowns[i].setMatrixAt(e, tmpMatrix);
    }
    addSolid(n, t, 0.6, 0.6);
  }
  treeTrunks.instanceMatrix.needsUpdate = true;
  scene.add(treeTrunks);
  for (let t of treeCrowns) {
    t.instanceMatrix.needsUpdate = true;
    scene.add(t);
  }
}
