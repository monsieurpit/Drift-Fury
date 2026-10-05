const RALLY_SAMPLE = "/assets/rally-CluzLmHH.wav";
const RALLY_IDLE_SAMPLE = "/assets/rally-idle-DrsA-2QN.flac";
const SPORT_V8_SAMPLE = "/assets/sport-v8-crmbDbLb.flac";
const RACE_ENGINE_SAMPLE = "/assets/race-engine-CId9iOvn.flac";
function prepareEngineSample(e, t, n, r = false) {
  const i = t.sampleRate;
  const a = new Float32Array(t.length);
  for (let e = 0; e < t.numberOfChannels; e++) {
    const n = t.getChannelData(e);
    for (let e = 0; e < a.length; e++) {
      a[e] += n[e] / t.numberOfChannels;
    }
  }
  const o = Math.floor(n[0] * i);
  const s = Math.min(a.length, Math.floor(n[1] * i));
  const c = Math.min(Math.floor(i * 1.2), s - o);
  const l = Math.floor(i * 0.18);
  let u = o;
  let d = -Infinity;
  for (let e = o; e + c <= s; e += l) {
    const t = Array.from(
      {
        length: 6,
      },
      (t, n) => {
        let r = 0;
        let i = 0;
        for (
          let t = e + Math.floor((c * n) / 6);
          t < e + (c * (n + 1)) / 6;
          t += 8
        ) {
          r += a[t] ** 2;
          i++;
        }
        return Math.sqrt(r / Math.max(1, i));
      },
    );
    const n =
      t.reduce((e, t) => {
        return e + t;
      }, 0) / 6;
    if (n < 0.003) {
      continue;
    }
    const i =
      t.reduce((e, t) => {
        return e + (t - n) ** 2;
      }, 0) /
      6 /
      n ** 2;
    const o = (r ? n : Math.sqrt(n)) / (1 + i * 12);
    if (o > d) {
      ((d = o), (u = e));
    }
  }
  const f = Math.min(Math.floor(i * 0.06), Math.floor(c / 5));
  const p = c - f;
  const m = e.createBuffer(1, p, i);
  const h = m.getChannelData(0);
  let g = 0;
  let _ = 0;
  for (let e = 0; e < p; e++) {
    const t = e < f ? Math.sin(((e / f) * Math.PI) / 2) ** 2 : 1;
    h[e] = a[u + e] * t + (e < f ? a[u + p + e] * (1 - t) : 0);
    g += h[e] ** 2;
    _ = Math.max(_, Math.abs(h[e]));
  }
  const v = Math.min(
    0.38 / Math.max(0.001, Math.sqrt(g / p)),
    1.3 / Math.max(0.001, _),
  );
  for (let e = 0; e < p; e++) {
    h[e] *= v;
  }
  return m;
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
export async function loadEngineSamples(e, t) {
  if (sampleCache.has(t)) {
    return sampleCache.get(t);
  }
  const n = ENGINE_SAMPLE_LAYERS[t] || ENGINE_SAMPLE_LAYERS.V6;
  const r = new Map(
    await Promise.all(
      [
        ...new Set(
          n.map(([e]) => {
            return e;
          }),
        ),
      ].map(async (t) => {
        const n = await fetch(t);
        if (!n.ok) {
          throw Error("Impossible de charger le son moteur.");
        }
        return [t, await e.decodeAudioData(await n.arrayBuffer())];
      }),
    ),
  );
  const i = n.map(([t, n], i) => {
    return prepareEngineSample(e, r.get(t), n, i >= 3);
  });
  sampleCache.set(t, i);
  return i;
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
export function createSampleEngine(e, t, n, r) {
  const i = ENGINE_TONE[r] || ENGINE_TONE.V6;
  const a = e.createBiquadFilter();
  a.type = "lowshelf";
  a.frequency.value = 140;
  a.gain.value = i.bass;
  const o = e.createBiquadFilter();
  o.type = "highshelf";
  o.frequency.value = 2200;
  o.gain.value = i.brightness;
  const s = e.createBiquadFilter();
  s.type = "lowpass";
  s.Q.value = 0.6;
  a.connect(o);
  o.connect(s);
  s.connect(t);
  const c = n.map((t, n) => {
    const r = e.createBufferSource();
    r.buffer = t;
    r.loop = true;
    const o = e.createGain();
    o.gain.value = 0;
    r.connect(o);
    o.connect(a);
    r.start(0, (n * 0.071) % t.duration);
    return {
      source: r,
      gain: o,
      baseRpm: SAMPLE_RPM_POINTS[n] || 4000,
      pitch: i.pitch[n] || 1,
    };
  });
  return {
    update(t, n, r = {}) {
      const a = e.currentTime;
      c.length;
      const o = c.map((e, n) => {
        const r = SAMPLE_RPM_POINTS[n] || 4000;
        const i = Math.abs(t - r);
        return Math.max(0, 1 - i / (n === 0 ? 1200 : 1100));
      });
      const l =
        o.reduce((e, t) => {
          return e + t;
        }, 0) || 1;
      const u = 0.6 + n * 0.4 + (r.shifting && r.shiftDirection < 0 ? 0.2 : 0);
      const d = r.shifting ? 0.4 : 1;
      const f =
        t > (r.redline || 8000) * 0.985
          ? 0.65 + 0.35 * Math.max(0, Math.sin(a * 90))
          : 1;
      c.forEach((e, n) => {
        e.source.playbackRate.setTargetAtTime(
          Math.max(0.75, Math.min(1.5, (t / e.baseRpm) * e.pitch)),
          a,
          0.04,
        );
        e.gain.gain.setTargetAtTime(
          (o[n] / l) * u * d * f * (r.fuel === 0 ? 0 : 1),
          a,
          0.035,
        );
      });
      s.frequency.setTargetAtTime(
        1000 + i.cutoff * (0.25 + n * 0.75) + t * 0.22,
        a,
        0.045,
      );
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
      const profile = profiles[r] || profiles.V6;
      const now = e.currentTime;
      const crank = e.createOscillator();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crank.type = profile.shape;
      crank.frequency.setValueAtTime(profile.starter, now);
      crank.frequency.linearRampToValueAtTime(
        profile.starter * 1.22,
        now + 0.52,
      );
      crankFilter.type = "lowpass";
      crankFilter.frequency.value = profile.cutoff;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.72, now + 0.04);
      crankGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      crank.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crank.onended = () => {
        crank.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crank.start(now);
      crank.stop(now + 0.72);
      const catchEngine = e.createOscillator();
      const catchFilter = e.createBiquadFilter();
      const catchGain = e.createGain();
      catchEngine.type = profile.shape;
      catchEngine.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      catchEngine.frequency.linearRampToValueAtTime(
        profile.catch * 1.55,
        now + 0.72,
      );
      catchEngine.frequency.exponentialRampToValueAtTime(
        profile.catch,
        now + 1.08,
      );
      catchFilter.type = "lowpass";
      catchFilter.frequency.setValueAtTime(profile.cutoff * 0.72, now + 0.48);
      catchFilter.frequency.linearRampToValueAtTime(
        profile.cutoff * 1.8,
        now + 0.78,
      );
      catchFilter.frequency.exponentialRampToValueAtTime(
        profile.cutoff,
        now + 1.08,
      );
      catchGain.gain.setValueAtTime(0.001, now + 0.48);
      catchGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + 0.66);
      catchGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      catchGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      catchEngine.connect(catchFilter);
      catchFilter.connect(catchGain);
      catchGain.connect(t);
      catchEngine.onended = () => {
        catchEngine.disconnect();
        catchFilter.disconnect();
        catchGain.disconnect();
      };
      catchEngine.start(now + 0.48);
      catchEngine.stop(now + 1.18);
    },
    close() {
      c.forEach(({ source: e }) => {
        return e.stop();
      });
      a.disconnect();
      o.disconnect();
      s.disconnect();
    },
  };
}
