import { VolumeXIcon, Volume2Icon, PauseIcon, StarIcon, FuelIcon, ShieldIcon } from "lucide-react";
import { GearIndicator } from "./GearIndicator.jsx";
import { Minimap } from "./Minimap.jsx";
import { t, formatNumber } from "../../i18n.js";
export function Hud({ hud, engine, muted, onMute, onPause, onStation }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 p-4 sm:p-6">
      <div className="flex items-start justify-between">
        <div className="hud-glass px-4 py-3">
          <div className="eyebrow !text-[#c6dc77]">
            {"NIGHTSHIFT / "}
            {t(`zone.${hud.zone}`)}
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="race-title text-4xl">{formatNumber(Math.floor(hud.score))}</span>
            <span className="text-[9px] text-[#879b9c]">{t("hud.driftPts")}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="pointer-events-auto flex gap-2">
            <button onClick={onMute} className="hud-glass p-3" aria-label={t("sound.toggle")}>
              {muted ? <VolumeXIcon size={17} /> : <Volume2Icon size={17} />}
            </button>
            <button onClick={onPause} className="hud-glass p-3" aria-label="Pause">
              <PauseIcon size={17} />
            </button>
          </div>
          <div className="hud-glass px-3 py-2">
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map((t) => (
                <StarIcon
                  size={18}
                  fill={Math.ceil(hud.wanted) >= t ? "#f2ad73" : "transparent"}
                  className={Math.ceil(hud.wanted) >= t ? "text-[#f2ad73]" : "text-[#637177]"}
                  key={t}
                />
              ))}
            </div>
            {hud.escape > 0 && hud.wanted > 0.15 && (
              <p className="mt-2 text-[9px] text-[#c6dc77]">
                {t("hud.escapeIn", { n: Math.ceil(5 - hud.escape) })}
              </p>
            )}
          </div>
        </div>
      </div>
      {hud.audioLoading && (
        <div
          role="status"
          className="hud-glass absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-5 py-4 text-center text-xs text-primary-foreground"
        >
          <span className="mb-3 block h-5 w-5 animate-spin rounded-full border-2 border-game-accent/25 border-t-game-accent mx-auto" />
          {t("hud.audioLoading")}
        </div>
      )}
      {hud.drifting && (
        <div className="absolute left-1/2 top-[28%] -translate-x-1/2 text-center">
          <span className="race-title text-6xl italic text-[#c6dc77] drop-shadow-lg">DRIFT ×{hud.combo}</span>
          <p className="mt-2 text-[10px] font-bold tracking-[.3em] text-white">{t("hud.holdAngle")}</p>
        </div>
      )}
      {hud.arrest > 0 && (
        <div className="absolute left-1/2 top-36 w-60 -translate-x-1/2 rounded-lg bg-[#301c1dee] p-3 text-center">
          <div className="text-[10px] font-bold tracking-widest text-[#ff827a]">
            {t("hud.jailIn", { n: Math.ceil(5 - (hud.arrestTimer || 0)) })}
          </div>
          <div className="game-meter mt-2">
            <div
              className="bg-[#f87970]"
              style={{
                width: `${hud.arrest}%`,
              }}
            />
          </div>
        </div>
      )}
      {!hud.onFoot && hud.station >= 0 && (
        <button
          onClick={onStation}
          className="pointer-events-auto absolute left-1/2 top-[55%] -translate-x-1/2 rounded-xl border border-[#c6dc77]/40 bg-[#18251eee] px-5 py-4 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#c6dc77]">
            <FuelIcon size={16} />
            {t("hud.refuel")}
            {Math.round(hud.fuel)}%
          </div>
          <p className="mt-2 text-[10px] text-white">
            <kbd className="race-key">E</kbd>
            {t("hud.changeCar")}
          </p>
        </button>
      )}
      {hud.onFoot && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#18251eee] px-4 py-2 text-xs text-[#c6dc77] border border-[#c6dc77]/30">
          {t("hud.onFoot")}
          <kbd className="race-key">F</kbd>
        </div>
      )}
      {hud.onFoot && (hud.shop >= 0 || hud.store >= 0) && (
        <div className="absolute left-1/2 top-36 -translate-x-1/2 rounded-lg border border-[#c6dc77]/30 bg-[#18251eee] px-4 py-2 text-center text-xs text-[#e8eddf]">
          {hud.store >= 0
            ? t("hud.storeInside")
            : t("hud.storeOpen")}
        </div>
      )}
      {hud.fuel === 0 && (
        <div className="absolute left-1/2 top-24 -translate-x-1/2 rounded-lg bg-[#421e15e6] px-4 py-2 text-xs text-[#ffd0a9]">
          {t("hud.outOfFuel")}
        </div>
      )}
      <div className="absolute bottom-6 left-6">
        <Minimap hud={hud} />
      </div>
      <div className="hud-glass absolute bottom-6 right-6 w-48 p-4 sm:w-56">
        <div className="flex items-end justify-between">
          <span className="race-title text-6xl tabular-nums">{hud.speed}</span>
          <div className="pb-1 text-right">
            <div className="text-[10px] text-[#a2b5b7]">KM/H</div>
            <div className="mt-1 text-xs font-semibold text-[#c6dc77]">{engine.id}</div>
          </div>
        </div>
        <GearIndicator hud={hud} />
        <div className="mt-3 flex gap-1">
          {Array.from(
            {
              length: 16,
            },
            (t, n) => (
              <div
                className={`h-2 flex-1 rounded-sm ${hud.rpm / (hud.redline || 8000) > n / 16 ? (n > 12 ? "bg-[#ed8974]" : "bg-[#c6dc77]") : "bg-white/10"}`}
                key={n}
              />
            ),
          )}
        </div>
        <div className="mt-2 flex justify-between text-[8px] text-[#a0adb0]">
          <span>
            {hud.rpm}
            {" RPM"}
          </span>
          <span>{t("drive.rwd")}</span>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <FuelIcon size={13} className={hud.fuel < 20 ? "text-[#ed8974]" : "text-[#a5b6ac]"} />
          <div className="game-meter flex-1">
            <div
              className={hud.fuel < 20 ? "bg-[#ed8974]" : "bg-[#c6dc77]"}
              style={{
                width: `${hud.fuel}%`,
              }}
            />
          </div>
          <span className="w-8 text-right text-[9px]">{Math.round(hud.fuel)}%</span>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <ShieldIcon size={13} className="text-[#a5b6ac]" />
          <div className="game-meter flex-1">
            <div
              className={hud.health < 30 ? "bg-[#ed8974]" : "bg-[#97b1c4]"}
              style={{
                width: `${hud.health}%`,
              }}
            />
          </div>
          <span className="w-8 text-right text-[9px]">{Math.round(hud.health)}%</span>
        </div>
      </div>
    </div>
  );
}
