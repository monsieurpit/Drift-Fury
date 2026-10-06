// Pedestrians' voices (recorded screams and cries of pain, see public/sounds/people/CREDITS.md) and the
// sound of a body hit by a car. Placed in the stereo field and faded with distance from the listener.

const BASE = (import.meta.env?.BASE_URL || "/") + "sounds/people/";
const CLIPS = {
  screamMale: [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `scream_m${i}`),
  screamFemale: [1, 2, 3, 4].map((i) => `scream_f${i}`),
  hurt: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `hurt_${i}`),
};

export function createVoices(context, output, noiseBuffer) {
  const buffers = new Map();
  // Loaded in the background: a voice asked for before its clip arrived is simply not heard.
  const ready = Promise.all(
    Object.values(CLIPS)
      .flat()
      .map(async (name) => {
        try {
          const response = await fetch(`${BASE}${name}.mp3`);
          if (!response.ok) return;
          buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
        } catch {
          /* missing clip: that voice stays silent */
        }
      }),
  );
  let playing = 0;

  /** Gain and stereo node for a sound at `distance` metres, `pan` -1 (left) .. 1 (right). */
  function placed(level, distance, pan) {
    const gain = context.createGain();
    // Roughly inverse distance, as a voice carries in a street.
    gain.gain.value = level / Math.max(1, distance / 6);
    const panner = context.createStereoPanner ? context.createStereoPanner() : null;
    if (panner) {
      panner.pan.value = Math.max(-1, Math.min(1, pan));
      gain.connect(panner);
      panner.connect(output);
    } else {
      gain.connect(output);
    }
    return { gain, panner };
  }

  function play(list, level, distance, pan, rate = 1) {
    if (playing >= 6 || distance > 90) return; // a crowd of voices at once is noise
    const available = list.filter((name) => buffers.has(name));
    if (!available.length) return;
    const buffer = buffers.get(available[Math.floor(Math.random() * available.length)]);
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate * (0.94 + Math.random() * 0.12);
    const { gain, panner } = placed(level, distance, pan);
    source.connect(gain);
    playing++;
    source.onended = () => {
      playing--;
      source.disconnect();
      gain.disconnect();
      panner?.disconnect();
    };
    source.start();
  }

  return {
    ready,
    /** A scream of fright (female or male voice). */
    scream(female, distance, pan) {
      play(female ? CLIPS.screamFemale : CLIPS.screamMale, 0.55, distance, pan, female ? 1 : 0.97);
    },
    /** A cry of pain (higher for a female voice). */
    hurt(female, distance, pan) {
      play(CLIPS.hurt, 0.75, distance, pan, female ? 1.22 : 0.92);
    },
    /**
     * Two people chatting, heard from a little way off: a few syllables of muffled, indistinct speech (a
     * voice's pitch through two moving vowel resonances), quiet, and only close by.
     */
    murmur(female, distance, pan) {
      if (distance > 14 || playing >= 6) return;
      const now = context.currentTime;
      const syllables = 3 + Math.floor(Math.random() * 5);
      const duration = syllables * (0.16 + Math.random() * 0.05);
      const pitch = (female ? 205 : 118) * (0.9 + Math.random() * 0.2);
      const voice = context.createOscillator();
      voice.type = "sawtooth";
      const first = context.createBiquadFilter();
      const second = context.createBiquadFilter();
      first.type = second.type = "bandpass";
      first.Q.value = 6;
      second.Q.value = 9;
      const muffle = context.createBiquadFilter();
      muffle.type = "lowpass";
      muffle.frequency.value = 1800;
      const envelope = context.createGain();
      envelope.gain.value = 0;
      const { gain, panner } = placed(0.16, distance, pan);
      voice.connect(first);
      voice.connect(second);
      first.connect(muffle);
      second.connect(muffle);
      muffle.connect(envelope);
      envelope.connect(gain);
      // Vowels (first and second resonance, Hz) for the syllables.
      const vowels = [
        [730, 1090],
        [530, 1840],
        [270, 2290],
        [570, 840],
        [300, 870],
        [660, 1720],
      ];
      let time = now;
      for (let i = 0; i < syllables; i++) {
        const [f1, f2] = vowels[Math.floor(Math.random() * vowels.length)];
        const length = duration / syllables;
        const scale = female ? 1.15 : 1;
        first.frequency.setTargetAtTime(f1 * scale, time, 0.025);
        second.frequency.setTargetAtTime(f2 * scale, time, 0.025);
        // Speech melody: up a little on stressed syllables, falling at the end.
        const contour = 1 + 0.08 * Math.sin(i * 1.7) - (i === syllables - 1 ? 0.12 : 0);
        voice.frequency.setTargetAtTime(pitch * contour, time, 0.04);
        envelope.gain.setTargetAtTime(0.9, time, 0.02);
        envelope.gain.setTargetAtTime(0.05, time + length * 0.7, 0.03);
        time += length;
      }
      envelope.gain.setTargetAtTime(0, time, 0.03);
      playing++;
      voice.onended = () => {
        playing--;
        for (const node of [voice, first, second, muffle, envelope, gain]) node.disconnect();
        panner?.disconnect();
      };
      voice.start(now);
      voice.stop(time + 0.2);
    },
    /** A body hit by a car: a heavy thud and the crack of the impact, stronger with speed. */
    bodyHit(strength, distance, pan) {
      if (!noiseBuffer) return;
      const now = context.currentTime;
      for (const [frequency, type, length, level] of [
        [140, "lowpass", 0.32, 0.9],
        [900, "bandpass", 0.12, 0.45],
        [2600, "highpass", 0.05, 0.25],
      ]) {
        const source = context.createBufferSource();
        source.buffer = noiseBuffer;
        const filter = context.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        filter.Q.value = 0.9;
        const { gain, panner } = placed(1, distance, pan);
        const peak = Math.min(1, 0.35 + strength * 0.06) * level * gain.gain.value;
        gain.gain.setValueAtTime(peak, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + length);
        source.connect(filter);
        filter.connect(gain);
        source.onended = () => {
          source.disconnect();
          filter.disconnect();
          gain.disconnect();
          panner?.disconnect();
        };
        source.start(now, Math.random() * 0.2);
        source.stop(now + length);
      }
    },
  };
}
