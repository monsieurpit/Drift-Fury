import React from "react";
import { ArrowLeftIcon, ArrowRightIcon, ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { t } from "../../i18n.js";
export function TouchControls({ controls, hud }) {
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
        {hud?.onFoot && hud?.rp ? (
          <div
            className="touch-button !w-12 !border-[#e8857a]/60 !bg-[#e8857a]/20 text-[9px] font-bold"
            role="button"
            aria-label={t("touch.fire")}
            {...bindButton("KeyG")}
          >
            {t("touch.fireLabel")}
          </div>
        ) : (
          <div className="touch-button !w-12 text-[9px] font-bold" role="button" {...bindButton("Space")}>
            DRIFT
          </div>
        )}
        <div
          className="touch-button !w-14 text-[9px] font-bold"
          role="button"
          aria-label={t("touch.foot")}
          {...bindButton("KeyF")}
        >
          {t("touch.footLabel")}
        </div>
        {hud?.duty?.on && (
          <>
            {/* The police job: lights, siren, E (pull over, talk, tackle), backup, weapon, accept a call. */}
            {!hud.onFoot && (
              <div className="touch-button !w-11 !border-[#3a6bff]/60 !bg-[#3a6bff]/20 text-[8px] font-bold" role="button" aria-label={t("duty.lights")} {...bindButton("KeyL")}>
                {t("touch.lights")}
              </div>
            )}
            {!hud.onFoot && (
              <div className="touch-button !w-11 !border-[#ff3b3b]/60 !bg-[#ff3b3b]/20 text-[8px] font-bold" role="button" aria-label={t("duty.siren")} {...bindButton("KeyK")}>
                {t("touch.siren")}
              </div>
            )}
            <div className="touch-button !w-10 text-[11px] font-bold" role="button" aria-label="E" {...bindButton("KeyE")}>
              {t("touch.talk")}
            </div>
            {hud.onFoot && (
              <div className="touch-button !w-11 text-[8px] font-bold" role="button" aria-label={t("duty.weapon")} {...bindButton("KeyX")}>
                {t("touch.weapon")}
              </div>
            )}
            <div className="touch-button !w-12 text-[8px] font-bold" role="button" aria-label={t("duty.backup")} {...bindButton("KeyB")}>
              {t("touch.backup")}
            </div>
          </>
        )}
        {!hud?.onFoot && !hud?.duty?.on && (
          <div className="touch-button !w-11 text-[9px] font-bold" role="button" aria-label={t("job.take")} {...bindButton("KeyJ")}>
            JOB
          </div>
        )}
        {hud?.onFoot && hud?.lockerNear && !hud?.duty?.on && (
          <div className="touch-button !w-10 text-[11px] font-bold" role="button" aria-label="E" {...bindButton("KeyE")}>
            E
          </div>
        )}
        {!hud?.onFoot && (
          <div className="touch-button !w-11 text-[9px] font-bold" role="button" aria-label={t("radio.title")} {...bindButton("KeyT")}>
            FM
          </div>
        )}
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
