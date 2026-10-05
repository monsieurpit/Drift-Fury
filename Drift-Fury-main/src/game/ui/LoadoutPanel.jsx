import { ChevronRightIcon, Settings2Icon, ArrowUpRightIcon } from "lucide-react";
export function LoadoutPanel({
  car: e,
  engine: t,
  onGarage: n,
  onStart: r,
  noPolice: i,
  onToggleNoPolice: a,
}) {
  return (
    <div className="garage-panel flex flex-col p-6 md:p-7">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Votre configuration</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
      </div>
      <div className="mt-7 flex items-start justify-between">
        <div>
          <p className="text-[10px] tracking-[.14em] text-[#a2acae]">{e.tag}</p>
          <h2 className="race-title mt-2 text-4xl">{e.name}</h2>
        </div>
        <span className="rounded-md bg-[#c6dc77]/10 px-2 py-1 text-[9px] font-bold text-[#c6dc77]">
          PRÊT À ROULER
        </span>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-[#899295]">{e.description}</p>
      <button
        onClick={() => {
          return n("cars");
        }}
        className="mt-5 flex w-full items-center justify-between rounded-lg border border-[#3c4447] px-4 py-3 text-xs font-semibold hover:bg-white/5"
      >
        Changer de voiture
        <ChevronRightIcon size={15} />
      </button>
      <div className="my-6 h-px bg-white/10" />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-white/5 p-2.5 text-[#b6c2c3]">
            <Settings2Icon size={19} />
          </div>
          <div>
            <div className="eyebrow !text-[8px]">Bloc moteur</div>
            <div className="mt-1 text-sm font-semibold">{t.name}</div>
          </div>
        </div>
        <button
          onClick={() => {
            return n("engines");
          }}
          className="rounded-md border border-white/10 p-2 text-[#c6dc77] hover:bg-white/5"
          aria-label="Changer de moteur"
        >
          <ArrowUpRightIcon size={16} />
        </button>
      </div>
      <div className="mt-6 grid grid-cols-3 gap-2">
        <div>
          <p className="eyebrow !text-[8px]">Puissance</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {t.hp}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">CH</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">Couple</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {t.torque}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">NM</span>
          </p>
        </div>
        <div>
          <p className="eyebrow !text-[8px]">Vitesse max.</p>
          <p className="mt-1 font-heading text-2xl font-semibold">
            {Math.round(t.max * 3.6)}
            <span className="ml-1 font-body text-[9px] text-[#8b9395]">KM/H</span>
          </p>
        </div>
      </div>
      <button
        onClick={() => {
          return n("engines");
        }}
        className="mt-5 flex items-center justify-between text-[11px] text-[#929c9e] hover:text-white"
      >
        Changer de moteur
        <ChevronRightIcon size={14} />
      </button>
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow !text-[8px]">Mode de jeu</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#c6dc77]" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              if (i) {
                a();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${i ? "border-[#3c4447] hover:bg-white/5" : "border-[#c6dc77] bg-[#c6dc77]/10"}`}
          >
            <div className="text-[11px] font-semibold text-white">Poursuite</div>
            <div className="mt-1 text-[9px] text-[#8f989b]">Police et évasion</div>
          </button>
          <button
            onClick={() => {
              if (!i) {
                a();
              }
            }}
            className={`rounded-lg border px-3 py-3 text-left ${i ? "border-[#c6dc77] bg-[#c6dc77]/10" : "border-[#3c4447] hover:bg-white/5"}`}
          >
            <div className="text-[11px] font-semibold text-white">Sans police</div>
            <div className="mt-1 text-[9px] text-[#8f989b]">Conduite libre · casse</div>
          </button>
        </div>
        {i && (
          <p className="mt-2 text-[9px] leading-relaxed text-[#8f989b]">
            Les chocs abîment la voiture selon la vitesse d'impact : perte de puissance, tenue de route
            dégradée et fumée du capot.
          </p>
        )}
      </div>
      <button
        onClick={r}
        className="lime-button mt-5 flex items-center justify-between px-5 py-4 text-[13px]"
      >
        LANCER LA SESSION
        <ArrowUpRightIcon size={21} />
      </button>
      <p className="mt-3 text-center text-[9px] tracking-[.08em] text-[#738080]">
        MONDE OUVERT • CONDUITE LIBRE
      </p>
    </div>
  );
}
