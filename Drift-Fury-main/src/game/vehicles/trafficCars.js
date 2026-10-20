import {
  Box3,
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  CylinderGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { batchStaticMeshes } from "../render/staticBatching.js";
import { SHADOW_ONLY_LAYER } from "../render/shadowCache.js";
import { buildCar } from "./carModel.js";
import { buildModelCar, carModelKey, driverSeat } from "./carModels.js";
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
export const trafficTemplates = new Map();

// A braking car's brake lights: bright red over the lamp's own glass (drawn just in front of it).
const brakeGlowMaterial = new MeshBasicMaterial({ color: "#ff1a10", polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
brakeGlowMaterial.color.multiplyScalar(3.2); // (bright enough to bloom a little)

const blinkerGlowMaterial = new MeshBasicMaterial({ color: "#ff9a1c", polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -4 });
blinkerGlowMaterial.color.multiplyScalar(3.4);

/**
 * `mesh`'s triangles on the car's left (x < 0: the car faces -Z) and right, as two geometries in the mesh's
 * own space: [["blinkL", geometry], ["blinkR", geometry]] (a side with none left out).
 */
function splitBySide(mesh) {
  const source = mesh.geometry.index ? mesh.geometry.toNonIndexed() : mesh.geometry;
  const position = source.attributes.position;
  const sides = { blinkL: [], blinkR: [] };
  const point = new Vector3();
  for (let i = 0; i + 2 < position.count; i += 3) {
    let x = 0;
    for (let k = 0; k < 3; k++) x += point.fromBufferAttribute(position, i + k).applyMatrix4(mesh.matrixWorld).x;
    sides[x < 0 ? "blinkL" : "blinkR"].push(i);
  }
  const result = [];
  for (const [name, starts] of Object.entries(sides)) {
    if (!starts.length) continue;
    const geometry = new BufferGeometry();
    for (const [attributeName, attribute] of Object.entries(source.attributes)) {
      const size = attribute.itemSize;
      const array = new Float32Array(starts.length * 3 * size);
      starts.forEach((start, t) => {
        for (let k = 0; k < 3; k++) for (let c = 0; c < size; c++) array[(t * 3 + k) * size + c] = attribute.getComponent(start + k, c);
      });
      geometry.setAttribute(attributeName, new BufferAttribute(array, size));
    }
    result.push([name, geometry]);
  }
  return result;
}

// The drivers of the traffic: clothes and skin.
const driverClothes = new MeshStandardMaterial({ color: "#2b313b", roughness: 0.9 });
const driverSkin = new MeshStandardMaterial({ color: "#b98a6a", roughness: 0.7 });
let driverGeometries = null;
/** A seated driver whose hips are at `seat` (in the car's space, the car facing -Z): two named meshes. */
function driverFigure(seat) {
  if (!driverGeometries) {
    const torso = new BoxGeometry(0.4, 0.52, 0.24).translate(0, 0.3, 0.06);
    const shoulders = new BoxGeometry(0.44, 0.1, 0.22).translate(0, 0.53, 0.05);
    const arms = [-1, 1].map((side) => new BoxGeometry(0.085, 0.085, 0.44).rotateX(0.35).translate(side * 0.19, 0.4, -0.17));
    const thighs = [-1, 1].map((side) => new BoxGeometry(0.15, 0.13, 0.45).translate(side * 0.1, 0.02, -0.2));
    driverGeometries = {
      body: mergeGeometries([torso, shoulders, ...arms, ...thighs].map((geometry) => geometry.toNonIndexed())),
      head: new SphereGeometry(0.105, 12, 9).scale(1, 1.15, 1.05).translate(0, 0.72, 0.03),
    };
  }
  const body = new Mesh(driverGeometries.body, driverClothes);
  body.name = "driver-body";
  const head = new Mesh(driverGeometries.head, driverSkin);
  head.name = "driver-head";
  for (const part of [body, head]) part.position.copy(seat);
  return [body, head];
}

// Drawn only into the shadow map: no colour, no depth in the main pass.
const shadowOnlyMaterial = new MeshBasicMaterial({ colorWrite: false, depthWrite: false });

/**
 * A ~100-triangle stand-in that casts the car's shadow: body, cabin and wheels fitted to its bounding box.
 * The detailed car (tens of thousands of triangles with tyres and trim) then only receives shadows; under
 * soft moonlight the two shadows are indistinguishable, and a street full of traffic stops costing half
 * a million shadow triangles every frame.
 */
function shadowProxy(template) {
  template.updateMatrixWorld(true);
  const box = new Box3().setFromObject(template);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const alongX = size.x > size.z;
  const length = alongX ? size.x : size.z;
  const width = alongX ? size.z : size.x;
  const place = (geometry, along, up) =>
    alongX
      ? geometry.translate(center.x + along, box.min.y + up, center.z)
      : geometry.translate(center.x, box.min.y + up, center.z + along);
  const clearance = size.y * 0.16;
  const bodyHeight = size.y * 0.42;
  const parts = [
    place(
      new BoxGeometry(
        alongX ? length * 0.97 : width * 0.96,
        bodyHeight,
        alongX ? width * 0.96 : length * 0.97,
      ),
      0,
      clearance + bodyHeight / 2,
    ),
    place(
      new BoxGeometry(
        alongX ? length * 0.5 : width * 0.8,
        size.y - clearance - bodyHeight,
        alongX ? width * 0.8 : length * 0.5,
      ),
      -length * 0.05,
      clearance + bodyHeight + (size.y - clearance - bodyHeight) / 2,
    ),
  ];
  const wheelRadius = size.y * 0.24;
  for (const along of [-0.33, 0.33]) {
    for (const side of [-1, 1]) {
      const wheel = new CylinderGeometry(wheelRadius, wheelRadius, width * 0.14, 10);
      wheel.rotateX(Math.PI / 2);
      if (alongX)
        wheel.translate(center.x + along * length, box.min.y + wheelRadius, center.z + side * width * 0.4);
      else {
        wheel.rotateY(Math.PI / 2);
        wheel.translate(center.x + side * width * 0.4, box.min.y + wheelRadius, center.z + along * length);
      }
      parts.push(wheel);
    }
  }
  const geometry = mergeGeometries(parts.map((part) => part.toNonIndexed()));
  // The template's own transform is applied by the parent; geometry here is in the template's frame.
  const inverse = template.matrixWorld.clone().invert();
  geometry.applyMatrix4(inverse);
  const proxy = new Mesh(geometry, shadowOnlyMaterial);
  proxy.name = "car-shadow-proxy";
  proxy.castShadow = true;
  proxy.receiveShadow = false;
  // Only for the shadow map: on its own layer, so the main and ambient-occlusion passes don't spend a
  // draw call on an invisible box (the shadow cache draws this layer, see shadowCache.js).
  proxy.layers.set(SHADOW_ONLY_LAYER);
  return proxy;
}

/**
 * The shared template (built and batched once) of a traffic or police car look. Built in white paint:
 * each car's colour is applied per instance (carInstancing.js), so every colour of a body shape is drawn
 * together. (`color` is kept for the callers' sake; the template does not depend on it.)
 */
// The glowing lamps of the cars in traffic (dimmer by day: setTrafficLamps).
const lampMaterials = new Set();
let lampLevel = 1;
/** The traffic's lamps: 1 at night, less by day. */
export function setTrafficLamps(level) {
  lampLevel = level;
  for (const material of lampMaterials) material.emissiveIntensity = 0.45 * level;
}

export function trafficTemplate(color, shape, police = false, moving = false) {
  const key = (police ? "police" : moving ? "moving" : "traffic") + "|" + shape;
  let template = trafficTemplates.get(key);
  if (!template) {
    // The real 3D model for this shape (carModels.js) when there is one, else the car built from code.
    const modelKey = carModelKey(shape, police);
    template = modelKey ? buildModelCar(modelKey) : buildCar("#ffffff", shape, police);
    // Cars driving in traffic (a look of their own, apart from the parked ones) have their lamps on:
    // the lamp material glows in its own colours (white headlights, red tail lights).
    if (moving) {
      const lit = new Map();
      template.traverse((object) => {
        const material = object.material;
        if (!object.isMesh || !material || !/Lights_and_Glass$/.test(material.name || "")) return;
        if (!lit.has(material)) {
          const glowing = material.clone();
          glowing.emissive?.set("#ffffff");
          glowing.emissiveMap = glowing.map;
          glowing.emissiveIntensity = 0.45 * lampLevel;
          lampMaterials.add(glowing);
          lit.set(material, glowing);
        }
        object.material = lit.get(material);
      });
      // Someone at the wheel: a seated figure (body and arms reaching for the wheel, a head) in the driver's
      // seat, drawn with the car.
      const seat = template.userData.seat || driverSeat(template, template);
      for (const part of driverFigure(seat)) template.add(part);
      // The brake lights' glow, a part shown only while the car brakes (carInstancing.js: "brake").
      const brakeLights = [];
      template.traverse((object) => {
        if (object.isMesh && /Brakelights_UCB/i.test(object.name)) brakeLights.push(object);
      });
      for (const lamp of brakeLights) {
        const glow = new Mesh(lamp.geometry, brakeGlowMaterial);
        glow.name = "brake";
        lamp.add(glow);
      }
      // The turn signals: the model's blinkers (all four corners in one mesh) split into the left and the
      // right side's, each a part shown while that signal is lit ("blinkL", "blinkR").
      template.updateMatrixWorld(true);
      const blinkers = [];
      template.traverse((object) => {
        if (object.isMesh && /blinkers_UCB/i.test(object.name)) blinkers.push(object);
      });
      for (const lamp of blinkers) {
        for (const [name, geometry] of splitBySide(lamp)) {
          const glow = new Mesh(geometry, blinkerGlowMaterial);
          glow.name = name;
          lamp.add(glow);
        }
      }
    }
    template.userData = { police, moving };
    batchStaticMeshes(template, new Set(), Infinity);
    const proxy = shadowProxy(template);
    template.traverse((object) => {
      if (object.isMesh) object.castShadow = false;
    });
    template.add(proxy);
    trafficTemplates.set(key, template);
  }
  return template;
}

export function createTrafficCar(color, shape, police = false) {
  const car = trafficTemplate(color, shape, police).clone();
  car.userData = {
    sharedTemplate: true,
  };
  return car;
}
