import { BoxGeometry, Mesh, CylinderGeometry } from "three";
/** Street light poles along every road (their positions feed the moving point-light pool). */
export function buildStreetLights(world) {
  const {
    addSolid,
    lampGlow,
    lampPositions,
    poleMetal,
    roadXs,
    roadZs,
    scene,
    streetlightXs,
    streetlightZs,
  } = world;
  function addStreetLight(x, z, axis = 0, inward = -1) {
    const footing = new Mesh(new CylinderGeometry(0.19, 0.24, 0.28, 16), poleMetal);
    footing.position.set(x, 0.14, z);
    scene.add(footing);
    addSolid(x, z, 0.3, 0.3);
    const pole = new Mesh(new CylinderGeometry(0.085, 0.12, 7, 12), poleMetal);
    pole.position.set(x, 3.5, z);
    pole.castShadow = true;
    scene.add(pole);
    const alongX = axis === 1;
    const arm = new Mesh(new BoxGeometry(alongX ? 0.09 : 2.2, 0.09, alongX ? 2.2 : 0.09), poleMetal);
    arm.position.set(x + (alongX ? 0 : inward * 1.05), 6.88, z + (alongX ? inward * 1.05 : 0));
    scene.add(arm);
    const fixtureX = x + (alongX ? 0 : inward * 2.05);
    const fixtureZ = z + (alongX ? inward * 2.05 : 0);
    const fixture = new Mesh(new BoxGeometry(0.72, 0.16, 0.48), poleMetal);
    fixture.position.set(fixtureX, 6.82, fixtureZ);
    fixture.castShadow = true;
    scene.add(fixture);
    const diffuser = new Mesh(new BoxGeometry(0.58, 0.025, 0.36), lampGlow);
    diffuser.position.set(fixtureX, 6.72, fixtureZ);
    scene.add(diffuser);
    lampPositions.push({
      x: fixtureX,
      y: 6.68,
      z: fixtureZ,
    });
  }
  for (const x of roadXs) {
    for (const z of streetlightZs) {
      for (const side of [-1, 1]) {
        addStreetLight(x + side * 10.2, z, 0, -side);
      }
    }
  }
  for (const z of roadZs) {
    for (const x of streetlightXs) {
      for (const side of [-1, 1]) {
        addStreetLight(x, z + side * 10.2, 1, -side);
      }
    }
  }
}
