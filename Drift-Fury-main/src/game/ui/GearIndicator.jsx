export function GearIndicator({ hud: e }) {
  return (
    <div className="mt-3 flex items-center justify-between border-t border-game-accent/15 pt-3">
      <span className="text-[8px] tracking-widest text-primary-foreground/65">
        BOÎTE AUTO · 7 RAPPORTS
      </span>
      <span
        className="flex items-baseline gap-1.5 text-game-accent"
        aria-label={
          e.gear === -1 ? "Marche arrière" : `Rapport ${e.gear} sur 7`
        }
      >
        <span className="race-title text-3xl tabular-nums">
          {e.gear === -1 ? "R" : e.gear}
        </span>
        {e.gear !== -1 && <span className="text-[10px] opacity-60">/ 7</span>}
      </span>
    </div>
  );
}
