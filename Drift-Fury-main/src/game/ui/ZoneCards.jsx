import { Building2Icon, RouteIcon, MountainIcon } from "lucide-react";
import { t } from "../../i18n.js";
const ZONES = [
  {
    name: t("zone.city"),
    subtitle: t("zone.city.sub"),
    icon: Building2Icon,
    number: "01",
    className: "bg-[#233035]",
    lines: "M-10 80 L150 80 M-10 43 L150 43 M32 -10 L32 140 M76 -10 L76 140 M115 -10 L115 140",
  },
  {
    name: t("zone.highway"),
    subtitle: t("zone.highway.sub"),
    icon: RouteIcon,
    number: "02",
    className: "bg-[#32372b]",
    lines: "M-10 115 L150 -15 M10 135 L170 5 M-30 95 L130 -35",
  },
  {
    name: t("zone.mountain"),
    subtitle: t("zone.mountain.sub"),
    icon: MountainIcon,
    number: "03",
    className: "bg-[#302e32]",
    lines: "M-10 100 C90 115 -5 65 75 55 S 15 5 150 5",
  },
];
export function ZoneCards() {
  return (
    <section className="mt-7">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="eyebrow">{t("zones.title")}</h3>
        <span className="text-[9px] text-[#626e70]">{t("zones.connected")}</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {ZONES.map((e) => (
          <div
            className={`relative overflow-hidden rounded-xl border border-white/5 p-5 ${e.className}`}
            key={e.number}
          >
            <svg className="absolute -right-5 -top-4 h-36 w-36 opacity-15" viewBox="0 0 150 140">
              <path d={e.lines} stroke="#d7ddd1" strokeWidth="9" fill="none" />
              <path d={e.lines} stroke="#101315" strokeWidth="1" fill="none" strokeDasharray="4 5" />
            </svg>
            <div className="relative flex items-center justify-between">
              <e.icon size={20} className="text-[#c6d0c5]" />
              <span className="font-heading text-2xl text-white/20">{e.number}</span>
            </div>
            <h3 className="relative mt-6 font-heading text-[25px] font-semibold">{e.name}</h3>
            <p className="relative mt-1 text-[8px] tracking-[.16em] text-[#98a39d]">{e.subtitle}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
