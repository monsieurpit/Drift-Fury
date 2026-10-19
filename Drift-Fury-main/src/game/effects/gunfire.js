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
    /** A shot from the muzzle at `from` to `to` (where the bullet stops). */
    fire(from, to) {
      direction.subVectors(to, from);
      const length = direction.length();
      if (length < 0.01) return;
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
