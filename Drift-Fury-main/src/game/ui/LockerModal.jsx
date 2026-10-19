import React from "react";
import { ShieldIcon, LockIcon } from "lucide-react";
import { t } from "../../i18n.js";
import { FLEET, OUTFIT_RANK, RANKS } from "../simulation/policeDuty.js";

/** The police station's locker (the police job): uniform, patrol car, on and off duty. */
export function LockerModal({ info, onStart, onEnd, onClose }) {
  const rank = info?.rank ?? 0;
  const [outfit, setOutfit] = React.useState(info?.outfit && OUTFIT_RANK[info.outfit] <= rank ? info.outfit : "patrol");
  const [fleet, setFleet] = React.useState(() => {
    const own = FLEET.find((car) => car.id === info?.fleet && car.rank <= rank);
    return own ? own.id : "cruiser";
  });
  const ready = !!info?.ready;
  const suspended = (info?.suspendedFor ?? 0) > 0;
  const next = RANKS[rank + 1];
  const choice = (selected, locked, onClick, label, detail) => (
    <button
      key={label}
      disabled={locked}
      onClick={onClick}
      className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-[11px] ${
        selected ? "border-[#88b7ef] bg-[#88b7ef]/15 text-white" : "border-white/10 bg-white/5 text-[#c9d4d6]"
      } ${locked ? "cursor-not-allowed opacity-45" : "hover:border-[#88b7ef]/60"}`}
    >
      <span>{label}</span>
      <span className="text-[9px] text-[#8fa3a8]">{detail}</span>
    </button>
  );
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
      <div className="hud-glass w-full max-w-2xl px-6 py-5">
        <div className="flex items-center justify-between">
          <span className="eyebrow flex items-center gap-2 !text-[#88b7ef]">
            <ShieldIcon size={14} /> {t("locker.title")}
          </span>
          <span className="text-[10px] text-[#c9d4d6]">
            {t("locker.rank")}: <b className="text-white">{t(`rank.${rank}`)}</b> · XP {info?.xp ?? 0}
            {next ? ` / ${next}` : ""}
          </span>
        </div>
        <p className="mt-2 text-[11px] leading-5 text-[#b8c4c6]">{t("locker.intro")}</p>
        {suspended && <p className="mt-2 text-[11px] font-bold text-[#ff8f80]">{t("locker.suspended", { n: info.suspendedFor })}</p>}
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-[#8fa3a8]">{t("locker.outfit")}</div>
            <div className="grid gap-1.5">
              {Object.entries(OUTFIT_RANK).map(([id, need]) =>
                choice(
                  outfit === id,
                  need > rank,
                  () => setOutfit(id),
                  t(`outfit.${id}`),
                  need > rank ? (
                    <span className="flex items-center gap-1">
                      <LockIcon size={10} /> {t("locker.locked", { rank: t(`rank.${need}`) })}
                    </span>
                  ) : (
                    ""
                  ),
                ),
              )}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[10px] uppercase tracking-widest text-[#8fa3a8]">
              {t("locker.vehicle")} {!ready && <span className="ml-2 normal-case text-[#ffd23a]">{t("locker.loading")}</span>}
            </div>
            <div className="grid gap-1.5">
              {FLEET.map((car) =>
                choice(
                  fleet === car.id,
                  car.rank > rank || (!ready && car.id !== "cruiser"),
                  () => setFleet(car.id),
                  t(`fleet.${car.id}`),
                  car.rank > rank ? (
                    <span className="flex items-center gap-1">
                      <LockIcon size={10} /> {t("locker.locked", { rank: t(`rank.${car.rank}`) })}
                    </span>
                  ) : (
                    `${Math.round(car.max * 3.6)} km/h`
                  ),
                ),
              )}
            </div>
          </div>
        </div>
        <p className="mt-4 text-[9px] leading-4 text-[#8f989b]">{t("locker.controls")}</p>
        <div className="mt-4 flex flex-wrap justify-end gap-2">
          <button onClick={onClose} className="rounded-lg border border-white/15 px-4 py-2 text-[11px] text-[#c9d4d6]">
            {t("locker.close")}
          </button>
          {info?.on && (
            <button onClick={onEnd} className="rounded-lg border border-[#ff8f80]/50 bg-[#3a1814] px-4 py-2 text-[11px] text-[#ffb0a8]">
              {t("locker.end")}
            </button>
          )}
          <button
            disabled={suspended}
            onClick={() => onStart(outfit, ready ? fleet : "cruiser")}
            className={`lime-button px-5 py-2 text-[12px] ${suspended ? "opacity-40" : ""}`}
          >
            {t("locker.start")}
          </button>
        </div>
      </div>
    </div>
  );
}
