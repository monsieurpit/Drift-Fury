import { ENGINE_REDLINE, GEARBOX } from "../data/engines.js";
const clamp = (e, t, n) => Math.max(t, Math.min(n, e));
const lerp = (e, t, n) => e + (t - e) * n;
const damp = (e, t, n, r) => e + (t - e) * (1 - Math.exp(-n * r));
const TAU = Math.PI * 2;
const WHEELBASE = {
  coupe: 2.62,
  muscle: 2.95,
  super: 2.65,
};
const MAX_STEER_ANGLE = 0.55;
export function gearTopSpeeds(e) {
  const t = ENGINE_REDLINE[e] || 7200;
  return GEARBOX.ratios.map((e) => (t / 60 / (e * GEARBOX.finalDrive)) * TAU * GEARBOX.wheel);
}
export function reverseTopSpeed(e) {
  return (
    ((ENGINE_REDLINE[e] || 7200) / 60 / (Math.abs(GEARBOX.reverse) * GEARBOX.finalDrive)) *
    TAU *
    GEARBOX.wheel
  );
}
export function createCarPhysics(e, t) {
  const n = WHEELBASE[e.shape] || 2.62;
  const r = e.grip || 1;
  const i = t.max;
  const a = 4 + t.acceleration * 0.36;
  const o = 14 * r;
  const s = 13 * r;
  const c = e.awd ? 0.25 : 0.5;
  function l(e, t, r) {
    const l = e.noPolice ? 1 - Math.max(0, e.health) / 100 : 0;
    const u = i * (1 - 0.4 * l);
    const d = a * (1 - 0.4 * l);
    const f = o * (1 - 0.14 * l);
    const p = s * (1 - 0.1 * l);
    e.steer = damp(e.steer || 0, r.steer, r.steer ? 7 : 10, t);
    const m = e.steer;
    let h = e.heading;
    let g = e.vx * -Math.sin(h) + e.vz * -Math.cos(h);
    let _ = e.vx * -Math.cos(h) + e.vz * Math.sin(h);
    const v = g > 1 ? Math.atan2(-_, g) : 0;
    if (g > 7 && (r.handbrake || Math.abs(v) > 0.3)) {
      e.driftOn = true;
    } else if (!r.handbrake && (Math.abs(v) < 0.07 || g < 4)) {
      e.driftOn = false;
    }
    const y = (e.driftAmt = damp(e.driftAmt || 0, +!!e.driftOn, e.driftOn ? 10 : 4, t));
    const b = Math.abs(g);
    const x = m * Math.min((b * Math.tan(MAX_STEER_ANGLE)) / n, f / Math.max(b, 1)) * Math.sign(g);
    const S = clamp(43 / Math.max(b, 13), 0.6, 1);
    const C = (r.handbrake ? 0.95 : r.throttle ? 0.7 : 0.1) * S;
    const w = Math.abs(m) > 0.15 ? m * C : r.handbrake ? v : v * (r.throttle ? 0.6 : 0);
    const T = (3 * p) / Math.max(b, 6);
    const E = clamp((w - v) * 3.5, -T, T);
    e.yaw = damp(e.yaw || 0, lerp(x, E, y), lerp(12, 5, y), t);
    e.heading = h += e.yaw * t;
    const D = -Math.sin(h);
    const O = -Math.cos(h);
    const k = -Math.cos(h);
    const A = Math.sin(h);
    g = e.vx * D + e.vz * O;
    _ = e.vx * k + e.vz * A;
    const j = Math.sign(_) * Math.max(0, Math.abs(_) - lerp(f * 1.3, p, y) * t);
    if (Math.abs(g) > 1) {
      g = Math.sign(g) * Math.sqrt(g * g + (_ * _ - j * j) * lerp(1, 0.5, y));
    }
    _ = j;
    let M = 0;
    if (e.gear === -1) {
      M = -e.driveThrottle * r.fuel * d * 0.45 * (1 - Math.min(1, -g / 14));
      if (r.throttle && g < -0.3) {
        M += 16;
      }
    } else {
      const t = Math.min(1, Math.abs(g) / u);
      M = e.driveThrottle * r.fuel * d * (1 - t ** 2.2) * (1 - c * y);
      if (r.brake && g > 0.3) {
        M -= 16;
      }
    }
    if (r.handbrake && g > 0.3) {
      M -= 3.5;
    }
    const N = 0.2 + 0.00025 * g * g + (!r.throttle && !r.brake ? 1.1 : 0);
    g -= Math.sign(g) * Math.min(Math.abs(g), N * t);
    g = clamp(g + M * t, -14, u);
    e.vx = g * D + _ * k;
    e.vz = g * O + _ * A;
    e.slipAngle = Math.abs(g) > 1 ? Math.abs(Math.atan2(_, Math.abs(g))) : 0;
    e.u = g;
    e.w = _;
    e.ax = M;
    if (Math.abs(g) < 0.15 && Math.abs(_) < 0.15 && !r.throttle && !r.brake) {
      e.vx = 0;
      e.vz = 0;
      e.u = 0;
      e.w = 0;
      e.yaw = 0;
    }
  }
  return {
    step: l,
  };
}
