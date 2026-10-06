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
  const world = {
    scene,
  };
  createWorldContext(world);
  buildGround(world);
  buildMountainTerrain(world);
  buildRoads(world);
  buildTrafficControl(world);
  buildStreetLights(world);
  buildBuildings(world);
  buildStreetTrees(world);
  buildGasStations(world);
  buildHighway(world);
  buildMountainRoad(world);
  buildRoadClosure(world);
  buildMountainScenery(world);
  const updateSky = buildSky(world);
  // Every street lamp lights the city's ground in its shaders (see lampLighting.js).
  const lampLighting = createLampLighting(world.lampPositions);
  const lit = new Set([world.roadMaterial, world.sidewalkMaterial, ...(world.buildingMaterials?.() ?? [])]);
  for (const material of lit) {
    if (material) lampLighting.patch(material);
  }
  return {
    solids: world.solids,
    lampPositions: world.lampPositions,
    signals: world.signals,
    /** Picks the street lamps nearest to (x, z) for the ground lighting; call as the player moves. */
    updateLamps: (x, z) => lampLighting.update(x, z),
    /** Adds the street-lamp lighting to another material (effects, props). */
    lightByLamps: (material) => lampLighting.patch(material),
    /** Per-frame animation of world details (summit beacon, sky); `time` in seconds. */
    update: (time) => {
      updateMountain(world, time);
      updateSky(time);
    },
  };
}
