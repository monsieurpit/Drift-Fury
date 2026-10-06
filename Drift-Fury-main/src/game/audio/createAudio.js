import { createSampleEngine, loadEngineSamples } from "./samples.js";
import { createSoundEffects } from "./soundEffects.js";
import { createWorkletEngine } from "./workletEngine.js";
import { createVoices } from "./voices.js";
export function createAudio(engine) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return {
      ready: Promise.resolve(),
      update() {},
      crash() {},
      scream() {},
      hurt() {},
      murmur() {},
      bodyHit() {},
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
  // Pedestrians' voices and impacts (voices.js), with their own short noise for the thuds.
  const voiceNoise = context.createBuffer(1, context.sampleRate / 2, context.sampleRate);
  {
    const data = voiceNoise.getChannelData(0);
    let brown = 0;
    for (let i = 0; i < data.length; i++) {
      brown = 0.9 * brown + 0.1 * (Math.random() * 2 - 1);
      data[i] = brown * 2.5;
    }
  }
  const voices = createVoices(context, master, voiceNoise);
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
    /** Pedestrian voices and impacts at `distance` metres, `pan` -1 (left) .. 1 (right). */
    scream(female, distance, pan) {
      if (!closed && !muted) voices.scream(female, distance, pan);
    },
    hurt(female, distance, pan) {
      if (!closed && !muted) voices.hurt(female, distance, pan);
    },
    bodyHit(strength, distance, pan) {
      if (!closed && !muted) voices.bodyHit(strength, distance, pan);
    },
    murmur(female, distance, pan) {
      if (!closed && !muted) voices.murmur(female, distance, pan);
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
