import { TrophyIcon, ArrowUpRightIcon, ShieldAlertIcon } from "lucide-react";
import { CarPreview } from "./CarPreview.jsx";
import { GarageHeader } from "./GarageHeader.jsx";
import { LoadoutPanel } from "./LoadoutPanel.jsx";
import { ZoneCards } from "./ZoneCards.jsx";
export function GarageScreen({
  progress,
  car,
  engine,
  onGarage,
  onStart,
  muted,
  onMute,
  noPolice,
  onToggleNoPolice,
}) {
  return (
    <div className="nightshift subtle-grid">
      <GarageHeader progress={progress} muted={muted} onMute={onMute} />
      <main className="mx-auto max-w-[1440px] px-5 pb-5 pt-8 md:px-10 md:pt-10">
        <div className="mb-7 flex items-end justify-between">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
              <span className="eyebrow !text-[#b3c578]">LE GARAGE / SESSION LIBRE</span>
            </div>
            <h1 className="race-title text-5xl md:text-[64px]">
              {"LA NUIT VOUS "}
              <span className="text-[#c6dc77]">APPARTIENT.</span>
            </h1>
            <p className="mt-3 text-[12px] leading-6 text-[#8f989b]">
              Trouvez votre trajectoire. Faites monter le score. Semez la police.
            </p>
          </div>
          <div className="hidden items-center gap-3 pb-1 md:flex">
            <TrophyIcon size={20} className="text-[#8b967c]" />
            <div>
              <p className="eyebrow !text-[8px]">Meilleur drift</p>
              <p className="mt-1 text-sm font-semibold">
                {Math.floor(progress.best).toLocaleString("fr-FR")}{" "}
                <span className="text-[10px] font-normal text-[#748081]">PTS</span>
              </p>
            </div>
          </div>
        </div>
        <div className="grid gap-5 lg:grid-cols-[1fr_350px]">
          <div className="relative min-h-[350px] overflow-hidden rounded-2xl border border-white/10 bg-[#171b1e] md:min-h-[430px]">
            <CarPreview car={car} />
            <div className="absolute left-6 top-6">
              <p className="eyebrow !text-[9px]">SÉLECTION ACTUELLE</p>
              <h2 className="race-title mt-2 text-[40px]">{car.name.toUpperCase()}</h2>
              <span className="mt-3 inline-block rounded border border-white/15 bg-[#101315]/60 px-2 py-1 text-[9px] tracking-[.14em] text-[#aab4b5]">
                {engine.id}
                {" • PROPULSION"}
              </span>
            </div>
            <div className="absolute right-6 top-6 flex gap-1.5">
              {[car.color, "#13181b", "#c6dc77"].map((e, t) => (
                <span
                  className={`h-3 w-3 rounded-full ${t === 0 ? "ring-1 ring-white/40 ring-offset-2 ring-offset-[#171b1e]" : ""}`}
                  style={{
                    background: e,
                  }}
                  key={t}
                />
              ))}
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
              <span className="text-[9px] tracking-[.12em] text-[#8e999b]">
                {"01 / "}
                {String(progress.cars.length).padStart(2, "0")}
                {" VÉHICULES DÉBLOQUÉS"}
              </span>
              <button
                onClick={() => onGarage("cars")}
                className="flex items-center gap-2 text-[10px] text-[#c6dc77]"
              >
                OUVRIR LE GARAGE
                <ArrowUpRightIcon size={15} />
              </button>
            </div>
          </div>
          <LoadoutPanel
            car={car}
            engine={engine}
            onGarage={onGarage}
            onStart={onStart}
            noPolice={noPolice}
            onToggleNoPolice={onToggleNoPolice}
          />
        </div>
        <ZoneCards />
        <footer className="mt-7 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
          <div className="flex flex-wrap items-center gap-4 text-[9px] text-[#818d90]">
            <span className="flex items-center gap-2">
              <kbd className="race-key">Z Q S D</kbd>
              {" / FLÈCHES • CONDUIRE"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">ESPACE</kbd>
              {" FREIN À MAIN"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">E</kbd>
              {" STATION"}
            </span>
            <span className="flex items-center gap-2">
              <kbd className="race-key">ESC</kbd>
              {" PAUSE"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[9px] text-[#7e8986]">
            <ShieldAlertIcon size={13} />
            <span>LES RUES N'ONT PAS DE RÈGLES. LA POLICE, SI.</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
