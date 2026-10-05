import { FUEL_STATIONS } from "../data/stations.js";
export function Minimap({ hud: e }) {
  const t = (e) => {
    return ((e + 180) / 395) * 140 + 10;
  };
  const n = (e) => {
    return ((e + 530) / 730) * 145 + 8;
  };
  return (
    <div className="hud-glass hidden w-[165px] p-3 sm:block">
      <div className="mb-2 text-[9px] font-semibold uppercase tracking-widest text-[#a0b0b0]">{e.zone}</div>
      <svg viewBox="0 0 160 165" className="h-[160px] w-full">
        <rect width="160" height="165" rx="6" fill="#1d2d2d" />
        <path
          d="M122 3 V161 M48 5 C5 30 79 42 40 64 S75 76 67 82"
          stroke="#75878b"
          strokeWidth="4"
          fill="none"
        />
        {[-100, -50, 0, 50, 100].map((e) => {
          return (
            <g key={e}>
              <path
                d={`M${t(e)} ${n(-150)}V${n(150)} M${t(-135)} ${n(e)}H${t(130)}`}
                stroke="#718184"
                strokeWidth="2"
              />
            </g>
          );
        })}
        {FUEL_STATIONS.map((e, r) => {
          return <rect x={t(e.x) - 2} y={n(e.z) - 2} width="4" height="4" fill="#c6dc77" key={r} />;
        })}
        {e.police?.map((r, i) => {
          return (
            <circle cx={t(r.x)} cy={n(r.z)} r="2.5" fill={e.wanted > 0.15 ? "#f77d69" : "#77b5f7"} key={i} />
          );
        })}
        <g transform={`translate(${t(e.x)} ${n(e.z)}) rotate(${(-e.heading * 180) / Math.PI})`}>
          <circle r="7" fill="#c6dc77" opacity=".15" />
          <path d="M0 -5 L3 4 L0 2 L-3 4Z" fill="#e8f7b8" />
        </g>
      </svg>
      <div className="mt-2 flex justify-between text-[7px] tracking-wider text-[#93a39b]">
        <span>■ STATION</span>
        <span className="text-[#88b7ef]">● POLICE</span>
      </div>
    </div>
  );
}
