// Metal sounds of a car being damaged, synthesised: the screech of bodywork grinding along a wall or another
// car (a loop, as loud as the grinding is fast), the crunch and clang of a crash, and breaking glass.
export function createDamageSounds(context, output, noiseBuffer) {
  // Scrape: noise through two resonances of a steel panel, their pitch wandering as it grinds.
  const scrapeNoise = context.createBufferSource();
  scrapeNoise.buffer = noiseBuffer;
  scrapeNoise.loop = true;
  const bodies = [
    [1650, 9, 0.9],
    [3900, 14, 0.6],
    [620, 4, 0.5],
  ].map(([frequency, q, level]) => {
    const filter = context.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = frequency;
    filter.Q.value = q;
    const gain = context.createGain();
    gain.gain.value = level;
    scrapeNoise.connect(filter);
    filter.connect(gain);
    return { filter, gain, frequency };
  });
  const scrapeGain = context.createGain();
  scrapeGain.gain.value = 0;
  for (const { gain } of bodies) gain.connect(scrapeGain);
  scrapeGain.connect(output);
  scrapeNoise.start();

  const voices = new Set();
  const once = (source, nodes, at, duration) => {
    voices.add(source);
    source.onended = () => {
      for (const node of nodes) node.disconnect();
      voices.delete(source);
    };
    source.start(at);
    source.stop(at + duration);
  };

  return {
    /** Grinding at `level` 0..1 this frame (0: none). */
    scrape(level) {
      const now = context.currentTime;
      scrapeGain.gain.setTargetAtTime(Math.min(1, level) * 0.5, now, level > 0 ? 0.02 : 0.08);
      if (level > 0) {
        for (const body of bodies) {
          body.filter.frequency.setTargetAtTime(body.frequency * (0.85 + Math.random() * 0.3), now, 0.03);
        }
      }
    },
    /** A crash: crumpling sheet metal and the clang of the panels (`strength` 0..1.5). */
    crunch(strength) {
      const now = context.currentTime;
      const s = Math.min(strength, 1.5);
      // Crumple: a quick run of filtered noise crackles.
      for (let k = 0; k < 6; k++) {
        const at = now + k * (0.018 + Math.random() * 0.02);
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = 900 + Math.random() * 2600;
        filter.Q.value = 2.5;
        const gain = context.createGain();
        gain.gain.setValueAtTime(0.35 * s, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + 0.06 + Math.random() * 0.05);
        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        once(source, [source, filter, gain], at, 0.13);
      }
      // Clang: a few inharmonic partials of a struck panel, ringing out.
      const base = 180 + Math.random() * 120;
      for (const [ratio, level, decay] of [
        [1, 0.05, 0.35],
        [2.76, 0.035, 0.25],
        [5.4, 0.022, 0.16],
        [8.93, 0.012, 0.1],
      ]) {
        const tone = context.createOscillator();
        tone.type = "triangle";
        tone.frequency.value = base * ratio * (0.97 + Math.random() * 0.06);
        const gain = context.createGain();
        gain.gain.setValueAtTime(level * s, now);
        gain.gain.exponentialRampToValueAtTime(0.0005, now + decay * (0.7 + s * 0.4));
        tone.connect(gain);
        gain.connect(output);
        once(tone, [tone, gain], now, decay * (0.7 + s * 0.4) + 0.02);
      }
    },
    /** Glass breaking: a sharp crack, then a shower of small tinkling pieces. */
    glass(strength = 1) {
      const now = context.currentTime;
      const pieces = 14 + Math.floor(strength * 10);
      for (let k = 0; k < pieces; k++) {
        const at = now + (k === 0 ? 0 : 0.02 + Math.random() * 0.45 * Math.sqrt(k / pieces));
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.value = k === 0 ? 3200 : 4500 + Math.random() * 4500;
        filter.Q.value = k === 0 ? 1.5 : 12;
        const gain = context.createGain();
        const level = k === 0 ? 0.6 : 0.25 * (1 - k / pieces) + 0.05;
        gain.gain.setValueAtTime(level, at);
        gain.gain.exponentialRampToValueAtTime(0.001, at + (k === 0 ? 0.09 : 0.03 + Math.random() * 0.04));
        source.connect(filter);
        filter.connect(gain);
        gain.connect(output);
        once(source, [source, filter, gain], at, 0.12);
      }
    },
    close() {
      try {
        scrapeNoise.stop();
      } catch {
        // already stopped
      }
      for (const voice of voices) {
        try {
          voice.stop();
        } catch {
          // already stopped
        }
      }
    },
  };
}
