import React from "react";
import { ShieldIcon, SirenIcon, RadioIcon, CarIcon } from "lucide-react";
import { t, formatNumber } from "../../i18n.js";
import { dutyText } from "./dutyText.js";

const formatTime = (seconds) => {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
};

/** A key, pressed for a moment through the shared controls (for clicks and taps on the HUD). */
function press(controls, code) {
  controls.current.keys[code] = true;
  setTimeout(() => delete controls.current.keys[code], 140);
}

function Prompt({ keyName, children, tone = "#c6dc77" }) {
  return (
    <div className="rounded-lg border px-4 py-2 text-xs" style={{ borderColor: `${tone}55`, background: "#101a20ee", color: tone }}>
      <kbd className="race-key mr-1">{keyName}</kbd>
      {children}
    </div>
  );
}

/** The records of the person (and the car) the player checked. */
function RecordCard({ card, plate }) {
  const row = (label, value, alarm = false) => (
    <div className="flex justify-between gap-3">
      <span className="text-[#8fa3a8]">{label}</span>
      <span className={alarm ? "font-bold text-[#ff7a6a]" : "text-[#e8eddf]"}>{value}</span>
    </div>
  );
  const licence = (value) =>
    value === "valid" ? t("card.valid") : value === "expired" ? t("card.expired") : value === "suspended" ? t("card.suspended") : t("card.noLicense");
  const vehicle = card?.vehicle || plate;
  return (
    <div className="hud-glass w-64 px-4 py-3 text-[10px] leading-5">
      <div className="eyebrow !text-[#88b7ef]">{t("card.title")}</div>
      {card?.name && (
        <>
          {row(t("card.name"), card.name)}
          {row(t("card.dob"), `${card.dob} (${card.age})`)}
          {row(t("card.license"), licence(card.license), card.license !== "valid")}
          {row(t("card.warrant"), card.warrant ? t(`warrant.${card.warrant}`) : t("card.none"), !!card.warrant)}
          {row(t("card.priors"), card.priors)}
        </>
      )}
      {card && card.bac !== null && row(t("card.bac"), `${card.bac.toFixed(3)}${card.bac >= 0.08 ? ` · ${t("card.overLimit")}` : ""}`, card.bac >= 0.08)}
      {card?.items &&
        row(t("card.items"), card.items.length ? card.items.map((item) => t(`item.${item}`)).join(", ") : t("card.none"), card.items.length > 0)}
      {vehicle && (
        <div className="mt-1 border-t border-white/10 pt-1">
          {row(t("card.plate"), vehicle.plate)}
          {row(
            t("card.model"),
            <span>
              <span className="mr-1 inline-block h-2 w-2 rounded-full align-middle" style={{ background: vehicle.colour }} />
              {vehicle.model}
            </span>,
          )}
          {row(t("card.owner"), vehicle.owner, vehicle.ownerWanted)}
          {row(t("card.registration"), vehicle.registration === "valid" ? t("card.valid") : t("card.expired"), vehicle.registration !== "valid")}
          {row(t("card.insurance"), vehicle.insurance === "valid" ? t("card.valid") : t("card.none"), vehicle.insurance !== "valid")}
          {vehicle.stolen && <div className="mt-1 text-center font-bold tracking-widest text-[#ff5a4e]">{t("card.stolen")}</div>}
        </div>
      )}
      {card?.charges?.length > 0 && (
        <div className="mt-1 border-t border-white/10 pt-1 text-[#ffb08a]">
          {t("card.charges")}: {card.charges.map((charge) => t(`charge.${charge}`)).join(", ")}
        </div>
      )}
    </div>
  );
}

/** The police job's HUD (RP mode): duty panel, call, menu, records, radio, radar, prompts, computer. */
export function PoliceHud({ hud, controls }) {
  const duty = hud.duty;
  const info = hud.policeInfo;
  if (!duty) {
    return (
      <>
        {hud.lockerNear && (
          <div className="pointer-events-auto absolute left-1/2 top-[40%] -translate-x-1/2" onClick={() => press(controls, "KeyE")}>
            <Prompt keyName="E" tone="#88b7ef">
              {t("duty.prompt.locker")}
              {info?.suspendedFor > 0 && <span className="ml-2 text-[#ff8f80]">{t("duty.suspended", { n: info.suspendedFor })}</span>}
            </Prompt>
          </div>
        )}
      </>
    );
  }
  const rankProgress = duty.nextXp ? Math.min(1, (duty.xp - duty.rankXp) / (duty.nextXp - duty.rankXp)) : 1;
  return (
    <>
      {/* Duty panel: rank, experience, shift pay; lights, siren, weapon, backup. */}
      <div className="hud-glass absolute left-4 top-28 w-60 px-4 py-3 sm:left-6">
        <div className="flex items-center justify-between">
          <span className="eyebrow flex items-center gap-1 !text-[#88b7ef]">
            <ShieldIcon size={12} /> {t("duty.title")} · {t(`rank.${duty.rank}`)}
          </span>
          <span className="text-[10px] tabular-nums text-[#9be08f]">${formatNumber(Math.floor(duty.shift.pay))}</span>
        </div>
        <div className="game-meter mt-2">
          <div className="bg-[#88b7ef]" style={{ width: `${rankProgress * 100}%` }} />
        </div>
        <div className="mt-2 flex flex-wrap gap-1 text-[9px]">
          <span className={`rounded px-1.5 py-0.5 ${duty.lights ? "bg-[#3a6bff] text-white" : "bg-white/10 text-[#9aa8ab]"}`}>L {t("duty.lights")}</span>
          <span className={`rounded px-1.5 py-0.5 ${duty.siren ? "animate-pulse bg-[#ff3b3b] text-white" : "bg-white/10 text-[#9aa8ab]"}`}>
            K {t("duty.siren")}
          </span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[#c9d4d6]">U {t(`tone.${duty.tone}`)}</span>
          <span className="rounded bg-white/10 px-1.5 py-0.5 text-[#c9d4d6]">X {t(`weapon.${duty.weapon}`)}</span>
          <span className={`rounded px-1.5 py-0.5 ${duty.backup ? "bg-[#2f6a3a] text-white" : "bg-white/10 text-[#9aa8ab]"}`}>B {t("duty.backup")}</span>
        </div>
        {duty.strikes > 0 && <p className="mt-1 text-[9px] text-[#ff9b8f]">{t("mdt.strikes")}: {duty.strikes}/3</p>}
        {/* The call: offered (Y/N), or under way with its arrow. */}
        {duty.offer && (
          <div className="mt-3 rounded-md border border-[#ffd23a]/40 bg-[#2a2410cc] p-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#ffd23a]">
              <RadioIcon size={12} /> {t(`call.${duty.offer.type}`)} <span className="ml-auto tabular-nums text-[#c9b56b]">{duty.offer.left}s</span>
            </div>
            <p className="mt-1 text-[10px] text-[#e8eddf]">{duty.offer.place}</p>
            <div className="pointer-events-auto mt-2 flex gap-2 text-[10px]">
              <button className="rounded bg-[#3d6b2f] px-2 py-1 text-white" onClick={() => press(controls, "KeyY")}>
                Y {t("duty.accept")}
              </button>
              <button className="rounded bg-[#5a2a24] px-2 py-1 text-white" onClick={() => press(controls, "KeyN")}>
                N {t("duty.decline")}
              </button>
            </div>
          </div>
        )}
        {duty.callout && (
          <div className="mt-3 rounded-md border border-[#ff7a6a]/40 bg-[#2a1614cc] p-2">
            <div className="flex items-center gap-1 text-[10px] font-bold text-[#ff9b8f]">
              <SirenIcon size={12} /> {t(`call.${duty.callout.type}`)}
            </div>
            <p className="mt-1 text-[10px] text-[#e8eddf]">{duty.callout.place}</p>
            <div className="mt-1 flex items-center gap-2 text-[11px] text-[#c6dc77]">
              <span className="inline-block text-base leading-none" style={{ transform: `rotate(${(-duty.callout.bearing * 180) / Math.PI}deg)` }}>
                ▲
              </span>
              {Math.round(duty.callout.distance)} m<span className="ml-auto text-[8px] text-[#8f989b]">N: ✕</span>
            </div>
          </div>
        )}
        {duty.objective && <p className="mt-2 text-[10px] leading-snug text-[#ffe08a]">{t(duty.objective)}</p>}
      </div>

      {/* Radio feed. */}
      <div className="pointer-events-none absolute left-4 top-[25rem] hidden w-60 space-y-1 sm:left-6 sm:block">
        {duty.feed
          .filter((message) => message.age < 14)
          .slice(0, 3)
          .map((message, index) => (
            <div key={index} className="rounded bg-[#0b1418cc] px-2 py-1 text-[9px] leading-snug text-[#b9d0e6]" style={{ opacity: Math.max(0.25, 1 - message.age / 14) }}>
              <RadioIcon size={9} className="mr-1 inline" />
              {dutyText(message.key, message.vars)}
            </div>
          ))}
      </div>

      {/* Talking with someone: what was said, and the menu (1-9, or tap). */}
      {(duty.say || duty.asked) && (
        <div className="pointer-events-none absolute bottom-40 left-1/2 w-[min(90vw,30rem)] -translate-x-1/2 space-y-1 text-center text-xs">
          {duty.asked && (
            <p className="rounded bg-[#0d1d2acc] px-3 py-1 text-[#9fc3ff]">
              <b>{t("duty.you")}:</b> {t(duty.asked)}
            </p>
          )}
          {duty.say && (
            <p className="rounded bg-[#1d1a10cc] px-3 py-1 text-[#ffe9b0]">
              <b>{duty.say.who}:</b> “{t(duty.say.key)}”
            </p>
          )}
        </div>
      )}
      {duty.menu.length > 0 && (
        <div className="hud-glass pointer-events-auto absolute right-4 top-[38%] w-56 -translate-y-1/2 px-3 py-2 sm:right-6">
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-[#88b7ef]">{duty.focusName || "—"}</div>
          {duty.menu.map((option, index) => (
            <button
              key={index}
              className="flex w-full items-center gap-2 rounded px-1.5 py-1 text-left text-[11px] text-[#e8eddf] hover:bg-white/10"
              onClick={() => press(controls, `Digit${index + 1}`)}
            >
              <kbd className="race-key !min-w-0 !px-1">{index + 1}</kbd>
              {t(option.key)}
              {option.fine ? <span className="ml-auto text-[9px] text-[#9be08f]">${option.fine}</span> : null}
            </button>
          ))}
        </div>
      )}
      {(duty.card || duty.plateCard) && (
        <div className="absolute right-4 top-24 sm:right-6">
          <RecordCard card={duty.card} plate={duty.plateCard} />
        </div>
      )}

      {/* In the car: the radar and the plate reader. */}
      {duty.target && !hud.onFoot && (
        <div className="absolute bottom-6 right-[15.5rem] hidden rounded-lg border border-[#88b7ef]/30 bg-[#0b1418e6] px-3 py-2 text-[10px] text-[#b9d0e6] sm:right-[17.5rem] sm:block">
          <div className="flex items-center gap-1 font-semibold">
            <CarIcon size={11} /> {t("duty.radar")}
          </div>
          <div className={`race-title text-2xl tabular-nums ${duty.target.speed > duty.target.limit + 8 ? "text-[#ff7a6a]" : "text-white"}`}>
            {duty.target.speed} <span className="text-[9px]">km/h</span>
          </div>
          <div className="text-[9px] text-[#8fa3a8]">{t("duty.limit", { n: duty.target.limit })} · {duty.target.plate}</div>
        </div>
      )}
      {duty.alert && (
        <div className="absolute left-1/2 top-16 -translate-x-1/2 animate-pulse rounded-lg border border-[#ff5a4e]/60 bg-[#3a1210ee] px-4 py-2 text-center text-xs font-bold text-[#ffb0a8]">
          {t("duty.anpr")}: {duty.alert.plate} · {duty.alert.flags.map((flag) => t(`flag.${flag}`)).join(", ")}
        </div>
      )}

      {/* What E does here. */}
      <div className="pointer-events-auto absolute left-1/2 top-[44%] flex -translate-x-1/2 flex-col items-center gap-2" onClick={() => press(controls, "KeyE")}>
        {hud.lockerNear && <Prompt keyName="E" tone="#88b7ef">{t("duty.prompt.locker")}</Prompt>}
        {duty.canTackle && <Prompt keyName="E" tone="#ff9b8f">{t("duty.prompt.tackle")}</Prompt>}
        {duty.towPrompt && <Prompt keyName="E">{t("duty.prompt.tow")}</Prompt>}
        {duty.atJail && <Prompt keyName="E" tone="#ffd23a">{t("duty.prompt.book")}</Prompt>}
        {hud.stopPrompt && <Prompt keyName="E">{t("duty.prompt.stop")}</Prompt>}
        {duty.target && !hud.onFoot && (duty.lights ? <Prompt keyName="E">{t("duty.prompt.pullOver")}</Prompt> : <Prompt keyName="L">{t("duty.prompt.lightsFirst")}</Prompt>)}
      </div>

      {/* The police computer (M). */}
      {duty.mdt && (
        <div className="hud-glass absolute left-1/2 top-1/2 w-[min(92vw,34rem)] -translate-x-1/2 -translate-y-1/2 px-5 py-4 text-[11px] text-[#d6e2e4]">
          <div className="flex items-center justify-between">
            <span className="eyebrow !text-[#88b7ef]">{t("mdt.title")}</span>
            <span className="text-[9px] text-[#8f989b]">{t("mdt.close")}</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {[
              ["mdt.time", formatTime(duty.shift.time)],
              ["mdt.arrests", duty.shift.arrests],
              ["mdt.citations", duty.shift.citations],
              ["mdt.calls", duty.shift.calls],
              ["mdt.pay", `$${formatNumber(Math.floor(duty.shift.pay))}`],
              ["mdt.strikes", `${duty.strikes}/3`],
            ].map(([key, value]) => (
              <div key={key} className="rounded bg-white/5 py-2">
                <div className="race-title text-lg text-white">{value}</div>
                <div className="text-[9px] text-[#8fa3a8]">{t(key)}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 text-[10px]">
            <span className="text-[#8fa3a8]">{t("mdt.call")}: </span>
            {duty.callout ? `${t(`call.${duty.callout.type}`)} · ${duty.callout.place}` : t("mdt.noCall")}
          </div>
          <div className="mt-1 text-[10px] text-[#8fa3a8]">
            {t("locker.rank")}: <span className="text-white">{t(`rank.${duty.rank}`)}</span> · XP {duty.xp}
            {duty.nextXp ? ` / ${duty.nextXp}` : ""}
          </div>
          <div className="mt-3 text-[9px] uppercase tracking-widest text-[#88b7ef]">{t("mdt.radio")}</div>
          {duty.feed.map((message, index) => (
            <p key={index} className="text-[10px] leading-snug text-[#b9d0e6]">
              {dutyText(message.key, message.vars)}
            </p>
          ))}
          <p className="mt-3 text-[9px] leading-snug text-[#8f989b]">{t("locker.controls")}</p>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-2 left-1/2 hidden -translate-x-1/2 translate-y-[-1rem] text-[8px] tracking-widest text-[#88b7ef]/70 xl:block">
        {t("duty.keys")}
      </div>
    </>
  );
}
