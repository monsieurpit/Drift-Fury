import { createSampleEngine, loadEngineSamples } from "./samples.js";
import { createSynthEngine } from "./synthEngine.js";
import { createWorkletEngine } from "./workletEngine.js";
export function createAudio(e) {
  const t = window.AudioContext || window.webkitAudioContext;
  if (!t) {
    return {
      ready: Promise.resolve(),
      update() {},
      crash() {},
      startEngine() {},
      resume() {},
      close() {},
    };
  }
  const n = new t({
    latencyHint: "interactive",
  });
  const r = n.createGain();
  r.gain.value = 0;
  const i = n.createDynamicsCompressor();
  i.threshold.value = -14;
  i.knee.value = 12;
  i.ratio.value = 3;
  i.attack.value = 0.008;
  i.release.value = 0.16;
  const a = n.createBiquadFilter();
  a.type = "highpass";
  a.frequency.value = 28;
  r.connect(a);
  a.connect(i);
  i.connect(n.destination);
  const o = createSynthEngine(n, r, e.id);
  let s = null;
  let c = false;
  let l = 0;
  let u = true;
  return {
    ready: createWorkletEngine(n, r, e.id)
      .then((e) => {
        if (c) {
          e.close();
        } else {
          ((s = e), o.setSynthEngine());
        }
      })
      .catch(async () => {
        return createSampleEngine(n, r, await loadEngineSamples(n, e.id), e.id);
      }),
    resume() {
      if (!c && n.state === "suspended") {
        return n.resume();
      }
    },
    update(e, t, i, a, d = {}) {
      if (!c) {
        ((u = i),
          n.state === "suspended" && n.resume(),
          r.gain.setTargetAtTime(i || !s ? 0 : 1, n.currentTime, 0.035),
          s &&
            (s.update(e, t, d),
            o.update(e, t, a, d, i),
            d.shiftSerial > l &&
              (!i &&
                e > 2300 &&
                (o.shift(d.shiftDirection > 0),
                s.bang?.((d.shiftDirection > 0 ? 1 : 0.8) * Math.min(1.6, 0.6 + e / (d.redline || 7000)))),
              (l = d.shiftSerial))));
      }
    },
    startEngine() {
      if (!c && !u && n.state === "running") {
        o.startEngine();
      }
    },
    crash(e = 1) {
      if (!c && !u) {
        o.crash(e);
      }
    },
    close() {
      if (!c) {
        ((c = true),
          s?.close(),
          o.close(),
          r.disconnect(),
          a.disconnect(),
          i.disconnect(),
          n.state !== "closed" && n.close());
      }
    },
  };
}
