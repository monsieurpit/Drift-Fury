export function createSoundEffects(context, output, engineId) {
  const noiseBuffer = context.createBuffer(1, context.sampleRate, context.sampleRate);
  const noiseData = noiseBuffer.getChannelData(0);
  let brown = 0;
  for (let e = 0; e < noiseData.length; e++) {
    brown = 0.97 * brown + 0.03 * (Math.random() * 2 - 1);
    noiseData[e] = brown * 4;
  }
  const noise = context.createBufferSource();
  noise.buffer = noiseBuffer;
  noise.loop = true;
  const squealFilter = context.createBiquadFilter();
  squealFilter.type = "bandpass";
  squealFilter.frequency.value = 1900;
  squealFilter.Q.value = 5;
  const squealGain = context.createGain();
  squealGain.gain.value = 0;
  const turboFilter = context.createBiquadFilter();
  turboFilter.type = "bandpass";
  turboFilter.Q.value = engineId === "V8" ? 12 : 2;
  const turboGain = context.createGain();
  turboGain.gain.value = 0;
  noise.connect(squealFilter);
  squealFilter.connect(squealGain);
  squealGain.connect(output);
  noise.connect(turboFilter);
  turboFilter.connect(turboGain);
  turboGain.connect(output);
  noise.start();
  const activeBursts = new Set();
  let lastPedal = 0;
  let turboSpool = 0;
  let workletActive = false;
  function burst(duration, level, frequency, filterType = "lowpass", delay = 0) {
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = filterType;
    filter.frequency.value = frequency;
    filter.Q.value = 0.8;
    const gain = context.createGain();
    const startTime = context.currentTime + delay;
    gain.gain.setValueAtTime(level, startTime);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(output);
    source.onended = () => {
      source.disconnect();
      filter.disconnect();
      gain.disconnect();
      activeBursts.delete(source);
    };
    activeBursts.add(source);
    source.start(startTime, Math.random() * 0.1);
    source.stop(startTime + duration);
  }
  return {
    update(rpm, pedal, drifting, state = {}, muted = false) {
      const now = context.currentTime;
      const turbocharged = engineId === "V6" || engineId === "W16";
      const spoolTarget = turbocharged ? pedal * Math.max(0, Math.min(1, (rpm - 1700) / 3800)) : 0;
      turboSpool += (spoolTarget - turboSpool) * 0.08;
      if (!muted && turbocharged && !workletActive && lastPedal > 0.6 && pedal < 0.2 && turboSpool > 0.14) {
        burst(0.22, 0.13 * turboSpool, 2400, "highpass");
      }
      lastPedal = pedal;
      squealGain.gain.setTargetAtTime(drifting ? 0.15 : 0, now, 0.04);
      turboFilter.frequency.setTargetAtTime((engineId === "V8" ? 850 : 1800) + rpm * 0.36, now, 0.07);
      turboGain.gain.setTargetAtTime(
        (workletActive ? 0 : engineId === "V8" ? pedal * 0.032 : turboSpool * 0.065) *
          (state.fuel === 0 || state.onFoot ? 0 : 1),
        now,
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
      const profile = profiles[engineId] || profiles.V6;
      const now = context.currentTime;
      const starter = context.createOscillator();
      const starterFilter = context.createBiquadFilter();
      const starterGain = context.createGain();
      starter.type = profile.shape;
      starter.frequency.setValueAtTime(profile.starter, now);
      starter.frequency.linearRampToValueAtTime(profile.starter * 1.22, now + 0.52);
      starterFilter.type = "lowpass";
      starterFilter.frequency.value = profile.cutoff;
      starterGain.gain.setValueAtTime(0.001, now);
      starterGain.gain.linearRampToValueAtTime(profile.level * 0.72, now + 0.04);
      starterGain.gain.setValueAtTime(profile.level * 0.64, now + 0.48);
      starterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      starter.connect(starterFilter);
      starterFilter.connect(starterGain);
      starterGain.connect(output);
      starter.onended = () => {
        starter.disconnect();
        starterFilter.disconnect();
        starterGain.disconnect();
      };
      starter.start(now);
      starter.stop(now + 0.72);
      const crankingNoise = context.createBufferSource();
      const crankFilter = context.createBiquadFilter();
      const crankGain = context.createGain();
      crankingNoise.buffer = noiseBuffer;
      crankFilter.type = "bandpass";
      crankFilter.frequency.value = profile.cutoff * 1.35;
      crankFilter.Q.value = 1.2;
      crankGain.gain.setValueAtTime(0.001, now);
      crankGain.gain.linearRampToValueAtTime(profile.level * 0.5, now + 0.035);
      crankGain.gain.setValueAtTime(profile.level * 0.42, now + 0.47);
      crankGain.gain.exponentialRampToValueAtTime(0.001, now + 0.66);
      crankingNoise.connect(crankFilter);
      crankFilter.connect(crankGain);
      crankGain.connect(output);
      crankingNoise.onended = () => {
        crankingNoise.disconnect();
        crankFilter.disconnect();
        crankGain.disconnect();
      };
      crankingNoise.start(now, Math.random() * 0.1);
      crankingNoise.stop(now + 0.68);
      for (let turn = 0; turn < 3; turn++) {
        burst(
          0.15,
          profile.level * (0.48 - turn * 0.07),
          profile.cutoff * (0.42 + turn * 0.12),
          "lowpass",
          turn * 0.16,
        );
      }
      const ignition = context.createOscillator();
      const ignitionFilter = context.createBiquadFilter();
      const ignitionGain = context.createGain();
      ignition.type = profile.shape;
      ignition.frequency.setValueAtTime(profile.catch * 0.72, now + 0.48);
      ignition.frequency.linearRampToValueAtTime(profile.catch * 1.55, now + 0.72);
      ignition.frequency.exponentialRampToValueAtTime(profile.catch, now + 1.08);
      ignitionFilter.type = "lowpass";
      ignitionFilter.frequency.setValueAtTime(profile.cutoff * 0.72, now + 0.48);
      ignitionFilter.frequency.linearRampToValueAtTime(profile.cutoff * 1.8, now + 0.78);
      ignitionFilter.frequency.exponentialRampToValueAtTime(profile.cutoff, now + 1.08);
      ignitionGain.gain.setValueAtTime(0.001, now + 0.48);
      ignitionGain.gain.linearRampToValueAtTime(profile.level * 1.25, now + 0.66);
      ignitionGain.gain.setValueAtTime(profile.level * 0.8, now + 0.82);
      ignitionGain.gain.exponentialRampToValueAtTime(0.001, now + 1.16);
      ignition.connect(ignitionFilter);
      ignitionFilter.connect(ignitionGain);
      ignitionGain.connect(output);
      ignition.onended = () => {
        ignition.disconnect();
        ignitionFilter.disconnect();
        ignitionGain.disconnect();
      };
      ignition.start(now + 0.48);
      ignition.stop(now + 1.18);
    },
    setWorkletActive() {
      workletActive = true;
    },
    shift(upshift) {
      burst(upshift ? 0.065 : 0.045, upshift ? 0.13 : 0.055, upshift ? 420 : 1100);
    },
    crash(strength = 1) {
      burst(0.45, Math.min(0.65 * strength, 0.8), 650);
      burst(0.25, 0.55 * strength, 130);
    },
    close() {
      noise.stop();
      activeBursts.forEach((e) => e.stop());
      squealGain.disconnect();
      turboGain.disconnect();
    },
  };
}
