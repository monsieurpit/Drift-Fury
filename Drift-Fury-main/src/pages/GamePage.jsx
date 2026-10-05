import React from "react";
import { createAudio } from "../game/audio/createAudio.js";
import { CARS } from "../game/data/cars.js";
import { ENGINES } from "../game/data/engines.js";
import { INITIAL_HUD } from "../game/data/hud.js";
import { loadProgress, saveProgress } from "../game/data/progress.js";
import { GameView } from "../game/ui/GameView.jsx";
import { GarageScreen } from "../game/ui/GarageScreen.jsx";
import { Hud } from "../game/ui/Hud.jsx";
import { PauseMenu } from "../game/ui/PauseMenu.jsx";
import { PickerModal } from "../game/ui/PickerModal.jsx";
import { ResultScreen } from "../game/ui/ResultScreen.jsx";
import { TouchControls } from "../game/ui/TouchControls.jsx";
export function GamePage() {
  const [e, t] = React.useState(loadProgress);
  const [n, r] = React.useState("lobby");
  const [i, a] = React.useState(null);
  const [o, s] = React.useState(INITIAL_HUD);
  const [c, l] = React.useState(null);
  const [u, d] = React.useState(false);
  const [f, p] = React.useState(false);
  const [m, h] = React.useState(false);
  const g = React.useRef({
    keys: {},
    paused: false,
    muted: false,
    finished: false,
  });
  const v =
    CARS.find((t) => {
      return t.id === e.car;
    }) || CARS[0];
  const y =
    ENGINES.find((t) => {
      return t.id === e.engine;
    }) || ENGINES[0];
  React.useEffect(() => {
    return saveProgress(e);
  }, [e]);
  React.useEffect(() => {
    g.current.paused = !!(u || i || c);
    if (g.current.paused) {
      g.current.keys = {};
    }
  }, [u, i, c]);
  React.useEffect(() => {
    g.current.muted = f;
  }, [f]);
  const b = () => {
    const e = createAudio(y);
    e.resume();
    g.current = {
      keys: {},
      paused: false,
      muted: f,
      finished: false,
      audio: e,
    };
    s({
      ...INITIAL_HUD,
      audioLoading: true,
    });
    l(null);
    d(false);
    r("race");
  };
  const x = (e) => {
    if (c) {
      return;
    }
    g.current.paused = true;
    g.current.finished = true;
    d(false);
    a(null);
    const n = e.credits ?? Math.floor(e.score / 12 + (e.elapsed || 0) * 2);
    t((t) => {
      return {
        ...t,
        credits: t.credits + n,
        best: Math.max(t.best, e.score),
      };
    });
    l({
      ...e,
      credits: n,
    });
  };
  const S = () => {
    r("lobby");
    l(null);
    d(false);
    a(null);
  };
  const C = () => {
    if (!c) {
      if (i) {
        a(null);
        return;
      }
      d((e) => {
        return !e;
      });
    }
  };
  return (
    <div className="nightshift">
      {n === "lobby" ? (
        <GarageScreen
          progress={e}
          car={v}
          engine={y}
          onGarage={a}
          onStart={b}
          muted={f}
          onMute={() => {
            return p((e) => {
              return !e;
            });
          }}
          noPolice={m}
          onToggleNoPolice={() => {
            return h((e) => {
              return !e;
            });
          }}
        />
      ) : (
        <div className="relative h-[100dvh] w-full overflow-hidden">
          <GameView
            car={v}
            engine={y}
            controls={g}
            onHud={s}
            onFinish={x}
            onStation={() => {
              return a("cars");
            }}
            onPause={C}
            noPolice={m}
          />
          <Hud
            hud={o}
            engine={y}
            muted={f}
            onMute={() => {
              return p((e) => {
                return !e;
              });
            }}
            onPause={C}
            onStation={() => {
              return a("cars");
            }}
          />
          {!u && !c && !i && <TouchControls controls={g} />}
          <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 text-[8px] tracking-widest text-white/50 xl:block">
            {
              "ZQSD / WASD / FLÈCHES • CONDUIRE \xA0 ESPACE • DRIFT \xA0 E • STATION \xA0 F • PIED/ENTRER \xA0 ESC • PAUSE"
            }
          </div>
          {u && !c && (
            <PauseMenu
              onResume={() => {
                return d(false);
              }}
              onEnd={() => {
                return x({
                  ...o,
                  reason: "Session terminée",
                });
              }}
            />
          )}{" "}
          {c && <ResultScreen result={c} onReturn={S} />}
        </div>
      )}
      {i && (
        <PickerModal
          type={i}
          progress={e}
          onSelect={(e) => {
            const n = i === "cars";
            const r = (n ? CARS : ENGINES).find((t) => {
              return t.id === e;
            });
            const o = n ? "car" : "engine";
            const s = n ? "cars" : "engines";
            t((t) => {
              return t[s].includes(e)
                ? {
                    ...t,
                    [o]: e,
                  }
                : t.credits < r.price
                  ? t
                  : {
                      ...t,
                      [o]: e,
                      [s]: [...t[s], e],
                      credits: t.credits - r.price,
                    };
            });
            a(null);
          }}
          onClose={() => {
            return a(null);
          }}
          station={n === "race"}
        />
      )}
    </div>
  );
}
