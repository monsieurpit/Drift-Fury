import React from "react";
import { HandIcon, CrosshairIcon, ZapIcon } from "lucide-react";
import { t } from "../../i18n.js";

const ICONS = { fists: HandIcon, taser: ZapIcon };

/** The weapon menu (G on foot): fists and the guns the player may carry; a number key or a click picks one. */
export function WeaponMenu({ options, current, rounds, onSelect, onClose }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30 flex items-center justify-center">
      <div className="hud-glass pointer-events-auto w-[min(92vw,26rem)] px-5 py-4">
        <div className="eyebrow mb-3 flex items-center justify-between">
          <span>{t("weaponMenu.title")}</span>
          <button className="text-[10px] text-[#8fa3a8]" onClick={onClose}>
            G
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {options.map((id, index) => {
            const Icon = ICONS[id] || CrosshairIcon;
            const selected = id === current;
            return (
              <button
                key={id}
                onClick={() => onSelect(id)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-[11px] ${
                  selected ? "border-[#c6dc77] bg-[#c6dc77]/15 text-white" : "border-white/10 bg-white/5 text-[#c9d4d6] hover:border-[#c6dc77]/60"
                }`}
              >
                <kbd className="race-key !m-0">{index + 1}</kbd>
                <Icon size={14} />
                <span>{t(`weapon.${id}`)}</span>
                {rounds?.[id] && <span className="ml-auto text-[9px] text-[#8fa3a8]">{rounds[id]}</span>}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-[9px] leading-4 text-[#8f989b]">{t("weaponMenu.hint")}</p>
      </div>
    </div>
  );
}
