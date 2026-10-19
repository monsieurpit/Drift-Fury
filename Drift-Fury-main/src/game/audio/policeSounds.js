// Police sounds, synthesised: the cruisers' siren (a slow wail far off, the fast yelp up close), the
// helicopter's rotor thump overhead, and the click of handcuffs.
export function createPoliceSounds(context, output, noiseBuffer, whiteNoise = noiseBuffer) {
  // Siren: a square-ish tone whose pitch is swept by an LFO, through a horn-like band-pass.
  const siren = context.createOscillator();
  siren.type = "sawtooth";
  siren.frequency.value = 1000;
  const sweep = context.createOscillator();
  sweep.type = "triangle";
  sweep.frequency.value = 0.23;
  const sweepDepth = context.createGain();
  sweepDepth.gain.value = 380;
  sweep.connect(sweepDepth);
  sweepDepth.connect(siren.frequency);
  const horn = context.createBiquadFilter();
  horn.type = "bandpass";
  horn.frequency.value = 1200;
  horn.Q.value = 0.9;
  const sirenGain = context.createGain();
  sirenGain.gain.value = 0;
  const sirenPan = context.createStereoPanner ? context.createStereoPanner() : null;
  siren.connect(horn);
  horn.connect(sirenGain);
  if (sirenPan) {
    sirenGain.connect(sirenPan);
    sirenPan.connect(output);
  } else {
    sirenGain.connect(output);
  }
  siren.start();
  sweep.start();

  // Rotor: low noise chopped by each blade passing (about 11 per second for four blades).
  const rotorNoise = context.createBufferSource();
  rotorNoise.buffer = noiseBuffer;
  rotorNoise.loop = true;
  const rotorFilter = context.createBiquadFilter();
  rotorFilter.type = "lowpass";
  rotorFilter.frequency.value = 320;
  const chop = context.createGain();
  chop.gain.value = 0.5;
  const blades = context.createOscillator();
  blades.type = "sine";
  blades.frequency.value = 11;
  const bladeDepth = context.createGain();
  bladeDepth.gain.value = 0.5;
  blades.connect(bladeDepth);
  bladeDepth.connect(chop.gain);
  const rotorGain = context.createGain();
  rotorGain.gain.value = 0;
  const rotorPan = context.createStereoPanner ? context.createStereoPanner() : null;
  rotorNoise.connect(rotorFilter);
  rotorFilter.connect(chop);
  chop.connect(rotorGain);
  if (rotorPan) {
    rotorGain.connect(rotorPan);
    rotorPan.connect(output);
  } else {
    rotorGain.connect(output);
  }
  rotorNoise.start();
  blades.start();

  const loudness = (distance, reference) => Math.min(1, reference / Math.max(reference, distance));

  // The player's own siren (the police job), with its tones: wail, yelp, hi-lo (two-tone), phaser.
  const own = context.createOscillator();
  own.type = "sawtooth";
  own.frequency.value = 950;
  const ownSweep = context.createOscillator();
  ownSweep.type = "triangle";
  ownSweep.frequency.value = 0.25;
  const ownDepth = context.createGain();
  ownDepth.gain.value = 420;
  ownSweep.connect(ownDepth);
  ownDepth.connect(own.frequency);
  const ownHorn = context.createBiquadFilter();
  ownHorn.type = "bandpass";
  ownHorn.frequency.value = 1150;
  ownHorn.Q.value = 0.8;
  const ownGain = context.createGain();
  ownGain.gain.value = 0;
  own.connect(ownHorn);
  ownHorn.connect(ownGain);
  ownGain.connect(output);
  own.start();
  ownSweep.start();
  const TONES = {
    wail: { type: "triangle", rate: 0.25, depth: 420, base: 950 },
    yelp: { type: "triangle", rate: 3.3, depth: 340, base: 1000 },
    hilo: { type: "square", rate: 1.05, depth: 160, base: 780 },
    phaser: { type: "sawtooth", rate: 11, depth: 300, base: 1050 },
  };
  let ownTone = null;

  return {
    /**
     * `sirenAt`: { distance, pan } of the nearest chasing cruiser (or null); `heliAt`: the helicopter's
     * { distance, pan } (or null).
     */
    update(sirenAt, heliAt) {
      const now = context.currentTime;
      if (sirenAt) {
        // Close: the fast yelp; further off: the slow wail.
        const close = sirenAt.distance < 45;
        sweep.frequency.setTargetAtTime(close ? 3.2 : 0.23, now, 0.3);
        sweepDepth.gain.setTargetAtTime(close ? 300 : 380, now, 0.3);
        sirenGain.gain.setTargetAtTime(0.11 * loudness(sirenAt.distance, 18), now, 0.08);
        sirenPan?.pan.setTargetAtTime(sirenAt.pan * 0.8, now, 0.05);
      } else {
        sirenGain.gain.setTargetAtTime(0, now, 0.25);
      }
      if (heliAt) {
        rotorGain.gain.setTargetAtTime(0.5 * loudness(heliAt.distance, 30), now, 0.1);
        rotorPan?.pan.setTargetAtTime(heliAt.pan * 0.6, now, 0.1);
      } else {
        rotorGain.gain.setTargetAtTime(0, now, 0.4);
      }
    },
    /** The player's siren: a tone name (see TONES) while it is on, or null. Every frame. */
    playerSiren(tone) {
      const now = context.currentTime;
      if (tone !== ownTone && tone) {
        const settings = TONES[tone] || TONES.wail;
        ownSweep.type = settings.type;
        ownSweep.frequency.setValueAtTime(settings.rate, now);
        ownDepth.gain.setValueAtTime(settings.depth, now);
        own.frequency.setValueAtTime(settings.base, now);
      }
      ownTone = tone;
      ownGain.gain.setTargetAtTime(tone ? 0.075 : 0, now, tone ? 0.03 : 0.08);
    },
    /** The police car's air horn: a deep, brassy blast. */
    airhorn() {
      const now = context.currentTime;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.setValueAtTime(0.14, now + 0.5);
      gain.gain.linearRampToValueAtTime(0, now + 0.6);
      const filter = context.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 1400;
      const tones = [175, 220, 262].map((frequency) => {
        const tone = context.createOscillator();
        tone.type = "sawtooth";
        tone.frequency.value = frequency;
        tone.connect(filter);
        tone.start(now);
        tone.stop(now + 0.62);
        return tone;
      });
      filter.connect(gain);
      gain.connect(output);
      tones[0].onended = () => {
        for (const node of [...tones, filter, gain]) node.disconnect();
      };
    },
    /** The police radio: a burst of squelch and the beep before dispatch talks. */
    radioBeep() {
      const now = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = whiteNoise;
      const filter = context.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1800;
      filter.Q.value = 0.6;
      const gain = context.createGain();
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      source.start(now, Math.random() * 0.3);
      source.stop(now + 0.18);
      const beep = context.createOscillator();
      beep.type = "sine";
      beep.frequency.value = 1250;
      const beepGain = context.createGain();
      beepGain.gain.setValueAtTime(0, now + 0.17);
      beepGain.gain.linearRampToValueAtTime(0.05, now + 0.18);
      beepGain.gain.setValueAtTime(0.05, now + 0.27);
      beepGain.gain.linearRampToValueAtTime(0, now + 0.28);
      beep.connect(beepGain);
      beepGain.connect(output);
      beep.start(now + 0.16);
      beep.stop(now + 0.3);
      beep.onended = () => {
        for (const node of [source, filter, gain, beep, beepGain]) node.disconnect();
      };
    },
    /** A taser firing: a fast electric crackle. */
    taser() {
      const now = context.currentTime;
      const source = context.createBufferSource();
      source.buffer = whiteNoise;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = "highpass";
      filter.frequency.value = 2500;
      const gain = context.createGain();
      gain.gain.value = 0;
      // Clicks: the gain chopped at ~19 per second.
      for (let k = 0; k < 18; k++) {
        const at = now + k * 0.052;
        gain.gain.setValueAtTime(0.12, at);
        gain.gain.setValueAtTime(0.02, at + 0.02);
      }
      gain.gain.setValueAtTime(0, now + 0.95);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(output);
      source.start(now);
      source.stop(now + 1);
      source.onended = () => {
        source.disconnect();
        filter.disconnect();
        gain.disconnect();
      };
    },
    /** Silences the loops (paused, muted). */
    silence() {
      const now = context.currentTime;
      sirenGain.gain.setTargetAtTime(0, now, 0.05);
      rotorGain.gain.setTargetAtTime(0, now, 0.05);
      ownGain.gain.setTargetAtTime(0, now, 0.05);
      ownTone = null;
    },
    /** Handcuffs closing: a ratchet of small metal clicks, and the lock. */
    cuffs() {
      const start = context.currentTime;
      for (let k = 0; k < 5; k++) {
        const at = start + k * 0.045 + (k === 4 ? 0.08 : 0);
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = k === 4 ? 2600 : 4200;
        filter.Q.value = 6;
        const gain = context.createGain();
        gain.gain.setValueAtTime(k === 4 ? 1.4 : 0.7, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.035);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
        };
        source.start(at, Math.random() * 0.3);
        source.stop(at + 0.05);
      }
      // A short metallic ring.
      const ring = context.createOscillator();
      ring.type = "sine";
      ring.frequency.value = 3150;
      const ringGain = context.createGain();
      ringGain.gain.setValueAtTime(0.05, start + 0.26);
      ringGain.gain.exponentialRampToValueAtTime(0.0005, start + 0.5);
      ring.connect(ringGain);
      ringGain.connect(output);
      ring.onended = () => {
        ring.disconnect();
        ringGain.disconnect();
      };
      ring.start(start + 0.26);
      ring.stop(start + 0.52);
    },
    close() {
      for (const node of [siren, sweep, rotorNoise, blades, own, ownSweep]) {
        try {
          node.stop();
        } catch {
          // already stopped
        }
      }
    },
  };
}
