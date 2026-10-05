import { TRAFFIC_COLORS } from "../simulation/game.js";
import { createTrafficCar, trafficTemplates } from "../vehicles/trafficCars.js";
/* compile every shader the session can need before the first frame, so nothing stalls mid-drive */
export function warmUpSession(renderer, scene, camera, extraColors = []) {
  for (const color of [...TRAFFIC_COLORS, ...extraColors]) {
    createTrafficCar(color, "coupe");
  }
  createTrafficCar("#ffffff", "coupe", true);
  try {
    renderer.compile(scene, camera);
    for (const template of trafficTemplates.values()) {
      renderer.compile(template, camera, scene);
    }
  } catch (error) {}
}
