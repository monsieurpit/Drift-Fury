// Pedestrians: people walking the city's sidewalks around the blocks, stepping around poles, benches and
// bins, crossing at the zebra crossings (on their walk phase at traffic lights, when no car is coming at
// stop signs), running from a car coming at them, and hit by cars (thrown, falling, lying in their
// blood). The bodies are drawn by crowd.js; the blood by blood.js; voices by voices.js.
import { Quaternion, Vector3 } from "three";
import { animatePerson } from "./person.js";
import { buildSolidGrid } from "../simulation/collisions.js";

const LANE = 10.25; // the walking line, from the road's centre line (the sidewalk spans 9 to 11.4 m)
const LAT_MIN = -0.95; // offsets from the walking line: negative toward the buildings
const LAT_MAX = 0.85; // positive toward the curb
const ZEBRA = 11.5; // zebra crossings, from the intersection centre
const RADIUS = 0.28;
const CAR_HALF_WIDTH = 1.0;
const CAR_HALF_LENGTH = 2.3;
// Traffic light cycle (startGameSession's updateTrafficLights): the avenues (axis 0) are green from 0 to
// 9 s, the streets (axis 1) from 12 to 21 s, in a 24 s cycle. People start across with the parallel
// traffic's green, in its first seconds.
const WALK_ACROSS_AVENUE = [12, 16.5];
const WALK_ACROSS_STREET = [0, 4.5];
const LIE = new Quaternion();
const AXIS_X = new Vector3(1, 0, 0);
const AXIS_Y = new Vector3(0, 1, 0);

/**
 * `crowd` draws the people, `blood` the blood, `voices` ({ scream, hurt, bodyHit } with distance and
 * pan); `groundAt(x, z)` gives the surface height. `count` people live around the player.
 */
/** Fists up (a fist fight), one of them jabbing out while `swing` lasts (0.28 s). */
export function fightPose(L, swing = 0, rightHand = true) {
  const jab = swing > 0 ? Math.sin((1 - swing / 0.28) * Math.PI) : 0;
  L.la.rotation.set(1.15 + (!rightHand ? jab * 0.45 : 0), 0, 0.3);
  L.ra.rotation.set(1.15 + (rightHand ? jab * 0.45 : 0), 0, -0.3);
  L.le.rotation.set(1.5 - (!rightHand ? jab * 1.3 : 0), 0, 0);
  L.re.rotation.set(1.5 - (rightHand ? jab * 1.3 : 0), 0, 0);
  // The shoulders turn into the punch and the body leans in; between punches, a fighter's crouch.
  L.body.rotation.set(-0.12 - jab * 0.12, (rightHand ? 1 : -1) * jab * 0.38, 0);
  L.head.rotation.x = 0.12;
}

export function createPedestrians({ roadXs, roadZs, solids, crowd, blood, voices, groundAt, count, seed = 911 }) {
  let state = seed;
  const random = () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
  const grid = buildSolidGrid(solids);
  const nearBuffer = [];
  const nx = roadXs.length;
  const nz = roadZs.length;
  const blocks = [];
  for (let i = 0; i + 1 < nx; i++) for (let j = 0; j + 1 < nz; j++) blocks.push({ i, j });

  /** Corner k (0..3, counter-clockwise from the north-west) of block (i, j), and its intersection. */
  function corner(i, j, k) {
    const sx = k === 0 || k === 3 ? 1 : -1;
    const sz = k === 0 || k === 1 ? 1 : -1;
    const cx = sx > 0 ? roadXs[i] : roadXs[i + 1];
    const cz = sz > 0 ? roadZs[j] : roadZs[j + 1];
    return { x: cx + sx * LANE, z: cz + sz * LANE, cx, cz, sx, sz };
  }
  const cornerIndex = (sx, sz) => (sx > 0 ? (sz > 0 ? 0 : 3) : sz > 0 ? 1 : 2);

  function blocked(x, z, radius) {
    for (const solid of grid.near(x, z, 2, nearBuffer)) {
      if (Math.abs(x - solid.x) < solid.w + radius && Math.abs(z - solid.z) < solid.d + radius) return true;
    }
    return false;
  }

  const people = [];
  let fightTimer = 45 + random() * 60; // seconds to the next street fight
  let lastNear = null; // where the camera was last step (for putting people back out of its sight)

  function endTalk(ped) {
    const partner = ped.partner;
    ped.partner = null;
    ped.speaking = false;
    if (partner && partner.partner === ped) {
      partner.partner = null;
      if (partner.mode === "talk") partner.mode = "walk";
    }
  }

  /** Puts `ped` walking on block `block`, edge from corner k toward corner k + dir, at `s` metres. */
  function walkOn(ped, i, j, k, dir, s) {
    ped.mode = "walk";
    ped.i = i;
    ped.j = j;
    ped.k = k;
    ped.dir = dir;
    ped.s = s;
    const a = corner(i, j, k);
    const b = corner(i, j, (k + dir + 4) % 4);
    ped.ax = a.x;
    ped.az = a.z;
    ped.length = Math.hypot(b.x - a.x, b.z - a.z);
    ped.ux = (b.x - a.x) / ped.length;
    ped.uz = (b.z - a.z) / ped.length;
    // Toward the road: away from the block's centre, across the edge.
    const centreX = (roadXs[i] + roadXs[i + 1]) / 2;
    const centreZ = (roadZs[j] + roadZs[j + 1]) / 2;
    if (Math.abs(ped.uz) > 0.5) {
      ped.nx = Math.sign(a.x - centreX);
      ped.nz = 0;
    } else {
      ped.nx = 0;
      ped.nz = Math.sign(a.z - centreZ);
    }
    // Keep to the right of the sidewalk.
    const rightX = -ped.uz;
    const rightZ = ped.ux;
    ped.preferred = (rightX * ped.nx + rightZ * ped.nz) * 0.35;
  }

  /** Back onto the nearest sidewalk after running off (or when spawned somewhere). */
  function rejoin(ped) {
    const i = Math.max(0, Math.min(nx - 2, roadXs.findIndex((x) => x > ped.x) - 1));
    const j = Math.max(0, Math.min(nz - 2, roadZs.findIndex((z) => z > ped.z) - 1));
    const ii = ped.x < roadXs[0] ? 0 : ped.x > roadXs[nx - 1] ? nx - 2 : i;
    const jj = ped.z < roadZs[0] ? 0 : ped.z > roadZs[nz - 1] ? nz - 2 : j;
    let best = null;
    for (let k = 0; k < 4; k++) {
      for (const dir of [1, -1]) {
        const a = corner(ii, jj, k);
        const b = corner(ii, jj, (k + dir + 4) % 4);
        const length = Math.hypot(b.x - a.x, b.z - a.z);
        const ux = (b.x - a.x) / length;
        const uz = (b.z - a.z) / length;
        const s = Math.max(0, Math.min(length, (ped.x - a.x) * ux + (ped.z - a.z) * uz));
        const d = Math.hypot(a.x + ux * s - ped.x, a.z + uz * s - ped.z);
        if (!best || d < best.d - 0.01) best = { d, k, dir, s };
      }
    }
    walkOn(ped, ii, jj, best.k, best.dir, best.s);
    ped.lat = Math.max(LAT_MIN, Math.min(LAT_MAX, (ped.x - (ped.ax + ped.ux * ped.s)) * ped.nx + (ped.z - (ped.az + ped.uz * ped.s)) * ped.nz));
  }

  function spawn(ped, near) {
    // A random point on a block's sidewalk, preferably out of the player's sight.
    let choice = null;
    for (let attempt = 0; attempt < 24; attempt++) {
      const block = blocks[Math.floor(random() * blocks.length)];
      const k = Math.floor(random() * 4);
      const dir = random() < 0.5 ? 1 : -1;
      const a = corner(block.i, block.j, k);
      const b = corner(block.i, block.j, (k + dir + 4) % 4);
      const s = random() * Math.hypot(b.x - a.x, b.z - a.z);
      const length = Math.hypot(b.x - a.x, b.z - a.z);
      const x = a.x + ((b.x - a.x) / length) * s;
      const z = a.z + ((b.z - a.z) / length) * s;
      const distance = near ? Math.hypot(x - near.x, z - near.z) : 50;
      const inView = near ? (x - near.x) * near.viewX + (z - near.z) * near.viewZ > 0 && distance < 70 : false;
      const score = (distance > 85 ? 3 : 0) + (inView ? 2 : 0) + (distance < 25 ? 2 : 0) + random() * 0.5;
      if (!choice || score < choice.score) choice = { block, k, dir, s, score };
      if (score < 0.5) break;
    }
    walkOn(ped, choice.block.i, choice.block.j, choice.k, choice.dir, choice.s);
    ped.lat = ped.preferred;
    ped.x = ped.ax + ped.ux * ped.s + ped.nx * ped.lat;
    ped.z = ped.az + ped.uz * ped.s + ped.nz * ped.lat;
    ped.speed = 1.15 + random() * 0.45;
    ped.heading = Math.atan2(-ped.ux, -ped.uz);
    ped.visualX = ped.x;
    ped.visualZ = ped.z;
    ped.dead = null;
    ped.hp = 100;
    ped.opponent = null;
    ped.swing = 0;
    ped.stagger = 0;
    ped.panic = 0;
    ped.scared = 0;
    ped.thinkTimer = random() * 0.25;
    ped.talkCooldown = 20 + random() * 60; // in no mood to chat with anyone for a while
    ped.partner = null;
    ped.rig.visible = true;
    ped.rig.quaternion.identity();
    ped.rig.rotation.set(0, ped.heading, 0);
    for (const limb of Object.values(ped.rig.userData.L)) limb.rotation.set(0, 0, 0);
    ped.rig.userData.L.body.position.y = 0;
    ped.rig.userData.lx = undefined; // restart the walk cycle
  }

  for (let n = 0; n < count; n++) {
    const rig = crowd.add(random);
    const ped = { rig, female: rig.userData.female, lat: 0 };
    people.push(ped);
    spawn(ped, null);
  }

  /** Can a person at this corner start across now? */
  function mayCross(ped, phase, cars) {
    const signalled = ped.signalled;
    if (signalled) {
      const [from, to] = ped.crossAxis === "avenue" ? WALK_ACROSS_AVENUE : WALK_ACROSS_STREET;
      return phase >= from && phase <= to;
    }
    // Stop sign: wait for a gap. No car moving on the crossing's road within 25 m coming this way, and
    // none sitting on the crossing.
    const midX = (ped.wx + ped.tx) / 2;
    const midZ = (ped.wz + ped.tz) / 2;
    for (const car of cars) {
      const dx = midX - car.x;
      const dz = midZ - car.z;
      const distance = Math.hypot(dx, dz);
      if (distance < 6) return false;
      const speed = Math.hypot(car.vx, car.vz);
      if (speed > 1.5 && distance < 28 && dx * car.vx + dz * car.vz > 0) return false;
    }
    return ped.lookTimer <= 0;
  }

  /** At a corner: go on around the block, or head for a crossing. */
  function atCorner(ped) {
    const c = corner(ped.i, ped.j, (ped.k + ped.dir + 4) % 4);
    if (random() < 0.45) {
      const options = [];
      const xIndex = roadXs.indexOf(c.cx);
      const zIndex = roadZs.indexOf(c.cz);
      // Across the avenue to the next block west or east.
      if (ped.i - c.sx >= 0 && ped.i - c.sx <= nx - 2) options.push("avenue");
      if (ped.j - c.sz >= 0 && ped.j - c.sz <= nz - 2) options.push("street");
      if (options.length) {
        const across = options[Math.floor(random() * options.length)];
        ped.mode = "approach";
        ped.crossAxis = across;
        ped.signalled = xIndex > 0 && xIndex < nx - 1 && zIndex > 0 && zIndex < nz - 1;
        ped.lookTimer = 0.6 + random() * 1.4;
        if (across === "avenue") {
          ped.wx = c.cx + c.sx * LANE;
          ped.wz = c.cz + c.sz * ZEBRA;
          ped.tx = c.cx - c.sx * LANE;
          ped.tz = ped.wz;
          ped.next = { i: ped.i - c.sx, j: ped.j, k: cornerIndex(-c.sx, c.sz) };
        } else {
          ped.wx = c.cx + c.sx * ZEBRA;
          ped.wz = c.cz + c.sz * LANE;
          ped.tx = ped.wx;
          ped.tz = c.cz - c.sz * LANE;
          ped.next = { i: ped.i, j: ped.j - c.sz, k: cornerIndex(c.sx, -c.sz) };
        }
        return;
      }
    }
    const k = (ped.k + ped.dir + 4) % 4;
    walkOn(ped, ped.i, ped.j, k, random() < 0.9 ? ped.dir : -ped.dir, 0);
  }

  /** After crossing: on along the new block's edge that the crossing came in on. */
  function arrive(ped) {
    const { i, j, k } = ped.next;
    const c = corner(i, j, k);
    // The edge running away from the intersection along the crossing's side.
    let dir = 1;
    const b = corner(i, j, (k + 1) % 4);
    const alongZ = Math.abs(b.x - c.x) < 0.01;
    if ((ped.crossAxis === "avenue") !== alongZ) dir = -1;
    walkOn(ped, i, j, k, dir, Math.hypot(ped.x - c.x, ped.z - c.z));
    ped.lat = ped.preferred * 0.5;
  }

  const cameraForward = new Vector3();
  const lyingAxis = new Vector3();
  const tmpQuaternion = new Quaternion();

  function kill(ped, car, speed, events) {
    const rig = ped.rig;
    const hip = 0.95 * rig.scale.y;
    ped.dead = {
      position: new Vector3(ped.x, groundAt(ped.x, ped.z) + hip, ped.z),
      velocity: new Vector3(car.vx * 0.85 + (random() - 0.5) * 1.5, 1.6 + speed * 0.16, car.vz * 0.85 + (random() - 0.5) * 1.5),
      // Tumbling over the bonnet: around the car's sideways axis, and a twist.
      spin: new Vector3(Math.cos(car.heading), 0, -Math.sin(car.heading))
        .multiplyScalar(-(2 + speed * 0.35))
        .add(new Vector3(0, (random() - 0.5) * 4, 0)),
      quaternion: new Quaternion().setFromAxisAngle(AXIS_Y, ped.heading),
      bounced: 0,
      settled: false,
      time: 0,
      pooled: false,
      lastHit: 0,
      flail: random() * 10,
      noBlood: !!car.fist, // (knocked out by fists: no pool of blood)
    };
    endTalk(ped);
    ped.mode = "dead";
    events.push({ type: "killed", ped, x: ped.x, z: ped.z, speed, car });
  }

  /** Two people walking near (but not too near) the camera start fighting each other; people close by back off. */
  function startStreetFight(near, events) {
    const candidates = people.filter((ped) => {
      if (ped.mode !== "walk" && ped.mode !== "talk") return false;
      const d = Math.hypot(ped.x - near.x, ped.z - near.z);
      return d > 12 && d < 55;
    });
    for (const a of candidates) {
      const b = candidates.find((other) => other !== a && Math.hypot(other.x - a.x, other.z - a.z) < 6);
      if (!b) continue;
      for (const [ped, foe] of [[a, b], [b, a]]) {
        endTalk(ped);
        ped.mode = "brawl";
        ped.opponent = foe;
        ped.brawlTime = 0;
        ped.punchTimer = 0.4 + random() * 0.8;
        ped.hp = Math.min(ped.hp ?? 100, 100);
      }
      events.push({ type: "scream", ped: a, x: a.x, z: a.z });
      // Bystanders step away from it.
      for (const ped of people) {
        if (ped === a || ped === b || ped.mode === "dead" || ped.controlled || ped.mode === "brawl") continue;
        const dx = ped.x - a.x;
        const dz = ped.z - a.z;
        const d = Math.hypot(dx, dz);
        if (d > 7 || d < 0.01) continue;
        ped.mode = "flee";
        ped.dodging = true;
        ped.fleeSpeed = 1;
        ped.fleeX = dx / d;
        ped.fleeZ = dz / d;
        ped.panic = 1.5 + random();
      }
      return true;
    }
    return false;
  }

  function pushBody(ped, car, speed, events) {
    const dead = ped.dead;
    if (dead.time - dead.lastHit < 0.5) return;
    dead.lastHit = dead.time;
    dead.velocity.set(car.vx * 0.55, 1 + speed * 0.06, car.vz * 0.55);
    dead.spin.set((random() - 0.5) * 6, (random() - 0.5) * 3, (random() - 0.5) * 6);
    dead.settled = false;
    dead.lie = null; // (it lands again: how it lies is decided anew)
    dead.bounced = 1;
    events.push({ type: "runOver", ped, x: ped.x, z: ped.z, speed, car });
  }

  return {
    people,
    /**
     * One step. `cars`: [{ x, z, heading, vx, vz, driver }] (moving vehicles that can hit people);
     * `camera` for recycling far people; `phase`: the traffic light cycle in seconds (0..24); `player`: { x,
     * z, onFoot } (whom someone in a fist fight goes for).
     * Returns this step's events: { type: "killed" | "runOver" | "scream" | "punchPlayer", ped, x, z, ... }.
     */
    update(dt, { cars, camera, phase, player = null }) {
      const events = [];
      camera.getWorldDirection(cameraForward);
      const near = { x: camera.position.x, z: camera.position.z, viewX: cameraForward.x, viewZ: cameraForward.z };
      lastNear = near;
      // Now and then a quarrel on the sidewalk turns into a fist fight, somewhere near the player.
      fightTimer -= dt;
      if (fightTimer <= 0) {
        fightTimer = 70 + random() * 90;
        startStreetFight(near, events);
      }
      for (const ped of people) {
        const rig = ped.rig;
        if (ped.mode === "dead") {
          const dead = ped.dead;
          dead.time += dt;
          // Hit again while lying there (or still flying).
          for (const car of cars) {
            const speed = Math.hypot(car.vx, car.vz);
            if (speed < 2.5) continue;
            const dx = dead.position.x - car.x;
            const dz = dead.position.z - car.z;
            const forward = -dx * Math.sin(car.heading) - dz * Math.cos(car.heading);
            const side = dx * Math.cos(car.heading) - dz * Math.sin(car.heading);
            if (Math.abs(forward) < CAR_HALF_LENGTH && Math.abs(side) < CAR_HALF_WIDTH + 0.2) pushBody(ped, car, speed, events);
          }
          const ground = groundAt(dead.position.x, dead.position.z);
          const restHeight = ground + 0.13 * rig.scale.y;
          if (!dead.settled) {
            dead.velocity.y -= 9.8 * dt;
            const fromX = dead.position.x;
            const fromZ = dead.position.z;
            dead.position.addScaledVector(dead.velocity, dt);
            // Walls, poles, parked things: the body slams into them and drops instead of going through.
            if (blocked(dead.position.x, dead.position.z, 0.3)) {
              const impact = Math.hypot(dead.velocity.x, dead.velocity.z);
              dead.position.x = fromX;
              dead.position.z = fromZ;
              dead.velocity.x *= -0.15;
              dead.velocity.z *= -0.15;
              dead.spin.multiplyScalar(0.4);
              if (impact > 2) events.push({ type: "land", ped, x: fromX, z: fromZ, strength: impact * 0.5 });
            }
            const angle = dead.spin.length() * dt;
            if (angle > 0) {
              tmpQuaternion.setFromAxisAngle(lyingAxis.copy(dead.spin).normalize(), angle);
              dead.quaternion.premultiply(tmpQuaternion);
            }
            if (dead.position.y <= restHeight + 0.15) {
              if (dead.velocity.y < -2.2 && dead.bounced < 2) {
                // Hitting the ground: a dull bounce, and blood where the body lands.
                dead.bounced++;
                dead.velocity.y *= -0.28;
                dead.velocity.x *= 0.55;
                dead.velocity.z *= 0.55;
                dead.spin.multiplyScalar(0.45);
                dead.position.y = restHeight + 0.15;
                events.push({ type: "land", ped, x: dead.position.x, z: dead.position.z, strength: -dead.velocity.y });
              } else {
                // Sliding to a stop, turning flat onto the back or the front.
                dead.position.y = Math.max(restHeight, dead.position.y);
                dead.velocity.y = 0;
                const friction = Math.exp(-5 * dt);
                dead.velocity.x *= friction;
                dead.velocity.z *= friction;
                dead.spin.multiplyScalar(Math.exp(-7 * dt));
                // How it ends up lying (on the back or the front, which way) is decided once, when it first
                // comes down: worked out again every frame, a body landing on its side flipped between the
                // two from frame to frame.
                if (!dead.lie) {
                  const up = new Vector3(0, 0, -1).applyQuaternion(dead.quaternion).y; // face up or down
                  const yawVector = new Vector3(0, 1, 0).applyQuaternion(dead.quaternion);
                  // (Lying on the back turns the head toward +z before the yaw, on the front toward -z.)
                  const yaw = Math.atan2(yawVector.x, yawVector.z) + (up >= 0 ? 0 : Math.PI);
                  dead.lie = new Quaternion()
                    .setFromAxisAngle(AXIS_Y, yaw)
                    .multiply(tmpQuaternion.setFromAxisAngle(AXIS_X, up >= 0 ? Math.PI / 2 : -Math.PI / 2));
                }
                LIE.copy(dead.lie);
                dead.quaternion.slerp(LIE, 1 - Math.exp(-6 * dt));
                if (Math.hypot(dead.velocity.x, dead.velocity.z) < 0.15 && dead.spin.length() < 0.2) {
                  dead.settled = true;
                  dead.quaternion.copy(LIE);
                  if (!dead.pooled) {
                    dead.pooled = true;
                    if (!dead.noBlood) blood.pool(dead.position.x, dead.position.z);
                  }
                }
              }
            }
          }
          // The rig's origin is at its feet: put the hips where the body is.
          ped.x = dead.position.x;
          ped.z = dead.position.z;
          const hip = new Vector3(0, 0.95 * rig.scale.y, 0).applyQuaternion(dead.quaternion);
          rig.position.copy(dead.position).sub(hip);
          rig.quaternion.copy(dead.quaternion);
          // Limbs: flailing in the air, then sprawled (easing from one to the other, not snapping, and
          // only while actually in the air: not while sliding along the ground).
          const L = rig.userData.L;
          const t = dead.time * 9 + dead.flail;
          const airborne = !dead.settled && dead.position.y > restHeight + 0.25 ? 1 : 0;
          dead.air = (dead.air ?? 1) + (airborne - (dead.air ?? 1)) * (1 - Math.exp(-8 * dt));
          const air = dead.air;
          L.la.rotation.set(-0.6 + Math.sin(t) * 1.2 * air, 0, -1.25);
          L.ra.rotation.set(0.4 + Math.sin(t * 1.3) * 1.2 * air, 0, 1.1);
          L.le.rotation.set(0.5, 0, 0);
          L.re.rotation.set(0.9, 0, 0);
          L.lh.rotation.set(-0.35 + Math.sin(t * 0.9) * 0.8 * air, 0, -0.25);
          L.rh.rotation.set(0.25 + Math.cos(t) * 0.8 * air, 0, 0.2);
          L.lk.rotation.set(-0.25, 0, 0);
          L.rk.rotation.set(-0.9, 0, 0);
          L.body.rotation.set(0, 0, 0);
          L.body.position.y = 0;
          L.head.rotation.set(0.3, 0.6, 0);
          // Bodies are cleared away once out of sight for a while.
          const away = Math.hypot(ped.x - near.x, ped.z - near.z);
          if (dead.time > 90 && away > 45) spawn(ped, near);
          continue;
        }

        // Taken over by the police job (a suspect, posed by the session): only cars still hit them.
        if (ped.controlled) {
          for (const car of cars) {
            const dx = ped.x - car.x;
            const dz = ped.z - car.z;
            if (Math.abs(dx) > 6 || Math.abs(dz) > 6) continue;
            const speed = Math.hypot(car.vx, car.vz);
            if (speed < 3.2) continue;
            const forward = -dx * Math.sin(car.heading) - dz * Math.cos(car.heading);
            const side = dx * Math.cos(car.heading) - dz * Math.sin(car.heading);
            if (Math.abs(forward) < CAR_HALF_LENGTH + RADIUS && Math.abs(side) < CAR_HALF_WIDTH + RADIUS) {
              kill(ped, car, speed, events);
              break;
            }
          }
          continue;
        }
        // Cars: hit by one, or getting out of its way.
        let hitBy = null;
        let threat = null;
        for (const car of cars) {
          const speed = Math.hypot(car.vx, car.vz);
          const dx = ped.x - car.x;
          const dz = ped.z - car.z;
          if (Math.abs(dx) > 30 || Math.abs(dz) > 30) continue;
          const forward = -dx * Math.sin(car.heading) - dz * Math.cos(car.heading);
          const side = dx * Math.cos(car.heading) - dz * Math.sin(car.heading);
          if (Math.abs(forward) < CAR_HALF_LENGTH + RADIUS && Math.abs(side) < CAR_HALF_WIDTH + RADIUS) {
            hitBy = { car, speed, side };
            break;
          }
          if (speed > 6) {
            // Only a car actually on course to hit them (its path passes through where they stand, within
            // about a second) is a threat: a car driving past, even close, is not.
            const time = (dx * car.vx + dz * car.vz) / (speed * speed);
            if (time > 0 && time < 2.0) {
              const missX = dx - car.vx * time;
              const missZ = dz - car.vz * time;
              const miss = Math.hypot(missX, missZ);
              if (miss < CAR_HALF_WIDTH + 0.45) threat = { car, missX, missZ, miss };
            }
          }
        }
        if (hitBy) {
          if (hitBy.speed > 3.2) {
            kill(ped, hitBy.car, hitBy.speed, events);
            continue;
          }
          // A nudge: knocked aside, and running.
          const sideSign = hitBy.side >= 0 ? 1 : -1;
          ped.x += Math.cos(hitBy.car.heading) * sideSign * 0.25;
          ped.z += -Math.sin(hitBy.car.heading) * sideSign * 0.25;
          threat = { car: hitBy.car, missX: Math.cos(hitBy.car.heading) * sideSign, missZ: -Math.sin(hitBy.car.heading) * sideSign };
          if (!ped.scared) events.push({ type: "hurt", ped, x: ped.x, z: ped.z });
        }
        // Like real people, they need time to notice a car coming at them and react: 0.75 to 1.35 s (longer
        // in the middle of a conversation). Then about a third freeze in the headlights; the others step
        // hurriedly out of the way (not an instant sprint), screaming only on a really close call. A car
        // seen coming from far off can be avoided; a fast one out of nowhere usually can't.
        ped.alarm = threat ? (ped.alarm || 0) + dt : 0;
        if (!threat) ped.reaction = undefined;
        if (threat && ped.reaction === undefined) {
          ped.reaction = 0.75 + random() * 0.6 + (ped.mode === "talk" ? 0.4 : 0);
          ped.freezes = random() < 0.33;
        }
        if (threat && ped.mode !== "flee" && ped.mode !== "frozen" && (ped.alarm > ped.reaction || hitBy)) {
          endTalk(ped);
          const closeCall = hitBy || (threat.miss ?? 0) < 0.9;
          if (ped.freezes && !hitBy) {
            ped.mode = "frozen";
            ped.panic = 1.2 + random() * 0.8;
          } else {
            const length = Math.hypot(threat.missX, threat.missZ) || 1;
            ped.mode = "flee";
            ped.dodging = true;
            ped.fleeSpeed = 0;
            ped.fleeX = threat.missX / length;
            ped.fleeZ = threat.missZ / length;
            ped.panic = 0.8 + random() * 0.4;
          }
          if (closeCall && ped.scared <= 0 && random() < 0.5) events.push({ type: "scream", ped, x: ped.x, z: ped.z });
          ped.scared = 4;
        }
        ped.scared = Math.max(0, ped.scared - dt);
        ped.talkCooldown -= dt;

        let moveX = 0;
        let moveZ = 0;
        let speed = 0;
        ped.swing = Math.max(0, (ped.swing || 0) - dt);
        ped.stagger = Math.max(0, (ped.stagger || 0) - dt);
        if (ped.mode === "brawl") {
          // In a fist fight (with the player, or another person: ped.opponent): closes in, fists up, and
          // throws punches. Gives up (runs off) when badly hurt, when the other one is down, gone or in a car,
          // or after a while.
          ped.brawlTime += dt;
          const foe = ped.opponent;
          const target = foe || player;
          const dx = target ? target.x - ped.x : 0;
          const dz = target ? target.z - ped.z : 0;
          const d = Math.hypot(dx, dz) || 1;
          const foeDone = foe ? foe.mode === "dead" || foe.mode !== "brawl" || foe.controlled : !player || !player.onFoot || player.dead;
          if (foeDone || d > 25 || ped.brawlTime > (foe ? 25 : 45) || ped.hp < 25) {
            ped.opponent = null;
            ped.mode = "flee";
            ped.dodging = false;
            ped.fleeSpeed = 2;
            ped.fleeX = -dx / d;
            ped.fleeZ = -dz / d;
            ped.panic = 3 + random() * 2;
          } else if (ped.stagger > 0) {
            // (Reeling from a punch.)
          } else if (d > 0.95) {
            speed = d > 3 ? 3.6 : 1.8;
            moveX = dx / d;
            moveZ = dz / d;
            if (blocked(ped.x + moveX * 0.5, ped.z + moveZ * 0.5, RADIUS)) {
              [moveX, moveZ] = [-moveZ, moveX];
              if (blocked(ped.x + moveX * 0.5, ped.z + moveZ * 0.5, RADIUS)) [moveX, moveZ] = [-moveX, -moveZ];
            }
          } else {
            ped.punchTimer -= dt;
            if (ped.punchTimer <= 0) {
              ped.punchTimer = 0.75 + random() * 0.55;
              ped.swing = 0.28;
              ped.punchHand = !ped.punchHand;
              const damage = 5 + random() * 5;
              if (!foe) events.push({ type: "punchPlayer", ped, x: ped.x, z: ped.z, damage });
              else if (random() < 0.7) {
                // (Some punches miss: a duck, a step back.)
                foe.hp -= damage * 1.6;
                foe.stagger = 0.35;
                if (foe.hp <= 0) {
                  const length = d || 1;
                  kill(foe, { x: ped.x, z: ped.z, vx: (dx / length) * 2.2, vz: (dz / length) * 2.2, heading: ped.heading, player: false, fist: true }, 1, events);
                  foe.dead.velocity.y = 1.2;
                } else events.push({ type: "hurt", ped: foe, x: foe.x, z: foe.z });
              }
            }
          }
        } else if (ped.mode === "frozen") {
          // Rooted to the spot, staring at the car.
          ped.panic -= dt;
          if (ped.panic <= 0) rejoin(ped);
        } else if (ped.mode === "flee") {
          ped.panic -= dt;
          // A dodge gets going over a few tenths of a second, to a hurried 3 m/s; running from a death, 4.6.
          ped.fleeSpeed = Math.min(ped.dodging ? 3 : 4.6, (ped.fleeSpeed ?? 4.6) + dt * 7);
          speed = ped.fleeSpeed;
          moveX = ped.fleeX;
          moveZ = ped.fleeZ;
          if (blocked(ped.x + moveX * 0.6, ped.z + moveZ * 0.6, RADIUS)) {
            // Run along whatever is in the way.
            const along = random() < 0.5 ? 1 : -1;
            [ped.fleeX, ped.fleeZ] = [-ped.fleeZ * along, ped.fleeX * along];
            moveX = ped.fleeX;
            moveZ = ped.fleeZ;
          }
          if (ped.panic <= 0) rejoin(ped);
        } else if (ped.mode === "walk") {
          // Steering around what is on the sidewalk, a few times a second.
          ped.thinkTimer -= dt;
          if (ped.thinkTimer <= 0) {
            ped.thinkTimer = 0.25;
            // Now and then two people who cross paths stop for a chat.
            if (ped.talkCooldown <= 0 && !ped.scared) {
              for (const other of people) {
                if (other === ped || other.mode !== "walk" || other.talkCooldown > 0 || other.scared) continue;
                if (Math.hypot(other.x - ped.x, other.z - ped.z) > 1.7) continue;
                ped.talkCooldown = other.talkCooldown = 40 + random() * 80;
                if (random() > 0.35) break; // just passing by
                const length = 6 + random() * 10;
                for (const [a, b] of [
                  [ped, other],
                  [other, ped],
                ]) {
                  a.mode = "talk";
                  a.partner = b;
                  a.talkTime = length;
                }
                ped.speaking = true;
                other.speaking = false;
                ped.turnTimer = 0;
                break;
              }
              if (ped.mode === "talk") continue;
            }
            let best = ped.lat;
            let bestCost = Infinity;
            for (const lat of [ped.lat, ped.preferred, -0.85, -0.45, 0, 0.4, 0.8]) {
              let cost = Math.abs(lat - ped.preferred) * 0.5 + Math.abs(lat - ped.lat) * 0.3;
              for (const ahead of [0.5, 1.1, 1.8]) {
                const s = Math.min(ped.length, ped.s + ahead);
                const x = ped.ax + ped.ux * s + ped.nx * lat;
                const z = ped.az + ped.uz * s + ped.nz * lat;
                if (blocked(x, z, RADIUS + 0.06)) cost += 10 / ahead;
              }
              for (const other of people) {
                if (other === ped || other.mode === "dead") continue;
                const ox = ped.ax + ped.ux * (ped.s + 1) + ped.nx * lat - other.x;
                const oz = ped.az + ped.uz * (ped.s + 1) + ped.nz * lat - other.z;
                if (ox * ox + oz * oz < 0.5) cost += 3;
              }
              if (cost < bestCost) {
                bestCost = cost;
                best = lat;
              }
            }
            ped.targetLat = best;
          }
          const targetLat = ped.targetLat ?? ped.preferred;
          ped.lat += Math.max(-1.1 * dt, Math.min(1.1 * dt, targetLat - ped.lat));
          ped.lat = Math.max(LAT_MIN, Math.min(LAT_MAX, ped.lat));
          // Slow down behind someone slower, rather than walking through them.
          let pace = ped.speed;
          const blockedAhead = blocked(
            ped.ax + ped.ux * (ped.s + 0.45) + ped.nx * ped.lat,
            ped.az + ped.uz * (ped.s + 0.45) + ped.nz * ped.lat,
            RADIUS,
          );
          if (blockedAhead) pace = 0.2;
          ped.s += pace * dt;
          const x = ped.ax + ped.ux * ped.s + ped.nx * ped.lat;
          const z = ped.az + ped.uz * ped.s + ped.nz * ped.lat;
          moveX = x - ped.x;
          moveZ = z - ped.z;
          ped.x = x;
          ped.z = z;
          speed = -1; // already moved
          if (ped.s >= ped.length) atCorner(ped);
        } else if (ped.mode === "approach" || ped.mode === "cross") {
          const tx = ped.mode === "approach" ? ped.wx : ped.tx;
          const tz = ped.mode === "approach" ? ped.wz : ped.tz;
          const dx = tx - ped.x;
          const dz = tz - ped.z;
          const distance = Math.hypot(dx, dz);
          speed = ped.mode === "cross" ? Math.max(ped.speed * 1.25, 1.6) : ped.speed;
          if (ped.mode === "cross") {
            // Walk a little faster if a car is coming toward them.
            for (const car of cars) {
              const dx = ped.x - car.x;
              const dz = ped.z - car.z;
              if (Math.hypot(dx, dz) < 22 && Math.hypot(car.vx, car.vz) > 4 && dx * car.vx + dz * car.vz > 0) {
                speed = Math.max(speed, 2.2);
              }
            }
          }
          if (distance < 0.15) {
            if (ped.mode === "approach") {
              ped.mode = "wait";
              ped.waitHeading = Math.atan2(-(ped.tx - ped.wx), -(ped.tz - ped.wz));
            } else {
              arrive(ped);
            }
          } else {
            moveX = dx / distance;
            moveZ = dz / distance;
            speed = Math.min(speed, distance / dt);
          }
        } else if (ped.mode === "talk") {
          ped.talkTime -= dt;
          // Taking turns: the speaker talks for a couple of seconds, then listens.
          if (ped.speaking) {
            ped.turnTimer -= dt;
            if (ped.turnTimer <= 0) {
              ped.turnTimer = 1.4 + random() * 2.2;
              if (random() < 0.45 && ped.partner) {
                ped.speaking = false;
                ped.partner.speaking = true;
                ped.partner.turnTimer = 0;
              } else {
                events.push({ type: "talk", ped, x: ped.x, z: ped.z });
              }
            }
          }
          if (ped.talkTime <= 0 || !ped.partner || ped.partner.mode !== "talk") {
            endTalk(ped);
            ped.mode = "walk";
          }
        } else if (ped.mode === "wait") {
          ped.lookTimer -= dt;
          if (mayCross(ped, phase, cars)) ped.mode = "cross";
        }
        if (speed > 0) {
          ped.x += moveX * speed * dt;
          ped.z += moveZ * speed * dt;
        }
        // Facing where they go (or across the road while waiting), turning smoothly.
        let wantHeading = ped.heading;
        if (ped.mode === "wait") wantHeading = ped.waitHeading;
        else if (ped.mode === "brawl" && (ped.opponent || player)) {
          const foe = ped.opponent || player;
          wantHeading = Math.atan2(-(foe.x - ped.x), -(foe.z - ped.z));
        }
        else if (ped.mode === "talk" && ped.partner)
          wantHeading = Math.atan2(-(ped.partner.x - ped.x), -(ped.partner.z - ped.z));
        else if (Math.hypot(moveX, moveZ) > 1e-4) wantHeading = Math.atan2(-moveX, -moveZ);
        let turn = wantHeading - ped.heading;
        turn = Math.atan2(Math.sin(turn), Math.cos(turn));
        ped.heading += turn * Math.min(1, dt * 8);
        // Smoothed position for the body (corners and avoidance would otherwise snap).
        const follow = 1 - Math.exp(-10 * dt);
        ped.visualX += (ped.x - ped.visualX) * follow;
        ped.visualZ += (ped.z - ped.visualZ) * follow;
        rig.position.set(ped.visualX, groundAt(ped.visualX, ped.visualZ), ped.visualZ);
        rig.rotation.set(0, ped.heading, 0);
        if (ped.mode === "flee") rig.userData.L.body.rotation.x = -0.25;
        animatePerson(rig, dt, ped.visualX, ped.visualZ);
        if (ped.mode === "talk") {
          // Gestures while talking, nods while listening.
          const L = rig.userData.L;
          const t = ped.talkTime;
          if (ped.speaking) {
            L.ra.rotation.x = -0.55 + Math.sin(t * 3.1) * 0.3;
            L.re.rotation.x = 1.1 + Math.sin(t * 4.3) * 0.25;
            L.la.rotation.x = -0.15 + Math.sin(t * 2.3 + 1) * 0.15;
            L.head.rotation.x = Math.sin(t * 5.2) * 0.06;
            L.head.rotation.y = Math.sin(t * 1.3) * 0.15;
          } else {
            L.head.rotation.x = Math.max(0, Math.sin(t * 2.4)) * 0.18;
            L.head.rotation.y = 0;
          }
        } else if (ped.mode === "wait") rig.userData.L.head.rotation.y = Math.sin(ped.lookTimer * 2) * 0.5;
        else rig.userData.L.head.rotation.y = 0;
        // Someone walking right past the player on foot glances at them.
        if (player && player.onFoot && !player.dead && (ped.mode === "walk" || ped.mode === "wait" || ped.mode === "cross")) {
          const away = Math.hypot(player.x - ped.x, player.z - ped.z);
          if (away < 5) {
            let look = Math.atan2(-(player.x - ped.x), -(player.z - ped.z)) - ped.heading;
            look = Math.atan2(Math.sin(look), Math.cos(look));
            const L = rig.userData.L;
            if (Math.abs(look) < 1.7) L.head.rotation.y = look * 0.6 * Math.min(1, (5 - away) / 2);
          }
        }
        if (ped.mode === "brawl") fightPose(rig.userData.L, ped.swing, ped.punchHand);
        if (ped.stagger > 0) {
          // Rocked back by a punch.
          const L = rig.userData.L;
          L.body.rotation.x = 0.35 * (ped.stagger / 0.35);
          L.head.rotation.x = 0.4 * (ped.stagger / 0.35);
        }
        // Too far from the player: walk on somewhere nearer, out of sight.
        if (Math.hypot(ped.x - near.x, ped.z - near.z) > 105) spawn(ped, near);
      }
      return events;
    },
    /**
     * A driver pulled out of their car at (x, z) runs off away from (fromX, fromZ), screaming: one of the
     * people out of the player's sight is moved there.
     */
    ejectDriver(x, z, fromX, fromZ, viewX, viewZ, events) {
      let pick = null;
      let pickScore = -Infinity;
      for (const ped of people) {
        if (ped.mode === "dead" || ped.controlled) continue;
        const dx = ped.x - fromX;
        const dz = ped.z - fromZ;
        const distance = Math.hypot(dx, dz);
        const inView = (dx * viewX + dz * viewZ) / (distance || 1) > 0.3 && distance < 80;
        const score = distance + (inView ? -1000 : 0);
        if (score > pickScore) {
          pickScore = score;
          pick = ped;
        }
      }
      if (!pick) return;
      endTalk(pick);
      spawn(pick, null);
      pick.x = pick.visualX = x;
      pick.z = pick.visualZ = z;
      const awayX = x - fromX;
      const awayZ = z - fromZ;
      const away = Math.hypot(awayX, awayZ) || 1;
      pick.mode = "flee";
      pick.dodging = false;
      pick.fleeSpeed = 2.5;
      pick.fleeX = awayX / away;
      pick.fleeZ = awayZ / away;
      pick.panic = 4 + random() * 2;
      pick.scared = 8;
      pick.heading = Math.atan2(-pick.fleeX, -pick.fleeZ);
      pick.rig.position.set(x, groundAt(x, z), z);
      pick.rig.rotation.set(0, pick.heading, 0);
      events.push({ type: "scream", ped: pick, x, z });
    },
    /** `ped` shot from (fromX, fromZ): collapses where they stand (the "killed" event, its car marked gun). */
    shoot(ped, fromX, fromZ, events) {
      if (ped.mode === "dead") return;
      const dx = ped.x - fromX;
      const dz = ped.z - fromZ;
      const d = Math.hypot(dx, dz) || 1;
      kill(ped, { x: fromX, z: fromZ, vx: (dx / d) * 1.2, vz: (dz / d) * 1.2, heading: Math.atan2(-dx, -dz), player: true, gun: true }, 0.5, events);
      ped.dead.velocity.y = 0.6;
    },
    /**
     * `ped` punched by the player at (fromX, fromZ) for `damage` (of 100): rocked back; out cold (the
     * "killed" event, its car marked fist) once worn down. About half of those hit fight back (a "brawl":
     * see update), the others run.
     */
    punch(ped, fromX, fromZ, damage, events) {
      if (ped.mode === "dead" || ped.controlled) return;
      const dx = ped.x - fromX;
      const dz = ped.z - fromZ;
      const d = Math.hypot(dx, dz) || 1;
      ped.hp = (ped.hp ?? 100) - damage;
      if (ped.hp <= 0) {
        kill(ped, { x: fromX, z: fromZ, vx: (dx / d) * 2.4, vz: (dz / d) * 2.4, heading: Math.atan2(-dx, -dz), player: true, fist: true }, 1, events);
        ped.dead.velocity.y = 1.3;
        return;
      }
      if (!blocked(ped.x + (dx / d) * 0.35, ped.z + (dz / d) * 0.35, RADIUS)) {
        ped.x += (dx / d) * 0.35;
        ped.z += (dz / d) * 0.35;
      }
      ped.stagger = 0.35;
      events.push({ type: "hurt", ped, x: ped.x, z: ped.z });
      if (ped.mode === "brawl") {
        ped.opponent = null; // (whoever they were fighting, now it is the player)
        return;
      }
      endTalk(ped);
      ped.tough ??= random();
      if (ped.tough < 0.5 && ped.hp > 40) {
        ped.opponent = null;
        ped.mode = "brawl";
        ped.brawlTime = 0;
        ped.punchTimer = 0.5 + random() * 0.4;
      } else {
        ped.mode = "flee";
        ped.dodging = false;
        ped.fleeSpeed = 2.5;
        ped.fleeX = dx / d;
        ped.fleeZ = dz / d;
        ped.panic = 4 + random() * 3;
        if (random() < 0.6) events.push({ type: "scream", ped, x: ped.x, z: ped.z });
      }
      ped.scared = 6;
    },
    /** An explosion at (x, z): people within `radius` are thrown, dead (the "killed" events). */
    blast(x, z, radius, events) {
      for (const ped of people) {
        if (ped.mode === "dead") continue;
        const dx = ped.x - x;
        const dz = ped.z - z;
        const d = Math.hypot(dx, dz);
        if (d > radius) continue;
        const push = (radius - d) * 2.2 + 2;
        const ux = d > 0.01 ? dx / d : 1;
        const uz = d > 0.01 ? dz / d : 0;
        kill(ped, { x, z, vx: ux * push, vz: uz * push, heading: Math.atan2(-ux, -uz), player: false }, push, events);
      }
    },
    /** A body taken away (by the paramedics): that person is back to life somewhere out of sight. */
    removeBody(ped) {
      if (ped.mode !== "dead") return;
      spawn(ped, lastNear);
    },
    /**
     * A body for a suspect of the police job at (x, z) (`female` preferred): one of the people out of the
     * player's sight, taken out of the crowd's own life (`controlled`) until released.
     */
    claim(x, z, female, strict = false) {
      let pick = null;
      let pickScore = -Infinity;
      for (const ped of people) {
        if (ped.mode === "dead" || ped.controlled) continue;
        let score = 0;
        if (lastNear) {
          const dx = ped.x - lastNear.x;
          const dz = ped.z - lastNear.z;
          const distance = Math.hypot(dx, dz);
          const inView = (dx * lastNear.viewX + dz * lastNear.viewZ) / (distance || 1) > 0.2 && distance < 90;
          score = Math.min(distance, 60) + (inView ? -1000 : 0);
        }
        if (female !== undefined && ped.female === female) score += strict ? 5000 : 30;
        if (score > pickScore) {
          pickScore = score;
          pick = ped;
        }
      }
      if (!pick) return null;
      this.claimPed(pick);
      pick.x = pick.visualX = x;
      pick.z = pick.visualZ = z;
      pick.rig.position.set(x, groundAt(x, z), z);
      return pick;
    },
    /** Takes `ped` (someone the player stopped) out of the crowd's own life. */
    claimPed(ped) {
      endTalk(ped);
      ped.opponent = null;
      ped.controlled = true;
      ped.mode = "held";
      ped.panic = 0;
      ped.scared = 0;
      ped.rig.visible = true;
      ped.rig.rotation.order = "YXZ";
    },
    /** Back to their own life: walking on from where they are (`away`: somewhere out of sight instead). */
    release(ped, away = false) {
      if (!ped.controlled) return;
      ped.controlled = false;
      ped.rig.rotation.order = "XYZ";
      ped.rig.rotation.set(0, ped.heading, 0);
      ped.rig.visible = true;
      for (const limb of Object.values(ped.rig.userData.L)) limb.rotation.set(0, 0, 0);
      if (ped.mode === "dead") return;
      if (away) spawn(ped, lastNear);
      else {
        ped.visualX = ped.x;
        ped.visualZ = ped.z;
        rejoin(ped);
      }
    },
    /** People near (x, z) see something terrible and run from it. */
    frighten(x, z, radius, events) {
      for (const ped of people) {
        if (ped.mode === "dead" || ped.controlled) continue;
        const dx = ped.x - x;
        const dz = ped.z - z;
        const distance = Math.hypot(dx, dz);
        if (distance > radius || distance < 0.01) continue;
        ped.mode = "flee";
        ped.dodging = false;
        ped.fleeSpeed = 1.5;
        ped.fleeX = dx / distance;
        ped.fleeZ = dz / distance;
        ped.panic = 2.5 + random() * 3;
        if (ped.scared <= 0 && random() < 0.55) events.push({ type: "scream", ped, x: ped.x, z: ped.z });
        ped.scared = 6;
      }
    },
  };
}
