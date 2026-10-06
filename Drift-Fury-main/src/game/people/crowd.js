// The pedestrians' bodies, drawn as a crowd.
//
// A person (person.js) is about thirty meshes: drawn one by one, twenty people would cost six hundred draw
// calls. Here the person is cut into its eleven rigid pieces (torso, head, upper and lower arms and legs,
// and long hair), each merged into one mesh whose vertices know what they are (skin, shirt, trousers,
// shoes, hair or a fixed colour), and each piece is one InstancedMesh holding that piece of everybody.
// Every pedestrian has a small skeleton of empty nodes, posed by the same walk animation as the player
// (animatePerson), and each piece is placed at its node; colours come per person from instance attributes.
import {
  Color,
  CylinderGeometry,
  Group,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  SphereGeometry,
  BufferAttribute,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { createPerson } from "./person.js";

const NODE_NAMES = ["body", "head", "la", "le", "ra", "re", "lh", "lk", "rh", "rk"];
// Material colours in the person model and what they become: 1 skin, 2 shirt, 3 trousers, 4 shoes, 5 hair.
const MARKER_SHIRT = "#ff00ff";
const SLOT_OF = { d9b48f: 1, ff00ff: 2, "262d3a": 3, ececec: 4, "1c1410": 5 };
const SKIP = new Set(["15171c"]); // the cap's peak: not everybody wears a cap

const PALETTES = {
  skin: ["#f1c9a5", "#e0ac84", "#c68863", "#a8704c", "#8a5638", "#5e3a26", "#f6d7bd", "#d9b48f"],
  shirt: [
    "#2b3a55", "#7a1f24", "#d8d4cc", "#1c1d20", "#3f5d3a", "#9a6b2f", "#5b6f8c", "#c9a227",
    "#6d2f6b", "#2f6f73", "#b54a2a", "#8f8f8f", "#e8e4dc", "#3a2a22", "#264a8a", "#a33b5b",
  ],
  pants: ["#1d2433", "#2a2a2c", "#3b4a63", "#4a3f33", "#14161a", "#5a5f66", "#28324a", "#6b5a43"],
  shoes: ["#ececec", "#1a1a1a", "#3b2a1e", "#8a8f96", "#c23b2b", "#20304a"],
  hair: ["#1c1410", "#2e1f15", "#4a3020", "#7a5530", "#a7814e", "#cfc6b8", "#111111", "#5b3a29"],
};

const linearColor = (hex) => new Color(hex);

/** The person model cut into rigid pieces: { name: geometry } plus the rig's node layout. */
function buildPieces() {
  const person = createPerson(MARKER_SHIRT);
  const limbs = person.userData.L;
  const nodes = new Map(NODE_NAMES.map((name) => [limbs[name], name]));
  const parts = new Map();
  const add = (name, geometry) => {
    if (!parts.has(name)) parts.set(name, []);
    parts.get(name).push(geometry);
  };
  person.traverse((object) => {
    if (!object.isMesh) return;
    const node = nodes.get(object.parent);
    if (!node) return;
    const hex = object.material.color.getHexString();
    if (SKIP.has(hex)) return;
    object.updateMatrix();
    const geometry = object.geometry.clone().toNonIndexed();
    geometry.applyMatrix4(object.matrix);
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    const count = geometry.attributes.position.count;
    const slot = SLOT_OF[hex] || 0;
    const colors = new Float32Array(count * 3);
    const fixed = object.material.color; // (linear already)
    for (let i = 0; i < count; i++) {
      colors[i * 3] = slot ? 1 : fixed.r;
      colors[i * 3 + 1] = slot ? 1 : fixed.g;
      colors[i * 3 + 2] = slot ? 1 : fixed.b;
    }
    geometry.setAttribute("color", new BufferAttribute(colors, 3));
    geometry.setAttribute("pedSlot", new BufferAttribute(new Float32Array(count).fill(slot), 1));
    add(node, geometry);
  });
  // Long hair (worn by about half the people): falls behind the head to the shoulders.
  const hair = [];
  const back = new SphereGeometry(0.128, 14, 10);
  back.scale(1.02, 1.0, 1.02);
  back.translate(0, 0.012, 0.022);
  hair.push(back.toNonIndexed());
  const tail = new CylinderGeometry(0.1, 0.075, 0.3, 12, 1, true);
  tail.translate(0, -0.13, 0.07);
  hair.push(tail.toNonIndexed());
  for (const geometry of hair) {
    for (const name of Object.keys(geometry.attributes)) {
      if (name !== "position" && name !== "normal") geometry.deleteAttribute(name);
    }
    const count = geometry.attributes.position.count;
    geometry.setAttribute("color", new BufferAttribute(new Float32Array(count * 3).fill(1), 3));
    geometry.setAttribute("pedSlot", new BufferAttribute(new Float32Array(count).fill(5), 1));
  }
  const pieces = {};
  for (const [name, list] of parts) pieces[name] = mergeGeometries(list);
  pieces.longHair = mergeGeometries(hair);
  return pieces;
}

/** A pedestrian's skeleton: the person's limb nodes, without any mesh. */
function buildRig() {
  const root = new Group();
  const body = new Group();
  root.add(body);
  const head = new Group();
  head.position.set(0, 1.69, 0);
  body.add(head);
  const limbs = { body, head };
  for (const [side, shoulder, elbow] of [
    [-1, "la", "le"],
    [1, "ra", "re"],
  ]) {
    const sh = new Group();
    sh.position.set(side * 0.25, 1.48, 0);
    body.add(sh);
    const el = new Group();
    el.position.y = -0.3;
    sh.add(el);
    limbs[shoulder] = sh;
    limbs[elbow] = el;
  }
  for (const [side, hip, knee] of [
    [-1, "lh", "lk"],
    [1, "rh", "rk"],
  ]) {
    const hp = new Group();
    hp.position.set(side * 0.1, 0.93, 0);
    root.add(hp);
    const kn = new Group();
    kn.position.y = -0.46;
    hp.add(kn);
    limbs[hip] = hp;
    limbs[knee] = kn;
  }
  root.userData.L = limbs;
  return root;
}

const COLOR_ATTRIBUTES = ["pedSkin", "pedShirt", "pedPants", "pedShoes", "pedHair"];

/**
 * The crowd: `capacity` people at most. `add(random)` makes a person (a rig with a random look) to pose
 * and place; `update()` draws everybody (call once per frame after posing).
 */
export function createCrowd(scene, capacity, { onMesh } = {}) {
  const pieces = buildPieces();
  const attributes = Object.fromEntries(
    COLOR_ATTRIBUTES.map((name) => [name, new InstancedBufferAttribute(new Float32Array(capacity * 3), 3)]),
  );
  const material = new MeshStandardMaterial({ vertexColors: true, roughness: 0.82, metalness: 0 });
  material.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
attribute float pedSlot;
${COLOR_ATTRIBUTES.map((name) => `attribute vec3 ${name};`).join("\n")}`,
      )
      .replace(
        "#include <color_vertex>",
        `#include <color_vertex>
if (pedSlot > 0.5) {
  vColor = pedSlot < 1.5 ? pedSkin : pedSlot < 2.5 ? pedShirt : pedSlot < 3.5 ? pedPants : pedSlot < 4.5 ? pedShoes : pedHair;
}`,
      );
  };
  material.customProgramCacheKey = () => "drift-fury-crowd";
  const meshes = {};
  for (const [name, geometry] of Object.entries(pieces)) {
    for (const attribute of COLOR_ATTRIBUTES) geometry.setAttribute(attribute, attributes[attribute]);
    const mesh = new InstancedMesh(geometry, material, capacity);
    mesh.count = 0;
    mesh.frustumCulled = false;
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = "crowd-" + name;
    scene.add(mesh);
    onMesh?.(mesh);
    meshes[name] = mesh;
  }
  const people = [];
  const matrix = new Matrix4();
  const hidden = new Matrix4().makeScale(0, 0, 0);
  const pick = (list, random) => list[Math.floor(random() * list.length)];
  return {
    meshes,
    /** A new person with a random look (random: () => [0, 1)). */
    add(random) {
      const rig = buildRig();
      const female = random() < 0.5;
      rig.userData.female = female;
      rig.userData.longHair = female ? random() < 0.85 : random() < 0.08;
      rig.userData.look = {
        pedSkin: linearColor(pick(PALETTES.skin, random)),
        pedShirt: linearColor(pick(PALETTES.shirt, random)),
        pedPants: linearColor(pick(PALETTES.pants, random)),
        pedShoes: linearColor(pick(PALETTES.shoes, random)),
        pedHair: linearColor(pick(PALETTES.hair, random)),
      };
      const height = (female ? 0.93 : 0.98) + random() * 0.1;
      rig.scale.set(female ? 0.92 * height : height, height, female ? 0.92 * height : height);
      people.push(rig);
      return rig;
    },
    remove(rig) {
      const index = people.indexOf(rig);
      if (index >= 0) people.splice(index, 1);
    },
    update() {
      let index = 0;
      for (const rig of people) {
        if (!rig.visible || index >= capacity) continue;
        rig.updateMatrixWorld(true);
        const limbs = rig.userData.L;
        for (const name of NODE_NAMES) meshes[name]?.setMatrixAt(index, limbs[name].matrixWorld);
        meshes.longHair.setMatrixAt(
          index,
          rig.userData.longHair ? matrix.copy(limbs.head.matrixWorld) : hidden,
        );
        const look = rig.userData.look;
        for (const name of COLOR_ATTRIBUTES) {
          const color = look[name];
          attributes[name].setXYZ(index, color.r, color.g, color.b);
        }
        index++;
      }
      for (const mesh of Object.values(meshes)) {
        mesh.count = index;
        mesh.visible = index > 0;
        mesh.instanceMatrix.needsUpdate = true;
      }
      for (const attribute of Object.values(attributes)) attribute.needsUpdate = true;
    },
  };
}
