import { batchStaticMeshes } from "../render/staticBatching.js";
import { buildCar } from "./carModel.js";
/* traffic and police cars never animate their parts, so each look is built and batched once, then cloned */
export const trafficTemplates = new Map();
export function createTrafficCar(color, shape, police = false) {
  const key = (police ? "police" : "traffic") + "|" + color + "|" + shape;
  let template = trafficTemplates.get(key);
  if (!template) {
    template = buildCar(color, shape, police);
    template.userData = {};
    batchStaticMeshes(template, new Set(), Infinity);
    trafficTemplates.set(key, template);
  }
  const car = template.clone();
  car.userData = {
    sharedTemplate: true,
  };
  return car;
}
/* compile every shader the session can need before the first frame, so nothing stalls mid-drive */
