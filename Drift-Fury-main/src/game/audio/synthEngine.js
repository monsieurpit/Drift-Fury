export function createSynthEngine(e, t, n) {
  const r = e.createBuffer(1, e.sampleRate, e.sampleRate);
  const i = r.getChannelData(0);
  let a = 0;
  for (let e = 0; e < i.length; e++) {
    a = 0.97 * a + 0.03 * (Math.random() * 2 - 1);
    i[e] = a * 4;
  }
  const o = e.createBufferSource();
  o.buffer = r;
  o.loop = true;
  const s = e.createBiquadFilter();
  s.type = "bandpass";
  s.frequency.value = 1900;
  s.Q.value = 5;
  const c = e.createGain();
  c.gain.value = 0;
  const l = e.createBiquadFilter();
  l.type = "bandpass";
  l.Q.value = n === "V8" ? 12 : 2;
  const u = e.createGain();
  u.gain.value = 0;
  o.connect(s);
  s.connect(c);
  c.connect(t);
  o.connect(l);
  l.connect(u);
  u.connect(t);
  o.start();
  const d = new Set();
  let f = 0;
  let p = 0;
  let m = false;
  function h(n, i, a, o = "lowpass", delay = 0) {
    const s = e.createBufferSource();
    s.buffer = r;
    const c = e.createBiquadFilter();
    c.type = o;
    c.frequency.value = a;
    c.Q.value = 0.8;
    const l = e.createGain();
    const u = e.currentTime + delay;
    l.gain.setValueAtTime(i, u);
    l.gain.exponentialRampToValueAtTime(0.001, u + n);
    s.connect(c);
    c.connect(l);
    l.connect(t);
    s.onended = () => {
      s.disconnect();
      c.disconnect();
      l.disconnect();
      d.delete(s);
    };
    d.add(s);
    s.start(u, Math.random() * 0.1);
    s.stop(u + n);
  }
  return {
    update(t, r, i, a = {}, o = false) {
      const s = e.currentTime;
      const d = n === "V6" || n === "W16";
      const g = d ? r * Math.max(0, Math.min(1, (t - 1700) / 3800)) : 0;
      p += (g - p) * 0.08;
      if (!o && d && !m && f > 0.6 && r < 0.2 && p > 0.14) {
        h(0.22, 0.13 * p, 2400, "highpass");
      }
      f = r;
      c.gain.setTargetAtTime(i ? 0.15 : 0, s, 0.04);
      l.frequency.setTargetAtTime(
        (n === "V8" ? 850 : 1800) + t * 0.36,
        s,
        0.07,
      );
      u.gain.setTargetAtTime(
        (m ? 0 : n === "V8" ? r * 0.032 : p * 0.065) *
          (a.fuel === 0 || a.onFoot ? 0 : 1),
        s,
        0.06,
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
      const profile = profiles[n] || profiles.V6;
      const now = e.currentTime;
      const starter = e.createOscillator();
      const starterFilter = e.createBiquadFilter();
      const starterGain = e.createGain();
      starter.type = profile.shape;
      starter.frequency.setValueAtTime(profile.starter, now);
      starter.frequency.linearRampToValueAtTime(
        profile.starter * 1.22,
        now + 0.52,
      );
      starterFilter.type = "lowpass";
      starterFilter.frequency.value = profile.cutoff;
      starterGain.gain.setValueAtTime(0.001, now);
      starterGain.gain.linearRampToValueAtTime(
        profile.level * 0.72,
        now + 0.04,
      );
      starterGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      starterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      starter.connect(starterFilter);
      starterFilter.connect(starterGain);
      starterGain.connect(t);
      starter.onended = () => {
        starter.disconnect();
        starterFilter.disconnect();
        starterGain.disconnect();
      };
      starter.start(now);
      starter.stop(now + 0.72);
      const crankingNoise = e.createBufferSource();
      const crankFilter = e.createBiquadFilter();
      const crankGain = e.createGain();
      crankingNoise.buffer = r;
      crankFilter.type = "bandpass";
      crankFilter.frequency.value = profile.cutoff * 1.35;
      crankFilter.Q.value = 1.2;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.5, now + 0.035);
      crankGain.gain.setValueAtTime(profile.level * 0.42, now + 0.47);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.66);
      crankingNoise.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(t);
      crankingNoise.onended = () => {
        crankingNoise.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crankingNoise.start(now, Math.random() * 0.1);
      crankingNoise.stop(now + 0.68);
      for (let turn = 0; turn < 3; turn++) {
        h(
          0.15,
          profile.level * (0.48 - turn * 0.07),
          profile.cutoff * (0.42 + turn * 0.12),
          "lowpass",
          turn * 0.16,
        );
      }
      const ignition = e.createOscillator();
      const ignitionFilter = e.createBiquadFilter();
      const ignitionGain = e.createGain();
      ignition.type = profile.shape;
      ignition.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      ignition.frequency.linearRampToValueAtTime(
        profile.catch * 1.55,
        now + 0.72,
      );
      ignition.frequency.exponentialRampToValueAtTime(
        profile.catch,
        now + 1.08,
      );
      ignitionFilter.type = "lowpass";
      ignitionFilter.frequency.setValueAtTime(
        profile.cutoff * 0.72,
        now + 0.48,
      );
      ignitionFilter.frequency.linearRampToValueAtTime(
        profile.cutoff * 1.8,
        now + 0.78,
      );
      ignitionFilter.frequency.exponentialRampToValueAtTime(
        profile.cutoff,
        now + 1.08,
      );
      ignitionGain.gain.setValueAtTime(0.001, now + 0.48);
      ignitionGain.gain.linearRampToValueAtTime(
        profile.level * 1.25,
        now + 0.66,
      );
      ignitionGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      ignitionGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      ignition.connect(ignitionFilter);
      ignitionFilter.connect(ignitionGain);
      ignitionGain.connect(t);
      ignition.onended = () => {
        ignition.disconnect();
        ignitionFilter.disconnect();
        ignitionGain.disconnect();
      };
      ignition.start(now + 0.48);
      ignition.stop(now + 1.18);
    },
    setSynthEngine() {
      m = true;
    },
    shift(e) {
      h(e ? 0.065 : 0.045, e ? 0.13 : 0.055, e ? 420 : 1100);
    },
    crash(e = 1) {
      h(0.45, Math.min(0.65 * e, 0.8), 650);
      h(0.25, 0.55 * e, 130);
    },
    close() {
      o.stop();
      d.forEach((e) => {
        return e.stop();
      });
      c.disconnect();
      u.disconnect();
    },
  };
}
