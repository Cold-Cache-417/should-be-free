import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall } from "../paywall/Paywall";
import {
  CONDITIONS_TIERS,
  DEFAULT_CITIES,
  DETAILS_TIERS,
  TEMP_TIERS,
  fetchForecast,
  searchCities,
  type CityForecast,
  type CityRef,
  type Condition,
} from "../../lib/weather";
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

const LockGlyph = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

export function Weather() {
  const [city, setCity] = useState<CityRef>(DEFAULT_CITIES[0]);
  const [forecast, setForecast] = useState<CityForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CityRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [tempUnlocked, setTempUnlocked] = useState(false);
  const [conditionsUnlocked, setConditionsUnlocked] = useState(false);
  const [detailsUnlocked, setDetailsUnlocked] = useState(false);
  const [paywall, setPaywall] = useState<null | "temp" | "conditions" | "details">(null);

  const load = useCallback(async (c: CityRef) => {
    setLoading(true);
    setError(null);
    try {
      setForecast(await fetchForecast(c));
    } catch {
      setError("the weather service is being as difficult as the pricing.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(city);
  }, [city, load]);

  /* Debounced geocoding — search the whole world. */
  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    const to = window.setTimeout(async () => {
      try {
        setResults(await searchCities(query));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => window.clearTimeout(to);
  }, [query]);

  const pickCity = (c: CityRef) => {
    setCity(c);
    setQuery("");
    setResults([]);
  };

  const f = forecast;

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
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{ background: f ? COND_GLOW[f.condition] : "none" }}
          />

          <div className="relative px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
            {/* header */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
                Weather
              </span>
              <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                °C · real data
              </span>
            </div>

            {/* search the world */}
            <div className="relative mt-4">
              <div className="flex items-center gap-2 rounded-xl border border-white/[0.09] bg-black/25 px-3 focus-within:border-amber-400/40 focus-within:ring-2 focus-within:ring-amber-400/20">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden>
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-3.2-3.2" />
                </svg>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search any city on Earth…"
                  aria-label="Search for a city"
                  className="h-10 w-full bg-transparent text-[13px] text-zinc-100 placeholder:text-zinc-600 outline-none"
                />
                {searching && (
                  <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-amber-400/30 border-t-amber-400" aria-hidden />
                )}
              </div>
              {results.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute inset-x-0 top-full z-10 mt-1.5 overflow-hidden rounded-xl border border-white/[0.1] bg-[#16161d] shadow-[0_24px_50px_-16px_rgba(0,0,0,0.8)]"
                >
                  {results.map((r) => (
                    <button
                      key={`${r.name}-${r.country}-${r.lat}-${r.lon}`}
                      type="button"
                      onClick={() => pickCity(r)}
                      className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:bg-white/[0.06]"
                    >
                      <span className="text-[13px] font-medium text-zinc-100">{r.name}</span>
                      <span className="text-[11px] text-zinc-500">{r.country}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </div>

            {/* quick picks */}
            <div className="mt-2.5 flex gap-1.5 overflow-x-auto pb-0.5">
              {DEFAULT_CITIES.map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => pickCity(c)}
                  className={cn(
                    "shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60",
                    c.name === city.name
                      ? "border-amber-400/40 bg-amber-400/15 text-amber-200"
                      : "border-white/[0.08] bg-white/[0.04] text-zinc-400 hover:text-zinc-200",
                  )}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-8 flex flex-col items-center py-8 text-center">
                <span className="h-6 w-6 animate-spin rounded-full border-2 border-amber-400/25 border-t-amber-400" aria-hidden />
                <p className="mt-3 text-[12.5px] text-zinc-500">Consulting a real weather service…</p>
              </div>
            )}

            {error && !loading && (
              <div className="mt-8 flex flex-col items-center py-6 text-center">
                <p className="text-[13px] text-zinc-400">{error}</p>
                <button
                  type="button"
                  onClick={() => void load(city)}
                  className="mt-3 rounded-xl border border-white/[0.1] bg-white/[0.05] px-4 py-2 text-[12px] font-semibold text-zinc-200 transition-colors hover:bg-white/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
                >
                  Try again
                </button>
              </div>
            )}

            {f && !loading && (
              <>
                {/* current conditions — staged: temperature, then conditions */}
                <div className="relative mt-5">
                  {(!tempUnlocked || !conditionsUnlocked) && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-3xl">
                      <span className="grid h-11 w-11 place-items-center rounded-full border border-amber-400/30 bg-amber-400/15 text-amber-300">
                        {LockGlyph}
                      </span>
                      {!tempUnlocked ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setPaywall("temp")}
                            className="mt-3 rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] px-5 py-2.5 text-[13px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
                          >
                            See the temperature — $5
                          </button>
                          <p className="mt-2 text-[10.5px] text-zinc-500">the degrees exist. you just can&rsquo;t.</p>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPaywall("conditions")}
                            className="mt-3 rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] px-5 py-2.5 text-[13px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
                          >
                            See the conditions — $10
                          </button>
                          <p className="mt-2 text-[10.5px] text-zinc-500">condition, stats and the full picture, behind glass</p>
                        </>
                      )}
                    </div>
                  )}
                  <motion.div
                    key={f.city}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="flex flex-col items-center py-6 text-center"
                  >
                    <p className="text-[13px] font-medium text-zinc-300">
                      {f.city}, {f.country}
                    </p>
                    <div className={cn("mt-1 flex items-start", !tempUnlocked && "select-none blur-[9px]")} aria-hidden={!tempUnlocked}>
                      <span className="font-display text-[84px] font-light leading-none tracking-[-0.03em] text-zinc-50">
                        {f.temp}°
                      </span>
                      <span className={cn("mt-3 text-[15px] font-medium text-zinc-400", !conditionsUnlocked && "blur-[9px]")} aria-hidden={!conditionsUnlocked}>
                        H:{f.hi}° L:{f.lo}°
                      </span>
                    </div>
                    <div className={cn("mt-2 flex items-center gap-2 text-[14px] font-medium text-zinc-300", !conditionsUnlocked && "select-none blur-[9px]")} aria-hidden={!conditionsUnlocked}>
                      <ConditionIcon icon={f.condition} className="h-4.5 w-4.5 text-amber-300" />
                      {f.conditionLabel}
                    </div>
                    <p className={cn("mt-1.5 text-[11.5px] text-zinc-500", !conditionsUnlocked && "select-none blur-[9px]")} aria-hidden={!conditionsUnlocked}>
                      Feels {f.feels}° · Humidity {f.humidity}% · Wind {f.wind} km/h
                    </p>
                  </motion.div>
                </div>

                {/* details — hourly + 7-day, blurred until you pay more */}
                <div className="relative mt-2">
                  {!detailsUnlocked && (
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setPaywall("details")}
                        className="rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] px-5 py-2.5 text-[13px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
                      >
                        Pay for details — $15
                      </button>
                      <p className="mt-2 text-[10.5px] text-zinc-500">hourly strip + the whole week, behind glass</p>
                    </div>
                  )}
                  <div className={cn(!detailsUnlocked && "select-none blur-[9px]")} aria-hidden={!detailsUnlocked}>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      Hourly · {f.city}
                    </p>
                    <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                      {f.hourly.map((h) => (
                        <div key={h.t} className="flex w-[52px] shrink-0 flex-col items-center gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-1 py-2.5">
                          <span className="text-[10px] font-medium text-zinc-500">{h.t}</span>
                          <ConditionIcon icon={h.icon} className="h-4 w-4 text-amber-300" />
                          <span className="text-[12.5px] font-semibold tabular-nums text-zinc-100">{h.temp}°</span>
                        </div>
                      ))}
                    </div>

                    <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                      7-day outlook
                    </p>
                    <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
                      {f.days.map((d) => (
                        <div key={d.day} className="flex items-center gap-3 border-b border-white/[0.05] px-3.5 py-2.5 last:border-b-0">
                          <span className="w-[72px] text-[12.5px] font-medium text-zinc-200">{d.day}</span>
                          <ConditionIcon icon={d.icon} className="h-4 w-4 text-amber-300" />
                          <div className="flex flex-1 items-center gap-2">
                            <span className="w-8 text-right text-[11.5px] tabular-nums text-zinc-500">{d.lo}°</span>
                            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-white/[0.07]">
                              <div
                                className="absolute inset-y-0 left-[15%] rounded-full bg-[linear-gradient(90deg,#ffb340,#ff9505)]"
                                style={{ width: `${Math.min(100, 22 + (d.hi - d.lo) * 4)}%` }}
                              />
                            </div>
                            <span className="w-8 text-[11.5px] font-semibold tabular-nums text-zinc-100">{d.hi}°</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}

            <p className="mt-4 text-center text-[10.5px] text-zinc-600">
              Real data from Open-Meteo, in °C like the rest of the planet. The weather is real. The pricing is not.
            </p>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywall === "temp" && f && (
          <Paywall
            key="wx-temp"
            tiers={TEMP_TIERS}
            value={`${f.temp}°`}
            line="Today's temperature"
            masked="••°"
            brand="Weather Pro"
            receiptBrand="WEATHER PRO"
            filename="temperature.bin"
            headline="The temperature is ready."
            subline="Your city's degrees are measured and locked. Seeing them is a premium feature."
            checkoutNote="The degrees are live and waiting. Enter payment details to see today's temperature."
            returnLabel="Back to the forecast"
            dialogLabel="Unlock today's temperature"
            product="weather"
            onClose={() => setPaywall(null)}
            onUnlock={() => setTempUnlocked(true)}
          />
        )}
        {paywall === "conditions" && f && (
          <Paywall
            key="wx-conditions"
            tiers={CONDITIONS_TIERS}
            value={`${f.conditionLabel} · H${f.hi}° L${f.lo}°`}
            line="Conditions & stats"
            masked="••"
            brand="Weather Pro"
            receiptBrand="WEATHER PRO"
            filename="conditions.bin"
            headline="The conditions are ready."
            subline="Condition, highs and lows, feels-like, humidity and wind — all measured, all locked. A premium feature."
            checkoutNote="The stats are computed and waiting. Enter payment details to see today's conditions."
            returnLabel="Back to the forecast"
            dialogLabel="Unlock today's conditions"
            product="weather"
            onClose={() => setPaywall(null)}
            onUnlock={() => setConditionsUnlocked(true)}
          />
        )}
        {paywall === "details" && f && (
          <Paywall
            key="wx-details"
            tiers={DETAILS_TIERS}
            value={`${f.hi}° · full week`}
            line="Forecast details"
            masked="••••"
            brand="Weather Pro"
            receiptBrand="WEATHER PRO"
            filename="forecast_details.bin"
            headline="The details are ready."
            subline="The hourly strip and the full seven-day outlook are compiled. They're locked behind the details paywall — a premium feature."
            checkoutNote="The specifics are computed and waiting. Enter payment details to see the details."
            returnLabel="Back to the forecast"
            dialogLabel="Unlock forecast details"
            product="weather"
            onClose={() => setPaywall(null)}
            onUnlock={() => setDetailsUnlocked(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
