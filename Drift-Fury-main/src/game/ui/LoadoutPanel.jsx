import { ChevronRightIcon, Settings2Icon, ArrowUpRightIcon } from "lucide-react";
import { t, formatNumber } from "../../i18n.js";
export function LoadoutPanel({ car, engine, onGarage, onStart, noPolice, onToggleNoPolice }) {
  return (
    <div className="garage-panel flex flex-col p-6 md:p-7">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{t("loadout.yourSetup")}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
      </div>
      <div className="mt-7 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[.14em] text-[#a2acae]">{car.tag}</p>
          <h2 className="race-title mt-2 text-4xl">{car.name}</h2>
        </div>
        <span className="rounded-md bg-[#c6dc77]/10 px-2 py-1 text-[9px] font-bold text-[#c6dc77]">
          {t("loadout.ready")}
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#899295]">{car.description}</p>
      <button
        onClick={() => onGarage("cars")}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-[#3c4447] px-4 py-3 text-xs font-semibold hover:bg-white/5"
      >
        {t("loadout.changeCar")}
        <ChevronRightIcon size={15} />
      </button>
      <div className="my-6 h-px bg-white/10" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2.5 text-[#b6c2c3]">
            <Settings2Icon size={19} />
          </div>
          <div>
            <div className="eyebrow !text-[8px]">{t("loadout.engine")}</div>
            <div className="mt-1 text-sm font-semibold">{engine.name}</div>
          </div>
        </div>
        <button
          onClick={() => onGarage("engines")}
          className="rounded-md border border-white/10 p-2 text-[#c6dc77] hover:bg-white/5"
          aria-label={t("loadout.changeEngine")}
        >
          <ArrowUpRightIcon size={16} />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div>
          <p className="eyebrow !text-[8px]">{t("loadout.power")}</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {engine.hp}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">{t("loadout.hp")}</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">{t("loadout.torque")}</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {engine.torque}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">NM</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">{t("loadout.topSpeed")}</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {Math.round(engine.max * 3.6)}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">KM/H</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => onGarage("engines")}
        className="mt-5 flex items-center justify-between text-[11px] text-[#929c9e] hover:text-white"
      >
        {t("loadout.changeEngine")}
        <ChevronRightIcon size={14} />
      </button>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow !text-[8px]">{t("loadout.gameMode")}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (noPolice) {
                onToggleNoPolice();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${noPolice ? "border-[#3c4447] hover:bg-white/5" : "border-[#c6dc77] bg-[#c6dc77]/10"}`}
          >
            <div className="text-[11px] font-semibold text-white">{t("loadout.pursuit")}</div>
            <div className="mt-1 text-[9px] text-[#8f989b]">{t("loadout.pursuitSub")}</div>
          </button>
          <button
            onClick={() => {
              if (!noPolice) {
                onToggleNoPolice();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${noPolice ? "border-[#c6dc77] bg-[#c6dc77]/10" : "border-[#3c4447] hover:bg-white/5"}`}
          >
            <div className="text-[11px] font-semibold text-white">{t("loadout.noPolice")}</div>
            <div className="mt-1 text-[9px] text-[#8f989b]">{t("loadout.noPoliceSub")}</div>
          </button>
        </div>
        {noPolice && (
          <p className="mt-2 text-[9px] leading-relaxed text-[#8f989b]">
            {t("loadout.damageNote")}
          </p>
        )}
      </div>
      <button
        onClick={onStart}
        className="lime-button mt-5 flex items-center justify-between px-5 py-4 text-[13px]"
      >
        {t("loadout.start")}
        <ArrowUpRightIcon size={21} />
      </button>
      <p className="mt-3 text-center text-[9px] tracking-[.08em] text-[#738080]">
        {t("loadout.openWorld")}
      </p>
    </div>
  );
}
