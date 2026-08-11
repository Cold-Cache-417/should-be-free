import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall } from "../paywall/Paywall";
import { CITIES, CONDITIONS, cityById, TOMORROW_TIERS, type Condition } from "../../lib/weather";
import { cn } from "../../lib/cn";

const COND_GLOW: Record<Condition, string> = {
  clear:
    "radial-gradient(120% 90% at 50% -10%, rgba(255,183,77,0.22), transparent 60%), radial-gradient(120% 130% at 50% 130%, rgba(56,89,189,0.16), transparent 60%)",
  partly:
    "radial-gradient(120% 90% at 50% -10%, rgba(182,184,222,0.16), transparent 60%), radial-gradient(120% 130% at 50% 130%, rgba(70,90,140,0.18), transparent 60%)",
  cloudy: "radial-gradient(120% 90% at 50% -10%, rgba(150,160,190,0.14), transparent 60%)",
  rain: "radial-gradient(120% 90% at 50% -10%, rgba(120,150,190,0.15), transparent 60%), radial-gradient(120% 130% at 50% 130%, rgba(40,70,110,0.24), transparent 60%)",
  storm:
    "radial-gradient(120% 90% at 50% -10%, rgba(142,112,168,0.18), transparent 60%), radial-gradient(120% 130% at 50% 130%, rgba(30,40,80,0.3), transparent 60%)",
  snow: "radial-gradient(120% 90% at 50% -10%, rgba(200,215,235,0.16), transparent 60%)",
};

function ConditionIcon({ icon, className }: { icon: Condition; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className: cn("h-5 w-5", className),
    "aria-hidden": true,
  };
  switch (icon) {
    case "clear":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.8v2M12 19.2v2M2.8 12h2M19.2 12h2M5.5 5.5l1.4 1.4M17.1 17.1l1.4 1.4M18.5 5.5l-1.4 1.4M6.9 17.1l-1.4 1.4" />
        </svg>
      );
    case "partly":
      return (
        <svg {...common}>
          <circle cx="9" cy="9" r="3.5" />
          <path d="M9 3.2v1.6M4.2 9H2.6M9 14.8v-1.6M5 5l1.1 1.1" />
          <path d="M16 18.5a4 4 0 0 1-.6-7.9 5 5 0 0 1 9.1 2.1A2.8 2.8 0 0 1 23 18.5H16Z" transform="translate(-1.5 0)" />
        </svg>
      );
    case "cloudy":
      return (
        <svg {...common}>
          <path d="M7 18.5a3.5 3.5 0 0 1 .6-6.9 5 5 0 0 1 9.5 1.1A3.2 3.2 0 0 1 16.5 18.5H7Z" />
          <path d="M5.5 14.5A3 3 0 0 1 6 8.6" />
        </svg>
      );
    case "rain":
      return (
        <svg {...common}>
          <path d="M7 15.5a3.5 3.5 0 0 1 .6-6.9 5 5 0 0 1 9.5 1.1A3.2 3.2 0 0 1 16.5 15.5H7Z" />
          <path d="M8.5 18.5v2M12 18.5v2.4M15.5 18.5v2" />
        </svg>
      );
    case "storm":
      return (
        <svg {...common}>
          <path d="M7 15.5a3.5 3.5 0 0 1 .6-6.9 5 5 0 0 1 9.5 1.1A3.2 3.2 0 0 1 16.5 15.5H7Z" />
          <path d="M10.5 17.5 9 21.5M13.5 17.5l-1.6 4" />
        </svg>
      );
    case "snow":
      return (
        <svg {...common}>
          <path d="M7 15.5a3.5 3.5 0 0 1 .6-6.9 5 5 0 0 1 9.5 1.1A3.2 3.2 0 0 1 16.5 15.5H7Z" />
          <path d="M10 19l.8 1.5M14 19l-.8 1.5M12 20.8V19" />
        </svg>
      );
  }
}

export function Weather() {
  const [cityId, setCityId] = useState("cupertino");
  const [unlocked, setUnlocked] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const f = cityById(cityId);
  const tomorrow = f.days[1];

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
        className="relative w-full max-w-[400px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,159,10,0.07),transparent_70%)]"
        />

        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.09] bg-[linear-gradient(180deg,#181820_0%,#121218_45%,#0e0e12_100%)] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.75),0_16px_40px_-20px_rgba(0,0,0,0.55)]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />

          {/* condition glow — shifts with the forecast */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: COND_GLOW[f.condition] }}
          />

          <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            {/* header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                Weather
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Today free · Tomorrow $10
              </span>
            </div>

            {/* city picker */}
            <div className="mt-4 flex gap-1.5 overflow-x-auto pb-0.5">
              {CITIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCityId(c.id)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
                    c.id === cityId
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                      : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {c.city}
                </button>
              ))}
            </div>

            {/* current conditions */}
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="mt-5 flex flex-col items-center text-center"
            >
              <p className="text-[13px] font-medium text-zinc-300">
                {f.city}, {f.country}
              </p>
              <div className="mt-1 flex items-start">
                <span className="font-display text-[84px] font-light leading-none tracking-[-0.03em] text-zinc-50">
                  {f.temp}°
                </span>
                <span className="mt-3 text-[15px] font-medium text-zinc-400">
                  H:{f.hi}° L:{f.lo}°
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-[14px] font-medium text-zinc-300">
                <ConditionIcon icon={f.condition} className="h-4.5 w-4.5 text-amber-300" />
                {f.conditionLabel}
              </div>
              <p className="mt-1.5 text-[11.5px] text-zinc-500">
                Humidity {f.humidity}% · Wind {f.wind} mph
              </p>
            </motion.div>

            {/* hourly strip — today, free */}
            <div className="mt-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Hourly · today
              </p>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {f.hourly.map((h) => (
                  <div
                    key={h.t}
                    className="flex w-[52px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-1 py-2.5"
                  >
                    <span className="text-[10px] font-medium text-zinc-500">{h.t}</span>
                    <ConditionIcon icon={h.icon} className="h-4 w-4 text-amber-300" />
                    <span className="text-[12.5px] font-semibold tabular-nums text-zinc-100">
                      {h.temp}°
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* daily list — tomorrow is the product */}
            <div className="mt-5">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                  7-day forecast
                </p>
                <span className="text-[10px] text-zinc-600">courtesy of a static array</span>
              </div>
              <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
                {f.days.map((d, i) =>
                  unlocked || i < 1 ? (
                    <div
                      key={d.day}
                      className="flex items-center gap-3 border-b border-white/[0.05] px-3.5 py-2.5 last:border-b-0"
                    >
                      <span className="w-[72px] text-[12.5px] font-medium text-zinc-200">{d.day}</span>
                      <ConditionIcon icon={d.icon} className="h-4 w-4 text-amber-300" />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="w-7 text-right text-[11.5px] tabular-nums text-zinc-500">{d.lo}°</span>
                        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <div
                            className="absolute inset-y-0 left-[15%] rounded-full bg-[linear-gradient(90deg,#ffb340,#ff9505)]"
                            style={{
                              width: `${Math.min(100, 22 + (d.hi - d.lo) * 4)}%`,
                            }}
                          />
                        </div>
                        <span className="w-7 text-[11.5px] font-semibold tabular-nums text-zinc-100">{d.hi}°</span>
                      </div>
                    </div>
                  ) : (
                    <div key={d.day} className="flex items-center gap-3 border-b border-white/[0.05] px-3.5 py-2.5 last:border-b-0">
                      <span className="w-[72px] text-[12.5px] font-medium text-zinc-300">{d.day}</span>
                      <span className="h-4 w-4 rounded-full border border-amber-400/30 bg-amber-400/10" aria-hidden />
                      <div className="flex flex-1 items-center gap-2">
                        <span className="w-7 text-right text-[11.5px] tabular-nums text-zinc-600">••</span>
                        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                          <div className="h-full w-[34%] rounded-full bg-white/[0.09]" />
                        </div>
                        <span className="w-7 text-[11.5px] tabular-nums text-zinc-600">••</span>
                      </div>
                    </div>
                  ),
                )}
              </div>

              {!unlocked && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.35 }}
                  className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-amber-400/25 bg-[linear-gradient(180deg,rgba(255,159,10,0.12),rgba(255,159,10,0.04))] px-4 py-3"
                >
                  <div>
                    <p className="text-[12.5px] font-semibold text-zinc-100">Tomorrow is a premium feature.</p>
                    <p className="text-[11px] text-zinc-500">
                      The future costs money. Today is free.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPaywallVisible(true)}
                    className="shrink-0 rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] px-4 py-2.5 text-[12.5px] font-semibold text-[#2a1800] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
                  >
                    Unlock — $10
                  </button>
                </motion.div>
              )}
            </div>

            <p className="mt-4 text-center text-[10.5px] text-zinc-600">
              Forecast generated by a static array. Meteorology sold separately.
            </p>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="wx-paywall"
            tiers={TOMORROW_TIERS}
            value={`${tomorrow.hi}° · ${CONDITIONS[tomorrow.icon]}`}
            line="Tomorrow's forecast"
            masked="••°"
            brand="Weather Pro"
            receiptBrand="WEATHER PRO"
            filename="tomorrow.bin"
            headline="Tomorrow is ready."
            subline="Our meteorologists (a static array) have finished forecasting the future. It's encrypted and awaiting release — a premium feature."
            checkoutNote="Your tomorrow is forecast and waiting. Enter payment details to release it."
            returnLabel="Back to the forecast"
            dialogLabel="Unlock tomorrow's forecast"
            onClose={() => setPaywallVisible(false)}
            onUnlock={() => setUnlocked(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
