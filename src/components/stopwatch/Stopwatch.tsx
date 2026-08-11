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

const RING_R = 62;
const RING_C = 2 * Math.PI * RING_R;

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

  const primaryLabel = phase === "idle" ? "Start" : running ? "Pause — $10" : "Resume (free)";

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

          {/* the face */}
          <div className="relative flex justify-center px-2 pt-6 sm:pt-7">
            <div className="relative h-44 w-44 sm:h-48 sm:w-48">
              {/* progress ring */}
              <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
                <circle cx="70" cy="70" r={RING_R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                <motion.circle
                  cx="70"
                  cy="70"
                  r={RING_R}
                  fill="none"
                  stroke="url(#sw-ring)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray={RING_C}
                  animate={{ strokeDashoffset: RING_C * (1 - (running || paused ? minuteFrac : 0)) }}
                  transition={{ duration: 0.1, ease: "linear" }}
                />
                <defs>
                  <linearGradient id="sw-ring" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#ffb340" />
                    <stop offset="100%" stopColor="#ff9505" />
                  </linearGradient>
                </defs>
              </svg>

              {/* time */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display whitespace-nowrap text-[34px] font-light tabular-nums leading-none text-zinc-50">
                  {formatTime(elapsedMs)}
                </span>
                <span
                  className={cn(
                    "mt-2.5 font-mono text-[13px] font-medium tabular-nums tracking-wide",
                    running ? "text-amber-300" : "text-zinc-500",
                  )}
                >
                  {running ? "This moment is costing you" : paused ? "Stopped at" : "You pay to pause"}
                </span>
                <span
                  className={cn(
                    "font-display mt-0.5 text-[22px] font-semibold tabular-nums leading-none",
                    running ? "text-amber-300" : "text-zinc-400",
                  )}
                >
                  {formatMoney(cost)}
                </span>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="mt-6 px-1.5 pb-2">
            <button
              id="sw-primary"
              type="button"
              onClick={phase === "idle" ? start : running ? requestPause : resume}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
              style={{
                background: "linear-gradient(180deg,#ffb340,#ff9505)",
                color: "#2a1800",
                boxShadow:
                  "0 4px 20px -6px rgba(255,149,5,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {primaryLabel}
            </button>

            <button
              type="button"
              onClick={reset}
              disabled={phase === "idle"}
              className="mt-2.5 flex h-10 w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-[12.5px] font-semibold text-zinc-300 transition-all duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:cursor-default disabled:opacity-40 active:scale-[0.98]"
            >
              Reset
            </button>

            <p className="mt-3 text-center text-[11px] text-zinc-600">
              Time is money. Pausing is a premium feature.
            </p>
          </div>
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
