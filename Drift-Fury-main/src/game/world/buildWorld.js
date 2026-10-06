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
import { LIGHT_LAMP, createClusteredLights } from "../render/clusteredLights.js";
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
  // Every light of the world (lamps, gas stations, shops) is a real light (see clusteredLights.js).
  const clusteredLights = createClusteredLights();
  for (const light of world.lights) clusteredLights.addStatic(light);
  // The ground (road, sidewalks and the paint on them) takes the lamps' light from a map baked once, so
  // it never changes as the player moves or turns; the other lights it takes like everything else.
  for (const material of [world.roadMaterial, world.sidewalkMaterial, world.whitePaint, world.yellowPaint]) {
    if (!material) continue;
    lampLighting.patchGround(material);
    clusteredLights.patch(material, { skipFlags: LIGHT_LAMP });
  }
  for (const material of world.buildingMaterials?.() ?? []) {
    if (material) clusteredLights.patch(material);
  }
  return {
    solids: world.solids,
    lampPositions: world.lampPositions,
    signals: world.signals,
    clusteredLights,
    /**
     * Picks the street lamps nearest to (x, z) for the ground's wet glints and the lights around the
     * camera; call every frame, after the frame's moving lights were added to clusteredLights.
     */
    updateLamps: (x, z, camera) => {
      lampLighting.update(x, z);
      lampLighting.updateView(camera);
      clusteredLights.setEnabled(true);
      clusteredLights.update(camera);
    },
    /** Turns the lamp lighting off until the next updateLamps (for cube-map captures). */
    clearLamps: () => {
      lampLighting.clear();
      clusteredLights.setEnabled(false);
    },
    /** Adds the lights to another material (effects, props). */
    lightByLamps: (material) => clusteredLights.patch(material),
    /** Per-frame animation of world details (summit beacon, sky); `time` in seconds. */
    update: (time) => {
      updateMountain(world, time);
      updateSky(time);
    },
  };
}
