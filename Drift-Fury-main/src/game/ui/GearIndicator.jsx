import { t } from "../../i18n.js";
export function GearIndicator({ hud }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-game-accent/15 pt-3">
      <span className="text-[8px] tracking-widest text-primary-foreground/65">{t("hud.gearbox")}</span>
      <span
        className="flex items-baseline gap-1.5 text-game-accent"
        aria-label={hud.gear === -1 ? t("hud.reverse") : t("hud.gearOf", { n: hud.gear })}
      >
        <span className="race-title text-3xl tabular-nums">{hud.gear === -1 ? "R" : hud.gear}</span>
        {hud.gear !== -1 && <span className="text-[10px] opacity-60">/ 7</span>}
      </span>
    </div>
  );
}
