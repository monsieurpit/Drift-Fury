import { PlayIcon, LogOutIcon } from "lucide-react";
export function PauseMenu({ onResume: e, onEnd: t }) {
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-[#0c1215]/80 p-6 backdrop-blur-md">
      <div className="w-full max-w-sm">
        <p className="eyebrow !text-[#c6dc77]">NIGHTSHIFT / SESSION</p>
        <h2 className="race-title mb-8 mt-3 text-6xl">UNE PAUSE.</h2>
        <button
          onClick={e}
          className="lime-button flex w-full items-center justify-between p-4 text-xs"
        >
          REPRENDRE
          <PlayIcon size={17} />
        </button>
        <button
          onClick={t}
          className="mt-3 flex w-full items-center justify-between rounded-lg border border-white/15 p-4 text-xs text-[#c6cdce]"
        >
          TERMINER LA SESSION
          <LogOutIcon size={17} />
        </button>
        <p className="mt-4 text-[10px] text-[#849395]">
          Vos points et vos crédits seront conservés.
        </p>
      </div>
    </div>
  );
}
