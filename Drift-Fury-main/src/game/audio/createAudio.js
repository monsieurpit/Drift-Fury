import { createSampleEngine, loadEngineSamples } from "./samples.js";
import { createSoundEffects } from "./soundEffects.js";
import { createWorkletEngine } from "./workletEngine.js";
import { createVoices } from "./voices.js";
import { createPoliceSounds } from "./policeSounds.js";
import { createDamageSounds } from "./damageSounds.js";
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
      police() {},
      cuffs() {},
      scrape() {},
      glass() {},
      horn() {},
      gunshot() {},
      ping() {},
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
  const policeSounds = createPoliceSounds(context, master, voiceNoise);
  // (Metal and glass need the high frequencies: white noise.)
  const whiteNoise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  {
    const data = whiteNoise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const damageSounds = createDamageSounds(context, master, whiteNoise);
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
        damageSounds.crunch(strength);
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
    /** The siren of the nearest chasing cruiser and the helicopter: { distance, pan } each, or null. */
    police(sirenAt, heliAt) {
      if (closed) return;
      if (muted) policeSounds.silence();
      else policeSounds.update(sirenAt, heliAt);
    },
    cuffs() {
      if (!closed && !muted) policeSounds.cuffs();
    },
    /** Bodywork grinding along something, `level` 0..1 (call every frame; 0 when not). */
    scrape(level) {
      if (!closed) damageSounds.scrape(muted ? 0 : level);
    },
    glass(strength) {
      if (!closed && !muted) damageSounds.glass(strength);
    },
    /** A pistol shot at `distance` metres: the crack, the body of the blast and its echo off the buildings. */
    gunshot(distance, pan) {
      if (closed || muted) return;
      const now = context.currentTime;
      const near = Math.min(1, 10 / Math.max(10, distance));
      const panner = context.createStereoPanner ? context.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = Math.max(-1, Math.min(1, pan * 0.7));
        panner.connect(master);
      }
      const out = panner || master;
      const nodes = [panner];
      const burst = (type, frequency, level, start, length) => {
        const source = context.createBufferSource();
        source.buffer = whiteNoise;
        const filter = context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        const gain = context.createGain();
        gain.gain.setValueAtTime(level, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + start + length);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(out);
        source.start(now + start, Math.random() * 0.5);
        source.stop(now + start + length + 0.02);
        nodes.push(source, filter, gain);
        return source;
      };
      burst("highpass", 1400, 0.55 * near, 0, 0.08);
      burst("lowpass", 420, 0.6 * Math.sqrt(near), 0, 0.2);
      const last = burst("lowpass", 900, 0.12 * Math.sqrt(near), 0.16 + Math.random() * 0.08, 0.45);
      last.onended = () => {
        for (const node of nodes) node?.disconnect();
      };
    },
    /** A bullet hitting a car: a short metallic ping. */
    ping(distance) {
      if (closed || muted) return;
      const now = context.currentTime;
      const tone = context.createOscillator();
      tone.type = "triangle";
      tone.frequency.setValueAtTime(2400 + Math.random() * 900, now);
      tone.frequency.exponentialRampToValueAtTime(1500, now + 0.12);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.06 * Math.min(1, 8 / Math.max(8, distance)), now);
      gain.gain.exponentialRampToValueAtTime(0.0005, now + 0.14);
      tone.connect(gain);
      gain.connect(master);
      tone.start(now);
      tone.stop(now + 0.16);
      tone.onended = () => {
        tone.disconnect();
        gain.disconnect();
      };
    },
    /** A car horn at `distance` metres, `pan` -1..1: two reedy tones, a short double honk or one long. */
    horn(distance, pan) {
      if (closed || muted) return;
      const now = context.currentTime;
      const level = 0.09 * Math.min(1, 8 / Math.max(8, distance));
      const panner = context.createStereoPanner ? context.createStereoPanner() : null;
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 2200;
      const gain = context.createGain();
      gain.gain.value = 0;
      const pattern = Math.random() < 0.5 ? [[0, 0.16], [0.24, 0.16]] : [[0, 0.55]];
      for (const [start, length] of pattern) {
        gain.gain.setValueAtTime(0, now + start);
        gain.gain.linearRampToValueAtTime(level, now + start + 0.015);
        gain.gain.setValueAtTime(level, now + start + length - 0.03);
        gain.gain.linearRampToValueAtTime(0, now + start + length);
      }
      const end = now + pattern[pattern.length - 1][0] + pattern[pattern.length - 1][1] + 0.05;
      const base = 380 + Math.random() * 60;
      const tones = [base, base * 1.26].map((frequency) => {
        const tone = context.createOscillator();
        tone.type = "square";
        tone.frequency.value = frequency;
        tone.connect(filter);
        tone.start(now);
        tone.stop(end);
        return tone;
      });
      filter.connect(gain);
      if (panner) {
        panner.pan.value = Math.max(-1, Math.min(1, pan * 0.8));
        gain.connect(panner);
        panner.connect(master);
      } else {
        gain.connect(master);
      }
      tones[0].onended = () => {
        for (const node of [...tones, filter, gain, panner]) node?.disconnect();
      };
    },
    murmur(female, distance, pan) {
      if (!closed && !muted) voices.murmur(female, distance, pan);
    },
    close() {
      if (!closed) {
        closed = true;
        engineVoice?.close();
        policeSounds.close();
        damageSounds.close();
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
