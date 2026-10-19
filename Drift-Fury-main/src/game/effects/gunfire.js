// Gunfire: the pistols (in the hand of whoever is aiming), muzzle flashes, bullet tracers and the flash of
// light each shot throws. Everything is pooled and hidden when unused: firing costs a few draw calls for a
// twentieth of a second.
import {
  AdditiveBlending,
  BoxGeometry,
  CanvasTexture,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  SRGBColorSpace,
  Vector3,
} from "three";

const TRACERS = 10;
const FLASHES = 6;
const PISTOLS = 8;
const FLASH_COLOUR = new Color("#ffc27a");

function flashTexture() {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, "rgba(255,255,240,1)");
  gradient.addColorStop(0.25, "rgba(255,210,120,0.9)");
  gradient.addColorStop(0.6, "rgba(255,140,40,0.25)");
  gradient.addColorStop(1, "rgba(255,120,30,0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A compact service pistol: slide, frame and grip, barrel along -Z from the origin (the hand). */
function buildPistol() {
  const steel = new MeshStandardMaterial({ color: "#1a1c1f", roughness: 0.35, metalness: 0.85 });
  const polymer = new MeshStandardMaterial({ color: "#121314", roughness: 0.7, metalness: 0.1 });
  const pistol = new Group();
  const slide = new Mesh(new BoxGeometry(0.03, 0.035, 0.19), steel);
  slide.position.set(0, 0.035, -0.07);
  const frame = new Mesh(new BoxGeometry(0.028, 0.022, 0.15), polymer);
  frame.position.set(0, 0.008, -0.055);
  const grip = new Mesh(new BoxGeometry(0.028, 0.11, 0.045), polymer);
  grip.position.set(0, -0.04, 0.0);
  grip.rotation.x = -0.25;
  for (const part of [slide, frame, grip]) {
    part.castShadow = false;
    pistol.add(part);
  }
  pistol.visible = false;
  return pistol;
}

/** The police job's other weapons: a taser (yellow), a pump shotgun, a carbine; barrel along -Z. */
function buildWeapon(kind) {
  const steel = new MeshStandardMaterial({ color: "#1a1c1f", roughness: 0.35, metalness: 0.85 });
  const polymer = new MeshStandardMaterial({ color: "#121314", roughness: 0.7, metalness: 0.1 });
  const weapon = new Group();
  const add = (geometry, material, x, y, z, tilt = 0) => {
    const part = new Mesh(geometry, material);
    part.position.set(x, y, z);
    part.rotation.x = tilt;
    part.castShadow = false;
    weapon.add(part);
  };
  if (kind === "taser") {
    const yellow = new MeshStandardMaterial({ color: "#e8c21a", roughness: 0.5, metalness: 0.1 });
    add(new BoxGeometry(0.035, 0.045, 0.15), yellow, 0, 0.03, -0.06);
    add(new BoxGeometry(0.03, 0.1, 0.045), polymer, 0, -0.035, 0, -0.25);
  } else {
    // Long guns: held at the hand, the stock back past the shoulder.
    const long = kind === "rifle" ? 0.62 : 0.68;
    add(new BoxGeometry(0.04, 0.05, long * 0.55), steel, 0, 0.04, -long * 0.3);
    add(new BoxGeometry(0.022, 0.022, long * 0.45), steel, 0, 0.055, -long * 0.75);
    add(new BoxGeometry(0.035, 0.07, 0.24), polymer, 0, 0.02, 0.16);
    add(new BoxGeometry(0.03, 0.09, 0.04), polymer, 0, -0.04, 0.0, -0.3);
    if (kind === "rifle") add(new BoxGeometry(0.025, 0.11, 0.05), steel, 0, -0.03, -0.12);
    else add(new BoxGeometry(0.04, 0.035, 0.16), polymer, 0, 0.0, -long * 0.55);
  }
  weapon.visible = false;
  return weapon;
}
const TASER_COLOUR = new Color(0.55, 0.75, 1).multiplyScalar(4);

export function createGunfire(scene) {
  const tracerMaterial = new MeshBasicMaterial({
    color: new Color(1, 0.85, 0.55).multiplyScalar(4),
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: AdditiveBlending,
  });
  const tracerGeometry = new BoxGeometry(0.012, 0.012, 1);
  tracerGeometry.translate(0, 0, -0.5); // from its origin forward along -Z
  const tracers = Array.from({ length: TRACERS }, () => {
    const mesh = new Mesh(tracerGeometry, tracerMaterial);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    scene.add(mesh);
    return { mesh, life: 0 };
  });
  const flashMaterial = new MeshBasicMaterial({
    map: flashTexture(),
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    color: new Color(1, 1, 1).multiplyScalar(3),
  });
  const flashGeometry = new PlaneGeometry(0.45, 0.45);
  const flashes = Array.from({ length: FLASHES }, () => {
    const mesh = new Mesh(flashGeometry, flashMaterial);
    mesh.visible = false;
    mesh.frustumCulled = false;
    mesh.castShadow = false;
    scene.add(mesh);
    return { mesh, life: 0 };
  });
  const pistols = Array.from({ length: PISTOLS }, () => {
    const pistol = buildPistol();
    scene.add(pistol);
    return pistol;
  });
  const others = {};
  for (const kind of ["taser", "shotgun", "rifle"]) {
    others[kind] = buildWeapon(kind);
    scene.add(others[kind]);
  }
  // The taser's wires: a separate thin, blue-white tracer that lingers a little.
  const wireMaterial = new MeshBasicMaterial({ color: TASER_COLOUR, transparent: true, opacity: 0.85, depthWrite: false, blending: AdditiveBlending });
  const wire = { mesh: new Mesh(tracerGeometry, wireMaterial), life: 0 };
  wire.mesh.visible = false;
  wire.mesh.frustumCulled = false;
  scene.add(wire.mesh);
  let tracerCursor = 0;
  let flashCursor = 0;
  let pistolsUsed = 0;
  let lightLife = 0;
  const light = { x: 0, y: 0, z: 0, intensity: 0, range: 10, flags: 0, direction: null, colour: FLASH_COLOUR };
  const direction = new Vector3();

  return {
    /** Shows a pistol in a hand at `hand` pointing at `target` (call each frame for each one aiming). */
    holdPistol(hand, target) {
      if (pistolsUsed >= pistols.length) return;
      const pistol = pistols[pistolsUsed++];
      pistol.visible = true;
      pistol.position.copy(hand);
      pistol.lookAt(target);
      pistol.rotateY(Math.PI); // (lookAt points +Z at the target; the barrel is along -Z)
    },
    /** The player's weapon of the police job (`kind`: taser, shotgun, rifle; the pistol is holdPistol). */
    holdWeapon(kind, hand, target) {
      const weapon = others[kind];
      if (!weapon) return this.holdPistol(hand, target);
      weapon.visible = true;
      weapon.position.copy(hand);
      weapon.lookAt(target);
      weapon.rotateY(Math.PI);
    },
    /** A shot from the muzzle at `from` to `to` (where the bullet stops); `kind` "taser": the wires. */
    fire(from, to, kind = "pistol") {
      direction.subVectors(to, from);
      const length = direction.length();
      if (length < 0.01) return;
      if (kind === "taser") {
        wire.mesh.position.copy(from);
        wire.mesh.lookAt(to);
        wire.mesh.rotateY(Math.PI);
        wire.mesh.scale.set(0.6, 0.6, length);
        wire.mesh.visible = true;
        wire.life = 0.45;
        return;
      }
      const tracer = tracers[tracerCursor++ % TRACERS];
      tracer.mesh.position.copy(from);
      tracer.mesh.lookAt(to);
      tracer.mesh.rotateY(Math.PI);
      tracer.mesh.scale.set(1, 1, length);
      tracer.mesh.visible = true;
      tracer.life = 0.06;
      const flash = flashes[flashCursor++ % FLASHES];
      flash.mesh.position.copy(from);
      flash.mesh.rotation.z = Math.random() * Math.PI;
      flash.mesh.visible = true;
      flash.life = 0.05;
      light.x = from.x;
      light.y = from.y;
      light.z = from.z;
      light.intensity = 30;
      lightLife = 0.06;
    },
    /** Each frame, before placing pistols: ages the effects and turns the flashes to the camera. */
    update(dt, camera) {
      pistolsUsed = 0;
      for (const pistol of pistols) pistol.visible = false;
      for (const weapon of Object.values(others)) weapon.visible = false;
      if (wire.life > 0) {
        wire.life -= dt;
        wire.mesh.visible = wire.life > 0;
      }
      for (const tracer of tracers) {
        if (tracer.life <= 0) continue;
        tracer.life -= dt;
        tracer.mesh.visible = tracer.life > 0;
      }
      for (const flash of flashes) {
        if (flash.life <= 0) continue;
        flash.life -= dt;
        flash.mesh.visible = flash.life > 0;
        flash.mesh.quaternion.copy(camera.quaternion);
      }
      lightLife -= dt;
    },
    /** The light of the last shot, while it lasts (for the clustered lighting), or null. */
    get light() {
      return lightLife > 0 ? light : null;
    },
  };
}
