import { INITIAL_HUD } from "../data/hud.js";
import { FUEL_STATIONS } from "../data/stations.js";
import {
  buildSolidGrid,
  collideFootprintWithBox,
  collideOrientedBoxes,
  createCarFootprint,
  getCollisionProfile,
  orientedBox,
} from "./collisions.js";
import { updateGearbox } from "./gearbox.js";
import { createCarPhysics } from "./physics.js";
import { terrainHeight } from "../world/terrain.js";
import { ROAD_XS, ROAD_ZS } from "../data/roadGrid.js";
import { buildRoadGraph, createPoliceBrain } from "./policeAI.js";
import { createTraffic } from "./traffic.js";
import { createJobs } from "./jobs.js";
import { createPackages } from "./packages.js";
import { FLEET, createPoliceDuty } from "./policeDuty.js";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance2D = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const PLAYER_HALF_WIDTH = 1;
const PLAYER_HALF_LENGTH = 2.25;
const NPC_HALF_WIDTH = 1.05;
const NPC_HALF_LENGTH = 2.3;
// Everyday car paints (the colours real streets are full of) and body shapes. Every colour of a shape is
// drawn in the same draw calls (carInstancing.js), so the palette costs nothing.
export const TRAFFIC_COLORS = [
  "#8a97a8",
  "#b0563a",
  "#3f6f8f",
  "#7a6f9a",
  "#5a7a5e",
  "#e6e6e2",
  "#151618",
  "#9aa1a8",
  "#4a4e54",
  "#1f2c45",
  "#8e1b1b",
  "#b8a888",
  "#33503f",
  "#c9c2b4",
];
export const CIVILIAN_SHAPES = ["sedan", "suv", "hatch", "coupe"];
const WALK_SPEED = 4.6;
const RUN_SPEED = 7.4; // on foot with Shift held
const JUMP_SPEED = 4.4; // m/s up at take-off (about half a metre high)
const GRAVITY = 12;
const OFFICER_RUN_SPEED = 4.9;
const BUSTED_TIME = 4.2; // seconds of the arrest scene (hands up, cuffed) before the result screen
const HELI_ALTITUDE = 38;
const HELI_MAX_SPEED = 34; // m/s: a car flat out on the highway can outrun it
const ESCAPE_BASE = 4; // seconds out of sight to lose the police, plus ESCAPE_PER_STAR per star
const ESCAPE_PER_STAR = 2.5;
const WASTED_TIME = 4.2; // seconds of the death scene before waking up at the hospital
const FIRE_TO_EXPLOSION = 6; // seconds a burning car takes to blow up
const WRECK_BURN = 50; // seconds a wreck burns on (unless firefighters put it out)
const GUN_RANGE = 35; // metres the police open fire from
// Where the player comes back (RP mode): out of the hospital after dying, out of the police station after
// an arrest; their own car waits parked at the curb in front.
export const HOSPITAL = { x: -90, z: 59.75, heading: Math.PI, carX: -84, carZ: 62.65, carHeading: Math.PI / 2 };
export const POLICE_STATION = { x: 90, z: -19.75, heading: 0, carX: 96, carZ: -22.65, carHeading: -Math.PI / 2 };
export function createGame(car, engine, solids, noPolice = false) {
  const state = {
    ...INITIAL_HUD,
    x: 0,
    z: 70,
    vx: 0,
    vz: 0,
    heading: 0,
    elapsed: 0,
    driftTime: 0,
    collisionTimer: 0,
    shake: 0,
    ended: false,
    reason: "",
    throttle: 0,
    brake: 0,
    yaw: 0,
    steer: 0,
    u: 0,
    w: 0,
    slipAngle: 0,
    ax: 0,
    engine,
    car,
    onFoot: false,
    store: -1,
    shop: -1,
    arrestTimer: 0,
    busted: 0,
    wasted: 0,
    playerHealth: 100,
    sinceHit: 99,
    gunfire: 0, // seconds left of the police treating the player as armed (after they fire)
    shots: [], // this step's gunshots (for the session's effects): { x0, z0, x1, z1, hit, by }
    burning: 0, // seconds the player's car has been on fire (0: not)
    invincible: 0, // seconds left of the PAINKILLER cheat
    cash: 0, // money earned this session (added to the garage credits at the end)
    jobEvents: [], // this step's job news: { type: started|stage|checkpoint|done|failed|needCar|noJob, ... }
    cashEvents: [], // this step's money in or out: { amount, reason }
    notices: [], // this step's messages for the HUD: { key }
    policeSee: false,
    lastSeenX: 0, // where the police last saw the player (the centre of their search)
    lastSeenZ: 0,
    robbedAt: [], // per gas station: when its till was last emptied (session seconds)
    explosions: [], // this step's explosions: { x, z }
    respawned: null,
    heli: null,
    roadblock: null,
    roadblockCooldown: 0,
    speedingCooldown: 0,
    stoppedFor: 0,
    escapeNeeded: ESCAPE_BASE + ESCAPE_PER_STAR,
    _fPrev: false,
    nextVid: 1,
    noPolice: !!noPolice,
    playerVeh: {
      kind: "player",
      color: car.color,
      shape: car.shape,
      spec: `player|${car.color}|${car.shape}`,
    },
    vehicles: [],
    police: noPolice
      ? []
      : [
          {
            x: -60,
            z: 20,
            heading: 0,
            speed: 0,
            mode: 0,
            onFoot: false,
            carId: null,
          },
          {
            x: 60,
            z: 20,
            heading: 0,
            speed: 0,
            mode: 1,
            onFoot: false,
            carId: null,
          },
          {
            x: 0,
            z: -30,
            heading: 0,
            speed: 0,
            mode: 2,
            onFoot: false,
            carId: null,
          },
          {
            x: -60,
            z: -30,
            heading: 0,
            speed: 0,
            mode: 3,
            onFoot: false,
            carId: null,
          },
        ],
  };
  for (let station of FUEL_STATIONS) {
    for (let [offsetX, offsetZ, parkHeading] of [
      [-9, -6, 0],
      [9, -6, 0],
      [-9, 7.5, Math.PI / 2],
    ]) {
      const id = state.nextVid++;
      state.vehicles.push({
        id,
        x: station.x + offsetX,
        z: station.z + offsetZ,
        heading: parkHeading,
        kind: "civilian",
        color: TRAFFIC_COLORS[id % TRAFFIC_COLORS.length],
        shape: CIVILIAN_SHAPES[id % CIVILIAN_SHAPES.length],
      });
    }
  }
  parkAlongCurbs(state, solids);
  const solidGrid = buildSolidGrid(solids);
  const blockedBuffer = [];
  // Whether (x, z) is inside a solid grown by `margin` metres (wide for planning, tight for manoeuvring).
  const blockedAt = (x, z, margin = 1.2) => {
    for (let solid of solidGrid.near(x, z, 30, blockedBuffer)) {
      if (Math.abs(x - solid.x) < solid.w + margin && Math.abs(z - solid.z) < solid.d + margin) {
        return true;
      }
    }
    return false;
  };
  const roadGraph = buildRoadGraph({ roadXs: ROAD_XS, roadZs: ROAD_ZS });
  const jobs = createJobs({ roadXs: ROAD_XS, roadZs: ROAD_ZS });
  const packages = createPackages({ roadXs: ROAD_XS, roadZs: ROAD_ZS });
  // City traffic (both modes): moved by the session (it needs the light cycle), solid here.
  const traffic = createTraffic({ roadXs: ROAD_XS, roadZs: ROAD_ZS, shapes: CIVILIAN_SHAPES, colors: TRAFFIC_COLORS });
  const brain = createPoliceBrain(roadGraph, blockedAt);
  const occluders = solids.filter((e) => e.w >= 3);
  const nearbyBuffer = [];
  // (Asked several times a tick for the same officer: worked out once per tick.)
  let sightTick = 0;
  function hasLineOfSight(officer) {
    if (officer._sightTick === sightTick) return officer._sight;
    officer._sightTick = sightTick;
    officer._sight = lineOfSight(officer);
    return officer._sight;
  }
  function lineOfSight(officer) {
    if (distance2D(officer, state) > 75) {
      return false;
    }
    for (let occluder of occluders) {
      for (let step = 1; step < 9; step++) {
        const fraction = step / 9;
        const sampleX = officer.x + (state.x - officer.x) * fraction;
        const sampleZ = officer.z + (state.z - officer.z) * fraction;
        if (Math.abs(sampleX - occluder.x) < occluder.w && Math.abs(sampleZ - occluder.z) < occluder.d) {
          return false;
        }
      }
    }
    return true;
  }
  /** Whether nothing big (a building) stands between two points. */
  function clearLine(x0, z0, x1, z1) {
    for (let occluder of occluders) {
      if (Math.max(x0, x1) < occluder.x - occluder.w || Math.min(x0, x1) > occluder.x + occluder.w) continue;
      if (Math.max(z0, z1) < occluder.z - occluder.d || Math.min(z0, z1) > occluder.z + occluder.d) continue;
      for (let step = 1; step < 9; step++) {
        const fraction = step / 9;
        const sampleX = x0 + (x1 - x0) * fraction;
        const sampleZ = z0 + (z1 - z0) * fraction;
        if (Math.abs(sampleX - occluder.x) < occluder.w && Math.abs(sampleZ - occluder.z) < occluder.d) return false;
      }
    }
    return true;
  }
  // The police job (RP mode, policeDuty.js).
  const duty = createPoliceDuty({ state, traffic, roadXs: ROAD_XS, roadZs: ROAD_ZS, blockedAt, lineOfSight: clearLine, pay: (amount, reason) => pay(amount, reason) });
  /** Bodywork grinding along what it touches (normal nx, nz toward it): sparks and the screech of metal. */
  function noteScrape(nx, nz) {
    const along = Math.hypot(state.vx - (state.vx * nx + state.vz * nz) * nx, state.vz - (state.vx * nx + state.vz * nz) * nz);
    if (along > 3 && (!state._scrape || along > state._scrape.speed)) state._scrape = { nx, nz, speed: along };
  }
  // Collision damage is applied at most every half second; returns true when it was (crash effects key off that).
  function takeDamage(amount, rammedByPolice = false) {
    if (!(state.collisionTimer <= 0)) {
      return false;
    }
    state.health = clamp(state.health - amount, 0, 100);
    state.collisionTimer = 0.5;
    state.shake = Math.min(state.shake + amount * 0.08, 1.2);
    // Reckless driving seen by the police (being rammed by them is not a crime of the player's).
    if (!rammedByPolice && state.police.some((officer) => distance2D(officer, state) < 85)) {
      state.wanted = clamp(state.wanted + 0.6, 0, 5);
    }
    return true;
  }
  function toggleOnFoot() {
    if (state.onFoot) {
      let nearest = null;
      let nearestDistance = 3.6;
      for (let vehicle of state.vehicles) {
        if (vehicle.kind === "wreck" || vehicle.burning > 0) continue; // (burnt out, or on fire)
        const distance = distance2D(vehicle, state);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = vehicle;
        }
      }
      // A car stopped (or nearly) in traffic: pull its driver out and take it.
      const traffic_car = traffic?.carAt(state.x, state.z, 3.4);
      if (traffic_car && traffic_car.speed < 4 && (!nearest || distance2D(traffic_car, state) < nearestDistance)) {
        traffic.remove(traffic_car);
        nearest = {
          id: state.nextVid++,
          x: traffic_car.x,
          z: traffic_car.z,
          heading: traffic_car.heading,
          kind: "civilian",
          color: traffic_car.color,
          shape: traffic_car.shape,
        };
        state.vehicles.push(nearest);
        // The driver runs off; stealing a car in front of the police is a crime.
        state._carjack = { x: traffic_car.x - Math.cos(traffic_car.heading) * 1.6, z: traffic_car.z + Math.sin(traffic_car.heading) * 1.6, fromX: state.x, fromZ: state.z, carX: traffic_car.x, carZ: traffic_car.z };
        if (!duty.duty.on && state.police.some((officer) => distance2D(officer, state) < 60)) state.wanted = clamp(state.wanted + 1, 0, 5);
      }
      if (!nearest) {
        return;
      }
      state.vehicles = state.vehicles.filter((t) => t.id !== nearest.id);
      state.health = nearest.health ?? 100; // (this car's own damage)
      // A police car of the job's fleet drives like one; any other car, like the player's own.
      usePhysics(nearest.fleet || null);
      if (nearest.kind === "police") {
        const officer = state.police.find((t) => t.carId === nearest.id);
        if (officer) {
          officer.onFoot = true;
          officer.carId = null;
        }
        // (Taking a police car is a crime, except for an officer on duty.)
        if (!duty.duty.on) state.wanted = clamp(state.wanted + 1, 0, 5);
      }
      state.onFoot = false;
      state.x = nearest.x;
      state.z = nearest.z;
      state.heading = nearest.heading;
      state.vx = 0;
      state.vz = 0;
      state.u = 0;
      state.w = 0;
      state.yaw = 0;
      state.playerVeh = {
        kind: nearest.kind,
        color: nearest.color,
        shape: nearest.shape,
        model: nearest.model,
        fleet: nearest.fleet,
        duty: !!nearest.duty,
        spec: `${nearest.kind}|${nearest.color}|${nearest.model || nearest.shape}`,
      };
    } else {
      if (Math.hypot(state.vx, state.vz) > 3) {
        return;
      }
      const vehicleId = state.nextVid++;
      state.vehicles.push({
        id: vehicleId,
        x: state.x,
        z: state.z,
        heading: state.heading,
        kind: state.playerVeh.kind,
        color: state.playerVeh.color,
        shape: state.playerVeh.shape,
        model: state.playerVeh.model,
        fleet: state.playerVeh.fleet,
        duty: !!state.playerVeh.duty && duty.duty.on,
        // (Getting out of a burning car: it goes on burning, and blows up, without the player.)
        burning: state.burning,
        health: state.health, // (each car keeps its own damage)
      });
      state.burning = 0;
      state.onFoot = true;
      state.x += -Math.cos(state.heading) * 2.2;
      state.z += Math.sin(state.heading) * 2.2;
      state.vx = 0;
      state.vz = 0;
      state.u = 0;
      state.w = 0;
      state.yaw = 0;
      let officersLeaving = 0;
      const byDistance = [...state.police].sort((e, t) => distance2D(e, state) - distance2D(t, state));
      for (let officer of byDistance) {
        if (officersLeaving >= 2) {
          break;
        }
        if (!officer.onFoot && state.wanted > 0.15 && distance2D(officer, state) < 30) {
          leaveCruiser(officer);
          officersLeaving++;
        }
      }
    }
  }
  /** The officer gets out: the cruiser stays parked (lights flashing) where it stopped. */
  function leaveCruiser(officer) {
    const carId = state.nextVid++;
    state.vehicles.push({
      id: carId,
      x: officer.x,
      z: officer.z,
      heading: officer.heading,
      kind: "police",
      color: "#ffffff",
      shape: "coupe",
    });
    officer.carId = carId;
    officer.onFoot = true;
    officer.speed = 0;
    // Out of the driver's door, on the cruiser's left.
    officer.x += -Math.cos(officer.heading) * 1.5;
    officer.z += Math.sin(officer.heading) * 1.5;
  }

  /* ----- roadblocks: at 3 stars, cruisers parked across the road ahead, officers behind them ----- */
  function removeRoadblock() {
    const ids = state.roadblock.ids;
    state.vehicles = state.vehicles.filter((vehicle) => !ids.includes(vehicle.id) || !vehicle.roadblock);
    state.roadblock = null;
    state.roadblockCooldown = 18;
  }
  function updateRoadblock(dt, speed) {
    state.roadblockCooldown -= dt;
    const block = state.roadblock;
    if (block) {
      const distance = Math.hypot(block.x - state.x, block.z - state.z);
      // Taken down once the player is far away, or when the chase is over and nobody is looking.
      if (distance > 230 || (state.wanted <= 0.15 && distance > 90)) removeRoadblock();
      return;
    }
    if (state.wanted <= 2 || state.onFoot || speed < 8 || state.roadblockCooldown > 0) return;
    // Along the avenue or street the player is driving down, the next block midpoint 80-170 m ahead.
    const alongZ = Math.abs(state.vz) > Math.abs(state.vx) * 1.5;
    const alongX = Math.abs(state.vx) > Math.abs(state.vz) * 1.5;
    if (!alongZ && !alongX) return;
    const roads = alongZ ? ROAD_XS : ROAD_ZS;
    const across = alongZ ? state.x : state.z;
    const road = roads.reduce((best, r) => (Math.abs(r - across) < Math.abs(best - across) ? r : best));
    if (Math.abs(road - across) > 8) return;
    const lines = alongZ ? ROAD_ZS : ROAD_XS;
    const along = alongZ ? state.z : state.x;
    const direction = Math.sign(alongZ ? state.vz : state.vx);
    let spot = null;
    for (let k = 0; k + 1 < lines.length; k++) {
      const middle = (lines[k] + lines[k + 1]) / 2;
      const ahead = (middle - along) * direction;
      if (ahead > 80 && ahead < 170 && (spot === null || ahead < (spot - along) * direction)) spot = middle;
    }
    if (spot === null) return;
    const x = alongZ ? road : spot;
    const z = alongZ ? spot : road;
    // Two cruisers nose to nose across the lanes, angled a little like they were thrown there; the
    // officers stand behind them, on the far side.
    const acrossHeading = alongZ ? Math.PI / 2 : 0;
    const ids = [];
    const officers = [];
    for (const [offset, tilt] of [
      [-3.3, 0.22],
      [3.3, -0.18],
    ]) {
      const id = state.nextVid++;
      ids.push(id);
      const cx = alongZ ? x + offset : x;
      const cz = alongZ ? z : z + offset;
      state.vehicles.push({
        id,
        x: cx,
        z: cz,
        heading: acrossHeading + tilt,
        kind: "police",
        color: "#ffffff",
        shape: "coupe",
        roadblock: true,
      });
      const behind = 3.2 * direction;
      const ox = alongZ ? cx + offset * 0.25 : cx + behind;
      const oz = alongZ ? cz + behind : cz + offset * 0.25;
      officers.push({ x: ox, z: oz, heading: Math.atan2(-(state.x - ox), -(state.z - oz)) });
    }
    state.roadblock = { x, z, ids, officers };
  }

  /* ----- the helicopter: at 4 stars, circling overhead with its searchlight on the player ----- */
  function updateHeli(dt) {
    let heli = state.heli;
    if (!heli) {
      if (state.wanted <= 3 || state.noPolice) return;
      // Comes in from a couple of hundred metres away.
      const angle = Math.random() * Math.PI * 2;
      heli = state.heli = {
        x: state.x + Math.cos(angle) * 220,
        z: state.z + Math.sin(angle) * 220,
        y: HELI_ALTITUDE,
        vx: 0,
        vz: 0,
        heading: 0,
        orbit: angle,
        beamX: state.x + Math.cos(angle) * 60,
        beamZ: state.z + Math.sin(angle) * 60,
        sees: false,
        leaving: false,
      };
    }
    heli.leaving = state.wanted <= 0.15;
    let targetX;
    let targetZ;
    if (heli.leaving) {
      // Chase over: flies off and is gone.
      const away = Math.atan2(heli.z - state.z, heli.x - state.x);
      targetX = heli.x + Math.cos(away) * 100;
      targetZ = heli.z + Math.sin(away) * 100;
      if (Math.hypot(heli.x - state.x, heli.z - state.z) > 320) {
        state.heli = null;
        return;
      }
    } else {
      // Circles the player at ~24 m, a little ahead of where they are going.
      heli.orbit += dt * 0.22;
      targetX = state.x + Math.cos(heli.orbit) * 24 + state.vx * 1.2;
      targetZ = state.z + Math.sin(heli.orbit) * 24 + state.vz * 1.2;
    }
    let wantX = (targetX - heli.x) * 0.9;
    let wantZ = (targetZ - heli.z) * 0.9;
    const want = Math.hypot(wantX, wantZ);
    if (want > HELI_MAX_SPEED) {
      wantX *= HELI_MAX_SPEED / want;
      wantZ *= HELI_MAX_SPEED / want;
    }
    const ease = 1 - Math.exp(-1.1 * dt);
    heli.vx += (wantX - heli.vx) * ease;
    heli.vz += (wantZ - heli.vz) * ease;
    heli.x += heli.vx * dt;
    heli.z += heli.vz * dt;
    const ground = Math.max(terrainHeight(heli.x, heli.z), terrainHeight(state.x, state.z));
    heli.y += (ground + HELI_ALTITUDE - heli.y) * (1 - Math.exp(-0.8 * dt));
    // Nose into its flight, or toward the player when hovering.
    const faceX = Math.hypot(heli.vx, heli.vz) > 3 ? heli.vx : state.x - heli.x;
    const faceZ = Math.hypot(heli.vx, heli.vz) > 3 ? heli.vz : state.z - heli.z;
    const face = Math.atan2(-faceX, -faceZ);
    heli.heading += Math.atan2(Math.sin(face - heli.heading), Math.cos(face - heli.heading)) * (1 - Math.exp(-1.5 * dt));
    // The searchlight is swung by hand: it lags behind a fast car (lose it by driving flat out).
    if (!heli.leaving) {
      const dx = state.x - heli.beamX;
      const dz = state.z - heli.beamZ;
      const gap = Math.hypot(dx, dz);
      const step = Math.min(gap, 26 * dt + gap * (1 - Math.exp(-2.5 * dt)));
      if (gap > 0.01) {
        heli.beamX += (dx / gap) * step;
        heli.beamZ += (dz / gap) * step;
      }
    }
    heli.sees =
      !heli.leaving &&
      Math.hypot(state.x - heli.beamX, state.z - heli.beamZ) < 12 &&
      Math.hypot(state.x - heli.x, state.z - heli.z) < 110 &&
      !(state.onFoot && state.store >= 0); // (not inside the store)
  }

  /* ----- backup: a cruiser left far behind is sent in again from closer (out of sight) ----- */
  function sendBackup(officer, dt) {
    officer.backupCooldown = Math.max(0, (officer.backupCooldown || 0) - dt);
    if (officer.backupCooldown > 0 || state.wanted < 2 || distance2D(officer, state) < 230) return;
    const candidates = roadGraph.nodes.filter((node) => {
      const d = Math.hypot(node.x - state.x, node.z - state.z);
      return (
        d > 110 &&
        d < 170 &&
        !blockedAt(node.x, node.z, 1) &&
        state.police.every((other) => other === officer || Math.hypot(other.x - node.x, other.z - node.z) > 25)
      );
    });
    if (!candidates.length) return;
    const node = candidates[Math.floor(Math.random() * candidates.length)];
    officer.x = node.x;
    officer.z = node.z;
    officer.heading = Math.atan2(-(state.x - node.x), -(state.z - node.z));
    officer.speed = 0;
    officer.path = null;
    officer.replan = 0;
    officer.stuck = 0;
    officer.reverse = 0;
    officer.backupCooldown = 12;
  }
  /** Money in (positive) or out (never below zero), with what it was for. */
  function pay(amount, reason) {
    const change = amount < 0 ? -Math.min(state.cash, -amount) : amount;
    if (change === 0) return;
    state.cash += change;
    state.cashEvents.push({ amount: change, reason });
  }
  /**
   * At a gas station, R: the body shop repairs the car and resprays it a new colour. With the police after
   * the player and not looking right now, the new colour loses them too.
   */
  function repairAndRespray() {
    const wanted = !state.noPolice && state.wanted > 0.15;
    const cost = 60 + (wanted ? 140 : 0);
    if (state.cash < cost) {
      state.notices.push({ key: "hud.noMoney", amount: cost });
      return;
    }
    if (wanted && state.policeSee) {
      state.notices.push({ key: "hud.policeWatching" });
      return;
    }
    pay(-cost, "repair");
    state.health = 100;
    state.burning = 0;
    let colour = state.playerVeh.color;
    while (colour === state.playerVeh.color) colour = TRAFFIC_COLORS[Math.floor(Math.random() * TRAFFIC_COLORS.length)];
    state.playerVeh = { ...state.playerVeh, color: colour, spec: `${state.playerVeh.kind}|${colour}|${state.playerVeh.shape}|${state.nextVid++}` };
    if (wanted) {
      state.wanted = 0;
      state.escape = 0;
    }
    state.notices.push({ key: wanted ? "hud.resprayLost" : "hud.repaired" });
  }
  /**
   * G inside a gas station store (RP mode): a hold-up. The clerk hands over the till; the alarm goes off
   * (two stars). A till is only worth robbing again after a few minutes.
   */
  function robStore() {
    const index = state.store;
    const last = state.robbedAt[index] ?? -Infinity;
    if (state.elapsed - last < 180) {
      state.notices.push({ key: "hud.tillEmpty" });
      return;
    }
    state.robbedAt[index] = state.elapsed;
    pay(Math.round(120 + Math.random() * 230), "robbery");
    state.wanted = clamp(Math.max(state.wanted, 2), 0, 5);
    state.gunfire = 15;
    state.notices.push({ key: "hud.robbery" });
    state._robbery = { x: state.x, z: state.z };
  }
  /** A car blowing up at (x, z): what is near is hurt or killed (people: the session, pedestrians.js). */
  function explode(x, z) {
    state.explosions.push({ x, z });
    state.shake = Math.min(state.shake + 1.2, 1.6);
    const d = Math.hypot(state.x - x, state.z - z);
    if (state.onFoot) {
      if (d < 9) {
        state.playerHealth = Math.max(0, state.playerHealth - (9 - d) * 22);
        state.sinceHit = 0;
      }
    } else if (d < 7) {
      state.health = clamp(state.health - (7 - d) * 14, 0, 100);
    }
    for (const officer of state.police) {
      if (officer.onFoot && !officer.dead && Math.hypot(officer.x - x, officer.z - z) < 6) {
        officer.dead = true;
        officer.aiming = false;
      }
    }
    // Cars right next to it catch fire too (parked ones; traffic stops dead).
    for (const vehicle of state.vehicles) {
      if (vehicle.kind === "wreck" || vehicle.burning > 0) continue;
      if (Math.hypot(vehicle.x - x, vehicle.z - z) < 4.5) vehicle.burning = 1e-3;
    }
    for (const car of traffic.cars) if (Math.hypot(car.x - x, car.z - z) < 8) traffic.shake(car, 12);
  }
  /** Burning cars: the player's (engine dead), and parked ones, until they blow up; then wrecks burn on. */
  function updateFires(dt) {
    if (state.burning > 0) {
      state.burning += dt;
      if (state.burning >= FIRE_TO_EXPLOSION) {
        // Still inside: WASTED. The car is left a burnt-out wreck.
        state.burning = 0;
        explode(state.x, state.z);
        state.vehicles.push({
          id: state.nextVid++,
          x: state.x,
          z: state.z,
          heading: state.heading,
          kind: "wreck",
          color: "#1a1a1a",
          shape: state.playerVeh.shape,
          fireLeft: WRECK_BURN,
        });
        state.playerHealth = 0;
        state.wasted = 1e-3;
        state.wastedX = state.x - Math.cos(state.heading) * 2.4;
        state.wastedZ = state.z + Math.sin(state.heading) * 2.4;
        state.onFoot = true;
        state.x = state.wastedX;
        state.z = state.wastedZ;
      }
    }
    for (const vehicle of state.vehicles) {
      if (vehicle.burning > 0) {
        vehicle.burning += dt;
        if (vehicle.burning >= FIRE_TO_EXPLOSION) {
          vehicle.burning = 0;
          vehicle.kind = "wreck";
          vehicle.color = "#1a1a1a";
          vehicle.fireLeft = WRECK_BURN;
          explode(vehicle.x, vehicle.z);
        }
      } else if (vehicle.fireLeft > 0) {
        vehicle.fireLeft = Math.max(0, vehicle.fireLeft - dt);
      }
    }
  }
  /**
   * After an arrest or a death (RP mode): out of the police station or the hospital, on foot, healed,
   * wanted no more; the police back on patrol; the player's own car parked at the curb in front.
   */
  function respawn(where) {
    const spot = where === "police" ? POLICE_STATION : HOSPITAL;
    // The hospital bill, or bail.
    pay(where === "police" ? -150 : -100, where === "police" ? "bail" : "hospital");
    if (state.roadblock) removeRoadblock();
    if (state.heli) state.heli.leaving = true;
    for (const officer of state.police) {
      if (officer.carId != null) state.vehicles = state.vehicles.filter((v) => v.id !== officer.carId);
      officer.carId = null;
      officer.onFoot = false;
      officer.down = 0;
      officer.dead = false;
      officer.aiming = false;
      officer.speed = 0;
      officer.path = null;
      // Back on patrol somewhere well away.
      const far = roadGraph.nodes.filter((n) => Math.hypot(n.x - spot.x, n.z - spot.z) > 120);
      const node = far[Math.floor(Math.random() * far.length)] || roadGraph.nodes[0];
      officer.x = node.x;
      officer.z = node.z;
    }
    // The player's own car at the curb (anything parked there is moved off).
    state.vehicles = state.vehicles.filter((v) => Math.hypot(v.x - spot.carX, v.z - spot.carZ) > 6);
    state.vehicles.push({
      id: state.nextVid++,
      x: spot.carX,
      z: spot.carZ,
      heading: spot.carHeading,
      kind: "player",
      color: state.car.color,
      shape: state.car.shape,
    });
    Object.assign(state, {
      onFoot: true,
      x: spot.x,
      z: spot.z,
      heading: spot.heading,
      footYaw: spot.heading,
      vx: 0,
      vz: 0,
      u: 0,
      w: 0,
      yaw: 0,
      health: 100,
      playerHealth: 100,
      sinceHit: 99,
      fuel: Math.max(state.fuel, 60),
      wanted: 0,
      escape: 0,
      arrestTimer: 0,
      arrest: 0,
      busted: 0,
      wasted: 0,
      gunfire: 0,
      burning: 0,
      stoppedFor: 0,
      respawned: where,
    });
    state.playerVeh = {
      kind: "player",
      color: state.car.color,
      shape: state.car.shape,
      spec: `player|${state.car.color}|${state.car.shape}`,
    };
    usePhysics(null);
  }
  /** An officer fires at the player from `distance` metres: may hit (the player on foot, or their car). */
  function fireAtPlayer(officer, distance, speed) {
    const chance = clamp(0.62 - distance * 0.013 - speed * 0.025, 0.06, 0.55);
    const hit = Math.random() < chance;
    // Where the bullet goes: the player, or close past them.
    const missX = hit ? 0 : (Math.random() - 0.5) * 3;
    const missZ = hit ? 0 : (Math.random() - 0.5) * 3;
    state.shots.push({
      x0: officer.x,
      z0: officer.z,
      x1: state.x + missX,
      z1: state.z + missZ,
      hit,
      onFoot: state.onFoot,
      by: "police",
      unit: state.police.indexOf(officer),
    });
    if (!hit) return;
    state.sinceHit = 0;
    if (state.onFoot) {
      state.playerHealth = Math.max(0, state.playerHealth - (7 + Math.random() * 5));
      state.shake = Math.min(state.shake + 0.25, 1.2);
    } else {
      state.health = clamp(state.health - 2.5, 0, 100);
    }
  }
  let physics = createCarPhysics(car, engine);
  let carCollisionProfile = getCollisionProfile(car.shape);
  /** The car's handling: a police car of the fleet (`fleetId`), or the player's own (null). */
  function usePhysics(fleetId) {
    const spec = FLEET.find((f) => f.id === fleetId);
    physics = spec
      ? createCarPhysics({ shape: spec.shape, grip: spec.grip, awd: spec.awd }, { ...engine, max: spec.max, acceleration: spec.acceleration })
      : createCarPhysics(state.car, engine);
  }
  /** A GTA-style cheat code, typed on the keyboard. Returns whether `code` is one. */
  function cheat(code) {
    if (state.wasted > 0 || state.busted > 0) return false;
    const fixCar = () => {
      state.health = 100;
      state.burning = 0;
      // (A fresh copy of the same car: dents and broken glass gone.)
      state.playerVeh = { ...state.playerVeh, spec: `${state.playerVeh.kind}|${state.playerVeh.color}|${state.playerVeh.shape}|${state.nextVid++}` };
    };
    if (code === "TURTLE") {
      state.playerHealth = 100;
      if (!state.onFoot) fixCar();
    } else if (code === "HESOYAM") {
      state.playerHealth = 100;
      if (!state.onFoot) fixCar();
      pay(250, "cheat");
    } else if (code === "PAINKILLER") {
      state.invincible = 300;
    } else if (code === "LAWYERUP") {
      if (state.noPolice) return false;
      state.wanted = 0;
      state.escape = 0;
      state.gunfire = 0;
    } else if (code === "FUGITIVE") {
      if (state.noPolice) return false;
      state.wanted = clamp(Math.floor(state.wanted) + 1, 0, 5);
      state.lastSeenX = state.x;
      state.lastSeenZ = state.z;
    } else {
      return false;
    }
    state.cheatNotice = code;
    return true;
  }
  return {
    state,
    traffic,
    packages,
    duty,
    cheat,
    /** The police job: on duty in `outfit` with a car of the fleet (from the locker). */
    startDuty(options) {
      if (jobs.job) jobs.toggle(state);
      return duty.startDuty(options);
    },
    endDuty() {
      duty.endDuty();
    },
    setCar(nextCar) {
      state.car = nextCar;
      physics = createCarPhysics(nextCar, engine);
      carCollisionProfile = getCollisionProfile(nextCar.shape);
      if (state.playerVeh.kind === "player") {
        state.playerVeh = {
          kind: "player",
          color: nextCar.color,
          shape: nextCar.shape,
          spec: `player|${nextCar.color}|${nextCar.shape}`,
        };
      }
    },
    update(dt, keys, cameraHeading = state.heading) {
      if (state.ended) {
        return state;
      }
      state.elapsed += dt;
      state.collisionTimer -= dt;
      state.shots.length = 0;
      state.explosions.length = 0;
      state.jobEvents.length = 0;
      state.cashEvents.length = 0;
      state.notices.length = 0;
      state.respawned = null;
      state.gunfire = Math.max(0, state.gunfire - dt);
      // PAINKILLER: nothing hurts for a while (the car does not catch fire either).
      if (state.invincible > 0) {
        state.invincible = Math.max(0, state.invincible - dt);
        state.burning = 0;
        state.playerHealth = 100;
      }
      updateFires(dt);
      // Health on foot comes back slowly when not hurt for a while.
      state.sinceHit += dt;
      if (state.sinceHit > 6) state.playerHealth = Math.min(100, state.playerHealth + dt * 2.5);
      state.shake *= Math.exp(-dt * 5);
      if (state.busted > 0) {
        // Busted: everything stops for the arrest (hands up, cuffs), then the result screen.
        state.busted += dt;
        state.vx = 0;
        state.vz = 0;
        state.u = 0;
        state.w = 0;
        state.yaw = 0;
        state.speed = 0;
        state.throttle = 0;
        state.brake = 0;
        state.pedal = 0;
        state.drifting = false;
        state.rpm = 900;
        if (state.busted >= BUSTED_TIME) respawn("police");
        return state;
      }
      if (state.wasted > 0) {
        // Dead: the death scene, then the hospital.
        state.wasted += dt;
        state.vx = 0;
        state.vz = 0;
        state.speed = 0;
        state.throttle = 0;
        state.brake = 0;
        state.pedal = 0;
        state.drifting = false;
        if (state.wasted >= WASTED_TIME) respawn("hospital");
        return state;
      }
      const throttle = keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0;
      const brake = keys.ArrowDown || keys.KeyS ? 1 : 0;
      const steer =
        (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0) - (keys.ArrowRight || keys.KeyD ? 1 : 0);
      const handbrake = !!keys.Space;
      const footTogglePressed = !!keys.KeyF && !state._fPrev;
      state._fPrev = !!keys.KeyF;
      if (footTogglePressed) {
        toggleOnFoot();
      }
      // J: take a job (or give it up). R at a gas station: the body shop.
      const jobPressed = !!keys.KeyJ && !state._jPrev;
      state._jPrev = !!keys.KeyJ;
      if (jobPressed && !duty.duty.on) jobs.toggle(state);
      const repairPressed = !!keys.KeyR && !state._rPrev;
      state._rPrev = !!keys.KeyR;
      if (repairPressed && !state.onFoot && state.station >= 0) repairAndRespray();
      // A gun drawn on the clerk in a gas station store (the session's HoldUp): a hold-up (RP mode).
      const robPressed = !!keys.HoldUp;
      if (robPressed && !state.noPolice && !duty.duty.on && state.onFoot && state.store >= 0) robStore();
      if (state.onFoot) {
        state.throttle = 0;
        state.brake = 0;
        state.pedal = 0;
        const moveX =
          (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0);
        const moveZ =
          (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0);
        const moveLength = Math.hypot(moveX, moveZ) || 1;
        // Shift: running. Space: a jump (from the ground, then gravity brings the player back down).
        const running = !!(keys.ShiftLeft || keys.ShiftRight);
        state.footRunning = running && !!(moveX || moveZ);
        state.landing = Math.max(0, (state.landing || 0) - dt);
        if (keys.Space && !state._jumpHeld && !(state.jumpY > 0)) state.jumpV = JUMP_SPEED;
        state._jumpHeld = !!keys.Space;
        if (state.jumpV || state.jumpY > 0) {
          state.jumpY = (state.jumpY || 0) + (state.jumpV || 0) * dt;
          state.jumpV = (state.jumpV || 0) - GRAVITY * dt;
          if (state.jumpY <= 0) {
            state.jumpY = 0;
            state.jumpV = 0;
            state.landing = 0.22; // (the knees take the landing: see the session's pose)
          }
        }
        ((sinHeading, cosHeading, walkSpeed) => {
          const dx = (cosHeading * moveX + sinHeading * moveZ) / moveLength;
          const dz = (cosHeading * moveZ - sinHeading * moveX) / moveLength;
          state.x += dx * walkSpeed * dt;
          state.z += dz * walkSpeed * dt;
          state.footSpeed = moveX || moveZ ? walkSpeed : 0;
          if (state.footYaw === undefined) {
            state.footYaw = state.heading;
          }
          if (moveX || moveZ) {
            const targetYaw = Math.atan2(-dx, -dz);
            const yawDelta = ((targetYaw - state.footYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            state.footYaw = Math.atan2(
              Math.sin(state.footYaw + yawDelta * (1 - Math.exp(-14 * dt))),
              Math.cos(state.footYaw + yawDelta * (1 - Math.exp(-14 * dt))),
            );
          }
        })(Math.sin(cameraHeading), Math.cos(cameraHeading), state.footRunning ? RUN_SPEED : WALK_SPEED);
        state.x = clamp(state.x, -200, 250);
        state.z = clamp(state.z, -700, 150);
        for (let solid of solidGrid.near(state.x, state.z, 3, nearbyBuffer)) {
          if (Math.abs(state.x - solid.x) < solid.w + 0.5 && Math.abs(state.z - solid.z) < solid.d + 0.5) {
            const dx = state.x - solid.x;
            const dz = state.z - solid.z;
            if (solid.w + 0.5 - Math.abs(dx) < solid.d + 0.5 - Math.abs(dz)) {
              state.x = solid.x + Math.sign(dx || 1) * (solid.w + 0.5);
            } else {
              state.z = solid.z + Math.sign(dz || 1) * (solid.d + 0.5);
            }
          }
        }
        state.vx = 0;
        state.vz = 0;
        state.u = 0;
        state.w = 0;
        state.yaw = 0;
        state.rpm = 900;
      } else {
        state.jumpY = 0;
        state.jumpV = 0;
        state.footRunning = false;
        state.throttle = throttle;
        state.brake = brake;
        const forwardX = -Math.sin(state.heading);
        const forwardZ = -Math.cos(state.heading);
        updateGearbox(
          state,
          engine,
          dt,
          state.vx * forwardX + state.vz * forwardZ,
          throttle,
          brake,
          handbrake,
        );
        physics.step(state, dt, {
          throttle,
          brake,
          handbrake,
          steer,
          fuel: +(state.fuel > 0 && !(state.burning > 0)),
        });
      }
      const speed = Math.hypot(state.vx, state.vz);
      if (!state.onFoot) {
        state.x += state.vx * dt;
        state.z += state.vz * dt;
        if (carCollisionProfile.shape !== state.playerVeh.shape) {
          carCollisionProfile = getCollisionProfile(state.playerVeh.shape);
        }
        const footprint = createCarFootprint(state.x, state.z, state.heading, carCollisionProfile);
        for (let obstacle of solidGrid.near(state.x, state.z, 4, nearbyBuffer)) {
          const collision = collideFootprintWithBox(footprint, obstacle);
          if (!collision) {
            continue;
          }
          state.x -= collision.nx * (collision.depth + 0.02);
          state.z -= collision.nz * (collision.depth + 0.02);
          const impactSpeed = Math.max(0, state.vx * collision.nx + state.vz * collision.nz);
          noteScrape(collision.nx, collision.nz);
          if (impactSpeed > 0.6) {
            state.vx -= collision.nx * impactSpeed * 1.3;
            state.vz -= collision.nz * impactSpeed * 1.3;
            if (impactSpeed > 2.5 && takeDamage(4 + impactSpeed * 0.8)) {
              state._crash = {
                x: state.x,
                y: state.y || 0,
                z: state.z,
                nx: collision.nx,
                nz: collision.nz,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
          }
          break;
        }
        // Parked cars are solid too (a box around each, along its heading).
        for (const vehicle of state.vehicles) {
          if (Math.abs(vehicle.x - state.x) > 7 || Math.abs(vehicle.z - state.z) > 7) continue;
          const spec = getCollisionProfile(vehicle.shape || "coupe");
          const halfLength = spec.length / 2;
          const halfWidth = 0.92;
          const cos = Math.abs(Math.cos(vehicle.heading));
          const sin = Math.abs(Math.sin(vehicle.heading));
          const box = {
            x: vehicle.x,
            z: vehicle.z,
            w: halfWidth * cos + halfLength * sin,
            d: halfWidth * sin + halfLength * cos,
          };
          const collision = collideFootprintWithBox(footprint, box);
          if (!collision) continue;
          state.x -= collision.nx * (collision.depth + 0.02);
          state.z -= collision.nz * (collision.depth + 0.02);
          const impactSpeed = Math.max(0, state.vx * collision.nx + state.vz * collision.nz);
          noteScrape(collision.nx, collision.nz);
          if (vehicle.roadblock && impactSpeed > 6) {
            // Ramming through a roadblock: the cruiser is shoved aside and spun, the player loses speed.
            vehicle.x += collision.nx * (collision.depth + impactSpeed * 0.12);
            vehicle.z += collision.nz * (collision.depth + impactSpeed * 0.12);
            vehicle.heading += (Math.random() < 0.5 ? -1 : 1) * Math.min(0.9, impactSpeed * 0.035);
            state.vx -= collision.nx * impactSpeed * 0.55;
            state.vz -= collision.nz * impactSpeed * 0.55;
            if (takeDamage(5 + impactSpeed * 0.6)) {
              state._crash = {
                x: state.x,
                y: state.y || 0,
                z: state.z,
                nx: collision.nx,
                nz: collision.nz,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
            break;
          }
          if (impactSpeed > 0.6) {
            state.vx -= collision.nx * impactSpeed * 1.3;
            state.vz -= collision.nz * impactSpeed * 1.3;
            if (impactSpeed > 2.5 && takeDamage(4 + impactSpeed * 0.8)) {
              state._crash = {
                x: state.x,
                y: state.y || 0,
                z: state.z,
                nx: collision.nx,
                nz: collision.nz,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
          }
          break;
        }
        // Traffic is solid too: a crash stops the car (its driver shaken); a big one wrecks it, left
        // where it stopped (and the player can take it).
        for (const car of traffic ? traffic.cars : []) {
          if (Math.abs(car.x - state.x) > 7 || Math.abs(car.z - state.z) > 7) continue;
          const spec = getCollisionProfile(car.shape);
          const halfLength = spec.length / 2;
          const halfWidth = 0.92;
          const cos = Math.abs(Math.cos(car.heading));
          const sin = Math.abs(Math.sin(car.heading));
          const box = {
            x: car.x,
            z: car.z,
            w: halfWidth * cos + halfLength * sin,
            d: halfWidth * sin + halfLength * cos,
          };
          const collision = collideFootprintWithBox(footprint, box);
          if (!collision) continue;
          state.x -= collision.nx * (collision.depth + 0.02);
          state.z -= collision.nz * (collision.depth + 0.02);
          const relativeX = state.vx - car.vx;
          const relativeZ = state.vz - car.vz;
          const impactSpeed = Math.max(0, relativeX * collision.nx + relativeZ * collision.nz);
          noteScrape(collision.nx, collision.nz);
          if (impactSpeed > 0.6) {
            state.vx -= collision.nx * impactSpeed * 1.1;
            state.vz -= collision.nz * impactSpeed * 1.1;
            traffic.shake(car, impactSpeed);
            // Ramming a fleeing suspect's car (a PIT): it spins to a stop, and enough of it disables the car.
            if (car.flee) duty.rammed(car, impactSpeed);
            if (impactSpeed > 2.5 && takeDamage(4 + impactSpeed * 0.8)) {
              state._crash = {
                x: state.x,
                y: state.y || 0,
                z: state.z,
                nx: collision.nx,
                nz: collision.nz,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
            // A big crash wrecks the car (its driver climbs out dazed); a smaller one now and then makes the
            // driver get out, angry, and come for the player (the car left where it stopped).
            const angry = impactSpeed > 4 && impactSpeed <= 9 && Math.random() < 0.3;
            if ((impactSpeed > 9 || angry) && !car.keep && !car.pulled && !car.flee && !car.mission) {
              state._driverOut = {
                x: car.x - Math.cos(car.heading) * 1.6,
                z: car.z + Math.sin(car.heading) * 1.6,
                carX: car.x,
                carZ: car.z,
                dazed: !angry,
              };
              traffic.remove(car);
              state.vehicles.push({
                id: state.nextVid++,
                x: car.x + collision.nx * 0.6,
                z: car.z + collision.nz * 0.6,
                heading: car.heading + (Math.random() - 0.5) * 0.5,
                kind: "civilian",
                color: car.color,
                shape: car.shape,
              });
            }
          }
          break;
        }
        if (state.x < -200 || state.x > 250 || state.z > 150 || state.z < -700) {
          state.x = clamp(state.x, -200, 250);
          state.z = clamp(state.z, -700, 150);
          state.vx *= -0.3;
          state.vz *= -0.3;
          if (takeDamage(speed * 0.7)) {
            state._crash = {
              x: state.x,
              y: state.y || 0,
              z: state.z,
              intensity: Math.min(speed * 0.06, 1),
            };
          }
        }
      }
      const slip = state.slipAngle;
      state.drifting = speed > 6 && slip > 0.13 && state.u > 0;
      if (state.drifting) {
        state.driftTime += dt;
        state.combo = clamp(1 + Math.floor(state.driftTime / 2) + Math.floor(slip * 1.8), 1, 8);
        state.score += dt * speed * slip * state.combo * 15;
        if (state.police.some((e) => distance2D(e, state) < 85)) {
          state.wanted = clamp(state.wanted + dt * 0.27, 0, 5);
        }
      } else {
        state.driftTime = 0;
        state.combo = 1;
      }
      if (!state.onFoot) {
        state.fuel = clamp(
          state.fuel -
            dt * engine.consumption * (0.12 + speed / 16 + state.throttle * 1.5 + (state.drifting ? 2 : 0)),
          0,
          100,
        );
      }
      state.station = FUEL_STATIONS.findIndex((e) => distance2D(e, state) < 8 && speed < 2.5);
      state.store = state.onFoot
        ? FUEL_STATIONS.findIndex(
            (station) =>
              Math.abs(state.x - station.x) < 5.25 &&
              state.z > station.z + 7.05 &&
              state.z < station.z + 15.3,
          )
        : -1;
      state.shop = state.onFoot
        ? FUEL_STATIONS.findIndex(
            (station) =>
              Math.abs(state.x - station.x) < 2.35 &&
              state.z > station.z + 5.15 &&
              state.z < station.z + 7.25,
          )
        : -1;
      if (!state.onFoot && state.station >= 0) {
        state.fuel = clamp(state.fuel + dt * 14, 0, 100);
      }
      sightTick++;
      // On duty, the police are colleagues: nothing the player did makes them give chase.
      if (duty.duty.on) state.wanted = 0;
      const playerBox = orientedBox(state.x, state.z, state.heading, PLAYER_HALF_WIDTH, PLAYER_HALF_LENGTH);
      let rammed = false;
      let seen = false;
      let grabbed = false;
      // Whether any officer can see the player right now (shared over the radio: everyone knows).
      if (!state.noPolice) {
        updateHeli(dt);
        updateRoadblock(dt, speed);
      }
      state.stoppedFor = !state.onFoot && speed < 2.5 ? state.stoppedFor + dt : 0;
      state.speedingCooldown = Math.max(0, state.speedingCooldown - dt);
      // The helicopter's searchlight and the officers at a roadblock see the player too.
      const roadblockSees =
        state.wanted > 0.15 && !!state.roadblock && state.roadblock.officers.some((o) => hasLineOfSight(o));
      const heliSees = state.wanted > 0.15 && !!state.heli?.sees;
      if (heliSees || roadblockSees) seen = true;
      const officerSeesPlayer =
        state.wanted > 0.15 &&
        (heliSees || roadblockSees || state.police.some((officer) => !officer.down && !officer.dead && hasLineOfSight(officer)));
      brain.observe(state, officerSeesPlayer);
      let officersOnFoot = state.police.filter((officer) => officer.onFoot && !officer.dead).length;
      // The police open fire at 3 stars, or at any level once the player has been shooting.
      const armed = !state.noPolice && (state.wanted > 2 || (state.wanted > 0.15 && state.gunfire > 0));
      state.police.forEach((officer, index) => {
        if (officer.onFoot) {
          // Shot dead: lies there; once the player is far away, a new officer takes over the unit.
          if (officer.dead) {
            if (distance2D(officer, state) > 110) {
              if (officer.carId != null) state.vehicles = state.vehicles.filter((v) => v.id !== officer.carId);
              const far = roadGraph.nodes.filter((n) => Math.hypot(n.x - state.x, n.z - state.z) > 120);
              const node = far[Math.floor(Math.random() * far.length)] || roadGraph.nodes[0];
              Object.assign(officer, { dead: false, onFoot: false, carId: null, down: 0, x: node.x, z: node.z, speed: 0, path: null });
            }
            return;
          }
          // Knocked down by a car: lies in the street a while, then gets up.
          if (officer.down > 0) {
            officer.down -= dt;
            return;
          }
          // Hit by the player's car.
          if (!state.onFoot && speed > 4) {
            const hit = collideOrientedBoxes(
              playerBox,
              orientedBox(officer.x, officer.z, officer.heading, 0.35, 0.35),
            );
            if (hit.overlap) {
              officer.down = 9;
              officer.x += state.vx * 0.25;
              officer.z += state.vz * 0.25;
              state.wanted = clamp(state.wanted + 1.5, 0, 5);
              state._officerHit = { x: officer.x, z: officer.z, vx: state.vx, vz: state.vz, speed };
              state.shake = Math.min(state.shake + 0.3, 1.2);
              return;
            }
          }
          // Armed response (3 stars, or once the player has fired): in range and in sight, stand and shoot.
          const toPlayer = distance2D(officer, state);
          officer.aiming = armed && toPlayer < GUN_RANGE && hasLineOfSight(officer);
          if (officer.aiming) {
            officer.heading = Math.atan2(-(state.x - officer.x), -(state.z - officer.z));
            officer.fireTimer = (officer.fireTimer ?? Math.random()) - dt;
            if (officer.fireTimer <= 0) {
              officer.fireTimer = 0.55 + Math.random() * 0.7;
              fireAtPlayer(officer, toPlayer, speed);
            }
            seen = true;
            // Close enough: holds position and keeps shooting (further off, closes in while shooting).
            if (toPlayer < 14) return;
          }
          let targetX = null;
          let targetZ = null;
          // The player stopped in their car close by: run to the driver's door and pull them out.
          const toDoor =
            !state.onFoot && state.wanted > 0.15 && speed < 4 && distance2D(officer, state) < 25;
          if (state.onFoot || officer.carId == null) {
            targetX = state.x;
            targetZ = state.z;
          } else if (toDoor) {
            targetX = state.x - Math.cos(state.heading) * 1.4;
            targetZ = state.z + Math.sin(state.heading) * 1.4;
          } else {
            const policeCar = state.vehicles.find((e) => e.id === officer.carId);
            if (policeCar) {
              targetX = policeCar.x;
              targetZ = policeCar.z;
            }
          }
          if (targetX != null) {
            const dx = targetX - officer.x;
            const dz = targetZ - officer.z;
            const distance = Math.hypot(dx, dz);
            officer.heading = Math.atan2(-dx, -dz);
            if (distance > 0.4) {
              officer.x += (dx / (distance || 1)) * Math.min(distance, OFFICER_RUN_SPEED * dt);
              officer.z += (dz / (distance || 1)) * Math.min(distance, OFFICER_RUN_SPEED * dt);
            }
            if (toDoor && distance < 1.2) {
              state.arrestTimer = Math.min(state.arrestTimer + dt * 2, 5);
              grabbed = true;
            }
            if (!state.onFoot && officer.carId != null && !toDoor) {
              const policeCar = state.vehicles.find((e) => e.id === officer.carId);
              if (policeCar && Math.hypot(policeCar.x - officer.x, policeCar.z - officer.z) < 2.5) {
                state.vehicles = state.vehicles.filter((e) => e.id !== officer.carId);
                officer.onFoot = false;
                officer.x = policeCar.x;
                officer.z = policeCar.z;
                officer.heading = policeCar.heading;
                officer.carId = null;
                officersOnFoot--;
              }
            }
            if (state.onFoot && distance2D(officer, state) < 1.8) {
              state.arrestTimer = Math.min(state.arrestTimer + dt * 2.5, 5);
              grabbed = true;
            }
          }
          if (state.wanted > 0.15 && hasLineOfSight(officer)) {
            seen = true;
          }
          return;
        }
        const chasing = state.wanted > 0.15;
        officer.contactCooldown = Math.max(0, (officer.contactCooldown || 0) - dt);
        // Other cars to keep clear of: the other cruisers, parked cars and (unless ramming) the player.
        const obstacles = [];
        for (const other of state.police) if (other !== officer && !other.onFoot) obstacles.push(other);
        for (const vehicle of state.vehicles) obstacles.push(vehicle);
        if (traffic) for (const car of traffic.cars) obstacles.push(car);
        if (!chasing || officer.role !== "pursuer") obstacles.push(state);
        // A unit helping the player (the police job): backup, or a prisoner transport.
        const assist = officer.assist ? duty.assistTarget(officer) : null;
        if (assist) {
          brain.drive(officer, index, assist, dt, { chasing: true, seen: true, maxSpeed: 24, obstacles });
          if (officer.assist?.transport) {
            officer.assist.time = (officer.assist.time || 0) + dt;
            if ((Math.hypot(officer.x - assist.x, officer.z - assist.z) < 10 && Math.abs(officer.speed) < 1.5) || officer.assist.time > 70) {
              duty.transportArrived(officer);
            }
          }
        } else {
          brain.drive(officer, index, state, dt, {
            chasing,
            seen: officerSeesPlayer,
            maxSpeed: Math.min(engine.max * 0.85, 13 + state.wanted * 3.8),
            obstacles,
          });
        }
        // Fallback if it still touches a solid (a pole on a tight corner): slide out, lose speed.
        for (let solid of solidGrid.near(officer.x, officer.z, 4, nearbyBuffer)) {
          if (Math.abs(officer.x - solid.x) < solid.w + 1 && Math.abs(officer.z - solid.z) < solid.d + 1) {
            const dx = officer.x - solid.x;
            const dz = officer.z - solid.z;
            if (solid.w + 1 - Math.abs(dx) < solid.d + 1 - Math.abs(dz)) {
              officer.x = solid.x + Math.sign(dx || 1) * (solid.w + 1);
            } else {
              officer.z = solid.z + Math.sign(dz || 1) * (solid.d + 1);
            }
            officer.speed *= 0.6;
            officer.wallHits = (officer.wallHits || 0) + 1;
            break;
          }
        }
        // Not through a traffic car: slide out of it, losing speed.
        if (traffic) {
          for (const car of traffic.cars) {
            if (Math.abs(car.x - officer.x) > 6 || Math.abs(car.z - officer.z) > 6) continue;
            const contact = collideOrientedBoxes(
              orientedBox(officer.x, officer.z, officer.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
              orientedBox(car.x, car.z, car.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            );
            if (!contact.overlap) continue;
            // (The normal points from the first box, the cruiser, toward the second.)
            officer.x -= contact.nx * (contact.depth + 0.02);
            officer.z -= contact.nz * (contact.depth + 0.02);
            if (officer.speed > 4) traffic.shake(car, officer.speed * 0.4);
            officer.speed *= 0.7;
          }
        }
        // Not through a parked car (the duty car, a wreck, a car left at the curb): slide out of it.
        for (const vehicle of state.vehicles) {
          if (Math.abs(vehicle.x - officer.x) > 6 || Math.abs(vehicle.z - officer.z) > 6) continue;
          const contact = collideOrientedBoxes(
            orientedBox(officer.x, officer.z, officer.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            orientedBox(vehicle.x, vehicle.z, vehicle.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
          );
          if (!contact.overlap) continue;
          officer.x -= contact.nx * (contact.depth + 0.02);
          officer.z -= contact.nz * (contact.depth + 0.02);
          officer.speed *= 0.7;
        }
        officer.x = clamp(officer.x, -200, 250);
        officer.z = clamp(officer.z, -700, 150);
        const sees = hasLineOfSight(officer);
        if (chasing && sees) {
          seen = true;
        }
        if (chasing) sendBackup(officer, dt);
        // Speeding past a cruiser is a crime of its own.
        if (speed > 27 && !state.onFoot && state.speedingCooldown <= 0 && sees && distance2D(officer, state) < 30) {
          state.wanted = clamp(state.wanted + 0.8, 0, 5);
          state.speedingCooldown = 8;
        }
        // Armed response: a cruiser close by and slow lets its officer out to shoot (two at most).
        if (armed && officer.speed < 3 && distance2D(officer, state) < 24 && sees && officersOnFoot < 2) {
          leaveCruiser(officer);
          officersOnFoot++;
          return;
        }
        // The player stopped close by: the officer gets out to arrest them on foot (two at most).
        if (
          chasing &&
          !state.onFoot &&
          state.stoppedFor > 0.8 &&
          officer.speed < 1.5 &&
          distance2D(officer, state) < 16 &&
          officersOnFoot < 2
        ) {
          leaveCruiser(officer);
          officersOnFoot++;
          return;
        }
        const contact = collideOrientedBoxes(
          playerBox,
          orientedBox(officer.x, officer.z, officer.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
        );
        // A chasing cruiser touching the player's car is pushed out; a fresh contact also rams.
        let ramming = false;
        if (chasing && !state.onFoot && contact.overlap) {
          noteScrape(contact.nx, contact.nz);
          officer.x += contact.nx * (contact.depth + 0.03);
          officer.z += contact.nz * (contact.depth + 0.03);
          ramming = officer.contactCooldown <= 0;
        } else if (!chasing && !state.onFoot && contact.overlap && speed > 3 && officer.contactCooldown <= 0) {
          // The player crashed into a patrolling cruiser: that starts a chase.
          officer.x += contact.nx * (contact.depth + 0.03);
          officer.z += contact.nz * (contact.depth + 0.03);
          officer.contactCooldown = 2;
          state.wanted = clamp(state.wanted + 1, 0, 5);
        }
        if (ramming) {
          rammed = true;
          const impactSpeed = Math.hypot(
            state.vx + Math.sin(officer.heading) * officer.speed,
            state.vz + Math.cos(officer.heading) * officer.speed,
          );
          if (takeDamage(Math.min(12, 1.5 + impactSpeed * 0.35), true)) {
            state._crash = {
              x: state.x,
              y: state.y || 0,
              z: state.z,
              nx: contact.nx,
              nz: contact.nz,
              intensity: Math.min(impactSpeed * 0.06, 1.2),
            };
          }
          officer.contactCooldown = 2;
          officer.speed *= 0.3;
          const push = Math.min(7, 2 + impactSpeed * 0.4);
          state.vx -= contact.nx * push;
          state.vz -= contact.nz * push;
        }
      });
      // Cruisers never sit inside each other: pairs in contact are pushed apart (a few passes, so a knot of
      // three or four comes apart too). (The contact normal points from the first box toward the second:
      // the first moves back along it, the second forward.)
      for (let pass = 0; pass < 3; pass++) {
        let touching = false;
        for (let first = 0; first < state.police.length; first++) {
          for (let second = first + 1; second < state.police.length; second++) {
            const carA = state.police[first];
            const carB = state.police[second];
            if (carA.onFoot || carB.onFoot || carA.dead || carB.dead) {
              continue;
            }
            const contact = collideOrientedBoxes(
              orientedBox(carA.x, carA.z, carA.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
              orientedBox(carB.x, carB.z, carB.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            );
            if (!contact.overlap) continue;
            touching = true;
            const push = (contact.depth + 0.02) / 2;
            carA.x -= contact.nx * push;
            carA.z -= contact.nz * push;
            carB.x += contact.nx * push;
            carB.z += contact.nz * push;
            // Only on the first pass, and only when driving into each other (not every frame they touch,
            // which froze them): both lose speed, as in a real knock.
            if (pass > 0) continue;
            const [ax, az] = [-Math.sin(carA.heading), -Math.cos(carA.heading)];
            const [bx, bz] = [-Math.sin(carB.heading), -Math.cos(carB.heading)];
            const closing =
              (ax * carA.speed - bx * carB.speed) * contact.nx + (az * carA.speed - bz * carB.speed) * contact.nz;
            if (closing > 0.5) {
              carA.speed *= 0.6;
              carB.speed *= 0.6;
            }
          }
        }
        if (!touching) break;
      }
      // (Pushed apart into a parked car or a car in traffic: out of it again. Squeezed between several, a few
      // passes settle it. Traffic keeps to its lane: the cruiser and parked cars are the ones that move.)
      for (let pass = 0; pass < 4; pass++) {
        let touching = false;
        for (const officer of state.police) {
          if (officer.onFoot || officer.dead) continue;
          for (const other of traffic ? [...state.vehicles, ...traffic.cars] : state.vehicles) {
            if (Math.abs(other.x - officer.x) > 6 || Math.abs(other.z - officer.z) > 6) continue;
            const contact = collideOrientedBoxes(
              orientedBox(officer.x, officer.z, officer.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
              orientedBox(other.x, other.z, other.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            );
            if (!contact.overlap) continue;
            touching = true;
            // (A parked car is shoved half the way: wedged against traffic, the cruiser has nowhere else to go.)
            const parked = !other.piece;
            const push = (contact.depth + 0.02) * (parked ? 0.5 : 1);
            officer.x -= contact.nx * push;
            officer.z -= contact.nz * push;
            if (parked) {
              other.x += contact.nx * push;
              other.z += contact.nz * push;
            }
          }
        }
        if (!touching) break;
      }
      // A long chase in sight of the police slowly gets worse (about a star every minute and a half).
      if (state.wanted >= 1 && seen) state.wanted = clamp(state.wanted + dt * 0.012, 0, 5);
      // More stars, longer to shake them off.
      state.escapeNeeded = ESCAPE_BASE + Math.ceil(state.wanted) * ESCAPE_PER_STAR;
      if (state.wanted > 0.15 && !seen) {
        state.escape += dt;
        if (state.escape >= state.escapeNeeded) {
          state.wanted = 0;
          state.escape = 0;
        }
      } else {
        state.escape = 0;
      }
      let cruisersClose = 0;
      if (state.wanted > 0.15) {
        for (let officer of state.police) {
          if (!officer.onFoot && distance2D(officer, state) < 8) {
            cruisersClose++;
          }
        }
      }
      if ((rammed || cruisersClose >= 3) && speed < 5) {
        state.arrestTimer = Math.min(state.arrestTimer + dt, 5);
      } else if (!grabbed) {
        state.arrestTimer = Math.max(0, state.arrestTimer - dt * 2);
      }
      state.arrest = (state.arrestTimer / 5) * 100;
      state.policeSee = seen;
      if (seen) {
        state.lastSeenX = state.x;
        state.lastSeenZ = state.z;
      }
      jobs.update(state, dt);
      packages.update(state, pay);
      duty.update(dt, keys, { speed });
      if (duty.duty.on) {
        // On duty: the police are colleagues.
        state.wanted = 0;
        state.escape = 0;
        state.arrestTimer = 0;
        state.arrest = 0;
      }
      // On foot, hit by a moving car (traffic, a cruiser): hurt, knocked about.
      if (state.onFoot && state.wasted <= 0) {
        const hitBy = (x, z, heading, carSpeed) => {
          if (carSpeed < 4) return false;
          const dx = state.x - x;
          const dz = state.z - z;
          const forward = -dx * Math.sin(heading) - dz * Math.cos(heading);
          const side = dx * Math.cos(heading) - dz * Math.sin(heading);
          return Math.abs(forward) < 2.6 && Math.abs(side) < 1.25;
        };
        const hits = [];
        for (const car of traffic.cars) if (hitBy(car.x, car.z, car.heading, car.speed)) hits.push(car.speed);
        for (const officer of state.police) {
          if (!officer.onFoot && hitBy(officer.x, officer.z, officer.heading, officer.speed || 0)) hits.push(officer.speed);
        }
        if (hits.length && !(state.carHitCooldown > 0)) {
          const impact = Math.max(...hits);
          state.playerHealth = Math.max(0, state.playerHealth - impact * 4.5);
          state.sinceHit = 0;
          state.shake = Math.min(state.shake + 0.5, 1.4);
          state.carHitCooldown = 1;
          state._playerHit = { x: state.x, z: state.z, speed: impact };
        }
        state.carHitCooldown = Math.max(0, (state.carHitCooldown || 0) - dt);
      }
      for (const done of state.jobEvents) if (done.type === "done") state.cashEvents.push({ amount: done.reward, reason: done.kind });
      state.job = jobs.job;
      state.speed = Math.round(speed * 3.6);
      state.zone = state.z < -160 ? "mountain" : state.x > 130 ? "highway" : "city";
      state.y = terrainHeight(state.x, state.z);
      if (state.invincible > 0) {
        state.playerHealth = 100;
        state.health = Math.max(state.health, 1);
      }
      if (state.onFoot && state.playerHealth <= 0) {
        // Shot down: WASTED.
        state.wasted = 1e-3;
        state.wastedX = state.x;
        state.wastedZ = state.z;
      } else if (state.health <= 0 && !state.onFoot && !(state.burning > 0)) {
        // Wrecked: the car catches fire (the engine dies); get out before it blows up.
        state.burning = 1e-3;
      } else if (state.arrest >= 100) {
        // Busted: the arrest scene plays (see the top of update), then the game ends.
        state.busted = 1e-3;
        let nearest = 0;
        state.police.forEach((officer, index) => {
          if (distance2D(officer, state) < distance2D(state.police[nearest], state)) nearest = index;
        });
        state.bustedBy = nearest;
        state.bustedOnFoot = state.onFoot;
      }
      return state;
    },
  };
}

/**
 * Cars parked along the city's curbs, between the intersections (clear of the crossings and stop lines),
 * facing the way traffic drives on their side of the road. Seeded: the same streets every session.
 * They are ordinary vehicles: solid, and the player can take any of them.
 */
function parkAlongCurbs(state, solids) {
  let seed = 7331;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const LANE = 7.35; // parking lane centre, from the road's centre line (the curb is at 9 m)
  const CLEAR = 18; // metres kept clear around each intersection centre
  const SLOT = 6.6;
  // (halfX, halfZ: the car's half extents with a little room.)
  const blocked = (x, z, halfX, halfZ) =>
    solids.some((s) => Math.abs(x - s.x) < s.w + halfX && Math.abs(z - s.z) < s.d + halfZ) ||
    FUEL_STATIONS.some((st) => Math.abs(z - st.z) < 10 && Math.abs(x - st.x) < 48) ||
    state.vehicles.some((v) => Math.hypot(v.x - x, v.z - z) < 6);
  const park = (x, z, heading) => {
    const alongZ = Math.abs(Math.cos(heading)) > 0.5;
    if (random() > 0.42 || blocked(x, z, alongZ ? 1.1 : 2.7, alongZ ? 2.7 : 1.1)) return;
    const id = state.nextVid++;
    state.vehicles.push({
      id,
      x,
      z,
      heading,
      kind: "civilian",
      color: TRAFFIC_COLORS[Math.floor(random() * TRAFFIC_COLORS.length)],
      shape: CIVILIAN_SHAPES[Math.floor(random() * CIVILIAN_SHAPES.length)],
    });
  };
  for (const x of ROAD_XS) {
    for (let k = 0; k + 1 < ROAD_ZS.length; k++) {
      for (let z = ROAD_ZS[k] + CLEAR + SLOT / 2; z <= ROAD_ZS[k + 1] - CLEAR - SLOT / 2; z += SLOT) {
        park(x + LANE, z, 0); // right-hand traffic: heading north (-z) on the east side
        park(x - LANE, z, Math.PI);
      }
    }
  }
  for (const z of ROAD_ZS) {
    for (let k = 0; k + 1 < ROAD_XS.length; k++) {
      for (let x = ROAD_XS[k] + CLEAR + SLOT / 2; x <= ROAD_XS[k + 1] - CLEAR - SLOT / 2; x += SLOT) {
        park(x, z + LANE, -Math.PI / 2);
        park(x, z - LANE, Math.PI / 2);
      }
    }
  }
}
