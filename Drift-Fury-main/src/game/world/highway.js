import { MeshStandardMaterial, BoxGeometry, InstancedMesh } from "three";
import { splitInstancedMesh } from "../render/meshUtils.js";
import { BARRIER_UNIT_LENGTH, barrierGeometry, barrierMaterial } from "./jerseyBarrier.js";
/** The A9 highway on the east side: lanes, reflector studs, guard rails and the city connectors. */
export function buildHighway(world) {
  const {
    addBox,
    addSolid,
    addYellowLine,
    highwayMaterial,
    scene,
    tmpMatrix,
    tmpPosition,
    tmpRotation,
    tmpScale,
    whitePaint,
  } = world;
  addBox(28, 0.15, 820, 175, 0.025, -290, highwayMaterial);
  for (let e = -680; e < 150; e += 12) {
    addYellowLine(175, e, 0.22, 7, 0.14);
  }
  addBox(0.2, 0.02, 820, 168, 0.14, -290, whitePaint);
  addBox(0.2, 0.02, 820, 182, 0.14, -290, whitePaint);
  const reflectorStuds = new InstancedMesh(
    new BoxGeometry(0.1, 0.04, 0.1),
    new MeshStandardMaterial({
      color: "#ffeecc",
      emissive: "#ffcc66",
      // Tiny: kept below the bloom threshold so they don't blink into flashing blobs in the distance.
      emissiveIntensity: 0.8,
    }),
    200,
  );
  let studCount = 0;
  for (let e = -680; e < 150; e += 6) {
    tmpPosition.set(171.5, 0.16, e);
    tmpRotation.identity();
    tmpScale.set(1, 1, 1);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    reflectorStuds.setMatrixAt(studCount++, tmpMatrix);
  }
  reflectorStuds.count = studCount;
  reflectorStuds.instanceMatrix.needsUpdate = true;
  scene.add(reflectorStuds);
  // Concrete safety barriers along both edges: four precast New Jersey units per 14 m, each with a
  // retroreflective delineator on top, left open where the city connectors join.
  const units = [];
  const delineators = [];
  for (let e = -690; e < 160; e += 14) {
    if (Math.abs(e - 70) >= 11 && Math.abs(e + 80) >= 11) {
      for (let t of [-15, 15]) {
        for (let k = 0; k < 4; k++) {
          const z = e + (k - 1.5) * BARRIER_UNIT_LENGTH;
          units.push([175 + t, z]);
          delineators.push([175 + t, z]);
        }
        addSolid(175 + t, e, 0.3, 6.9);
      }
    }
  }
  const barrierUnits = new InstancedMesh(barrierGeometry(), barrierMaterial(), units.length);
  const reflectors = new InstancedMesh(
    new BoxGeometry(0.05, 0.11, 0.025),
    new MeshStandardMaterial({
      color: "#f4f1e6",
      emissive: "#ffd9a0",
      emissiveIntensity: 0.45,
      roughness: 0.3,
    }),
    delineators.length,
  );
  tmpRotation.identity();
  tmpScale.set(1, 1, 1);
  units.forEach(([x, z], index) => {
    tmpPosition.set(x, 0.1, z);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    barrierUnits.setMatrixAt(index, tmpMatrix);
    tmpPosition.set(x, 0.1 + 0.81 + 0.055, z);
    tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
    reflectors.setMatrixAt(index, tmpMatrix);
  });
  barrierUnits.castShadow = true;
  barrierUnits.receiveShadow = true;
  for (const mesh of [barrierUnits, reflectors]) {
    for (const part of splitInstancedMesh(mesh, 120)) scene.add(part);
  }
  addBox(60, 0.12, 18, 147, 0.02, 70, highwayMaterial);
  addBox(60, 0.12, 18, 147, 0.02, -80, highwayMaterial);
}
