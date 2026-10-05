import { MeshStandardMaterial, BoxGeometry, InstancedMesh } from "three";
/** The A9 highway on the east side: lanes, reflector studs, guard rails and the city connectors. */
export function buildHighway(world) {
  const {
    addBox,
    addSolid,
    addYellowLine,
    highwayMaterial,
    poleMetal,
    scene,
    sidewalkMaterial,
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
      emissiveIntensity: 2.2,
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
  const postGeometry = new BoxGeometry(0.12, 0.9, 0.12);
  const railGeometry = new BoxGeometry(0.6, 0.85, 11);
  const guardPosts = new InstancedMesh(postGeometry, poleMetal, 200);
  const guardRails = new InstancedMesh(railGeometry, sidewalkMaterial, 200);
  guardPosts.castShadow = true;
  guardRails.castShadow = true;
  guardRails.receiveShadow = true;
  let guardCount = 0;
  for (let e = -690; e < 160; e += 14) {
    if (Math.abs(e - 70) >= 11 && Math.abs(e + 80) >= 11) {
      for (let t of [-15, 15]) {
        tmpPosition.set(175 + t, 0.45, e);
        tmpRotation.identity();
        tmpScale.set(1, 1, 1);
        tmpMatrix.compose(tmpPosition, tmpRotation, tmpScale);
        guardPosts.setMatrixAt(guardCount, tmpMatrix);
        guardRails.setMatrixAt(guardCount, tmpMatrix);
        addSolid(175 + t, e, 0.3, 5.5);
        guardCount++;
      }
    }
  }
  guardPosts.count = guardCount;
  guardRails.count = guardCount;
  guardPosts.instanceMatrix.needsUpdate = true;
  guardRails.instanceMatrix.needsUpdate = true;
  scene.add(guardPosts);
  scene.add(guardRails);
  addBox(60, 0.12, 18, 147, 0.02, 70, highwayMaterial);
  addBox(60, 0.12, 18, 147, 0.02, -80, highwayMaterial);
}
