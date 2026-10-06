import React from "react";

// The loading steps of a session, in order, with the progress at which each one starts (see
// startGameSession.js, which reports progress from 0 to 1 as it goes).
const STEPS = [
  ["Ville et montagne", 0],
  ["Véhicules et police", 0.42],
  ["Textures photoréalistes", 0.48],
  ["Reflets et éclairage", 0.76],
  ["Shaders", 0.8],
  ["Son du moteur", 0.88],
  ["Préchauffage du rendu", 0.9],
];

const TIPS = [
  "ESPACE en virage pour déclencher un drift. Gardez l'angle pour faire monter le combo.",
  "F pour sortir de la voiture ou y remonter.",
  "E à une station-service pour changer de voiture.",
  "Clic droit et glisser pour tourner la caméra, molette pour zoomer.",
  "La police bloque les carrefours devant vous : changez de rue avant d'y arriver.",
  "Hors de vue pendant cinq secondes, la police perd votre trace.",
  "La route de montagne mène au belvédère du sommet.",
];

/** Full-screen loading screen shown while a session loads; fades out when `done`. */
export function LoadingScreen({ progress = 0, label = "", done = false, error = null }) {
  const [tip, setTip] = React.useState(() => Math.floor(Math.random() * TIPS.length));
  const [gone, setGone] = React.useState(false);
  React.useEffect(() => {
    const timer = setInterval(() => setTip((value) => (value + 1) % TIPS.length), 4500);
    return () => clearInterval(timer);
  }, []);
  React.useEffect(() => {
    if (!done) return;
    const timer = setTimeout(() => setGone(true), 450);
    return () => clearTimeout(timer);
  }, [done]);
  if (gone) return null;
  const percent = Math.round(Math.min(1, Math.max(0, progress)) * 100);
  const current = STEPS.reduce((index, step, i) => (progress >= step[1] ? i : index), 0);
  return (
    <div
      role="status"
      aria-live="polite"
      className="loading-screen subtle-grid"
      style={{ opacity: done ? 0 : 1, pointerEvents: done ? "none" : "auto" }}
    >
      <div className="flex items-center gap-2">
        <span className="loading-screen__dot" />
        <span className="eyebrow !text-[#b3c578]">SESSION LIBRE / CHARGEMENT</span>
      </div>

      <div className="loading-screen__body">
        <h1 className="race-title loading-screen__title">
          {"PRÉPARATION DE "}
          <span className="text-[#c6dc77]">LA NUIT.</span>
        </h1>
        <div className="loading-screen__status">
          <p className="loading-screen__label">{error ? "Erreur de chargement" : label}</p>
          <p className="race-title loading-screen__percent">
            {percent}
            <small>%</small>
          </p>
        </div>
        <div className="loading-screen__track">
          <div className="loading-screen__bar" style={{ width: `${percent}%` }} />
        </div>
        <ol className="loading-screen__steps">
          {STEPS.map(([name], index) => {
            const finished = index < current || percent === 100;
            const active = index === current && percent < 100;
            return (
              <li
                key={name}
                className={`loading-screen__step${finished ? " loading-screen__step--done" : active ? " loading-screen__step--active" : ""}`}
              >
                {name}
              </li>
            );
          })}
        </ol>
        {error && (
          <p className="loading-screen__error">
            Le jeu n'a pas pu démarrer ({String(error.message || error)}). Rechargez la page pour réessayer.
          </p>
        )}
      </div>

      <div className="loading-screen__tip">
        <p className="eyebrow !text-[8px]">Astuce</p>
        <p>{TIPS[tip]}</p>
      </div>
    </div>
  );
}
