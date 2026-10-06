import {
  BoxGeometry,
  CatmullRomCurve3,
  CylinderGeometry,
  Mesh,
  SphereGeometry,
  TubeGeometry,
  Vector3,
} from "three";
import { addHalos, addLightCones } from "./lightGlow.js";

/**
 * Street light poles along every road (their positions feed the lamp lighting): a tapered pole on a
 * concrete footing with an anchor-bolt base plate, a curved outreach arm and a modern LED "cobra head"
 * luminaire with a glowing panel underneath, plus a halo and a faint cone of light in the night air.
 */
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
  const footingGeometry = new CylinderGeometry(0.26, 0.3, 0.3, 16);
  const plateGeometry = new BoxGeometry(0.42, 0.04, 0.42);
  const boltGeometry = new CylinderGeometry(0.018, 0.018, 0.07, 6);
  const poleGeometry = new CylinderGeometry(0.065, 0.12, 6.9, 14);
  const headGeometry = new SphereGeometry(1, 20, 10);
  const panelGeometry = new BoxGeometry(0.5, 0.02, 0.24);
  const heads = [];

  function addStreetLight(x, z, axis = 0, inward = -1) {
    const alongX = axis === 1;
    // Direction from the pole toward the road.
    const outX = alongX ? 0 : inward;
    const outZ = alongX ? inward : 0;
    const footing = new Mesh(footingGeometry, poleMetal);
    footing.position.set(x, 0.15, z);
    scene.add(footing);
    const plate = new Mesh(plateGeometry, poleMetal);
    plate.position.set(x, 0.32, z);
    scene.add(plate);
    for (const [bx, bz] of [
      [-0.15, -0.15],
      [0.15, -0.15],
      [-0.15, 0.15],
      [0.15, 0.15],
    ]) {
      const bolt = new Mesh(boltGeometry, poleMetal);
      bolt.position.set(x + bx, 0.37, z + bz);
      scene.add(bolt);
    }
    addSolid(x, z, 0.3, 0.3);
    const pole = new Mesh(poleGeometry, poleMetal);
    pole.position.set(x, 0.34 + 3.45, z);
    pole.castShadow = true;
    scene.add(pole);
    // Outreach arm: rises from the pole top and curves out over the road, ending level at the head.
    const reach = 2.05;
    const curve = new CatmullRomCurve3([
      new Vector3(x, 7.1, z),
      new Vector3(x + outX * 0.25, 7.55, z + outZ * 0.25),
      new Vector3(x + outX * 1.0, 7.65, z + outZ * 1.0),
      new Vector3(x + outX * reach, 7.45, z + outZ * reach),
    ]);
    const arm = new Mesh(new TubeGeometry(curve, 16, 0.045, 8, false), poleMetal);
    arm.castShadow = true;
    scene.add(arm);
    const headX = x + outX * (reach + 0.32);
    const headZ = z + outZ * (reach + 0.32);
    // Cobra head: a flattened, elongated shell along the arm.
    const head = new Mesh(headGeometry, poleMetal);
    head.position.set(headX, 7.42, headZ);
    head.scale.set(alongX ? 0.2 : 0.42, 0.11, alongX ? 0.42 : 0.2);
    head.castShadow = true;
    scene.add(head);
    const panel = new Mesh(panelGeometry, lampGlow);
    panel.position.set(headX, 7.32, headZ);
    if (alongX) panel.rotation.y = Math.PI / 2;
    scene.add(panel);
    heads.push({ x: headX, y: 7.28, z: headZ });
    lampPositions.push({
      x: headX,
      y: 7.28,
      z: headZ,
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
  // Warm LED glow in the humid night air.
  addHalos(scene, heads, { color: "#ffd9a8", size: 2.6, intensity: 0.5 });
  addLightCones(scene, heads, { color: "#ffd9a8", height: 7.2, radius: 3.6, intensity: 0.2 });
}
