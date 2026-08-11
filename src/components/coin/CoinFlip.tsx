import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { flipCoin, faceLabel, type CoinFace } from "../../lib/coin";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { Coin, type CoinPhase } from "./Coin";

const FLIP_TIERS: PaywallTier[] = [
  {
    id: "quick",
    name: "Quick Answer",
    price: "$5",
    period: "one-time",
    description: "Reveal the result of this flip.",
    badge: "For this flip only",
    featured: true,
    cta: "Reveal result",
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$500",
    period: "/month",
    description: "Unlimited premium flips.",
    cta: "Start monthly",
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of premium flips.",
    note: "Yes, it's cheaper.",
    cta: "Go yearly",
  },
];

const LockIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3 w-3"
    aria-hidden
  >
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

const CheckIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-3 w-3"
    aria-hidden
  >
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);

export function CoinFlip() {
  const [phase, setPhase] = useState<CoinPhase>("idle");
  const [result, setResult] = useState<CoinFace | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const timers = useRef<number[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const startFlip = () => {
    if (phase === "flipping" || phase === "locked") return;
    setResult(flipCoin());
    setFlipCount((n) => n + 1);
    setPhase("flipping");

    /* The coin settles, then the result is locked and the paywall springs
       in — the face is never shown before payment. */
    timers.current.push(
      window.setTimeout(() => {
        setPhase("locked");
        timers.current.push(window.setTimeout(() => setPaywallVisible(true), 0));
      }, reduced.current ? 320 : 1900),
    );
  };

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    // Closing without paying resets the coin; after payment the result stays.
    setPhase((p) => (p === "locked" ? "idle" : p));
    window.setTimeout(() => document.getElementById("flip-btn")?.focus(), 80);
  }, []);

  const unlock = useCallback(() => setPhase("unlocked"), []);

  const mainText =
    phase === "locked"
      ? "••••"
      : phase === "unlocked" && result
        ? faceLabel(result)
        : phase === "flipping"
          ? "Flipping…"
          : "Ready";

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
                {flipCount > 0 ? `Flip #${flipCount}` : "Your flip"}
              </span>
              {phase === "locked" && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
                  {LockIcon}
                  Result locked
                </span>
              )}
              {phase === "unlocked" && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-300">
                  {CheckIcon}
                  Unlocked
                </span>
              )}
            </div>

            <div className="relative mt-1 flex h-9 items-center justify-end">
              <motion.span
                key={mainText}
                initial={{ opacity: 0.35, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                aria-hidden={phase === "locked"}
                className={`whitespace-nowrap text-[30px] font-light tabular-nums tracking-[-0.02em] leading-none ${
                  phase === "locked"
                    ? "select-none text-amber-300/80 tracking-[0.2em]"
                    : phase === "unlocked"
                      ? "text-zinc-100"
                      : "text-zinc-400"
                }`}
              >
                {mainText}
              </motion.span>
            </div>
          </div>

          {/* the coin */}
          <div className="px-4 pb-4 pt-6 sm:pt-8">
            <Coin phase={phase} result={result} flipCount={flipCount} reduced={reduced.current} />
            <motion.div
              aria-hidden
              animate={
                phase === "flipping"
                  ? { scaleX: [1, 0.8, 0.92, 1], opacity: [0.5, 0.3, 0.38, 0.5] }
                  : { scaleX: 1, opacity: 0.5 }
              }
              transition={{ duration: 1.9, times: [0, 0.35, 0.62, 1], ease: "easeInOut" }}
              className="mx-auto mt-4 h-4 w-2/3 rounded-full bg-black/70 blur-[10px]"
            />
          </div>

          {/* action */}
          <div className="px-1.5 pb-2">
            <button
              id="flip-btn"
              type="button"
              onClick={startFlip}
              disabled={phase === "flipping" || phase === "locked"}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:cursor-default disabled:opacity-60 active:scale-[0.98]"
              style={{
                background:
                  phase === "locked"
                    ? "linear-gradient(180deg,#5a5a62,#3d3d44)"
                    : "linear-gradient(180deg,#ffb340,#ff9505)",
                color: phase === "locked" ? "#d4d4d8" : "#2a1800",
                boxShadow:
                  phase === "locked"
                    ? "none"
                    : "0 4px 20px -6px rgba(255,149,5,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {phase === "flipping" ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Flipping…
                </>
              ) : phase === "locked" ? (
                "Result locked"
              ) : phase === "unlocked" ? (
                "Flip again — $5"
              ) : (
                <>
                  Flip the coin
                  <span aria-hidden className="text-[13px] opacity-70">
                    ⏤
                  </span>
                </>
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-zinc-600">
              Fair odds: 50/50. Fair price: $5.
            </p>
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="coin-paywall"
            tiers={FLIP_TIERS}
            value={result ? faceLabel(result) : ""}
            line={`Flip #${flipCount}`}
            masked="••••"
            brand="Flip Pro"
            receiptBrand="FLIP PRO"
            filename="flip_result.bin"
            headline="Your flip is ready."
            subline="Your coin flip completed successfully. The result has been encrypted and is awaiting release — a premium feature."
            checkoutNote="Your flip is complete. Enter payment details to release the result."
            returnLabel="Return to the flip"
            dialogLabel="Unlock your flip result"
            onClose={closePaywall}
            onUnlock={unlock}
          />
        )}
      </AnimatePresence>
    </>
  );
}
