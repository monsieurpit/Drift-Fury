import { ENGINE_REDLINE, GEARBOX } from "../data/engines.js";
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const lerp = (from, to, amount) => from + (to - from) * amount;
const damp = (from, to, rate, dt) => from + (to - from) * (1 - Math.exp(-rate * dt));
const TAU = Math.PI * 2;
const WHEELBASE = {
  coupe: 2.62,
  muscle: 2.95,
  super: 2.65,
};
const MAX_STEER_ANGLE = 0.55;
export function gearTopSpeeds(engineId) {
  const redline = ENGINE_REDLINE[engineId] || 7200;
  return GEARBOX.ratios.map((e) => (redline / 60 / (e * GEARBOX.finalDrive)) * TAU * GEARBOX.wheel);
}
export function reverseTopSpeed(engineId) {
  return (
    ((ENGINE_REDLINE[engineId] || 7200) / 60 / (Math.abs(GEARBOX.reverse) * GEARBOX.finalDrive)) *
    TAU *
    GEARBOX.wheel
  );
}
export function createCarPhysics(car, engine) {
  const wheelbase = WHEELBASE[car.shape] || 2.62;
  const grip = car.grip || 1;
  const topSpeed = engine.max;
  const acceleration = 4 + engine.acceleration * 0.36;
  const cornerGrip = 14 * grip;
  const slideGrip = 13 * grip;
  const driftPowerLoss = car.awd ? 0.25 : 0.5;
  function step(state, dt, input) {
    const damage = state.noPolice ? 1 - Math.max(0, state.health) / 100 : 0;
    const maxSpeed = topSpeed * (1 - 0.4 * damage);
    const accel = acceleration * (1 - 0.4 * damage);
    const lateralGrip = cornerGrip * (1 - 0.14 * damage);
    const slideGripNow = slideGrip * (1 - 0.1 * damage);
    state.steer = damp(state.steer || 0, input.steer, input.steer ? 7 : 10, dt);
    const steer = state.steer;
    let heading = state.heading;
    let forward = state.vx * -Math.sin(heading) + state.vz * -Math.cos(heading);
    let lateral = state.vx * -Math.cos(heading) + state.vz * Math.sin(heading);
    const slip = forward > 1 ? Math.atan2(-lateral, forward) : 0;
    if (forward > 7 && (input.handbrake || Math.abs(slip) > 0.3)) {
      state.driftOn = true;
    } else if (!input.handbrake && (Math.abs(slip) < 0.07 || forward < 4)) {
      state.driftOn = false;
    }
    const drift = (state.driftAmt = damp(state.driftAmt || 0, +!!state.driftOn, state.driftOn ? 10 : 4, dt));
    const speed = Math.abs(forward);
    const gripYawRate =
      steer *
      Math.min((speed * Math.tan(MAX_STEER_ANGLE)) / wheelbase, lateralGrip / Math.max(speed, 1)) *
      Math.sign(forward);
    const steerFade = clamp(43 / Math.max(speed, 13), 0.6, 1);
    const slipPerSteer = (input.handbrake ? 0.95 : input.throttle ? 0.7 : 0.1) * steerFade;
    const targetSlip =
      Math.abs(steer) > 0.15
        ? steer * slipPerSteer
        : input.handbrake
          ? slip
          : slip * (input.throttle ? 0.6 : 0);
    const maxSlipYaw = (3 * slideGripNow) / Math.max(speed, 6);
    const slipYawRate = clamp((targetSlip - slip) * 3.5, -maxSlipYaw, maxSlipYaw);
    state.yaw = damp(state.yaw || 0, lerp(gripYawRate, slipYawRate, drift), lerp(12, 5, drift), dt);
    state.heading = heading += state.yaw * dt;
    const forwardX = -Math.sin(heading);
    const forwardZ = -Math.cos(heading);
    const rightX = -Math.cos(heading);
    const rightZ = Math.sin(heading);
    forward = state.vx * forwardX + state.vz * forwardZ;
    lateral = state.vx * rightX + state.vz * rightZ;
    const newLateral =
      Math.sign(lateral) * Math.max(0, Math.abs(lateral) - lerp(lateralGrip * 1.3, slideGripNow, drift) * dt);
    if (Math.abs(forward) > 1) {
      forward =
        Math.sign(forward) *
        Math.sqrt(forward * forward + (lateral * lateral - newLateral * newLateral) * lerp(1, 0.5, drift));
    }
    lateral = newLateral;
    let drive = 0;
    if (state.gear === -1) {
      drive = -state.driveThrottle * input.fuel * accel * 0.45 * (1 - Math.min(1, -forward / 14));
      if (input.throttle && forward < -0.3) {
        drive += 16;
      }
    } else {
      const speedRatio = Math.min(1, Math.abs(forward) / maxSpeed);
      drive =
        state.driveThrottle * input.fuel * accel * (1 - speedRatio ** 2.2) * (1 - driftPowerLoss * drift);
      if (input.brake && forward > 0.3) {
        drive -= 16;
      }
    }
    if (input.handbrake && forward > 0.3) {
      drive -= 3.5;
    }
    const drag = 0.2 + 0.00025 * forward * forward + (!input.throttle && !input.brake ? 1.1 : 0);
    forward -= Math.sign(forward) * Math.min(Math.abs(forward), drag * dt);
    forward = clamp(forward + drive * dt, -14, maxSpeed);
    state.vx = forward * forwardX + lateral * rightX;
    state.vz = forward * forwardZ + lateral * rightZ;
    state.slipAngle = Math.abs(forward) > 1 ? Math.abs(Math.atan2(lateral, Math.abs(forward))) : 0;
    state.u = forward;
    state.w = lateral;
    state.ax = drive;
    if (Math.abs(forward) < 0.15 && Math.abs(lateral) < 0.15 && !input.throttle && !input.brake) {
      state.vx = 0;
      state.vz = 0;
      state.u = 0;
      state.w = 0;
      state.yaw = 0;
    }
  }
  return {
    step,
  };
}
