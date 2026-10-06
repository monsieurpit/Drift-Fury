import React from "react";
import { PlayIcon, LogOutIcon } from "lucide-react";
import { FEATURE_LABELS, QUALITY_LABELS, brokenFeatures, storedQuality } from "../render/quality.js";
import { t } from "../../i18n.js";
export function PauseMenu({ onResume, onEnd, onQuality, hud }) {
  const [quality, setQuality] = React.useState(storedQuality);
  const broken = [...brokenFeatures()];
  const choose = (value) => {
    setQuality(value);
    onQuality?.(value);
  };
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/80 p-6 backdrop-blur-md">
      <div className="w-full max-w-sm">
        <p className="eyebrow !text-[#c6dc77]">NIGHTSHIFT / SESSION</p>
        <h2 className="race-title mb-8 mt-3 text-6xl">{t("pause.title")}</h2>
        <button
          onClick={onResume}
          className="lime-button flex w-full items-center justify-between p-4 text-xs"
        >
          {t("pause.resume")}
          <PlayIcon size={17} />
        </button>
        <button
          onClick={onEnd}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/15 p-4 text-xs text-[#c6cdce]"
        >
          {t("pause.end")}
          <LogOutIcon size={17} />
        </button>
        <p className="mt-4 text-[10px] text-[#849395]">{t("pause.kept")}</p>
        <p className="eyebrow mt-8 !text-[#849395]">{t("pause.graphics")}</p>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {Object.entries(QUALITY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => choose(value)}
              className={
                "rounded-md border p-2 text-[9px] tracking-wider " +
                (quality === value
                  ? "border-[#c6dc77] bg-[#c6dc77] text-[#0c1215]"
                  : "border-white/15 text-[#c6cdce]")
              }
            >
              {label}
            </button>
          ))}
        </div>
        {hud?.fpsTarget > 0 && (
          <p className="mt-3 text-[10px] leading-5 text-[#849395]">
            {t("pause.fpsAuto")}
            <span className="text-[#c6cdce]">{t("pause.fpsTarget", { n: Math.round(hud.fpsTarget) })}</span>
            {hud.fps > 0 ? t("pause.fpsMeasured", { n: Math.round(hud.fps) }) : ""}
            {hud.refreshHz > 0 ? t("pause.refresh", { n: Math.round(hud.refreshHz) }) : ""}
          </p>
        )}
        {broken.length > 0 && (
          <p className="mt-3 text-[10px] leading-5 text-[#849395]">
            {t("pause.disabled")}
            <span className="text-[#c6cdce]">
              {broken.map((name) => FEATURE_LABELS[name] || name).join(", ")}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}
