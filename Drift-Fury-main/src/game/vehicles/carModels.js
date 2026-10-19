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
};

const loaded = new Map(); // key -> gltf scene

const EMERGENCY = new Set(["ambulance", "firetruck"]);

/**
 * Loads the car models (a model that fails to load is left to the cars built from code); the emergency
 * vehicles only when `emergency` (RP mode).
 */
export async function loadCarModels(onProgress, { emergency = false } = {}) {
  const loader = new GLTFLoader();
  const keys = Object.keys(MODELS).filter((key) => emergency || !EMERGENCY.has(key));
  let done = 0;
  await Promise.all(
    keys.map(async (key) => {
      if (loaded.has(key)) return onProgress?.(++done / keys.length);
      try {
        const gltf = await loader.loadAsync(`${BASE}${MODELS[key].file}.glb`);
        loaded.set(key, gltf.scene);
      } catch (error) {
        console.warn("Car model failed to load:", key, error);
      }
      onProgress?.(++done / keys.length);
    }),
  );
}

/** The model key for a car: "police", or its body shape when there is a model for it. */
export function carModelKey(shape, police) {
  const key = police ? "police" : shape;
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
  if (spec.lightBar) addLightBar(car, model, spec.lightBar, (spec.barAt || 0) * length);
  car.userData = player ? playerParts(car, model, length) : {};
  return car;
}

/**
 * Flashing halves over the model's roof light bar (at `z` along the car), named for carInstancing's light
 * switching ("blue" and "red", whatever their colours).
 */
function addLightBar(car, model, colours, z = 0) {
  const ray = new Raycaster(new Vector3(0, 20, z), new Vector3(0, -1, 0));
  const hits = ray.intersectObject(model, true);
  const top = hits.length ? hits[0].point.y : 1.6;
  for (const [name, x, colour] of [
    ["blue", -0.2, colours[0]],
    ["red", 0.2, colours[1]],
  ]) {
    const half = new Mesh(new BoxGeometry(0.34, 0.09, 0.22), new MeshBasicMaterial({ color: colour }));
    half.position.set(x, top + 0.005, z);
    half.name = name;
    car.add(half);
  }
}

/** For a car the player drives: its four wheels on pivots that can spin, and two low-beam headlights. */
function playerParts(car, model, length) {
  const corners = { FL: [], FR: [], RL: [], RR: [] };
  model.traverse((object) => {
    if (!object.isMesh) return;
    let node = object;
    while (node && node !== model) {
      const match = /wheel[^A-Za-z]*(?:stock_?)?(FL|FR|RL|RR)/i.exec(node.name || "");
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
