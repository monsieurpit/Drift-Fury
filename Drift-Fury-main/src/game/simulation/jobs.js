// Jobs (both modes), started with J: a taxi fare (pick the client up, drive them across town in time), a
// delivery (fetch a fragile package, deliver it in time: the more damage on the way, the less pay) and a
// street race (through checkpoints against the clock). Pure simulation on the game state; the session
// draws the markers and the HUD shows the job.

const JOB_KINDS = ["taxi", "delivery", "race"];

/** `roadXs`, `roadZs`: the street grid. Returns { job, toggle(state), update(state, dt) }. */
export function createJobs({ roadXs, roadZs, random = Math.random }) {
  let job = null;
  let nextKind = 0;

  /** A spot at the kerb of a lane, mid-block, between `min` and `max` metres from `from`. */
  function kerbSpot(from, min, max) {
    for (let attempt = 0; attempt < 80; attempt++) {
      const side = random() < 0.5 ? 1 : -1;
      if (random() < 0.5) {
        const x = roadXs[Math.floor(random() * roadXs.length)];
        const k = Math.floor(random() * (roadZs.length - 1));
        const z = roadZs[k] + 20 + random() * (roadZs[k + 1] - roadZs[k] - 40);
        const spot = { x: x + side * 5, z };
        const d = Math.hypot(spot.x - from.x, spot.z - from.z);
        if (d >= min && d <= max) return spot;
      } else {
        const z = roadZs[Math.floor(random() * roadZs.length)];
        const k = Math.floor(random() * (roadXs.length - 1));
        const x = roadXs[k] + 20 + random() * (roadXs[k + 1] - roadXs[k] - 40);
        const spot = { x, z: z + side * 5 };
        const d = Math.hypot(spot.x - from.x, spot.z - from.z);
        if (d >= min && d <= max) return spot;
      }
    }
    return null;
  }

  function event(state, type, extra = {}) {
    state.jobEvents.push({ type, kind: job?.kind, ...extra });
  }

  function fail(state, reason) {
    event(state, "failed", { reason });
    job = null;
  }

  function start(state, kind) {
    const from = { x: state.x, z: state.z };
    if (kind === "race") {
      // Six checkpoints, each 80-160 m on from the last.
      const checkpoints = [];
      let at = from;
      let length = 0;
      for (let k = 0; k < 6; k++) {
        const spot = kerbSpot(at, 80, 160);
        if (!spot) return false;
        checkpoints.push(spot);
        length += Math.hypot(spot.x - at.x, spot.z - at.z);
        at = spot;
      }
      job = {
        kind,
        stage: "race",
        checkpoints,
        index: 0,
        marker: { ...checkpoints[0], radius: 9, stop: false },
        timeLeft: length / 13 + 12,
        reward: 120,
      };
    } else {
      const pickup = kerbSpot(from, 70, 220);
      if (!pickup) return false;
      job = {
        kind,
        stage: "pickup",
        marker: { ...pickup, radius: 5, stop: true },
        timeLeft: 120,
        reward: 0,
      };
    }
    event(state, "started");
    return true;
  }

  return {
    /** The current job (null when none). */
    get job() {
      return job;
    },
    /** J: starts the next kind of job (taxi, delivery, race in turn), or gives up the current one. */
    toggle(state) {
      if (job) {
        fail(state, "cancelled");
        return;
      }
      if (state.onFoot) {
        event(state, "needCar");
        return;
      }
      const kind = JOB_KINDS[nextKind % JOB_KINDS.length];
      nextKind++;
      if (!start(state, kind)) event(state, "noJob");
    },
    update(state, dt) {
      if (!job) return;
      if (state.busted > 0 || state.wasted > 0) {
        fail(state, state.busted > 0 ? "busted" : "wasted");
        return;
      }
      job.timeLeft -= dt;
      if (job.timeLeft <= 0) {
        fail(state, "time");
        return;
      }
      // On foot too long: the client walks off, the package is lost, the race is over.
      job.onFoot = state.onFoot ? (job.onFoot || 0) + dt : 0;
      if (job.onFoot > 12) {
        fail(state, "leftCar");
        return;
      }
      const marker = job.marker;
      const distance = Math.hypot(state.x - marker.x, state.z - marker.z);
      job.distance = distance;
      const speed = Math.hypot(state.vx, state.vz);
      const reached = distance < marker.radius && !state.onFoot && (!marker.stop || speed < 2.5);
      if (!reached) return;
      if (job.stage === "race") {
        job.index++;
        if (job.index >= job.checkpoints.length) {
          const reward = Math.round(job.reward + job.timeLeft * 4);
          state.cash += reward;
          event(state, "done", { reward });
          job = null;
          return;
        }
        Object.assign(marker, job.checkpoints[job.index]);
        event(state, "checkpoint", { index: job.index });
      } else if (job.stage === "pickup") {
        // The client gets in / the package is loaded: now across town, against the clock.
        // (Across town: as far as the city allows from here, the middle of it being only ~140 m from its edges.)
        const destination = kerbSpot(marker, 180, 380) || kerbSpot(marker, 120, 380) || kerbSpot(marker, 70, 380);
        if (!destination) {
          fail(state, "noJob");
          return;
        }
        const length = Math.hypot(destination.x - marker.x, destination.z - marker.z);
        Object.assign(marker, destination);
        job.stage = "deliver";
        job.timeLeft = length / 8.5 + 25;
        job.reward = Math.round(40 + length * 0.3);
        job.startHealth = state.health;
        event(state, "stage");
      } else if (job.stage === "deliver") {
        let reward = job.reward + Math.round(job.timeLeft * 1.5);
        // A delivery pays less for every bit of damage on the way (fragile goods).
        if (job.kind === "delivery") reward = Math.round(reward * Math.max(0.2, state.health / Math.max(1, job.startHealth)));
        state.cash += reward;
        event(state, "done", { reward });
        job = null;
      }
    },
  };
}
