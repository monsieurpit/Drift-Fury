// The car radio: three stations of original music, generated live (Web Audio synthesis, nothing
// downloaded, nothing copyrighted): a lo-fi beat, synthwave and techno. A small step sequencer schedules
// each 16th note a little ahead of time; drums, bass, chords and lead are synthesized. Heard through
// the car's speakers (a band-limited filter), only while driving.

const STATIONS = [
  {
    id: "lofi",
    bpm: 82,
    swing: 0.12,
    // Am7 Dm7 G7 Cmaj7, one bar each (MIDI notes).
    chords: [
      [57, 60, 64, 67],
      [62, 65, 69, 72],
      [55, 59, 62, 65],
      [48, 55, 59, 64],
    ],
    bass: [45, 50, 43, 48],
    kick: [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1, 0],
    bassSteps: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0],
    pad: "triangle",
    padCutoff: 1100,
    lead: null,
    crackle: true,
  },
  {
    id: "synthwave",
    bpm: 100,
    swing: 0,
    // Am F C G.
    chords: [
      [57, 60, 64],
      [53, 57, 60],
      [48, 52, 55],
      [55, 59, 62],
    ],
    bass: [33, 29, 36, 31],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
    bassSteps: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
    pad: "sawtooth",
    padCutoff: 1600,
    lead: "arp",
    crackle: false,
  },
  {
    id: "techno",
    bpm: 124,
    swing: 0,
    // A minor stabs.
    chords: [
      [57, 60, 64],
      [57, 60, 64],
      [55, 60, 63],
      [55, 58, 62],
    ],
    bass: [33, 33, 31, 31],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1],
    bassSteps: [0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 1],
    pad: "square",
    padCutoff: 900,
    lead: "stab",
    crackle: false,
  },
];

const frequencyOf = (note) => 440 * Math.pow(2, (note - 69) / 12);

export function createRadio(context, output, noiseBuffer) {
  // The car's speakers: no deep bass, no sparkle, a little boxy.
  const speakers = context.createBiquadFilter();
  speakers.type = "bandpass";
  speakers.frequency.value = 900;
  speakers.Q.value = 0.35;
  const volume = context.createGain();
  volume.gain.value = 0;
  speakers.connect(volume);
  volume.connect(output);
  const bus = context.createGain();
  bus.gain.value = 0.55;
  bus.connect(speakers);

  let station = -1; // -1: off
  let step = 0;
  let nextTime = 0;
  let audible = false;
  const live = new Set();

  const voice = (nodes, source, at, length) => {
    live.add(source);
    source.onended = () => {
      for (const node of nodes) node.disconnect();
      live.delete(source);
    };
    source.start(at);
    source.stop(at + length);
  };

  const kick = (at, level = 0.9) => {
    const tone = context.createOscillator();
    tone.frequency.setValueAtTime(130, at);
    tone.frequency.exponentialRampToValueAtTime(42, at + 0.14);
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.32);
    tone.connect(gain);
    gain.connect(bus);
    voice([tone, gain], tone, at, 0.34);
  };
  const noiseHit = (at, type, frequency, level, length) => {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    const gain = context.createGain();
    gain.gain.setValueAtTime(level, at);
    gain.gain.exponentialRampToValueAtTime(0.001, at + length);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    live.add(source);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      live.delete(source);
    };
    source.start(at, Math.random() * 0.5);
    source.stop(at + length + 0.02);
  };
  const tone = (at, note, type, level, length, cutoff = 2000, attack = 0.01) => {
    const oscillator = context.createOscillator();
    oscillator.type = type;
    oscillator.frequency.value = frequencyOf(note);
    oscillator.detune.value = (Math.random() - 0.5) * 12;
    const filter = context.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, at);
    gain.gain.exponentialRampToValueAtTime(level, at + attack);
    gain.gain.exponentialRampToValueAtTime(0.0008, at + length);
    oscillator.connect(filter);
    filter.connect(gain);
    gain.connect(bus);
    voice([oscillator, filter, gain], oscillator, at, length + 0.05);
  };

  function schedule(at, s) {
    const sixteenth = 60 / s.bpm / 4;
    const inBar = step % 16;
    const bar = Math.floor(step / 16) % s.chords.length;
    const chord = s.chords[bar];
    // (Swing: the off 16ths come a little late.)
    const time = at + (inBar % 2 ? s.swing * sixteenth : 0);
    if (s.kick[inBar]) kick(time);
    if (s.snare[inBar]) {
      noiseHit(time, "bandpass", 1900, 0.45, s.id === "synthwave" ? 0.32 : 0.18);
      tone(time, 50, "triangle", 0.18, 0.1, 800);
    }
    if (s.hat[inBar]) noiseHit(time, "highpass", 7000, inBar % 4 === 2 ? 0.16 : 0.09, 0.05);
    if (s.bassSteps[inBar]) {
      const root = s.bass[bar];
      tone(time, root + (s.id === "synthwave" && inBar % 4 === 2 ? 12 : 0), s.id === "lofi" ? "sine" : "sawtooth", 0.32, sixteenth * 1.8, s.id === "lofi" ? 400 : 650);
    }
    // Chords: held through the bar (lo-fi, synthwave) or short stabs (techno).
    if (inBar === 0 && s.lead !== "stab") {
      for (const note of chord) tone(time, note, s.pad, 0.07, sixteenth * 15.5, s.padCutoff, 0.25);
    }
    if (s.lead === "stab" && (inBar === 3 || inBar === 10)) {
      for (const note of chord) tone(time, note, s.pad, 0.08, sixteenth * 1.2, s.padCutoff);
    }
    if (s.lead === "arp") tone(time, chord[inBar % chord.length] + 12, "sawtooth", 0.06, sixteenth * 0.9, 2400);
    if (s.crackle && Math.random() < 0.5) noiseHit(time + Math.random() * sixteenth, "highpass", 3000, 0.02, 0.01);
    step++;
    return sixteenth;
  }

  const timer = setInterval(() => {
    if (station < 0 || !audible || context.state !== "running") return;
    const s = STATIONS[station];
    if (nextTime < context.currentTime) nextTime = context.currentTime + 0.05;
    while (nextTime < context.currentTime + 0.25) nextTime += schedule(nextTime, s);
  }, 60);

  return {
    /** The station playing (its id), or null when off. */
    get station() {
      return station < 0 ? null : STATIONS[station].id;
    },
    /** T: the next station (off after the last). */
    next() {
      station = station + 1 >= STATIONS.length ? -1 : station + 1;
      step = 0;
      nextTime = 0;
      return this.station;
    },
    /** Heard only while driving (and not paused, muted). */
    setAudible(on) {
      audible = on && station >= 0;
      volume.gain.setTargetAtTime(audible ? 1 : 0, context.currentTime, 0.08);
    },
    close() {
      clearInterval(timer);
      for (const source of live) {
        try {
          source.stop();
        } catch {
          // already stopped
        }
      }
    },
  };
}
