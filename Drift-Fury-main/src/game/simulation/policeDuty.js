// The police job (RP mode): the player goes on duty at the police station's locker (uniform, a car from the
// fleet), patrols, takes the calls dispatch puts out (a store robbery, a stolen car, shots fired, a fight, a
// drunk driver, a suspicious person, a crash, a wanted fugitive) and makes their own stops: lights on behind
// a car (E) pulls it over; walking up to someone on foot (E) stops them. Then, like a real officer: ask for
// ID (license, registration, records), question them, breathalyse, frisk or search the car, write a ticket,
// let them go, or arrest them (cuffs, escort, the back seat, booked at the jail). Suspects comply, run (on
// foot or in their car: a pursuit), or fight back (armed ones shoot). Backup (B) sends the patrol cruisers;
// a transport unit can take a prisoner. Pay, experience and rank (the fleet, uniforms and weapons unlock
// with rank); misconduct (a false arrest, an unjustified shooting) brings complaints and suspension.
//
// Pure simulation on the game state: the session draws the suspects (taking pedestrians' bodies), the
// lights and sirens, and shows the menus; it reports what only it knows (a suspect killed, a person the
// player walked up to) through the methods here.
import { FUEL_STATIONS } from "../data/stations.js";

export const LOCKER = { x: 90, z: -19.4 };
export const JAIL = { x: 79, z: -23.6, radius: 7 };
const DUTY_CAR = { x: 96, z: -22.65, heading: -Math.PI / 2 };
/** Experience for each rank (Cadet ... Chief). */
export const RANKS = [0, 250, 700, 1500, 2800, 4500, 7000];
/** The police cars: model (carModels.js), body shape (physics, collisions), rank needed, performance. */
export const FLEET = [
  { id: "cruiser", model: "police", shape: "sedan", rank: 0, max: 50, acceleration: 18, grip: 0.95 },
  { id: "sedan", model: "police_sedan", shape: "sedan", rank: 1, max: 55, acceleration: 21, grip: 1.0 },
  { id: "suv", model: "police_suv", shape: "suv", rank: 2, max: 50, acceleration: 20, grip: 0.92, awd: true },
  { id: "muscle", model: "police_muscle", shape: "muscle", rank: 3, max: 64, acceleration: 25, grip: 0.92 },
  { id: "super", model: "police_super", shape: "super", rank: 5, max: 76, acceleration: 30, grip: 1.12, awd: true },
];
export const OUTFIT_RANK = { patrol: 0, highway: 1, sheriff: 2, swat: 3 };
export const WEAPONS = [
  { id: "pistol", rank: 0 },
  { id: "taser", rank: 0 },
  { id: "shotgun", rank: 2 },
  { id: "rifle", rank: 4 },
];
export const SIREN_TONES = ["wail", "yelp", "hilo", "phaser"];
/** Tickets: the fine, and whether the offence really happened (`s`: the suspect). */
const CITATIONS = {
  speeding: { fine: 150, vehicle: true, valid: (s) => !!s.facts.speeding },
  reckless: { fine: 180, vehicle: true, valid: (s) => !!(s.facts.weaving || s.facts.evaded) },
  noLicense: { fine: 200, vehicle: true, valid: (s) => s.person.license === "none" },
  expiredLicense: { fine: 100, vehicle: true, valid: (s) => s.person.license === "expired" },
  expiredRegistration: { fine: 90, vehicle: true, valid: (s) => s.car?.registration === "expired" },
  noInsurance: { fine: 160, vehicle: true, valid: (s) => s.car?.insurance === "none" },
  jaywalking: { fine: 50, vehicle: false, valid: (s) => !!s.facts.jaywalking },
  publicIntox: { fine: 80, vehicle: false, valid: (s) => s.person.bac >= 0.08 },
  disorderly: { fine: 100, vehicle: false, valid: (s) => s.person.attitude === "hostile" || !!s.facts.fought },
};
const CALLOUTS = {
  robbery: { weight: 3, reward: 260, xp: 90 },
  stolen: { weight: 3, reward: 220, xp: 80 },
  shots: { weight: 2, reward: 300, xp: 110 },
  fight: { weight: 2, reward: 160, xp: 60 },
  drunk: { weight: 2, reward: 180, xp: 70 },
  suspicious: { weight: 2, reward: 120, xp: 45 },
  accident: { weight: 2, reward: 150, xp: 55 },
  fugitive: { weight: 2, reward: 240, xp: 85 },
};
const AVENUES = ["Alder Ave", "Bayview Ave", "Central Ave", "Dockside Ave", "Elm Ave"];
const STREETS = ["Harbor St", "Grand St", "Main St", "Ocean Blvd"];
const FIRST_MALE = ["James", "Michael", "Robert", "David", "Daniel", "Carlos", "Luis", "Marco", "Kevin", "Tyler", "Andre", "Jason", "Omar", "Victor", "Ethan", "Ryan", "Lucas", "Nathan", "Hugo", "Mateo"];
const FIRST_FEMALE = ["Maria", "Sarah", "Jessica", "Emily", "Laura", "Sofia", "Ana", "Chloe", "Nina", "Olivia", "Emma", "Julia", "Camila", "Rachel", "Grace", "Lea", "Elena", "Mia", "Zoe", "Isabel"];
const LAST = ["Smith", "Johnson", "Garcia", "Martinez", "Brown", "Lopez", "Wilson", "Moreau", "Rossi", "Schmidt", "Silva", "Nguyen", "Kim", "Clark", "Lewis", "Walker", "Young", "Hill", "Rivera", "Torres", "Dubois", "Bianchi", "Weber", "Costa", "Murphy", "Reyes", "Fischer", "Moretti", "Santos", "Bennett"];
const CAR_NAMES = { sedan: "Kiri '10", suv: "Urban '10", hatch: "Toyama XR", coupe: "Carter '98" };
const WARRANTS = ["theft", "assault", "fraud", "dui", "robbery", "drugs", "failToAppear", "burglary"];
const LETTERS = "ABCDEFGHJKLMNPRSTUVWXYZ";
const ON_FOOT = new Set(["standing", "handsUp", "ground", "cuffed", "escorted", "fleeFoot", "fight", "stunned", "robbing", "rampage", "brawl", "victim", "loiter", "wander"]);
const SURRENDERED = new Set(["handsUp", "ground", "stunned"]);
const RUN_SPEED = 4.5;
const TALK = 3.2; // metres: close enough to talk to someone
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * `state`: the game state; `traffic` (traffic.js); `roadXs`, `roadZs`: the grid; `blockedAt(x, z, margin)`:
 * buildings and solids; `lineOfSight(x0, z0, x1, z1)`; `pay(amount, reason)`; `police`: the patrol units
 * (state.police) for backup and transport.
 */
export function createPoliceDuty({ state, traffic, roadXs, roadZs, blockedAt, lineOfSight, pay, random = Math.random }) {
  const pick = (list) => list[Math.floor(random() * list.length)];
  let nextId = 1;
  const duty = {
    on: false,
    outfit: "patrol",
    fleet: "cruiser",
    xp: 0,
    lights: false,
    siren: false,
    tone: 0,
    weapon: "pistol",
    shift: { pay: 0, arrests: 0, citations: 0, calls: 0, time: 0 },
    strikes: 0,
    suspendedFor: 0,
    offer: null,
    callout: null,
    nextCallout: 25,
    suspects: [],
    focus: null,
    menu: [],
    submenu: null,
    card: null,
    say: null,
    feed: [],
    alert: null,
    target: null,
    mdt: false,
    backup: null,
    events: [], // news for the session (it takes them each frame): { type, ... }
    pursuit: null,
  };
  const prev = {};
  const records = new WeakMap(); // traffic car -> its plate and owner (made up the first time it is checked)

  /* ----- people and their records ----- */
  function makePerson(options = {}) {
    const female = options.female ?? random() < 0.45;
    const age = 19 + Math.floor(random() * 50);
    const roll = random();
    const license = options.license ?? (roll < 0.78 ? "valid" : roll < 0.89 ? "expired" : roll < 0.95 ? "suspended" : "none");
    const bacRoll = random();
    const bac = options.bac ?? (bacRoll < 0.85 ? 0 : bacRoll < 0.94 ? 0.02 + random() * 0.05 : 0.08 + random() * 0.1);
    const warrant = options.warrant !== undefined ? options.warrant : random() < 0.08 ? pick(WARRANTS) : null;
    const items = options.items ?? [];
    if (!options.items) {
      if (random() < 0.1) items.push("drugs");
      if (random() < 0.05) items.push("weapon");
      if (bac > 0.03 && random() < 0.5) items.push("openContainer");
      if (random() < 0.04) items.push("stolenGoods");
    }
    // What they have to hide makes them nervous, and more likely to run or fight.
    const hiding = (warrant ? 1 : 0) + (items.includes("drugs") ? 0.5 : 0) + (items.includes("weapon") ? 0.8 : 0) + (bac >= 0.08 ? 0.5 : 0);
    const attitudeRoll = random();
    const attitude = options.attitude ?? (attitudeRoll < 0.55 - hiding * 0.15 ? "polite" : attitudeRoll < 0.8 ? "nervous" : attitudeRoll < 0.95 ? "rude" : "hostile");
    const year = 2026 - age;
    return {
      female,
      first: pick(female ? FIRST_FEMALE : FIRST_MALE),
      last: pick(LAST),
      age,
      dob: `${year}-${String(1 + Math.floor(random() * 12)).padStart(2, "0")}-${String(1 + Math.floor(random() * 28)).padStart(2, "0")}`,
      license,
      warrant,
      priors: Math.floor(random() * random() * 6) + (warrant ? 1 : 0),
      bac,
      items,
      attitude,
      armed: options.armed ?? items.includes("weapon"),
      flee: options.flee ?? clamp(0.04 + hiding * 0.22 + (attitude === "hostile" ? 0.15 : 0), 0, 0.85),
      fight: options.fight ?? (items.includes("weapon") ? 0.35 : attitude === "hostile" ? 0.2 : 0.02),
    };
  }
  function makePlate() {
    let plate = String(1 + Math.floor(random() * 9));
    for (let k = 0; k < 3; k++) plate += LETTERS[Math.floor(random() * LETTERS.length)];
    for (let k = 0; k < 3; k++) plate += Math.floor(random() * 10);
    return plate;
  }
  /** A traffic car's plate and papers (and the driver, made with them). */
  function recordFor(car) {
    let record = records.get(car);
    if (!record) {
      const driver = makePerson(car.drunk ? { bac: 0.1 + random() * 0.1 } : {});
      const stolen = car.stolen ?? random() < 0.03;
      const ownerIsDriver = !stolen && random() < 0.8;
      const owner = ownerIsDriver ? `${driver.first} ${driver.last}` : `${pick(random() < 0.5 ? FIRST_MALE : FIRST_FEMALE)} ${pick(LAST)}`;
      record = {
        driver,
        car: {
          plate: makePlate(),
          model: CAR_NAMES[car.shape] || car.shape,
          colour: car.color,
          owner,
          ownerWanted: !ownerIsDriver && random() < 0.1,
          stolen,
          registration: random() < 0.1 ? "expired" : "valid",
          insurance: random() < 0.07 ? "none" : "valid",
        },
      };
      if (stolen) {
        record.driver.flee = Math.max(record.driver.flee, 0.7);
        record.driver.attitude = record.driver.attitude === "polite" ? "nervous" : record.driver.attitude;
      }
      records.set(car, record);
    }
    return record;
  }

  /* ----- places and messages ----- */
  function placeName(x, z) {
    let ix = 0;
    let iz = 0;
    roadXs.forEach((rx, i) => {
      if (Math.abs(rx - x) < Math.abs(roadXs[ix] - x)) ix = i;
    });
    roadZs.forEach((rz, i) => {
      if (Math.abs(rz - z) < Math.abs(roadZs[iz] - z)) iz = i;
    });
    const dx = Math.abs(roadXs[ix] - x);
    const dz = Math.abs(roadZs[iz] - z);
    if (dx < 16 && dz < 16) return `${AVENUES[ix] || "Route 9"} & ${STREETS[iz]}`;
    return dx < dz ? `${AVENUES[ix] || "Route 9"} / ${STREETS[iz]}` : `${STREETS[iz]} / ${AVENUES[ix] || "Route 9"}`;
  }
  function radio(key, vars = {}) {
    duty.feed.unshift({ key, vars, t: state.elapsed });
    if (duty.feed.length > 5) duty.feed.length = 5;
    duty.events.push({ type: "radio", key, vars });
  }
  function speak(suspect, key) {
    const variants = { polite: 0, nervous: 1, rude: 2, hostile: 2 };
    duty.say = { key, who: `${suspect.person.first} ${suspect.person.last}`, female: suspect.person.female, variant: variants[suspect.person.attitude] ?? 0, until: state.elapsed + 4.5 };
    duty.events.push({ type: "say", key, female: suspect.person.female, suspect });
  }
  function playerSays(key) {
    duty.events.push({ type: "playerSay", key });
    duty.asked = { key, until: state.elapsed + 3 };
  }
  function gainXp(amount) {
    const before = rankOf(duty.xp);
    duty.xp += amount;
    const after = rankOf(duty.xp);
    if (after > before) {
      radio("radio.rankUp", { rank: `rank.${after}` });
      duty.events.push({ type: "rankUp", rank: after });
    }
  }
  function earn(amount, reason) {
    if (amount <= 0) return;
    pay(amount, reason);
    duty.shift.pay += amount;
  }
  function strike(reason, severe = false) {
    duty.strikes += severe ? 3 : 1;
    radio("radio.strike", { reason: `strike.${reason}` });
    duty.events.push({ type: "strike", reason });
    if (duty.strikes >= 3) suspend();
  }
  function suspend() {
    radio("radio.suspended");
    endDuty(true);
    duty.suspendedFor = 120;
    duty.strikes = 0;
  }

  /* ----- suspects ----- */
  function addSuspect(fields) {
    const suspect = {
      id: nextId++,
      x: 0,
      z: 0,
      heading: 0,
      speed: 0,
      mode: "standing",
      role: "primary",
      vehicle: null,
      known: {},
      facts: {},
      charges: new Set(),
      question: 0,
      timer: 0,
      fireTimer: 0.8 + random(),
      outcome: null,
      ...fields,
    };
    suspect.person ??= makePerson();
    duty.suspects.push(suspect);
    return suspect;
  }
  /** The suspect's part is over: `outcome` booked, released, cited, dead, escaped, transported. */
  function finish(suspect, outcome) {
    suspect.outcome = outcome;
    suspect.mode = outcome === "dead" ? "dead" : "gone";
    if (duty.escort === suspect.id) duty.escort = null;
    // The car they left at the curb is towed away.
    if (suspect.parked) suspect.parked.towMe = true;
    if (suspect.vehicle && traffic.cars.includes(suspect.vehicle)) {
      const car = suspect.vehicle;
      car.flee = null;
      car.keep = false;
      if (car.pulled) traffic.releasePull(car);
    }
    duty.events.push({ type: "suspectDone", suspect, outcome });
    checkCallout();
  }
  const distanceTo = (s) => Math.hypot(s.x - state.x, s.z - state.z);
  /** Where the driver gets out of a car (its left side). */
  const driverDoor = (car) => ({ x: car.x - Math.cos(car.heading) * 1.6, z: car.z + Math.sin(car.heading) * 1.6 });

  /** Steps a suspect on foot toward (tx, tz) at `speed`, going around what is in the way. */
  function moveToward(suspect, tx, tz, speed, dt) {
    const dx = tx - suspect.x;
    const dz = tz - suspect.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 0.05) {
      suspect.speed = 0;
      return true;
    }
    let ux = dx / distance;
    let uz = dz / distance;
    for (const turn of [0, 0.5, -0.5, 1, -1, 1.5, -1.5, 2.2, -2.2]) {
      const cx = ux * Math.cos(turn) - uz * Math.sin(turn);
      const cz = ux * Math.sin(turn) + uz * Math.cos(turn);
      if (!blockedAt(suspect.x + cx * 0.8, suspect.z + cz * 0.8, 0.35)) {
        ux = cx;
        uz = cz;
        break;
      }
    }
    const step = Math.min(distance, speed * dt);
    suspect.x += ux * step;
    suspect.z += uz * step;
    suspect.speed = speed;
    suspect.heading = Math.atan2(-ux, -uz);
    return distance < 0.3;
  }
  /** A suspect running from the player: away, around obstacles, inside the city. */
  function flee(suspect, dt) {
    suspect.timer -= dt;
    if (suspect.timer <= 0 || !suspect.runX) {
      suspect.timer = 0.6;
      let ax = suspect.x - state.x;
      let az = suspect.z - state.z;
      const length = Math.hypot(ax, az) || 1;
      ax /= length;
      az /= length;
      // Back toward the middle near the edge of the city.
      const midX = (roadXs[0] + roadXs[roadXs.length - 1]) / 2;
      const midZ = (roadZs[0] + roadZs[roadZs.length - 1]) / 2;
      if (Math.abs(suspect.x - midX) > 120 || Math.abs(suspect.z - midZ) > 70) {
        ax += (midX - suspect.x) * 0.02;
        az += (midZ - suspect.z) * 0.02;
      }
      const wander = (random() - 0.5) * 0.8;
      suspect.runX = ax * Math.cos(wander) - az * Math.sin(wander);
      suspect.runZ = ax * Math.sin(wander) + az * Math.cos(wander);
    }
    moveToward(suspect, suspect.x + suspect.runX * 4, suspect.z + suspect.runZ * 4, suspect.runSpeed, dt);
    // Out of sight long enough, or far enough: gone.
    const seen = distanceTo(suspect) < 60 && lineOfSight(state.x, state.z, suspect.x, suspect.z);
    suspect.unseen = seen ? 0 : (suspect.unseen || 0) + dt;
    if (distanceTo(suspect) > 150 || suspect.unseen > 25) {
      radio("radio.escaped");
      finish(suspect, "escaped");
    }
  }
  /** Decides what someone does when it comes to it: run, fight or give up. */
  function react(suspect, { allowCar = false } = {}) {
    const person = suspect.person;
    const roll = random();
    if (roll < person.fight && (person.armed || person.attitude === "hostile")) {
      suspect.mode = "fight";
      suspect.facts.fought = true;
      speak(suspect, "talk.fight");
      if (person.armed) radio("radio.shotsFired", { place: placeName(suspect.x, suspect.z) });
      return "fight";
    }
    if (roll < person.fight + person.flee) {
      if (allowCar && suspect.vehicle) {
        startPursuit(suspect);
        return "car";
      }
      suspect.mode = "fleeFoot";
      suspect.runSpeed = RUN_SPEED * (0.92 + random() * 0.14);
      suspect.facts.fled = true;
      speak(suspect, "talk.flee");
      return "flee";
    }
    return "comply";
  }

  /* ----- traffic stops and pursuits ----- */
  function startPursuit(suspect) {
    const car = suspect.vehicle;
    if (car.pulled) traffic.releasePull(car);
    car.flee = { top: 19 + random() * 4, damage: 0, stopped: 0 };
    car.keep = true;
    suspect.mode = "fleeCar";
    suspect.facts.evaded = true;
    duty.pursuit = { suspect, update: 0 };
    radio("radio.pursuit", { place: placeName(car.x, car.z) });
    // Dispatch sends the nearest units after it.
    if (!duty.backup) requestBackup();
    duty.events.push({ type: "pursuit" });
  }
  function stopCar(car) {
    const record = recordFor(car);
    const suspect = addSuspect({
      person: record.driver,
      car: record.car,
      vehicle: car,
      mode: "inCar",
      source: "traffic",
      x: car.x,
      z: car.z,
    });
    suspect.facts.speeding = !!car.speeder || (car.measured || 0) > 15.5;
    suspect.facts.weaving = !!car.drunk;
    // Part of a call (the stolen car, the drunk driver): that call's suspect.
    if (duty.callout && duty.callout.car === car) {
      duty.callout.suspects.push(suspect);
      duty.callout.stage = "contact";
      suspect.callout = true;
    } else suspect.role = "stop";
    // They notice the lights, and pull over... or step on it.
    const fleeChance = car.stolen || record.car.stolen ? Math.max(record.driver.flee, 0.65) : record.driver.flee;
    if (random() < fleeChance * 0.85) {
      suspect.delay = 0.8 + random() * 1.2;
      suspect.willFlee = true;
    }
    traffic.pullOver(car);
    car.keep = true;
    duty.events.push({ type: "stop", suspect });
    radio("radio.trafficStop", { plate: record.car.plate, place: placeName(car.x, car.z) });
    return suspect;
  }

  /* ----- the player's actions ----- */
  function nearestSuspect(filter, radius) {
    let best = null;
    let bestDistance = radius;
    for (const suspect of duty.suspects) {
      if (suspect.outcome || !filter(suspect)) continue;
      const point = suspect.mode === "inCar" && suspect.vehicle ? driverDoor(suspect.vehicle) : suspect;
      const d = Math.hypot(point.x - state.x, point.z - state.z);
      if (d < bestDistance) {
        bestDistance = d;
        best = suspect;
      }
    }
    return best;
  }
  /** The duty car: { vehicle (parked) or the player's own car (driving it), x, z }. */
  function dutyCar() {
    if (!state.onFoot && state.playerVeh.duty) return { driving: true, x: state.x, z: state.z, heading: state.heading };
    const parked = state.vehicles.find((v) => v.duty);
    return parked ? { driving: false, x: parked.x, z: parked.z, heading: parked.heading, vehicle: parked } : null;
  }
  const seated = () => duty.suspects.filter((s) => !s.outcome && s.mode === "seated");

  /** What can be done with the suspect in focus (the menu). */
  function optionsFor(suspect) {
    if (duty.submenu === "ticket") {
      const vehicle = !!suspect.car;
      const offences = Object.keys(CITATIONS).filter((key) => CITATIONS[key].vehicle === vehicle || (!vehicle && key === "publicIntox"));
      return [...offences.map((key) => ({ id: `cite:${key}`, key: `cite.${key}`, fine: CITATIONS[key].fine })), { id: "back", key: "opt.back" }];
    }
    const options = [];
    const mode = suspect.mode;
    if (mode === "inCar") {
      options.push({ id: "id", key: "opt.idCar" }, { id: "question", key: `talk.q.${["why", "where", "drink", "illegal"][suspect.question % 4]}` });
      options.push({ id: "breath", key: "opt.breath" }, { id: "out", key: "opt.out" }, { id: "ticket", key: "opt.ticket" });
      options.push({ id: "arrest", key: "opt.arrest" }, { id: "release", key: "opt.release" });
      return options;
    }
    if (mode === "cuffed" || mode === "escorted") {
      options.push({ id: "escort", key: mode === "escorted" ? "opt.unescort" : "opt.escort" });
      const car = dutyCar();
      if (car && !car.driving && Math.hypot(car.x - state.x, car.z - state.z) < 5 && seated().length < 2) options.push({ id: "seat", key: "opt.placeInCar" });
      if (!suspect.known.id) options.push({ id: "id", key: "opt.id" });
      options.push({ id: "frisk", key: "opt.frisk" }, { id: "transport", key: "opt.transport" }, { id: "uncuff", key: "opt.uncuff" });
      return options;
    }
    if (mode === "victim") {
      options.push({ id: "id", key: "opt.id" }, { id: "statement", key: "opt.statement" }, { id: "release", key: "opt.release" });
      return options;
    }
    // On foot: standing, hands up, on the ground (or stunned).
    if (mode === "handsUp") options.push({ id: "ground", key: "opt.ground" });
    options.push({ id: "cuff", key: "opt.cuff" });
    if (mode !== "stunned") {
      options.push({ id: "id", key: "opt.id" }, { id: "question", key: `talk.q.${["why", "where", "drink", "illegal"][suspect.question % 4]}` });
      options.push({ id: "frisk", key: "opt.frisk" }, { id: "breath", key: "opt.breath" });
      if (suspect.vehicle && !suspect.known.searched) options.push({ id: "search", key: "opt.search" });
      options.push({ id: "ticket", key: "opt.ticket" }, { id: "release", key: "opt.release" });
    }
    return options;
  }

  function showCard(suspect, vehicle) {
    suspect.known.id = true;
    if (suspect.person.warrant) suspect.known.warrant = true;
    if (suspect.person.license === "suspended") suspect.known.suspended = true;
    if (vehicle && suspect.car) suspect.known.plate = true;
    duty.card = { suspectId: suspect.id, until: state.elapsed + 14 };
  }

  function choose(suspect, option) {
    const person = suspect.person;
    const id = option.id;
    if (id === "back") {
      duty.submenu = null;
      return;
    }
    if (id === "ticket") {
      duty.submenu = "ticket";
      return;
    }
    if (id.startsWith("cite:")) {
      duty.submenu = null;
      const key = id.slice(5);
      const citation = CITATIONS[key];
      playerSays("talk.p.ticket");
      if (citation.valid(suspect)) {
        speak(suspect, person.attitude === "polite" ? "talk.ticket.ok" : "talk.ticket.angry");
        duty.shift.citations++;
        earn(Math.round(citation.fine * 0.5), "ticket");
        gainXp(15);
        suspect.cited = (suspect.cited || 0) + 1;
      } else {
        speak(suspect, "talk.ticket.unfair");
        strike("badTicket");
      }
      return;
    }
    if (id === "id") {
      playerSays(suspect.mode === "inCar" ? "talk.p.idCar" : "talk.p.id");
      if (person.license === "none" && suspect.mode === "inCar") speak(suspect, "talk.id.none");
      else speak(suspect, person.attitude === "rude" || person.attitude === "hostile" ? "talk.id.rude" : "talk.id.ok");
      showCard(suspect, true);
      if (suspect.car?.stolen) suspect.known.stolen = true;
      duty.events.push({ type: "radioCheck" });
      return;
    }
    if (id === "question") {
      const topic = ["why", "where", "drink", "illegal"][suspect.question % 4];
      suspect.question++;
      playerSays(`talk.q.${topic}`);
      let answer;
      if (topic === "why") answer = person.bac >= 0.08 ? "talk.why.drunk" : `talk.why.${person.attitude === "hostile" ? "rude" : person.attitude}`;
      else if (topic === "where") answer = `talk.where.${person.attitude === "hostile" ? "rude" : person.attitude}`;
      else if (topic === "drink") answer = person.bac >= 0.08 ? "talk.drink.drunk" : person.bac > 0.01 ? "talk.drink.some" : "talk.drink.no";
      else answer = person.items.length || suspect.car?.stolen ? (person.attitude === "rude" || person.attitude === "hostile" ? "talk.illegal.rude" : "talk.illegal.nervous") : "talk.illegal.no";
      speak(suspect, answer);
      return;
    }
    if (id === "breath") {
      playerSays("talk.p.breath");
      suspect.known.bac = Math.round(person.bac * 1000) / 1000;
      speak(suspect, "talk.breath.ok");
      duty.card = { suspectId: suspect.id, until: state.elapsed + 14 };
      return;
    }
    if (id === "out") {
      playerSays("talk.p.out");
      if (suspect.willFlee) return; // (about to drive off)
      const door = driverDoor(suspect.vehicle);
      suspect.x = door.x;
      suspect.z = door.z;
      suspect.mode = "standing";
      speak(suspect, person.attitude === "polite" ? "talk.out.ok" : "talk.out.rude");
      // Out of the car, some make a run for it (or go for a weapon).
      if (react(suspect) !== "comply") return;
      return;
    }
    if (id === "search") {
      playerSays("talk.p.search");
      suspect.known.searched = true;
      suspect.known.items = [...person.items];
      if (person.items.length) speak(suspect, "talk.search.found");
      else speak(suspect, "talk.search.ok");
      duty.card = { suspectId: suspect.id, until: state.elapsed + 14 };
      return;
    }
    if (id === "frisk") {
      playerSays("talk.p.frisk");
      suspect.known.frisked = true;
      suspect.known.items = [...person.items];
      speak(suspect, person.items.length ? "talk.search.found" : "talk.search.ok");
      // A frisked suspect has no weapon on them any more.
      person.armed = false;
      duty.card = { suspectId: suspect.id, until: state.elapsed + 14 };
      return;
    }
    if (id === "statement") {
      playerSays("talk.p.statement");
      speak(suspect, "talk.victim");
      suspect.known.statement = true;
      return;
    }
    if (id === "ground") {
      playerSays("talk.p.ground");
      suspect.mode = "ground";
      return;
    }
    if (id === "arrest") {
      // Out of the car first (some run for it then), then cuffed.
      playerSays("talk.p.arrest");
      if (suspect.mode === "inCar") {
        const door = driverDoor(suspect.vehicle);
        suspect.x = door.x;
        suspect.z = door.z;
        suspect.mode = "standing";
        if (random() < person.flee * 0.6 && react(suspect) !== "comply") return;
      }
      cuff(suspect);
      return;
    }
    if (id === "cuff") {
      playerSays("talk.p.arrest");
      // Someone just standing there may still run.
      if (suspect.mode === "standing" && random() < person.flee * 0.5 && react(suspect) !== "comply") return;
      cuff(suspect);
      return;
    }
    if (id === "escort") {
      duty.escort = duty.escort === suspect.id ? null : suspect.id;
      suspect.mode = duty.escort === suspect.id ? "escorted" : "cuffed";
      return;
    }
    if (id === "seat") {
      suspect.mode = "seated";
      if (duty.escort === suspect.id) duty.escort = null;
      duty.events.push({ type: "door" });
      return;
    }
    if (id === "uncuff" || id === "release") {
      playerSays("talk.p.release");
      speak(suspect, "talk.release.thanks");
      if (suspect.mode === "inCar" && suspect.vehicle) traffic.releasePull(suspect.vehicle);
      finish(suspect, suspect.cited ? "cited" : "released");
      return;
    }
    if (id === "transport") {
      requestTransport(suspect);
      return;
    }
  }
  function cuff(suspect) {
    suspect.mode = "cuffed";
    suspect.speed = 0;
    if (suspect.vehicle) {
      const car = suspect.vehicle;
      // The car is left at the curb (it is towed away later).
      abandonCar(car);
    }
    speak(suspect, pick(["talk.cuffed.1", "talk.cuffed.2", "talk.cuffed.3"]));
    duty.events.push({ type: "cuffs" });
  }
  /** A car its driver left (or was taken out of): off the road, parked where it stopped. */
  function abandonCar(car) {
    if (!traffic.cars.includes(car)) return;
    traffic.remove(car);
    const parked = { id: state.nextVid++, x: car.x, z: car.z, heading: car.heading, kind: "civilian", color: car.color, shape: car.shape, abandoned: true };
    state.vehicles.push(parked);
    for (const suspect of duty.suspects) if (suspect.vehicle === car) suspect.parked = parked;
  }

  /** The charges against a suspect, from what the player found out. */
  function chargesOf(suspect) {
    const charges = new Set(suspect.charges);
    const person = suspect.person;
    const known = suspect.known;
    if (known.warrant && person.warrant) charges.add("warrant");
    if (known.bac >= 0.08 && suspect.vehicle) charges.add("dui");
    if (known.items?.includes("drugs")) charges.add("possession");
    if (known.items?.includes("weapon")) charges.add("weapon");
    if (known.items?.includes("stolenGoods")) charges.add("stolenGoods");
    if ((known.stolen || known.plate) && suspect.car?.stolen) charges.add("stolenVehicle");
    if (known.suspended && suspect.vehicle) charges.add("suspendedLicense");
    if (suspect.facts.fled) charges.add("resisting");
    if (suspect.facts.evaded) charges.add("evading");
    if (suspect.facts.fought) charges.add("assault");
    return [...charges];
  }
  function book(list, transported = false) {
    for (const suspect of list) {
      const charges = chargesOf(suspect);
      if (!charges.length) {
        radio("radio.noCharges");
        strike("falseArrest");
        finish(suspect, "released");
        continue;
      }
      const reward = Math.round((100 + charges.length * 60) * (transported ? 0.6 : 1));
      earn(reward, "arrest");
      gainXp(40 + charges.length * 20);
      duty.shift.arrests++;
      radio("radio.booked", { name: `${suspect.person.first} ${suspect.person.last}`, charges: charges.map((c) => `charge.${c}`) });
      finish(suspect, transported ? "transported" : "booked");
    }
    duty.events.push({ type: "chime" });
  }

  /* ----- backup and transport (the patrol units) ----- */
  function freeUnits() {
    return state.police
      .map((officer, index) => ({ officer, index }))
      .filter(({ officer }) => !officer.onFoot && !officer.dead && !officer.assist);
  }
  function requestBackup() {
    if (duty.backup) {
      for (const officer of state.police) if (officer.assist?.backup) officer.assist = null;
      duty.backup = null;
      radio("radio.backupCancel");
      return;
    }
    const units = freeUnits()
      .sort((a, b) => Math.hypot(a.officer.x - state.x, a.officer.z - state.z) - Math.hypot(b.officer.x - state.x, b.officer.z - state.z))
      .slice(0, 2);
    if (!units.length) {
      radio("radio.noUnits");
      return;
    }
    for (const { officer } of units) officer.assist = { backup: true };
    duty.backup = { count: units.length };
    radio("radio.backup", { n: units.length, place: placeName(state.x, state.z) });
  }
  function requestTransport(suspect) {
    const units = freeUnits().sort((a, b) => Math.hypot(a.officer.x - suspect.x, a.officer.z - suspect.z) - Math.hypot(b.officer.x - suspect.x, b.officer.z - suspect.z));
    if (!units.length) {
      radio("radio.noUnits");
      return;
    }
    units[0].officer.assist = { transport: suspect.id, time: 0 };
    suspect.awaitingTransport = true;
    if (duty.escort === suspect.id) duty.escort = null;
    suspect.mode = "cuffed";
    radio("radio.transport", { place: placeName(suspect.x, suspect.z) });
  }
  /** Where an assisting unit drives (for game.js's police loop): { x, z, vx, vz, heading, onFoot, stop }. */
  function assistTarget(officer) {
    const assist = officer.assist;
    if (!assist) return null;
    if (assist.transport) {
      const suspect = duty.suspects.find((s) => s.id === assist.transport);
      if (!suspect || suspect.outcome) {
        officer.assist = null;
        return null;
      }
      return { x: suspect.x, z: suspect.z, vx: 0, vz: 0, heading: 0, onFoot: true, elapsed: state.elapsed, stop: true };
    }
    const pursuit = duty.pursuit?.suspect;
    if (pursuit && pursuit.mode === "fleeCar" && pursuit.vehicle) {
      const car = pursuit.vehicle;
      return { x: car.x, z: car.z, vx: car.vx, vz: car.vz, heading: car.heading, onFoot: false, elapsed: state.elapsed };
    }
    const running = duty.suspects.find((s) => !s.outcome && (s.mode === "fleeFoot" || s.mode === "fight"));
    if (running) return { x: running.x, z: running.z, vx: 0, vz: 0, heading: running.heading, onFoot: true, elapsed: state.elapsed };
    return { x: state.x, z: state.z, vx: 0, vz: 0, heading: state.heading, onFoot: true, elapsed: state.elapsed, stop: true };
  }

  /* ----- calls ----- */
  /** A spot on a sidewalk `min`..`max` m from the player. */
  function sidewalkSpot(min, max) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const side = random() < 0.5 ? 1 : -1;
      let spot;
      if (random() < 0.5) {
        const i = Math.floor(random() * roadXs.length);
        const k = Math.floor(random() * (roadZs.length - 1));
        spot = { x: roadXs[i] + (i === 0 ? 1 : i === roadXs.length - 1 ? -1 : side) * 10.2, z: roadZs[k] + 16 + random() * (roadZs[k + 1] - roadZs[k] - 32) };
      } else {
        const i = Math.floor(random() * roadZs.length);
        const k = Math.floor(random() * (roadXs.length - 1));
        spot = { x: roadXs[k] + 16 + random() * (roadXs[k + 1] - roadXs[k] - 32), z: roadZs[i] + (i === 0 ? 1 : i === roadZs.length - 1 ? -1 : side) * 10.2 };
      }
      const d = Math.hypot(spot.x - state.x, spot.z - state.z);
      if (d >= min && d <= max && !blockedAt(spot.x, spot.z, 0.4)) return spot;
    }
    return null;
  }
  function trafficCarAt(min, max) {
    const candidates = traffic.cars.filter((car) => {
      if (car.mission || car.pulled || car.flee || car.keep) return false;
      const d = Math.hypot(car.x - state.x, car.z - state.z);
      return d >= min && d <= max;
    });
    return candidates.length ? pick(candidates) : null;
  }
  function makeOffer() {
    const total = Object.values(CALLOUTS).reduce((sum, c) => sum + c.weight, 0);
    let roll = random() * total;
    let type = "robbery";
    for (const [key, c] of Object.entries(CALLOUTS)) {
      roll -= c.weight;
      if (roll <= 0) {
        type = key;
        break;
      }
    }
    let x;
    let z;
    let car = null;
    if (type === "robbery") {
      const station = pick(FUEL_STATIONS);
      x = station.x;
      z = station.z + 11;
    } else if (type === "stolen" || type === "drunk") {
      car = trafficCarAt(70, 190);
      if (!car) return;
      x = car.x;
      z = car.z;
    } else {
      const spot = sidewalkSpot(70, 220);
      if (!spot) return;
      x = spot.x;
      z = spot.z;
    }
    duty.offer = { type, x, z, car, place: placeName(x, z), expires: state.elapsed + 25 };
    radio(`radio.call.${type}`, { place: duty.offer.place });
    duty.events.push({ type: "offer" });
  }
  function acceptOffer() {
    const offer = duty.offer;
    duty.offer = null;
    if (!offer) return;
    const callout = { ...offer, stage: "enroute", suspects: [], timer: 0, started: state.elapsed, spawned: false, towed: false };
    if (offer.car) {
      // The car might have left the road meanwhile.
      if (!traffic.cars.includes(offer.car)) return;
      offer.car.keep = true;
      const record = recordFor(offer.car);
      if (offer.type === "stolen") {
        offer.car.stolen = true;
        record.car.stolen = true;
        record.car.owner = `${pick(FIRST_MALE)} ${pick(LAST)}`;
        record.driver.flee = Math.max(record.driver.flee, 0.75);
      }
      if (offer.type === "drunk") {
        offer.car.drunk = true;
        record.driver.bac = Math.max(record.driver.bac, 0.1 + random() * 0.1);
        record.driver.items.push("openContainer");
      }
    }
    duty.callout = callout;
    radio("radio.responding", { place: offer.place });
  }
  function endCallout(success, reason = "") {
    const callout = duty.callout;
    if (!callout) return;
    duty.callout = null;
    if (callout.car) callout.car.keep = false;
    for (const vehicle of state.vehicles) if (vehicle.calloutId === callout.started) vehicle.towMe = true;
    if (success) {
      const config = CALLOUTS[callout.type];
      const share = success === true ? 1 : success;
      earn(Math.round(config.reward * share), "callout");
      gainXp(Math.round(config.xp * share));
      duty.shift.calls++;
      radio("radio.code4");
      duty.events.push({ type: "chime" });
    } else {
      radio(reason ? `radio.failed.${reason}` : "radio.failed");
    }
    duty.events.push({ type: "calloutDone", success: !!success });
  }
  /** Ends the call when its suspects are all dealt with (and the crash's cars towed). */
  function checkCallout() {
    const callout = duty.callout;
    if (!callout || !callout.spawned) return;
    const primaries = callout.suspects.filter((s) => s.role === "primary");
    if (!primaries.length) return;
    if (primaries.some((s) => !s.outcome)) return;
    if (callout.type === "accident" && !callout.towed) return;
    if (callout.suspects.some((s) => !s.outcome && s.role !== "victim")) return;
    if (primaries.every((s) => s.outcome === "escaped")) {
      endCallout(false, "escaped");
      return;
    }
    let share = 0;
    for (const s of primaries) {
      share +=
        s.outcome === "booked" || s.outcome === "transported" ? 1 : s.outcome === "dead" ? 0.6 : s.outcome === "escaped" ? 0 : 0.5;
    }
    // Victims and witnesses go home.
    for (const s of callout.suspects) if (!s.outcome) finish(s, "released");
    endCallout(share / primaries.length || 0.01);
  }
  function updateCallout(dt) {
    const callout = duty.callout;
    if (!callout) return;
    callout.timer += dt;
    const distance = Math.hypot(callout.x - state.x, callout.z - state.z);
    // The car of a call (stolen, drunk): its last known position, updated now and then.
    if (callout.car) {
      const car = callout.car;
      if (!traffic.cars.includes(car) && !callout.spawned) {
        endCallout(false, "lost");
        return;
      }
      callout.update = (callout.update || 0) - dt;
      if (callout.update <= 0 || Math.hypot(car.x - state.x, car.z - state.z) < 70) {
        callout.update = 10;
        callout.x = car.x;
        callout.z = car.z;
        if (Math.hypot(car.x - state.x, car.z - state.z) >= 70) radio("radio.lastSeen", { place: placeName(car.x, car.z) });
      }
      if (callout.stage === "enroute" && Math.hypot(car.x - state.x, car.z - state.z) < 45) callout.stage = "found";
      callout.spawned = callout.suspects.length > 0;
      if (callout.timer > 240 && !callout.spawned) endCallout(false, "lost");
      return;
    }
    if (!callout.spawned && distance < 140) spawnScene(callout);
    if (!callout.spawned) {
      if (callout.timer > 300) endCallout(false, "late");
      return;
    }
    if (callout.stage === "enroute" && distance < 35) callout.stage = "scene";
    // The scene's suspects react to the police arriving.
    for (const suspect of callout.suspects) {
      if (suspect.outcome) continue;
      const d = distanceTo(suspect);
      const sees = d < 40 && lineOfSight(state.x, state.z, suspect.x, suspect.z);
      if (suspect.mode === "robbing" && (d < 26 || (sees && d < 34))) {
        if (react(suspect) === "comply") {
          suspect.mode = "handsUp";
          speak(suspect, "talk.surrender");
        }
      } else if (suspect.mode === "rampage" && sees && d < 38) {
        if (random() < 0.65) {
          suspect.mode = "fight";
          suspect.facts.fought = true;
          speak(suspect, "talk.fight");
        } else {
          suspect.mode = "fleeFoot";
          suspect.runSpeed = RUN_SPEED;
          suspect.facts.fled = true;
          speak(suspect, "talk.flee");
        }
      } else if (suspect.mode === "brawl" && d < 22) {
        for (const other of callout.suspects) if (other.mode === "brawl" && other.role === "victim") other.mode = "victim";
        if (suspect.role === "primary") {
          suspect.facts.fought = true;
          suspect.charges.add("assault");
          if (random() < 0.5) {
            suspect.mode = "fleeFoot";
            suspect.runSpeed = RUN_SPEED;
            suspect.facts.fled = true;
            speak(suspect, "talk.flee");
          } else {
            suspect.mode = "handsUp";
            speak(suspect, "talk.surrender");
          }
        }
      } else if ((suspect.mode === "loiter" && d < 9) || (suspect.mode === "wander" && sees && d < 24)) {
        if (suspect.mode === "wander" || random() < suspect.person.flee) {
          suspect.mode = "fleeFoot";
          suspect.runSpeed = RUN_SPEED * (0.95 + random() * 0.1);
          suspect.facts.fled = true;
          speak(suspect, "talk.flee");
        } else suspect.mode = "standing";
      }
    }
    // A shooter firing into the air before the police get there: people run.
    for (const suspect of callout.suspects) {
      if (suspect.mode !== "rampage") continue;
      suspect.fireTimer -= dt;
      if (suspect.fireTimer <= 0) {
        suspect.fireTimer = 2.5 + random() * 4;
        const angle = random() * Math.PI * 2;
        state.shots.push({ x0: suspect.x, z0: suspect.z, x1: suspect.x + Math.cos(angle) * 12, z1: suspect.z + Math.sin(angle) * 12, hit: false, onFoot: true, by: "suspect", unit: -1, suspect: suspect.id });
      }
    }
    if (callout.timer > 600) endCallout(false, "late");
  }
  function spawnScene(callout) {
    callout.spawned = true;
    const at = { x: callout.x, z: callout.z };
    if (callout.type === "robbery") {
      const s = addSuspect({ ...at, mode: "robbing", person: makePerson({ armed: random() < 0.7, warrant: random() < 0.4 ? "robbery" : null, attitude: "hostile", flee: 0.45, fight: 0.3 }) });
      s.charges.add("robbery");
      s.person.items.push("stolenGoods");
      callout.suspects.push(s);
    } else if (callout.type === "shots") {
      const s = addSuspect({ ...at, mode: "rampage", person: makePerson({ armed: true, attitude: "hostile", fight: 0.7, flee: 0.3 }) });
      s.person.items.push("weapon");
      s.charges.add("weapon");
      callout.suspects.push(s);
    } else if (callout.type === "fight") {
      const a = addSuspect({ x: at.x - 0.6, z: at.z, mode: "brawl", person: makePerson({ attitude: "hostile", bac: random() < 0.5 ? 0.09 + random() * 0.08 : 0 }) });
      const b = addSuspect({ x: at.x + 0.6, z: at.z, mode: "brawl", role: "victim", person: makePerson({ attitude: "nervous", warrant: null, items: [] }) });
      a.heading = Math.atan2(-(b.x - a.x), -(b.z - a.z));
      b.heading = Math.atan2(-(a.x - b.x), -(a.z - b.z));
      callout.suspects.push(a, b);
    } else if (callout.type === "suspicious") {
      const items = [];
      if (random() < 0.5) items.push("drugs");
      if (random() < 0.2) items.push("weapon");
      const s = addSuspect({ ...at, mode: "loiter", person: makePerson({ items, warrant: random() < 0.3 ? pick(WARRANTS) : null, attitude: random() < 0.5 ? "nervous" : "rude" }) });
      callout.suspects.push(s);
    } else if (callout.type === "fugitive") {
      const s = addSuspect({ ...at, mode: "wander", person: makePerson({ warrant: pick(["robbery", "assault", "burglary", "fraud"]), attitude: "hostile", flee: 0.9 }) });
      callout.suspects.push(s);
      callout.search = 45; // a search area, not a pin point
    } else if (callout.type === "accident") {
      // Two cars crashed into each other at the curb; their drivers argue beside them.
      const along = Math.abs(roadXs.reduce((best, x) => (Math.abs(x - at.x) < Math.abs(best - at.x) ? x : best)) - at.x) < 12;
      const heading = along ? 0 : Math.PI / 2;
      const fx = -Math.sin(heading);
      const fz = -Math.cos(heading);
      const road = along
        ? { x: roadXs.reduce((best, x) => (Math.abs(x - at.x) < Math.abs(best - at.x) ? x : best)) + 3.2, z: at.z }
        : { x: at.x, z: roadZs.reduce((best, z) => (Math.abs(z - at.z) < Math.abs(best - at.z) ? z : best)) - 3.2 };
      const carA = { x: road.x, z: road.z, heading: heading + 0.25 };
      const carB = { x: road.x + fx * 5.2, z: road.z + fz * 5.2, heading: heading - 0.35 };
      for (const spot of [carA, carB]) {
        state.vehicles.push({ id: state.nextVid++, ...spot, kind: "civilian", color: pick(["#8a97a8", "#b0563a", "#3f6f8f", "#e6e6e2", "#151618"]), shape: pick(["sedan", "suv", "hatch", "coupe"]), crashed: true, calloutId: callout.started, health: 35 });
      }
      callout.x = road.x;
      callout.z = road.z;
      const driverA = addSuspect({ x: road.x - Math.cos(heading) * 4.4, z: road.z + Math.sin(heading) * 4.4, mode: "standing", person: makePerson({ bac: random() < 0.35 ? 0.09 + random() * 0.08 : 0, license: random() < 0.3 ? pick(["none", "suspended", "expired"]) : "valid" }) });
      const driverB = addSuspect({ x: driverA.x + fx * 2, z: driverA.z + fz * 2, mode: "standing", role: "secondary", person: makePerson({ bac: 0, warrant: null, items: [], attitude: "polite" }) });
      driverA.car = { plate: makePlate(), model: "Kiri '10", colour: "#8a97a8", owner: `${driverA.person.first} ${driverA.person.last}`, stolen: false, registration: "valid", insurance: random() < 0.2 ? "none" : "valid" };
      driverA.facts.weaving = driverA.person.bac >= 0.08;
      driverA.atFault = true;
      callout.suspects.push(driverA, driverB);
    }
    for (const s of callout.suspects) s.callout = true;
  }

  /** The crash's cars: towed away. */
  function towCrashed() {
    const callout = duty.callout;
    if (!callout || callout.type !== "accident" || callout.towed) return false;
    callout.towed = true;
    for (const vehicle of state.vehicles) if (vehicle.calloutId === callout.started) vehicle.towMe = true;
    radio("radio.tow");
    checkCallout();
    return true;
  }

  /* ----- the duty itself ----- */
  function startDuty({ outfit = "patrol", fleet = "cruiser" } = {}) {
    if (state.noPolice || duty.suspendedFor > 0) return false;
    const rank = rankOf(duty.xp);
    // (Already on duty: a change of uniform or car at the locker, the shift goes on.)
    const wasOn = duty.on;
    duty.on = true;
    duty.outfit = OUTFIT_RANK[outfit] <= rank ? outfit : "patrol";
    const car = FLEET.find((f) => f.id === fleet && f.rank <= rank) || FLEET[0];
    duty.fleet = car.id;
    if (!wasOn) {
      duty.lights = false;
      duty.siren = false;
      duty.weapon = "pistol";
      duty.shift = { pay: 0, arrests: 0, citations: 0, calls: 0, time: 0 };
      duty.nextCallout = 20 + random() * 15;
      duty.offer = null;
    }
    state.wanted = 0;
    state.escape = 0;
    // The patrol car, parked at the curb in front of the station (whatever was there is moved off).
    state.vehicles = state.vehicles.filter((v) => !v.duty && Math.hypot(v.x - DUTY_CAR.x, v.z - DUTY_CAR.z) > 6);
    state.vehicles.push({ id: state.nextVid++, x: DUTY_CAR.x, z: DUTY_CAR.z, heading: DUTY_CAR.heading, kind: "police", color: "#ffffff", shape: car.shape, model: car.model, fleet: car.id, duty: true });
    if (!wasOn) radio("radio.onDuty", { rank: `rank.${rank}` });
    duty.events.push({ type: "dutyOn" });
    return true;
  }
  function endDuty(suspended = false) {
    if (!duty.on) return;
    duty.on = false;
    duty.lights = false;
    duty.siren = false;
    duty.offer = null;
    if (duty.callout) endCallout(false, "offDuty");
    for (const suspect of duty.suspects) if (!suspect.outcome) finish(suspect, "released");
    duty.suspects = [];
    duty.escort = null;
    duty.pursuit = null;
    duty.backup = null;
    for (const officer of state.police) officer.assist = null;
    // The department takes its car back (unless the player is driving it: then when they get out).
    state.vehicles = state.vehicles.filter((v) => !v.duty);
    if (state.playerVeh.duty) state.playerVeh = { ...state.playerVeh, duty: false, returnCar: true };
    duty.events.push({ type: "dutyOff", suspended });
  }

  /** The traffic car ahead of the player's police car (the radar's target), or null. */
  function radarTarget() {
    const fx = -Math.sin(state.heading);
    const fz = -Math.cos(state.heading);
    let best = null;
    let bestDistance = 45;
    for (const car of traffic.cars) {
      if (car.mission) continue;
      const dx = car.x - state.x;
      const dz = car.z - state.z;
      const ahead = dx * fx + dz * fz;
      if (ahead < 3 || ahead > bestDistance) continue;
      if (Math.abs(dx * fz - dz * fx) > 2.2 + ahead * 0.12) continue;
      bestDistance = ahead;
      best = car;
    }
    return best;
  }

  function pressed(keys, code) {
    const down = !!keys[code];
    const was = !!prev[code];
    prev[code] = down;
    return down && !was;
  }

  /** One step (game.js, after the police and traffic): keys, and the player's speed. */
  function update(dt, keys, { speed }) {
    // (The session takes the events each frame; without one, only the latest are kept.)
    if (duty.events.length > 100) duty.events.splice(0, duty.events.length - 100);
    duty.suspendedFor = Math.max(0, duty.suspendedFor - dt);
    const presses = {};
    for (const code of ["KeyL", "KeyK", "KeyU", "KeyY", "KeyN", "KeyE", "KeyX", "KeyB", "KeyP", "KeyM", "Digit1", "Digit2", "Digit3", "Digit4", "Digit5", "Digit6", "Digit7", "Digit8", "Digit9"]) {
      presses[code] = pressed(keys, code);
    }
    if (!duty.on) return;
    duty.shift.time += dt;
    // Pay: a wage while on duty.
    duty.wage = (duty.wage || 0) + dt * 0.2;
    if (duty.wage >= 10) {
      earn(10, "wage");
      duty.wage -= 10;
    }
    if (state.wasted > 0) {
      // Down: the call is over, the suspects get away.
      if (duty.callout) endCallout(false, "officerDown");
      for (const suspect of duty.suspects) if (!suspect.outcome) finish(suspect, "escaped");
      duty.lights = duty.siren = false;
      return;
    }
    const inPoliceCar = !state.onFoot && state.playerVeh.kind === "police";
    if (!inPoliceCar && !state.onFoot) {
      duty.lights = false;
      duty.siren = false;
    }
    if (presses.KeyL && inPoliceCar) {
      duty.lights = !duty.lights;
      if (!duty.lights) duty.siren = false;
    }
    if (presses.KeyK && inPoliceCar) {
      duty.siren = !duty.siren;
      if (duty.siren) duty.lights = true;
    }
    if (presses.KeyU) duty.tone = (duty.tone + 1) % SIREN_TONES.length;
    if (presses.KeyX) {
      const rank = rankOf(duty.xp);
      const available = WEAPONS.filter((w) => w.rank <= rank);
      const index = available.findIndex((w) => w.id === duty.weapon);
      duty.weapon = available[(index + 1) % available.length].id;
    }
    if (presses.KeyB) requestBackup();
    if (presses.KeyM) duty.mdt = !duty.mdt;
    if (presses.KeyY && duty.offer && !duty.callout) acceptOffer();
    else if (presses.KeyN) {
      if (duty.offer) {
        duty.offer = null;
        radio("radio.declined");
      } else if (duty.callout) endCallout(false, "abandoned");
    }
    // Calls come in now and then.
    if (duty.offer && state.elapsed > duty.offer.expires) {
      duty.offer = null;
      radio("radio.otherUnit");
    }
    if (!duty.offer && !duty.callout) {
      duty.nextCallout -= dt;
      if (duty.nextCallout <= 0) {
        duty.nextCallout = 40 + random() * 45;
        makeOffer();
      }
    }

    // Radar and plate reader (in a police car).
    duty.target = null;
    if (inPoliceCar) {
      const car = radarTarget();
      if (car) {
        // (Its speed, measured: a speeder is caught going over the limit.)
        car.measured = Math.max(car.measured || 0, car.speed);
        const record = recordFor(car);
        duty.target = { id: car.id, speed: Math.round(car.speed * 3.6), plate: record.car.plate, car };
        if (duty.lastTarget !== car.id) {
          duty.lastTarget = car.id;
          duty.targetTime = 0;
        }
        duty.targetTime += dt;
        if (duty.targetTime > 1 && !record.checked) {
          record.checked = true;
          const flags = [];
          if (record.car.stolen) flags.push("stolen");
          if (record.car.insurance === "none") flags.push("noInsurance");
          if (record.car.registration === "expired") flags.push("expiredRegistration");
          if (record.car.ownerWanted) flags.push("ownerWanted");
          if (flags.length) {
            duty.alert = { plate: record.car.plate, flags, until: state.elapsed + 8 };
            radio("radio.anpr", { plate: record.car.plate, flag: `flag.${flags[0]}` });
            duty.events.push({ type: "alert" });
          }
        }
        if (presses.KeyP) {
          record.checked = true;
          duty.plateCard = { record: record.car, until: state.elapsed + 10 };
        }
      }
      // E with the lights on: pull the car ahead over.
      if (presses.KeyE && duty.lights && car && state.station < 0 && !car.pulled && !car.flee) stopCar(car);
    }

    // Suspects.
    updateSuspects(dt, speed);
    updateCallout(dt);
    if (duty.pursuit && (duty.pursuit.suspect.outcome || duty.pursuit.suspect.mode !== "fleeCar")) duty.pursuit = null;
    // Backup ends with the trouble (nobody running or fighting, no pursuit).
    if (duty.backup && !duty.pursuit && !duty.suspects.some((s) => !s.outcome && (s.mode === "fleeFoot" || s.mode === "fight"))) {
      duty.backup.calm = (duty.backup.calm || 0) + dt;
      if (duty.backup.calm > 25) {
        for (const officer of state.police) if (officer.assist?.backup) officer.assist = null;
        duty.backup = null;
      }
    } else if (duty.backup) duty.backup.calm = 0;

    // Interaction: the suspect in focus and their menu; E for the things done without a menu.
    duty.focus = null;
    duty.menu = [];
    if (state.onFoot) {
      const focus = nearestSuspect((s) => s.mode !== "seated" && s.mode !== "fleeFoot" && s.mode !== "fight" && s.mode !== "fleeCar" && s.mode !== "dead" && s.mode !== "robbing" && s.mode !== "rampage" && s.mode !== "brawl" && s.mode !== "loiter" && s.mode !== "wander" && !s.awaitingTransport && !(s.mode === "inCar" && s.willFlee && s.delay > 0), TALK);
      if (focus) {
        duty.focus = focus.id;
        duty.menu = optionsFor(focus);
        for (let k = 0; k < duty.menu.length && k < 9; k++) {
          if (presses[`Digit${k + 1}`]) {
            choose(focus, duty.menu[k]);
            duty.menu = focus.outcome ? [] : optionsFor(focus);
            break;
          }
        }
      } else duty.submenu = null;
      if (presses.KeyE) {
        // Tackle someone running (or fighting with bare hands) within reach.
        const runner = nearestSuspect((s) => s.mode === "fleeFoot" || (s.mode === "fight" && !s.person.armed), 1.8);
        if (runner) {
          runner.mode = "stunned";
          runner.stun = 3;
          runner.tackled = true;
          duty.events.push({ type: "tackle", suspect: runner });
        }
        // At the crash: call the tow truck for the wrecks.
        const crashed = duty.callout?.type === "accident" && !duty.callout.towed
          ? state.vehicles.find((v) => v.calloutId === duty.callout.started && Math.hypot(v.x - state.x, v.z - state.z) < 4.5)
          : null;
        if (!runner && crashed) duty.events.push({ type: "tow", ok: towCrashed() });
        // Take a prisoner back out of the car.
        const car = dutyCar();
        if (!runner && !crashed && car && !car.driving && Math.hypot(car.x - state.x, car.z - state.z) < 4 && !focus) {
          const inside = seated()[0];
          if (inside) {
            inside.mode = "cuffed";
            inside.x = car.x - Math.cos(car.heading) * 1.7;
            inside.z = car.z + Math.sin(car.heading) * 1.7;
          }
        }
      }
    }
    duty.towPrompt =
      state.onFoot && duty.callout?.type === "accident" && duty.callout.spawned && !duty.callout.towed &&
      state.vehicles.some((v) => v.calloutId === duty.callout.started && Math.hypot(v.x - state.x, v.z - state.z) < 4.5);
    // Towed away: wrecks and abandoned cars go once nobody is close (or after a minute).
    for (const vehicle of state.vehicles) if (vehicle.towMe) vehicle.towTime = (vehicle.towTime || 0) + dt;
    if (state.vehicles.some((v) => v.towMe && (v.towTime > 60 || (v.towTime > 15 && Math.hypot(v.x - state.x, v.z - state.z) > 35)))) {
      state.vehicles = state.vehicles.filter((v) => !(v.towMe && (v.towTime > 60 || (v.towTime > 15 && Math.hypot(v.x - state.x, v.z - state.z) > 35))));
    }
    // At the jail with prisoners: book them (E, or just stopping there in the car).
    const prisoners = seated();
    const jailCar = dutyCar();
    const atJail =
      !!jailCar && Math.hypot(jailCar.x - JAIL.x, jailCar.z - JAIL.z) < JAIL.radius && Math.hypot(state.x - jailCar.x, state.z - jailCar.z) < 8;
    duty.atJail = atJail && prisoners.length > 0;
    if (duty.atJail && (presses.KeyE || (!state.onFoot && speed < 1.5 && (duty.jailWait = (duty.jailWait || 0) + dt) > 1.5))) {
      duty.jailWait = 0;
      book(prisoners);
    } else if (!atJail) duty.jailWait = 0;
    // Prisoners ride along in the car.
    const car = dutyCar();
    for (const suspect of prisoners) {
      if (car) {
        suspect.x = car.x;
        suspect.z = car.z;
        suspect.heading = car.heading;
      }
    }
    if (duty.card && state.elapsed > duty.card.until) duty.card = null;
    if (duty.say && state.elapsed > duty.say.until) duty.say = null;
    if (duty.alert && state.elapsed > duty.alert.until) duty.alert = null;
    if (duty.plateCard && state.elapsed > duty.plateCard.until) duty.plateCard = null;
    if (duty.asked && state.elapsed > duty.asked.until) duty.asked = null;
    // Done with: off the list.
    duty.suspects = duty.suspects.filter((s) => !s.outcome || s.keepBody);
  }

  function updateSuspects(dt, playerSpeed) {
    for (const suspect of duty.suspects) {
      if (suspect.outcome) continue;
      const d = distanceTo(suspect);
      switch (suspect.mode) {
        case "inCar": {
          const car = suspect.vehicle;
          if (!traffic.cars.includes(car)) {
            finish(suspect, "escaped");
            break;
          }
          suspect.x = car.x;
          suspect.z = car.z;
          suspect.heading = car.heading;
          if (suspect.willFlee) {
            suspect.delay -= dt;
            if (suspect.delay <= 0) {
              suspect.willFlee = false;
              startPursuit(suspect);
            }
          }
          // Waiting long with nobody coming (the player drove off): they leave.
          if (car.pulled === "stopped" && d > 90) {
            traffic.releasePull(car);
            finish(suspect, "released");
          }
          break;
        }
        case "fleeCar": {
          const car = suspect.vehicle;
          if (!traffic.cars.includes(car)) {
            finish(suspect, "escaped");
            break;
          }
          suspect.x = car.x;
          suspect.z = car.z;
          suspect.heading = car.heading;
          const pursuit = duty.pursuit;
          if (pursuit) {
            pursuit.update -= dt;
            if (pursuit.update <= 0) {
              pursuit.update = 9;
              radio("radio.pursuitUpdate", { place: placeName(car.x, car.z) });
            }
          }
          // Stopped (crashed, boxed in, disabled): out of the car and running, fighting or giving up.
          const flight = car.flee;
          if (flight) {
            flight.stopped = car.speed < 0.6 ? flight.stopped + dt : 0;
            if (flight.disabled || (flight.stopped > 2.5 && d < 45)) {
              const door = driverDoor(car);
              abandonCar(car);
              suspect.vehicle = car;
              suspect.x = door.x;
              suspect.z = door.z;
              suspect.mode = "standing";
              duty.pursuit = null;
              const reaction = react(suspect);
              if (reaction === "comply") {
                suspect.mode = "handsUp";
                speak(suspect, "talk.surrender");
              }
              break;
            }
          }
          if (d > 230) {
            suspect.lost = (suspect.lost || 0) + dt;
            if (suspect.lost > 8) {
              radio("radio.escaped");
              car.flee = null;
              car.keep = false;
              finish(suspect, "escaped");
            }
          } else suspect.lost = 0;
          break;
        }
        case "fleeFoot":
          flee(suspect, dt);
          break;
        case "fight": {
          const sees = d < 45 && lineOfSight(suspect.x, suspect.z, state.x, state.z);
          suspect.heading = Math.atan2(-(state.x - suspect.x), -(state.z - suspect.z));
          if (suspect.person.armed) {
            if (sees && d < 28) {
              suspect.speed = 0;
              suspect.fireTimer -= dt;
              if (suspect.fireTimer <= 0) {
                suspect.fireTimer = 0.8 + random() * 0.7;
                const hit = random() < clamp(0.42 - d * 0.01 - playerSpeed * 0.02, 0.08, 0.38);
                const miss = hit ? 0 : 2.5;
                state.shots.push({
                  x0: suspect.x,
                  z0: suspect.z,
                  x1: state.x + (random() - 0.5) * miss,
                  z1: state.z + (random() - 0.5) * miss,
                  hit,
                  onFoot: state.onFoot,
                  by: "suspect",
                  unit: -1,
                  suspect: suspect.id,
                });
                if (hit) {
                  state.sinceHit = 0;
                  if (state.onFoot) state.playerHealth = Math.max(0, state.playerHealth - (8 + random() * 7));
                  else state.health = clamp(state.health - 3, 0, 100);
                }
              }
            } else if (d > 6) moveToward(suspect, state.x, state.z, 2.4, dt);
          } else if (d > 1.1) {
            moveToward(suspect, state.x, state.z, 3.6, dt);
          } else {
            // Fists.
            suspect.speed = 0;
            suspect.fireTimer -= dt;
            if (suspect.fireTimer <= 0 && state.onFoot) {
              suspect.fireTimer = 0.9 + random() * 0.5;
              state.sinceHit = 0;
              state.playerHealth = Math.max(0, state.playerHealth - (5 + random() * 4));
              duty.events.push({ type: "punch", suspect });
            }
          }
          if (d > 120) finish(suspect, "escaped");
          break;
        }
        case "stunned":
          suspect.stun -= dt;
          suspect.speed = 0;
          if (suspect.stun <= 0) {
            // Back up: most give up now; some try again.
            if (random() < (suspect.tackled ? 0.75 : 0.65)) suspect.mode = "ground";
            else {
              suspect.mode = "fleeFoot";
              suspect.runSpeed = suspect.runSpeed || RUN_SPEED;
            }
            suspect.tackled = false;
          }
          break;
        case "escorted": {
          if (!state.onFoot) {
            suspect.mode = "cuffed";
            duty.escort = null;
            break;
          }
          const yaw = state.footYaw || 0;
          const tx = state.x + Math.sin(yaw) * 1.1;
          const tz = state.z + Math.cos(yaw) * 1.1;
          const gap = Math.hypot(tx - suspect.x, tz - suspect.z);
          if (gap > 0.15) moveToward(suspect, tx, tz, Math.min(5.2, gap * 3.5), dt);
          else suspect.speed = 0;
          if (gap > 12) {
            suspect.x = tx;
            suspect.z = tz;
          }
          break;
        }
        case "standing":
        case "handsUp":
        case "victim":
          suspect.speed = 0;
          if (d < 25 && state.onFoot) suspect.heading = Math.atan2(-(state.x - suspect.x), -(state.z - suspect.z));
          // Left standing there with nobody coming back: they walk off (a cited or questioned person).
          if (d > 110 && !suspect.callout) finish(suspect, suspect.cited ? "cited" : "released");
          break;
        case "wander": {
          suspect.timer -= dt;
          if (suspect.timer <= 0 || !suspect.goal) {
            suspect.timer = 6 + random() * 6;
            suspect.goal = sidewalkSpot(0, 400) || { x: suspect.x, z: suspect.z };
            // (Stays around the area of the call.)
            if (Math.hypot(suspect.goal.x - duty.callout?.x, suspect.goal.z - duty.callout?.z) > 40) suspect.goal = { x: suspect.x + (random() - 0.5) * 10, z: suspect.z + (random() - 0.5) * 10 };
          }
          moveToward(suspect, suspect.goal.x, suspect.goal.z, 1.3, dt);
          break;
        }
        case "brawl": {
          const other = duty.suspects.find((s) => s !== suspect && s.mode === "brawl" && !s.outcome);
          if (other) suspect.heading = Math.atan2(-(other.x - suspect.x), -(other.z - suspect.z));
          break;
        }
        case "cuffed":
        case "ground":
        case "robbing":
        case "rampage":
        case "loiter":
        case "seated":
        default:
          suspect.speed = 0;
          break;
      }
    }
  }

  const rankOf = (xp) => {
    let rank = 0;
    for (let k = 0; k < RANKS.length; k++) if (xp >= RANKS[k]) rank = k;
    return rank;
  };

  return {
    duty,
    FLEET,
    rankOf,
    startDuty,
    endDuty,
    update,
    assistTarget,
    /** The police unit's errand is done (a transport unit came for its prisoner). */
    transportArrived(officer) {
      const suspect = duty.suspects.find((s) => s.id === officer.assist?.transport);
      officer.assist = null;
      if (suspect && !suspect.outcome) book([suspect], true);
    },
    /** A person the player walked up to (E on foot): stopped, questioned like a suspect. */
    stopPedestrian({ x, z, female, onRoad }) {
      if (!duty.on || !state.onFoot) return null;
      const suspect = addSuspect({ x, z, mode: "standing", role: "stop", source: "ped", person: makePerson({ female }) });
      suspect.facts.jaywalking = !!onRoad;
      playerSays("talk.p.stop");
      // Some just won't stop.
      if (random() < suspect.person.flee * 0.7 && react(suspect) !== "comply") return suspect;
      speak(suspect, suspect.person.attitude === "polite" ? "talk.stopped.ok" : "talk.stopped.rude");
      return suspect;
    },
    /** A suspect was killed (shot, run over): justified or not. */
    suspectKilled(suspect, byPlayer) {
      if (!suspect || suspect.outcome) return;
      const wasThreat = suspect.mode === "fight" || (suspect.mode === "rampage" && suspect.person.armed);
      finish(suspect, "dead");
      if (!byPlayer) return;
      if (!wasThreat) {
        const compliant = ["handsUp", "ground", "cuffed", "escorted", "standing", "inCar", "stunned", "victim"].includes(suspect.mode) || SURRENDERED.has(suspect.mode);
        strike("unjustified", compliant);
      } else radio("radio.suspectDown");
    },
    /** The player killed someone who was no suspect at all (shot: suspension; run over: a complaint). */
    civilianKilled(shot = true) {
      if (!duty.on) return;
      strike(shot ? "civilian" : "runOver", shot);
      if (shot) state.wanted = Math.max(state.wanted, 2);
    },
    /** The body a suspect was given is a man's or a woman's: their record follows (before anyone saw it). */
    bodyIs(suspect, female) {
      if (suspect.person.female === female) return;
      suspect.person.female = female;
      if (!suspect.known.id) suspect.person.first = pick(female ? FIRST_FEMALE : FIRST_MALE);
    },
    /** Taser hit (`suspect` or null for a bystander). */
    tased(suspect) {
      if (!suspect) {
        strike("excessiveForce");
        return;
      }
      if (suspect.mode === "inCar" || suspect.mode === "seated" || suspect.outcome) return;
      if (suspect.mode === "cuffed" || suspect.mode === "escorted") strike("excessiveForce");
      suspect.mode = "stunned";
      suspect.stun = 5;
      if (duty.escort === suspect.id) duty.escort = null;
    },
    /** A suspect's car was rammed (game.js): damage, and a disabled car stops for good. */
    rammed(car, impact) {
      if (!car.flee) return;
      car.flee.damage += impact * 7;
      if (car.flee.damage >= 100) car.flee.disabled = true;
    },
    towCrashed,
    /** For the HUD. */
    hud() {
      if (!duty.on && !duty.suspendedFor) return null;
      const rank = rankOf(duty.xp);
      const focus = duty.suspects.find((s) => s.id === duty.focus);
      const cardSuspect = duty.card ? duty.suspects.find((s) => s.id === duty.card.suspectId) : null;
      const callout = duty.callout;
      const objective = (() => {
        if (seated().length) return "obj.jail";
        if (duty.pursuit) return "obj.pursuit";
        if (duty.suspects.some((s) => !s.outcome && (s.mode === "fleeFoot"))) return "obj.chase";
        if (duty.suspects.some((s) => !s.outcome && s.mode === "fight")) return "obj.fight";
        if (duty.suspects.some((s) => !s.outcome && (s.mode === "cuffed" || s.mode === "escorted") && !s.awaitingTransport)) return "obj.transport";
        if (!callout) return null;
        if (callout.type === "accident" && callout.spawned && !callout.towed) return "obj.accident";
        if (callout.stage === "enroute") return callout.search ? "obj.search" : "obj.respond";
        return "obj.deal";
      })();
      return {
        on: duty.on,
        suspendedFor: Math.ceil(duty.suspendedFor),
        rank,
        xp: duty.xp,
        nextXp: RANKS[rank + 1] ?? null,
        rankXp: RANKS[rank],
        outfit: duty.outfit,
        fleet: duty.fleet,
        lights: duty.lights,
        siren: duty.siren,
        tone: SIREN_TONES[duty.tone],
        weapon: duty.weapon,
        shift: { ...duty.shift },
        strikes: duty.strikes,
        offer: duty.offer ? { type: duty.offer.type, place: duty.offer.place, left: Math.max(0, Math.ceil(duty.offer.expires - state.elapsed)) } : null,
        callout: callout
          ? { type: callout.type, place: callout.place, stage: callout.stage, x: callout.x, z: callout.z, search: callout.search || 0, distance: Math.hypot(callout.x - state.x, callout.z - state.z) }
          : null,
        objective,
        menu: duty.menu.map((o) => ({ key: o.key, fine: o.fine })),
        submenu: duty.submenu,
        focusName: focus ? (focus.known.id ? `${focus.person.first} ${focus.person.last}` : null) : null,
        focusMode: focus?.mode ?? null,
        card: cardSuspect ? cardOf(cardSuspect) : null,
        plateCard: duty.plateCard ? plateOf(duty.plateCard.record) : null,
        say: duty.say ? { key: duty.say.key, who: duty.say.who, variant: duty.say.variant } : null,
        asked: duty.asked ? duty.asked.key : null,
        feed: duty.feed.map((f) => ({ key: f.key, vars: f.vars, age: state.elapsed - f.t })),
        alert: duty.alert ? { plate: duty.alert.plate, flags: duty.alert.flags } : null,
        target: duty.target ? { speed: duty.target.speed, plate: duty.target.plate, limit: 50 } : null,
        atJail: duty.atJail,
        seated: seated().length,
        escorting: !!duty.escort,
        backup: !!duty.backup,
        towPrompt: !!duty.towPrompt,
        mdt: duty.mdt,
        suspects: duty.suspects
          .filter((s) => !s.outcome && s.mode !== "seated")
          .map((s) => ({ x: s.x, z: s.z, hostile: s.mode === "fleeFoot" || s.mode === "fight" || s.mode === "fleeCar" })),
        canTackle: !!nearestSuspect((s) => s.mode === "fleeFoot" || (s.mode === "fight" && !s.person.armed), 1.8),
      };
    },
    /** Saved progress (the session keeps it between games). */
    save() {
      return { xp: duty.xp };
    },
    restore(saved) {
      if (saved && Number.isFinite(saved.xp)) duty.xp = Math.max(0, saved.xp);
    },
    placeName,
  };

  function cardOf(suspect) {
    const person = suspect.person;
    const known = suspect.known;
    return {
      name: known.id ? `${person.first} ${person.last}` : null,
      dob: known.id ? person.dob : null,
      age: known.id ? person.age : null,
      license: known.id ? person.license : null,
      warrant: known.id ? person.warrant : null,
      priors: known.id ? person.priors : null,
      bac: known.bac ?? null,
      items: known.items ?? null,
      vehicle: known.plate && suspect.car ? plateOf(suspect.car) : null,
      charges: chargesOf(suspect),
    };
  }
  function plateOf(car) {
    return {
      plate: car.plate,
      model: car.model,
      colour: car.colour,
      owner: car.owner,
      stolen: car.stolen,
      registration: car.registration,
      insurance: car.insurance,
      ownerWanted: !!car.ownerWanted,
    };
  }
}
