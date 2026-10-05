import { ENGINE_REDLINE } from "../data/engines.js";
import { gearTopSpeeds, reverseTopSpeed } from "./physics.js";
const GEAR_COUNT = 7;
const UPSHIFT_RPM_RATIO = 0.93;
const clamp = (e, t, n) => Math.max(t, Math.min(n, e));
export function updateGearbox(e, t, n, r, i, a, o) {
  const s = ENGINE_REDLINE[t.id] || 7200;
  const c = t.id === "V12" ? 1000 : 900;
  const l = gearTopSpeeds(t.id);
  const u = Math.abs(r);
  e.redline = s;
  e.shiftTimer = Math.max(0, (e.shiftTimer || 0) - n);
  e.shiftCooldown = Math.max(0, (e.shiftCooldown || 0) - n);
  const d = r < -0.6 || (u < 0.6 && a && !i);
  const f = (e) => (u / l[e - 1]) * s;
  let p = e.gear || 1;
  if (d) {
    p = -1;
  } else if (p < 1 || u < 0.5) {
    p = 1;
  } else if (e.shiftCooldown === 0 && e.shiftTimer === 0 && !o) {
    const e = s * (i ? 0.4 : 0.3);
    if (p < GEAR_COUNT && f(p) > s * UPSHIFT_RPM_RATIO) {
      p++;
    } else if (p > 1 && f(p) < e) {
      for (p--; p > 1 && f(p - 1) < s * 0.75; ) {
        p--;
      }
    }
  }
  if (p !== e.gear) {
    if (p > 0 && e.gear > 0 && u > 0.5) {
      e.shiftDirection = Math.sign(p - e.gear);
      e.shiftSerial = (e.shiftSerial || 0) + 1;
      e.shiftTimer = t.id === "V12" ? 0.14 : 0.2;
      e.shiftCooldown = 0.6;
    }
    e.gear = p;
  }
  e.shifting = e.shiftTimer > 0;
  const m = d ? a : i;
  e.pedal = m;
  e.driveThrottle = m * (e.shifting ? 0.08 : 1);
  const h = d ? (u / reverseTopSpeed(t.id)) * s : f(e.gear);
  const g = m * Math.max(0, 1 - u / 7) * 1600;
  const _ = o && i ? 1800 : 0;
  const v = e.shifting && e.shiftDirection < 0 ? 350 : 0;
  const y = t && e.fuel > 0 ? clamp(Math.max(c + g, h) + _ + v, c, s) : 0;
  const b = e.shifting ? 19 : m ? 15 : 10;
  e.rpm = Math.round(e.rpm + (y - e.rpm) * (1 - Math.exp(-n * b)));
}
