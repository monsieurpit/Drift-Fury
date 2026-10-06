// Police driving AI.
//
// Cruisers drive like cars on the real road network instead of beelining at the player through buildings:
//  - a road graph (city grid, the A9 and its two connectors, the mountain road up to the summit) and a
//    shortest-path planner, re-planned a few times a second toward each unit's goal;
//  - path following with pure pursuit on a kinematic bicycle model (real turning radius, steering rate
//    and acceleration/braking limits, reversing), keeping to the right lane on patrol;
//  - speed planning that brakes ahead of corners and hairpins from the path's curvature, and for cruisers,
//    parked cars and the player in its lane;
//  - a direct-pursuit mode only when the player is close and the straight line to them is clear;
//  - stuck recovery (reverse out with opposite lock, then re-plan);
//  - team tactics: a lead pursuer that rams, an interceptor that aims where the player will be, a unit
//    that sets up a roadblock at the intersection ahead of the player, and a backup unit that boxes the
//    player in; units search around the last known position when they lose sight of the player.
import { ROAD_END_Z, SUMMIT, roadCenterX } from "../world/terrain.js";

const WHEELBASE = 2.7;
const MAX_STEER = 0.62; // rad: a turning circle of ~4.4 m radius, like a real car
const STEER_RATE = 3.2; // rad/s the wheels can be turned
const BRAKE = 9; // m/s^2
const ROLES = ["pursuer", "interceptor", "roadblock", "backup"];

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const wrapAngle = (a) => Math.atan2(Math.sin(a), Math.cos(a));
const forwardOf = (heading) => [-Math.sin(heading), -Math.cos(heading)];
const headingOf = (dx, dz) => Math.atan2(-dx, -dz);

/** The drivable road network as nodes and undirected edges. */
export function buildRoadGraph({ roadXs, roadZs }) {
  const nodes = [];
  const edges = [];
  const node = (x, z) => {
    nodes.push({ x, z, links: [] });
    return nodes.length - 1;
  };
  const link = (a, b) => {
    const length = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].z - nodes[b].z);
    nodes[a].links.push({ to: b, length });
    nodes[b].links.push({ to: a, length });
    edges.push([a, b]);
  };
  // City grid intersections.
  const grid = roadXs.map((x) => roadZs.map((z) => node(x, z)));
  roadXs.forEach((_, i) =>
    roadZs.forEach((_, j) => {
      if (i + 1 < roadXs.length) link(grid[i][j], grid[i + 1][j]);
      if (j + 1 < roadZs.length) link(grid[i][j], grid[i][j + 1]);
    }),
  );
  const at = (x, z) => grid[roadXs.indexOf(x)]?.[roadZs.indexOf(z)];
  // The A9 along x = 175 and its connectors to the grid's east avenue at z = 70 and z = -80.
  const highway = [140, 70, -80, -300, -500, -680].map((z) => node(175, z));
  for (let k = 0; k + 1 < highway.length; k++) link(highway[k], highway[k + 1]);
  const east = roadXs[roadXs.length - 1];
  if (at(east, 70) !== undefined) link(at(east, 70), highway[1]);
  if (at(east, -80) !== undefined) link(at(east, -80), highway[2]);
  // Mountain road from the end of the x = 0 avenue up to the summit lookout.
  let previous = at(0, roadZs[0]);
  for (let z = roadZs[0] - 10; z > ROAD_END_Z; z -= 10) {
    const next = node(roadCenterX(z), z);
    if (previous !== undefined) link(previous, next);
    previous = next;
  }
  link(previous, node(SUMMIT.x, SUMMIT.z));
  return { nodes, edges };
}

/**
 * Closest point of the network to (x, z): { x, z, edge: [a, b], t, distance }. With `heading`, an edge
 * along the direction of travel is preferred over a crossing one (at an intersection both are close).
 */
function project(graph, x, z, heading) {
  const [hx, hz] = heading === undefined ? [0, 0] : forwardOf(heading);
  let best = null;
  for (const [a, b] of graph.edges) {
    const A = graph.nodes[a];
    const B = graph.nodes[b];
    const ex = B.x - A.x;
    const ez = B.z - A.z;
    const t = clamp(((x - A.x) * ex + (z - A.z) * ez) / (ex * ex + ez * ez || 1), 0, 1);
    const px = A.x + ex * t;
    const pz = A.z + ez * t;
    const distance = Math.hypot(x - px, z - pz);
    const alignment = heading === undefined ? 1 : Math.abs(hx * ex + hz * ez) / (Math.hypot(ex, ez) || 1);
    const score = distance + (1 - alignment) * 3;
    if (!best || score < best.score) best = { x: px, z: pz, edge: [a, b], t, distance, score };
  }
  return best;
}

/**
 * Shortest route along the network between two projected points; returns a polyline [{x, z}].
 * `motion` ({ heading, speed }) makes it drivable for a moving car: turning round is costly at speed, and no turn at the
 * next intersection if it is too close to brake for: the car goes straight through and turns later.
 */
function route(graph, from, to, motion) {
  if (from.edge[0] === to.edge[0] && from.edge[1] === to.edge[1]) return [from, to];
  const count = graph.nodes.length;
  const cost = new Float64Array(count).fill(Infinity);
  const previous = new Int32Array(count).fill(-1);
  const done = new Uint8Array(count);
  const [a, b] = from.edge;
  const edgeLength = (e) =>
    Math.hypot(graph.nodes[e[1]].x - graph.nodes[e[0]].x, graph.nodes[e[1]].z - graph.nodes[e[0]].z);
  cost[a] = from.t * edgeLength(from.edge);
  cost[b] = (1 - from.t) * edgeLength(from.edge);
  let locked = -1;
  let lockedNext = -1;
  if (motion && motion.speed > 8) {
    const [fx, fz] = forwardOf(motion.heading);
    const A = graph.nodes[a];
    const B = graph.nodes[b];
    const ahead = (B.x - A.x) * fx + (B.z - A.z) * fz > 0 ? b : a;
    const behind = ahead === b ? a : b;
    cost[behind] += 40 + motion.speed * 2; // turning round means stopping and a three-point turn
    // Shorter than the distance the speed planner brakes over for a turn, so a car that is braking for
    // its turn keeps it; only one that can no longer stop in time goes straight on.
    const turnDistance = (motion.speed * motion.speed - 36) / (2 * BRAKE) + 2;
    if (cost[ahead] < turnDistance) {
      // Too close to turn: continue straight through it (if the road goes on).
      const N = graph.nodes[ahead];
      let bestDot = 0.8;
      for (const { to: next, length } of N.links) {
        const M = graph.nodes[next];
        const dot = ((M.x - N.x) * fx + (M.z - N.z) * fz) / length;
        if (dot > bestDot) {
          bestDot = dot;
          lockedNext = next;
        }
      }
      if (lockedNext >= 0) locked = ahead;
    }
  }
  for (;;) {
    let current = -1;
    for (let i = 0; i < count; i++)
      if (!done[i] && cost[i] < Infinity && (current < 0 || cost[i] < cost[current])) current = i;
    if (current < 0) break;
    done[current] = 1;
    for (const { to: next, length } of graph.nodes[current].links) {
      if (current === locked && next !== lockedNext) continue;
      if (cost[current] + length < cost[next]) {
        cost[next] = cost[current] + length;
        previous[next] = current;
      }
    }
  }
  const [c, d] = to.edge;
  const goalLength = edgeLength(to.edge);
  const viaC = cost[c] + to.t * goalLength;
  const viaD = cost[d] + (1 - to.t) * goalLength;
  const last = viaC <= viaD ? c : d;
  const path = [];
  for (let n = last; n >= 0; n = previous[n]) path.unshift({ x: graph.nodes[n].x, z: graph.nodes[n].z });
  return [from, ...path, to];
}

/** Offsets a polyline to the right of its direction of travel by `offset` metres (mitred at corners). */
function offsetPath(path, offset) {
  if (!offset || path.length < 2) return path;
  return path.map((p, i) => {
    const a = path[Math.max(0, i - 1)];
    const b = path[Math.min(path.length - 1, i + 1)];
    const dx = b.x - a.x;
    const dz = b.z - a.z;
    const length = Math.hypot(dx, dz) || 1;
    // Right of a direction (dx, dz) in this world is (-dz, dx).
    return { x: p.x + (-dz / length) * offset, z: p.z + (dx / length) * offset };
  });
}

/** Point `distance` metres along the path from its closest point to (x, z), plus path data there. */
function along(path, x, z, distance) {
  let bestIndex = 0;
  let bestT = 0;
  let bestDistance = Infinity;
  for (let i = 0; i + 1 < path.length; i++) {
    const A = path[i];
    const B = path[i + 1];
    const ex = B.x - A.x;
    const ez = B.z - A.z;
    const t = clamp(((x - A.x) * ex + (z - A.z) * ez) / (ex * ex + ez * ez || 1), 0, 1);
    const d = Math.hypot(x - (A.x + ex * t), z - (A.z + ez * t));
    if (d < bestDistance) {
      bestDistance = d;
      bestIndex = i;
      bestT = t;
    }
  }
  let i = bestIndex;
  let t = bestT;
  let left = distance;
  while (i + 1 < path.length) {
    const A = path[i];
    const B = path[i + 1];
    const segment = Math.hypot(B.x - A.x, B.z - A.z);
    const remaining = segment * (1 - t);
    if (left <= remaining || i + 2 >= path.length) {
      const f = segment > 0 ? Math.min(1, t + left / segment) : 1;
      return { x: A.x + (B.x - A.x) * f, z: A.z + (B.z - A.z) * f, index: i, offPath: bestDistance };
    }
    left -= remaining;
    i++;
    t = 0;
  }
  const end = path[path.length - 1];
  return { x: end.x, z: end.z, index: path.length - 1, offPath: bestDistance };
}

/** Highest speed (m/s) at which the path ahead can be followed, braking in time for every bend. */
function cornerSpeed(path, x, z, maxSpeed, lateralGrip) {
  let limit = maxSpeed;
  const step = 5;
  let previousHeading = null;
  for (let d = 0; d <= 60; d += step) {
    const a = along(path, x, z, d);
    const b = along(path, x, z, d + step);
    if (Math.hypot(b.x - a.x, b.z - a.z) < 0.5) break;
    const heading = Math.atan2(b.x - a.x, b.z - a.z);
    if (previousHeading !== null) {
      const curvature = Math.abs(wrapAngle(heading - previousHeading)) / step;
      if (curvature > 1e-3) {
        const bendSpeed = Math.sqrt(lateralGrip / curvature);
        // Brake in time to be at bendSpeed when the bend arrives; the car starts turning a few metres
        // before the corner itself (it steers toward a point ahead of it), so be slow by then.
        limit = Math.min(limit, Math.sqrt(bendSpeed * bendSpeed + 2 * BRAKE * 0.75 * Math.max(0, d - 6)));
      }
    }
    previousHeading = heading;
  }
  return limit;
}

/**
 * Creates the police brain over the road `graph`; `blockedAt(x, z, margin)` says whether a point is
 * within `margin` metres of a building, pole or other solid.
 * Call `drive(officer, index, state, dt, info)` for each cruiser every tick, where info carries
 * { chasing, seen, maxSpeed, obstacles } (obstacles: [{x, z}] cars to avoid).
 */
export function createPoliceBrain(graph, blockedAt) {
  const lineClear = (x0, z0, x1, z1) => {
    const length = Math.hypot(x1 - x0, z1 - z0);
    const steps = Math.ceil(length / 2);
    for (let s = 1; s < steps; s++) {
      const f = s / steps;
      if (blockedAt(x0 + (x1 - x0) * f, z0 + (z1 - z0) * f)) return false;
    }
    return true;
  };
  // Whether the arc driven `distance` metres forward (direction 1) or backward (-1) with `steer` is clear.
  const arcClear = (officer, direction, steer, distance, margin) => {
    const curvature = Math.tan(steer) / WHEELBASE;
    for (let d = 1; d <= distance; d += 1) {
      const turn = curvature * d * direction;
      const chord = Math.abs(turn) > 1e-3 ? Math.abs((2 * Math.sin(turn / 2)) / curvature) : d;
      const [ax, az] = forwardOf(officer.heading + turn / 2);
      if (blockedAt(officer.x + ax * chord * direction, officer.z + az * chord * direction, margin))
        return false;
    }
    return true;
  };
  let lastSeen = null;
  let lastSeenTime = -Infinity;
  // Goals are kept on the asphalt (the city roads are 18 m wide): a lead point, flank point or search point
  // computed in the open would otherwise send a cruiser onto the sidewalk among the poles and signs.
  const onAsphalt = (goal) => {
    const p = project(graph, goal.x, goal.z);
    if (p.distance <= 6) return goal;
    const f = 6 / p.distance;
    return { ...goal, x: p.x + (goal.x - p.x) * f, z: p.z + (goal.z - p.z) * f };
  };

  /** Where a unit wants to go, given its role and what it knows. */
  function goalFor(officer, index, state, chasing, seenNow) {
    const role = ROLES[index % ROLES.length];
    if (!chasing) {
      // Patrol: pick a random intersection, drive there, pick another.
      if (
        !officer.patrolGoal ||
        Math.hypot(officer.patrolGoal.x - officer.x, officer.patrolGoal.z - officer.z) < 8
      ) {
        const cityNodes = graph.nodes.filter((n) => n.z > -90 && n.x < 130);
        const pick = cityNodes[Math.floor(Math.random() * cityNodes.length)];
        officer.patrolGoal = { x: pick.x, z: pick.z };
      }
      return { ...officer.patrolGoal, stop: false, role: "patrol" };
    }
    if (!seenNow && lastSeen && state.elapsed - lastSeenTime > 1.5) {
      // Lost sight. The first unit follows where the player was heading ("suspect last seen going north
      // on ..."); the others each take a different intersection around the last known position, moving on
      // to the next ones every few seconds, so the team spreads out instead of piling into one spot.
      const lost = state.elapsed - lastSeenTime;
      if (index % ROLES.length === 0) {
        const t = Math.min(lost, 4);
        return {
          x: lastSeen.x + lastSeen.vx * t,
          z: lastSeen.z + lastSeen.vz * t,
          stop: false,
          role: "search",
        };
      }
      const nearby = graph.nodes
        .filter((n) => n.links.length !== 2) // intersections (and dead ends), not points along a road
        .sort(
          (m, n) =>
            (m.x - lastSeen.x) ** 2 +
            (m.z - lastSeen.z) ** 2 -
            ((n.x - lastSeen.x) ** 2 + (n.z - lastSeen.z) ** 2),
        )
        .slice(0, 6);
      const pick = nearby[(index - 1 + Math.floor(lost / 8) * 3) % nearby.length];
      return { x: pick.x, z: pick.z, stop: true, role: "search" };
    }
    const speed = Math.hypot(state.vx, state.vz);
    if (role === "interceptor") {
      const distance = Math.hypot(officer.x - state.x, officer.z - state.z);
      const lead = clamp(distance / 25, 0.8, 3.5);
      let x = state.x + state.vx * lead;
      let z = state.z + state.vz * lead;
      if (distance < 30) {
        // Close in: come alongside the player (the side the interceptor is already on) to box them in.
        const [px, pz] = forwardOf(state.heading);
        const side = (officer.x - state.x) * -pz + (officer.z - state.z) * px >= 0 ? 1 : -1;
        const flankX = state.x + px * 2 - pz * side * 3.2;
        const flankZ = state.z + pz * 2 + px * side * 3.2;
        // Next to a curb or a pole: there is no room alongside, take the tail instead.
        if (!blockedAt(flankX, flankZ)) {
          x = flankX;
          z = flankZ;
        } else {
          x = state.x - px * 6;
          z = state.z - pz * 6;
        }
      }
      return { x, z, stop: false, role };
    }
    if (role === "roadblock" && speed > 6) {
      // The intersection ahead of the player along their road.
      const p = project(graph, state.x, state.z);
      const [a, b] = p.edge;
      const A = graph.nodes[a];
      const B = graph.nodes[b];
      const towardB = (B.x - A.x) * state.vx + (B.z - A.z) * state.vz > 0;
      let ahead = towardB ? B : A;
      // Too close to set up in time: take the next one along.
      if (Math.hypot(ahead.x - state.x, ahead.z - state.z) < 25) {
        const from = towardB ? a : b;
        const at = towardB ? b : a;
        const onward = graph.nodes[at].links
          .map((l) => graph.nodes[l.to])
          .filter((n) => n !== graph.nodes[from])
          .sort(
            (m, n) =>
              -((m.x - ahead.x) * state.vx + (m.z - ahead.z) * state.vz) +
              ((n.x - ahead.x) * state.vx + (n.z - ahead.z) * state.vz),
          )[0];
        if (onward) ahead = onward;
      }
      return { x: ahead.x, z: ahead.z, stop: true, role, block: true };
    }
    if (role === "backup") {
      // Trail the player at ~14 m and close in to box them when they slow down.
      const [fx, fz] = forwardOf(state.heading);
      const gap = speed < 4 ? 5 : 14;
      return { x: state.x - fx * gap, z: state.z - fz * gap, stop: speed < 4, role };
    }
    return { x: state.x, z: state.z, stop: false, role: "pursuer", ram: true };
  }

  return {
    /** Records whether the player is currently seen (for last-known-position search). */
    observe(state, seenNow) {
      if (seenNow) {
        lastSeen = { x: state.x, z: state.z, vx: state.vx, vz: state.vz };
        lastSeenTime = state.elapsed;
      }
    },
    drive(officer, index, state, dt, { chasing, seen: seenNow, maxSpeed, obstacles }) {
      officer.unit = index;
      officer.speed = officer.speed || 0;
      officer.steer = officer.steer || 0;
      officer.replan = (officer.replan || 0) - dt;
      officer.stuck = officer.stuck || 0;
      officer.reverse = Math.max(0, (officer.reverse || 0) - dt);
      let goal = goalFor(officer, index, state, chasing, seenNow);
      if (!goal.ram) goal = onAsphalt(goal);
      officer.role = goal.role;
      officer.goal = goal;
      const toPlayer = Math.hypot(state.x - officer.x, state.z - officer.z);

      // Direct pursuit when close and the straight line to the target is clear of buildings and poles.
      // Only on or beside the road (no cutting across building lots), unless the player is right there.
      const onRoad = (x, z) => project(graph, x, z).distance < 7.5; // on the asphalt, not the sidewalk
      const direct =
        chasing &&
        goal.role !== "roadblock" &&
        toPlayer < 40 &&
        (toPlayer < 15 || (onRoad(officer.x, officer.z) && onRoad(goal.x, goal.z))) &&
        lineClear(officer.x, officer.z, goal.x, goal.z);
      if (direct) {
        officer.path = [
          { x: officer.x, z: officer.z },
          { x: goal.x, z: goal.z },
        ];
        officer.replan = 0;
      } else if (officer.replan <= 0 || !officer.path) {
        const from = project(graph, officer.x, officer.z, officer.heading);
        const to = project(graph, goal.x, goal.z);
        let path = route(graph, from, to, officer);
        // Keep right (a little closer to the centre line when chasing, for faster lines through corners).
        path = offsetPath(path, chasing ? 2.2 : 2.6);
        // Off the road (a parking lot): first drive to it. On it, start from the lane itself (a kink from the
        // car to its lane would read as a sharp bend and slow it down).
        if (from.distance > 8) path.unshift({ x: officer.x, z: officer.z });
        // Leave the road for the last stretch if the goal is off it and reachable in a straight line.
        if (to.distance > 3 && lineClear(to.x, to.z, goal.x, goal.z)) path.push({ x: goal.x, z: goal.z });
        officer.path = path;
        officer.replan = 0.4 + (index % 4) * 0.05;
      }

      // Pure pursuit on the path.
      const lookahead = 5 + Math.abs(officer.speed) * 0.45;
      const target = along(officer.path, officer.x, officer.z, lookahead);
      const [fx, fz] = forwardOf(officer.heading);
      const tx = target.x - officer.x;
      const tz = target.z - officer.z;
      const targetDistance = Math.hypot(tx, tz) || 1;
      // Signed angle from the heading to the target, positive toward increasing heading (the way positive
      // steering turns the car in this world's convention).
      const alpha = Math.atan2(fz * tx - fx * tz, fx * tx + fz * tz);
      let desiredSteer = clamp(
        Math.atan2(2 * WHEELBASE * Math.sin(alpha), Math.max(targetDistance, 3)),
        -MAX_STEER,
        MAX_STEER,
      );

      // Speed: road limit, bends ahead, end of path, traffic in the lane.
      const grip = chasing ? 7.5 : 4;
      let targetSpeed = chasing ? maxSpeed : 10;
      let limiter = "cruise";
      const limit = (value, reason) => {
        if (value < targetSpeed) {
          targetSpeed = value;
          limiter = reason;
        }
      };
      limit(cornerSpeed(officer.path, officer.x, officer.z, targetSpeed, grip), "bend");
      // Big heading error (the route goes off to the side or behind): slow enough to make the turn, but
      // keep rolling so the car actually comes round instead of crawling.
      if (Math.abs(alpha) > 0.35)
        limit(Math.max(5, targetSpeed * (1 - Math.min(0.6, Math.abs(alpha) * 0.45))), "turning");
      const end = officer.path[officer.path.length - 1];
      const toEnd = Math.hypot(end.x - officer.x, end.z - officer.z);
      if (goal.stop) limit(Math.sqrt(2 * BRAKE * 0.6 * Math.max(0, toEnd - 2)), "arriving");
      // The route may turn at its end once it is re-planned: arrive at a speed a turn can still be made from.
      else limit(Math.sqrt(64 + 2 * BRAKE * 0.6 * toEnd), "path end");
      // Close to the player: the pursuer goes in for contact; others hold a few metres off.
      if (chasing && toPlayer < 12 && !goal.ram)
        targetSpeed = Math.min(targetSpeed, Math.max(0, (toPlayer - 5) * 1.6));
      if (state.onFoot && toPlayer < 12)
        targetSpeed = Math.min(targetSpeed, Math.max(0, (toPlayer - 7) * 1.5));
      // Cars in the way: steer around them (both keep to their own right, so two cruisers meeting head-on
      // part ways) and only match speed with / stop behind what is too close to pass.
      let avoidance = 0;
      let oncoming = false; // a cruiser with right of way coming at us, close: pull over for it
      for (const car of obstacles) {
        const dx = car.x - officer.x;
        const dz = car.z - officer.z;
        const ahead = dx * fx + dz * fz;
        const side = dx * -fz + dz * fx; // > 0: the car is to our right
        if (ahead <= 0 || ahead > 22 || Math.abs(side) > 3.2) continue;
        // Right of way between cruisers: a strict order (the lower-numbered unit goes first), so a knot of
        // cruisers at an intersection always unties. A unit with right of way only slows to a crawl for the
        // others and nudges through; the ones without it wait or back out of the way.
        const hasPriority = car.unit !== undefined && car.unit > index;
        if (car.unit !== undefined && car.unit < index && ahead < 12 && Math.abs(side) < 2.6) {
          const [cx, cz] = forwardOf(car.heading);
          if (cx * fx + cz * fz < -0.3) oncoming = true;
        }
        // How fast it is moving our way (cruisers: their speed; parked cars: 0; the player: their velocity).
        let along = 0;
        if (car.speed !== undefined && car.heading !== undefined) {
          const [cx, cz] = forwardOf(car.heading);
          along = car.speed * (cx * fx + cz * fz);
        } else if (car.vx !== undefined) {
          along = car.vx * fx + car.vz * fz;
        }
        const weight = (1 - ahead / 22) * (1 - Math.abs(side) / 3.2);
        avoidance += (side >= 0 ? 1 : -1) * weight;
        // Everyone steers apart.
        // (A car less than a car length ahead is alongside, not in front: steer apart, don't brake for it,
        // or two cruisers driving side by side hold each other back.)
        if (Math.abs(side) < 2.2 && ahead > 3) {
          const safe = Math.max(0, along) + Math.sqrt(2 * BRAKE * 0.6 * Math.max(0, ahead - 5));
          limit(hasPriority ? Math.max(2, safe) : safe, "car ahead");
        }
      }
      desiredSteer = clamp(desiredSteer + clamp(avoidance, -1, 1) * 0.2, -MAX_STEER, MAX_STEER);
      if (oncoming && officer.reverse <= 0) {
        // Pull over to the right and let it by, creeping toward the curb if there is room.
        desiredSteer = -MAX_STEER * 0.8;
        targetSpeed = Math.min(targetSpeed, arcClear(officer, 1, desiredSteer, 4, 1.2) ? 1.5 : 0);
        limiter = "giving way";
      }
      // Static obstacles (poles, walls, building corners) along the arc the car is about to drive. If the
      // steering it wants runs into one (cutting a corner too tight, a pole at the kerb), it looks at a fan
      // of steering angles around it and takes the closest one with a clear arc, like a driver correcting
      // the line; if no line is clear within stopping distance, it brakes.
      const stopping = (officer.speed * officer.speed) / (2 * BRAKE) + 3;
      const horizon = Math.min(Math.max(stopping, 8), 25);
      const clearDistance = (steer) => {
        const curvature = Math.tan(steer) / WHEELBASE;
        for (let d = 2.5; d <= horizon; d += 1.5) {
          const turn = curvature * d;
          const chord = Math.abs(turn) > 1e-3 ? (2 * Math.sin(turn / 2)) / curvature : d;
          const [ax, az] = forwardOf(officer.heading + turn / 2);
          if (blockedAt(officer.x + ax * chord, officer.z + az * chord, 1.15)) return d;
        }
        return Infinity;
      };
      let clear = clearDistance(desiredSteer);
      if (clear < Infinity && officer.speed > 0.5) {
        let bestScore = clear;
        for (const delta of [0.12, -0.12, 0.25, -0.25, 0.4, -0.4, 0.6, -0.6, 0.9, -0.9]) {
          const steer = clamp(desiredSteer + delta, -MAX_STEER, MAX_STEER);
          const distance = clearDistance(steer);
          const score = Math.min(distance, horizon + 5) - Math.abs(delta) * 4;
          if (score > bestScore) {
            bestScore = score;
            clear = distance;
            desiredSteer = steer;
          }
        }
      }
      if (clear < Infinity) limit(Math.sqrt(2 * BRAKE * 0.7 * Math.max(0, clear - 2.5)), "obstacle ahead");

      // Three-point turn: the route goes back the way the car is facing and it is slow enough. Reversing
      // with opposite lock swings the nose round toward the target.
      if (officer.reverse <= 0 && Math.abs(alpha) > 2.1 && Math.abs(officer.speed) < 6) officer.kTurn = true;
      if (officer.kTurn && Math.abs(alpha) < 1.1) officer.kTurn = false;
      // Stuck recovery: wanted to move, didn't; back out with opposite lock.
      if (officer.kTurn && officer.reverse <= 0) {
        targetSpeed = -4;
        desiredSteer = -Math.sign(alpha || 1) * MAX_STEER;
        limiter = "three-point turn";
      } else if (officer.reverse > 0) {
        targetSpeed = -4;
        desiredSteer = -officer.reverseSteer;
      } else if (
        Math.abs(officer.speed) < 0.6 &&
        toEnd > 6 &&
        !["holding off", "arriving", "player on foot"].includes(limiter)
      ) {
        officer.stuck += dt;
        if (officer.stuck > 1.1) {
          officer.reverse = 1.3;
          officer.reverseSteer = desiredSteer || MAX_STEER;
          officer.stuck = 0;
          officer.replan = 0;
        }
      } else {
        officer.stuck = 0;
      }

      // Wedged against something (nose in, can't go forward): escape by reversing with opposite lock, even
      // if the planning margin behind is tight; only real contact behind stops it.
      if (Math.abs(officer.speed) < 0.4 && limiter === "obstacle ahead")
        officer.wedged = (officer.wedged || 0) + dt;
      else officer.wedged = 0;
      if (officer.wedged > 1.5 && officer.reverse <= 0) {
        officer.reverse = 1.6;
        // Back out on whichever lock has room behind (between two poles, straight back may be blocked).
        const preferred = desiredSteer >= 0 ? 1 : -1;
        const lock = [preferred, -preferred, 0].find((sign) =>
          arcClear(officer, -1, -sign * MAX_STEER, 3, 0.35),
        );
        officer.reverseSteer = (lock ?? preferred) * MAX_STEER; // driven with opposite lock below
        officer.escaping = true;
        officer.wedged = 0;
        targetSpeed = -4;
        desiredSteer = -officer.reverseSteer;
      }
      if (officer.reverse <= 0) officer.escaping = false;
      // Never back into anything: if there is no room along the reversing arc, stop reversing.
      if (targetSpeed < 0) {
        if (!arcClear(officer, -1, desiredSteer, 3, officer.escaping ? 0.35 : 1.0)) {
          targetSpeed = 0;
          officer.kTurn = false;
          officer.reverse = 0;
        }
      }
      // Vehicle: steering rate, acceleration and braking limits, bicycle-model yaw.
      officer.steer += clamp(desiredSteer - officer.steer, -STEER_RATE * dt, STEER_RATE * dt);
      const accel = chasing ? 7 : 3.5;
      const delta = targetSpeed - officer.speed;
      const braking = Math.sign(delta) !== Math.sign(officer.speed) && officer.speed !== 0;
      officer.speed += clamp(delta, -(braking ? BRAKE : accel) * dt, (braking ? BRAKE : accel) * dt);
      officer.heading = wrapAngle(
        officer.heading + (officer.speed / WHEELBASE) * Math.tan(officer.steer) * dt,
      );
      const [nx, nz] = forwardOf(officer.heading);
      officer.x += nx * officer.speed * dt;
      officer.z += nz * officer.speed * dt;
      officer.blocking = goal.role === "roadblock" && toEnd < 6;
      officer.limiter = officer.reverse > 0 ? "reversing" : limiter;
    },
  };
}
