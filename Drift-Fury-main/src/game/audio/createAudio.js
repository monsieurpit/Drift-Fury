import { createSampleEngine, loadEngineSamples } from "./samples.js";
import { createSoundEffects } from "./soundEffects.js";
import { createWorkletEngine } from "./workletEngine.js";
export function createAudio(engine) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return {
      ready: Promise.resolve(),
      update() {},
      crash() {},
      startEngine() {},
      resume() {},
      close() {},
    };
  }
  const context = new AudioContextClass({
    latencyHint: "interactive",
  });
  const master = context.createGain();
  master.gain.value = 0;
  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -14;
  compressor.knee.value = 12;
  compressor.ratio.value = 3;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.16;
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 28;
  master.connect(highpass);
  highpass.connect(compressor);
  compressor.connect(context.destination);
  const soundEffects = createSoundEffects(context, master, engine.id);
  let engineVoice = null;
  let closed = false;
  let lastShiftSerial = 0;
  let muted = true;
  return {
    ready: createWorkletEngine(context, master, engine.id)
      .then((voice) => {
        if (closed) {
          voice.close();
        } else {
          engineVoice = voice;
          soundEffects.setWorkletActive();
        }
      })
      .catch(async () =>
        createSampleEngine(context, master, await loadEngineSamples(context, engine.id), engine.id),
      ),
    resume() {
      if (!closed && context.state === "suspended") {
        return context.resume();
      }
    },
    update(rpm, pedal, isMuted, drifting, state = {}) {
      if (!closed) {
        muted = isMuted;
        if (context.state === "suspended") {
          context.resume();
        }
        master.gain.setTargetAtTime(isMuted || !engineVoice ? 0 : 1, context.currentTime, 0.035);
        if (engineVoice) {
          engineVoice.update(rpm, pedal, state);
          soundEffects.update(rpm, pedal, drifting, state, isMuted);
          if (state.shiftSerial > lastShiftSerial) {
            if (!isMuted && rpm > 2300) {
              soundEffects.shift(state.shiftDirection > 0);
              engineVoice.bang?.(
                (state.shiftDirection > 0 ? 1 : 0.8) * Math.min(1.6, 0.6 + rpm / (state.redline || 7000)),
              );
            }
            lastShiftSerial = state.shiftSerial;
          }
        }
      }
    },
    startEngine() {
      if (!closed && !muted && context.state === "running") {
        soundEffects.startEngine();
      }
    },
    crash(strength = 1) {
      if (!closed && !muted) {
        soundEffects.crash(strength);
      }
    },
    close() {
      if (!closed) {
        closed = true;
        engineVoice?.close();
        soundEffects.close();
        master.disconnect();
        highpass.disconnect();
        compressor.disconnect();
        if (context.state !== "closed") {
          context.close();
        }
      }
    },
  };
}
