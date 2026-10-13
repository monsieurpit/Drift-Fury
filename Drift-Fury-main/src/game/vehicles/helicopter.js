// The police helicopter (game.js state.heli): a light twin-engine police helicopter built from simple
// shapes (seen from 40 m up at night, its silhouette, lights and searchlight are what matter), its rotors
// turning, and the searchlight's beam through the misty air.
import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { canvasTexture } from "../render/meshUtils.js";
import { batchStaticMeshes } from "../render/staticBatching.js";

const BEAM_COLOUR = new Color("#dfe9ff");

/** Builds the helicopter and its beam (hidden until there is one). Returns { update(heli, dt, time, light) }. */
export function createHelicopter(scene) {
  const navy = new MeshStandardMaterial({ color: "#16233a", roughness: 0.42, metalness: 0.45 });
  const white = new MeshStandardMaterial({ color: "#d9dde2", roughness: 0.4, metalness: 0.3 });
  const glass = new MeshStandardMaterial({ color: "#0a0e13", roughness: 0.08, metalness: 0.9 });
  const metal = new MeshStandardMaterial({ color: "#2a2d31", roughness: 0.5, metalness: 0.8 });
  const heli = new Group();
  const add = (geometry, material, x, y, z, parent = heli) => {
    const mesh = new Mesh(geometry, material);
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  };
  // Fuselage (faces -Z like the cars), a white belly band, the bubble canopy.
  add(new SphereGeometry(1, 24, 16), navy, 0, 0, 0).scale.set(1.25, 1.2, 2.5);
  add(new SphereGeometry(1, 24, 16), white, 0, -0.32, 0.05).scale.set(1.27, 0.75, 2.45);
  add(new SphereGeometry(1, 20, 14), glass, 0, 0.1, -1.35).scale.set(1.05, 0.95, 1.35);
  // "POLICE" on both sides.
  const lettering = canvasTexture(256, 64, (context, width, height) => {
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#f2f4f6";
    context.font = "bold 46px sans-serif";
    context.textAlign = "center";
    context.fillText("POLICE", width / 2, 48);
  });
  const letters = new MeshStandardMaterial({ map: lettering, transparent: true, roughness: 0.5 });
  for (const side of [-1, 1]) {
    const plate = add(new PlaneGeometry(1.6, 0.4), letters, side * 1.255, 0.25, 0.65);
    plate.rotation.y = side * (Math.PI / 2);
  }
  // Tail boom, fin, horizontal stabiliser.
  const boom = add(new CylinderGeometry(0.16, 0.32, 5.4, 12), navy, 0, 0.25, 4.6);
  boom.rotation.x = Math.PI / 2;
  add(new BoxGeometry(0.08, 1.3, 0.9), navy, 0, 0.85, 7.1).rotation.x = -0.35;
  add(new BoxGeometry(1.9, 0.06, 0.5), navy, 0, 0.3, 6.6);
  // Skids and their struts.
  for (const side of [-1, 1]) {
    const skid = add(new CylinderGeometry(0.05, 0.05, 3.6, 8), metal, side * 1.0, -1.45, -0.1);
    skid.rotation.x = Math.PI / 2;
    for (const z of [-0.9, 0.8]) {
      add(new CylinderGeometry(0.04, 0.04, 0.6, 6), metal, side * 0.85, -1.18, z).rotation.z = side * 0.45;
    }
  }
  // Engine cowling, mast, main rotor (4 blades and a faint blur disc), tail rotor.
  add(new BoxGeometry(1.0, 0.45, 1.6), navy, 0, 1.25, 0.6);
  add(new CylinderGeometry(0.09, 0.12, 0.5, 8), metal, 0, 1.6, 0.2);
  const rotor = new Group();
  rotor.position.set(0, 1.85, 0.2);
  heli.add(rotor);
  for (let k = 0; k < 4; k++) {
    const blade = add(new BoxGeometry(0.28, 0.04, 5.3), metal, 0, 0, 0, rotor);
    blade.name = "rotor blade"; // (moving parts are named: the batching below leaves them separate)
    blade.rotation.y = (k * Math.PI) / 2;
    blade.position.set(Math.sin((k * Math.PI) / 2) * 2.65, 0, Math.cos((k * Math.PI) / 2) * 2.65);
  }
  const disc = add(
    new CircleGeometry(5.4, 40),
    new MeshBasicMaterial({ color: "#3a3f46", transparent: true, opacity: 0.12, depthWrite: false, side: DoubleSide }),
    0,
    1.85,
    0.2,
  );
  disc.rotation.x = -Math.PI / 2;
  disc.name = "rotor disc";
  const tailRotor = new Group();
  tailRotor.position.set(0.12, 0.85, 7.3);
  heli.add(tailRotor);
  for (let k = 0; k < 2; k++) {
    const blade = add(new BoxGeometry(0.03, 1.3, 0.12), metal, 0, 0, 0, tailRotor);
    blade.rotation.x = (k * Math.PI) / 2;
    blade.name = "tail rotor blade";
  }
  // Navigation lights: red port, green starboard, a white strobe and a red beacon on the tail.
  const lamp = (colour, x, y, z) =>
    add(new SphereGeometry(0.07, 8, 6), new MeshBasicMaterial({ color: colour }), x, y, z);
  lamp("#ff2020", -1.3, -0.1, 0);
  lamp("#20ff60", 1.3, -0.1, 0);
  const strobe = lamp("#ffffff", 0, -1.2, 0.3);
  const beacon = lamp("#ff1a1a", 0, 1.45, 7.45);
  strobe.name = "strobe";
  beacon.name = "beacon";
  // The searchlight under the nose.
  const housing = add(new CylinderGeometry(0.16, 0.2, 0.3, 12), metal, 0, -1.0, -1.7);
  const lens = add(new CircleGeometry(0.15, 16), new MeshBasicMaterial({ color: "#ffffff" }), 0, -1.16, -1.7);
  lens.rotation.x = Math.PI / 2;
  housing.name = "searchlight";
  heli.traverse((object) => {
    if (object.isMesh) {
      object.castShadow = false;
      object.receiveShadow = false;
    }
  });
  // The fixed parts in a few draw calls (one per material).
  batchStaticMeshes(heli, new Set(), Infinity);
  heli.visible = false;
  scene.add(heli);

  // The beam: an open cone from the searchlight to the ground, glowing in the mist. Brightest along its
  // axis and near the lamp, soft at its edges (so it reads as light in the air, not a solid cone).
  const beamGeometry = new ConeGeometry(1, 1, 32, 1, true);
  beamGeometry.translate(0, -0.5, 0); // apex at the origin, opening down -Y
  const beamMaterial = new ShaderMaterial({
    uniforms: { colour: { value: BEAM_COLOUR }, strength: { value: 0.16 } },
    vertexShader: /* glsl */ `
      varying vec3 vNormalView;
      varying vec3 vToEye;
      varying float vAlong;
      void main() {
        vAlong = -position.y; // 0 at the lamp, 1 at the ground
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vNormalView = normalize(normalMatrix * normal);
        vToEye = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 colour;
      uniform float strength;
      varying vec3 vNormalView;
      varying vec3 vToEye;
      varying float vAlong;
      void main() {
        float facing = abs(dot(normalize(vNormalView), normalize(vToEye)));
        float glow = facing * facing * strength * (1.15 - 0.75 * vAlong);
        gl_FragColor = vec4(colour * glow, glow);
      }`,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
  });
  const beam = new Mesh(beamGeometry, beamMaterial);
  beam.frustumCulled = false;
  beam.visible = false;
  beam.renderOrder = 3;
  scene.add(beam);

  const from = new Vector3();
  const to = new Vector3();
  const axis = new Vector3();
  const down = new Vector3(0, -1, 0);
  let rotorAngle = 0;

  return {
    object: heli,
    /**
     * Places the helicopter (`state` null: none). `groundAt(x, z)` gives the ground height under the beam.
     * Returns the searchlight's light for the clustered lighting, or null.
     */
    update(state, dt, time, groundAt) {
      heli.visible = beam.visible = !!state;
      if (!state) return null;
      heli.position.set(state.x, state.y, state.z);
      // Nose down when flying forward, banked into turns.
      const speed = Math.hypot(state.vx, state.vz);
      heli.rotation.set(0, state.heading, 0, "YXZ");
      heli.rotation.x = -Math.min(0.22, speed * 0.008);
      rotorAngle += dt * 38;
      rotor.rotation.y = rotorAngle;
      tailRotor.rotation.x = rotorAngle * 2.3;
      strobe.visible = time % 1.1 < 0.08;
      beacon.visible = time % 1.6 < 0.8;
      if (state.leaving) {
        beam.visible = false;
        return null;
      }
      // The beam from the lamp under the nose down to its spot.
      heli.updateMatrixWorld();
      housing.getWorldPosition(from);
      to.set(state.beamX, groundAt(state.beamX, state.beamZ), state.beamZ);
      axis.subVectors(to, from);
      const length = axis.length();
      axis.divideScalar(length || 1);
      const radius = length * 0.11;
      beam.position.copy(from);
      beam.quaternion.setFromUnitVectors(down, axis);
      beam.scale.set(radius, length, radius);
      // The light itself is placed 14 m up the beam (so it only lights the cells around the spot) with
      // the cone of the real beam.
      return {
        x: to.x - axis.x * 14,
        y: to.y - axis.y * 14,
        z: to.z - axis.z * 14,
        direction: [axis.x, axis.y, axis.z],
        cosOuter: Math.cos(Math.atan((radius + 0.8) / 14)),
        cosInner: Math.cos(Math.atan((radius * 0.55) / 14)),
        intensity: 1400,
        range: 24,
        colour: BEAM_COLOUR,
      };
    },
  };
}
