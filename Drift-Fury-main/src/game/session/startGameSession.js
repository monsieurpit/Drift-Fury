import {
  AdditiveBlending,
  BoxGeometry,
  Color,
  CylinderGeometry,
  DoubleSide,
  InstancedMesh,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  Object3D,
  OctahedronGeometry,
  SpotLight,
  Vector3,
} from "three";
import { createAudio } from "../audio/createAudio.js";
import { createEffects } from "../effects/effects.js";
import { createBlood } from "../effects/blood.js";
import { createCrowd } from "../people/crowd.js";
import { createSkinnedCrowd, loadPeopleModels } from "../people/skinnedCrowd.js";
import { createPedestrians } from "../people/pedestrians.js";
import { buildSolidGrid } from "../simulation/collisions.js";
import { animatePerson, createPerson } from "../people/person.js";
import { createRenderer, gamePixelRatio } from "../render/renderer.js";
import {
  QUALITY_LEVELS,
  brokenFeatures,
  markFeatureBroken,
  resolveQuality,
  storeQuality,
  storedQuality,
} from "../render/quality.js";
import { batchStaticMeshes } from "../render/staticBatching.js";
import { createShadowCache } from "../render/shadowCache.js";
import { createFramePacer } from "../render/framePacer.js";
import { warmUpSession } from "../render/warmUp.js";
import { captureCityEnvironment } from "../render/reflectionProbe.js";
import { CITY_REFLECTION_PROBE } from "../render/wetSurface.js";
import {
  scannedTextureProgress,
  scannedTexturesReady,
  scannedTexturesRequested,
} from "../world/scannedTextures.js";
import { CIVILIAN_SHAPES, createGame } from "../simulation/game.js";
import { batchPlayerCar } from "../vehicles/batchPlayerCar.js";
import { buildCar } from "../vehicles/carModel.js";
import { trafficTemplate, trafficTemplates } from "../vehicles/trafficCars.js";
import { createCarInstancer } from "../vehicles/carInstancing.js";
import { buildModelCar, carModelKey, loadCarModels } from "../vehicles/carModels.js";
import { createHelicopter } from "../vehicles/helicopter.js";
import { crackPrewarm, createCarDamage } from "../vehicles/carDamage.js";
import { createSparks } from "../effects/sparks.js";
import { createGunfire } from "../effects/gunfire.js";
import { createFire } from "../effects/fire.js";
import { createEmergencyServices } from "./emergencyServices.js";
import { createPoliceJob } from "./policeJob.js";
import { buildWorldInSteps } from "../world/buildWorld.js";
import { terrainHeight } from "../world/terrain.js";
import { loadStreetProps, placeStreetProps } from "../world/streetProps.js";
import { ROAD_XS, ROAD_ZS } from "../data/roadGrid.js";
import { MOON_DIRECTION } from "../world/sky.js";
import { t } from "../../i18n.js";
const CANCELLED = Symbol("cancelled");
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Starts a driving session in `container`. Everything is loaded up front behind the loading screen (the
 * world, cars, photo-scanned textures and their upload to the GPU, reflections, every shader, the engine
 * sound, and a few warm-up renders of the city, highway and mountain) so nothing is built, compiled or
 * uploaded mid-drive. Progress goes to callbacks.current.onLoading({ progress, label }); onReady() is
 * called when the first frame is about to be drawn. The returned session can be disposed at any time,
 * including while it is still loading.
 */
export function startGameSession(container, car, engine, controls, callbacks, noPolice = false) {
  let live = null;
  let cancelled = false;
  let pendingCar = null;
  const loading = {
    report: (progress, label) => callbacks.current.onLoading?.({ progress, label }),
    cancelled: () => cancelled,
  };
  bootGameSession(container, car, engine, controls, callbacks, noPolice, loading)
    .then((session) => {
      if (cancelled) {
        session.dispose();
        return;
      }
      live = session;
      if (pendingCar && pendingCar.id !== car.id) session.setCar(pendingCar);
      session.start();
      callbacks.current.onReady?.();
    })
    .catch((error) => {
      if (error !== CANCELLED) {
        console.error(error);
        callbacks.current.onLoadError?.(error);
      }
    });
  const session = {
    setQuality(choice) {
      if (live) live.setQuality(choice);
      else storeQuality(choice);
    },
    setCar(next) {
      if (live) live.setCar(next);
      else pendingCar = next;
    },
    dispose() {
      cancelled = true;
      live?.dispose();
    },
  };
  return session;
}

async function bootGameSession(container, car, engine, controls, callbacks, noPolice, loading) {
  const cleanup = [];
  // Lets the loading screen paint, and stops here if the session was closed meanwhile.
  const stage = async (progress, label) => {
    loading.report(progress, label);
    await sleep(16);
    if (loading.cancelled()) {
      cleanup.forEach((dispose) => dispose());
      throw CANCELLED;
    }
  };
  await stage(0.01, t("stage.graphics"));
  const view = createRenderer(container, true);
  cleanup.push(() => view.dispose());
  // Safety net for devices that cannot cope with a quality level (phones and tablets above all): if the
  // browser takes the graphics context away (out of graphics memory) or a shader fails to compile, the
  // screen would just stay black. Instead, step down one quality level, remember it, and restart.
  let graphicsFailed = false;
  const graphicsFailure = (reason, detail = "") => {
    if (graphicsFailed) return;
    graphicsFailed = true;
    const level = QUALITY_LEVELS.indexOf(view.quality);
    const lower = QUALITY_LEVELS[Math.max(0, level - 1)];
    storeQuality(lower);
    callbacks.current.onGraphicsFailure?.({ reason, from: view.quality, to: lower, detail });
  };
  // A lost graphics context is restored by the browser (and three.js) rather than ending the session.
  const onContextLost = (event) => {
    event.preventDefault();
    console.warn("WebGL context lost; waiting for the browser to restore it.");
  };
  view.renderer.domElement.addEventListener("webglcontextlost", onContextLost);
  // (No automatic restart or quality change on a shader error: it is only logged.)
  view.renderer.debug.onShaderError = (gl, program, vertexShader, fragmentShader) => {
    console.error(
      "Shader error:",
      gl.getProgramInfoLog(program),
      gl.getShaderInfoLog(vertexShader),
      gl.getShaderInfoLog(fragmentShader),
    );
  };

  const { scene, renderer, camera, sun, touchDevice, composer } = view;
  const worldSteps = buildWorldInSteps(scene);
  let worldStep = worldSteps.next();
  while (!worldStep.done) {
    await stage(0.03 + worldStep.value.progress * 0.32, worldStep.value.label);
    worldStep = worldSteps.next();
  }
  const {
    solids,
    signals,
    update: updateWorld,
    updateLamps,
    clearLamps,
    lightByLamps,
    clusteredLights,
  } = worldStep.value;
  // Cars sit on the ground: pitch and roll follow the terrain under their wheels (flat in the city).
  const sitOnGround = (object, x, z, heading, extraRoll = 0) => {
    const forwardX = -Math.sin(heading);
    const forwardZ = -Math.cos(heading);
    const rightX = Math.cos(heading);
    const rightZ = -Math.sin(heading);
    const front = terrainHeight(x + forwardX * 1.4, z + forwardZ * 1.4);
    const back = terrainHeight(x - forwardX * 1.4, z - forwardZ * 1.4);
    const right = terrainHeight(x + rightX * 0.8, z + rightZ * 0.8);
    const left = terrainHeight(x - rightX * 0.8, z - rightZ * 0.8);
    object.rotation.order = "YXZ";
    object.rotation.set(Math.atan2(front - back, 2.8), heading, Math.atan2(right - left, 1.6) + extraRoll);
  };
  // Photo-scanned 3D street props (streetProps.js), placed before the world is frozen and batched.
  await stage(0.355, t("stage.props"));
  const streetProps = await loadStreetProps((done) => loading.report(0.355 + 0.004 * done, t("stage.props")));
  if (loading.cancelled()) {
    cleanup.forEach((dispose) => dispose());
    throw CANCELLED;
  }
  placeStreetProps(scene, streetProps, {
    roadXs: ROAD_XS,
    roadZs: ROAD_ZS,
    solids,
    lightByLamps,
    heightAt: terrainHeight,
  });
  // Real 3D car models for the parked and police cars (carModels.js).
  await stage(0.36, t("stage.vehicles"));
  const [, peopleModels] = await Promise.all([loadCarModels(undefined, { emergency: true }), loadPeopleModels()]);
  if (loading.cancelled()) {
    cleanup.forEach((dispose) => dispose());
    throw CANCELLED;
  }
  await stage(0.36, t("stage.geometry"));
  const staticBatch = batchStaticMeshes(scene, new Set(signals.flatMap((signal) => signal.lenses)), 96);
  // Everything in the scene so far is the world, which never moves: its shadows can be cached.
  const shadowCache = createShadowCache(
    renderer,
    scene,
    camera,
    sun,
    new Set(scene.children),
    MOON_DIRECTION,
  );
  cleanup.push(() => shadowCache.dispose());
  // The world never moves: compute its transforms once and take it out of the per-frame matrix update
  // (which otherwise walks ~2000 objects every frame). Lights stay live (the moon follows the player).
  for (const root of scene.children) {
    if (root.isLight || root === sun.target) continue;
    root.updateMatrixWorld(true);
    root.traverse((object) => {
      if (!object.isLight) object.matrixAutoUpdate = false;
    });
    root.matrixWorldAutoUpdate = false;
    // (three.js would still walk every descendant each frame: skip the whole subtree.)
    root.updateMatrixWorld = () => {};
  }
  await stage(0.42, t("stage.vehicles"));
  const game = createGame(car, engine, solids, noPolice);
  // ?dfdebug exposes the live session for profiling tools
  const debugSession = /[?&]dfdebug\b/.test(location.search)
    ? (window.__dfDbg = {
        scene,
        renderer,
        composer,
        camera,
        sun,
        staticBatch,
        solids,
        controls,
        get traffic() {
          return game.traffic;
        },
        get state() {
          return game.state;
        },
      })
    : null;
  let signalClock = 0;
  const signalStates = [-1, -1];
  function updateTrafficLights(dt) {
    signalClock = (signalClock + dt) % 24;
    const phase = signalClock % 24;
    const state0 = phase < 9 ? 0 : phase < 11 ? 1 : 2;
    const state1 = phase >= 12 && phase < 21 ? 0 : phase >= 21 && phase < 23 ? 1 : 2;
    for (let axis = 0; axis < signalStates.length; axis++) {
      const state = axis === 0 ? state0 : state1;
      if (signalStates[axis] === state) {
        continue;
      }
      signalStates[axis] = state;
      const activeLens = state === 0 ? 2 : state === 1 ? 1 : 0;
      for (const signal of signals) {
        if (signal.axis === axis) {
          signal.lenses.forEach((material, index) => {
            material.emissiveIntensity = index === activeLens ? 0.9 : 0.025;
          });
        }
      }
    }
  }
  let interaction = null;
  // The player's car: its real 3D model (carModels.js), or the one built from code if it has none.
  const buildPlayerCar = (color, shape, police = false, model = null) => {
    const modelKey = carModelKey(model || shape, police);
    return batchPlayerCar(
      modelKey ? buildModelCar(modelKey, { player: true, color }) : buildCar(color, shape, police, true),
    );
  };
  let playerCar = buildPlayerCar(car.color, car.shape);
  scene.add(playerCar);
  // Two dark stand-ins for the player's headlights (real spot lights) while the car is hidden (the player
  // on foot): the scene's light count never changes, so no material has to be compiled again. (Getting out
  // of the car took the two lights away and recompiled every shader in view at once: the game froze.)
  const spareBeams = [0, 1].map(() => {
    const beam = new SpotLight("#000000", 0, 1, 0.5, 0.8, 1.6);
    beam.position.set(0, -50, 0);
    beam.target.position.set(0, -60, 0);
    beam.visible = false;
    scene.add(beam, beam.target);
    return beam;
  });
  let playerCarSpec = game.state.playerVeh.spec;
  // Police, parked and traffic cars are instanced per look (carInstancing.js).
  // Moving things get motion vectors for the temporal antialiasing (taaPass.js).
  const trackMotion = (object) => composer.taa?.track(object);
  const carInstancer = createCarInstancer(scene, {
    onMesh: (mesh, template) => {
      // Only the police cruisers and the traffic move: parked cars need no motion vectors (their motion on screen is the
      // camera's, which the antialiasing reprojects from depth), and so no second draw every frame.
      if (template?.userData?.police || template?.userData?.moving) trackMotion(mesh);
      clusteredLights.patchAll(mesh);
    },
  });
  trackMotion(playerCar);
  const policeCars = game.state.police.map(() => {
    return carInstancer.add(trafficTemplate("#ffffff", "coupe", true));
  });
  let playerPerson = createPerson("#2f3b4c");
  playerPerson.visible = false;
  scene.add(playerPerson);
  trackMotion(playerPerson);
  const newOfficer = () => {
    const officer = createPerson("#1f2f4d");
    officer.visible = false;
    officer.rotation.order = "YXZ"; // (yaw, then falling over around their own axis)
    scene.add(officer);
    trackMotion(officer);
    return officer;
  };
  const officerPeople = game.state.police.map(newOfficer);
  // The officers standing behind a roadblock's cruisers, and the one who cuffs the player.
  const roadblockOfficers = [newOfficer(), newOfficer()];
  const cuffingOfficer = newOfficer();
  const helicopter = createHelicopter(scene);
  let sparkLight = null;
  let jobNews = null;
  const cashPops = [];
  let noticeShown = null;
  let respawnMessageKind = null;
  let respawnMessageUntil = -1;
  let baseSaturation = null;
  const SPARK_COLOUR = new Color("#ff9a3c");
  // Where the player's car touches something in direction (nx, nz): on the outline of its body.
  const contactPoint = (state, nx, nz) => {
    const localX = Math.abs(nx * Math.cos(state.heading) - nz * Math.sin(state.heading));
    const localZ = Math.abs(nx * Math.sin(state.heading) + nz * Math.cos(state.heading));
    const reach = Math.min(1.0 / Math.max(localX, 1e-3), 2.25 / Math.max(localZ, 1e-3));
    return [state.x + nx * reach, state.z + nz * reach];
  };
  trackMotion(helicopter.object);
  let heliLight = null;
  let cuffsHeard = false;
  const trafficCars = new Map();
  function swapPlayerCar(vehicle) {
    scene.remove(playerCar);
    composer.taa?.untrack(playerCar);
    playerCar.traverse((e) => {
      e.geometry?.dispose();
      e.material?.dispose();
    });
    // A parked or police car taken by the player keeps its real model (carModels.js); the garage cars are
    // the ones built from code.
    playerCar = buildPlayerCar(vehicle.color, vehicle.shape, vehicle.kind === "police", vehicle.model);
    clusteredLights.patchAll(playerCar);
    scene.add(playerCar);
    trackMotion(playerCar);
    playerCarSpec = vehicle.spec;
  }
  // City traffic (RP mode, traffic.js): moved here each frame with the light cycle, drawn instanced.
  const trafficCount = { low: 8, medium: 12, high: 16, ultra: 20 }[view.quality] ?? 12;
  const trafficHandles = new Map(); // traffic car -> instanced handle
  const trafficPeople = [];
  const trafficWorld = {
    player: { x: 0, z: 0, heading: 0, onFoot: false, vx: 0, vz: 0, lights: false },
    sirens: [],
    police: [],
    chasing: false,
    vehicles: [],
    people: trafficPeople,
    phase: 0,
    camera: { x: 0, z: 0, dirX: 0, dirZ: -1 },
    count: trafficCount,
    filling: true,
  };
  const trafficView = new Vector3();
  function updateTraffic(state, dt, filling = false) {
    const traffic = game.traffic;
    if (!traffic) return;
    const world = trafficWorld;
    Object.assign(world.player, {
      x: state.x,
      z: state.z,
      heading: state.heading,
      onFoot: state.onFoot,
      vx: state.vx,
      vz: state.vz,
      lights: !!policeJob?.playerLights,
    });
    policeJob?.sirens(state, world.sirens);
    world.police = state.police;
    world.chasing = state.wanted > 0.15;
    world.vehicles = state.vehicles;
    world.phase = signalClock;
    world.filling = filling;
    camera.getWorldDirection(trafficView);
    world.camera.x = camera.position.x;
    world.camera.z = camera.position.z;
    const flat = Math.hypot(trafficView.x, trafficView.z) || 1;
    world.camera.dirX = trafficView.x / flat;
    world.camera.dirZ = trafficView.z / flat;
    // People in the roadway (crossing, running, lying there): the asphalt is 9 m either side of a road's
    // centre line.
    trafficPeople.length = 0;
    for (const ped of pedestrians.people) {
      let onRoad = false;
      for (const x of ROAD_XS) if (Math.abs(ped.x - x) < 9.2) onRoad = true;
      for (const z of ROAD_ZS) if (Math.abs(ped.z - z) < 9.2) onRoad = true;
      if (onRoad) trafficPeople.push(ped);
    }
    for (const officer of state.police) if (officer.onFoot) trafficPeople.push(officer);
    traffic.update(dt, world);
    for (const event of traffic.events) {
      if (event.type === "horn") {
        const [distance, pan] = heard(event.x, event.z);
        if (distance < 70) audio.horn?.(distance, pan);
      } else if (event.type === "crash") {
        // A fleeing suspect's car crashing into traffic.
        const [distance] = heard(event.x, event.z);
        effects.crash(event.x, terrainHeight(event.x, event.z) + 0.6, event.z, Math.min(1.2, event.speed * 0.06));
        if (distance < 90) audio.crash?.(Math.min(1.2, event.speed * 0.06) * Math.min(1, 15 / Math.max(15, distance)));
      }
    }
    // Instanced handles: one per car on the road.
    const live = new Set(traffic.cars);
    for (const [car, handle] of trafficHandles) {
      if (!live.has(car)) {
        carInstancer.remove(handle);
        trafficHandles.delete(car);
      }
    }
    for (const car of traffic.cars) {
      let handle = trafficHandles.get(car);
      if (!handle) {
        handle = carInstancer.add(trafficTemplate(car.color, car.shape, false, true), car.color);
        trafficHandles.set(car, handle);
      }
      handle.visible = true;
      handle.position.set(car.x, terrainHeight(car.x, car.z) + 0.1, car.z);
      sitOnGround(handle, car.x, car.z, car.heading);
      // An ambulance or fire truck on a call: its lights flash (off on the way back).
      const flashing = car.mission === "enroute" || car.mission === "arrived";
      const phase = Math.sin(performance.now() * 0.02 + car.id) > 0;
      handle.userData.blue = flashing && phase;
      handle.userData.red = flashing && !phase;
    }
  }
  function syncTrafficCars() {
    const state = game.state;
    const activeIds = new Set();
    for (let vehicle of state.vehicles) {
      activeIds.add(vehicle.id);
      let entry = trafficCars.get(vehicle.id);
      if (!entry) {
        const carModel =
          vehicle.kind === "police"
            ? carInstancer.add(trafficTemplate("#ffffff", vehicle.model && policeJob?.modelsReady ? vehicle.model : "coupe", true))
            : carInstancer.add(trafficTemplate(vehicle.color, vehicle.shape || "coupe"), vehicle.color);
        entry = {
          car: carModel,
        };
        trafficCars.set(vehicle.id, entry);
      }
      entry.car.visible = true;
      if (vehicle.kind === "police") {
        // (The duty car flashes only with its lights on; other parked cruisers always.)
        const lit = !policeJob || policeJob.lightsOn(vehicle);
        const blue = Math.sin(performance.now() * 0.018) > 0;
        entry.car.userData.blue = lit && (!vehicle.duty || blue);
        entry.car.userData.red = lit && (!vehicle.duty || !blue);
      }
      // Burnt out: the paint goes black.
      if ((entry.color ?? vehicle.color) !== vehicle.color) {
        entry.car.userData.paint = new Color(vehicle.color);
        entry.car.userData.look.dirty = true;
      }
      entry.color = vehicle.color;
      // Parked cars don't move: place them only when they do.
      if (entry.x !== vehicle.x || entry.z !== vehicle.z || entry.heading !== vehicle.heading) {
        entry.x = vehicle.x;
        entry.z = vehicle.z;
        entry.heading = vehicle.heading;
        entry.car.position.set(vehicle.x, terrainHeight(vehicle.x, vehicle.z) + 0.1, vehicle.z);
        sitOnGround(entry.car, vehicle.x, vehicle.z, vehicle.heading);
      }
      if (
        interaction?.direction === "exit" &&
        Math.hypot(vehicle.x - interaction.carX, vehicle.z - interaction.carZ) < 0.5
      ) {
        entry.car.visible = false;
      }
    }
    for (let [id, entry] of trafficCars) {
      if (!activeIds.has(id)) {
        carInstancer.remove(entry.car);
        trafficCars.delete(id);
      }
    }
  }
  // The moving lights of the frame (clusteredLights.js): police cruisers' headlights and flashing light
  // bars (also on cruisers left parked), the player's tail lights.
  const carLightPool = [];
  let carLightCount = 0;
  const carLight = () => {
    if (carLightCount === carLightPool.length) carLightPool.push({ color: new Color(), direction: [0, 0, 0] });
    return carLightPool[carLightCount++];
  };
  const nearestTraffic = [];
  const BAR_BLUE = new Color("#3a6bff");
  const EMERGENCY_WHITE = new Color("#e8eeff");
  const BAR_RED = new Color("#ff2a2a");
  const HEADLIGHT = new Color("#fff0d8");
  const TAIL = new Color("#ff1a10");
  function addCarLights(state, time) {
    carLightCount = 0;
    const flashBlue = Math.sin(time * 0.018) > 0;
    const addBar = (x, z) => {
      const light = carLight();
      Object.assign(light, { x, y: terrainHeight(x, z) + 1.75, z, intensity: 30, range: 16, flags: 0 });
      light.color.copy(flashBlue ? BAR_BLUE : BAR_RED);
      light.direction = null;
      clusteredLights.addDynamic(light);
    };
    for (const officer of state.police) {
      if (officer.onFoot) continue;
      addBar(officer.x, officer.z);
      // Low beams, from above the car like the player's (a light at bumper height grazes the road and
      // piles its light up a few metres ahead), aimed at the road 22 m ahead.
      const forwardX = -Math.sin(officer.heading);
      const forwardZ = -Math.cos(officer.heading);
      const ground = terrainHeight(officer.x, officer.z);
      const beam = carLight();
      Object.assign(beam, {
        x: officer.x + forwardX * 0.8,
        y: ground + 3.4,
        z: officer.z + forwardZ * 0.8,
        intensity: 600,
        range: 40,
        cosOuter: 0.86,
        cosInner: 0.97,
        flags: 0,
      });
      const length = Math.hypot(22, 3.4);
      beam.direction = [(forwardX * 22) / length, -3.4 / length, (forwardZ * 22) / length];
      beam.color.copy(HEADLIGHT);
      clusteredLights.addDynamic(beam);
    }
    for (const vehicle of state.vehicles) {
      if (vehicle.kind === "police" && (!policeJob || policeJob.lightsOn(vehicle))) addBar(vehicle.x, vehicle.z);
    }
    // The player's police car, lights on.
    if (policeJob?.playerLights) addBar(state.x, state.z);
    // Ambulances and fire trucks on a call: red and white flashes.
    for (const car of game.traffic ? game.traffic.cars : []) {
      if (car.mission !== "enroute" && car.mission !== "arrived") continue;
      const light = carLight();
      Object.assign(light, { x: car.x, y: terrainHeight(car.x, car.z) + 2.6, z: car.z, intensity: 30, range: 16, flags: 0 });
      light.color.copy(flashBlue ? BAR_RED : EMERGENCY_WHITE);
      light.direction = null;
      clusteredLights.addDynamic(light);
    }
    // Low beams of the nearest traffic (the farther cars' lamps just glow).
    if (game.traffic) {
      nearestTraffic.length = 0;
      for (const car of game.traffic.cars) {
        const d = Math.hypot(car.x - camera.position.x, car.z - camera.position.z);
        if (d < 75) nearestTraffic.push([d, car]);
      }
      nearestTraffic.sort((a, b) => a[0] - b[0]);
      for (let k = 0; k < Math.min(6, nearestTraffic.length); k++) {
        const car = nearestTraffic[k][1];
        const forwardX = -Math.sin(car.heading);
        const forwardZ = -Math.cos(car.heading);
        const beam = carLight();
        Object.assign(beam, {
          x: car.x + forwardX * 0.8,
          y: terrainHeight(car.x, car.z) + 3.4,
          z: car.z + forwardZ * 0.8,
          intensity: 450,
          range: 36,
          cosOuter: 0.86,
          cosInner: 0.97,
          flags: 0,
        });
        const length = Math.hypot(22, 3.4);
        beam.direction = [(forwardX * 22) / length, -3.4 / length, (forwardZ * 22) / length];
        beam.color.copy(HEADLIGHT);
        clusteredLights.addDynamic(beam);
      }
    }
    for (const flame of fire.lights().slice(0, 4)) {
      const light = carLight();
      Object.assign(light, { x: flame.x, y: flame.y, z: flame.z, intensity: flame.intensity, range: flame.range, flags: 0 });
      light.direction = null;
      light.color.copy(flame.colour);
      clusteredLights.addDynamic(light);
    }
    const shotLight = gunfire.light;
    if (shotLight) {
      const light = carLight();
      Object.assign(light, { x: shotLight.x, y: shotLight.y, z: shotLight.z, intensity: shotLight.intensity, range: shotLight.range, flags: 0 });
      light.direction = null;
      light.color.copy(shotLight.colour);
      clusteredLights.addDynamic(light);
    }
    if (sparkLight) {
      Object.assign(light, { x: sparkLight.x, y: sparkLight.y, z: sparkLight.z, intensity: 14 * sparkLight.flicker, range: 7, flags: 0 });
      light.direction = null;
      light.color.copy(SPARK_COLOUR);
      clusteredLights.addDynamic(light);
    }
    if (heliLight) {
      const light = carLight();
      Object.assign(light, heliLight, { flags: 0 });
      light.color.copy(heliLight.colour);
      clusteredLights.addDynamic(light);
    }
    if (!state.onFoot) {
      const braking = state.brake > 0 || (state.speed > 5 && state.throttle === 0);
      const tail = carLight();
      Object.assign(tail, {
        x: state.x + Math.sin(state.heading) * 2.4,
        y: (state.y || 0) + 0.75,
        z: state.z + Math.cos(state.heading) * 2.4,
        intensity: braking ? 9 : 3,
        range: 7,
        flags: 0,
      });
      tail.direction = null;
      tail.color.copy(TAIL);
      clusteredLights.addDynamic(tail);
    }
  }
  const audio = controls.current.audio || createAudio(engine);
  cleanup.push(() => audio.close());
  const effects = createEffects(scene, { patch: lightByLamps });
  // Pedestrians on the sidewalks (pedestrians.js), drawn as a crowd (crowd.js), and their blood.
  const CITY_EDGE = 11.4;
  const groundAt = (x, z) => {
    const inCity =
      x > ROAD_XS[0] - CITY_EDGE &&
      x < ROAD_XS[ROAD_XS.length - 1] + CITY_EDGE &&
      z > ROAD_ZS[0] - CITY_EDGE &&
      z < ROAD_ZS[ROAD_ZS.length - 1] + CITY_EDGE;
    if (!inCity) return terrainHeight(x, z);
    let d = Infinity;
    for (const roadX of ROAD_XS) d = Math.min(d, Math.abs(x - roadX));
    for (const roadZ of ROAD_ZS) d = Math.min(d, Math.abs(z - roadZ));
    return d < 9 ? 0.07 : d < CITY_EDGE ? 0.22 : 0.09;
  };
  const pedestrianCount = { low: 14, medium: 20, high: 28, ultra: 34 }[view.quality] ?? 20;
  const blood = createBlood(scene, groundAt, { patch: lightByLamps });
  const sparks = createSparks(scene, groundAt);
  const gunfire = createGunfire(scene);
  const fire = createFire(scene);
  // The job marker: a glowing ring on the ground and a column of light seen from across the city.
  const JOB_COLOURS = { taxi: new Color("#ffd23a"), delivery: new Color("#4fb4ff"), race: new Color("#ff5a5a") };
  const markerMaterial = new MeshBasicMaterial({
    color: new Color("#ffd23a"),
    transparent: true,
    opacity: 0.35,
    depthWrite: false,
    blending: AdditiveBlending,
    side: DoubleSide,
    fog: false,
  });
  const jobMarker = new Mesh(new CylinderGeometry(1, 1, 1, 32, 1, true), markerMaterial);
  jobMarker.visible = false;
  jobMarker.frustumCulled = false;
  jobMarker.renderOrder = 3;
  scene.add(jobMarker);
  // Who or what is waiting at a job's pickup: a client waving for the taxi, a package on the kerb.
  const jobClient = createPerson("#7a4b8f");
  jobClient.visible = false;
  scene.add(jobClient);
  trackMotion(jobClient);
  const jobPackage = new Mesh(
    new BoxGeometry(0.55, 0.42, 0.45),
    new MeshStandardMaterial({ color: "#a07a4a", roughness: 0.85, metalness: 0 }),
  );
  jobPackage.visible = false;
  jobPackage.castShadow = true;
  scene.add(jobPackage);
  // Hidden packages: small green glowing parcels, spinning and bobbing over the sidewalk.
  const PACKAGE_SAVE = "drift-fury-packages";
  try {
    const saved = JSON.parse(localStorage.getItem(PACKAGE_SAVE) || "[]");
    if (Array.isArray(saved)) game.packages.restore(saved);
  } catch {
    // (no saved packages)
  }
  const packageGeometry = new OctahedronGeometry(0.42, 0);
  const packageMaterial = new MeshStandardMaterial({
    color: "#1f6b34",
    emissive: new Color("#3cff7a"),
    emissiveIntensity: 0.9,
    roughness: 0.4,
    metalness: 0.1,
  });
  // (All in one draw: an instance per package, always in the same slot; a hidden one is scaled to nothing.)
  const packageMesh = new InstancedMesh(packageGeometry, packageMaterial, game.packages.spots.length);
  packageMesh.frustumCulled = false;
  packageMesh.castShadow = false;
  const packageBaseY = game.packages.spots.map((spot) => groundAt(spot.x, spot.z) + 0.95);
  const packageDummy = new Object3D();
  packageDummy.scale.setScalar(0);
  packageDummy.updateMatrix();
  for (let id = 0; id < packageBaseY.length; id++) packageMesh.setMatrixAt(id, packageDummy.matrix);
  packageMesh.visible = false;
  scene.add(packageMesh);
  trackMotion(packageMesh);
  scene.add(crackPrewarm());
  // Scanned, animated people (skinnedCrowd.js); the people built from shapes if they could not load.
  const crowd = peopleModels
    ? createSkinnedCrowd(scene, pedestrianCount, {
        onMesh: (mesh) => clusteredLights.patchAll(mesh),
      })
    : createCrowd(scene, pedestrianCount, {
        onMesh: (mesh) => {
          trackMotion(mesh);
          clusteredLights.patchAll(mesh);
        },
      });
  const pedestrians = createPedestrians({
    roadXs: ROAD_XS,
    roadZs: ROAD_ZS,
    solids,
    crowd,
    blood,
    groundAt,
    count: pedestrianCount,
  });
  if (debugSession) debugSession.pedestrians = pedestrians;
  // Ambulances for the dead, fire trucks for burning cars (emergencyServices.js).
  const emergency = createEmergencyServices({ scene, game, pedestrians, fire, groundAt, trackMotion, trafficWorld });
  // The police job (policeJob.js, policeDuty.js).
  const policeJob = createPoliceJob({
    game,
    pedestrians,
    gunfire,
    groundAt,
    handPosition,
    audio,
    controls,
    callbacks,
    clusteredLights,
    composer,
    carInstancer,
    renderer,
    scene,
    camera,
    buildPlayerCar,
  });
  cleanup.push(() => policeJob.dispose());
  controls.current.duty = policeJob;
  // The player is a scanned person too (the one built from shapes if the scans could not load).
  if (peopleModels) {
    const scanned = crowd.add(Math.random, "eric");
    scanned.visible = false;
    scene.remove(playerPerson);
    composer.taa?.untrack(playerPerson);
    playerPerson = scanned;
    trackMotion(playerPerson);
  }
  playerPerson.rotation.order = "YXZ"; // (yaw, then lying down around its own axis)
  // The player's low beams shine from above the car (see carModel.js), which throws a broad pool down the
  // road but also floods a wall right in front of the car far brighter than real headlights would (they
  // sit at bumper height and aim down). With a wall close ahead the beams are turned down smoothly.
  const wallGrid = buildSolidGrid(solids.filter((solid) => solid.w > 0.6 || solid.d > 0.6));
  const wallBuffer = [];
  let beamScale = 1;
  function updateHeadlights(state, dt) {
    let clear = 14;
    if (!state.onFoot) {
      const forwardX = -Math.sin(state.heading);
      const forwardZ = -Math.cos(state.heading);
      for (let ahead = 1.5; ahead <= 14; ahead += 1) {
        const x = state.x + forwardX * ahead;
        const z = state.z + forwardZ * ahead;
        if (wallGrid.near(x, z, 3, wallBuffer).some((w) => Math.abs(x - w.x) < w.w && Math.abs(z - w.z) < w.d)) {
          clear = ahead;
          break;
        }
      }
    }
    // (Shop glass reflects the raised source straight back at the camera: close up, almost off.)
    const open = Math.min(1, Math.max(0, (clear - 3) / 11));
    const target = 0.08 + 0.92 * open * open;
    beamScale += (target - beamScale) * (1 - Math.exp(-6 * dt));
    for (const beam of playerCar.userData.headlightBeams || []) {
      beam.userData.baseIntensity ??= beam.intensity;
      beam.intensity = beam.userData.broken ? 0 : beam.userData.baseIntensity * beamScale;
    }
  }
  const pedestrianCars = [];
  const cameraRight = new Vector3();
  const impactPoint = new Vector3();
  const impactVelocity = new Vector3();
  // Where a sound is for the listener (the camera): distance, and left/right.
  const heard = (x, z) => {
    cameraRight.setFromMatrixColumn(camera.matrixWorld, 0);
    const dx = x - camera.position.x;
    const dz = z - camera.position.z;
    const distance = Math.hypot(dx, dz);
    return [distance, distance > 0.01 ? (dx * cameraRight.x + dz * cameraRight.z) / distance : 0];
  };
  const movingBodies = new Set(); // pedestrians thrown or falling (see processPedEvents)
  /* ----- guns (RP mode): the police shoot at 3 stars; the player fires with G (or the touch button) ----- */
  let playerGunCooldown = 0;
  let gunDrawn = 0; // seconds the player keeps the gun up after firing
  let playerAim = null; // where the player is aiming (a Vector3), while the gun is up
  const handPoint = new Vector3();
  const aimPoint = new Vector3();
  const muzzle = new Vector3();
  const shotEnd = new Vector3();
  const shotEvents = [];
  /** World position of a person's right hand (scanned people: the hand bone; others: the forearm's end). */
  function handPosition(person, out) {
    const bone = person.userData.handBone;
    if (bone) return bone.getWorldPosition(out);
    const forearm = person.userData.L?.re;
    if (forearm) return forearm.localToWorld(out.set(0, -0.3, 0));
    return out.copy(person.position).setY(person.position.y + 1.3);
  }
  /** Whether a bullet from (x0, z0) reaches (x1, z1) without hitting a wall (where it stops, if not). */
  function bulletPath(x0, z0, x1, z1, end) {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.max(1, Math.ceil(length / 1.5));
    for (let k = 1; k <= steps; k++) {
      const x = x0 + ((x1 - x0) * k) / steps;
      const z = z0 + ((z1 - z0) * k) / steps;
      if (wallGrid.near(x, z, 2, wallBuffer).some((w) => Math.abs(x - w.x) < w.w && Math.abs(z - w.z) < w.d)) {
        end.x = x0 + ((x1 - x0) * (k - 0.5)) / steps;
        end.z = z0 + ((z1 - z0) * (k - 0.5)) / steps;
        return false;
      }
    }
    end.x = x1;
    end.z = z1;
    return true;
  }
  // The police job's weapons: time between shots, range, and the chance to hit close (and far).
  const WEAPON_STATS = {
    pistol: { cooldown: 0.32, range: 30, near: 15, hitNear: 0.9, hitFar: 0.72 },
    taser: { cooldown: 1.3, range: 10, near: 10, hitNear: 0.85, hitFar: 0.85 },
    shotgun: { cooldown: 0.95, range: 20, near: 12, hitNear: 0.97, hitFar: 0.7 },
    rifle: { cooldown: 0.14, range: 45, near: 20, hitNear: 0.9, hitFar: 0.78 },
  };
  let playerWeapon = "pistol";
  /** The player's gun: aims at whoever is in front (people, officers), fires, and what it does. */
  function updatePlayerGun(state, dt) {
    playerGunCooldown -= dt;
    gunDrawn -= dt;
    if (gunDrawn <= 0) playerAim = null;
    const pressed = !!(keys.KeyG || controls.current.keys.KeyG);
    if (state.noPolice || !state.onFoot || state.busted > 0 || state.wasted > 0 || interaction) {
      playerAim = null;
      gunDrawn = 0;
      return;
    }
    const onDuty = game.duty.duty.on;
    playerWeapon = onDuty ? game.duty.duty.weapon : "pistol";
    const stats = WEAPON_STATS[playerWeapon] || WEAPON_STATS.pistol;
    if (!pressed || playerGunCooldown > 0) return;
    playerGunCooldown = stats.cooldown;
    gunDrawn = 3;
    // In a store, the gun is pointed at the clerk: a hold-up (game.js), no shot.
    if (state.store >= 0 && !onDuty) {
      playerAim = (playerAim || new Vector3()).set(
        state.x - Math.sin(state.footYaw || 0) * 3,
        (state.y || 0) + 1.3,
        state.z - Math.cos(state.footYaw || 0) * 3,
      );
      return;
    }
    // The target: the nearest person or officer roughly in front, in plain sight, within 30 m.
    const yaw = state.footYaw || 0;
    const fx = -Math.sin(yaw);
    const fz = -Math.cos(yaw);
    let best = null;
    let bestScore = Infinity;
    const consider = (x, z, target) => {
      const dx = x - state.x;
      const dz = z - state.z;
      const d = Math.hypot(dx, dz);
      if (d < 0.6 || d > stats.range) return;
      const facing = (dx * fx + dz * fz) / d;
      if (facing < 0.55) return;
      if (!bulletPath(state.x, state.z, x, z, shotEnd)) return;
      // (On duty, the suspect running or fighting is the one aimed at.)
      const suspect = target.ped?.suspect;
      const threat = suspect && (suspect.mode === "fight" || suspect.mode === "fleeFoot" || suspect.mode === "rampage");
      const score = d * (2 - facing) - (threat ? 8 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = { x, z, d, ...target };
      }
    };
    for (const ped of pedestrians.people) if (ped.mode !== "dead" && ped.rig.visible) consider(ped.x, ped.z, { ped });
    // (On duty, no friendly fire.)
    if (!onDuty) for (const officer of state.police) if (officer.onFoot && !officer.dead) consider(officer.x, officer.z, { officer });
    if (best) state.footYaw = Math.atan2(-(best.x - state.x), -(best.z - state.z));
    const aimYaw = state.footYaw || 0;
    handPosition(playerPerson, muzzle);
    muzzle.x += -Math.sin(aimYaw) * 0.25;
    muzzle.z += -Math.cos(aimYaw) * 0.25;
    const groundHere = state.y || 0;
    const hit = best && Math.random() < (best.d < stats.near ? stats.hitNear : stats.hitFar);
    if (best) {
      aimPoint.set(best.x, groundAt(best.x, best.z) + 1.25, best.z);
      if (!hit) {
        aimPoint.x += (Math.random() - 0.5) * 1.6;
        aimPoint.y += (Math.random() - 0.3) * 0.8;
        aimPoint.z += (Math.random() - 0.5) * 1.6;
      }
    } else {
      // Nothing to aim at: straight ahead, until a wall.
      aimPoint.set(state.x - Math.sin(aimYaw) * 30, groundHere + 1.3, state.z - Math.cos(aimYaw) * 30);
    }
    if (!hit) {
      bulletPath(muzzle.x, muzzle.z, aimPoint.x, aimPoint.z, shotEnd);
      aimPoint.x = shotEnd.x;
      aimPoint.z = shotEnd.z;
    }
    playerAim = (playerAim || new Vector3()).copy(aimPoint);
    const taser = playerWeapon === "taser";
    gunfire.fire(muzzle, aimPoint, taser ? "taser" : "pistol");
    if (taser) audio.taser?.();
    else audio.gunshot?.(playerWeapon === "pistol" ? 4 : 2, 0);
    shotEvents.length = 0;
    if (hit && best.ped && taser) {
      // The taser: a suspect goes down stunned; anyone else is just frightened (and it is misconduct).
      game.duty.tased(best.ped.suspect || null);
      if (!best.ped.suspect) pedestrians.frighten(best.ped.x, best.ped.z, 3, shotEvents);
    } else if (hit && best.ped) {
      pedestrians.shoot(best.ped, state.x, state.z, shotEvents);
    } else if (hit && best.officer) {
      // An officer shot dead: the most serious crime there is.
      const officer = best.officer;
      officer.dead = true;
      officer.aiming = false;
      blood.pool(officer.x, officer.z);
      impactPoint.set(officer.x, groundAt(officer.x, officer.z) + 1.1, officer.z);
      impactVelocity.set((officer.x - state.x) * 0.1, 1.2, (officer.z - state.z) * 0.1);
      blood.spray(impactPoint, impactVelocity, 24);
      const [distance, pan] = heard(officer.x, officer.z);
      audio.hurt?.(false, distance, pan);
      state.wanted = Math.min(5, Math.max(state.wanted, 3) + 1);
    } else {
      // A miss: a ricochet where it struck.
      sparks.emit(aimPoint.x, Math.max(aimPoint.y, groundAt(aimPoint.x, aimPoint.z) + 0.1), aimPoint.z, 0, 0, 0, 0, 4);
    }
    // Shots fired: everyone around runs, and the police (if anywhere near) are after an armed suspect.
    if (!taser) pedestrians.frighten(state.x, state.z, 35, shotEvents);
    processPedEvents(shotEvents, state);
    if (onDuty) return;
    state.gunfire = 15;
    if (state.police.some((o) => !o.dead && Math.hypot(o.x - state.x, o.z - state.z) < 80) || state.heli) {
      state.wanted = Math.min(5, Math.max(state.wanted, 1) + 0.15);
    }
  }
  /** The police's shots this step (game.js): tracers from their pistols, hits on the player or the car. */
  function processPoliceShots(state) {
    for (const shot of state.shots) {
      const unit = shot.unit ?? -1;
      const person = officerPeople[unit];
      if (person && person.visible) handPosition(person, muzzle);
      else muzzle.set(shot.x0, groundAt(shot.x0, shot.z0) + 1.35, shot.z0);
      const targetHeight = shot.onFoot ? 1.2 : 0.9;
      aimPoint.set(shot.x1, groundAt(shot.x1, shot.z1) + targetHeight + (shot.hit ? 0 : (Math.random() - 0.3) * 0.8), shot.z1);
      if (!shot.hit) {
        bulletPath(muzzle.x, muzzle.z, aimPoint.x, aimPoint.z, shotEnd);
        aimPoint.x = shotEnd.x;
        aimPoint.z = shotEnd.z;
      }
      gunfire.fire(muzzle, aimPoint);
      const [distance, pan] = heard(muzzle.x, muzzle.z);
      audio.gunshot?.(distance, pan);
      if (shot.hit && shot.onFoot) {
        impactVelocity.set((aimPoint.x - muzzle.x) * 0.05, 1, (aimPoint.z - muzzle.z) * 0.05);
        blood.spray(aimPoint, impactVelocity, 10);
        audio.hurt?.(false, 3, 0);
      } else if (shot.hit) {
        // Into the car's bodywork: sparks and a ping.
        sparks.emit(aimPoint.x, aimPoint.y, aimPoint.z, (muzzle.x - aimPoint.x) * 0.05, (muzzle.z - aimPoint.z) * 0.05, 0, 0, 6);
        audio.ping?.(3);
      } else {
        sparks.emit(aimPoint.x, Math.max(aimPoint.y, groundAt(aimPoint.x, aimPoint.z) + 0.1), aimPoint.z, 0, 0, 0, 0, 3);
      }
    }
    if (state.shots.length) {
      shotEvents.length = 0;
      pedestrians.frighten(state.shots[0].x0, state.shots[0].z0, 30, shotEvents);
      processPedEvents(shotEvents, state);
    }
  }
  /** Arms up and pistols in hand: the officers aiming, and the player while their gun is up. */
  function poseGuns(state) {
    const aimArms = (limbs) => {
      limbs.ra.rotation.set(1.5, 0, -0.08);
      limbs.la.rotation.set(1.38, 0, 0.42);
      limbs.re.rotation.set(0.08, 0, 0);
      limbs.le.rotation.set(0.3, 0, 0);
    };
    officerPeople.forEach((person, index) => {
      const officer = state.police[index];
      const limbs = person.userData.L;
      if (!limbs) return;
      // (The shape-built officers keep their arms' sideways turn: clear it when not aiming.)
      limbs.ra.rotation.z = 0;
      limbs.la.rotation.z = 0;
      if (!person.visible || !officer.onFoot || !officer.aiming || officer.down > 0 || officer.dead) return;
      aimArms(limbs);
      handPosition(person, handPoint);
      aimPoint.set(state.x, (state.y || 0) + (state.onFoot ? 1.2 : 0.9), state.z);
      gunfire.holdPistol(handPoint, aimPoint);
    });
    if (playerAim && state.onFoot && playerPerson.visible && state.wasted <= 0) {
      const limbs = playerPerson.userData.L;
      if (limbs) aimArms(limbs);
      handPosition(playerPerson, handPoint);
      if (playerWeapon === "pistol") gunfire.holdPistol(handPoint, playerAim);
      else gunfire.holdWeapon(playerWeapon, handPoint, playerAim);
    }
  }
  /** Blood, voices and the crimes of the pedestrians' events (hit by cars, shot, screaming). */
  function processPedEvents(events, state) {
    for (let index = 0; index < events.length; index++) {
      const event = events[index];
      const [distance, pan] = heard(event.x, event.z);
      const female = event.ped.female;
      if (event.type === "killed" || event.type === "runOver") {
        const killed = event.type === "killed";
        // A body flying through the air gets motion vectors (no smearing) until it lies still.
        if (!movingBodies.has(event.ped)) {
          composer.taa?.track(event.ped.rig);
          movingBodies.add(event.ped);
        }
        impactPoint.set(event.x, groundAt(event.x, event.z) + (killed ? 1.0 : 0.3), event.z);
        impactVelocity.set(event.car.vx, killed ? 1.5 : 0.5, event.car.vz);
        const gun = !!event.car.gun; // (shot, not hit by a car)
        blood.spray(impactPoint, impactVelocity, gun ? 22 : Math.round(Math.min(70, (killed ? 14 : 6) + event.speed * 2.5)));
        if (!gun) audio.bodyHit?.(event.speed, distance, pan);
        if (killed) {
          audio.hurt?.(female, distance, pan);
          // Everyone around runs away screaming.
          pedestrians.frighten(event.x, event.z, 22, events);
          if (event.car.player) {
            event.ped.killedByPlayer = true;
            if (game.duty.duty.on) {
              // On duty: a suspect's death is judged by the job (suspectBodies.js); anyone else's is misconduct.
              if (!event.ped.suspect) game.duty.civilianKilled(gun);
            } else {
              const witnessed = state.police.some((officer) => Math.hypot(officer.x - event.x, officer.z - event.z) < 90);
              state.wanted = Math.min(5, (state.wanted || 0) + (witnessed ? 1 : 0.5));
            }
            if (!gun) state.shake = Math.min((state.shake || 0) + 0.25, 1.2);
          }
        }
      } else if (event.type === "land") {
        impactPoint.set(event.x, groundAt(event.x, event.z) + 0.2, event.z);
        impactVelocity.set(0, 0.5, 0);
        blood.spray(impactPoint, impactVelocity, Math.round(6 + event.strength * 3));
        audio.bodyHit?.(event.strength * 2, distance, pan);
      } else if (event.type === "scream") {
        audio.scream?.(female, distance, pan);
      } else if (event.type === "hurt") {
        audio.hurt?.(female, distance, pan);
      } else if (event.type === "talk") {
        audio.murmur?.(female, distance, pan);
      }
    }
  }
  function updatePedestrians(state, dt) {
    pedestrianCars.length = 0;
    if (!state.onFoot) {
      pedestrianCars.push({ x: state.x, z: state.z, heading: state.heading, vx: state.vx, vz: state.vz, player: true });
    }
    for (const officer of state.police) {
      if (officer.onFoot) continue;
      const speed = officer.speed || 0;
      pedestrianCars.push({
        x: officer.x,
        z: officer.z,
        heading: officer.heading,
        vx: -Math.sin(officer.heading) * speed,
        vz: -Math.cos(officer.heading) * speed,
        player: false,
      });
    }
    crowd.setView?.(camera);
    for (const car of game.traffic ? game.traffic.cars : []) {
      pedestrianCars.push({ x: car.x, z: car.z, heading: car.heading, vx: car.vx, vz: car.vz, player: false });
    }
    const events = pedestrians.update(dt, { cars: pedestrianCars, camera, phase: signalClock });
    processPedEvents(events, state);
    // The police job's suspects: their bodies placed and posed (before the crowd's bones are set).
    safely("suspects", () => policeJob.updateBodies(dt, state, performance.now()));
    for (const ped of movingBodies) {
      if (ped.mode !== "dead" || ped.dead?.settled) {
        composer.taa?.untrack(ped.rig);
        movingBodies.delete(ped);
      }
    }
    crowd.update();
    blood.update(dt);
  }
  /** The arrest scene: the player out of the car, hands up, then cuffed by an officer behind them. */
  function updateBusted(state) {
    cuffingOfficer.visible = state.busted > 0;
    if (!(state.busted > 0)) return;
    const t = state.busted;
    let x;
    let z;
    let facing;
    if (state.bustedOnFoot) {
      x = state.x;
      z = state.z;
      facing = state.footYaw || 0;
    } else {
      // Out of the driver's door, facing the car.
      x = state.x - Math.cos(state.heading) * 1.45;
      z = state.z + Math.sin(state.heading) * 1.45;
      facing = state.heading - Math.PI / 2;
    }
    const ground = terrainHeight(x, z);
    playerPerson.visible = true;
    playerPerson.scale.setScalar(1);
    playerPerson.position.set(x, ground, z);
    playerPerson.rotation.y = facing;
    const limbs = playerPerson.userData.L;
    for (const key of ["lh", "rh", "lk", "rk", "body"]) limbs[key].rotation.set(0, 0, 0);
    limbs.body.position.y = 0;
    if (t < 1.4) {
      // Hands up.
      limbs.la.rotation.set(2.75, 0, -0.3);
      limbs.ra.rotation.set(2.75, 0, 0.3);
      limbs.le.rotation.set(0.45, 0, 0);
      limbs.re.rotation.set(0.45, 0, 0);
      limbs.head.rotation.x = 0;
    } else {
      // Hands behind the back, head down.
      limbs.la.rotation.set(-0.5, 0, 0.12);
      limbs.ra.rotation.set(-0.5, 0, -0.12);
      limbs.le.rotation.set(0, 0, 1.35);
      limbs.re.rotation.set(0, 0, -1.35);
      limbs.head.rotation.x = -0.35;
      if (!cuffsHeard && t > 1.6) {
        cuffsHeard = true;
        audio.cuffs?.();
      }
    }
    // The officer steps in behind the player and takes their wrists.
    const forwardX = -Math.sin(facing);
    const forwardZ = -Math.cos(facing);
    const step = Math.min(1, t / 1.2);
    const back = 0.75 + (1 - step) * 2.5;
    const ox = x - forwardX * back;
    const oz = z - forwardZ * back;
    cuffingOfficer.position.set(ox, terrainHeight(ox, oz), oz);
    cuffingOfficer.rotation.set(0, facing, 0);
    if (step < 1) {
      animatePerson(cuffingOfficer, 1 / 60, ox, oz);
    } else {
      const officerLimbs = cuffingOfficer.userData.L;
      for (const key of ["lh", "rh", "lk", "rk", "body"]) officerLimbs[key].rotation.set(0, 0, 0);
      officerLimbs.la.rotation.set(t < 1.4 ? 1.5 : 0.75, 0, 0.12);
      officerLimbs.ra.rotation.set(t < 1.4 ? 1.5 : 0.75, 0, -0.12);
      officerLimbs.le.rotation.set(t < 1.4 ? 0.05 : 0.5, 0, 0);
      officerLimbs.re.rotation.set(t < 1.4 ? 0.05 : 0.5, 0, 0);
    }
  }
  /** The siren of the nearest chasing cruiser, the helicopter's rotor. */
  function updatePoliceSounds(state) {
    let sirenAt = null;
    const assisting = state.police.some((officer) => officer.assist);
    if (state.wanted > 0.15 || state.busted > 0 || assisting) {
      let nearest = Infinity;
      let nearestX = 0;
      let nearestZ = 0;
      for (const officer of state.police) {
        if (officer.onFoot || (assisting && !(state.wanted > 0.15) && !officer.assist)) continue;
        const d = Math.hypot(officer.x - state.x, officer.z - state.z);
        if (d < nearest) {
          nearest = d;
          nearestX = officer.x;
          nearestZ = officer.z;
        }
      }
      if (nearest < 160) {
        const [distance, pan] = heard(nearestX, nearestZ);
        sirenAt = { distance, pan };
      }
    }
    // An ambulance or fire truck on its way, siren wailing.
    for (const car of game.traffic ? game.traffic.cars : []) {
      if (car.mission !== "enroute") continue;
      const [distance, pan] = heard(car.x, car.z);
      if (distance < 160 && (!sirenAt || distance < sirenAt.distance)) sirenAt = { distance, pan };
    }
    let heliAt = null;
    if (state.heli) {
      const [distance, pan] = heard(state.heli.x, state.heli.z);
      heliAt = { distance: Math.hypot(distance, state.heli.y - (state.y || 0)), pan };
    }
    audio.police?.(sirenAt, heliAt);
  }
  // The car radio (radio.js): T, or the touch button, goes to the next station.
  let radioShown = null;
  let radioTouchHeld = false;
  let touchEHeld = false;
  /** H: the player's horn. People just ahead jump out of the way. */
  function honk() {
    const state = game.state;
    if (policeJob.playerLights) audio.airhorn?.();
    else audio.horn?.(2, 0);
    const events = [];
    pedestrians.frighten(state.x - Math.sin(state.heading) * 8, state.z - Math.cos(state.heading) * 8, 7, events);
    processPedEvents(events, state);
  }
  function switchRadio() {
    const station = audio.radioNext?.() ?? null;
    radioShown = { station, until: game.state.elapsed + 2.5 };
  }
  const keys = {};
  let frameId;
  let lastFrameTime = performance.now();
  let hudTimer = 0;
  let cameraYaw = 0;
  let footCameraYaw = 0;
  let cameraPitch = 0;
  let cameraZoom = 1;
  let dragPointer = null;
  let lastPointerX = 0;
  let lastPointerY = 0;
  const touchPoints = new Map();
  let pinchDistance = 0;
  const canvas = renderer.domElement;
  function startCameraDrag(e) {
    if (e.pointerType === "touch") {
      e.preventDefault();
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      canvas.setPointerCapture(e.pointerId);
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        pinchDistance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        dragPointer = null;
        return;
      }
      dragPointer = e.pointerId;
    } else {
      if (e.button !== 2) {
        return;
      }
      e.preventDefault();
      dragPointer = e.pointerId;
      canvas.setPointerCapture(e.pointerId);
    }
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function moveCameraDrag(e) {
    if (e.pointerType === "touch" && touchPoints.has(e.pointerId)) {
      touchPoints.set(e.pointerId, {
        x: e.clientX,
        y: e.clientY,
      });
      if (touchPoints.size >= 2) {
        const points = [...touchPoints.values()];
        const distance = Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
        if (pinchDistance > 0 && distance > 0) {
          cameraZoom = Math.max(0.45, Math.min(2.8, (cameraZoom * pinchDistance) / distance));
        }
        pinchDistance = distance;
        return;
      }
    }
    if (e.pointerId !== dragPointer) {
      return;
    }
    const yawDelta = -(e.clientX - lastPointerX) * 0.005;
    cameraYaw += yawDelta;
    if (game.state.onFoot) {
      footCameraYaw += yawDelta;
    }
    cameraPitch = Math.max(-0.45, Math.min(0.55, cameraPitch + (e.clientY - lastPointerY) * 0.004));
    lastPointerX = e.clientX;
    lastPointerY = e.clientY;
  }
  function stopCameraDrag(e) {
    if (e.pointerType === "touch") {
      touchPoints.delete(e.pointerId);
      pinchDistance = 0;
      dragPointer = null;
      if (touchPoints.size === 1) {
        const [pointerId, point] = [...touchPoints.entries()][0];
        dragPointer = pointerId;
        lastPointerX = point.x;
        lastPointerY = point.y;
      }
    } else if (e.pointerId === dragPointer) {
      dragPointer = null;
    }
  }
  function preventCameraMenu(e) {
    e.preventDefault();
  }
  function zoomCamera(e) {
    e.preventDefault();
    cameraZoom = Math.max(0.45, Math.min(2.8, cameraZoom * Math.exp(e.deltaY * 0.001)));
  }
  function addInteractionDoor() {
    interaction.door = playerCar.userData.accessDoor;
    if (interaction.door) {
      interaction.door.rotation.set(0, 0, 0);
    }
  }
  function removeInteractionDoor() {
    if (!interaction?.door) {
      return;
    }
    interaction.door.rotation.set(0, 0, 0);
    interaction.door = null;
  }
  canvas.addEventListener("pointerdown", startCameraDrag);
  canvas.addEventListener("pointermove", moveCameraDrag);
  canvas.addEventListener("pointerup", stopCameraDrag);
  canvas.addEventListener("pointercancel", stopCameraDrag);
  canvas.addEventListener("contextmenu", preventCameraMenu);
  canvas.addEventListener("wheel", zoomCamera, {
    passive: false,
  });
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  let shadowFrameCounter = 0;
  let qualityChoice = storedQuality();
  let resolutionScale = 1;
  let windowTime = 0;
  let windowFrames = 0;
  // Shadows are cheap to refresh now that the static world's are cached (shadowCache.js): every frame.
  const shadowFrameInterval = 1;
  const pacer = createFramePacer({ minFps: 30 });
  let slowWindows = 0;
  let fastWindows = 0;
  let fastWindowsNeeded = 4;
  let lastRaise = -Infinity;
  let skipWindow = false;
  audio.ready.catch(() => {});
  const CHEATS = ["HESOYAM", "TURTLE", "PAINKILLER", "LAWYERUP", "FUGITIVE"];
  let cheatBuffer = "";
  const onKeyDown = (e) => {
    audio.resume();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;
    // Cheat codes: the last letters typed.
    if (!e.repeat && /^Key[A-Z]$/.test(e.code)) {
      cheatBuffer = (cheatBuffer + e.code.slice(3)).slice(-12);
      for (const code of CHEATS) {
        if (cheatBuffer.endsWith(code) && game.cheat(code)) {
          cheatBuffer = "";
          break;
        }
      }
    }
    if (e.code === "KeyE" && !e.repeat && !game.state.onFoot && game.state.station >= 0) {
      callbacks.current.onStation();
    }
    if (e.code === "KeyE" && !e.repeat && game.state.onFoot) policeJob.interact();
    if (e.code === "KeyT" && !e.repeat && !game.state.onFoot) switchRadio();
    if (e.code === "KeyH" && !e.repeat && !game.state.onFoot) honk();
    if (e.code === "Escape" && !e.repeat) {
      callbacks.current.onPause();
    }
  };
  const onKeyUp = (e) => {
    keys[e.code] = false;
  };
  const onBlur = () => {
    Object.keys(keys).forEach((e) => (keys[e] = false));
  };
  const onPointerDown = () => audio.resume();
  const onVisibilityChange = () => {
    if (!document.hidden) {
      audio.resume();
    }
  };
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("keyup", onKeyUp);
  window.addEventListener("blur", onBlur);
  window.addEventListener("pointerdown", onPointerDown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  camera.position.set(0, 9, 85);
  const lookTarget = new Vector3();
  const cameraTarget = new Vector3();
  const shakeOffset = new Vector3();
  const shadowCenter = new Vector3(0, 0, 70);
  let shadowsDue = true;
  let inCityEnvironment = () => {};
  let disposed = false;
  const reportedErrors = new Set();
  function reportFrameError(part, error) {
    if (reportedErrors.has(part)) return;
    reportedErrors.add(part);
    console.error(`Drift Fury: ${part} failed (the game keeps going without it)`, error);
  }
  /** Runs one optional part of the frame; if it throws, the rest of the frame still happens. */
  function safely(part, run) {
    try {
      return run();
    } catch (error) {
      reportFrameError(part, error);
      return undefined;
    }
  }
  function frame(time) {
    frameId = requestAnimationFrame(frame);
    // Adaptive frame pacing (framePacer.js): skip this screen refresh to keep a steady frame rate.
    if (!pacer.tick(time)) return;
    const frameSeconds = (time - lastFrameTime) / 1000;
    const dt = Math.min(frameSeconds, 0.04);

    // a frame longer than a second means the tab was hidden, not that the game is slow
    lastFrameTime = time;
    if (frameSeconds < 1) {
      windowTime += frameSeconds;
      windowFrames++;
    }
    if (windowTime > 1) {
      const averageFrame = windowTime / windowFrames;
      let nextScale = resolutionScale;
      // resizing reallocates every post-processing target, so only react to sustained trends and
      // back off when a resolution increase did not hold
      if (skipWindow) {
        skipWindow = false;
      } else {
        // The frame pacer lowers the frame rate first (keeping the image); the resolution only drops when
        // even its slowest steady rate (30 fps) cannot be held, and comes back when there is headroom.
        slowWindows = pacer.overloaded ? slowWindows + 1 : 0;
        fastWindows =
          !pacer.overloaded && pacer.jitter < 0.1 && averageFrame < (1 / pacer.targetFps) * 1.08
            ? fastWindows + 1
            : 0;
        if (slowWindows >= 2) {
          const level = QUALITY_LEVELS.indexOf(view.quality);
          if (qualityChoice === "auto" && resolutionScale <= 0.8 && level > 0) {
            // Sustained slow frames in auto mode: drop the costliest effects before blurring the image
            // further, and give some resolution back.
            view.applyQuality(QUALITY_LEVELS[level - 1]);
            nextScale = Math.min(1, resolutionScale + 0.1);
          } else {
            nextScale = Math.max(0.75, resolutionScale - 0.1); // below this, lines and crossings break up
          }
          if (performance.now() - lastRaise < 8000) {
            fastWindowsNeeded = Math.min(32, fastWindowsNeeded * 2);
          }
        } else if (fastWindows >= fastWindowsNeeded) {
          nextScale = Math.min(1, resolutionScale + 0.05);
          lastRaise = performance.now();
        }
      }
      // The base ratio follows the window size (entering fullscreen raises the pixel count).
      const base = gamePixelRatio(container.clientWidth, container.clientHeight, touchDevice, view.quality);
      if (nextScale !== resolutionScale || Math.abs(base * nextScale - renderer.getPixelRatio()) > 0.02) {
        if (nextScale !== resolutionScale) {
          slowWindows = 0;
          fastWindows = 0;
          skipWindow = true;
        }
        resolutionScale = nextScale;
        renderer.setPixelRatio(base * resolutionScale);
        composer.setPixelRatio(base * resolutionScale);
        composer.setSize(container.clientWidth, container.clientHeight);
      }
      windowTime = 0;
      windowFrames = 0;
    }
    // One part of the frame failing (a sound, an effect) must never stop the rest: the cars, the
    // people and the picture are always updated and drawn.
    try {
    const state = game.state;
    if (controls.current.paused) {
      audio.update(state.rpm, 0, true, false, state);
      audio.playerSiren?.(null);
    } else {
      const wasOnFoot = state.onFoot;
      const oldX = state.x;
      const oldZ = state.z;
      game.update(
        dt,
        {
          ...keys,
          ...controls.current.keys,
          ...(interaction
            ? {
                ArrowUp: false,
                ArrowDown: false,
                ArrowLeft: false,
                ArrowRight: false,
                KeyW: false,
                KeyA: false,
                KeyS: false,
                KeyD: false,
                KeyZ: false,
                KeyQ: false,
                KeyF: false,
                Space: false,
              }
            : {}),
        },
        game.state.onFoot ? footCameraYaw : game.state.heading + cameraYaw,
      );
      if (wasOnFoot !== state.onFoot) {
        if (state.onFoot) {
          footCameraYaw = state.heading + cameraYaw;
        } else {
          cameraYaw = footCameraYaw - state.heading;
        }
      }
      if (wasOnFoot !== state.onFoot) {
        interaction = {
          direction: state.onFoot ? "exit" : "enter",
          elapsed: 0,
          duration: 1.3,
          carX: state.onFoot ? oldX : state.x,
          carZ: state.onFoot ? oldZ : state.z,
          heading: state.heading,
          startX: oldX,
          startZ: oldZ,
          endX: state.x,
          endZ: state.z,
          door: null,
        };
      }
      // The moon follows the player, including up the mountain, and shines from where the moon is drawn
      // in the sky. Its 180 m shadow box is centred on the car: turning or drifting never moves it, so the
      // cached shadows of the world (shadowCache.js) are only redrawn as the car travels.
      shadowCenter.set(state.x, state.y || 0, state.z);
      shadowFrameCounter++;
      if (shadowFrameCounter >= shadowFrameInterval) {
        shadowsDue = true;
        shadowFrameCounter = 0;
      }
      if (state._crash) {
        const crash = state._crash;
        effects.crash(crash.x, crash.y, crash.z, crash.intensity);
        audio.crash(crash.intensity);
        if (crash.nx !== undefined && !state.onFoot) {
          // Visible damage where it hit (carDamage.js), and sparks off the bodywork.
          const cos = Math.cos(state.heading);
          const sin = Math.sin(state.heading);
          const localX = crash.nx * cos - crash.nz * sin;
          const localZ = crash.nx * sin + crash.nz * cos;
          safely("car damage", () => {
            playerCar.userData.damage ??= createCarDamage(playerCar);
            const broke = playerCar.userData.damage.hit(localX, localZ, crash.intensity);
            if (broke.glass || broke.lights.length) audio.glass?.(crash.intensity);
          });
          if (crash.intensity > 0.3) {
            const [px, pz] = contactPoint(state, crash.nx, crash.nz);
            sparks.emit(px, (state.y || 0) + 0.5, pz, -crash.nx, -crash.nz, state.vx, state.vz, Math.round(crash.intensity * 28));
          }
        }
        state._crash = null;
      }
      // Grinding along a wall or a car: a stream of sparks and the screech of metal.
      if (state._scrape && !state.onFoot) {
        const scrape = state._scrape;
        const [px, pz] = contactPoint(state, scrape.nx, scrape.nz);
        sparks.emit(px, (state.y || 0) + 0.35 + Math.random() * 0.3, pz, -scrape.nx, -scrape.nz, state.vx, state.vz, Math.min(8, 2 + Math.round(scrape.speed / 5)));
        safely("scrape sound", () => audio.scrape?.(Math.min(1, scrape.speed / 18)));
        sparkLight = { x: px, y: (state.y || 0) + 0.5, z: pz, flicker: 0.6 + Math.random() * 0.4 };
      } else {
        safely("scrape sound", () => audio.scrape?.(0));
        sparkLight = null;
      }
      state._scrape = null;
      if (state.playerVeh.spec !== playerCarSpec) {
        swapPlayerCar(state.playerVeh);
      }
      if (interaction && interaction.door?.parent !== playerCar) {
        addInteractionDoor();
      }
      playerCar.visible = !state.onFoot || interaction?.direction === "exit";
      const hiddenBeams = playerCar.visible ? 0 : (playerCar.userData.headlightBeams || []).length;
      spareBeams.forEach((beam, index) => (beam.visible = index < hiddenBeams));
      if (!state.onFoot) {
        playerCar.position.set(state.x, (state.y || 0) + 0.12, state.z);
        sitOnGround(
          playerCar,
          state.x,
          state.z,
          state.heading,
          state.drifting ? Math.sin(state.elapsed * 7) * 0.015 : 0,
        );
        playerCar.userData.wheels.forEach((e) => (e.rotation.x -= state.speed * 0.01 * dt));
        playerCar.userData.updateWheels?.();
        const braking = state.brake > 0 || (state.speed > 5 && state.throttle === 0);
        // Tail lights are on at night; braking makes them flare.
        playerCar.userData.brakeLights.forEach((t) => (t.material.emissiveIntensity = braking ? 2.6 : 0.6));
      }
      safely("police job", () => {
        policeJob.frame(state, playerCar, playerPerson, time);
        // (The touch button presses E through the controls: the same as the key on foot.)
        const touchE = !!controls.current.keys.KeyE;
        if (touchE && !touchEHeld && state.onFoot) policeJob.interact();
        touchEHeld = touchE;
      });
      playerPerson.visible = !!state.onFoot;
      playerPerson.rotation.x = 0;
      if (state.wasted > 0) {
        // Shot down: lying face down where they fell.
        playerPerson.visible = true;
        playerPerson.position.set(state.wastedX, (state.y || 0) + 0.13, state.wastedZ);
        playerPerson.rotation.set(-Math.PI / 2, state.footYaw || 0, 0);
      } else if (state.onFoot) {
        playerPerson.position.set(state.x, state.y || 0, state.z);
        playerPerson.rotation.y = state.footYaw || 0;
        animatePerson(playerPerson, dt, state.x, state.z);
      }
      if (state.respawned) {
        // Back at the hospital or the police station: the camera starts behind the player there.
        respawnMessageKind = state.respawned;
        respawnMessageUntil = state.elapsed + 5;
        interaction = null;
        footCameraYaw = state.heading;
        cameraYaw = 0;
        playerAim = null;
        gunDrawn = 0;
        composer.taa?.reset();
        camera.position.set(
          state.x + Math.sin(state.heading) * 9,
          (state.y || 0) + 6,
          state.z + Math.cos(state.heading) * 9,
        );
      }
      policeCars.forEach((policeCar, index) => {
        const officer = state.police[index];
        policeCar.visible = !officer.onFoot;
        if (!officer.onFoot) {
          policeCar.position.set(officer.x, terrainHeight(officer.x, officer.z) + 0.1, officer.z);
          sitOnGround(policeCar, officer.x, officer.z, officer.heading);
        }
        policeCar.userData.blue = Math.sin(time * 0.018) > 0;
        policeCar.userData.red = !policeCar.userData.blue;
      });
      officerPeople.forEach((person, index) => {
        const officer = state.police[index];
        person.visible = !!officer.onFoot && !(state.busted > 0 && index === state.bustedBy);
        if (officer.onFoot) {
          const down = officer.down > 0 || officer.dead;
          person.position.set(officer.x, terrainHeight(officer.x, officer.z) + (down ? 0.13 : 0), officer.z);
          person.rotation.y = officer.heading;
          // Knocked down: face down in the street, until they get up.
          person.rotation.x = down ? -Math.PI / 2 : 0;
          if (!down) animatePerson(person, dt, officer.x, officer.z);
        }
      });
      if (state._officerHit) {
        const hit = state._officerHit;
        state._officerHit = null;
        const [distance, pan] = heard(hit.x, hit.z);
        impactPoint.set(hit.x, groundAt(hit.x, hit.z) + 1.0, hit.z);
        impactVelocity.set(hit.vx, 1.5, hit.vz);
        blood.spray(impactPoint, impactVelocity, Math.round(Math.min(60, 12 + hit.speed * 2.5)));
        audio.bodyHit?.(hit.speed, distance, pan);
        audio.hurt?.(false, distance, pan);
      }
      // Officers behind a roadblock, weapons drawn on the approaching player.
      roadblockOfficers.forEach((person, index) => {
        const spot = state.roadblock?.officers[index];
        person.visible = !!spot;
        if (!spot) return;
        person.position.set(spot.x, terrainHeight(spot.x, spot.z), spot.z);
        person.rotation.y = Math.atan2(-(state.x - spot.x), -(state.z - spot.z));
        const limbs = person.userData.L;
        limbs.la.rotation.set(1.45, 0, 0.18);
        limbs.ra.rotation.set(1.5, 0, -0.12);
        limbs.le.rotation.x = 0.05;
        limbs.re.rotation.x = 0.05;
      });
      safely("arrest scene", () => updateBusted(state));
      heliLight = safely("helicopter", () => helicopter.update(state.heli, dt, state.elapsed, groundAt)) ?? null;
      safely("guns", () => {
        updatePlayerGun(state, dt);
        processPoliceShots(state);
        gunfire.update(dt, camera);
        poseGuns(state);
      });
      syncTrafficCars();
      safely("traffic", () => updateTraffic(state, dt));
      safely("fires", () => {
        // Explosions: fireball, debris, the blast (people thrown), the boom.
        for (const blast of state.explosions) {
          const y = groundAt(blast.x, blast.z);
          fire.explode(blast.x, y, blast.z);
          effects.crash(blast.x, y + 0.6, blast.z, 1.5);
          const [distance, pan] = heard(blast.x, blast.z);
          audio.explosion?.(distance, pan);
          shotEvents.length = 0;
          pedestrians.blast(blast.x, blast.z, 7, shotEvents);
          pedestrians.frighten(blast.x, blast.z, 45, shotEvents);
          processPedEvents(shotEvents, state);
        }
        emergency.update(state, dt);
        const sources = emergency.fireSources(state);
        fire.burn(sources, dt);
        fire.update(dt, camera);
        let nearest = Infinity;
        for (const source of sources) nearest = Math.min(nearest, Math.hypot(source.x - camera.position.x, source.z - camera.position.z));
        audio.fire?.(Math.min(1, 10 / Math.max(10, nearest)) * (sources.length ? 1 : 0), emergency.spraying);
      });
      if (state._playerHit) {
        const hit = state._playerHit;
        state._playerHit = null;
        impactPoint.set(hit.x, groundAt(hit.x, hit.z) + 1, hit.z);
        impactVelocity.set(0, 1.2, 0);
        blood.spray(impactPoint, impactVelocity, 14);
        audio.bodyHit?.(hit.speed, 2, 0);
        audio.hurt?.(false, 2, 0);
      }
      if (state._robbery) {
        state._robbery = null;
        audio.scream?.(Math.random() < 0.5, 4, 0);
      }
      safely("jobs", () => {
        const job = state.job;
        jobMarker.visible = !!job;
        if (job) {
          const m = job.marker;
          const pulse = 1 + Math.sin(state.elapsed * 4) * 0.06;
          jobMarker.position.set(m.x, groundAt(m.x, m.z) + 14, m.z);
          jobMarker.scale.set(m.radius * pulse, 28, m.radius * pulse);
          markerMaterial.color.copy(JOB_COLOURS[job.kind] || JOB_COLOURS.taxi);
        }
        // At the pickup: the client (on the sidewalk side of the marker, waving) or the package.
        const waiting = job && job.stage === "pickup";
        jobClient.visible = waiting && job.kind === "taxi";
        jobPackage.visible = waiting && job.kind === "delivery";
        if (waiting) {
          const m = job.marker;
          const kerbX = m.x + Math.sign(m.x - Math.round(m.x / 60) * 60 || 1) * 4.5 * (Math.abs(m.x - Math.round(m.x / 60) * 60) < 9 ? 1 : 0);
          const kerbZ = m.z + Math.sign(m.z - Math.round((m.z - 20) / 50) * 50 - 20 || 1) * 4.5 * (Math.abs(m.x - Math.round(m.x / 60) * 60) < 9 ? 0 : 1);
          if (jobClient.visible) {
            jobClient.position.set(kerbX, groundAt(kerbX, kerbZ), kerbZ);
            jobClient.rotation.y = Math.atan2(-(state.x - kerbX), -(state.z - kerbZ));
            animatePerson(jobClient, dt, kerbX, kerbZ);
            const limbs = jobClient.userData.L;
            if (limbs) {
              limbs.ra.rotation.set(2.6, 0, -0.3 + Math.sin(state.elapsed * 7) * 0.35);
              limbs.re.rotation.x = 0.3;
            }
          }
          if (jobPackage.visible) {
            jobPackage.position.set(kerbX, groundAt(kerbX, kerbZ) + 0.21, kerbZ);
            jobPackage.rotation.y = 0.4;
          }
        }
        for (const news of state.jobEvents) {
          if (news.type === "done" || news.type === "checkpoint" || news.type === "stage") audio.chime?.(news.type === "done" ? 2 : 1);
          else if (news.type === "failed") audio.chime?.(0);
          jobNews = { ...news, until: state.elapsed + 4 };
        }
        for (const money of state.cashEvents) cashPops.push({ amount: money.amount, until: state.elapsed + 3 });
        while (cashPops.length && cashPops[0].until < state.elapsed) cashPops.shift();
        for (const notice of state.notices) noticeShown = { ...notice, until: state.elapsed + 3.5 };
        if (state.cheatNotice) {
          noticeShown = { key: "hud.cheat", amount: state.cheatNotice, until: state.elapsed + 3.5 };
          state.cheatNotice = null;
          audio.chime?.(1);
        }
        // Hidden packages: the ones near enough to see, spinning; a chime and saved when one is found.
        let anyNear = false;
        game.packages.spots.forEach((spot, id) => {
          const near = !game.packages.found.has(id) && Math.abs(spot.x - state.x) < 110 && Math.abs(spot.z - state.z) < 110;
          anyNear ||= near;
          packageDummy.position.set(spot.x, packageBaseY[id] + Math.sin(state.elapsed * 2.5 + id) * 0.12, spot.z);
          packageDummy.rotation.set(0, state.elapsed * 2.2, 0);
          packageDummy.scale.setScalar(near ? 1 : 0);
          packageDummy.updateMatrix();
          packageMesh.setMatrixAt(id, packageDummy.matrix);
        });
        packageMesh.visible = anyNear;
        packageMesh.instanceMatrix.needsUpdate = true;
        if (state.packageFound !== undefined && state.packageFound !== null) {
          state.packageFound = null;
          audio.chime?.(2);
          try {
            localStorage.setItem(PACKAGE_SAVE, JSON.stringify([...game.packages.found]));
          } catch {
            // (not saved)
          }
        }
      });
      if (state._carjack) {
        const jack = state._carjack;
        state._carjack = null;
        safely("carjack", () => {
          const events = [];
          pedestrians.ejectDriver(jack.x, jack.z, jack.fromX, jack.fromZ, trafficWorld.camera.dirX, trafficWorld.camera.dirZ, events);
          for (const event of events) {
            const [distance, pan] = heard(event.x, event.z);
            audio.scream?.(event.ped.female, distance, pan);
          }
        });
      }
      if (interaction) {
        // (Real time, not the step's capped time: on a slow frame rate getting in or out of the car would
        // otherwise drag on for many seconds before the player could move.)
        interaction.elapsed += Math.min(frameSeconds, 0.25);
        const time = Math.min(interaction.elapsed / interaction.duration, 1);
        const ease = (e) => e * e * (3 - 2 * e);
        const open = ease(Math.min(time / 0.2, 1)) * (1 - ease(Math.max(0, (time - 0.78) / 0.22)));
        if (interaction.door) {
          interaction.door.rotation.y = -open * 1.12;
        }
        const sideX = interaction.carX - Math.cos(interaction.heading) * 1.45;
        const sideZ = interaction.carZ + Math.sin(interaction.heading) * 1.45;
        if (interaction.direction === "exit") {
          const step = ease(Math.max(0, Math.min((time - 0.16) / 0.56, 1)));
          playerPerson.visible = true;
          const walkX = sideX + (interaction.endX - sideX) * step;
          const walkZ = sideZ + (interaction.endZ - sideZ) * step;
          playerPerson.position.set(walkX, terrainHeight(walkX, walkZ), walkZ);
          playerPerson.rotation.y = interaction.heading;
          playerPerson.scale.setScalar(0.78 + 0.22 * ease(Math.min(time / 0.42, 1)));
          playerCar.position.set(
            interaction.carX,
            terrainHeight(interaction.carX, interaction.carZ) + 0.1,
            interaction.carZ,
          );
          sitOnGround(playerCar, interaction.carX, interaction.carZ, interaction.heading);
        } else {
          const approach = ease(Math.min(time / 0.48, 1));
          const enter = ease(Math.max(0, Math.min((time - 0.42) / 0.34, 1)));
          playerPerson.visible = time < 0.84;
          const walkX =
            interaction.startX + (sideX - interaction.startX) * approach + (interaction.carX - sideX) * enter;
          const walkZ =
            interaction.startZ + (sideZ - interaction.startZ) * approach + (interaction.carZ - sideZ) * enter;
          playerPerson.position.set(
            walkX,
            terrainHeight(walkX, walkZ) + 0.12 * Math.sin(Math.PI * enter),
            walkZ,
          );
          playerPerson.rotation.y = interaction.heading;
          playerPerson.scale.setScalar(1 - 0.72 * enter);
        }
        const limbs = playerPerson.userData.L;
        if (limbs && time < 0.84) {
          const crouch = Math.sin(Math.PI * Math.min(time / 0.84, 1));
          limbs.body.position.y = 0.08 * crouch;
          limbs.body.rotation.x = -0.18 * crouch;
          limbs.la.rotation.x = -0.8 * crouch;
          limbs.ra.rotation.x = -0.8 * crouch;
          limbs.lh.rotation.x = 0.18 * crouch;
          limbs.rh.rotation.x = -0.18 * crouch;
        }
        if (time >= 1) {
          removeInteractionDoor();
          playerPerson.scale.setScalar(1);
          interaction = null;
        }
      }
      const speedFactor = Math.min(state.speed / 200, 1);
      updateTrafficLights(dt);
      updateWorld(state.elapsed);
      inCityEnvironment(state.x, state.z);
      composer.grading?.update(state.elapsed);
      // WASTED: the colour drains out of the picture.
      const saturation = composer.grading?.uniforms?.uSaturation;
      if (saturation) {
        baseSaturation ??= saturation.value;
        const target = state.wasted > 0 ? 0.08 : baseSaturation;
        saturation.value += (target - saturation.value) * (1 - Math.exp(-3 * dt));
      }
      const driving = !state.onFoot;
      const targetFov = driving ? 55 + speedFactor * 12 : 45;
      if (camera.fov !== targetFov) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
      const inStore = state.onFoot && state.store >= 0;
      // Driving: a low chase camera close behind the car, looking down the road ahead (horizon, sky and
      // the next bend in frame) rather than down at the roof. On foot it stays the higher follow view.
      const distanceBack = inStore ? 4.2 : driving ? 6.8 + speedFactor * 1.6 : 12;
      const heightAbove = inStore ? 2.2 : driving ? 2.45 + speedFactor * 0.35 : 7.5;
      const cameraHeading = state.onFoot ? footCameraYaw : state.heading + cameraYaw;
      const cameraDistance = Math.hypot(distanceBack, heightAbove - 1) * cameraZoom;
      const cameraAngle = Math.atan2(heightAbove - 1, distanceBack) + cameraPitch;
      cameraTarget.set(
        state.x + Math.sin(cameraHeading) * Math.cos(cameraAngle) * cameraDistance,
        (state.y || 0) + 1 + Math.sin(cameraAngle) * cameraDistance,
        state.z + Math.cos(cameraHeading) * Math.cos(cameraAngle) * cameraDistance,
      );
      // Never below the ground (mountain slopes behind the car).
      cameraTarget.y = Math.max(cameraTarget.y, terrainHeight(cameraTarget.x, cameraTarget.z) + 0.7);
      camera.position.lerp(cameraTarget, 1 - Math.exp(-dt * (state.onFoot ? 12 : 4.5)));
      if (state.shake > 0.01) {
        shakeOffset.set(
          (Math.random() - 0.5) * state.shake * 0.8,
          (Math.random() - 0.5) * state.shake * 0.5,
          (Math.random() - 0.5) * state.shake * 0.8,
        );
        camera.position.add(shakeOffset);
      }
      const lookAhead = driving && !inStore ? 7 + speedFactor * 4 : 0;
      lookTarget.set(
        state.x - Math.sin(cameraHeading) * lookAhead,
        (state.y || 0) + (driving ? 1.25 : 1),
        state.z - Math.cos(cameraHeading) * lookAhead,
      );
      camera.lookAt(lookTarget);
      if (state.busted > 0 || state.wasted > 0) {
        // The arrest (or the death), seen from beside: the camera slowly circles the player.
        const angle = (state.bustedOnFoot || state.wasted > 0 ? state.footYaw || 0 : state.heading) + 2.2 + (state.busted + state.wasted) * 0.18;
        const px = playerPerson.position.x;
        const pz = playerPerson.position.z;
        camera.position.set(px + Math.sin(angle) * 5.2, playerPerson.position.y + 2.1, pz + Math.cos(angle) * 5.2);
        lookTarget.set(px, playerPerson.position.y + 1.05, pz);
        camera.lookAt(lookTarget);
      }
      // Street-lamp lighting uses lamp positions in view space: update them for this frame's camera.
      camera.updateMatrixWorld();
      addCarLights(state, time);
      updateLamps(state.x, state.z, camera);
      effects.update(state, dt, camera);
      safely("sparks", () => sparks.update(dt));
      updatePedestrians(state, dt);
      updateHeadlights(state, dt);
      audio.update(state.rpm, state.pedal, controls.current.muted, state.drifting, state);
      safely("police sounds", () => updatePoliceSounds(state));
      safely("radio", () => {
        audio.radioAudible?.(!state.onFoot && state.wasted <= 0 && state.busted <= 0);
        // (The touch button presses KeyT through the controls.)
        const touchRadio = !!controls.current.keys.KeyT;
        if (touchRadio && !radioTouchHeld && !state.onFoot) switchRadio();
        radioTouchHeld = touchRadio;
      });
      if (wasOnFoot && !state.onFoot) {
        audio.startEngine();
      }
      hudTimer += dt;
      if (hudTimer > 0.09) {
        hudTimer = 0;
        callbacks.current.onHud({
          ...state,
          fps: pacer.fps,
          fpsTarget: pacer.targetFps,
          refreshHz: pacer.refreshHz,
          police: state.police.map((e) => ({
            ...e,
          })),
          rp: !state.noPolice,
          radio: radioShown && state.elapsed < radioShown.until ? { station: radioShown.station } : null,
          cash: state.cash,
          cashPops: cashPops.map((pop) => pop.amount),
          notice: noticeShown && state.elapsed < noticeShown.until ? noticeShown : null,
          jobNews: jobNews && state.elapsed < jobNews.until ? jobNews : null,
          job: state.job
            ? {
                kind: state.job.kind,
                stage: state.job.stage,
                timeLeft: state.job.timeLeft,
                distance: state.job.distance ?? 0,
                index: state.job.index ?? 0,
                count: state.job.checkpoints?.length ?? 0,
                reward: state.job.reward,
                // Which way the marker is from where the camera looks (0: straight ahead).
                bearing:
                  Math.atan2(-(state.job.marker.x - state.x), -(state.job.marker.z - state.z)) -
                  (state.onFoot ? footCameraYaw : state.heading + cameraYaw),
                markerX: state.job.marker.x,
                markerZ: state.job.marker.z,
              }
            : null,
          burning: state.burning > 0 && !state.onFoot,
          ...policeJob.hud(state, state.onFoot ? footCameraYaw : state.heading + cameraYaw),
          respawnMessage: state.elapsed < respawnMessageUntil ? respawnMessageKind : null,
          heliActive: !!state.heli && !state.heli.leaving,
          roadblockActive: !!state.roadblock,
        });
      }
      if (state.ended && !controls.current.finished) {
        controls.current.finished = true;
        controls.current.paused = true;
        callbacks.current.onFinish({
          ...state,
          credits: Math.floor(state.score / 12 + state.elapsed * 2 + state.cash),
        });
      }
    }
    } catch (error) {
      reportFrameError("frame", error);
    }
    carInstancer.update(camera);
    // Shadows last, once every car and person is in place for this frame (see shadowCache.js).
    if (shadowsDue) {
      shadowCache.update(shadowCenter.x, shadowCenter.y, shadowCenter.z);
      shadowsDue = false;
    }
    composer.taa?.beginFrame(camera);
    composer.render();
    composer.taa?.endFrame(camera);
  }
  // Black-screen watchdog: a short while after the session starts or the quality changes, look at the
  // finished image. A night city always has lit windows and lamps; an image with no light at all means an
  // effect silently failed on this GPU (multisampled HDR targets on some iPhones and iPads, for one). The
  // suspects are turned off one at a time, for this device only (remembered), looking again after each;
  // if nothing brings the image back, the quality steps down.
  let blackCheckFrames = 45;
  const blackRow = new Uint8Array(4 * 4096);
  function checkForBlackScreen() {
    if (blackCheckFrames <= 0 || --blackCheckFrames > 0) return;
    const gl = renderer.getContext();
    // A lost context reads back as black: that is not an effect failing (handled above).
    if (graphicsFailed || gl.isContextLost()) return;
    renderer.setRenderTarget(null);
    const width = Math.min(gl.drawingBufferWidth, 4096);
    let brightest = 0;
    for (const fraction of [0.3, 0.5, 0.7]) {
      gl.readPixels(
        0,
        Math.floor(gl.drawingBufferHeight * fraction),
        width,
        1,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        blackRow,
      );
      for (let i = 0; i < width * 4; i += 4) {
        brightest = Math.max(brightest, blackRow[i], blackRow[i + 1], blackRow[i + 2]);
      }
    }
    if (brightest > 4) return;
    // Turn the next suspect off for this device and look again.
    const [suspect] = view.suspects();
    if (suspect) {
      console.warn(`Black frame: turning ${suspect} off on this device.`);
      markFeatureBroken(suspect);
      view.applyQuality(view.quality);
      blackCheckFrames = 30;
    } else {
      graphicsFailure("shader");
    }
  }
  // Photo-scanned textures (downloaded in the background since the world started building).
  if (scannedTexturesRequested()) {
    const waitStart = Date.now();
    for (;;) {
      const { loaded, total, ready } = scannedTextureProgress();
      if (ready) break;
      await stage(0.48 + 0.2 * (loaded / Math.max(1, total)), t("stage.textures", { done: loaded, total }));
      // A very slow connection: start anyway, the textures will appear when they arrive.
      if (Date.now() - waitStart > 30000) break;
      await sleep(80);
    }
  }
  // Upload every texture to the GPU now rather than on the frame that first shows it.
  const textures = new Set();
  const collect = (value) => {
    if (value?.isTexture) textures.add(value);
  };
  scene.traverse((object) => {
    const materials = Array.isArray(object.material)
      ? object.material
      : object.material
        ? [object.material]
        : [];
    for (const material of materials) {
      for (const key of Object.keys(material)) collect(material[key]);
      if (material.uniforms) for (const uniform of Object.values(material.uniforms)) collect(uniform?.value);
    }
  });
  let uploaded = 0;
  for (const texture of textures) {
    if (texture.image && !texture.isRenderTargetTexture) renderer.initTexture(texture);
    if (++uploaded % 12 === 0)
      await stage(0.68 + 0.07 * (uploaded / textures.size), t("stage.upload"));
  }
  // City reflections: captured once from the middle of the grid at street level, used as the scene's
  // environment while the player is in the city (the night sky's elsewhere).
  await stage(0.76, t("stage.reflections"));
  const skyEnvironment = scene.environment;
  clearLamps();
  let cityEnvironment = captureCityEnvironment(renderer, scene, CITY_REFLECTION_PROBE, [playerCar]);
  // If the scanned textures were still on their way, retake it when they arrive.
  if (!scannedTextureProgress().ready && scannedTexturesRequested()) {
    scannedTexturesReady.then(() => {
      if (disposed) return;
      const previous = cityEnvironment;
      clearLamps();
      cityEnvironment = captureCityEnvironment(renderer, scene, CITY_REFLECTION_PROBE, [playerCar]);
      if (scene.environment === previous) scene.environment = cityEnvironment;
      previous.dispose();
    });
  }
  inCityEnvironment = (x, z) => {
    const inCity = z > -112 && x > -165 && x < 160;
    const environment = inCity ? cityEnvironment : skyEnvironment;
    if (scene.environment !== environment) scene.environment = environment;
  };
  // Every shader the session can need (the world, every traffic car look, police, effects), compiled in
  // parallel where the browser supports it.
  await stage(0.8, t("stage.shaders"));
  // Everything lit is lit by the world's lights too (clusteredLights.js); cars as they are set up.
  clusteredLights.patchAll(scene);
  // (The looks of the cars driving in traffic, so their shaders compile now too.)
  if (game.traffic) {
    for (const shape of [...CIVILIAN_SHAPES, "ambulance", "firetruck"]) trafficTemplate("#ffffff", shape, false, true);
  }
  // The streets filled with traffic before the session starts (a few seconds of driving, behind the
  // loading screen), so no car appears out of nowhere in front of the player.
  if (game.traffic) {
    for (let step = 0; step < 10; step++) updateTraffic(game.state, 1 / 30, true);
    for (let step = 0; step < 150; step++) updateTraffic(game.state, 1 / 30);
  }
  await warmUpSession(renderer, scene, camera, [car.shape], (template) => carInstancer.prepare(template));
  await stage(0.88, t("stage.sound"));
  await Promise.race([audio.ready.catch(() => {}), sleep(15000)]);
  // A few full renders around the map, so the shadow, ambient occlusion and post-processing passes, the
  // mountain's chunks and every texture have all been drawn once before the session starts.
  const warmUpViews = [
    [0, 9, 85, 0, 1, 50],
    [10, 3, 40, 2, 1, -20],
    [175, 4, -180, 175, 2, -260],
    [40, 30, -330, 30, 20, -420],
    [-60, 6, -20, 0, 1, -30],
  ];
  for (let index = 0; index < warmUpViews.length; index++) {
    await stage(0.9 + 0.09 * (index / warmUpViews.length), t("stage.warmup"));
    const [x, y, z, lx, ly, lz] = warmUpViews[index];
    camera.position.set(x, y, z);
    camera.lookAt(lx, ly, lz);
    camera.updateMatrixWorld();
    inCityEnvironment(x, z);
    updateLamps(x, z, camera);
    sun.position.set(x + MOON_DIRECTION.x * 127, MOON_DIRECTION.y * 127, z + MOON_DIRECTION.z * 127);
    sun.target.position.set(x, 0, z);
    sun.target.updateMatrixWorld();
    renderer.shadowMap.needsUpdate = true;
    // In the city and up the mountain (their two environments), everything hidden until needed is shown for
    // this render too: the player's car parked, the player on foot, the effects, the job's props. Their
    // shaders (every pass: colour, shadow, motion vectors) are compiled now, with the lighting they will be
    // drawn in, not on the frame they first appear (getting out of the car froze the game for seconds).
    const revealed = [];
    if (index === 0 || index === 3) {
      scene.traverse((object) => {
        if (object.visible || object.isLight) return;
        let lit = false;
        object.traverse((child) => {
          if (child.isLight) lit = true;
        });
        if (lit) return; // (a hidden light shown would change every shader's light count)
        object.visible = true;
        revealed.push(object);
      });
      // (Every one of them, wherever it is, for the colour pass; the player in view for the others.)
      renderer.compile(scene, camera);
      playerPerson.position.set(lx, ly - 1, lz);
      playerPerson.updateMatrixWorld(true);
    }
    composer.taa?.beginFrame(camera);
    composer.render();
    composer.taa?.endFrame(camera);
    for (const object of revealed) object.visible = false;
  }
  composer.taa?.reset();
  camera.position.set(0, 9, 85);
  await stage(1, t("stage.ready"));
  if (debugSession) {
    debugSession.fx = effects;
    debugSession.ready = true;
  }
  const session = {
    /** Starts the frame loop (once loading is done). */
    start() {
      // A few idle refreshes first to measure the screen's refresh rate for the frame pacer.
      const deltas = [];
      let previous = -1;
      const calibrate = (time) => {
        if (previous >= 0) deltas.push(time - previous);
        previous = time;
        if (deltas.length < 30) {
          frameId = requestAnimationFrame(calibrate);
          return;
        }
        pacer.calibrate(deltas);
        lastFrameTime = performance.now();
        frameId = requestAnimationFrame(frame);
        // The police job's cars, in the background now that the session runs.
        setTimeout(() => {
          if (!disposed) policeJob.loadModels();
        }, 2500);
      };
      frameId = requestAnimationFrame(calibrate);
    },
    /** Graphics quality from the pause menu: "auto" or a preset name. */
    setQuality(choice) {
      qualityChoice = choice;
      storeQuality(choice);
      view.applyQuality(resolveQuality(choice));
      resolutionScale = 1;
      skipWindow = true;
      blackCheckFrames = 45;
      pacer.reset();
      windowTime = 0;
      windowFrames = 0;
      const ratio = gamePixelRatio(container.clientWidth, container.clientHeight, touchDevice, view.quality);
      renderer.setPixelRatio(ratio);
      composer.setPixelRatio(ratio);
      composer.setSize(container.clientWidth, container.clientHeight);
    },
    setCar(e) {
      game.setCar(e);
      scene.remove(playerCar);
      composer.taa?.untrack(playerCar);
      playerCar.traverse((e) => {
        e.geometry?.dispose();
        e.material?.dispose();
      });
      playerCar = buildPlayerCar(e.color, e.shape);
      clusteredLights.patchAll(playerCar);
      scene.add(playerCar);
      trackMotion(playerCar);
      playerCarSpec = `player|${e.color}|${e.shape}`;
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(frameId);
      removeInteractionDoor();
      canvas.removeEventListener("pointerdown", startCameraDrag);
      canvas.removeEventListener("pointermove", moveCameraDrag);
      canvas.removeEventListener("pointerup", stopCameraDrag);
      canvas.removeEventListener("pointercancel", stopCameraDrag);
      canvas.removeEventListener("contextmenu", preventCameraMenu);
      canvas.removeEventListener("wheel", zoomCamera);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      policeJob.dispose();
      audio.close();
      shadowCache.dispose();
      view.dispose();
    },
  };
  // The pause menu reaches the live session through the shared controls ref.
  controls.current.setQuality = (choice) => session.setQuality(choice);
  return session;
}
