import { createSampleEngine, loadEngineSamples } from "./samples.js";
import { createSoundEffects } from "./soundEffects.js";
import { createWorkletEngine } from "./workletEngine.js";
import { createVoices } from "./voices.js";
import { createPoliceSounds } from "./policeSounds.js";
import { createDamageSounds } from "./damageSounds.js";
import { createRadio } from "./radio.js";
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
      fire() {},
      explosion() {},
      chime() {},
      playerSiren() {},
      airhorn() {},
      radioBeep() {},
      taser() {},
      footstep() {},
      rain() {},
      reload() {},
      thunder() {},
      whoosh() {},
      radioNext() {
        return null;
      },
      radioAudible() {},
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
  // (Metal and glass need the high frequencies: white noise.)
  const whiteNoise = context.createBuffer(1, context.sampleRate, context.sampleRate);
  {
    const data = whiteNoise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const policeSounds = createPoliceSounds(context, master, voiceNoise, whiteNoise);
  const damageSounds = createDamageSounds(context, master, whiteNoise);
  const radio = createRadio(context, master, whiteNoise);
  let engineVoice = null;
  let closed = false;
  let lastShiftSerial = 0;
  let muted = true;
  let rainSound = null;
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
    /** The player's siren (police job): its tone while on, or null (call every frame). */
    playerSiren(tone) {
      if (!closed) policeSounds.playerSiren(muted ? null : tone);
    },
    airhorn() {
      if (!closed && !muted) policeSounds.airhorn();
    },
    radioBeep() {
      if (!closed && !muted) policeSounds.radioBeep();
    },
    taser() {
      if (!closed && !muted) policeSounds.taser();
    },
    /** Bodywork grinding along something, `level` 0..1 (call every frame; 0 when not). */
    scrape(level) {
      if (!closed) damageSounds.scrape(muted ? 0 : level);
    },
    glass(strength) {
      if (!closed && !muted) damageSounds.glass(strength);
    },
    /** Fire close by (0..1) and hoses spraying (0..1): call every frame. */
    fire(level, spraying) {
      if (!closed) damageSounds.fire(muted ? 0 : level, muted ? 0 : spraying);
    },
    /** T: the next radio station (null: off). */
    radioNext() {
      return closed ? null : radio.next();
    },
    /** The radio is heard only while driving. */
    radioAudible(on) {
      if (!closed) radio.setAudible(on && !muted);
    },
    /** Jobs: 2 done (a rising three-note chime), 1 a step (one note), 0 failed (falling). */
    chime(kind) {
      if (closed || muted) return;
      const now = context.currentTime;
      const notes = kind === 2 ? [660, 830, 990] : kind === 1 ? [880] : [440, 330];
      notes.forEach((frequency, index) => {
        const tone = context.createOscillator();
        tone.type = "sine";
        tone.frequency.value = frequency;
        const gain = context.createGain();
        const at = now + index * 0.11;
        gain.gain.setValueAtTime(0.0001, at);
        gain.gain.exponentialRampToValueAtTime(0.09, at + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.0005, at + 0.35);
        tone.connect(gain);
        gain.connect(master);
        tone.start(at);
        tone.stop(at + 0.4);
        tone.onended = () => {
          tone.disconnect();
          gain.disconnect();
        };
      });
    },
    explosion(distance, pan) {
      if (!closed && !muted) damageSounds.explosion(distance, pan);
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
    /**
     * The player's footstep: a soft heel thud and the scuff of the sole (`strength` 1 walking, ~1.6
     * running, 2.5 landing a jump); `wet`: on the rain-wet city streets, a little splash.
     */
    footstep(strength = 1, wet = false) {
      if (closed || muted) return;
      const now = context.currentTime;
      const nodes = [];
      const burst = (buffer, type, frequency, level, length, q = 0.8) => {
        const source = context.createBufferSource();
        source.buffer = buffer;
        source.playbackRate.value = 0.9 + Math.random() * 0.2;
        const filter = context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency * (0.9 + Math.random() * 0.2);
        filter.Q.value = q;
        const gain = context.createGain();
        gain.gain.setValueAtTime(level, now);
        gain.gain.exponentialRampToValueAtTime(0.0003, now + length);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(now, Math.random() * 0.3);
        source.stop(now + length + 0.02);
        nodes.push(source, filter, gain);
        return source;
      };
      burst(voiceNoise, "lowpass", 320, 0.09 * strength, 0.07);
      const last = burst(whiteNoise, "bandpass", 2600, 0.018 * strength, wet ? 0.11 : 0.05, 1.2);
      if (wet) burst(whiteNoise, "highpass", 4200, 0.012 * strength, 0.14);
      last.onended = () => {
        for (const node of nodes) node.disconnect();
      };
    },
    /**
     * Rain falling all around (`on`), its hiss muffled inside a car (`inCar`). A looping noise, faded in
     * and out.
     */
    rain(on, inCar = false) {
      if (closed) return;
      const now = context.currentTime;
      if (!rainSound) {
        if (!on) return;
        const source = context.createBufferSource();
        source.buffer = whiteNoise;
        source.loop = true;
        const band = context.createBiquadFilter();
        band.type = "lowpass";
        band.frequency.value = 5000;
        const body = context.createBiquadFilter();
        body.type = "highpass";
        body.frequency.value = 400;
        const gain = context.createGain();
        gain.gain.value = 0;
        source.connect(body);
        body.connect(band);
        band.connect(gain);
        gain.connect(master);
        source.start();
        rainSound = { source, band, gain, on: null, inCar: null };
      }
      if (rainSound.on === on && rainSound.inCar === inCar) return;
      rainSound.on = on;
      rainSound.inCar = inCar;
      rainSound.gain.gain.setTargetAtTime(on ? (inCar ? 0.05 : 0.07) : 0, now, 0.6); // (muting is the master's)
      rainSound.band.frequency.setTargetAtTime(inCar ? 1300 : 5000, now, 0.2);
    },
    /** A reload taking `length` seconds: the magazine out (a click), the new one in and the slide (two). */
    reload(length = 1.4) {
      if (closed || muted) return;
      const now = context.currentTime;
      const click = (at, frequency, level) => {
        const source = context.createBufferSource();
        source.buffer = whiteNoise;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = frequency;
        filter.Q.value = 3;
        const gain = context.createGain();
        gain.gain.setValueAtTime(level, now + at);
        gain.gain.exponentialRampToValueAtTime(0.0003, now + at + 0.04);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(master);
        source.start(now + at, Math.random() * 0.5);
        source.stop(now + at + 0.06);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
      };
      click(0.1, 2200, 0.08);
      click(length * 0.6, 1800, 0.1);
      click(length * 0.85, 3200, 0.09);
    },
    /** Thunder `distance` km away: a crack (near) and a long low rumble that rolls and fades. */
    thunder(distance = 2) {
      if (closed || muted) return;
      const now = context.currentTime;
      const length = 3 + distance * 1.2;
      const level = 0.5 / (0.6 + distance * 0.5);
      const source = context.createBufferSource();
      source.buffer = voiceNoise;
      source.loop = true;
      source.playbackRate.value = 0.5;
      const low = context.createBiquadFilter();
      low.type = "lowpass";
      low.frequency.setValueAtTime(distance < 1.5 ? 900 : 300, now);
      low.frequency.exponentialRampToValueAtTime(110, now + length);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + (distance < 1.5 ? 0.05 : 0.4));
      // (Rolling: a few swells as the sound comes back from far parts of the bolt.)
      for (let k = 1; k <= 3; k++) gain.gain.setTargetAtTime(level * (0.9 - k * 0.2), now + (length * k) / 5, 0.3);
      gain.gain.setTargetAtTime(0.0001, now + length * 0.75, length * 0.15);
      source.connect(low);
      low.connect(gain);
      gain.connect(master);
      source.start(now);
      source.stop(now + length + 0.5);
      source.onended = () => {
        source.disconnect();
        low.disconnect();
        gain.disconnect();
      };
    },
    /** A punch thrown: the swish of the arm through the air. */
    whoosh() {
      if (closed || muted) return;
      const now = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = whiteNoise;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.Q.value = 1.4;
      filter.frequency.setValueAtTime(500, now);
      filter.frequency.exponentialRampToValueAtTime(1900, now + 0.12);
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.0003, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0003, now + 0.16);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      source.start(now, Math.random() * 0.5);
      source.stop(now + 0.18);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
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
        radio.close();
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
