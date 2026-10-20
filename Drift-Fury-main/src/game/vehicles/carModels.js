// Real 3D car models (Sketchfab, CC BY 4.0: see public/models/cars/CREDITS.md) for the city's everyday cars
// and the police cruisers, in place of the cars built from code (carModel.js, still used for the player's
// own cars from the garage, and as the fallback if a model fails to load).
//
// Each model is turned to face -Z like the game's cars, scaled to the length the game's physics uses for
// that body shape (carSpecs.js), centred and set on the ground. Parked and police cars are drawn instanced
// with a white body that each car paints in its own colour (carInstancing.js); a car the player drives
// gets its own copy with its colour, spinning wheels and headlights.
import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  Raycaster,
  SpotLight,
  Vector3,
} from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { CAR_SPECS } from "./carSpecs.js";

const BASE = (import.meta.env?.BASE_URL || "/") + "models/cars/";

/** Which model each body shape uses: file, the turn that makes it face -Z, its length, paint material. */
const MODELS = {
  sedan: { file: "kiri10", yaw: Math.PI / 2, length: CAR_SPECS.sedan.L, paint: /bodymat/i },
  suv: { file: "urban10", yaw: Math.PI / 2, length: CAR_SPECS.suv.L, paint: /bodymat/i },
  hatch: { file: "toyama", yaw: Math.PI, length: CAR_SPECS.hatch.L, paint: /^Body_Paint$/, drop: /^Shadow/ },
  coupe: { file: "carter98", yaw: Math.PI / 2, length: CAR_SPECS.coupe.L, paint: /Carter98_Body/ },
  police: { file: "crownvic_police", yaw: Math.PI, length: 5.05, paint: null, lightBar: ["#3a8eff", "#ff3434"] },
  // Emergency services (RP mode), in their own liveries, with red and white flashing lights.
  ambulance: { file: "shvan92_ambulance", yaw: Math.PI / 2, length: 5.9, paint: null, lightBar: ["#ff3030", "#ffffff"], barAt: -0.42 },
  firetruck: { file: "firetruck", yaw: Math.PI, length: 9.5, paint: null, lightBar: ["#ff3030", "#ffffff"], barAt: -0.34 },
  // The player's cars from the garage.
  porsche: { file: "stinger96", yaw: Math.PI / 2, length: CAR_SPECS.porsche.L, paint: /Boxer96_Body/ },
  muscle: { file: "phoenix71", yaw: Math.PI / 2, length: CAR_SPECS.muscle.L, paint: /bodymat/i },
  super: { file: "saba95", yaw: Math.PI / 2, length: CAR_SPECS.super.L, paint: /bodymat/i },
  hyper: { file: "cheetah84", yaw: Math.PI / 2, length: CAR_SPECS.hyper.L, paint: /bodymat/i },
  // The police job's fleet (RP mode), loaded when the session starts (loadPoliceModels).
  police_sedan: { file: "trinity03_police", yaw: Math.PI / 2, length: CAR_SPECS.sedan.L, paint: null, lightBar: ["#3a8eff", "#ff3434"], fleet: true },
  police_suv: { file: "urban10_police", yaw: Math.PI / 2, length: CAR_SPECS.suv.L, paint: null, lightBar: ["#3a8eff", "#ff3434"], fleet: true },
  police_muscle: { file: "phoenix71_police", yaw: Math.PI / 2, length: CAR_SPECS.muscle.L, paint: null, lightBar: ["#3a8eff", "#ff3434"], fleet: true },
  police_super: { file: "saba95_police", yaw: Math.PI / 2, length: CAR_SPECS.super.L, paint: null, lightBar: ["#3a8eff", "#ff3434"], fleet: true },
};

const loaded = new Map(); // key -> gltf scene

const EMERGENCY = new Set(["ambulance", "firetruck"]);

/**
 * Glass with transmission makes three.js draw the whole opaque scene a second time each frame (into the
 * texture the glass refracts). The one model that has it (the cruiser) has a transmission map of almost
 * zero (its glass is tinted, not see-through), so it looks the same without: plain blended glass.
 */
function withoutTransmission(model) {
  model.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of materials) {
      if (!(material.transmission > 0)) continue;
      material.transmission = 0;
      material.transmissionMap = null;
      material.needsUpdate = true;
    }
  });
  return model;
}

/**
 * Loads the car models (a model that fails to load is left to the cars built from code); the emergency
 * vehicles only when `emergency` (RP mode).
 */
export async function loadCarModels(onProgress, { emergency = false } = {}) {
  const loader = new GLTFLoader();
  const keys = Object.keys(MODELS).filter((key) => (emergency || !EMERGENCY.has(key)) && !MODELS[key].fleet);
  let done = 0;
  await Promise.all(
    keys.map(async (key) => {
      if (loaded.has(key)) return onProgress?.(++done / keys.length);
      try {
        const gltf = await loader.loadAsync(`${BASE}${MODELS[key].file}.glb`);
        loaded.set(key, withoutTransmission(gltf.scene));
      } catch (error) {
        console.warn("Car model failed to load:", key, error);
      }
      onProgress?.(++done / keys.length);
    }),
  );
}

/** The police job's cars (loaded in the background once a session has started; resolves when done). */
export async function loadPoliceModels() {
  const loader = new GLTFLoader();
  await Promise.all(
    Object.keys(MODELS)
      .filter((key) => MODELS[key].fleet && !loaded.has(key))
      .map(async (key) => {
        try {
          loaded.set(key, withoutTransmission((await loader.loadAsync(`${BASE}${MODELS[key].file}.glb`)).scene));
        } catch (error) {
          console.warn("Police car model failed to load:", key, error);
        }
      }),
  );
}

/**
 * The model key for a car: for a police car its own model ("police_suv"...) given as `shape`, or the
 * cruiser ("police"); otherwise its body shape, when there is a model for it.
 */
export function carModelKey(shape, police) {
  const key = police ? (MODELS[shape]?.fleet && loaded.has(shape) ? shape : "police") : shape;
  return loaded.has(key) ? key : null;
}

const paintMaterials = new Map(); // key -> the shared white body paint of the instanced cars

/**
 * A car built from the model `key` (see carModelKey): a Group facing -Z on the ground at its origin.
 * `player`: a car to drive (its own paint in `color`, wheels that spin, headlights); otherwise a template
 * for instanced cars (white paint marked userData.carPaint, painted per car).
 */
export function buildModelCar(key, { player = false, color = "#ffffff" } = {}) {
  const spec = MODELS[key];
  const model = loaded.get(key).clone(true);
  const car = new Group();
  car.add(model);
  model.rotation.y = spec.yaw;
  if (spec.drop) {
    const dropped = [];
    model.traverse((object) => {
      if (object.isMesh && spec.drop.test(object.material?.name || "")) dropped.push(object);
    });
    for (const object of dropped) object.removeFromParent();
  }
  // Scale to the game's length for this shape, centre it and set it on the ground.
  model.updateMatrixWorld(true);
  let box = new Box3().setFromObject(model);
  const size = box.getSize(new Vector3());
  model.scale.setScalar(spec.length / size.z);
  model.updateMatrixWorld(true);
  box = new Box3().setFromObject(model);
  const centre = box.getCenter(new Vector3());
  model.position.set(-centre.x, -box.min.y, -centre.z);
  car.updateMatrixWorld(true);

  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = false; // (instanced cars cast through a shadow proxy, see trafficCars.js)
    object.receiveShadow = true;
    const material = object.material;
    if (spec.paint && spec.paint.test(material.name || "")) {
      if (player) {
        const own = material.clone();
        own.color.set(color);
        own.userData = {};
        object.material = own;
      } else {
        if (!paintMaterials.has(key)) {
          const white = material.clone();
          white.color.set("#ffffff");
          white.userData.carPaint = true;
          paintMaterials.set(key, white);
        }
        object.material = paintMaterials.get(key);
      }
    }
  });

  const length = spec.length;
  const lightBar = spec.lightBar ? addLightBar(car, model, spec.lightBar, (spec.barAt || 0) * length) : [];
  // (A police car the player drives: its light bar halves flash when the player turns the lights on.)
  car.userData = player ? { ...playerParts(car, model, length), lightBar } : {};
  if (player) {
    // The driver's door, cut out of the body and hinged at its front edge (the models' doors are part of
    // the body), and where the driver sits.
    const wheels = car.userData.wheels;
    car.userData.accessDoor = cutDriverDoor(car, model, wheels, !TWO_DOORS.has(key), key);
  }
  car.userData.seat = driverSeat(car, model);
  return car;
}

// Models with only two doors (a longer door, reaching nearer the rear wheel).
const TWO_DOORS = new Set(["porsche", "muscle", "super", "hyper", "coupe", "police_muscle", "police_super"]);

/**
 * Where the driver's hips are, in the car's space (it faces -Z, its left is -x): behind and below the
 * steering wheel, or (no wheel found) by the car's size.
 */
export function driverSeat(car, model) {
  car.updateMatrixWorld(true);
  let wheel = null;
  model.traverse((object) => {
    if (!wheel && object.isMesh && /steering/i.test(object.name || "")) wheel = object;
  });
  const box = new Box3().setFromObject(model);
  if (wheel) {
    const centre = new Box3().setFromObject(wheel).getCenter(new Vector3());
    return new Vector3(centre.x, centre.y - 0.42, centre.z + 0.5);
  }
  const size = box.getSize(new Vector3());
  return new Vector3(box.min.x + size.x * 0.3, box.min.y + 0.48, box.getCenter(new Vector3()).z + size.z * 0.06);
}

/**
 * Cuts the driver's door (on the left) out of the model: the triangles of the body, glass, trim and door
 * card between the front wheel arch and the door's back edge, under the roof line, on the outer part of the
 * left side, are moved into a door hinged at its front edge. Returns the hinge (a Group: turning it about y
 * opens the door), or null when there is nothing to cut. The model's shared geometries are left untouched.
 */
const doubleSided = new Map(); // a body material -> its double-sided copy for doors
const doorCuts = new Map(); // model key -> { hinge position, per mesh (in traversal order): [rest, door] }
function cutDriverDoor(car, model, wheels, fourDoors, key) {
  car.updateMatrixWorld(true);
  const meshes = [];
  model.traverse((object) => {
    if (object.isMesh && !Array.isArray(object.material) && !/light|steering/i.test(object.name || "")) meshes.push(object);
  });
  // (Worked out once per model: the next car of the same model takes the same pieces.)
  let cut = doorCuts.get(key);
  if (!cut) {
    cut = computeDoorCut(car, model, wheels, fourDoors, meshes);
    doorCuts.set(key, cut);
  }
  if (!cut) return null;
  const hinge = new Group();
  hinge.position.copy(cut.hinge);
  car.add(hinge);
  meshes.forEach((mesh, index) => {
    const pieces = cut.pieces[index];
    if (!pieces) return;
    // (Double-sided: open, its inner side is seen, which the body's panels never show.)
    let material = doubleSided.get(mesh.material);
    if (!material) {
      material = mesh.material.side === DoubleSide ? mesh.material : mesh.material.clone();
      material.side = DoubleSide;
      doubleSided.set(mesh.material, material);
    }
    const door = new Mesh(pieces.door, material);
    door.position.copy(hinge.position).negate();
    door.receiveShadow = true;
    door.name = "driver-door";
    hinge.add(door);
    mesh.geometry = pieces.rest;
  });
  return hinge;
}

function computeDoorCut(car, model, wheels, fourDoors, meshes) {
  const box = new Box3().setFromObject(model);
  const front = wheels[0];
  const rear = wheels[2];
  if (!front || !rear) return null;
  const wheelBox = new Box3().setFromObject(front);
  const radius = Math.max(0.25, (wheelBox.max.y - wheelBox.min.y) / 2);
  const zFront = front.position.z;
  const zRear = rear.position.z;
  const start = zFront + radius + 0.1;
  const end = fourDoors ? (zFront + zRear) / 2 + 0.12 : zRear - radius - 0.45;
  if (end - start < 0.6) return null;
  const yMin = front.position.y - radius * 0.45;
  const yMax = box.max.y - 0.1;
  const xMax = box.min.x + 0.4;
  const hinge = new Vector3(box.min.x + 0.15, 0, start);
  const pieces = [];
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  let moved = 0;
  const meshBox = new Box3();
  for (const [index, mesh] of meshes.entries()) {
    // (Nowhere near the door: left as it is.)
    meshBox.setFromObject(mesh);
    if (meshBox.min.x > xMax || meshBox.max.z < start || meshBox.min.z > end || meshBox.max.y < yMin || meshBox.min.y > yMax) continue;
    // The mesh's triangles as plain floats (the models' are quantized), then in the car's space.
    const flat = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
    const all = [];
    for (let i = 0; i + 2 < flat.attributes.position.count; i += 3) all.push(i);
    const base = pick(flat, all);
    const world = base.clone().applyMatrix4(mesh.matrixWorld);
    const position = world.attributes.position;
    const inside = [];
    const outside = [];
    for (let i = 0; i + 2 < position.count; i += 3) {
      a.fromBufferAttribute(position, i);
      b.fromBufferAttribute(position, i + 1);
      c.fromBufferAttribute(position, i + 2);
      const x = (a.x + b.x + c.x) / 3;
      const y = (a.y + b.y + c.y) / 3;
      const z = (a.z + b.z + c.z) / 3;
      (x < xMax && y > yMin && y < yMax && z > start && z < end ? inside : outside).push(i);
    }
    if (!inside.length) continue;
    moved += inside.length;
    // The door's piece in the car's space; what stays, in the mesh's own space.
    pieces[index] = { door: pick(world, inside), rest: pick(base, outside) };
  }
  return moved ? { hinge, pieces } : null;
}

/** A geometry made of the triangles of `geometry` (non-indexed) starting at the vertex indices `starts`. */
function pick(geometry, starts) {
  const result = new BufferGeometry();
  for (const [name, attribute] of Object.entries(geometry.attributes)) {
    const size = attribute.itemSize;
    const array = new Float32Array(starts.length * 3 * size);
    starts.forEach((start, t) => {
      for (let k = 0; k < 3; k++) for (let n = 0; n < size; n++) array[(t * 3 + k) * size + n] = attribute.getComponent(start + k, n);
    });
    result.setAttribute(name, new BufferAttribute(array, size));
  }
  result.computeBoundingSphere();
  return result;
}

/**
 * Flashing halves over the model's roof light bar (at `z` along the car), named for carInstancing's light
 * switching ("blue" and "red", whatever their colours).
 */
function addLightBar(car, model, colours, z = 0) {
  const ray = new Raycaster(new Vector3(0, 20, z), new Vector3(0, -1, 0));
  const hits = ray.intersectObject(model, true);
  const top = hits.length ? hits[0].point.y : 1.6;
  const halves = [];
  for (const [name, x, colour] of [
    ["blue", -0.2, colours[0]],
    ["red", 0.2, colours[1]],
  ]) {
    const half = new Mesh(new BoxGeometry(0.34, 0.09, 0.22), new MeshBasicMaterial({ color: colour }));
    half.position.set(x, top + 0.005, z);
    half.name = name;
    car.add(half);
    halves.push(half);
  }
  return halves;
}

/** For a car the player drives: its four wheels on pivots that can spin, and two low-beam headlights. */
function playerParts(car, model, length) {
  const corners = { FL: [], FR: [], RL: [], RR: [] };
  model.traverse((object) => {
    if (!object.isMesh) return;
    let node = object;
    while (node && node !== model) {
      const match = /wheel[^A-Za-z]*(?:(?:stock|race|lifted|sport)_?)?(FL|FR|RL|RR)/i.exec(node.name || "");
      if (match) {
        corners[match[1].toUpperCase()].push(object);
        return;
      }
      node = node.parent;
    }
  });
  // Brake lights and headlights: each lamp gets its own copy of the lamp material, so it can glow (and
  // break) on its own.
  const brakeLights = [];
  const headlights = [];
  model.traverse((object) => {
    if (!object.isMesh) return;
    const name = (object.name || "").replace(/_UCB_.*$/, ""); // (without the material's name)
    const brake = /brakelight|backlight/i.test(name);
    const head = /headlight/i.test(name) && !/glass|panel/i.test(name);
    if (!brake && !head) return;
    object.material = object.material.clone();
    // (Only the lamp areas of the shared lamp texture glow, gently: the bloom makes the rest.)
    object.material.emissive?.set(brake ? "#ff3020" : "#ffffff");
    object.material.emissiveMap = object.material.map;
    object.material.emissiveIntensity = brake ? 0.6 : 0.45;
    (brake ? brakeLights : headlights).push(object);
  });
  const wheels = [];
  for (const corner of ["FL", "FR", "RL", "RR"]) {
    const meshes = corners[corner];
    if (!meshes.length) continue;
    const box = new Box3();
    for (const mesh of meshes) box.expandByObject(mesh);
    const pivot = new Object3D();
    pivot.position.copy(box.getCenter(new Vector3()));
    car.add(pivot);
    pivot.updateMatrixWorld(true);
    for (const mesh of meshes) pivot.attach(mesh);
    wheels.push(pivot);
  }
  // Low beams like the garage cars' (carModel.js): a source above the lamps, aimed down the road ahead.
  const headlightBeams = [];
  const front = -length / 2;
  for (const side of [-1, 1]) {
    const beam = new SpotLight("#fff0d8", 120, 120, 0.5, 0.8, 1.6);
    beam.position.set(side * 0.65, 0.7 + 4.2, front + 1.6);
    const target = new Object3D();
    target.position.set(side * 2.2, 0, front - 24.4);
    car.add(target);
    beam.target = target;
    car.add(beam);
    headlightBeams.push(beam);
  }
  return {
    wheels: wheels.length === 4 ? wheels : [],
    separateWheels: true,
    brakeLights,
    headlights,
    headlightBeams,
  };
}
