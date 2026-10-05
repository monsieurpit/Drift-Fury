const RALLY_SAMPLE = "/assets/rally-CluzLmHH.wav";
const RALLY_IDLE_SAMPLE = "/assets/rally-idle-DrsA-2QN.flac";
const SPORT_V8_SAMPLE = "/assets/sport-v8-crmbDbLb.flac";
const RACE_ENGINE_SAMPLE = "/assets/race-engine-CId9iOvn.flac";
function prepareEngineSample(context, buffer, range, favorLoud = false) {
  const sampleRate = buffer.sampleRate;
  const mono = new Float32Array(buffer.length);
  for (let e = 0; e < buffer.numberOfChannels; e++) {
    const n = buffer.getChannelData(e);
    for (let e = 0; e < mono.length; e++) {
      mono[e] += n[e] / buffer.numberOfChannels;
    }
  }
  const rangeStart = Math.floor(range[0] * sampleRate);
  const rangeEnd = Math.min(mono.length, Math.floor(range[1] * sampleRate));
  const loopLength = Math.min(Math.floor(sampleRate * 1.2), rangeEnd - rangeStart);
  const searchStep = Math.floor(sampleRate * 0.18);
  let bestStart = rangeStart;
  let bestScore = -Infinity;
  for (let e = rangeStart; e + loopLength <= rangeEnd; e += searchStep) {
    const segmentLevels = Array.from(
      {
        length: 6,
      },
      (t, n) => {
        let r = 0;
        let i = 0;
        for (let t = e + Math.floor((loopLength * n) / 6); t < e + (loopLength * (n + 1)) / 6; t += 8) {
          r += mono[t] ** 2;
          i++;
        }
        return Math.sqrt(r / Math.max(1, i));
      },
    );
    const meanLevel = segmentLevels.reduce((e, t) => e + t, 0) / 6;
    if (meanLevel < 0.003) {
      continue;
    }
    const unevenness = segmentLevels.reduce((e, t) => e + (t - meanLevel) ** 2, 0) / 6 / meanLevel ** 2;
    const score = (favorLoud ? meanLevel : Math.sqrt(meanLevel)) / (1 + unevenness * 12);
    if (score > bestScore) {
      bestScore = score;
      bestStart = e;
    }
  }
  const crossfade = Math.min(Math.floor(sampleRate * 0.06), Math.floor(loopLength / 5));
  const length = loopLength - crossfade;
  const loop = context.createBuffer(1, length, sampleRate);
  const loopData = loop.getChannelData(0);
  let energy = 0;
  let peak = 0;
  for (let e = 0; e < length; e++) {
    const fade = e < crossfade ? Math.sin(((e / crossfade) * Math.PI) / 2) ** 2 : 1;
    loopData[e] =
      mono[bestStart + e] * fade + (e < crossfade ? mono[bestStart + length + e] * (1 - fade) : 0);
    energy += loopData[e] ** 2;
    peak = Math.max(peak, Math.abs(loopData[e]));
  }
  const normalize = Math.min(0.38 / Math.max(0.001, Math.sqrt(energy / length)), 1.3 / Math.max(0.001, peak));
  for (let e = 0; e < length; e++) {
    loopData[e] *= normalize;
  }
  return loop;
}
const ENGINE_SAMPLE_LAYERS = {
  V6: [
    [RALLY_IDLE_SAMPLE, [0.2, 4.8]],
    [RALLY_IDLE_SAMPLE, [2, 4.5]],
    [SPORT_V8_SAMPLE, [6, 10]],
    [SPORT_V8_SAMPLE, [8, 12]],
    [SPORT_V8_SAMPLE, [10, 14]],
  ],
  V8: [
    [SPORT_V8_SAMPLE, [0.5, 4]],
    [SPORT_V8_SAMPLE, [3, 7]],
    [SPORT_V8_SAMPLE, [6, 10]],
    [SPORT_V8_SAMPLE, [8, 12]],
    [SPORT_V8_SAMPLE, [10, 14]],
  ],
  V12: [
    [RALLY_SAMPLE, [0, 5]],
    [RACE_ENGINE_SAMPLE, [3, 12]],
    [RACE_ENGINE_SAMPLE, [10, 23]],
    [RACE_ENGINE_SAMPLE, [18, 30]],
    [RACE_ENGINE_SAMPLE, [23, 38]],
  ],
  W16: [
    [RALLY_IDLE_SAMPLE, [0.2, 4.8]],
    [SPORT_V8_SAMPLE, [4, 8]],
    [SPORT_V8_SAMPLE, [8, 12]],
    [RACE_ENGINE_SAMPLE, [18, 30]],
    [RACE_ENGINE_SAMPLE, [23, 38]],
  ],
};
const sampleCache = new Map();
export async function loadEngineSamples(context, engineId) {
  if (sampleCache.has(engineId)) {
    return sampleCache.get(engineId);
  }
  const layers = ENGINE_SAMPLE_LAYERS[engineId] || ENGINE_SAMPLE_LAYERS.V6;
  const decoded = new Map(
    await Promise.all(
      [...new Set(layers.map(([e]) => e))].map(async (url) => {
        const response = await fetch(url);
        if (!response.ok) {
          throw Error("Impossible de charger le son moteur.");
        }
        return [url, await context.decodeAudioData(await response.arrayBuffer())];
      }),
    ),
  );
  const prepared = layers.map(([t, n], i) => prepareEngineSample(context, decoded.get(t), n, i >= 3));
  sampleCache.set(engineId, prepared);
  return prepared;
}
const ENGINE_TONE = {
  V6: {
    pitch: [1, 1, 1.08, 1.14, 1.18],
    bass: 2,
    brightness: 2,
    cutoff: 3100,
  },
  V8: {
    pitch: [0.92, 0.94, 0.82, 0.84, 0.87],
    bass: 10,
    brightness: -6,
    cutoff: 1400,
  },
  V12: {
    pitch: [1, 1, 1.4, 1.55, 1.65],
    bass: 0,
    brightness: 5,
    cutoff: 5400,
  },
  W16: {
    pitch: [1, 1, 0.72, 0.76, 0.8],
    bass: 7,
    brightness: 0,
    cutoff: 2600,
  },
};
const SAMPLE_RPM_POINTS = [950, 1700, 2800, 4400, 6200];
export function createSampleEngine(context, output, buffers, engineId) {
  const tone = ENGINE_TONE[engineId] || ENGINE_TONE.V6;
  const bassShelf = context.createBiquadFilter();
  bassShelf.type = "lowshelf";
  bassShelf.frequency.value = 140;
  bassShelf.gain.value = tone.bass;
  const trebleShelf = context.createBiquadFilter();
  trebleShelf.type = "highshelf";
  trebleShelf.frequency.value = 2200;
  trebleShelf.gain.value = tone.brightness;
  const lowpass = context.createBiquadFilter();
  lowpass.type = "lowpass";
  lowpass.Q.value = 0.6;
  bassShelf.connect(trebleShelf);
  trebleShelf.connect(lowpass);
  lowpass.connect(output);
  const voices = buffers.map((buffer, index) => {
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.loop = true;
    const gain = context.createGain();
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(bassShelf);
    source.start(0, (index * 0.071) % buffer.duration);
    return {
      source,
      gain,
      baseRpm: SAMPLE_RPM_POINTS[index] || 4000,
      pitch: tone.pitch[index] || 1,
    };
  });
  return {
    update(rpm, load, state = {}) {
      const now = context.currentTime;
      voices.length;
      const weights = voices.map((voice, index) => {
        const baseRpm = SAMPLE_RPM_POINTS[index] || 4000;
        const distance = Math.abs(rpm - baseRpm);
        return Math.max(0, 1 - distance / (index === 0 ? 1200 : 1100));
      });
      const weightSum = weights.reduce((e, t) => e + t, 0) || 1;
      const level = 0.6 + load * 0.4 + (state.shifting && state.shiftDirection < 0 ? 0.2 : 0);
      const shiftCut = state.shifting ? 0.4 : 1;
      const limiter =
        rpm > (state.redline || 8000) * 0.985 ? 0.65 + 0.35 * Math.max(0, Math.sin(now * 90)) : 1;
      voices.forEach((voice, index) => {
        voice.source.playbackRate.setTargetAtTime(
          Math.max(0.75, Math.min(1.5, (rpm / voice.baseRpm) * voice.pitch)),
          now,
          0.04,
        );
        voice.gain.gain.setTargetAtTime(
          (weights[index] / weightSum) * level * shiftCut * limiter * (state.fuel === 0 ? 0 : 1),
          now,
          0.035,
        );
      });
      lowpass.frequency.setTargetAtTime(1000 + tone.cutoff * (0.25 + load * 0.75) + rpm * 0.22, now, 0.045);
    },
    startEngine() {
      const profiles = {
        V8: {
          starter: 48,
          catch: 58,
          cutoff: 780,
          level: 0.09,
          shape: "sawtooth",
        },
        V6: {
          starter: 55,
          catch: 43,
          cutoff: 1500,
          level: 0.075,
          shape: "triangle",
        },
        V12: {
          starter: 62,
          catch: 86,
          cutoff: 2600,
          level: 0.065,
          shape: "sine",
        },
        W16: {
          starter: 58,
          catch: 72,
          cutoff: 2100,
          level: 0.08,
          shape: "sawtooth",
        },
      };
      const profile = profiles[engineId] || profiles.V6;
      const now = context.currentTime;
      const crank = context.createOscillator();
      const crankFilter = context.createBiquadFilter();
      const crankGain = context.createGain();
      crank.type = profile.shape;
      crank.frequency.setValueAtTime(profile.starter, now);
      crank.frequency.linearRampToValueAtTime(profile.starter * 1.22, now + 0.52);
      crankFilter.type = "lowpass";
      crankFilter.frequency.value = profile.cutoff;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.72, now + 0.04);
      crankGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      crank.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(output);
      crank.onended = () => {
        crank.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crank.start(now);
      crank.stop(now + 0.72);
      const catchEngine = context.createOscillator();
      const catchFilter = context.createBiquadFilter();
      const catchGain = context.createGain();
      catchEngine.type = profile.shape;
      catchEngine.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      catchEngine.frequency.linearRampToValueAtTime(profile.catch * 1.55, now + 0.72);
      catchEngine.frequency.exponentialRampToValueAtTime(profile.catch, now + 1.08);
      catchFilter.type = "lowpass";
      catchFilter.frequency.setValueAtTime(profile.cutoff * 0.72, now + 0.48);
      catchFilter.frequency.linearRampToValueAtTime(profile.cutoff * 1.8, now + 0.78);
      catchFilter.frequency.exponentialRampToValueAtTime(profile.cutoff, now + 1.08);
      catchGain.gain.setValueAtTime(0.001, now + 0.48);
      catchGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + 0.66);
      catchGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      catchGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      catchEngine.connect(catchFilter);
      catchFilter.connect(catchGain);
      catchGain.connect(output);
      catchEngine.onended = () => {
        catchEngine.disconnect();
        catchFilter.disconnect();
        catchGain.disconnect();
      };
      catchEngine.start(now + 0.48);
      catchEngine.stop(now + 1.18);
    },
    close() {
      voices.forEach(({ source }) => source.stop());
      bassShelf.disconnect();
      trebleShelf.disconnect();
      lowpass.disconnect();
    },
  };
}
