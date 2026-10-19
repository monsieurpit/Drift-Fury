// City traffic: everyday cars driving the street grid (RP mode). Pure simulation, no three.js: the session
// draws the cars (instanced) and game.js makes them solid for the player.
//
// Each car follows its lane (right-hand traffic) from intersection to intersection, choosing where to go
// next (mostly straight, sometimes a turn). At traffic lights it stops on red, and on yellow when it can
// stop in time; at stop signs it comes to a full stop, waits, and goes when the intersection is clear.
// It keeps its distance from whatever is ahead in its lane (other traffic, the player, the police, a
// roadblock, people crossing), and pulls over and slows down for a police car chasing with its siren
// behind it. Stuck behind something that does not move (the player's parked car), it honks; after a long
// wait it turns off somewhere out of sight (it is removed while the camera is not looking).
//
// Intersections can never lock up: a car only drives into one with its way through reserved (no car
// inside on a crossing path, room on the road it leaves by), and never stops inside one.
//
// Light cycle (startGameSession's updateTrafficLights, 24 s): the avenues (roads along z, axis 0) are
// green 0-9 s, yellow 9-11 s, red after; the streets (along x, axis 1) green 12-21 s, yellow 21-23 s.

const LANE = 3.2; // lane centre from the road's centre line
const STOP_LINE = 14.5; // from the intersection centre (the zebra crossings are at 11.5 +- 1.5)
const ACCEL = 2.4; // m/s^2
const COMFORT_BRAKE = 4.2;
const MAX_BRAKE = 8.5;
const MIN_GAP = 2.6; // bumper to bumper, stopped
const PED_GAP = 3.2;
const LOOK_AHEAD = 32;
const CURB_SHIFT = 1.9; // how far a car pulls over toward the curb (parked cars are 4.15 m from the lane)
const TURN_SPEED = { left: 6.5, right: 5, straight: Infinity };
const HALF_LENGTH = 2.3;
const HALF_WIDTH = 1.0;
const HALF_LENGTHS = { ambulance: 2.95, firetruck: 4.75 }; // (everything else: HALF_LENGTH)
const EMERGENCY_SHIFT = 0; // (an emergency vehicle keeps to its lane: nothing ever drives side by side)
const MAKE_WAY_SHIFT = 1.2; // a car with an ambulance or a fire truck behind it moves over this much

export const TRAFFIC_LIGHT_AXIS = { along_z: 0, along_x: 1 };

/** The colour (0 green, 1 yellow, 2 red) of the light for traffic on `axis` at `phase` seconds. */
export function lightFor(axis, phase) {
  const p = ((phase % 24) + 24) % 24;
  if (axis === 0) return p < 9 ? 0 : p < 11 ? 1 : 2;
  return p >= 12 && p < 21 ? 0 : p >= 21 && p < 23 ? 1 : 2;
}

/**
 * `roadXs`, `roadZs`: the grid. `shapes`, `colors`: the cars' looks. `random`: a random source.
 * Returns { cars, update(dt, world), remove(car), carAt(x, z, radius), events }.
 */
export function createTraffic({ roadXs, roadZs, shapes, colors, random = Math.random }) {
  const nodes = [];
  const nodeAt = new Map();
  roadXs.forEach((x, i) =>
    roadZs.forEach((z, j) => {
      nodeAt.set(`${i},${j}`, nodes.length);
      nodes.push({ x, z, i, j, links: [] });
    }),
  );
  for (const node of nodes) {
    for (const [di, dj] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ]) {
      const other = nodeAt.get(`${node.i + di},${node.j + dj}`);
      if (other !== undefined) node.links.push(other);
    }
  }
  const minX = roadXs[0];
  const maxX = roadXs[roadXs.length - 1];
  const minZ = roadZs[0];
  const maxZ = roadZs[roadZs.length - 1];

  /** Direction (unit, axis-aligned) from node a to node b, and its right-hand side. */
  function direction(a, b) {
    const dx = Math.sign(nodes[b].x - nodes[a].x);
    const dz = Math.sign(nodes[b].z - nodes[a].z);
    return { dx, dz, rx: -dz, rz: dx };
  }

  /** The lane along the road from node a to node b, between the two stop lines. */
  function edgePiece(a, b) {
    const { dx, dz, rx, rz } = direction(a, b);
    const A = nodes[a];
    const B = nodes[b];
    const x0 = A.x + dx * STOP_LINE + rx * LANE;
    const z0 = A.z + dz * STOP_LINE + rz * LANE;
    const x1 = B.x - dx * STOP_LINE + rx * LANE;
    const z1 = B.z - dz * STOP_LINE + rz * LANE;
    return { kind: "edge", x0, z0, x1, z1, cx: 0, cz: 0, length: Math.hypot(x1 - x0, z1 - z0), samples: null };
  }

  /** Through the intersection at node b, from the lane coming from a to the lane leaving toward c. */
  function turnPiece(a, b, c) {
    const into = edgePiece(a, b);
    const out = edgePiece(b, c);
    const din = direction(a, b);
    const dout = direction(b, c);
    const piece = { kind: "turn", x0: into.x1, z0: into.z1, x1: out.x0, z1: out.z0, cx: 0, cz: 0, length: 0 };
    if (din.dx === dout.dx && din.dz === dout.dz) {
      piece.cx = (piece.x0 + piece.x1) / 2;
      piece.cz = (piece.z0 + piece.z1) / 2;
    } else {
      // The corner where the two lane lines cross: a quarter curve around it.
      piece.cx = din.dx !== 0 ? piece.x1 : piece.x0;
      piece.cz = din.dz !== 0 ? piece.z1 : piece.z0;
    }
    // Arc length table for the quadratic curve.
    const samples = [0];
    let length = 0;
    let px = piece.x0;
    let pz = piece.z0;
    for (let k = 1; k <= 12; k++) {
      const t = k / 12;
      const [x, z] = bezier(piece, t);
      length += Math.hypot(x - px, z - pz);
      samples.push(length);
      px = x;
      pz = z;
    }
    piece.samples = samples;
    piece.length = length;
    // Which way it turns (for the speed through it).
    const cross = din.dx * dout.dz - din.dz * dout.dx;
    piece.turn = cross === 0 ? "straight" : cross > 0 ? "right" : "left";
    return piece;
  }

  function bezier(piece, t) {
    const u = 1 - t;
    return [
      u * u * piece.x0 + 2 * u * t * piece.cx + t * t * piece.x1,
      u * u * piece.z0 + 2 * u * t * piece.cz + t * t * piece.z1,
    ];
  }

  /** Point and unit tangent at distance s along a piece. */
  function pointOn(piece, s, out) {
    if (piece.kind === "edge") {
      const f = piece.length > 0 ? Math.min(1, Math.max(0, s / piece.length)) : 0;
      out.x = piece.x0 + (piece.x1 - piece.x0) * f;
      out.z = piece.z0 + (piece.z1 - piece.z0) * f;
      out.tx = (piece.x1 - piece.x0) / (piece.length || 1);
      out.tz = (piece.z1 - piece.z0) / (piece.length || 1);
      return out;
    }
    const samples = piece.samples;
    let k = 1;
    while (k < samples.length - 1 && samples[k] < s) k++;
    const span = samples[k] - samples[k - 1] || 1;
    const t = Math.min(1, Math.max(0, (k - 1 + (s - samples[k - 1]) / span) / (samples.length - 1)));
    const [x, z] = bezier(piece, t);
    const u = 1 - t;
    let tx = 2 * u * (piece.cx - piece.x0) + 2 * t * (piece.x1 - piece.cx);
    let tz = 2 * u * (piece.cz - piece.z0) + 2 * t * (piece.z1 - piece.cz);
    const length = Math.hypot(tx, tz) || 1;
    out.x = x;
    out.z = z;
    out.tx = tx / length;
    out.tz = tz / length;
    return out;
  }

  /** What controls the approach to node b coming from a: "signal" (with its axis), "stop" or "none". */
  function controlAt(a, b) {
    const node = nodes[b];
    const { dx, dz } = direction(a, b);
    if (node.links.length === 4) return { kind: "signal", axis: dx === 0 ? 0 : 1 };
    // Stop signs on the arms whose road does not go on straight across (trafficControl.js).
    const straight = nodeAt.get(`${node.i + dx},${node.j + dz}`);
    return { kind: straight === undefined ? "stop" : "none", axis: -1 };
  }

  function chooseNext(from, at) {
    const options = nodes[at].links.filter((n) => n !== from);
    if (!options.length) return from;
    const { dx, dz } = direction(from, at);
    const weighted = options.map((n) => {
      const d = direction(at, n);
      return { n, w: d.dx === dx && d.dz === dz ? 2 : 1 };
    });
    let total = weighted.reduce((sum, o) => sum + o.w, 0);
    let pick = random() * total;
    for (const o of weighted) {
      pick -= o.w;
      if (pick <= 0) return o.n;
    }
    return weighted[weighted.length - 1].n;
  }

  const cars = [];
  const events = [];
  let nextId = 1;
  const scratch = { x: 0, z: 0, tx: 0, tz: 0 };

  /** Distance along the roads from every node to the nearer end of the goal's road. */
  function distancesTo(endpoints) {
    const distance = nodes.map(() => Infinity);
    const queue = [];
    for (const n of endpoints) {
      distance[n] = 0;
      queue.push(n);
    }
    while (queue.length) {
      queue.sort((a, b) => distance[a] - distance[b]);
      const n = queue.shift();
      for (const m of nodes[n].links) {
        const d = distance[n] + Math.hypot(nodes[m].x - nodes[n].x, nodes[m].z - nodes[n].z);
        if (d < distance[m]) {
          distance[m] = d;
          queue.push(m);
        }
      }
    }
    return distance;
  }

  /** An emergency vehicle's way on: toward its goal, onto the goal's road. */
  function routeNext(car, from, at) {
    const goal = car.goal;
    if (goal.a === at && goal.b !== from) return goal.b;
    if (goal.b === at && goal.a !== from) return goal.a;
    const options = nodes[at].links.filter((n) => n !== from);
    if (!options.length) return from;
    return options.reduce((best, n) => (goal.distance[n] < goal.distance[best] ? n : best));
  }

  function enterEdge(car, from, to) {
    car.from = from;
    car.to = to;
    car.next = car.mission === "enroute" ? routeNext(car, from, to) : chooseNext(from, to);
    // On the goal's road: where to stop, on this lane, level with the goal.
    car.stopAt = -1;
    if (car.mission === "enroute") {
      const goal = car.goal;
      if ((from === goal.a && to === goal.b) || (from === goal.b && to === goal.a)) {
        const piece = edgePiece(from, to);
        const ux = (piece.x1 - piece.x0) / (piece.length || 1);
        const uz = (piece.z1 - piece.z0) / (piece.length || 1);
        const along = (goal.x - piece.x0) * ux + (goal.z - piece.z0) * uz;
        // (The whole vehicle on this road, clear of both intersections.)
        const first = Math.min(piece.length, car.halfLength + 0.5);
        const last = Math.max(first, piece.length - car.halfLength + 0.3);
        car.stopAt = Math.max(first, Math.min(last, along));
      }
    }
    car.piece = edgePiece(from, to);
    car.turnAhead = turnPiece(from, to, car.next);
    car.control = controlAt(from, to);
    car.stopDone = false;
    car.committed = false;
    car.reserved = false;
    car.waited = 0;
  }

  function place(car) {
    pointOn(car.piece, car.s, scratch);
    // (Shifted sideways: pulling over, or going around something in the other lane.)
    car.x = scratch.x - scratch.tz * car.shift;
    car.z = scratch.z + scratch.tx * car.shift;
    car.heading = Math.atan2(-scratch.tx, -scratch.tz);
    car.vx = scratch.tx * car.speed;
    car.vz = scratch.tz * car.speed;
  }

  function spawn(world, minDistance) {
    const from = Math.floor(random() * nodes.length);
    const links = nodes[from].links;
    const to = links[Math.floor(random() * links.length)];
    const car = {
      id: nextId++,
      halfLength: HALF_LENGTH,
      mission: null,
      shape: shapes[Math.floor(random() * shapes.length)],
      color: colors[Math.floor(random() * colors.length)],
      cruise: 10.5 + random() * 3.5,
      speed: 0,
      s: 0,
      shift: 0,
      targetShift: 0,
      blocked: 0,
      honkTimer: 0,
      crashed: 0,
      x: 0,
      z: 0,
      heading: 0,
      vx: 0,
      vz: 0,
    };
    enterEdge(car, from, to);
    // (Not right at the stop line: room to stop for the light.)
    car.s = random() * Math.max(0, car.piece.length - 16);
    place(car);
    const toPlayer = Math.hypot(car.x - world.player.x, car.z - world.player.z);
    if (toPlayer < minDistance || toPlayer > 170) return null;
    // Out of sight when it appears (behind the camera, or far off), except while filling the streets
    // at the start (behind the loading screen).
    const cam = world.camera;
    if (cam && toPlayer < 120 && !world.filling) {
      const dx = car.x - cam.x;
      const dz = car.z - cam.z;
      const d = Math.hypot(dx, dz) || 1;
      if ((dx * cam.dirX + dz * cam.dirZ) / d > 0.2) return null;
    }
    for (const other of cars) if (Math.hypot(other.x - car.x, other.z - car.z) < 14) return null;
    for (const v of world.vehicles) if (Math.abs(v.x - car.x) < 4 && Math.abs(v.z - car.z) < 4) return null;
    car.speed = car.cruise * 0.6;
    place(car);
    cars.push(car);
    return car;
  }

  /** Distance to the nearest thing ahead in the car's path (bumper to bumper), and what it is. */
  function gapAhead(car, world) {
    const fx = -Math.sin(car.heading);
    const fz = -Math.cos(car.heading);
    let best = Infinity;
    let what = null;
    // `heading` (when known) turns the other car's box: one across the lane reaches further sideways.
    const consider = (x, z, halfLength, halfWidth, kind, ref, heading) => {
      const dx = x - car.x;
      const dz = z - car.z;
      if (Math.abs(dx) > LOOK_AHEAD + 6 || Math.abs(dz) > LOOK_AHEAD + 6) return;
      let along = halfLength;
      let across = halfWidth;
      if (heading !== undefined) {
        const c = Math.abs(Math.cos(heading - car.heading));
        const s = Math.abs(Math.sin(heading - car.heading));
        along = c * halfLength + s * halfWidth;
        across = c * halfWidth + s * halfLength;
      }
      const ahead = dx * fx + dz * fz;
      if (ahead + along <= 0) return;
      const side = Math.abs(dx * fz - dz * fx);
      if (side > HALF_WIDTH + across + 0.35) return;
      const gap = ahead - car.halfLength - along;
      if (gap < best) {
        best = gap;
        what = { kind, ref };
      }
    };
    for (const other of cars) {
      if (other === car) continue;
      consider(other.x, other.z, other.halfLength, HALF_WIDTH, "traffic", other, other.heading);
      // Along the road itself (exact on a curve, where a long vehicle's straight look ahead misses the
      // car around the bend): the same lane ahead, the intersection ahead, the road it turns into.
      let along = -1;
      if (car.piece.kind === "turn") {
        if (other.piece.kind === "turn" && other.from === car.from && other.to === car.to && other.next === car.next) {
          if (other.s > car.s) along = other.s - car.s;
        } else if (other.piece.kind === "edge" && other.from === car.to && other.to === car.next) {
          along = car.piece.length - car.s + other.s;
        }
      } else if (other.piece.kind === "turn" && other.from === car.from && other.to === car.to) {
        along = car.piece.length - car.s + other.s;
      } else if (other.piece.kind === "edge" && other.from === car.from && other.to === car.to && other.s > car.s) {
        along = other.s - car.s;
      }
      if (along >= 0) {
        const gap = along - car.halfLength - other.halfLength;
        if (gap < best) {
          best = gap;
          what = { kind: "traffic", ref: other };
        }
      }
    }
    const p = world.player;
    if (p.onFoot) consider(p.x, p.z, 0.4, 0.4, "person", null);
    else consider(p.x, p.z, HALF_LENGTH, HALF_WIDTH, "player", null, p.heading);
    for (const o of world.police) {
      if (o.onFoot) consider(o.x, o.z, 0.4, 0.4, "person", null);
      else consider(o.x, o.z, HALF_LENGTH, HALF_WIDTH, "police", o, o.heading);
    }
    for (const v of world.vehicles) consider(v.x, v.z, HALF_LENGTH, HALF_WIDTH, "vehicle", v, v.heading);
    for (const ped of world.people) consider(ped.x, ped.z, PED_GAP - MIN_GAP + 0.3, 0.6, "person", null);
    for (const extra of world.others || []) consider(extra.x, extra.z, HALF_LENGTH + 0.6, HALF_WIDTH + 0.2, "vehicle", extra);
    return { gap: best, what };
  }

  /** Whether the intersection box at node n is clear of other cars (for going on from a stop sign). */
  function intersectionClear(car, n, world) {
    const node = nodes[n];
    const inBox = (x, z) => Math.abs(x - node.x) < 11 && Math.abs(z - node.z) < 11;
    for (const other of cars) if (other !== car && inBox(other.x, other.z)) return false;
    if (!world.player.onFoot && inBox(world.player.x, world.player.z)) return false;
    for (const o of world.police) if (!o.onFoot && inBox(o.x, o.z)) return false;
    // Cars coming on the through road (no stop for them), within a few seconds of the intersection.
    for (const other of cars) {
      if (other === car || other.to !== n || other.piece.kind !== "edge") continue;
      const toLine = other.piece.length - other.s;
      // (A through car standing still, itself waiting for room ahead, is not coming.)
      if (other.control.kind === "none" && (other.reserved || other.speed > 1) && toLine < 6 + other.speed * 4.5) return false;
      // Another stop-sign car that got there first and is about to go.
      if (other.control.kind === "stop" && toLine < 2 && other.waited > car.waited) return false;
    }
    // The player or the police driving toward it.
    const near = (x, z, vx, vz) => {
      const dx = node.x - x;
      const dz = node.z - z;
      const distance = Math.hypot(dx, dz);
      const closing = (dx * vx + dz * vz) / (distance || 1);
      return distance < 45 && closing > 2 && distance / closing < 5;
    };
    if (!world.player.onFoot && near(world.player.x, world.player.z, world.player.vx || 0, world.player.vz || 0)) return false;
    for (const o of world.police) {
      if (!o.onFoot && near(o.x, o.z, -Math.sin(o.heading) * (o.speed || 0), -Math.cos(o.heading) * (o.speed || 0))) return false;
    }
    return true;
  }

  /**
   * Turning left across the oncoming lane: is an oncoming car (not turning left itself) close to or in
   * the intersection? Then wait at the line.
   */
  function oncomingAt(car) {
    const node = nodes[car.to];
    const { dx, dz } = direction(car.from, car.to);
    for (const other of cars) {
      if (other === car || other.crashed > 0) continue;
      const odx = -Math.sin(other.heading);
      const odz = -Math.cos(other.heading);
      // Heading the other way along the same road...
      if (odx * dx + odz * dz > -0.7) continue;
      const toNode = (node.x - other.x) * odx + (node.z - other.z) * odz;
      // ...and coming: due within 6 s (or close), until it is through the intersection.
      if (toNode < -12 || (toNode > 20 && toNode > other.speed * 6)) continue;
      if (Math.abs((node.x - other.x) * odz - (node.z - other.z) * odx) > 8) continue;
      if (other.piece.kind === "edge" ? other.turnAhead.turn === "left" : other.piece.turn === "left") continue;
      // (Waiting at its own line for its turn: not coming.)
      if (other.piece.kind === "edge" && !other.reserved && other.speed < 0.5) continue;
      return true;
    }
    return false;
  }

  /**
   * Whether the car may go into the intersection ahead: every car already in it (or about to be) must
   * be on a path that does not cross its own (following from the same direction, or coming the other
   * way with neither turning left), and the road it leaves by must have room for it (it never stops in
   * the middle, blocking the cross traffic). This is what keeps the grid from ever locking up.
   */
  function mayEnter(car) {
    const node = car.to;
    const mine = direction(car.from, node);
    for (const other of cars) {
      if (other === car || other.to !== node) continue;
      const inside = other.piece.kind === "turn" || other.reserved;
      if (!inside) continue;
      if (other.from === car.from && other.next === car.next) continue; // following it through
      const theirs = direction(other.from, node);
      const opposite = theirs.dx === -mine.dx && theirs.dz === -mine.dz;
      const theirTurn = other.piece.kind === "turn" ? other.piece.turn : other.turnAhead.turn;
      if (opposite && theirTurn !== "left" && car.turnAhead.turn !== "left") continue;
      return false;
    }
    // A long vehicle just out of it, its rear still in the intersection (unless this car follows it).
    for (const other of cars) {
      if (other === car || other.piece.kind !== "edge" || other.from !== node) continue;
      // (The lane starts at the stop line, 3.5 m outside the intersection's crossing paths.)
      if (other.s < other.halfLength - 3 && other.to !== car.next) return false;
    }
    // Room on the way out: no car stopped near the start of the road it turns into.
    for (const other of cars) {
      if (other === car || other.piece.kind !== "edge") continue;
      if (other.from === node && other.to === car.next && other.s < 9 && other.speed < 2) return false;
    }
    return true;
  }

  /**
   * A siren coming up behind in the same lane (a chasing police car, an ambulance or fire truck on its
   * way): 0 none, 1 behind (pull over and slow down), 2 alongside (stopped at the curb until it is
   * past, by its whole length).
   */
  function sirenBehind(car, world) {
    const fx = -Math.sin(car.heading);
    const fz = -Math.cos(car.heading);
    let result = 0;
    const check = (x, z, halfLength) => {
      const dx = x - car.x;
      const dz = z - car.z;
      const behind = -(dx * fx + dz * fz);
      if (Math.abs(dx * fz - dz * fx) > 5) return;
      if (behind > -(car.halfLength + halfLength + 3) && behind < 45) {
        result = Math.max(result, behind < car.halfLength + halfLength + 2 ? 2 : 1);
      }
    };
    for (const o of world.police) if (!o.onFoot && world.chasing) check(o.x, o.z, HALF_LENGTH);
    if (result) return result;
    // An ambulance or a fire truck behind in the lane (it never passes): move over a little and drive on.
    for (const other of cars) {
      if (other === car || other.mission !== "enroute") continue;
      const dx = other.x - car.x;
      const dz = other.z - car.z;
      const behind = -(dx * fx + dz * fz);
      if (behind > 0 && behind < 45 && Math.abs(dx * fz - dz * fx) < 3) return 3;
    }
    return 0;
  }

  function stepCar(car, dt, world) {
    if (car.mission === "arrived") {
      // At the scene: parked at the curb, lights flashing, until released.
      car.speed = 0;
      car.targetShift = CURB_SHIFT;
      car.shift += Math.max(-1.5 * dt, Math.min(1.5 * dt, car.targetShift - car.shift));
      place(car);
      return;
    }
    if (car.crashed > 0) {
      car.crashed -= dt;
      car.speed = Math.max(0, car.speed - MAX_BRAKE * dt);
      car.vx = car.vz = 0;
      return;
    }
    let vMax = car.cruise;
    const onEdge = car.piece.kind === "edge";
    if (!onEdge) vMax = Math.min(vMax, TURN_SPEED[car.piece.turn] + 1.5);
    const toLine = onEdge ? car.piece.length - car.s : Infinity;
    // (Stopping for the line is about the front bumper: a long vehicle stops further back, never with
    // its nose in the intersection.)
    const frontToLine = toLine - car.halfLength + 0.8;
    if (onEdge) {
      // Slow enough for the turn ahead.
      const vTurn = TURN_SPEED[car.turnAhead.turn];
      if (vTurn < Infinity) vMax = Math.min(vMax, Math.sqrt(vTurn * vTurn + 2 * COMFORT_BRAKE * toLine));
      let mustStop = false;
      let hardStop = false;
      const control = car.control;
      const stopping = (car.speed * car.speed) / (2 * COMFORT_BRAKE) + 1; // distance it needs to stop
      if (car.reserved) {
        // Going through (its way is clear). Only a light turning yellow while it can still stop
        // comfortably makes it give up its turn and stop.
        if (control.kind === "signal" && !car.committed) {
          const light = lightFor(control.axis, world.phase);
          const leftTurn = car.turnAhead.turn === "left";
          const hardStopping = (car.speed * car.speed) / (2 * MAX_BRAKE) + 0.3;
          if (light !== 0 && (frontToLine > stopping || (leftTurn && frontToLine > hardStopping))) {
            car.reserved = false;
            mustStop = true;
            hardStop = frontToLine <= stopping;
          } else if (light !== 0 || frontToLine < 3) {
            car.committed = true;
          }
        }
      } else {
        const siren = car.mission === "enroute"; // (an emergency vehicle goes through red lights and stops)
        if (siren) {
          // (Only the way through the intersection decides.)
        } else if (control.kind === "signal" && !car.committed) {
          const light = lightFor(control.axis, world.phase);
          if (light === 2) mustStop = true;
          else if (light === 1) {
            // Yellow: stop if it comfortably can, otherwise go on through. (Never when turning left across
            // the oncoming lane, where oncoming cars may be going through on the same yellow: it is slow
            // for its turn and can always stop.)
            // Only a car that cannot stop even braking hard goes through.
            const hardStopping = (car.speed * car.speed) / (2 * MAX_BRAKE) + 0.3;
            if (car.turnAhead.turn === "left" || frontToLine > hardStopping) {
              mustStop = true;
              hardStop = frontToLine < stopping;
            } else car.committed = true;
          }
        } else if (control.kind === "stop" && !car.stopDone) {
          mustStop = true;
          if (frontToLine < 2 && car.speed < 0.4) {
            car.waited += dt;
            if (car.waited > 1.0 && intersectionClear(car, car.to, world)) car.stopDone = true;
          }
        }
        // Turning left: give way to oncoming traffic.
        if (!mustStop && !siren && car.turnAhead.turn === "left" && frontToLine < 12 && oncomingAt(car)) mustStop = true;
        // At the goal: stop level with it (and never go into the intersection).
        if (car.stopAt >= 0) mustStop = true;
        // Into the intersection only with a clear way through it (see mayEnter), decided once it is
        // close enough that it would have to start braking for the line. A car that can no longer stop
        // for a yellow goes through regardless.
        const decide = Math.max(4, stopping + 2);
        if (frontToLine < decide) {
          if ((car.committed || !mustStop) && mayEnter(car)) {
            car.reserved = true;
            mustStop = false;
          } else {
            // (A car that meant to go through on the yellow but finds its way not clear stops after all,
            // as hard as it must, and then waits for the light like everyone else.)
            if (car.committed) hardStop = true;
            car.committed = false;
            mustStop = true;
          }
        }
      }
      if (mustStop) {
        const brake = hardStop ? MAX_BRAKE : COMFORT_BRAKE;
        const stopDistance = car.stopAt >= 0 ? car.stopAt - car.s : frontToLine - 0.5;
        vMax = Math.min(vMax, stopDistance < 0.1 ? 0 : Math.sqrt(2 * brake * stopDistance));
        if (car.stopAt >= 0 && stopDistance < 0.5 && car.speed < 0.5) {
          car.mission = "arrived";
          car.speed = 0;
        }
      }
    }
    // Pull over for a police car chasing behind.
    const siren = onEdge && car.mission !== "enroute" ? sirenBehind(car, world) : 0;
    const pullOver = siren > 0;
    if (siren === 1 || siren === 2) vMax = Math.min(vMax, siren === 2 ? 0 : 3.5);
    // What is ahead.
    const ahead = gapAhead(car, world);
    if (ahead.gap < Infinity) {
      const room = ahead.gap - MIN_GAP;
      const brake = ahead.what?.kind === "person" ? COMFORT_BRAKE * 1.4 : COMFORT_BRAKE;
      vMax = Math.min(vMax, room <= 0 ? 0 : Math.sqrt(2 * brake * room));
    }
    // Speed.
    if (car.speed < vMax) car.speed = Math.min(vMax, car.speed + ACCEL * dt);
    else car.speed = Math.max(vMax, car.speed - MAX_BRAKE * dt);

    // Stuck behind something that is not just traffic waiting (the player's car, a wreck): honk, then
    // go around it in the other lane if that lane is clear.
    const stuckBehind = ahead.gap < 6 && car.speed < 0.3 && ahead.what && ahead.what.kind !== "traffic";
    car.blocked = stuckBehind ? car.blocked + dt : 0;
    car.honkTimer -= dt;
    if (car.blocked > 1.8 && car.honkTimer <= 0 && ahead.what.kind !== "person") {
      car.honkTimer = 3 + random() * 3;
      events.push({ type: "horn", x: car.x, z: car.z });
    }
    car.targetShift =
      car.mission === "enroute" ? EMERGENCY_SHIFT : siren === 3 ? MAKE_WAY_SHIFT : pullOver ? CURB_SHIFT : 0;
    const shiftSpeed = 2.2 * dt;
    car.shift += Math.max(-shiftSpeed, Math.min(shiftSpeed, car.targetShift - car.shift));

    // Along the lane, into the next piece: never into an intersection without its way through reserved.
    car.s += car.speed * dt;
    if (car.piece.kind === "edge" && !car.reserved && car.s > car.piece.length - car.halfLength + 0.8) {
      car.s = Math.max(car.s - car.speed * dt, car.piece.length - car.halfLength + 0.8);
      car.speed = 0;
    }
    while (car.s > car.piece.length) {
      car.s -= car.piece.length;
      if (car.piece.kind === "edge") {
        // (Any sideways shift eases back out during the turn.)
        car.piece = car.turnAhead;
        car.targetShift = 0;
      } else {
        car.reserved = false;
        enterEdge(car, car.to, car.next);
      }
    }
    place(car);
  }

  return {
    cars,
    /** This step's events: { type: "horn", x, z }. */
    events,
    /**
     * One step. `world`: { player: {x, z, onFoot}, police: [{x, z, heading, onFoot}], chasing,
     * vehicles: [{x, z}], people: [{x, z}] (on the road), others: [{x, z}] (more cars to keep clear of),
     * phase (light cycle, s), camera: {x, z, dirX, dirZ}, count (cars wanted) }.
     */
    update(dt, world) {
      events.length = 0;
      const p = world.player;
      const inCity = p.x > minX - 40 && p.x < maxX + 40 && p.z > minZ - 40 && p.z < maxZ + 40;
      const wanted = inCity ? world.count : 0;
      // Cars far away (or once the player leaves the city, out of sight) are taken off the road.
      let civilians = 0;
      for (const car of cars) if (!car.mission) civilians++;
      for (let k = cars.length - 1; k >= 0; k--) {
        const car = cars[k];
        // (An emergency vehicle stays until its job is done; then it goes back to base, out of sight.)
        if (car.mission === "enroute" || car.mission === "arrived") continue;
        const distance = Math.hypot(car.x - p.x, car.z - p.z);
        let gone = distance > 200 || (civilians > wanted && distance > 90);
        if (car.mission === "leaving" && distance > 60) {
          const cam = world.camera;
          const dx = car.x - (cam ? cam.x : p.x);
          const dz = car.z - (cam ? cam.z : p.z);
          const d = Math.hypot(dx, dz) || 1;
          if (!cam || (dx * cam.dirX + dz * cam.dirZ) / d < 0.3 || d > 120) gone = true;
        }
        if (gone) {
          cars.splice(k, 1);
          if (!car.mission) civilians--;
        }
      }
      // New cars out of sight, a few attempts per step (more while filling up at the start).
      let attempts = civilians < wanted ? (world.filling ? 40 : 3) : 0;
      while (civilians < wanted && attempts-- > 0) if (spawn(world, world.filling ? 25 : 60)) civilians++;
      for (const car of cars) {
        stepCar(car, dt, world);
        // An emergency vehicle that cannot get through for a long time gives up and drives off.
        if (car.mission === "enroute") {
          car.enrouteTime = (car.enrouteTime || 0) + dt;
          if (car.enrouteTime > 75) this.release(car);
        }
      }
      // A car stuck behind something for a long time turns off somewhere out of sight (it is removed
      // when the camera is not looking at it).
      for (let k = cars.length - 1; k >= 0; k--) {
        const car = cars[k];
        if (car.blocked < 25 || car.mission === "enroute" || car.mission === "arrived") continue;
        const cam = world.camera;
        let seen = false;
        if (cam) {
          const dx = car.x - cam.x;
          const dz = car.z - cam.z;
          const d = Math.hypot(dx, dz) || 1;
          seen = d < 160 && (dx * cam.dirX + dz * cam.dirZ) / d > 0.35;
        }
        if (!seen) cars.splice(k, 1);
      }
    },
    /**
     * Sends an emergency vehicle (`shape` "ambulance" or "firetruck") to (x, z), from somewhere out of
     * sight 90-210 m away. Returns it (its `mission` goes "enroute" -> "arrived"), or null.
     */
    dispatch(shape, x, z, world) {
      // The road nearest the goal: the two intersections it runs between.
      let goal = null;
      nodes.forEach((node, index) => {
        for (const other of node.links) {
          const B = nodes[other];
          const length = Math.hypot(B.x - node.x, B.z - node.z);
          const ux = (B.x - node.x) / length;
          const uz = (B.z - node.z) / length;
          const along = Math.max(STOP_LINE + 2, Math.min(length - STOP_LINE - 2, (x - node.x) * ux + (z - node.z) * uz));
          const d = Math.hypot(node.x + ux * along - x, node.z + uz * along - z);
          if (!goal || d < goal.d) goal = { a: index, b: other, d, x, z };
        }
      });
      if (!goal || goal.d > 30) return null;
      goal.distance = distancesTo([goal.a, goal.b]);
      const cam = world.camera;
      const candidates = nodes
        .map((node, index) => ({ node, index, d: Math.hypot(node.x - x, node.z - z) }))
        .filter(({ node, d }) => {
          if (d < 90 || d > 210) return false;
          if (!cam) return true;
          const dx = node.x - cam.x;
          const dz = node.z - cam.z;
          const dd = Math.hypot(dx, dz) || 1;
          return dd > 110 || (dx * cam.dirX + dz * cam.dirZ) / dd < 0.2;
        });
      // (Tried in a random order: the first one with room on the road for the whole vehicle.)
      for (let k = candidates.length - 1; k > 0; k--) {
        const j = Math.floor(random() * (k + 1));
        [candidates[k], candidates[j]] = [candidates[j], candidates[k]];
      }
      for (const start of candidates) {
        const car = this.placeEmergency(shape, goal, start);
        if (car) return car;
      }
      return null;
    },
    /** (dispatch's helper) The emergency vehicle at the start of its first road, if there is room. */
    placeEmergency(shape, goal, start) {
      const first = start.node.links.reduce((best, n) => (goal.distance[n] < goal.distance[best] ? n : best));
      const car = {
        id: nextId++,
        halfLength: HALF_LENGTHS[shape] || HALF_LENGTH,
        mission: "enroute",
        goal,
        shape,
        color: "#ffffff",
        cruise: 15,
        speed: 6,
        s: 0,
        shift: EMERGENCY_SHIFT,
        targetShift: EMERGENCY_SHIFT,
        blocked: 0,
        honkTimer: 0,
        crashed: 0,
        x: 0,
        z: 0,
        heading: 0,
        vx: 0,
        vz: 0,
      };
      enterEdge(car, start.index, first);
      // Its rear clear of the intersection behind it, and nothing within its length (and a margin).
      car.s = Math.min(car.halfLength + 1, car.piece.length);
      place(car);
      for (const other of cars) {
        if (Math.hypot(other.x - car.x, other.z - car.z) < car.halfLength + other.halfLength + 4) return null;
      }
      cars.push(car);
      return car;
    },
    /** Its job done: the emergency vehicle drives off (and is taken off the road once far away). */
    release(car) {
      if (car.mission) car.mission = "leaving";
      car.stopAt = -1;
      car.targetShift = 0;
    },
    /** Takes a car off the road (the player took it, or it was wrecked). */
    remove(car) {
      const index = cars.indexOf(car);
      if (index >= 0) cars.splice(index, 1);
    },
    /** The nearest car within `radius` of (x, z), or null. */
    carAt(x, z, radius) {
      let best = null;
      let bestDistance = radius;
      for (const car of cars) {
        const d = Math.hypot(car.x - x, car.z - z);
        if (d < bestDistance) {
          bestDistance = d;
          best = car;
        }
      }
      return best;
    },
    /** A crash into a car: it stops, its driver shaken, for a few seconds. */
    shake(car, impact) {
      car.crashed = Math.max(car.crashed, 1.5 + Math.min(4, impact * 0.35));
      car.speed = 0;
    },
    HALF_LENGTH,
    HALF_WIDTH,
    /** (For tests: what a car is waiting behind.) */
    debugGap: (car, world) => gapAhead(car, world),
    debugEnter: (car) => {
      const blockers = cars.filter((o) => o !== car && o.to === car.to && (o.piece.kind === "turn" || o.reserved)).map((o) => ({ id: o.id, from: o.from, kind: o.piece.kind, reserved: o.reserved, speed: +o.speed.toFixed(1), s: +o.s.toFixed(1), len: +o.piece.length.toFixed(1), ctrl: o.control.kind, turn: o.turnAhead.turn }));
      const exitBlock = cars.filter((o) => o !== car && o.piece.kind === "edge" && o.from === car.to && o.to === car.next && o.s < 9 && o.speed < 2).map((o) => o.id);
      return { may: mayEnter(car), blockers, exitBlock };
    },
  };
}
