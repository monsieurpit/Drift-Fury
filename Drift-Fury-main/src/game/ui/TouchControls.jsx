import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { t } from "../../i18n.js";
export function TouchControls({ controls }) {
  const pressCounts = React.useRef({});
  const setPressed = (key, pressed) => {
    const counts = pressCounts.current;
    if (pressed) {
      counts[key] = (counts[key] || 0) + 1;
      controls.current.keys[key] = true;
    } else {
      counts[key] = Math.max(0, (counts[key] || 0) - 1);
      if (counts[key] <= 0) {
        delete controls.current.keys[key];
      }
    }
  };
  const bindButton = (key) => ({
    onTouchStart: (t) => {
      t.preventDefault();
      setPressed(key, true);
    },
    onTouchEnd: (t) => {
      t.preventDefault();
      setPressed(key, false);
    },
    onTouchCancel: () => setPressed(key, false),
    onContextMenu: (e) => e.preventDefault(),
  });
  return (
    <div className="touch-controls pointer-events-none absolute bottom-52 left-3 right-3 z-20 flex items-end justify-between gap-1.5 sm:bottom-6 sm:left-52 sm:right-72 xl:hidden">
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div
          className="touch-button"
          role="button"
          aria-label={t("touch.left")}
          {...bindButton("ArrowLeft")}
        >
          <ArrowLeftIcon />
        </div>
        <div
          className="touch-button"
          role="button"
          aria-label={t("touch.right")}
          {...bindButton("ArrowRight")}
        >
          <ArrowRightIcon />
        </div>
      </div>
      <div className="touch-group pointer-events-auto flex gap-1.5">
        <div className="touch-button !w-12 text-[9px] font-bold" role="button" {...bindButton("Space")}>
          DRIFT
        </div>
        <div
          className="touch-button !w-14 text-[9px] font-bold"
          role="button"
          aria-label={t("touch.foot")}
          {...bindButton("KeyF")}
        >
          {t("touch.footLabel")}
        </div>
        <div className="touch-button" role="button" aria-label={t("touch.brake")} {...bindButton("ArrowDown")}>
          <ArrowDownIcon />
        </div>
        <div
          className="touch-button !border-[#c6dc77]/60 !bg-[#c6dc77]/25"
          role="button"
          aria-label={t("touch.accelerate")}
          {...bindButton("ArrowUp")}
        >
          <ArrowUpIcon />
        </div>
      </div>
    </div>
  );
}
