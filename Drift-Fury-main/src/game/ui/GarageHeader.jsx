import {
  ArrowUpRightIcon,
  CoinsIcon,
  VolumeXIcon,
  Volume2Icon,
} from "lucide-react";
export function GarageHeader({ progress: e, muted: t, onMute: n }) {
  return (
    <header className="flex h-20 items-center justify-between border-b border-white/10 px-5 md:px-10">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#c6dc77] text-[#192015]">
          <ArrowUpRightIcon size={25} strokeWidth={3} />
        </div>
        <span className="race-title text-[27px] tracking-[.035em]">
          NIGHTSHIFT<span className="ml-1 text-[#c6dc77]">.</span>
        </span>
        <span className="ml-5 hidden border-l border-white/15 pl-5 text-[10px] font-semibold tracking-[.2em] text-[#828b8e] md:block">
          DRIFT. ESCAPE. REPEAT.
        </span>
      </div>
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[.03] px-3 py-2 text-xs">
          <CoinsIcon size={15} className="text-[#c6dc77]" />
          <b>{e.credits.toLocaleString("fr-FR")}</b>
          <span className="hidden text-[#798184] sm:inline">CR</span>
        </div>
        <button
          onClick={n}
          aria-label={t ? "Activer le son" : "Couper le son"}
          className="text-[#9aa2a4]"
        >
          {t ? <VolumeXIcon size={19} /> : <Volume2Icon size={19} />}
        </button>
        <div className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-[#23282b] text-[10px] font-bold sm:flex">
          NS
        </div>
      </div>
    </header>
  );
}
