import { XIcon, CheckIcon, LockKeyholeIcon, ArrowUpRightIcon, CoinsIcon } from "lucide-react";
import { CARS } from "../data/cars.js";
import { ENGINES } from "../data/engines.js";
export function PickerModal({ type, progress, onSelect, onClose, station = false }) {
  const isCars = type === "cars";
  const owned = isCars ? progress.cars : progress.engines;
  const selectedId = isCars ? progress.car : progress.engine;
  const items = (isCars ? CARS : ENGINES).filter((e) => !station || owned.includes(e.id));
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md"
      role="dialog"
      aria-modal="true"
      aria-label={isCars ? "Garage" : "Atelier moteur"}
    >
      <div className="w-full max-w-3xl overflow-hidden rounded-2xl border border-white/10 bg-[#171c1f] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <p className="eyebrow text-[#c6dc77]">
              {station ? "STATION-SERVICE • ÉCHANGE RAPIDE" : "NIGHTSHIFT / GARAGE"}
            </p>
            <h2 className="race-title mt-2 text-4xl">
              {isCars ? "CHOISISSEZ VOTRE VOITURE." : "CHOISISSEZ VOTRE MOTEUR."}
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-2 text-[#929b9d] hover:bg-white/5"
          >
            <XIcon size={22} />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => {
              const isOwned = owned.includes(item.id);
              const isSelected = selectedId === item.id;
              return (
                <div
                  className={`rounded-xl border p-5 ${isSelected ? "border-[#c6dc77]/60 bg-[#c6dc77]/5" : "border-white/10 bg-[#202629]"}`}
                  key={item.id}
                >
                  <div className="flex items-center justify-between">
                    <span className="eyebrow !text-[8px]">
                      {isCars ? item.tag : `${item.hp} CH • ${item.torque} NM`}
                    </span>
                    {isSelected ? (
                      <CheckIcon size={17} className="text-[#c6dc77]" />
                    ) : isOwned ? null : (
                      <LockKeyholeIcon size={15} className="text-[#717c7f]" />
                    )}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    {isCars ? (
                      <div
                        className="h-5 w-9 -skew-x-12 rounded-sm border-b-4 border-black/40"
                        style={{
                          background: item.color,
                        }}
                      />
                    ) : (
                      <span className="font-heading text-3xl font-bold text-[#c6dc77]">{item.id}</span>
                    )}
                    <h3 className="font-heading text-2xl font-semibold">{item.name}</h3>
                  </div>
                  <p className="mt-3 min-h-9 text-[11px] leading-relaxed text-[#929d9f]">
                    {item.description}
                  </p>
                  <button
                    disabled={isSelected || (!isOwned && progress.credits < item.price)}
                    onClick={() => onSelect(item.id)}
                    className={`mt-4 flex w-full items-center justify-between rounded-lg px-4 py-3 text-xs font-semibold ${isSelected ? "bg-white/5 text-[#c6dc77]" : isOwned ? "bg-[#c6dc77] text-[#172010]" : "border border-white/15 text-[#d2d8d4]"}`}
                  >
                    <span>
                      {isSelected
                        ? "Équipé"
                        : isOwned
                          ? "Équiper"
                          : `Débloquer • ${item.price.toLocaleString("fr-FR")} CR`}
                    </span>
                    {isSelected ? <CheckIcon size={14} /> : <ArrowUpRightIcon size={16} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/10 px-6 py-4 text-[10px] text-[#859194]">
          <span>
            {station
              ? "Le véhicule est remplacé, votre session continue."
              : "Gagnez des crédits en driftant et en survivant aux poursuites."}
          </span>
          <span className="ml-3 flex shrink-0 items-center gap-2 text-[#c6dc77]">
            <CoinsIcon size={14} />
            {progress.credits.toLocaleString("fr-FR")}
            {" CR"}
          </span>
        </div>
      </div>
    </div>
  );
}
