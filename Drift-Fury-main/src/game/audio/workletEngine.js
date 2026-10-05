// The engine synthesizer runs on the audio thread; its source is loaded as text and registered as a worklet.
import ENGINE_WORKLET_SOURCE from "./engineSynth.worklet.js?raw";
import { createImpactBuffer } from "./impactBuffer.js";

export async function createWorkletEngine(e, t, n) {
  if (!e.audioWorklet || typeof AudioWorkletNode === "undefined") {
    throw Error("AudioWorklet indisponible");
  }
  const r = URL.createObjectURL(
    new Blob([ENGINE_WORKLET_SOURCE], {
      type: "text/javascript",
    }),
  );
  try {
    await e.audioWorklet.addModule(r);
  } finally {
    URL.revokeObjectURL(r);
  }
  const i = new AudioWorkletNode(e, "engine-synth", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      id: n,
    },
  });
  i.onprocessorerror = () => {
    return console.error("Moteur audio : erreur du processeur");
  };
  const a = e.createGain();
  const o = e.createGain();
  const s = e.createConvolver();
  s.buffer = createImpactBuffer(e);
  o.gain.value = 0.14;
  i.connect(a);
  a.connect(t);
  i.connect(s);
  s.connect(o);
  o.connect(t);
  return {
    update(e, t, n = {}) {
      i.port.postMessage({
        rpm: e,
        load: t,
        cut: n.shifting ? 0.4 : 1,
        run: n.fuel === 0 || n.onFoot ? 0 : 1,
      });
    },
    bang(e = 1) {
      i.port.postMessage({
        bang: e,
      });
    },
    close() {
      i.port.postMessage({
        stop: true,
      });
      [i, a, o, s].forEach((e) => {
        return e.disconnect();
      });
    },
  };
}
