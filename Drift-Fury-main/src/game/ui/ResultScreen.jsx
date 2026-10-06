import React from "react";
import { ShieldAlertIcon, TrophyIcon, CoinsIcon, ArrowUpRightIcon } from "lucide-react";
import { t, formatNumber } from "../../i18n.js";
export function ResultScreen({ result, onReturn }) {
  const [countdown, setCountdown] = React.useState(9);
  React.useEffect(() => {
    const e = setInterval(() => setCountdown((e) => e - 1), 1000);
    return () => clearInterval(e);
  }, []);
  React.useEffect(() => {
    if (countdown <= 0) {
      onReturn();
    }
  }, [countdown, onReturn]);
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/90 p-5 backdrop-blur-md">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full border border-[#e89978]/30 bg-[#e89978]/10 text-[#e89978]">
          <ShieldAlertIcon size={27} />
        </div>
        <p className="eyebrow !text-[#e89978]">{t("result.over")}</p>
        <h2 className="race-title mt-4 text-6xl">{t(`reason.${result.reason}`).toUpperCase()}</h2>
        <p className="mt-4 text-xs text-[#95a0a2]">
          {result.reason === "ended" ? t("result.endedNote") : t("result.otherNote")}
        </p>
        <div className="garage-panel mt-8 grid grid-cols-2 divide-x divide-white/10 py-6">
          <div>
            <TrophyIcon className="mx-auto text-[#c6dc77]" size={20} />
            <p className="race-title mt-3 text-4xl">{formatNumber(Math.floor(result.score))}</p>
            <p className="eyebrow mt-2 !text-[8px]">{t("result.driftPoints")}</p>
          </div>
          <div>
            <CoinsIcon className="mx-auto text-[#c6dc77]" size={20} />
            <p className="race-title mt-3 text-4xl">+{formatNumber(result.credits)}</p>
            <p className="eyebrow mt-2 !text-[8px]">{t("result.creditsEarned")}</p>
          </div>
        </div>
        <button
          onClick={onReturn}
          className="lime-button mt-6 flex w-full items-center justify-between p-4 text-xs"
        >
          {t("result.back")}
          <ArrowUpRightIcon size={20} />
        </button>
        <p className="mt-4 text-[10px] text-[#738084]">
          {t("result.autoReturn", { n: Math.max(0, countdown) })}
        </p>
      </div>
    </div>
  );
}
