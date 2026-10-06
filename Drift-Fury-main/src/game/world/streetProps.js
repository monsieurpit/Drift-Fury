// Real 3D street props: photo-scanned models (Poly Haven, CC0; the traffic cone CC BY 4.0, see
// public/models/CREDITS.md), simplified for the web. Fire hydrants by the intersections, trash cans along
// the curbs, benches facing the street, planters along the buildings, and the odd pile of garbage bags and
// crates. Each prop is instanced (one draw call per part of the model per area of the city), lit by the
// street lamps like the buildings, casts shadows and is solid to cars.
import { Box3, InstancedMesh, LOD, Matrix4, Object3D, Quaternion, Vector3 } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { createRandom } from "../util/random.js";

const BASE = (import.meta.env?.BASE_URL || "/") + "models/";
export const STREET_PROP_NAMES = [
  "fire_hydrant",
  "metal_trash_can",
  "painted_wooden_bench",
  "planter_box_01",
  "trashbag",
  "plastic_crate_01",
  "wooden_crate_01",
  "traffic_cone",
];
const SIDEWALK_TOP = 0.22;
const CELL = 96; // metres: props are instanced per area so off-screen areas are culled
const DRAW_DISTANCE = 150; // small props are not drawn farther than this (a few pixels at most there)

/**
 * Loads the props' models. Resolves to { name: { parts: [{ geometry, material, matrix }], box } }; a model
 * that fails to load is left out (the city is still complete without it).
 */
export async function loadStreetProps(onProgress) {
  const loader = new GLTFLoader();
  const props = {};
  let loaded = 0;
  await Promise.all(
    STREET_PROP_NAMES.map(async (name) => {
      try {
        const gltf = await loader.loadAsync(`${BASE}${name}.glb`);
        const root = gltf.scene;
        root.updateMatrixWorld(true);
        const parts = [];
        root.traverse((object) => {
          if (!object.isMesh) return;
          parts.push({
            geometry: object.geometry,
            material: object.material,
            matrix: object.matrixWorld.clone(),
          });
        });
        props[name] = { parts, box: new Box3().setFromObject(root) };
      } catch (error) {
        console.warn("Street prop failed to load:", name, error);
      }
      onProgress?.(++loaded / STREET_PROP_NAMES.length);
    }),
  );
  return props;
}

/**
 * Places the props along the city's sidewalks (and a few cones at the highway closure). `solids` is the
 * collision list: props avoid what is already there and add themselves to it.
 */
export function placeStreetProps(scene, props, { roadXs, roadZs, solids, lightByLamps, heightAt }) {
  const random = createRandom(4242);
  const placements = new Map(); // name -> [Matrix4]
  const footprints = [];
  // `gap`: the clear space kept from the other props (none within a pile of garbage bags).
  const blocked = (x, z, radius, gap) =>
    solids.some((s) => Math.abs(x - s.x) < s.w + radius && Math.abs(z - s.z) < s.d + radius) ||
    footprints.some((f) => Math.hypot(x - f.x, z - f.z) < f.r + radius + gap);
  const dummy = new Object3D();
  const size = new Vector3();

  /** Places `name` at (x, z) turned by `yaw`, unless it would overlap something. */
  function place(name, x, z, yaw, { y = SIDEWALK_TOP, solid = true, scale = 1, gap = 1.2 } = {}) {
    const prop = props[name];
    if (!prop) return false;
    prop.box.getSize(size);
    const radius = (Math.max(size.x, size.z) * scale) / 2;
    if (blocked(x, z, radius * 0.9, gap)) return false;
    dummy.position.set(x, y - prop.box.min.y * scale, z);
    dummy.rotation.set(0, yaw, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    if (!placements.has(name)) placements.set(name, []);
    placements.get(name).push(dummy.matrix.clone());
    footprints.push({ x, z, r: radius });
    if (solid) solids.push({ x, z, w: radius * 0.8, d: radius * 0.8 });
    return true;
  }

  // Sidewalks run alongside every road: [centre line, along-axis is z?, from, to]. Along the avenues they stop
  // 9 m short of each intersection; along the streets, where the avenues' sidewalks begin (11.4 m).
  const sidewalks = [];
  for (const x of roadXs) {
    for (let k = 0; k + 1 < roadZs.length; k++)
      sidewalks.push({ centre: x, alongZ: true, from: roadZs[k] + 9, to: roadZs[k + 1] - 9 });
  }
  for (const z of roadZs) {
    for (let k = 0; k + 1 < roadXs.length; k++)
      sidewalks.push({ centre: z, alongZ: false, from: roadXs[k] + 11.4, to: roadXs[k + 1] - 11.4 });
  }
  const pick = (from, to) => from + random() * (to - from);
  for (const walk of sidewalks) {
    for (const side of [-1, 1]) {
      // Position on this sidewalk: `along` the road, `across` metres from the road's centre line.
      const at = (along, across) =>
        walk.alongZ ? [walk.centre + side * across, along] : [along, walk.centre + side * across];
      // Facing the road (the props' fronts look down their local +z).
      const facingRoad = walk.alongZ ? (side > 0 ? -Math.PI / 2 : Math.PI / 2) : side > 0 ? Math.PI : 0;
      const parallel = walk.alongZ ? 0 : Math.PI / 2;
      if (random() < 0.65) {
        const along = random() < 0.5 ? walk.from + 2.2 : walk.to - 2.2;
        const [x, z] = at(along, 9.5);
        place("fire_hydrant", x, z, random() * Math.PI * 2);
      }
      for (let tries = 0; tries < 4 && random() < 0.8; tries++) {
        const [x, z] = at(pick(walk.from + 5, walk.to - 5), 9.55);
        if (place("metal_trash_can", x, z, random() * Math.PI * 2)) break;
      }
      if (random() < 0.45) {
        for (let tries = 0; tries < 4; tries++) {
          const [x, z] = at(pick(walk.from + 4, walk.to - 4), 10.85);
          if (place("painted_wooden_bench", x, z, facingRoad)) break;
        }
      }
      const planters = random() < 0.55 ? 1 + Math.floor(random() * 2) : 0;
      for (let p = 0; p < planters; p++) {
        const [x, z] = at(pick(walk.from + 3, walk.to - 3), 10.95);
        place("planter_box_01", x, z, parallel);
      }
      if (random() < 0.18) {
        // A pile of garbage out for collection: bags and a crate against the building side.
        const along = pick(walk.from + 4, walk.to - 4);
        for (let b = 0; b < 2 + Math.floor(random() * 3); b++) {
          const [x, z] = at(along + (random() - 0.5) * 1.6, 10.9 + (random() - 0.5) * 0.4);
          place("trashbag", x, z, random() * Math.PI * 2, { solid: false, scale: 0.9 + random() * 0.25, gap: 0 });
        }
        const [cx, cz] = at(along + 1.3, 11.0);
        place(random() < 0.5 ? "plastic_crate_01" : "wooden_crate_01", cx, cz, random() * Math.PI, { gap: 0 });
      }
    }
  }
  // Cones in front of the barriers closing the far end of the highway.
  for (let i = 0; i < 7; i++) {
    const x = 175 - 10.5 + i * 3.5;
    const z = -690.5;
    place("traffic_cone", x, z, random() * Math.PI, { y: heightAt(x, z) + 0.12, solid: false, gap: 0, scale: 1.35 });
  }

  // Instanced per prop part and per area of the city, not drawn beyond DRAW_DISTANCE.
  const lit = new Set();
  const matrix = new Matrix4();
  for (const [name, list] of placements) {
    const cells = new Map();
    for (const placement of list) {
      const position = new Vector3().setFromMatrixPosition(placement);
      const key = Math.floor(position.x / CELL) + "," + Math.floor(position.z / CELL);
      if (!cells.has(key)) cells.set(key, []);
      cells.get(key).push(placement);
    }
    for (const cellList of cells.values()) {
      const centre = new Vector3();
      for (const placement of cellList) centre.add(new Vector3().setFromMatrixPosition(placement));
      centre.divideScalar(cellList.length);
      const toCell = new Matrix4().makeTranslation(-centre.x, -centre.y, -centre.z);
      const group = new Object3D();
      for (const part of props[name].parts) {
        if (!lit.has(part.material)) {
          lit.add(part.material);
          lightByLamps?.(part.material);
        }
        const mesh = new InstancedMesh(part.geometry, part.material, cellList.length);
        cellList.forEach((placement, index) => {
          mesh.setMatrixAt(index, matrix.multiplyMatrices(toCell, placement).multiply(part.matrix));
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.computeBoundingSphere();
        group.add(mesh);
      }
      const lod = new LOD();
      lod.name = `prop-${name}`;
      lod.position.copy(centre);
      lod.addLevel(group, 0);
      lod.addLevel(new Object3D(), DRAW_DISTANCE + CELL * 0.6);
      scene.add(lod);
    }
  }
  const counts = {};
  for (const [name, list] of placements) counts[name] = list.length;
  return counts;
}
