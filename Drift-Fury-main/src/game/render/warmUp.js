import { TRAFFIC_COLORS } from "../simulation/game.js";
import { trafficTemplate, trafficTemplates } from "../vehicles/trafficCars.js";
/**
 * Compiles every shader the session can need before the first frame, so nothing stalls mid-drive: the
 * scene (including effects that have nothing to draw yet, like tyre smoke and skid marks) and every traffic
 * and police car look (instanced). Uses parallel shader compilation where the browser supports it.
 */
export async function warmUpSession(renderer, scene, camera, extraColors = [], prepareLook = () => {}) {
  for (const color of [...TRAFFIC_COLORS, ...extraColors]) {
    trafficTemplate(color, "coupe");
  }
  trafficTemplate("#ffffff", "coupe", true);
  // Cars are drawn instanced: set up every look's instanced meshes so they compile with the scene.
  for (const template of trafficTemplates.values()) prepareLook(template);
  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    try {
      renderer.compile(scene, camera);
    } catch (fallbackError) {}
  }
}
