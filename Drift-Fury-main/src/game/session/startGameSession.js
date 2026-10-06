import { PointLight, Vector3 } from "three";
import { createAudio } from "../audio/createAudio.js";
import { createEffects } from "../effects/effects.js";
import { animatePerson, createPerson } from "../people/person.js";
import { createRenderer, gamePixelRatio } from "../render/renderer.js";
import { batchStaticMeshes } from "../render/staticBatching.js";
import { warmUpSession } from "../render/warmUp.js";
import { captureCityEnvironment } from "../render/reflectionProbe.js";
import { CITY_REFLECTION_PROBE } from "../render/wetSurface.js";
import { createGame } from "../simulation/game.js";
import { batchPlayerCar } from "../vehicles/batchPlayerCar.js";
import { buildCar } from "../vehicles/carModel.js";
import { createTrafficCar } from "../vehicles/trafficCars.js";
import { buildWorld } from "../world/buildWorld.js";
import { terrainHeight } from "../world/terrain.js";
import { MOON_DIRECTION } from "../world/sky.js";
export function startGameSession(container, car, engine, controls, callbacks, noPolice = false) {
  const view = createRenderer(container, true);
  const { scene, renderer, camera, sun, touchDevice, composer } = view;
  const { solids, lampPositions, signals, update: updateWorld } = buildWorld(scene);
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
  const staticBatch = batchStaticMeshes(scene, new Set(signals.flatMap((signal) => signal.lenses)), 96);
  const game = createGame(car, engine, solids, noPolice);
  const lampLights = [];
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
            material.emissiveIntensity = index === activeLens ? 1.35 : 0.025;
          });
        }
      }
    }
  }
  for (let slot = 0; slot < 6; slot++) {
    const light = new PointLight("#ffd9a0", 0.6, 26, 2);
    scene.add(light);
    lampLights.push({
      light,
    });
  }
  const lampDistances = new Float32Array(lampPositions.length || 1);
  const lampOrder = [];
  let lastLampX = Infinity;
  let lastLampZ = Infinity;
  function updateLampLights(x, z) {
    if ((x - lastLampX) ** 2 + (z - lastLampZ) ** 2 < 25) {
      return;
    }
    lastLampX = x;
    lastLampZ = z;
    const lamps = lampPositions;
    const count = lamps.length;
    for (let i = 0; i < count; i++) {
      const dx = lamps[i].x - x;
      const dz = lamps[i].z - z;
      lampDistances[i] = dx * dx + dz * dz;
      lampOrder[i] = i;
    }
    lampOrder.length = count;
    lampOrder.sort((e, t) => lampDistances[e] - lampDistances[t]);
    for (let slot = 0; slot < 6; slot++) {
      const lampLight = lampLights[slot];
      const lampIndex = lampOrder[slot];
      if (lampIndex == null) {
        lampLight.light.visible = false;
      } else {
        lampLight.light.position.set(lamps[lampIndex].x, lamps[lampIndex].y, lamps[lampIndex].z);
        lampLight.light.visible = true;
      }
    }
  }
  updateLampLights(0, 70);
  let interaction = null;
  let playerCar = batchPlayerCar(buildCar(car.color, car.shape, false, true));
  scene.add(playerCar);
  let playerCarSpec = game.state.playerVeh.spec;
  const policeCars = game.state.police.map(() => {
    const policeCar = createTrafficCar("#ffffff", "coupe", true);
    scene.add(policeCar);
    return policeCar;
  });
  const playerPerson = createPerson("#2f3b4c");
  playerPerson.visible = false;
  scene.add(playerPerson);
  const officerPeople = game.state.police.map(() => {
    const officer = createPerson("#1f2f4d");
    officer.visible = false;
    scene.add(officer);
    return officer;
  });
  const trafficCars = new Map();
  function swapPlayerCar(vehicle) {
    scene.remove(playerCar);
    playerCar.traverse((e) => {
      e.geometry?.dispose();
      e.material?.dispose();
    });
    playerCar = batchPlayerCar(buildCar(vehicle.color, vehicle.shape, vehicle.kind === "police", true));
    scene.add(playerCar);
    playerCarSpec = vehicle.spec;
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
            ? createTrafficCar("#ffffff", "coupe", true)
            : createTrafficCar(vehicle.color, vehicle.shape || "coupe");
        scene.add(carModel);
        entry = {
          car: carModel,
        };
        trafficCars.set(vehicle.id, entry);
      }
      entry.car.visible = true;
      entry.car.position.set(vehicle.x, terrainHeight(vehicle.x, vehicle.z) + 0.1, vehicle.z);
      sitOnGround(entry.car, vehicle.x, vehicle.z, vehicle.heading);
      if (
        interaction?.direction === "exit" &&
        Math.hypot(vehicle.x - interaction.carX, vehicle.z - interaction.carZ) < 0.5
      ) {
        entry.car.visible = false;
      }
    }
    for (let [id, entry] of trafficCars) {
      if (!activeIds.has(id)) {
        scene.remove(entry.car);
        if (!entry.car.userData.sharedTemplate) {
          entry.car.traverse((e) => {
            e.geometry?.dispose();
            e.material?.dispose();
          });
        }
        trafficCars.delete(id);
      }
    }
  }
  const audio = controls.current.audio || createAudio(engine);
  const effects = createEffects(scene);
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
  const basePixelRatio = renderer.getPixelRatio();
  const lowPowerDevice = !!(navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4);
  let resolutionScale = 1;
  let windowTime = 0;
  let windowFrames = 0;
  let shadowFrameInterval = touchDevice ? 2 : 1;
  let slowWindows = 0;
  let fastWindows = 0;
  let fastWindowsNeeded = 4;
  let lastRaise = -Infinity;
  let skipWindow = false;
  audio.ready.catch(() => {});
  const onKeyDown = (e) => {
    audio.resume();
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) {
      e.preventDefault();
    }
    keys[e.code] = true;
    if (e.code === "KeyE" && !e.repeat && !game.state.onFoot && game.state.station >= 0) {
      callbacks.current.onStation();
    }
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
  const shadowAhead = new Vector3();
  let inCityEnvironment = () => {};
  function frame(time) {
    frameId = requestAnimationFrame(frame);
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
      shadowFrameInterval = touchDevice ? 2 : averageFrame > 1 / 32 ? 3 : averageFrame > 1 / 48 ? 2 : 1;
      // resizing reallocates every post-processing target, so only react to sustained trends and
      // back off when a resolution increase did not hold
      if (skipWindow) {
        skipWindow = false;
      } else {
        slowWindows = averageFrame > 1 / 45 ? slowWindows + 1 : 0;
        fastWindows = averageFrame < 1 / 57 ? fastWindows + 1 : 0;
        if (slowWindows >= 2) {
          nextScale = Math.max(0.6, resolutionScale - 0.1);
          if (performance.now() - lastRaise < 8000) {
            fastWindowsNeeded = Math.min(32, fastWindowsNeeded * 2);
          }
        } else if (fastWindows >= fastWindowsNeeded) {
          nextScale = Math.min(1, resolutionScale + 0.05);
          lastRaise = performance.now();
        }
      }
      // The base ratio follows the window size (entering fullscreen raises the pixel count).
      const base = lowPowerDevice
        ? basePixelRatio
        : gamePixelRatio(container.clientWidth, container.clientHeight, touchDevice);
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
    const state = game.state;
    if (controls.current.paused) {
      audio.update(state.rpm, 0, true, false, state);
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
      // in the sky. Its 180 m shadow box is centred ahead of the player along the view, so it covers what
      // is on screen instead of the city behind the camera.
      camera.getWorldDirection(shadowAhead);
      shadowAhead.y = 0;
      if (shadowAhead.lengthSq() > 1e-6) shadowAhead.normalize().multiplyScalar(45);
      const shadowX = state.x + shadowAhead.x;
      const shadowZ = state.z + shadowAhead.z;
      sun.position.set(
        shadowX + MOON_DIRECTION.x * 127,
        (state.y || 0) + MOON_DIRECTION.y * 127,
        shadowZ + MOON_DIRECTION.z * 127,
      );
      sun.target.position.set(shadowX, state.y || 0, shadowZ);
      sun.target.updateMatrixWorld();
      shadowFrameCounter++;
      if (shadowFrameCounter >= shadowFrameInterval) {
        renderer.shadowMap.needsUpdate = true;
        shadowFrameCounter = 0;
      }
      updateLampLights(state.x, state.z);
      if (state._crash) {
        effects.crash(state._crash.x, state._crash.y, state._crash.z, state._crash.intensity);
        audio.crash(state._crash.intensity);
        state._crash = null;
      }
      if (state.playerVeh.spec !== playerCarSpec) {
        swapPlayerCar(state.playerVeh);
      }
      if (interaction && interaction.door?.parent !== playerCar) {
        addInteractionDoor();
      }
      playerCar.visible = !state.onFoot || interaction?.direction === "exit";
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
        const braking = state.brake > 0 || (state.speed > 5 && state.throttle === 0);
        // Tail lights are on at night; braking makes them flare.
        playerCar.userData.brakeLights.forEach((t) => (t.material.emissiveIntensity = braking ? 2.6 : 0.6));
      }
      playerPerson.visible = !!state.onFoot;
      if (state.onFoot) {
        playerPerson.position.set(state.x, state.y || 0, state.z);
        playerPerson.rotation.y = state.footYaw || 0;
        animatePerson(playerPerson, dt, state.x, state.z);
      }
      policeCars.forEach((policeCar, index) => {
        const officer = state.police[index];
        policeCar.visible = !officer.onFoot;
        if (!officer.onFoot) {
          policeCar.position.set(officer.x, terrainHeight(officer.x, officer.z) + 0.1, officer.z);
          sitOnGround(policeCar, officer.x, officer.z, officer.heading);
        }
        const blueLight =
          policeCar.userData.blueLight === undefined
            ? (policeCar.userData.blueLight = policeCar.getObjectByName("blue") || null)
            : policeCar.userData.blueLight;
        const redLight =
          policeCar.userData.redLight === undefined
            ? (policeCar.userData.redLight = policeCar.getObjectByName("red") || null)
            : policeCar.userData.redLight;
        if (blueLight) {
          blueLight.visible = !officer.onFoot && Math.sin(time * 0.018) > 0;
        }
        if (redLight) {
          redLight.visible = !officer.onFoot && Math.sin(time * 0.018) <= 0;
        }
      });
      officerPeople.forEach((person, index) => {
        const officer = state.police[index];
        person.visible = !!officer.onFoot;
        if (officer.onFoot) {
          person.position.set(officer.x, terrainHeight(officer.x, officer.z), officer.z);
          person.rotation.y = officer.heading;
          animatePerson(person, dt, officer.x, officer.z);
        }
      });
      syncTrafficCars();
      if (interaction) {
        interaction.elapsed += dt;
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
      effects.update(state, dt, camera);
      audio.update(state.rpm, state.pedal, controls.current.muted, state.drifting, state);
      if (wasOnFoot && !state.onFoot) {
        audio.startEngine();
      }
      hudTimer += dt;
      if (hudTimer > 0.09) {
        hudTimer = 0;
        callbacks.current.onHud({
          ...state,
          police: state.police.map((e) => ({
            ...e,
          })),
        });
      }
      if (state.ended && !controls.current.finished) {
        controls.current.finished = true;
        controls.current.paused = true;
        callbacks.current.onFinish({
          ...state,
          credits: Math.floor(state.score / 12 + state.elapsed * 2),
        });
      }
    }
    composer.render();
  }
  // City reflections: captured once from the middle of the grid at street level, used as the scene's
  // environment while the player is in the city (the night sky's elsewhere).
  const skyEnvironment = scene.environment;
  const cityEnvironment = captureCityEnvironment(renderer, scene, CITY_REFLECTION_PROBE, [playerCar]);
  inCityEnvironment = (x, z) => {
    const inCity = z > -112 && x > -165 && x < 160;
    const environment = inCity ? cityEnvironment : skyEnvironment;
    if (scene.environment !== environment) scene.environment = environment;
  };
  warmUpSession(renderer, scene, camera, [car.color]);
  if (debugSession) {
    debugSession.fx = effects;
  }
  frameId = requestAnimationFrame(frame);
  return {
    setCar(e) {
      game.setCar(e);
      scene.remove(playerCar);
      playerCar.traverse((e) => {
        e.geometry?.dispose();
        e.material?.dispose();
      });
      playerCar = batchPlayerCar(buildCar(e.color, e.shape, false, true));
      scene.add(playerCar);
      playerCarSpec = `player|${e.color}|${e.shape}`;
    },
    dispose() {
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
      audio.close();
      view.dispose();
    },
  };
}
