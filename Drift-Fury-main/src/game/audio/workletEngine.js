// The engine synthesizer runs on the audio thread; its source is loaded as text and registered as a worklet.
import ENGINE_WORKLET_SOURCE from "./engineSynth.worklet.js?raw";
import { createImpulseResponse } from "./impulseResponse.js";
export async function createWorkletEngine(context, output, engineId) {
  if (!context.audioWorklet || typeof AudioWorkletNode === "undefined") {
    throw Error("AudioWorklet indisponible");
  }
  const moduleUrl = URL.createObjectURL(
    new Blob([ENGINE_WORKLET_SOURCE], {
      type: "text/javascript",
    }),
  );
  try {
    await context.audioWorklet.addModule(moduleUrl);
  } finally {
    URL.revokeObjectURL(moduleUrl);
  }
  const node = new AudioWorkletNode(context, "engine-synth", {
    numberOfInputs: 0,
    numberOfOutputs: 1,
    outputChannelCount: [1],
    processorOptions: {
      id: engineId,
    },
  });
  node.onprocessorerror = () => {
    return console.error("Moteur audio : erreur du processeur");
  };
  const dryGain = context.createGain();
  const bodyGain = context.createGain();
  const body = context.createConvolver();
  body.buffer = createImpulseResponse(context);
  bodyGain.gain.value = 0.14;
  node.connect(dryGain);
  dryGain.connect(output);
  node.connect(body);
  body.connect(bodyGain);
  bodyGain.connect(output);
  return {
    update(rpm, load, state = {}) {
      node.port.postMessage({
        rpm,
        load,
        cut: state.shifting ? 0.4 : 1,
        run: state.fuel === 0 || state.onFoot ? 0 : 1,
      });
    },
    bang(strength = 1) {
      node.port.postMessage({
        bang: strength,
      });
    },
    close() {
      node.port.postMessage({
        stop: true,
      });
      [node, dryGain, bodyGain, body].forEach((e) => {
        return e.disconnect();
      });
    },
  };
}
