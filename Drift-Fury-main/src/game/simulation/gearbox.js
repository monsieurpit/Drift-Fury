import { ENGINE_REDLINE } from "../data/engines.js";
import { gearTopSpeeds, reverseTopSpeed } from "./physics.js";
const GEAR_COUNT = 7;
const UPSHIFT_RPM_RATIO = 0.93;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export function updateGearbox(state, engine, dt, forwardSpeed, throttle, brake, handbrake) {
  const redline = ENGINE_REDLINE[engine.id] || 7200;
  const idleRpm = engine.id === "V12" ? 1000 : 900;
  const gearSpeeds = gearTopSpeeds(engine.id);
  const speed = Math.abs(forwardSpeed);
  state.redline = redline;
  state.shiftTimer = Math.max(0, (state.shiftTimer || 0) - dt);
  state.shiftCooldown = Math.max(0, (state.shiftCooldown || 0) - dt);
  const reversing = forwardSpeed < -0.6 || (speed < 0.6 && brake && !throttle);
  const rpmInGear = (gearNumber) => (speed / gearSpeeds[gearNumber - 1]) * redline;
  let gear = state.gear || 1;
  if (reversing) {
    gear = -1;
  } else if (gear < 1 || speed < 0.5) {
    gear = 1;
  } else if (state.shiftCooldown === 0 && state.shiftTimer === 0 && !handbrake) {
    const downshiftRpm = redline * (throttle ? 0.4 : 0.3);
    if (gear < GEAR_COUNT && rpmInGear(gear) > redline * UPSHIFT_RPM_RATIO) {
      gear++;
    } else if (gear > 1 && rpmInGear(gear) < downshiftRpm) {
      for (gear--; gear > 1 && rpmInGear(gear - 1) < redline * 0.75; ) {
        gear--;
      }
    }
  }
  if (gear !== state.gear) {
    if (gear > 0 && state.gear > 0 && speed > 0.5) {
      state.shiftDirection = Math.sign(gear - state.gear);
      state.shiftSerial = (state.shiftSerial || 0) + 1;
      state.shiftTimer = engine.id === "V12" ? 0.14 : 0.2;
      state.shiftCooldown = 0.6;
    }
    state.gear = gear;
  }
  state.shifting = state.shiftTimer > 0;
  const pedal = reversing ? brake : throttle;
  state.pedal = pedal;
  state.driveThrottle = pedal * (state.shifting ? 0.08 : 1);
  const wheelRpm = reversing ? (speed / reverseTopSpeed(engine.id)) * redline : rpmInGear(state.gear);
  const launchRpm = pedal * Math.max(0, 1 - speed / 7) * 1600;
  const handbrakeRev = handbrake && throttle ? 1800 : 0;
  const downshiftBlip = state.shifting && state.shiftDirection < 0 ? 350 : 0;
  const targetRpm =
    engine && state.fuel > 0
      ? clamp(Math.max(idleRpm + launchRpm, wheelRpm) + handbrakeRev + downshiftBlip, idleRpm, redline)
      : 0;
  const rpmResponse = state.shifting ? 19 : pedal ? 15 : 10;
  state.rpm = Math.round(state.rpm + (targetRpm - state.rpm) * (1 - Math.exp(-dt * rpmResponse)));
}
