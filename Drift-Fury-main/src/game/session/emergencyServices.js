// Emergency services: an ambulance comes for the dead, a fire truck for burning cars. Each is a vehicle
// in the traffic (traffic.js dispatch: it drives there with its siren, through red lights, and parks at
// the curb), and a crew of two who get out: the paramedics kneel by the body, then carry it to the
// ambulance; the firefighters hose the fire down until it is out. Then they get back in and drive off.
import { animatePerson, createPerson } from "../people/person.js";

const WALK = 1.7; // m/s
const CREW_COLOURS = { ambulance: "#dfe6ea", firetruck: "#6b5a3c" };

/**
 * `game`, `pedestrians`, `fire` (effects/fire.js), `scene`, `groundAt(x, z)`, `trackMotion(object)`,
 * `trafficWorld` (the world traffic.js last saw: for dispatching).
 */
export function createEmergencyServices({ scene, game, pedestrians, fire, groundAt, trackMotion, trafficWorld }) {
  const crews = { ambulance: null, firetruck: null };
  const people = {};
  for (const kind of Object.keys(crews)) {
    people[kind] = [0, 1].map(() => {
      const person = createPerson(CREW_COLOURS[kind]);
      person.visible = false;
      scene.add(person);
      trackMotion(person);
      return person;
    });
  }
  const claimed = new WeakSet(); // bodies an ambulance is already coming for
  let checkTimer = 0;
  let spraying = 0;

  /** Where the crew stands by the vehicle: on its curb side, one behind the other. */
  function besideVehicle(car, index) {
    const fx = -Math.sin(car.heading);
    const fz = -Math.cos(car.heading);
    // (Right-hand side: the curb.)
    const rx = -fz;
    const rz = fx;
    const along = index === 0 ? 0.8 : -1.4;
    return { x: car.x + rx * 1.9 + fx * along, z: car.z + rz * 1.9 + fz * along };
  }

  function walkTo(person, from, to, dt) {
    const dx = to.x - from.x;
    const dz = to.z - from.z;
    const d = Math.hypot(dx, dz);
    if (d > 0.05) {
      const step = Math.min(d, WALK * dt);
      from.x += (dx / d) * step;
      from.z += (dz / d) * step;
      from.heading = Math.atan2(-dx, -dz);
    }
    return d < 0.1;
  }

  function dispatch(kind, x, z) {
    const car = game.traffic.dispatch(kind, x, z, trafficWorld);
    if (!car) return null;
    return { kind, car, stage: "driving", timer: 0, members: [{ x: 0, z: 0, heading: 0 }, { x: 0, z: 0, heading: 0 }] };
  }

  function finish(crew) {
    for (const person of people[crew.kind]) person.visible = false;
    if (crew.body && crew.body.dead) crew.body.dead.carried = false;
    game.traffic.release(crew.car);
    crews[crew.kind] = null;
  }

  /** Burning things: { x, z, vehicle, player } (the player's car while it burns, parked cars, wrecks). */
  function burningThings(state) {
    const list = [];
    if (state.burning > 0 && !state.onFoot) list.push({ x: state.x, z: state.z, player: true });
    for (const vehicle of state.vehicles) {
      if (vehicle.burning > 0 || vehicle.fireLeft > 0) list.push({ x: vehicle.x, z: vehicle.z, vehicle });
    }
    return list;
  }

  return {
    /** The fires to draw this frame ({ x, z, size }), from the game state. */
    fireSources(state) {
      return burningThings(state).map((thing) => {
        let size = 1.2;
        if (thing.player) size = 0.4 + Math.min(1, state.burning / 6) * 0.8;
        else if (thing.vehicle.burning > 0) size = 0.4 + Math.min(1, thing.vehicle.burning / 6) * 0.8;
        else size = 0.5 + Math.min(1, thing.vehicle.fireLeft / 15) * 0.9;
        return { x: thing.x, y: groundAt(thing.x, thing.z), z: thing.z, size };
      });
    },
    /** How much the hoses are spraying this frame (0..1), for the hiss. */
    get spraying() {
      return spraying;
    },
    update(state, dt) {
      spraying = 0;
      const traffic = game.traffic;
      // Calls, every couple of seconds: a body lying in the city, a fire.
      checkTimer -= dt;
      if (checkTimer <= 0) {
        checkTimer = 2;
        if (!crews.ambulance) {
          const body = pedestrians.people.find(
            (ped) =>
              ped.mode === "dead" &&
              ped.dead?.settled &&
              !claimed.has(ped) &&
              Math.hypot(ped.x - state.x, ped.z - state.z) < 140,
          );
          if (body) {
            const crew = dispatch("ambulance", body.x, body.z);
            if (crew) {
              crew.body = body;
              claimed.add(body);
              crews.ambulance = crew;
            }
          }
        }
        if (!crews.firetruck) {
          const blaze = burningThings(state).find(
            (thing) => !thing.player && Math.hypot(thing.x - state.x, thing.z - state.z) < 150,
          );
          if (blaze) {
            const crew = dispatch("firetruck", blaze.x, blaze.z);
            if (crew) {
              crew.blaze = blaze.vehicle;
              crews.firetruck = crew;
            }
          }
        }
      }

      for (const crew of Object.values(crews)) {
        if (!crew) continue;
        const car = crew.car;
        const crewPeople = people[crew.kind];
        // Gave up on the way (stuck), or taken off the road: the call is dropped.
        if (!traffic.cars.includes(car) || car.mission === "leaving") {
          if (crew.body) claimed.delete(crew.body);
          finish(crew);
          continue;
        }
        crew.timer += dt;
        if (crew.stage === "driving") {
          if (car.mission !== "arrived") continue;
          // Out of the vehicle.
          crew.members.forEach((member, index) => Object.assign(member, besideVehicle(car, index)));
          crew.stage = "going";
          crew.timer = 0;
        }
        // The target: the body (unless taken away meanwhile), or the fire (unless out).
        let target = null;
        if (crew.kind === "ambulance") {
          const body = crew.body;
          if (body.mode === "dead") target = { x: body.x, z: body.z };
        } else {
          const blaze = crew.blaze;
          if (blaze && (blaze.burning > 0 || blaze.fireLeft > 0)) target = { x: blaze.x, z: blaze.z };
        }
        if (!target && crew.stage !== "returning" && crew.stage !== "carrying") crew.stage = "returning";

        if (crew.stage === "going") {
          // Paramedics: either side of the body. Firefighters: a few metres short of the fire, toward the
          // truck.
          let arrived = true;
          crew.members.forEach((member, index) => {
            let spot;
            if (crew.kind === "ambulance") {
              spot = { x: target.x + (index ? 0.8 : -0.8), z: target.z + 0.3 };
            } else {
              const dx = car.x - target.x;
              const dz = car.z - target.z;
              const d = Math.hypot(dx, dz) || 1;
              spot = { x: target.x + (dx / d) * 6 + (index ? 1.5 : -1.5) * (-dz / d), z: target.z + (dz / d) * 6 + (index ? 1.5 : -1.5) * (dx / d) };
            }
            if (!walkTo(crewPeople[index], member, spot, dt)) arrived = false;
          });
          if (arrived || crew.timer > 25) {
            crew.stage = "working";
            crew.timer = 0;
          }
        } else if (crew.stage === "working") {
          for (const member of crew.members) member.heading = Math.atan2(-(target.x - member.x), -(target.z - member.z));
          if (crew.kind === "ambulance") {
            if (crew.timer > 5) {
              crew.stage = "carrying";
              crew.timer = 0;
              if (crew.body.dead) crew.body.dead.carried = true;
            }
          } else {
            // Hosing it down: the fire dies down, then is out (a car not yet blown up is saved).
            spraying = 1;
            const blaze = crew.blaze;
            if (blaze.burning > 0) blaze.burning = Math.max(1e-3, blaze.burning - dt * 1.5);
            if (crew.timer > 4 && blaze.burning > 0) blaze.burning = 0;
            if (blaze.fireLeft > 0) blaze.fireLeft = Math.max(0, blaze.fireLeft - dt * 4);
            for (const member of crew.members) {
              const handX = member.x - Math.sin(member.heading) * 0.5;
              const handZ = member.z - Math.cos(member.heading) * 0.5;
              fire.spray(handX, groundAt(handX, handZ) + 1.1, handZ, target.x, groundAt(target.x, target.z) + 0.8, target.z, dt);
            }
          }
        } else if (crew.stage === "carrying") {
          // The two of them carry the body back to the ambulance's rear.
          const fx = -Math.sin(car.heading);
          const fz = -Math.cos(car.heading);
          const rear = { x: car.x - fx * (car.halfLength + 1.2), z: car.z - fz * (car.halfLength + 1.2) };
          let arrived = true;
          crew.members.forEach((member, index) => {
            const spot = { x: rear.x + (index ? 0.7 : -0.7) * -fz, z: rear.z + (index ? 0.7 : -0.7) * fx };
            if (!walkTo(crewPeople[index], member, spot, dt)) arrived = false;
          });
          const body = crew.body;
          if (body.mode === "dead" && body.dead) {
            const midX = (crew.members[0].x + crew.members[1].x) / 2;
            const midZ = (crew.members[0].z + crew.members[1].z) / 2;
            body.dead.position.set(midX, groundAt(midX, midZ) + 0.8, midZ);
            body.dead.velocity.set(0, 0, 0);
          }
          if (arrived || crew.timer > 25) {
            // Into the ambulance (gone from the street; that person is back somewhere else, later).
            if (body.mode === "dead") pedestrians.removeBody(body);
            claimed.delete(body);
            crew.stage = "returning";
            crew.timer = 0;
          }
        } else if (crew.stage === "returning") {
          let arrived = true;
          crew.members.forEach((member, index) => {
            if (!walkTo(crewPeople[index], member, besideVehicle(car, index), dt)) arrived = false;
          });
          if (arrived || crew.timer > 25) {
            finish(crew);
            continue;
          }
        }

        // The crew, posed.
        crew.members.forEach((member, index) => {
          const person = crewPeople[index];
          person.visible = true;
          person.position.set(member.x, groundAt(member.x, member.z), member.z);
          person.rotation.y = member.heading;
          animatePerson(person, dt, member.x, member.z);
          const limbs = person.userData.L;
          if (!limbs) return;
          if (crew.stage === "working" && crew.kind === "ambulance") {
            // Bent over the body, hands on it.
            limbs.body.rotation.x = -0.75;
            limbs.la.rotation.x = 0.9;
            limbs.ra.rotation.x = 0.9;
          } else if (crew.stage === "working") {
            // Both hands on the hose.
            limbs.la.rotation.x = 1.25;
            limbs.ra.rotation.x = 1.15;
            limbs.le.rotation.x = 0.3;
            limbs.re.rotation.x = 0.3;
          } else if (crew.stage === "carrying") {
            limbs.la.rotation.x = 0.55;
            limbs.ra.rotation.x = 0.55;
          }
        });
      }
    },
  };
}
