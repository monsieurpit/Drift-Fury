import React from "react";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ArrowDownIcon,
  ArrowUpIcon,
} from "lucide-react";
export function TouchControls({ controls: e }) {
  const t = React.useRef({});
  const n = (n, r) => {
    const i = t.current;
    if (r) {
      ((i[n] = (i[n] || 0) + 1), (e.current.keys[n] = true));
    } else {
      ((i[n] = Math.max(0, (i[n] || 0) - 1)),
        i[n] <= 0 && delete e.current.keys[n]);
    }
  };
  const r = (e) => {
    return {
      onTouchStart: (t) => {
        t.preventDefault();
        n(e, true);
      },
      onTouchEnd: (t) => {
        t.preventDefault();
        n(e, false);
      },
      onTouchCancel: () => {
        return n(e, false);
      },
      onContextMenu: (e) => {
        return e.preventDefault();
      },
    };
  };
  return (
    <div className="touch-controls pointer-events-none absolute bottom-52 left-3 right-3 z-20 flex items-end justify-between gap-1.5 sm:bottom-6 sm:left-52 sm:right-72 xl:hidden">
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div
          className="touch-button"
          role="button"
          aria-label="Tourner à gauche"
          {...r("ArrowLeft")}
        >
          <ArrowLeftIcon />
        </div>
        <div
          className="touch-button"
          role="button"
          aria-label="Tourner à droite"
          {...r("ArrowRight")}
        >
          <ArrowRightIcon />
        </div>
      </div>
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div
          className="touch-button !w-12 text-[9px] font-bold"
          role="button"
          {...r("Space")}
        >
          DRIFT
        </div>
        <div
          className="touch-button !w-14 text-[9px] font-bold"
          role="button"
          aria-label="Sortir ou entrer dans un véhicule"
          {...r("KeyF")}
        >
          PIED
        </div>
        <div
          className="touch-button"
          role="button"
          aria-label="Freiner"
          {...r("ArrowDown")}
        >
          <ArrowDownIcon />
        </div>
        <div
          className="touch-button !border-[#c6dc77]/60 !bg-[#c6dc77]/25"
          role="button"
          aria-label="Accélérer"
          {...r("ArrowUp")}
        >
          <ArrowUpIcon />
        </div>
      </div>
    </div>
  );
}
