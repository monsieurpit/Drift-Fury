// Voices for the police job: the dispatcher on the radio, the people the player talks to and the player's
// own lines, spoken by the browser's speech synthesis (in the game's language) when it has it.
import { LANG } from "../../i18n.js";

export function createSpeech() {
  const synth = typeof window !== "undefined" ? window.speechSynthesis : null;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") return { say() {}, cancel() {} };
  let voices = [];
  const load = () => {
    voices = synth.getVoices().filter((voice) => voice.lang && voice.lang.toLowerCase().startsWith(LANG));
  };
  load();
  synth.addEventListener?.("voiceschanged", load);
  const pickVoice = (kind) => {
    if (!voices.length) return null;
    // (Voice names often say whether they are a man's or a woman's.)
    const female = voices.filter((voice) => /female|woman|zira|samantha|victoria|karen|amelie|anna|helena|elsa|paulina|monica|alice|luciana/i.test(voice.name));
    const male = voices.filter((voice) => !female.includes(voice));
    if (kind === "female" && female.length) return female[0];
    if ((kind === "male" || kind === "player") && male.length) return male[kind === "player" ? 0 : male.length - 1];
    if (kind === "radio") return (male.length ? male : voices)[0];
    return voices[0];
  };
  return {
    /** Says `text` as `kind` (radio, female, male, player), unless `muted`. */
    say(text, kind, muted) {
      if (muted || !text) return;
      // Never more than a line waiting: a stale line is dropped for the new one.
      if (synth.pending) synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = LANG;
      const voice = pickVoice(kind);
      if (voice) utterance.voice = voice;
      utterance.rate = kind === "radio" ? 1.12 : 1.02;
      utterance.pitch = kind === "radio" ? 0.75 : kind === "female" ? 1.2 : kind === "player" ? 0.95 : 0.8;
      utterance.volume = kind === "radio" ? 0.55 : 0.85;
      try {
        synth.speak(utterance);
      } catch {
        // (no speech)
      }
    },
    cancel() {
      try {
        synth.cancel();
      } catch {
        // (no speech)
      }
    },
  };
}
