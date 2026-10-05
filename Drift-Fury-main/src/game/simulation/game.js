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
const clamp = (e, t, n) => {
  return Math.max(t, Math.min(n, e));
};
const distance2D = (e, t) => {
  return Math.hypot(e.x - t.x, e.z - t.z);
};
const PLAYER_HALF_WIDTH = 1;
const PLAYER_HALF_LENGTH = 2.25;
const NPC_HALF_WIDTH = 1.05;
const NPC_HALF_LENGTH = 2.3;
export const TRAFFIC_COLORS = [
  "#8a97a8",
  "#b0563a",
  "#3f6f8f",
  "#7a6f9a",
  "#5a7a5e",
];
const WALK_SPEED = 4.6;
const OFFICER_RUN_SPEED = 4.9;
export function createGame(e, t, n, r = false) {
  const i = {
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
    engine: t,
    car: e,
    onFoot: false,
    store: -1,
    shop: -1,
    arrestTimer: 0,
    _fPrev: false,
    nextVid: 1,
    noPolice: !!r,
    playerVeh: {
      kind: "player",
      color: e.color,
      shape: e.shape,
      spec: `player|${e.color}|${e.shape}`,
    },
    vehicles: [],
    police: r
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
  for (let e of FUEL_STATIONS) {
    for (let [t, n, r] of [
      [-9, -6, 0],
      [9, -6, 0],
      [-9, 7.5, Math.PI / 2],
    ]) {
      const a = i.nextVid++;
      i.vehicles.push({
        id: a,
        x: e.x + t,
        z: e.z + n,
        heading: r,
        kind: "civilian",
        color: TRAFFIC_COLORS[a % TRAFFIC_COLORS.length],
        shape: "coupe",
      });
    }
  }
  const a = buildSolidGrid(n);
  const o = n.filter((e) => {
    return e.w >= 3;
  });
  const s = [];
  function c(e) {
    if (distance2D(e, i) > 75) {
      return false;
    }
    for (let t of o) {
      for (let n = 1; n < 9; n++) {
        const r = n / 9;
        const a = e.x + (i.x - e.x) * r;
        const o = e.z + (i.z - e.z) * r;
        if (Math.abs(a - t.x) < t.w && Math.abs(o - t.z) < t.d) {
          return false;
        }
      }
    }
    return true;
  }
  function l(e) {
    return (
      i.collisionTimer <= 0 &&
      ((i.health = clamp(i.health - e, 0, 100)),
      (i.collisionTimer = 0.5),
      (i.shake = Math.min(i.shake + e * 0.08, 1.2)),
      i.police.some((e) => {
        return distance2D(e, i) < 85;
      }) && (i.wanted = clamp(i.wanted + 0.6, 0, 5)),
      true)
    );
  }
  function u() {
    if (i.onFoot) {
      let e = null;
      let t = 3.6;
      for (let n of i.vehicles) {
        const r = distance2D(n, i);
        if (r < t) {
          ((t = r), (e = n));
        }
      }
      if (!e) {
        return;
      }
      i.vehicles = i.vehicles.filter((t) => {
        return t.id !== e.id;
      });
      if (e.kind === "police") {
        const t = i.police.find((t) => {
          return t.carId === e.id;
        });
        if (t) {
          ((t.onFoot = true), (t.carId = null));
        }
        i.wanted = clamp(i.wanted + 1, 0, 5);
      }
      i.onFoot = false;
      i.x = e.x;
      i.z = e.z;
      i.heading = e.heading;
      i.vx = 0;
      i.vz = 0;
      i.u = 0;
      i.w = 0;
      i.yaw = 0;
      i.playerVeh = {
        kind: e.kind,
        color: e.color,
        shape: e.shape,
        spec: `${e.kind}|${e.color}|${e.shape}`,
      };
    } else {
      if (Math.hypot(i.vx, i.vz) > 3) {
        return;
      }
      const e = i.nextVid++;
      i.vehicles.push({
        id: e,
        x: i.x,
        z: i.z,
        heading: i.heading,
        kind: i.playerVeh.kind,
        color: i.playerVeh.color,
        shape: i.playerVeh.shape,
      });
      i.onFoot = true;
      i.x += -Math.cos(i.heading) * 2.2;
      i.z += Math.sin(i.heading) * 2.2;
      i.vx = 0;
      i.vz = 0;
      i.u = 0;
      i.w = 0;
      i.yaw = 0;
      let t = 0;
      const n = [...i.police].sort((e, t) => {
        return distance2D(e, i) - distance2D(t, i);
      });
      for (let e of n) {
        if (t >= 2) {
          break;
        }
        if (!e.onFoot && i.wanted > 0.15 && distance2D(e, i) < 30) {
          const n = i.nextVid++;
          i.vehicles.push({
            id: n,
            x: e.x,
            z: e.z,
            heading: e.heading,
            kind: "police",
            color: "#ffffff",
            shape: "coupe",
          });
          e.carId = n;
          e.onFoot = true;
          t++;
        }
      }
    }
  }
  let d = createCarPhysics(e, t);
  let carCollisionProfile = getCollisionProfile(e.shape);
  return {
    state: i,
    setCar(e) {
      i.car = e;
      d = createCarPhysics(e, t);
      carCollisionProfile = getCollisionProfile(e.shape);
      if (i.playerVeh.kind === "player") {
        i.playerVeh = {
          kind: "player",
          color: e.color,
          shape: e.shape,
          spec: `player|${e.color}|${e.shape}`,
        };
      }
    },
    update(e, n, cameraHeading = i.heading) {
      if (i.ended) {
        return i;
      }
      i.elapsed += e;
      i.collisionTimer -= e;
      i.shake *= Math.exp(-e * 5);
      const r = n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0;
      const o = n.ArrowDown || n.KeyS ? 1 : 0;
      const f =
        (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0) -
        (n.ArrowRight || n.KeyD ? 1 : 0);
      const p = !!n.Space;
      const m = !!n.KeyF && !i._fPrev;
      i._fPrev = !!n.KeyF;
      if (m) {
        u();
      }
      if (i.onFoot) {
        i.throttle = 0;
        i.brake = 0;
        i.pedal = 0;
        const t =
          (n.ArrowRight || n.KeyD ? 1 : 0) -
          (n.ArrowLeft || n.KeyA || n.KeyQ ? 1 : 0);
        const r =
          (n.ArrowDown || n.KeyS ? 1 : 0) -
          (n.ArrowUp || n.KeyW || n.KeyZ ? 1 : 0);
        const o = Math.hypot(t, r) || 1;
        ((sh, ch, sp) => {
          const dx = (ch * t + sh * r) / o;
          const dz = (ch * r - sh * t) / o;
          i.x += dx * sp * e;
          i.z += dz * sp * e;
          i.footSpeed = t || r ? sp : 0;
          if (i.footYaw === undefined) {
            i.footYaw = i.heading;
          }
          if (t || r) {
            const ty = Math.atan2(-dx, -dz);
            const df =
              ((ty - i.footYaw + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
            i.footYaw = Math.atan2(
              Math.sin(i.footYaw + df * (1 - Math.exp(-14 * e))),
              Math.cos(i.footYaw + df * (1 - Math.exp(-14 * e))),
            );
          }
        })(Math.sin(cameraHeading), Math.cos(cameraHeading), WALK_SPEED);
        i.x = clamp(i.x, -200, 250);
        i.z = clamp(i.z, -700, 150);
        for (let e of a.near(i.x, i.z, 3, s)) {
          if (
            Math.abs(i.x - e.x) < e.w + 0.5 &&
            Math.abs(i.z - e.z) < e.d + 0.5
          ) {
            const t = i.x - e.x;
            const n = i.z - e.z;
            if (e.w + 0.5 - Math.abs(t) < e.d + 0.5 - Math.abs(n)) {
              i.x = e.x + Math.sign(t || 1) * (e.w + 0.5);
            } else {
              i.z = e.z + Math.sign(n || 1) * (e.d + 0.5);
            }
          }
        }
        i.vx = 0;
        i.vz = 0;
        i.u = 0;
        i.w = 0;
        i.yaw = 0;
        i.rpm = 900;
      } else {
        i.throttle = r;
        i.brake = o;
        const n = -Math.sin(i.heading);
        const a = -Math.cos(i.heading);
        updateGearbox(i, t, e, i.vx * n + i.vz * a, r, o, p);
        d.step(i, e, {
          throttle: r,
          brake: o,
          handbrake: p,
          steer: f,
          fuel: +(i.fuel > 0),
        });
      }
      const h = -Math.sin(i.heading);
      const g = -Math.cos(i.heading);
      const _ = Math.hypot(i.vx, i.vz);
      if (!i.onFoot) {
        i.x += i.vx * e;
        i.z += i.vz * e;
        if (carCollisionProfile.shape !== i.playerVeh.shape) {
          carCollisionProfile = getCollisionProfile(i.playerVeh.shape);
        }
        const footprint = createCarFootprint(
          i.x,
          i.z,
          i.heading,
          carCollisionProfile,
        );
        for (let obstacle of a.near(i.x, i.z, 4, s)) {
          const collision = collideFootprintWithBox(footprint, obstacle);
          if (!collision) {
            continue;
          }
          i.x -= collision.nx * (collision.depth + 0.02);
          i.z -= collision.nz * (collision.depth + 0.02);
          const impactSpeed = Math.max(
            0,
            i.vx * collision.nx + i.vz * collision.nz,
          );
          if (impactSpeed > 0.6) {
            i.vx -= collision.nx * impactSpeed * 1.3;
            i.vz -= collision.nz * impactSpeed * 1.3;
            if (l(4 + impactSpeed * 0.8)) {
              i._crash = {
                x: i.x,
                y: i.y || 0,
                z: i.z,
                intensity: Math.min(impactSpeed * 0.08, 1.5),
              };
            }
          }
          break;
        }
        if (i.x < -200 || i.x > 250 || i.z > 150 || i.z < -700) {
          ((i.x = clamp(i.x, -200, 250)),
            (i.z = clamp(i.z, -700, 150)),
            (i.vx *= -0.3),
            (i.vz *= -0.3),
            l(_ * 0.7) &&
              (i._crash = {
                x: i.x,
                y: i.y || 0,
                z: i.z,
                intensity: Math.min(_ * 0.06, 1),
              }));
        }
      }
      const v = i.slipAngle;
      i.drifting = _ > 6 && v > 0.13 && i.u > 0;
      if (i.drifting) {
        ((i.driftTime += e),
          (i.combo = clamp(
            1 + Math.floor(i.driftTime / 2) + Math.floor(v * 1.8),
            1,
            8,
          )),
          (i.score += e * _ * v * i.combo * 15),
          i.police.some((e) => {
            return distance2D(e, i) < 85;
          }) && (i.wanted = clamp(i.wanted + e * 0.27, 0, 5)));
      } else {
        ((i.driftTime = 0), (i.combo = 1));
      }
      if (!i.onFoot) {
        i.fuel = clamp(
          i.fuel -
            e *
              t.consumption *
              (0.12 + _ / 16 + i.throttle * 1.5 + (i.drifting ? 2 : 0)),
          0,
          100,
        );
      }
      i.station = FUEL_STATIONS.findIndex((e) => {
        return distance2D(e, i) < 8 && _ < 2.5;
      });
      i.store = i.onFoot
        ? FUEL_STATIONS.findIndex((station) => {
            return (
              Math.abs(i.x - station.x) < 5.25 &&
              i.z > station.z + 7.05 &&
              i.z < station.z + 15.3
            );
          })
        : -1;
      i.shop = i.onFoot
        ? FUEL_STATIONS.findIndex((station) => {
            return (
              Math.abs(i.x - station.x) < 2.35 &&
              i.z > station.z + 5.15 &&
              i.z < station.z + 7.25
            );
          })
        : -1;
      if (!i.onFoot && i.station >= 0) {
        i.fuel = clamp(i.fuel + e * 14, 0, 100);
      }
      const y = orientedBox(
        i.x,
        i.z,
        i.heading,
        PLAYER_HALF_WIDTH,
        PLAYER_HALF_LENGTH,
      );
      let b = false;
      let x = false;
      let S = false;
      const C = (e, t) => {
        for (let n of a.near(e, t, 30, s)) {
          if (Math.abs(e - n.x) < n.w + 1.2 && Math.abs(t - n.z) < n.d + 1.2) {
            return true;
          }
        }
        return false;
      };
      i.police.forEach((n, r) => {
        if (n.onFoot) {
          let t = null;
          let r = null;
          if (i.onFoot || n.carId == null) {
            t = i.x;
            r = i.z;
          } else {
            const e = i.vehicles.find((e) => {
              return e.id === n.carId;
            });
            if (e) {
              ((t = e.x), (r = e.z));
            }
          }
          if (t != null) {
            const a = t - n.x;
            const o = r - n.z;
            const s = Math.hypot(a, o);
            n.heading = Math.atan2(-a, -o);
            if (s > 0.4) {
              ((n.x += (a / (s || 1)) * Math.min(s, OFFICER_RUN_SPEED * e)),
                (n.z += (o / (s || 1)) * Math.min(s, OFFICER_RUN_SPEED * e)));
            }
            if (!i.onFoot && n.carId != null) {
              const e = i.vehicles.find((e) => {
                return e.id === n.carId;
              });
              if (e && Math.hypot(e.x - n.x, e.z - n.z) < 2.5) {
                ((i.vehicles = i.vehicles.filter((e) => {
                  return e.id !== n.carId;
                })),
                  (n.onFoot = false),
                  (n.x = e.x),
                  (n.z = e.z),
                  (n.heading = e.heading),
                  (n.carId = null));
              }
            }
            if (i.onFoot && distance2D(n, i) < 1.8) {
              ((i.arrestTimer = Math.min(i.arrestTimer + e * 2.5, 5)),
                (S = true));
            }
          }
          if (i.wanted > 0.15 && c(n)) {
            x = true;
          }
          return;
        }
        const o = i.wanted > 0.15;
        n.contactCooldown = Math.max(0, (n.contactCooldown || 0) - e);
        n.speed = n.speed || 0;
        const u = distance2D(n, i);
        let d;
        let f;
        if (o) {
          const e =
            n.mode === 3
              ? u > 30
                ? 2.5
                : 1
              : n.mode === 2 && i.wanted >= 3
                ? 3
                : n.mode === 1
                  ? 1.2
                  : 0;
          d = i.x + i.vx * e;
          f = i.z + i.vz * e;
          if (n.mode === 3 && u > 30) {
            ((d += h * 10), (f += g * 10));
          }
        } else {
          d = [-50, 50, -30, 30][r];
          f = Math.sin(i.elapsed * 0.1 + r) * 40;
        }
        let p = o ? Math.min(t.max * 0.8, 12.5 + i.wanted * 3.7) : 5;
        if (i.onFoot && u < 12) {
          p = Math.min(p, Math.max(0, (u - 7) * 1.5));
        } else if (u < 6) {
          p = Math.min(p, Math.max(0, (u - 1.5) * 1.8));
        }
        let m = Math.atan2(-(d - n.x), -(f - n.z));
        const _ = 5 + n.speed * 0.45;
        const v = (e, t) => {
          for (let r = 2; r <= t; r += 2) {
            if (C(n.x - Math.sin(e) * r, n.z - Math.cos(e) * r)) {
              return r;
            }
          }
          return t;
        };
        const w = v(n.heading, _);
        const T = w < _;
        if (T) {
          const e = [-0.5, 0.5, -0.9, 0.9, -1.4, 1.4];
          let t = n.heading;
          let r = 0;
          for (let i of e) {
            const e = v(n.heading + i, _);
            if (e > r) {
              ((r = e), (t = n.heading + i));
            }
          }
          m = t;
          p = Math.min(p, Math.max(1, w * 0.7));
        }
        for (let e of i.police) {
          if (e === n || e.onFoot) {
            continue;
          }
          const t = e.x - n.x;
          const r = e.z - n.z;
          const i = Math.hypot(t, r);
          if (
            i < 8 &&
            t * -Math.sin(n.heading) + r * -Math.cos(n.heading) > i * 0.7
          ) {
            p = Math.min(p, Math.max(0, i - 3) * 0.9);
          }
        }
        const E = Math.atan2(Math.sin(m - n.heading), Math.cos(m - n.heading));
        p *= 1 - Math.min(0.55, Math.abs(E) * 0.5);
        const D = Math.min(3.4, 72 / Math.max(n.speed, 9));
        n.heading += clamp(E, -D * e, D * e);
        n.speed += clamp(p - n.speed, -28 * e, (T ? 6 : 12) * e);
        n.x += -Math.sin(n.heading) * n.speed * e;
        n.z += -Math.cos(n.heading) * n.speed * e;
        for (let e of a.near(n.x, n.z, 4, s)) {
          if (Math.abs(n.x - e.x) < e.w + 1 && Math.abs(n.z - e.z) < e.d + 2) {
            const t = n.x - e.x;
            const r = n.z - e.z;
            if (e.w + 1 - Math.abs(t) < e.d + 2 - Math.abs(r)) {
              ((n.x = e.x + Math.sign(t || 1) * (e.w + 1)), (n.speed *= 0.5));
            } else {
              ((n.z = e.z + Math.sign(r || 1) * (e.d + 2)), (n.speed *= 0.5));
            }
            break;
          }
        }
        if (o && c(n)) {
          x = true;
        }
        const O = collideOrientedBoxes(
          y,
          orientedBox(n.x, n.z, n.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
        );
        if (
          o &&
          !i.onFoot &&
          O.overlap &&
          ((n.x += O.nx * (O.depth + 0.03)),
          (n.z += O.nz * (O.depth + 0.03)),
          n.contactCooldown <= 0)
        ) {
          b = true;
          const e = Math.hypot(
            i.vx + Math.sin(n.heading) * n.speed,
            i.vz + Math.cos(n.heading) * n.speed,
          );
          if (l(Math.min(12, 1.5 + e * 0.35))) {
            i._crash = {
              x: i.x,
              y: i.y || 0,
              z: i.z,
              intensity: Math.min(e * 0.06, 1.2),
            };
          }
          n.contactCooldown = 2;
          n.speed *= 0.3;
          const t = Math.min(7, 2 + e * 0.4);
          i.vx -= O.nx * t;
          i.vz -= O.nz * t;
        }
      });
      for (let e = 0; e < i.police.length; e++) {
        for (let t = e + 1; t < i.police.length; t++) {
          const n = i.police[e];
          const r = i.police[t];
          if (n.onFoot || r.onFoot) {
            continue;
          }
          const a = collideOrientedBoxes(
            orientedBox(n.x, n.z, n.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
            orientedBox(r.x, r.z, r.heading, NPC_HALF_WIDTH, NPC_HALF_LENGTH),
          );
          if (a.overlap) {
            const e = (a.depth + 0.02) / 2;
            n.x += a.nx * e;
            n.z += a.nz * e;
            r.x -= a.nx * e;
            r.z -= a.nz * e;
            n.speed *= 0.7;
            r.speed *= 0.7;
          }
        }
      }
      if (i.wanted > 0.15 && !x) {
        ((i.escape += e), i.escape >= 5 && ((i.wanted = 0), (i.escape = 0)));
      } else {
        i.escape = 0;
      }
      let w = 0;
      if (i.wanted > 0.15) {
        for (let e of i.police) {
          if (!e.onFoot && distance2D(e, i) < 8) {
            w++;
          }
        }
      }
      if ((b || w >= 3) && _ < 5) {
        i.arrestTimer = Math.min(i.arrestTimer + e, 5);
      } else if (!S) {
        i.arrestTimer = Math.max(0, i.arrestTimer - e * 2);
      }
      i.arrest = (i.arrestTimer / 5) * 100;
      i.speed = Math.round(_ * 3.6);
      i.zone =
        i.z < -160
          ? "Montagne Kuro"
          : i.x > 130
            ? "Autoroute A9"
            : "Centre-ville";
      i.y = terrainHeight(i.x, i.z);
      if (i.health <= 0 || i.arrest >= 100) {
        ((i.ended = true),
          (i.reason = i.health <= 0 ? "Véhicule détruit" : "Vous êtes arrêté"));
      }
      return i;
    },
  };
}
