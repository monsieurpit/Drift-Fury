// Realistic pedestrians: 3D-scanned people (Renderpeople, CC BY 4.0, see public/models/people/CREDITS.md)
// with motion-captured animation, in place of the people built from simple shapes (crowd.js, still the
// fallback if the models fail to load).
//
// All six scans share one skeleton, so every person walks with Nathan's walk and stands with Sophia's idle
// (each clip adapted to the person's own hip height). The pedestrian AI (pedestrians.js) poses people
// through the same limb "controls" as before (body, head, arms, forearms, thighs, shins: rotations in the
// person's own frame, facing -Z); here they are applied to the matching bones on top of the animation (a
// nod, a gesture, a look around) or, for a body lying in the street, on top of the standing pose.
import { AnimationMixer, Box3, Frustum, Group, Matrix4, Object3D, Quaternion, Sphere, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { clone as cloneSkinned } from "three/addons/utils/SkeletonUtils.js";

const BASE = (import.meta.env?.BASE_URL || "/") + "models/people/";
const PEOPLE = [
  { file: "nathan", female: false },
  { file: "eric", female: false },
  { file: "manuel", female: false },
  { file: "sophia", female: true },
  { file: "carla", female: true },
  { file: "claudia", female: true },
];
const WALK_FROM = "nathan";
const IDLE_FROM = "sophia";
const WALK_SPEED = 1.4; // m/s at which the walk clip plays at its own pace
// The AI's limb controls and the bones they move.
const CONTROL_BONES = {
  body: "spine_01",
  head: "head",
  la: "upperarm_l",
  le: "lowerarm_l",
  ra: "upperarm_r",
  re: "lowerarm_r",
  lh: "upperleg_l",
  lk: "lowerleg_l",
  rh: "upperleg_r",
  rk: "lowerleg_r",
};

/** Bone names without the per-model prefix and the exporter's index suffix ("hip_02" -> "hip"). */
const canonical = (name) => name.replace(/^rp_[a-z]+_(?:animated|rigged)_\d+_[a-z]+_/i, "").replace(/_\d+$/, "");

const types = []; // { file, female, scene, height, clips: { walk, idle } }

/** Loads the people (resolves true when they can be used). */
export async function loadPeopleModels(onProgress) {
  const loader = new GLTFLoader();
  const loaded = new Map();
  let done = 0;
  await Promise.all(
    PEOPLE.map(async (person) => {
      try {
        loaded.set(person.file, await loader.loadAsync(`${BASE}${person.file}.glb`));
      } catch (error) {
        console.warn("Pedestrian model failed to load:", person.file, error);
      }
      onProgress?.(++done / PEOPLE.length);
    }),
  );
  const walkSource = loaded.get(WALK_FROM);
  const idleSource = loaded.get(IDLE_FROM);
  if (!walkSource?.animations.length || !idleSource?.animations.length) return false;
  for (const gltf of loaded.values()) {
    gltf.scene.traverse((object) => {
      if (object.isBone) object.name = canonical(object.name);
    });
  }
  const hipRest = (gltf) => {
    let hip = null;
    gltf.scene.traverse((object) => {
      if (object.isBone && object.name === "hip") hip = object.position.clone();
    });
    return hip;
  };
  for (const person of PEOPLE) {
    const gltf = loaded.get(person.file);
    if (!gltf) continue;
    const target = hipRest(gltf);
    types.push({
      ...person,
      scene: gltf.scene,
      clips: {
        walk: retarget(walkSource.animations[0], hipRest(walkSource), target),
        idle: retarget(idleSource.animations[0], hipRest(idleSource), target),
      },
    });
  }
  return types.length > 0;
}

/**
 * A clip for another person: bone rotations as they are; the hips' movement kept relative to the source's
 * hip height and moved to the target's (so nobody floats or sinks); other translations dropped (they would
 * stretch bones of a different length).
 */
function retarget(clip, sourceHip, targetHip) {
  const result = clip.clone();
  result.tracks = [];
  for (const track of clip.tracks) {
    const dot = track.name.lastIndexOf(".");
    const bone = canonical(track.name.slice(0, dot));
    const property = track.name.slice(dot + 1);
    if (property === "scale") continue;
    if (property === "position" && bone !== "hip") continue;
    const copy = track.clone();
    copy.name = `${bone}.${property}`;
    if (property === "position" && sourceHip && targetHip) {
      const values = copy.values;
      for (let i = 0; i < values.length; i += 3) {
        values[i] += targetHip.x - sourceHip.x;
        values[i + 1] += targetHip.y - sourceHip.y;
        values[i + 2] += targetHip.z - sourceHip.z;
      }
    }
    result.tracks.push(copy);
  }
  return result;
}

const q = new Quaternion();
const viewFrustum = new Frustum();
const viewMatrix = new Matrix4();
const eye = new Vector3();
const near = new Sphere(new Vector3(), 2);
let viewSet = false;
const qControl = new Quaternion();
const qInverse = new Quaternion();

/**
 * The crowd: same interface as crowd.js. `add(random)` makes a person (a rig to place and pose, with the
 * limb controls in userData.L); `update()` applies the controls to the bones (call once per frame, after
 * the AI posed everybody).
 */
export function createSkinnedCrowd(scene, capacity, { onMesh } = {}) {
  const people = [];
  let frame = 0;
  return {
    add(random, file = null) {
      const type = types.find((t) => t.file === file) || types[Math.floor(random() * types.length)];
      const rig = new Group();
      const model = cloneSkinned(type.scene);
      rig.add(model);
      // Face -Z (the direction the toes point is the person's front), feet on the ground, centred.
      model.updateMatrixWorld(true);
      const bones = new Map();
      model.traverse((object) => {
        if (object.isBone) bones.set(object.name, object);
        if (object.isSkinnedMesh) {
          object.frustumCulled = false; // (until its whole-person sphere is set, below)
          object.castShadow = true;
          object.receiveShadow = true;
          onMesh?.(object);
        }
      });
      const foot = bones.get("foot_l")?.getWorldPosition(new Vector3());
      const toe = bones.get("ball_l")?.getWorldPosition(new Vector3());
      if (foot && toe) model.rotation.y += Math.PI - Math.atan2(toe.x - foot.x, toe.z - foot.z);
      model.updateMatrixWorld(true);
      const box = new Box3().setFromObject(model);
      const height = box.max.y - box.min.y;
      const wanted = (type.female ? 1.66 : 1.78) * (0.95 + random() * 0.1);
      model.scale.multiplyScalar(wanted / height);
      model.updateMatrixWorld(true);
      box.setFromObject(model);
      const centre = box.getCenter(new Vector3());
      model.position.x -= centre.x;
      model.position.z -= centre.z;
      model.position.y -= box.min.y;
      model.updateMatrixWorld(true);
      // Every part of the person (body, hair, clothes) is culled with the same sphere around the whole
      // person, wide enough for them lying in the street or flung: no part is ever hidden on its own.
      const personSphere = new Sphere(new Vector3(0, 0.9, 0), 2.4);
      model.traverse((object) => {
        if (!object.isSkinnedMesh) return;
        const toLocal = object.matrixWorld.clone().invert();
        const sphere = personSphere.clone().applyMatrix4(toLocal);
        object.boundingSphere = sphere;
        object.frustumCulled = true;
      });

      // The controls, and for each controlled bone its rest rotation and its parent's rest orientation in
      // the person's frame (to turn a control rotation into a bone rotation).
      const L = {};
      const controlled = [];
      const rigInverse = new Quaternion();
      for (const [control, boneName] of Object.entries(CONTROL_BONES)) {
        L[control] = new Object3D();
        const bone = bones.get(boneName);
        if (!bone) continue;
        const parent = bone.parent.getWorldQuaternion(new Quaternion());
        controlled.push({ control: L[control], bone, parent: rigInverse.clone().multiply(parent) });
      }
      rig.userData = { L, female: type.female, longHair: false };

      const mixer = new AnimationMixer(model);
      const walk = mixer.clipAction(type.clips.walk);
      const idle = mixer.clipAction(type.clips.idle);
      walk.play();
      idle.play();
      walk.time = random() * type.clips.walk.duration;
      idle.time = random() * type.clips.idle.duration;
      let lastX;
      let lastZ;
      let speed = 0;
      let pending = 0; // animation time not played yet (person out of view, or far and on an off frame)
      const slot = people.length;
      // Called by animatePerson (person.js) for a person walking or standing: the animation, by speed.
      rig.userData.animate = (dt, x, z) => {
        if (lastX === undefined || rig.userData.lx === undefined) {
          lastX = x;
          lastZ = z;
          rig.userData.lx = x;
        }
        const measured = dt > 0 ? Math.min(Math.hypot(x - lastX, z - lastZ) / dt, 8) : 0;
        lastX = x;
        lastZ = z;
        speed += (measured - speed) * (1 - Math.exp(-8 * Math.max(dt, 0)));
        const walking = Math.min(1, speed / 0.6);
        walk.setEffectiveWeight(walking);
        idle.setEffectiveWeight(1 - walking);
        walk.setEffectiveTimeScale(Math.max(0.4, speed / WALK_SPEED));
        pending += dt;
        // Out of view: not animated at all (caught up when seen again). Far away: every other frame.
        if (viewSet) {
          near.center.set(x, 0.9, z);
          const distance = Math.hypot(x - eye.x, z - eye.z);
          const skip =
            (distance > 12 && !viewFrustum.intersectsSphere(near)) || (distance > 45 && (frame + slot) % 2 === 1);
          if (skip) {
            entry.skipped = true;
            for (const control of Object.values(L)) control.rotation.set(0, 0, 0);
            rig.userData.animatedFrame = frame;
            return;
          }
        }
        entry.skipped = false;
        mixer.update(pending);
        pending = 0;
        // The AI's controls this frame start from nothing (gestures are set after this).
        for (const control of Object.values(L)) control.rotation.set(0, 0, 0);
        rig.userData.animatedFrame = frame;
      };
      const entry = { rig, mixer, walk, idle, controlled, skipped: false };
      people.push(entry);
      scene.add(rig);
      return rig;
    },
    remove(rig) {
      const index = people.findIndex((person) => person.rig === rig);
      if (index >= 0) people.splice(index, 1);
    },
    /** The camera this frame (people out of its view are not animated). */
    setView(camera) {
      viewMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      viewFrustum.setFromProjectionMatrix(viewMatrix);
      eye.copy(camera.position);
      viewSet = true;
    },
    update() {
      for (const person of people) {
        const { rig, mixer, walk, idle, controlled } = person;
        if (!rig.visible) continue;
        // Not animated this frame: its bones keep last frame's pose (controls included).
        if (person.skipped && rig.userData.animatedFrame === frame) continue;
        if (rig.userData.animatedFrame !== frame) {
          // Not walking or standing this frame (a body): the standing pose, held, under the controls.
          walk.setEffectiveWeight(0);
          idle.setEffectiveWeight(1);
          mixer.update(0);
        }
        for (const { control, bone, parent } of controlled) {
          const r = control.rotation;
          if (r.x === 0 && r.y === 0 && r.z === 0) continue;
          // The control's rotation (in the person's frame) moved into the bone's parent frame.
          qControl.setFromEuler(r);
          qInverse.copy(parent).invert();
          q.copy(qInverse).multiply(qControl).multiply(parent);
          bone.quaternion.premultiply(q);
        }
      }
      frame++;
    },
  };
}
