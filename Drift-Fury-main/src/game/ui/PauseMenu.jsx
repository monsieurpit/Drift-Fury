import React from "react";
import { PlayIcon, LogOutIcon } from "lucide-react";
import { QUALITY_LABELS, storedQuality } from "../render/quality.js";
export function PauseMenu({ onResume, onEnd, onQuality }) {
  const [quality, setQuality] = React.useState(storedQuality);
  const choose = (value) => {
    setQuality(value);
    onQuality?.(value);
  };
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/80 p-6 backdrop-blur-md">
      <div className="w-full max-w-sm">
        <p className="eyebrow !text-[#c6dc77]">NIGHTSHIFT / SESSION</p>
        <h2 className="race-title mb-8 mt-3 text-6xl">UNE PAUSE.</h2>
        <button
          onClick={onResume}
          className="lime-button flex w-full items-center justify-between p-4 text-xs"
        >
          REPRENDRE
          <PlayIcon size={17} />
        </button>
        <button
          onClick={onEnd}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/15 p-4 text-xs text-[#c6cdce]"
        >
          TERMINER LA SESSION
          <LogOutIcon size={17} />
        </button>
        <p className="mt-4 text-[10px] text-[#849395]">Vos points et vos crédits seront conservés.</p>
        <p className="eyebrow mt-8 !text-[#849395]">GRAPHISMES</p>
        <div className="mt-2 grid grid-cols-5 gap-1">
          {Object.entries(QUALITY_LABELS).map(([value, label]) => (
            <button
              key={value}
              onClick={() => choose(value)}
              className={
                "rounded-md border p-2 text-[9px] tracking-wider " +
                (quality === value
                  ? "border-[#c6dc77] bg-[#c6dc77] text-[#0c1215]"
                  : "border-white/15 text-[#c6cdce]")
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
