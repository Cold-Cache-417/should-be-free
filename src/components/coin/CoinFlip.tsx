import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { flipCoin, faceLabel, type CoinFace } from "../../lib/coin";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { cn } from "../../lib/cn";
import { Coin, type CoinPhase } from "./Coin";

/** The $5 reveal — for fair AND rigged flips alike. */
const REVEAL_TIERS: PaywallTier[] = [
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

/** The rig — guarantee the outcome. */
const RIG_TIERS: PaywallTier[] = [
  {
    id: "rig-flip",
    name: "Rig One Flip",
    price: "$25",
    period: "one-time",
    description: "Guarantee the outcome of your next flip.",
    badge: "For one flip",
    featured: true,
    cta: "Rig my flip",
  },
  {
    id: "rig-monthly",
    name: "Rig Monthly",
    price: "$700",
    period: "/month",
    description: "Unlimited rigged flips.",
    cta: "Rig monthly",
  },
  {
    id: "rig-yearly",
    name: "Rig Yearly",
    price: "$2,500",
    period: "/year",
    description: "A whole year of rigged flips.",
    note: "Yes, it's cheaper.",
    cta: "Rig yearly",
  },
];

type RigTier = "per-flip" | "monthly" | "yearly";

interface RigState {
  tier: RigTier;
  unlimited: boolean;
}

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

const DiceIcon = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4"
    aria-hidden
  >
    <rect x="4.5" y="4.5" width="15" height="15" rx="3.5" />
    <circle cx="9" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="15" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
    <circle cx="9" cy="15" r="1.1" fill="currentColor" stroke="none" />
  </svg>
);

export function CoinFlip() {
  const [phase, setPhase] = useState<CoinPhase>("idle");
  const [result, setResult] = useState<CoinFace | null>(null);
  const [flipCount, setFlipCount] = useState(0);
  const [paywall, setPaywall] = useState<null | "result" | "rig">(null);
  const [rig, setRig] = useState<RigState | null>(null);
  const [chosenSide, setChosenSide] = useState<CoinFace | null>(null);
  const timers = useRef<number[]>([]);
  const reduced = useRef(false);

  useEffect(() => {
    reduced.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    return () => timers.current.forEach((t) => window.clearTimeout(t));
  }, []);

  const startFlip = () => {
    if (phase === "flipping" || phase === "locked") return;

    const isRigged = rig != null && chosenSide != null;
    const face = isRigged ? chosenSide : flipCoin();
    setResult(face);
    setFlipCount((n) => n + 1);
    setChosenSide(null);
    setPhase("flipping");

    // A per-flip rig is consumed the moment the flip is thrown.
    if (isRigged && rig && !rig.unlimited) setRig(null);

    /* The coin settles. Rigged flips reveal immediately — you already paid
       for the outcome. Fair flips lock and hit the reveal paywall. */
    timers.current.push(
      window.setTimeout(() => {
        if (isRigged) {
          setPhase("unlocked");
        } else {
          setPhase("locked");
          timers.current.push(window.setTimeout(() => setPaywall("result"), 0));
        }
      }, reduced.current ? 320 : 1900),
    );
  };

  const closePaywall = useCallback(() => {
    setPaywall(null);
    // Closing without paying resets the coin; after payment the result stays.
    setPhase((p) => (p === "locked" ? "idle" : p));
    window.setTimeout(() => document.getElementById("flip-btn")?.focus(), 80);
  }, []);

  const unlockResult = useCallback(() => setPhase("unlocked"), []);

  const unlockRig = useCallback((tier: PaywallTier) => {
    if (tier.id === "rig-flip") setRig({ tier: "per-flip", unlimited: false });
    else setRig({ tier: tier.id === "rig-monthly" ? "monthly" : "yearly", unlimited: true });
  }, []);

  const openRig = () => {
    if (paywall !== null) return;
    setPaywall("rig");
  };

  const flipping = phase === "flipping";
  const locked = phase === "locked";
  const rigged = rig != null;
  const flipDisabled = flipping || locked || (rigged && chosenSide == null);

  const mainText =
    phase === "locked"
      ? "••••"
      : phase === "unlocked" && result
        ? faceLabel(result)
        : phase === "flipping"
          ? "Flipping…"
          : "Ready";

  const flipLabel = flipping
    ? "Flipping…"
    : locked
      ? "Result locked"
      : phase === "unlocked"
        ? rigged
          ? "Flip again — $25"
          : "Flip again — $5"
        : rigged && chosenSide == null
          ? "Choose a side to flip"
          : rigged && chosenSide
            ? `Flip rigged — ${faceLabel(chosenSide)}`
            : "Flip the coin";

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
              {rigged && (
                <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-rose-400/30 bg-rose-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-rose-300">
                  {DiceIcon}
                  Rig active
                </span>
              )}
              {locked && (
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
                aria-hidden={locked}
                className={cn(
                  "font-display whitespace-nowrap text-[34px] font-light leading-none",
                  locked
                    ? "select-none tracking-[0.2em] text-amber-300/80"
                    : phase === "unlocked"
                      ? "text-zinc-100 tracking-[-0.01em]"
                      : "italic text-zinc-400 tracking-[-0.01em]",
                )}
              >
                {mainText}
              </motion.span>
            </div>
          </div>

          {/* the coin */}
          <div className="px-4 pb-4 pt-6 sm:pt-8">
            <Coin phase={phase} result={result} flipCount={flipCount} reduced={reduced.current} />
            <p className="mt-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-600">
              Heads — Epstein <span aria-hidden className="mx-1 text-zinc-700">·</span> Tails — Diddy
            </p>
            <motion.div
              aria-hidden
              animate={
                phase === "flipping"
                  ? { scaleX: [1, 0.8, 0.92, 1], opacity: [0.5, 0.3, 0.38, 0.5] }
                  : { scaleX: 1, opacity: 0.5 }
              }
              transition={{ duration: 1.9, times: [0, 0.35, 0.62, 1], ease: "easeInOut" }}
              className="mx-auto mt-3 h-4 w-2/3 rounded-full bg-black/70 blur-[10px]"
            />
          </div>

          {/* action */}
          <div className="px-1.5 pb-2">
            {rigged && (
              <div className="mb-3 rounded-2xl border border-rose-400/20 bg-rose-400/[0.05] p-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-rose-300">
                    Rig the outcome
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    {rig?.unlimited ? "Unlimited rigs" : "1 rig left"}
                  </span>
                </div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setChosenSide("heads")}
                    aria-pressed={chosenSide === "heads"}
                    className={cn(
                      "h-10 rounded-xl border text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:scale-[0.97]",
                      chosenSide === "heads"
                        ? "border-rose-400/50 bg-rose-400/15 text-rose-100"
                        : "border-white/[0.09] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]",
                    )}
                  >
                    Heads — Epstein
                  </button>
                  <button
                    type="button"
                    onClick={() => setChosenSide("tails")}
                    aria-pressed={chosenSide === "tails"}
                    className={cn(
                      "h-10 rounded-xl border text-[12px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:scale-[0.97]",
                      chosenSide === "tails"
                        ? "border-rose-400/50 bg-rose-400/15 text-rose-100"
                        : "border-white/[0.09] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]",
                    )}
                  >
                    Tails — Diddy
                  </button>
                </div>
              </div>
            )}

            <button
              id="flip-btn"
              type="button"
              onClick={startFlip}
              disabled={flipDisabled}
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[15px] font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 disabled:cursor-default disabled:opacity-60 active:scale-[0.98]"
              style={{
                background:
                  locked
                    ? "linear-gradient(180deg,#5a5a62,#3d3d44)"
                    : rigged
                      ? "linear-gradient(180deg,#ff6b6b,#e11d48)"
                      : "linear-gradient(180deg,#ffb340,#ff9505)",
                color: locked ? "#d4d4d8" : "#2a1800",
                boxShadow:
                  locked
                    ? "none"
                    : rigged
                      ? "0 4px 20px -6px rgba(225,29,72,0.55), inset 0 1px 0 rgba(255,255,255,0.3)"
                      : "0 4px 20px -6px rgba(255,149,5,0.65), inset 0 1px 0 rgba(255,255,255,0.35)",
              }}
            >
              {flipping ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Flipping…
                </>
              ) : (
                flipLabel
              )}
            </button>
            <p className="mt-3 text-center text-[11px] text-zinc-600">
              {rigged
                ? "Rigged odds: 100/0 · Rig price: $25"
                : "Fair odds: 50/50 · Fair price: $5."}
            </p>

            {!rigged && (
              <button
                type="button"
                onClick={openRig}
                className="mt-2 flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-rose-400/25 bg-rose-400/[0.06] text-[12.5px] font-semibold text-rose-300 transition-all duration-150 hover:bg-rose-400/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/60 active:scale-[0.98]"
              >
                {DiceIcon}
                Pay to rig it — $25 per flip
              </button>
            )}
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywall === "result" && (
          <Paywall
            key="coin-paywall"
            tiers={REVEAL_TIERS}
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
            product="flip"
            onClose={closePaywall}
            onUnlock={unlockResult}
          />
        )}

        {paywall === "rig" && (
          <Paywall
            key="rig-paywall"
            tiers={RIG_TIERS}
            value="RIGGED"
            line="Rig your next flip"
            masked="••••"
            brand="Rig Service"
            receiptBrand="RIG SERVICE"
            filename="rig_token.bin"
            headline="Your rig is ready."
            subline="Your request to influence a fair coin has been approved. The rig has been encrypted and is awaiting release — a premium feature."
            checkoutNote="Your rig is ready to deploy. Enter payment details to activate it."
            returnLabel="Return to the flip"
            dialogLabel="Rig your flip"
            product="flip"
            onClose={closePaywall}
            onUnlock={unlockRig}
          />
        )}
      </AnimatePresence>
    </>
  );
}
