import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { costFor, formatMoney, formatTime, type WatchPhase } from "../../lib/stopwatch";
import { cn } from "../../lib/cn";

const PAUSE_TIERS: PaywallTier[] = [
  {
    id: "pause-once",
    name: "Pause Now",
    price: "$10",
    period: "one-time",
    description: "Stop the meter for this run.",
    badge: "For this pause",
    featured: true,
    cta: "Pause my timer",
  },
  {
    id: "pause-monthly",
    name: "Pause Monthly",
    price: "$500",
    period: "/month",
    description: "Unlimited pauses.",
    cta: "Pause monthly",
  },
  {
    id: "pause-yearly",
    name: "Pause Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of pauses.",
    note: "Yes, it's cheaper.",
    cta: "Pause yearly",
  },
];

const DIAL = 240;
const C = 2 * Math.PI * 88; // circumference of the sweep arc (r=88)

/** The 60 tick marks of the dial — longer every 5 seconds, like a watch. */
function Ticks() {
  const ticks = [];
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 * Math.PI) / 180;
    const major = i % 5 === 0;
    const r1 = major ? 97 : 101;
    const r2 = 108.5;
    ticks.push(
      <line
        key={i}
        x1={120 + r1 * Math.sin(a)}
        y1={120 - r1 * Math.cos(a)}
        x2={120 + r2 * Math.sin(a)}
        y2={120 - r2 * Math.cos(a)}
        stroke={major ? "rgba(255,255,255,0.32)" : "rgba(255,255,255,0.13)"}
        strokeWidth={major ? 2.4 : 1.4}
        strokeLinecap="round"
      />,
    );
  }
  return <>{ticks}</>;
}

export function Stopwatch() {
  const [phase, setPhase] = useState<WatchPhase>("idle");
  const [accumulated, setAccumulated] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [pausedAt, setPausedAt] = useState(0);
  const startedRef = useRef<number | null>(null);

  /* Tick while running — wall-clock based, so the meter is honest even if
     the tab is backgrounded. The meter never stops until you pay. */
  useEffect(() => {
    if (phase !== "running") return;
    const id = window.setInterval(() => setNow(performance.now()), 50);
    return () => window.clearInterval(id);
  }, [phase]);

  const elapsedMs =
    phase === "running" && startedAt != null ? accumulated + (now - startedAt) : accumulated;

  const currentElapsed = useCallback(() => {
    const s = startedRef.current ?? performance.now();
    return accumulated + (performance.now() - s);
  }, [accumulated]);

  const start = () => {
    const t = performance.now();
    startedRef.current = t;
    setStartedAt(t);
    setAccumulated(0);
    setPausedAt(0);
    setPhase("running");
  };

  const resume = () => {
    const t = performance.now();
    startedRef.current = t;
    setStartedAt(t);
    setPhase("running");
  };

  const reset = () => {
    setPhase("idle");
    setAccumulated(0);
    setPausedAt(0);
    setStartedAt(null);
    startedRef.current = null;
  };

  /* Pause is a premium feature. The meter keeps running while the paywall
     is up — every second you deliberate is billed. */
  const requestPause = () => {
    if (paywallVisible) return;
    setPaywallVisible(true);
  };

  const unlockPause = useCallback(() => {
    const e = currentElapsed();
    setPausedAt(e);
    setAccumulated(e);
    setStartedAt(null);
    startedRef.current = null;
    setPhase("paused");
  }, [currentElapsed]);

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    window.setTimeout(() => document.getElementById("sw-primary")?.focus(), 80);
  }, []);

  const running = phase === "running";
  const paused = phase === "paused";
  const minuteFrac = (elapsedMs % 60000) / 60000;
  const cost = costFor(elapsedMs);
  const [main, cs] = splitTime(elapsedMs);

  const primaryIsStart = phase === "idle";
  const primaryIsPause = running;
  const primaryLabel = primaryIsStart ? "Start" : primaryIsPause ? "Pause — $10" : "Resume (free)";

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
        className="relative w-full max-w-[400px]"
      >
        {/* ambient glow behind the device */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,159,10,0.08),transparent_70%)]"
        />

        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.09] bg-[linear-gradient(180deg,#181820_0%,#121218_45%,#0e0e12_100%)] p-3.5 shadow-[0_40px_90px_-24px_rgba(0,0,0,0.75),0_16px_40px_-20px_rgba(0,0,0,0.55)] sm:p-4">
          {/* top hairline highlight */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          {/* soft inner glow */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_35%_at_50%_0%,rgba(255,255,255,0.045),transparent_70%)]"
          />

          {/* status */}
          <div role="status" aria-live="polite" className="px-2.5 pb-1 pt-3">
            <div className="flex h-6 items-center justify-between gap-3">
              <span className="min-w-0 truncate text-[12.5px] font-medium tracking-wide text-zinc-500">
                Your timer
              </span>
              {running && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" aria-hidden />
                  Meter running
                </span>
              )}
              {paused && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  Paused
                </span>
              )}
            </div>
          </div>

          {/* the dial */}
          <div className="relative flex justify-center px-2 pb-1 pt-5 sm:pt-6">
            <div className="relative h-[252px] w-[252px] sm:h-[264px] sm:w-[264px]">
              <svg viewBox={`0 0 ${DIAL} ${DIAL}`} className="h-full w-full -rotate-90" aria-hidden>
                {/* dial rim */}
                <circle
                  cx="120"
                  cy="120"
                  r="112"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="1.5"
                />
                <Ticks />
                {/* progress ring track */}
                <circle
                  cx="120"
                  cy="120"
                  r="88"
                  fill="none"
                  stroke="rgba(255,255,255,0.055)"
                  strokeWidth="6"
                />
                {/* the sweep — one full ring per minute, in billing amber */}
                <motion.circle
                  cx="120"
                  cy="120"
                  r="88"
                  fill="none"
                  stroke="url(#sw-ring)"
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={C}
                  animate={{ strokeDashoffset: C * (1 - minuteFrac) }}
                  transition={{ duration: 0.06, ease: "linear" }}
                />
                <defs>
                  <linearGradient id="sw-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffc75f" />
                    <stop offset="100%" stopColor="#ff9505" />
                  </linearGradient>
                </defs>
              </svg>

              {/* centered readout */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline tabular-nums tracking-[-0.02em] text-zinc-50">
                  <span className="text-[44px] font-extralight leading-none sm:text-[48px]">
                    {main}
                  </span>
                  <span className="ml-0.5 text-[26px] font-light leading-none text-amber-300">
                    .{cs}
                  </span>
                </div>

                <div className="mt-4 flex items-baseline gap-1.5">
                  <span
                    className={cn(
                      "text-[11px] font-medium tracking-wide",
                      running ? "text-zinc-400" : "text-zinc-600",
                    )}
                  >
                    {running ? "This moment is costing you" : paused ? "You paid to stop at" : "You pay to pause"}
                  </span>
                  <span
                    className={cn(
                      "text-[17px] font-semibold tabular-nums tracking-tight",
                      running ? "text-amber-300" : "text-zinc-500",
                    )}
                  >
                    {formatMoney(cost)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* actions — Apple-style capsules */}
          <div className="mt-5 grid grid-cols-2 gap-3 px-1.5 pb-2">
            <button
              type="button"
              onClick={reset}
              disabled={phase === "idle"}
              className="flex h-[54px] items-center justify-center rounded-full bg-white/[0.1] text-[15px] font-semibold text-zinc-100 transition-all duration-150 hover:bg-white/[0.16] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-white/[0.1]"
            >
              Reset
            </button>

            <button
              id="sw-primary"
              type="button"
              onClick={primaryIsStart ? start : primaryIsPause ? requestPause : resume}
              className={cn(
                "flex h-[54px] items-center justify-center gap-1.5 rounded-full text-[15px] font-semibold text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 active:scale-[0.97]",
                primaryIsPause
                  ? "bg-[#ff453a] shadow-[0_8px_28px_-10px_rgba(255,69,58,0.7)]"
                  : "bg-[#30d158] shadow-[0_8px_28px_-10px_rgba(48,209,88,0.55)]",
              )}
            >
              {primaryLabel}
            </button>
          </div>

          <p className="mt-3 text-center text-[11px] text-zinc-600">
            Time is money. Pausing is a premium feature.
          </p>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="sw-paywall"
            tiers={PAUSE_TIERS}
            value={formatTime(pausedAt)}
            line="Stop the meter"
            masked="••:••"
            brand="Stopwatch Pro"
            receiptBrand="STOPWATCH PRO"
            filename="time_pause.bin"
            headline="Time is money."
            subline="Your timer is still running — every second is being billed. Pausing the meter is a premium feature."
            checkoutNote="Your timer keeps running while you decide. Enter payment details to stop the meter."
            returnLabel="Back to the timer"
            dialogLabel="Pause your timer"
            onClose={closePaywall}
            onUnlock={unlockPause}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/** Split mm:ss from the centiseconds for the two-weight Apple readout. */
function splitTime(ms: number): [string, string] {
  const total = Math.max(0, Math.floor(ms));
  const cs = Math.floor(total / 10) % 100;
  const sec = Math.floor(total / 1000) % 60;
  const min = Math.floor(total / 60000) % 60;
  const hr = Math.floor(total / 3600000);
  const cc = String(cs).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return hr > 0 ? [`${hr}:${mm}:${ss}`, cc] : [`${mm}:${ss}`, cc];
}
