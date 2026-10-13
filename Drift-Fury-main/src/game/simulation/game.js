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
const OFFICER_RUN_SPEED = 4.9;
const BUSTED_TIME = 4.2; // seconds of the arrest scene (hands up, cuffed) before the result screen
const HELI_ALTITUDE = 38;
const HELI_MAX_SPEED = 34; // m/s: a car flat out on the highway can outrun it
const ESCAPE_BASE = 4; // seconds out of sight to lose the police, plus ESCAPE_PER_STAR per star
const ESCAPE_PER_STAR = 2.5;
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
        const distance = distance2D(vehicle, state);
        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearest = vehicle;
        }
      }
      if (!nearest) {
        return;
      }
      state.vehicles = state.vehicles.filter((t) => t.id !== nearest.id);
      if (nearest.kind === "police") {
        const officer = state.police.find((t) => t.carId === nearest.id);
        if (officer) {
          officer.onFoot = true;
          officer.carId = null;
        }
        state.wanted = clamp(state.wanted + 1, 0, 5);
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
        spec: `${nearest.kind}|${nearest.color}|${nearest.shape}`,
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
      });
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
  let physics = createCarPhysics(car, engine);
  let carCollisionProfile = getCollisionProfile(car.shape);
  return {
    state,
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
        if (state.busted >= BUSTED_TIME) {
          state.ended = true;
          state.reason = "arrested";
        }
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
      if (state.onFoot) {
        state.throttle = 0;
        state.brake = 0;
        state.pedal = 0;
        const moveX =
          (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA || keys.KeyQ ? 1 : 0);
        const moveZ =
          (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW || keys.KeyZ ? 1 : 0);
        const moveLength = Math.hypot(moveX, moveZ) || 1;
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
        })(Math.sin(cameraHeading), Math.cos(cameraHeading), WALK_SPEED);
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
          fuel: +(state.fuel > 0),
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
        (heliSees || roadblockSees || state.police.some((officer) => !officer.down && hasLineOfSight(officer)));
      brain.observe(state, officerSeesPlayer);
      let officersOnFoot = state.police.filter((officer) => officer.onFoot).length;
      state.police.forEach((officer, index) => {
        if (officer.onFoot) {
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
        if (!chasing || officer.role !== "pursuer") obstacles.push(state);
        brain.drive(officer, index, state, dt, {
          chasing,
          seen: officerSeesPlayer,
          maxSpeed: Math.min(engine.max * 0.85, 13 + state.wanted * 3.8),
          obstacles,
        });
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
      for (let first = 0; first < state.police.length; first++) {
        for (let second = first + 1; second < state.police.length; second++) {
          const carA = state.police[first];
          const carB = state.police[second];
          if (carA.onFoot || carB.onFoot) {
            continue;
          }
          const contact = collideOrientedBoxes(
            orientedBox(carA.x, carA.z, carA.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            orientedBox(carB.x, carB.z, carB.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
          );
          if (contact.overlap) {
            const push = (contact.depth + 0.02) / 2;
            carA.x += contact.nx * push;
            carA.z += contact.nz * push;
            carB.x -= contact.nx * push;
            carB.z -= contact.nz * push;
            // Only lose speed when driving into each other (not every frame they touch, which froze them).
            const [ax, az] = [-Math.sin(carA.heading), -Math.cos(carA.heading)];
            const [bx, bz] = [-Math.sin(carB.heading), -Math.cos(carB.heading)];
            const closing =
              -(ax * carA.speed - bx * carB.speed) * contact.nx -
              (az * carA.speed - bz * carB.speed) * contact.nz;
            if (closing > 0.5) {
              carA.speed *= 0.85;
              carB.speed *= 0.85;
            }
          }
        }
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
      state.speed = Math.round(speed * 3.6);
      state.zone = state.z < -160 ? "mountain" : state.x > 130 ? "highway" : "city";
      state.y = terrainHeight(state.x, state.z);
      if (state.health <= 0) {
        state.ended = true;
        state.reason = "destroyed";
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
