// Police sounds, synthesised: the cruisers' siren (a slow wail far off, the fast yelp up close), the
// helicopter's rotor thump overhead, and the click of handcuffs.
export function createPoliceSounds(context, output, noiseBuffer) {
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
    /** Silences the loops (paused, muted). */
    silence() {
      const now = context.currentTime;
      sirenGain.gain.setTargetAtTime(0, now, 0.05);
      rotorGain.gain.setTargetAtTime(0, now, 0.05);
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
      for (const node of [siren, sweep, rotorNoise, blades]) {
        try {
          node.stop();
        } catch {
          // already stopped
        }
      }
    },
  };
}
