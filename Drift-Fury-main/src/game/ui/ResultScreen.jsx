import React from "react";
import {
  ShieldAlertIcon,
  TrophyIcon,
  CoinsIcon,
  ArrowUpRightIcon,
} from "lucide-react";
export function ResultScreen({ result: e, onReturn: t }) {
  const [n, r] = React.useState(9);
  React.useEffect(() => {
    const e = setInterval(() => {
      return r((e) => {
        return e - 1;
      });
    }, 1000);
    return () => {
      return clearInterval(e);
    };
  }, []);
  React.useEffect(() => {
    if (n <= 0) {
      t();
    }
  }, [n, t]);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/90 p-5 backdrop-blur-md">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#e89978]/30 bg-[#e89978]/10 text-[#e89978]">
          <ShieldAlertIcon size={27} />
        </div>
        <p className="eyebrow !text-[#e89978]">FIN DE SESSION</p>
        <h2 className="race-title mt-4 text-6xl">{e.reason.toUpperCase()}</h2>
        <p className="mt-4 text-xs text-[#95a0a2]">
          {e.reason === "Session terminée"
            ? "Votre session est enregistrée. À vous la prochaine sortie."
            : "La prochaine trajectoire sera la bonne."}
        </p>
        <div className="garage-panel mt-8 grid grid-cols-2 divide-x divide-white/10 py-6">
          <div>
            <TrophyIcon className="mx-auto text-[#c6dc77]" size={20} />
            <p className="race-title mt-3 text-4xl">
              {Math.floor(e.score).toLocaleString("fr-FR")}
            </p>
            <p className="eyebrow mt-2 !text-[8px]">POINTS DE DRIFT</p>
          </div>
          <div>
            <CoinsIcon className="mx-auto text-[#c6dc77]" size={20} />
            <p className="race-title mt-3 text-4xl">
              +{e.credits.toLocaleString("fr-FR")}
            </p>
            <p className="eyebrow mt-2 !text-[8px]">CRÉDITS GAGNÉS</p>
          </div>
        </div>
        <button
          onClick={t}
          className="lime-button mt-6 flex w-full items-center justify-between p-4 text-xs"
        >
          RETOURNER AU GARAGE
          <ArrowUpRightIcon size={20} />
        </button>
        <p className="mt-4 text-[10px] text-[#738084]">
          {"Retour automatique dans "}
          {Math.max(0, n)}
          {" secondes"}
        </p>
      </div>
    </div>
  );
}
