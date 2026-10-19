// Police uniforms for the player on duty (the police job): the scanned person's clothes recoloured (a
// texture per outfit, see public/models/people/CREDITS.md) and the kit built here and fixed to the bones
// that carry it: the cap (or campaign hat, or helmet) on the head, the badge and vest on the chest, the duty
// belt with its holster, radio and cuff case on the hips.
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  CanvasTexture,
  CylinderGeometry,
  Group,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  BoxGeometry,
  SRGBColorSpace,
  TextureLoader,
  Vector3,
  Quaternion,
  Matrix4,
} from "three";

const BASE = (import.meta.env?.BASE_URL || "/") + "models/people/";
/** The outfits: their texture, headwear and extras. */
export const OUTFITS = {
  patrol: { texture: "eric_patrol", head: "cap", cap: "#1a2440", vest: null, badge: true },
  highway: { texture: "eric_patrol", head: "cap", cap: "#e9e9e6", vest: "hivis", badge: true },
  sheriff: { texture: "eric_sheriff", head: "campaign", cap: "#7b5b36", vest: null, badge: true },
  swat: { texture: "eric_swat", head: "helmet", cap: "#17191c", vest: "tactical", badge: false },
};

const textures = new Map(); // file -> Texture (loading or loaded)
const loader = new TextureLoader();
function uniformTexture(file) {
  let texture = textures.get(file);
  if (!texture) {
    texture = loader.load(`${BASE}${file}.webp`);
    // (As glTF textures are: not flipped, in sRGB.)
    texture.flipY = false;
    texture.colorSpace = SRGBColorSpace;
    textures.set(file, texture);
  }
  return texture;
}

let shared = null;
function materials() {
  if (shared) return shared;
  const standard = (color, roughness, metalness = 0, extra = {}) =>
    new MeshStandardMaterial({ color, roughness, metalness, ...extra });
  shared = {
    leather: standard("#0e0f11", 0.45, 0.05),
    gold: standard("#d9b24a", 0.3, 0.95),
    silver: standard("#c9ccd1", 0.25, 0.9),
    visor: standard("#060708", 0.15, 0.2),
    hivis: standard("#c9f23a", 0.65, 0, { emissive: "#3b4a06", emissiveIntensity: 0.35 }),
    reflective: standard("#d9dde0", 0.18, 0.7, { emissive: "#2a2c2e", emissiveIntensity: 0.4 }),
    tactical: standard("#16181b", 0.85, 0),
    radio: standard("#1d1f22", 0.5, 0.2),
  };
  // "POLICE" across the tactical vest.
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  context.fillStyle = "#16181b";
  context.fillRect(0, 0, 256, 64);
  context.fillStyle = "#f2f2f2";
  context.font = "bold 44px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText("POLICE", 128, 34);
  const label = new CanvasTexture(canvas);
  label.colorSpace = SRGBColorSpace;
  shared.label = standard("#ffffff", 0.8, 0, { map: label });
  return shared;
}

const cache = new Map(); // colour -> material
const colourMaterial = (color, roughness = 0.75) => {
  const key = `${color}|${roughness}`;
  if (!cache.has(key)) cache.set(key, new MeshStandardMaterial({ color, roughness, metalness: 0 }));
  return cache.get(key);
};

/** A ring around the body (belt, vest bands): an open cylinder flattened front to back. */
function ring(radius, height, material, depth = 0.78, segments = 18) {
  const mesh = new Mesh(new CylinderGeometry(radius, radius, height, segments, 1, true), material);
  mesh.scale.set(1, 1, depth);
  return mesh;
}

/**
 * One mesh per material for a piece of kit built from parts (fewer draw calls for the same look); the
 * parts' own transforms are baked in, the piece keeps its own.
 */
function merged(piece) {
  piece.updateMatrixWorld(true);
  const inverse = new Matrix4().copy(piece.matrixWorld).invert();
  const groups = new Map();
  piece.traverse((part) => {
    if (!part.isMesh) return;
    const geometry = part.geometry.clone().applyMatrix4(new Matrix4().multiplyMatrices(inverse, part.matrixWorld));
    if (!groups.has(part.material)) groups.set(part.material, []);
    groups.get(part.material).push(geometry);
  });
  const result = new Group();
  result.position.copy(piece.position);
  result.quaternion.copy(piece.quaternion);
  for (const [material, geometries] of groups) {
    result.add(new Mesh(geometries.length > 1 ? mergeGeometries(geometries) : geometries[0], material));
  }
  return result;
}

/** The headwear of `outfit`, built around the top of the head at the origin (front -Z). */
function headwear(outfit, kit) {
  const group = new Group();
  if (outfit.head === "cap") {
    // Peaked cap: crown, black band, flat top, glossy visor, cap badge.
    const crown = new Mesh(new CylinderGeometry(0.128, 0.112, 0.07, 20), colourMaterial(outfit.cap, 0.7));
    crown.position.y = 0.035;
    const top = new Mesh(new CylinderGeometry(0.135, 0.13, 0.016, 20), colourMaterial(outfit.cap, 0.7));
    top.position.y = 0.075;
    const band = new Mesh(new CylinderGeometry(0.116, 0.114, 0.03, 20), kit.leather);
    band.position.y = 0.012;
    const visor = new Mesh(new CylinderGeometry(0.105, 0.105, 0.008, 16, 1, false, Math.PI / 2, Math.PI), kit.visor);
    visor.position.set(0, 0.0, -0.06);
    visor.rotation.x = -0.22;
    const badge = new Mesh(new BoxGeometry(0.03, 0.032, 0.008), kit.gold);
    badge.position.set(0, 0.04, -0.126);
    group.add(crown, top, band, visor, badge);
  } else if (outfit.head === "campaign") {
    // Campaign hat: wide flat brim and a tall crown with a band.
    const brim = new Mesh(new CylinderGeometry(0.205, 0.205, 0.01, 24), colourMaterial(outfit.cap, 0.8));
    brim.position.y = 0.0;
    const crown = new Mesh(new CylinderGeometry(0.085, 0.112, 0.11, 18), colourMaterial(outfit.cap, 0.8));
    crown.position.y = 0.06;
    const band = new Mesh(new CylinderGeometry(0.114, 0.114, 0.018, 18), kit.leather);
    band.position.y = 0.012;
    group.add(brim, crown, band);
  } else if (outfit.head === "helmet") {
    // Ballistic helmet: a dome with a little flare at the back, and goggles on the front.
    const dome = new Mesh(new SphereGeometry(0.14, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.55), colourMaterial(outfit.cap, 0.9));
    dome.scale.set(1, 0.95, 1.08);
    dome.position.y = -0.015;
    const strap = new Mesh(new BoxGeometry(0.2, 0.025, 0.035), kit.leather);
    strap.position.set(0, 0.0, -0.11);
    group.add(dome, strap);
  }
  return group;
}

/**
 * The kit of `outfit` for a person `rig` (a scanned person, skinnedCrowd.js): parts fixed to the head,
 * chest and hip bones. Returns the parts added (for the session to light and track).
 */
function addKit(rig, outfit) {
  const bones = new Map();
  rig.traverse((object) => {
    if (object.isBone) bones.set(object.name, object);
  });
  const head = bones.get("head");
  const headEnd = bones.get("head_end") || head;
  const chest = bones.get("spine_03") || bones.get("spine_02");
  const hip = bones.get("hip");
  if (!head || !chest || !hip) return [];
  const kit = materials();
  rig.updateMatrixWorld(true);
  const rigQuaternion = rig.getWorldQuaternion(new Quaternion());
  const toRig = (bone) => rig.worldToLocal(bone.getWorldPosition(new Vector3()));
  const headAt = toRig(head);
  const topAt = toRig(headEnd);
  const chestAt = toRig(chest);
  const hipAt = toRig(hip);
  const parts = [];
  // Built in the person's own frame (rig-local), then fixed to the bone: it follows the bone from now on.
  const fix = (piece, bone, position, shadow = true) => {
    const object = merged(piece);
    object.position.copy(rig.localToWorld(position.clone()));
    object.quaternion.copy(rigQuaternion).multiply(object.quaternion);
    bone.attach(object);
    object.traverse((part) => {
      if (part.isMesh) {
        // (Small things cast no shadow worth drawing.)
        part.castShadow = shadow;
        part.receiveShadow = true;
        parts.push(part);
      }
    });
  };
  // Headwear: on top of the head (the head's top is a little below the end bone).
  const top = topAt.y > headAt.y + 0.05 ? topAt : headAt.clone().setY(headAt.y + 0.12);
  fix(headwear(outfit, kit), head, new Vector3(headAt.x, top.y - 0.06, headAt.z + 0.005));
  // The chest is 0.09 m below the upper spine bone; its front 0.12 m ahead of it.
  const chestY = chestAt.y - 0.02;
  if (outfit.vest) {
    const vest = new Group();
    const shell = ring(0.2, 0.4, outfit.vest === "hivis" ? kit.hivis : kit.tactical, 0.78);
    vest.add(shell);
    if (outfit.vest === "hivis") {
      for (const y of [-0.08, 0.05]) {
        const band = ring(0.203, 0.03, kit.reflective, 0.785);
        band.position.y = y;
        vest.add(band);
      }
    } else {
      // Plate carrier: thicker front and back plates with "POLICE".
      for (const side of [-1, 1]) {
        const plate = new Mesh(new BoxGeometry(0.3, 0.3, 0.04), kit.tactical);
        plate.position.set(0, 0.02, side * 0.15);
        const label = new Mesh(new BoxGeometry(0.24, 0.062, 0.002), kit.label);
        label.position.set(0, side > 0 ? 0.07 : 0.0, side * 0.171);
        if (side < 0) label.rotation.y = Math.PI;
        vest.add(plate, label);
      }
    }
    fix(vest, chest, new Vector3(chestAt.x, chestY - 0.11, chestAt.z + 0.01));
  }
  if (outfit.badge) {
    // Badge on the left breast (facing -Z, the person's left is -X), name tag on the right.
    const front = new Group();
    const badge = new Mesh(new BoxGeometry(0.05, 0.06, 0.012), kit.gold);
    badge.rotation.x = -0.12;
    badge.position.set(-0.085, 0.01, outfit.vest ? -0.16 : -0.12);
    const tag = new Mesh(new BoxGeometry(0.06, 0.016, 0.006), kit.silver);
    tag.position.set(0.085, -0.02, outfit.vest ? -0.158 : -0.115);
    front.add(badge, tag);
    fix(front, chest, new Vector3(chestAt.x, chestY, chestAt.z), false);
  }
  // Duty belt: the belt, holster (right hip), radio (left hip), cuff case (back).
  const belt = new Group();
  belt.add(ring(0.168, 0.055, kit.leather, 0.74));
  const holster = new Mesh(new BoxGeometry(0.05, 0.16, 0.09), kit.leather);
  holster.position.set(0.175, -0.06, 0.0);
  const grip = new Mesh(new BoxGeometry(0.03, 0.06, 0.04), kit.visor);
  grip.position.set(0.175, 0.04, 0.015);
  const radio = new Mesh(new BoxGeometry(0.045, 0.1, 0.03), kit.radio);
  radio.position.set(-0.17, -0.03, 0.0);
  const cuffs = new Mesh(new BoxGeometry(0.08, 0.05, 0.035), kit.leather);
  cuffs.position.set(0, -0.005, 0.125);
  belt.add(holster, grip, radio, cuffs);
  fix(belt, hip, new Vector3(hipAt.x, hipAt.y + 0.06, hipAt.z));
  return parts;
}

/**
 * Dresses the scanned person `rig` in `outfit` (a key of OUTFITS), or back in their own clothes (null).
 * Returns the kit's meshes added (empty when undressing or for a person built from shapes).
 */
export function dressInUniform(rig, outfitName) {
  // Off with any previous kit.
  for (const part of rig.userData.uniformKit || []) part.removeFromParent();
  rig.userData.uniformKit = [];
  const outfit = outfitName ? OUTFITS[outfitName] : null;
  rig.traverse((object) => {
    if (!object.isSkinnedMesh) return;
    object.userData.ownMaterial ??= object.material;
    if (!outfit) {
      if (object.material !== object.userData.ownMaterial) object.material.dispose();
      object.material = object.userData.ownMaterial;
      return;
    }
    if (object.material !== object.userData.ownMaterial) object.material.dispose();
    const uniform = object.userData.ownMaterial.clone();
    uniform.map = uniformTexture(outfit.texture);
    uniform.needsUpdate = true;
    object.material = uniform;
  });
  if (!outfit) return [];
  // (The kit's groups were added to the bones: remember their top-level objects to take them off again.)
  const parts = addKit(rig, outfit);
  const roots = new Set();
  for (const part of parts) {
    let node = part;
    while (node.parent && !node.parent.isBone) node = node.parent;
    roots.add(node);
  }
  rig.userData.uniformKit = [...roots];
  return parts;
}
