import { TRAFFIC_COLORS } from "../simulation/game.js";
import { createTrafficCar, trafficTemplates } from "../vehicles/trafficCars.js";
/**
 * Compiles every shader the session can need before the first frame, so nothing stalls mid-drive: the
 * scene (including effects that have nothing to draw yet, like tyre smoke and skid marks) and every traffic
 * and police car look. Uses parallel shader compilation where the browser supports it.
 */
export async function warmUpSession(renderer, scene, camera, extraColors = []) {
  for (const color of [...TRAFFIC_COLORS, ...extraColors]) {
    createTrafficCar(color, "coupe");
  }
  createTrafficCar("#ffffff", "coupe", true);
  try {
    await renderer.compileAsync(scene, camera);
    for (const template of trafficTemplates.values()) {
      await renderer.compileAsync(template, camera, scene);
    }
  } catch (error) {
    try {
      renderer.compile(scene, camera);
    } catch (fallbackError) {}
  }
}
