// The police job in the session (the simulation is policeDuty.js): the police cars of the fleet, loaded in
// the background once the session has started; the player's uniform; the suspects' bodies; the light bar
// and siren of the player's police car; the radio, the voices (dispatch, the people stopped, the player)
// and the sounds of the job; E at the locker (the duty menu) and next to people (stopping them).
import { Group } from "three";
import { loadPoliceModels } from "../vehicles/carModels.js";
import { trafficTemplate } from "../vehicles/trafficCars.js";
import { dressInUniform } from "../people/uniforms.js";
import { createSuspectBodies } from "./suspectBodies.js";
import { FLEET, LOCKER, SIREN_TONES } from "../simulation/policeDuty.js";
import { createSpeech } from "../audio/speech.js";
import { dutyText } from "../ui/dutyText.js";
import { ROAD_XS, ROAD_ZS } from "../data/roadGrid.js";

const SAVE = "drift-fury-police";
const LOCKER_RADIUS = 2.6;

export function createPoliceJob({
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
}) {
  const duty = game.duty;
  const speech = createSpeech();
  let modelsReady = false;
  let disposed = false;
  try {
    duty.restore(JSON.parse(localStorage.getItem(SAVE) || "null"));
  } catch {
    // (a fresh start)
  }
  let savedXp = duty.duty.xp;
  const bodies = createSuspectBodies({ pedestrians, groundAt, gunfire, handPosition, duty });
  let dressed = null;
  let dressedPerson = null;
  let lastHud = null;

  /** The fleet's cars, loaded and their shaders compiled in the background (RP mode only). */
  async function loadModels() {
    if (game.state.noPolice) return;
    await loadPoliceModels();
    if (disposed) return;
    for (const car of FLEET) carInstancer.prepare(trafficTemplate("#ffffff", car.model, true));
    // A player's copy of each (drawn far below the ground, for the compile only) and the new instanced
    // looks (shown for the compile): their shaders are ready before the first one appears.
    const temp = new Group();
    temp.position.set(0, -500, 0);
    for (const car of FLEET) {
      const built = buildPlayerCar("#ffffff", car.shape, true, car.model);
      clusteredLights.patchAll(built);
      built.traverse((object) => {
        object.castShadow = false;
      });
      temp.add(built);
    }
    const hidden = [];
    scene.traverse((object) => {
      if (object.userData?.carInstances && !object.visible) {
        object.visible = true;
        hidden.push(object);
      }
    });
    scene.add(temp);
    try {
      await renderer.compileAsync(scene, camera);
    } catch {
      // (compiled when first drawn instead)
    } finally {
      for (const object of hidden) object.visible = false;
      scene.remove(temp);
    }
    modelsReady = true;
  }

  // Speech: never more than a couple of lines queued (a stale one is dropped).
  let queued = 0;
  function say(text, kind) {
    if (controls.current.muted) return;
    if (queued > 2) {
      speech.cancel();
      queued = 0;
    }
    queued++;
    speech.say(text, kind, false);
    setTimeout(() => (queued = Math.max(0, queued - 1)), 2500 + text.length * 60);
  }

  return {
    /** Starts loading the fleet (once the session runs: not competing with the loading screen). */
    loadModels() {
      loadModels().catch((error) => console.warn("Police cars failed to load:", error));
    },
    get modelsReady() {
      return modelsReady;
    },
    /** The duty car (parked) flashes only with its lights on; other police cars always. */
    lightsOn(vehicle) {
      return !vehicle.duty || duty.duty.lights;
    },
    /** The player's police car: its light bar on (lights) and its siren (tone) heard. */
    get playerLights() {
      const state = game.state;
      return duty.duty.lights && !state.onFoot && state.playerVeh.kind === "police";
    },
    /** Emergency vehicles with sirens on that traffic pulls over for: the player's car, assisting units. */
    sirens(state, out) {
      out.length = 0;
      if (duty.duty.siren && !state.onFoot && state.playerVeh.kind === "police") out.push({ x: state.x, z: state.z, heading: state.heading });
      for (const officer of state.police) if (officer.assist && !officer.onFoot) out.push(officer);
      return out;
    },
    /** Each frame after the game's step: sounds and voices, the uniform, the light bar, the siren. */
    frame(state, playerCar, playerPerson, time) {
      const events = duty.duty.events.splice(0);
      for (const event of events) {
        if (event.type === "radio") {
          audio.radioBeep?.();
          say(dutyText(event.key, event.vars), "radio");
        } else if (event.type === "say") say(dutyText(event.key), event.female ? "female" : "male");
        else if (event.type === "playerSay") say(dutyText(event.key), "player");
        else if (event.type === "cuffs") audio.cuffs?.();
        else if (event.type === "chime" || event.type === "rankUp") audio.chime?.(2);
        else if (event.type === "strike") audio.chime?.(0);
        else if (event.type === "alert" || event.type === "offer") audio.chime?.(1);
        else if (event.type === "tackle") audio.bodyHit?.(5, 2, 0);
        else if (event.type === "punch") {
          audio.bodyHit?.(3, 2, 0);
          audio.hurt?.(false, 2, 0);
        }
      }
      // The uniform (scanned people only), on and off with the duty.
      const want = duty.duty.on ? duty.duty.outfit : "";
      if (want !== dressed || playerPerson !== dressedPerson) {
        dressed = want;
        dressedPerson = playerPerson;
        if (playerPerson.userData.animate) {
          const parts = dressInUniform(playerPerson, want || null);
          clusteredLights.patchAll(playerPerson);
          for (const part of parts) composer.taa?.track(part);
        }
      }
      // The light bar of the police car the player drives, flashing blue and red.
      const bar = playerCar.userData.lightBar;
      if (bar?.length) {
        const on = this.playerLights;
        const blue = Math.sin(time * 0.018) > 0;
        bar[0].visible = on && blue;
        bar[1].visible = on && !blue;
      }
      const siren = duty.duty.siren && !state.onFoot && state.playerVeh.kind === "police" && state.wasted <= 0;
      audio.playerSiren?.(siren ? SIREN_TONES[duty.duty.tone] : null);
      // Progress kept between games.
      if (duty.duty.xp !== savedXp) {
        savedXp = duty.duty.xp;
        try {
          localStorage.setItem(SAVE, JSON.stringify(duty.save()));
        } catch {
          // (not saved)
        }
      }
    },
    /** After the pedestrians' step, before the crowd is drawn: the suspects' bodies. */
    updateBodies(dt, state, time) {
      bodies.update(dt, state, time);
    },
    /** E on foot: the locker; or, on duty, stopping the person in front. Returns whether it did something. */
    interact() {
      const state = game.state;
      if (state.noPolice || !state.onFoot || state.wasted > 0) return false;
      if (Math.hypot(state.x - LOCKER.x, state.z - LOCKER.z) < LOCKER_RADIUS) {
        callbacks.current.onLocker?.();
        return true;
      }
      if (!duty.duty.on) return false;
      // (E is the job's own there: someone to talk to, to tackle, a tow truck to call, a prisoner to take
      // out of the car.)
      if (duty.duty.focus || lastHud?.canTackle || lastHud?.towPrompt) return false;
      const car = state.vehicles.find((v) => v.duty);
      if (car && Math.hypot(car.x - state.x, car.z - state.z) < 4) return false;
      const ped = bodies.stoppable(state.x, state.z, state.footYaw || 0);
      if (!ped) return false;
      let onRoad = false;
      for (const x of ROAD_XS) if (Math.abs(ped.x - x) < 9) onRoad = true;
      for (const z of ROAD_ZS) if (Math.abs(ped.z - z) < 9) onRoad = true;
      // (Crossing at a crossing is no offence.)
      if (ped.mode === "cross" || ped.mode === "wait" || ped.mode === "approach") onRoad = false;
      const suspect = duty.stopPedestrian({ x: ped.x, z: ped.z, female: ped.female, onRoad });
      if (suspect) bodies.bind(suspect, ped);
      return true;
    },
    /** For the HUD (`viewYaw`: where the camera looks, for the call's arrow). */
    hud(state, viewYaw) {
      const view = duty.hud();
      if (view?.callout) {
        view.callout.bearing = Math.atan2(-(view.callout.x - state.x), -(view.callout.z - state.z)) - viewYaw;
      }
      lastHud = view;
      return {
        duty: view,
        policeInfo: state.noPolice
          ? null
          : {
              rank: duty.rankOf(duty.duty.xp),
              xp: duty.duty.xp,
              ready: modelsReady,
              suspendedFor: Math.ceil(duty.duty.suspendedFor),
              on: duty.duty.on,
              outfit: duty.duty.outfit,
              fleet: duty.duty.fleet,
            },
        lockerNear: !state.noPolice && state.onFoot && Math.hypot(state.x - LOCKER.x, state.z - LOCKER.z) < LOCKER_RADIUS,
        stopPrompt:
          !!view?.on && state.onFoot && !view.focusMode && !view.canTackle && !view.towPrompt && !!bodies.stoppable(state.x, state.z, state.footYaw || 0),
      };
    },
    /** The locker menu's actions (GamePage, through the shared controls). */
    start(outfit, fleet) {
      return game.startDuty({ outfit, fleet });
    },
    end() {
      game.endDuty();
    },
    dispose() {
      disposed = true;
      speech.cancel();
    },
  };
}
