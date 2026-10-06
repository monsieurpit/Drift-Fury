import { CIVILIAN_SHAPES } from "../simulation/game.js";
import { trafficTemplate, trafficTemplates } from "../vehicles/trafficCars.js";
/**
 * Compiles every shader the session can need before the first frame, so nothing stalls mid-drive: the
 * scene (including effects that have nothing to draw yet, like tyre smoke and skid marks) and every traffic
 * and police car look (instanced). Uses parallel shader compilation where the browser supports it.
 */
export async function warmUpSession(renderer, scene, camera, extraShapes = [], prepareLook = () => {}) {
  // (Every colour of a shape shares its look: one per shape, including the player's car's, which is
  // left parked when the player gets out.)
  for (const shape of new Set([...CIVILIAN_SHAPES, ...extraShapes])) {
    trafficTemplate("#ffffff", shape);
  }
  trafficTemplate("#ffffff", "coupe", true);
  // Cars are drawn instanced: set up every look's instanced meshes so they compile with the scene.
  for (const template of trafficTemplates.values()) prepareLook(template);
  // Things hidden until needed (tyre smoke, skid marks, empty car instances, people) are shown for the
  // compile, or their shaders would compile on the frame they first appear (a stutter on the first drift).
  const hidden = [];
  scene.traverse((object) => {
    if (!object.visible) {
      object.visible = true;
      hidden.push(object);
    }
  });
  try {
    await renderer.compileAsync(scene, camera);
  } catch (error) {
    try {
      renderer.compile(scene, camera);
    } catch (fallbackError) {}
  } finally {
    for (const object of hidden) object.visible = false;
  }
}
