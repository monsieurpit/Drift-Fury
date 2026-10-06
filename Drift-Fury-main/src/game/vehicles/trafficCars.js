import { Box3, BoxGeometry, CylinderGeometry, Mesh, MeshBasicMaterial, Vector3 } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { batchStaticMeshes } from "../render/staticBatching.js";
import { SHADOW_ONLY_LAYER } from "../render/shadowCache.js";
import { buildCar } from "./carModel.js";
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
export const trafficTemplates = new Map();

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

/** The shared template (built and batched once) of a traffic or police car look. */
export function trafficTemplate(color, shape, police = false) {
  const key = (police ? "police" : "traffic") + "|" + color + "|" + shape;
  let template = trafficTemplates.get(key);
  if (!template) {
    template = buildCar(color, shape, police);
    template.userData = {};
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
