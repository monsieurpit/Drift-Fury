import React from "react";
import { createAudio } from "../game/audio/createAudio.js";
import { CARS } from "../game/data/cars.js";
import { ENGINES } from "../game/data/engines.js";
import { INITIAL_HUD } from "../game/data/hud.js";
import { loadProgress, saveProgress } from "../game/data/progress.js";
import { GameView } from "../game/ui/GameView.jsx";
import { GarageScreen } from "../game/ui/GarageScreen.jsx";
import { Hud } from "../game/ui/Hud.jsx";
import { LoadingScreen } from "../game/ui/LoadingScreen.jsx";
import { PauseMenu } from "../game/ui/PauseMenu.jsx";
import { PickerModal } from "../game/ui/PickerModal.jsx";
import { ResultScreen } from "../game/ui/ResultScreen.jsx";
import { TouchControls } from "../game/ui/TouchControls.jsx";
const QUALITY_NAMES = { low: "BASSE", medium: "MOYENNE", high: "HAUTE", ultra: "ULTRA" };

/** Shown when the device ran out of graphics memory (or failed a shader) at the chosen quality. */
function GraphicsFailure({ failure, onRestart }) {
  const from = QUALITY_NAMES[failure.from] || failure.from;
  const to = QUALITY_NAMES[failure.to] || failure.to;
  return (
    <div className="loading-screen subtle-grid" role="alert">
      <div className="flex items-center gap-2">
        <span className="loading-screen__dot" />
        <span className="eyebrow !text-[#b3c578]">GRAPHISMES</span>
      </div>
      <div className="loading-screen__body">
        <h1 className="race-title loading-screen__title">
          {"TROP LOURD POUR "}
          <span className="text-[#c6dc77]">CET APPAREIL.</span>
        </h1>
        <p className="mt-6 text-[12px] leading-6 text-[#c9cdc8]">
          {failure.reason === "memory"
            ? `Le mode ${from} a dépassé la mémoire graphique de cet appareil.`
            : `Le mode ${from} n'est pas pris en charge par cet appareil.`}
          {from === to ? " Le jeu redémarre." : ` Le jeu repasse en mode ${to} et redémarre.`}
        </p>
        <button onClick={onRestart} className="lime-button mt-6 px-5 py-4 text-[13px]">
          REDÉMARRER MAINTENANT
        </button>
      </div>
      <div />
    </div>
  );
}

export function GamePage() {
  const [progress, setProgress] = React.useState(loadProgress);
  const [screen, setScreen] = React.useState("lobby");
  const [picker, setPicker] = React.useState(null);
  const [hud, setHud] = React.useState(INITIAL_HUD);
  const [result, setResult] = React.useState(null);
  const [paused, setPaused] = React.useState(false);
  const [muted, setMuted] = React.useState(false);
  const [noPolice, setNoPolice] = React.useState(false);
  // Session loading: { progress, label, done, error } while the loading screen is up.
  const [loading, setLoading] = React.useState(null);
  const loadingRef = React.useRef(false);
  // Set when the device could not cope with the graphics quality (see startGameSession.js).
  const [graphicsFailure, setGraphicsFailure] = React.useState(null);
  React.useEffect(() => {
    if (!graphicsFailure) return;
    const timer = setTimeout(() => window.location.reload(), 5000);
    return () => clearTimeout(timer);
  }, [graphicsFailure]);
  const controls = React.useRef({
    keys: {},
    paused: false,
    muted: false,
    finished: false,
  });
  const car = CARS.find((t) => t.id === progress.car) || CARS[0];
  const engine = ENGINES.find((t) => t.id === progress.engine) || ENGINES[0];
  React.useEffect(() => saveProgress(progress), [progress]);
  React.useEffect(() => {
    controls.current.paused = !!(paused || picker || result);
    if (controls.current.paused) {
      controls.current.keys = {};
    }
  }, [paused, picker, result]);
  React.useEffect(() => {
    controls.current.muted = muted;
  }, [muted]);
  const startSession = () => {
    const audio = createAudio(engine);
    audio.resume();
    controls.current = {
      keys: {},
      paused: false,
      muted,
      finished: false,
      audio,
    };
    setHud(INITIAL_HUD);
    loadingRef.current = true;
    setLoading({ progress: 0, label: "Démarrage", done: false, error: null });
    setResult(null);
    setPaused(false);
    setScreen("race");
  };
  const finishSession = (summary) => {
    if (result) {
      return;
    }
    controls.current.paused = true;
    controls.current.finished = true;
    setPaused(false);
    setPicker(null);
    const earned = summary.credits ?? Math.floor(summary.score / 12 + (summary.elapsed || 0) * 2);
    setProgress((t) => ({
      ...t,
      credits: t.credits + earned,
      best: Math.max(t.best, summary.score),
    }));
    setResult({
      ...summary,
      credits: earned,
    });
  };
  const returnToLobby = () => {
    loadingRef.current = false;
    setLoading(null);
    setScreen("lobby");
    setResult(null);
    setPaused(false);
    setPicker(null);
  };
  const togglePause = () => {
    if (!result && !loadingRef.current) {
      if (picker) {
        setPicker(null);
        return;
      }
      setPaused((e) => !e);
    }
  };
  return (
    <div className="nightshift">
      {screen === "lobby" ? (
        <GarageScreen
          progress={progress}
          car={car}
          engine={engine}
          onGarage={setPicker}
          onStart={startSession}
          muted={muted}
          onMute={() => setMuted((e) => !e)}
          noPolice={noPolice}
          onToggleNoPolice={() => setNoPolice((e) => !e)}
        />
      ) : (
        <div className="relative h-[100dvh] w-full overflow-hidden">
          <GameView
            car={car}
            engine={engine}
            controls={controls}
            onHud={setHud}
            onFinish={finishSession}
            onStation={() => setPicker("cars")}
            onPause={togglePause}
            onLoading={({ progress, label }) =>
              setLoading((value) => (value ? { ...value, progress, label } : value))
            }
            onReady={() => {
              loadingRef.current = false;
              setLoading((value) => (value ? { ...value, progress: 1, done: true } : value));
            }}
            onGraphicsFailure={(failure) => {
              controls.current.paused = true;
              setGraphicsFailure(failure);
            }}
            onLoadError={(error) => setLoading((value) => (value ? { ...value, error } : value))}
            noPolice={noPolice}
          />
          {(!loading || loading.done) && (
            <Hud
              hud={hud}
              engine={engine}
              muted={muted}
              onMute={() => setMuted((e) => !e)}
              onPause={togglePause}
              onStation={() => setPicker("cars")}
            />
          )}
          {!paused && !result && !picker && !(loading && !loading.done) && (
            <TouchControls controls={controls} />
          )}
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[8px] tracking-widest text-white/50 xl:block">
            {
              "ZQSD / WASD / FLÈCHES • CONDUIRE \xA0 ESPACE • DRIFT \xA0 E • STATION \xA0 F • PIED/ENTRER \xA0 ESC • PAUSE"
            }
          </div>
          {paused && !result && (
            <PauseMenu
              onResume={() => setPaused(false)}
              onQuality={(value) => controls.current.setQuality?.(value)}
              onEnd={() =>
                finishSession({
                  ...hud,
                  reason: "Session terminée",
                })
              }
            />
          )}{" "}
          {result && <ResultScreen result={result} onReturn={returnToLobby} />}
          {loading && <LoadingScreen {...loading} />}
          {graphicsFailure && (
            <GraphicsFailure failure={graphicsFailure} onRestart={() => window.location.reload()} />
          )}
        </div>
      )}
      {picker && (
        <PickerModal
          type={picker}
          progress={progress}
          onSelect={(id) => {
            const isCar = picker === "cars";
            const item = (isCar ? CARS : ENGINES).find((t) => t.id === id);
            const selectedKey = isCar ? "car" : "engine";
            const ownedKey = isCar ? "cars" : "engines";
            setProgress((t) =>
              t[ownedKey].includes(id)
                ? {
                    ...t,
                    [selectedKey]: id,
                  }
                : t.credits < item.price
                  ? t
                  : {
                      ...t,
                      [selectedKey]: id,
                      [ownedKey]: [...t[ownedKey], id],
                      credits: t.credits - item.price,
                    },
            );
            setPicker(null);
          }}
          onClose={() => setPicker(null)}
          station={screen === "race"}
        />
      )}
    </div>
  );
}
