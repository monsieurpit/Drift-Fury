// The police job's suspects in the street (policeDuty.js): each one on foot takes a pedestrian's body
// (pedestrians.js claim), placed and posed here every frame (hands up, kneeling face down, cuffed, stunned
// on the ground, a gun drawn, fists up), and gives it back when their part is over: walking on, or (booked,
// taken away) back in the crowd somewhere out of sight. Someone killed while a suspect (run over, shot)
// is reported to the job and left to the crowd's dead.
import { Vector3 } from "three";
import { animatePerson } from "../people/person.js";

const HIDDEN = new Set(["inCar", "fleeCar", "seated"]);
const hand = new Vector3();
const target = new Vector3();

/**
 * `pedestrians`, `groundAt(x, z)`, `gunfire` (effects/gunfire.js), `handPosition(person, out)`, `duty` (the
 * job: policeDuty.js's object), `onKilled(suspect, byPlayer)`.
 */
export function createSuspectBodies({ pedestrians, groundAt, gunfire, handPosition, duty }) {
  const bound = new Map(); // suspect -> ped

  function release(suspect, ped) {
    bound.delete(suspect);
    ped.suspect = null;
    if (ped.mode === "dead") {
      ped.controlled = false;
      return;
    }
    // Booked or taken away: gone from here (back in the crowd out of sight). Others walk on.
    const away = suspect.outcome === "booked" || suspect.outcome === "transported" || suspect.outcome === "escaped" || HIDDEN.has(suspect.mode);
    ped.x = suspect.x;
    ped.z = suspect.z;
    ped.heading = suspect.heading;
    pedestrians.release(ped, away);
  }

  return {
    /** The body of a suspect made from someone the player stopped (stopPedestrian). */
    bind(suspect, ped) {
      pedestrians.claimPed(ped);
      ped.suspect = suspect;
      bound.set(suspect, ped);
      duty.bodyIs(suspect, ped.female);
    },
    /** Each frame, after the game's step: bodies taken and given back, placed and posed. */
    update(dt, state, time) {
      const list = duty.duty.suspects;
      for (const [suspect, ped] of bound) {
        if (suspect.outcome || !list.includes(suspect)) release(suspect, ped);
      }
      for (const suspect of list) {
        if (suspect.outcome) continue;
        let ped = bound.get(suspect);
        if (ped && ped.mode === "dead") {
          // Killed (shot, run over): it is the job's to judge; the body stays where it fell.
          duty.suspectKilled(suspect, !!ped.killedByPlayer);
          release(suspect, ped);
          continue;
        }
        if (HIDDEN.has(suspect.mode)) {
          if (ped) ped.rig.visible = false;
          continue;
        }
        if (!ped) {
          // (Someone whose ID was seen gets a body of their sex, even one in view.)
          ped = pedestrians.claim(suspect.x, suspect.z, suspect.person.female, !!suspect.known.id);
          if (!ped) continue;
          ped.suspect = suspect;
          bound.set(suspect, ped);
          duty.bodyIs(suspect, ped.female);
        }
        pose(suspect, ped, dt, state, time);
      }
    },
    /** The person in the crowd near (x, z) the player could stop (alive, not already a suspect). */
    stoppable(x, z, yaw, radius = 2.6) {
      const fx = -Math.sin(yaw);
      const fz = -Math.cos(yaw);
      let best = null;
      let bestScore = Infinity;
      for (const ped of pedestrians.people) {
        if (ped.mode === "dead" || ped.controlled) continue;
        const dx = ped.x - x;
        const dz = ped.z - z;
        const d = Math.hypot(dx, dz);
        if (d > radius) continue;
        const score = d - ((dx * fx + dz * fz) / (d || 1)) * 0.8;
        if (score < bestScore) {
          bestScore = score;
          best = ped;
        }
      }
      return best;
    },
  };

  function pose(suspect, ped, dt, state, time) {
    const rig = ped.rig;
    const L = rig.userData.L;
    rig.visible = true;
    ped.x = suspect.x;
    ped.z = suspect.z;
    ped.visualX = suspect.x;
    ped.visualZ = suspect.z;
    ped.heading = suspect.heading;
    const ground = groundAt(suspect.x, suspect.z);
    const mode = suspect.mode;
    if (mode === "ground" || mode === "stunned") {
      // Face down on the ground (hands behind the head, or twitching from the taser).
      rig.position.set(suspect.x, ground + 0.13, suspect.z);
      rig.rotation.set(-Math.PI / 2, suspect.heading, 0);
      if (!L) return;
      for (const limb of Object.values(L)) limb.rotation.set(0, 0, 0);
      if (mode === "ground") {
        L.la.rotation.set(2.7, 0, -0.9);
        L.ra.rotation.set(2.7, 0, 0.9);
        L.le.rotation.set(1.6, 0, 0);
        L.re.rotation.set(1.6, 0, 0);
      } else {
        const twitch = Math.sin(time * 0.06 + suspect.id) * 0.25;
        L.la.rotation.set(0.3 + twitch, 0, -0.5);
        L.ra.rotation.set(0.3 - twitch, 0, 0.5);
        L.lh.rotation.set(twitch * 0.5, 0, 0);
        L.rh.rotation.set(-twitch * 0.5, 0, 0);
      }
      return;
    }
    rig.position.set(suspect.x, ground, suspect.z);
    rig.rotation.set(0, suspect.heading, 0);
    animatePerson(rig, dt, suspect.x, suspect.z);
    if (!L) return;
    if (mode === "fleeFoot") L.body.rotation.x = -0.25;
    if (mode === "handsUp") {
      L.la.rotation.set(2.75, 0, -0.3);
      L.ra.rotation.set(2.75, 0, 0.3);
      L.le.rotation.set(0.45, 0, 0);
      L.re.rotation.set(0.45, 0, 0);
    } else if (mode === "cuffed" || mode === "escorted") {
      // Hands behind the back, head down.
      L.la.rotation.set(-0.5, 0, 0.12);
      L.ra.rotation.set(-0.5, 0, -0.12);
      L.le.rotation.set(0, 0, 1.35);
      L.re.rotation.set(0, 0, -1.35);
      L.head.rotation.x = -0.3;
    } else if ((mode === "fight" && suspect.person.armed) || mode === "robbing" || mode === "rampage") {
      // A gun drawn: on the player, on the clerk, or up in the air.
      L.ra.rotation.set(mode === "rampage" ? 2.4 : 1.5, 0, -0.08);
      L.re.rotation.set(0.08, 0, 0);
      if (mode !== "rampage") {
        L.la.rotation.set(1.38, 0, 0.42);
        L.le.rotation.set(0.3, 0, 0);
      }
      handPosition(rig, hand);
      if (mode === "fight") target.set(state.x, (state.y || 0) + (state.onFoot ? 1.2 : 0.9), state.z);
      else if (mode === "rampage") target.set(hand.x - Math.sin(suspect.heading) * 2, hand.y + 4, hand.z - Math.cos(suspect.heading) * 2);
      else target.set(hand.x - Math.sin(suspect.heading) * 3, hand.y, hand.z - Math.cos(suspect.heading) * 3);
      gunfire.holdPistol(hand, target);
    } else if (mode === "fight" || mode === "brawl") {
      // Fists: jabs, one hand then the other.
      const t = time * 0.011 + suspect.id;
      L.la.rotation.set(1.2 + Math.max(0, Math.sin(t)) * 0.5, 0, 0.25);
      L.ra.rotation.set(1.2 + Math.max(0, -Math.sin(t)) * 0.5, 0, -0.25);
      L.le.rotation.set(1.1 - Math.max(0, Math.sin(t)) * 0.9, 0, 0);
      L.re.rotation.set(1.1 - Math.max(0, -Math.sin(t)) * 0.9, 0, 0);
    } else if (mode === "victim") {
      // Holding their face.
      L.ra.rotation.set(2.1, 0, -0.5);
      L.re.rotation.set(1.9, 0, 0);
    }
  }
}
