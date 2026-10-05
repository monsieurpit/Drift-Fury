import { createWorldContext } from "./worldContext.js";
import { buildGround } from "./ground.js";
import { buildRoads } from "./roads.js";
import { buildTrafficControl } from "./trafficControl.js";
import { buildStreetLights } from "./streetLights.js";
import { buildBuildings } from "./buildings.js";
import { buildStreetTrees } from "./streetTrees.js";
import { buildGasStations } from "./gasStations.js";
import { buildHighway } from "./highway.js";
import { buildMountainRoad, buildMountainScenery } from "./mountain.js";
import { buildRoadClosure } from "./roadClosure.js";
import { buildStars } from "./sky.js";
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
  buildStars(world);
  return {
    solids: world.solids,
    lampPositions: world.lampPositions,
    signals: world.signals,
  };
}
