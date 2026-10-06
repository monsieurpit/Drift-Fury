import { createWorldContext } from "./worldContext.js";
import { buildGround } from "./ground.js";
import { buildRoads } from "./roads.js";
import { buildTrafficControl } from "./trafficControl.js";
import { buildStreetLights } from "./streetLights.js";
import { buildBuildings } from "./buildings.js";
import { buildStreetTrees } from "./streetTrees.js";
import { buildGasStations } from "./gasStations.js";
import { buildHighway } from "./highway.js";
import { buildMountainRoad, buildMountainScenery, buildMountainTerrain, updateMountain } from "./mountain.js";
import { buildRoadClosure } from "./roadClosure.js";
import { buildSky } from "./sky.js";
import { createLampLighting } from "../render/lampLighting.js";
/**
 * Builds the whole map into `scene`: city grid, gas stations, highway and the mountain.
 * Each part lives in its own module and shares materials and helpers through the `world` object;
 * they run in a fixed order because some share a seeded random sequence.
 * Returns the collision solids, street lamp positions (for the moving light pool) and traffic signals.
 */
export function buildWorld(scene) {
  const steps = buildWorldInSteps(scene);
  for (;;) {
    const { done, value } = steps.next();
    if (done) return value;
  }
}

/**
 * The same as buildWorld, one part at a time: a generator that yields { label, progress } (0..1) after
 * each part so a loading screen can show progress and the page stays responsive; its return value is
 * buildWorld's result.
 */
export function* buildWorldInSteps(scene) {
  const world = {
    scene,
  };
  const parts = [
    ["Matériaux", createWorldContext],
    ["Terrain", buildGround],
    ["Montagne", buildMountainTerrain],
    ["Routes", buildRoads],
    ["Feux et panneaux", buildTrafficControl],
    ["Lampadaires", buildStreetLights],
    ["Bâtiments et commerces", buildBuildings],
    ["Arbres", buildStreetTrees],
    ["Stations-service", buildGasStations],
    ["Autoroute", buildHighway],
    ["Route de montagne", buildMountainRoad],
    ["Barrages", buildRoadClosure],
    ["Forêt et rochers", buildMountainScenery],
  ];
  for (let index = 0; index < parts.length; index++) {
    yield { label: parts[index][0], progress: index / (parts.length + 1) };
    parts[index][1](world);
  }
  yield { label: "Ciel", progress: parts.length / (parts.length + 1) };
  const updateSky = buildSky(world);
  // Every street lamp lights the city's ground in its shaders (see lampLighting.js).
  const lampLighting = createLampLighting(world.lampPositions);
  // The ground (road, sidewalks and the paint on them) takes the lamps' light from a map baked once, so
  // it never changes as the player moves or turns; walls and shop fronts light from the nearest lamps.
  for (const material of [world.roadMaterial, world.sidewalkMaterial, world.whitePaint, world.yellowPaint]) {
    if (material) lampLighting.patchGround(material);
  }
  for (const material of world.buildingMaterials?.() ?? []) {
    if (material) lampLighting.patch(material);
  }
  return {
    solids: world.solids,
    lampPositions: world.lampPositions,
    signals: world.signals,
    /** Picks the street lamps nearest to (x, z) for the ground lighting; call as the player moves. */
    updateLamps: (x, z, camera) => {
      lampLighting.update(x, z);
      lampLighting.updateView(camera);
    },
    /** Turns the lamp lighting off until the next updateLamps (for cube-map captures). */
    clearLamps: () => lampLighting.clear(),
    /** Adds the street-lamp lighting to another material (effects, props). */
    lightByLamps: (material) => lampLighting.patch(material),
    /** Per-frame animation of world details (summit beacon, sky); `time` in seconds. */
    update: (time) => {
      updateMountain(world, time);
      updateSky(time);
    },
  };
}
