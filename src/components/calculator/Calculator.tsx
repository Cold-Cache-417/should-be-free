import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  calcReducer,
  freshState,
  expressionText,
  type CalcAction,
  type Digit,
} from "../../lib/calcReducer";
import { KEY_TO_OP, formatNumber } from "../../lib/calculator";
import { Display } from "./Display";
import { Keypad } from "./Keypad";
import { Paywall, type PaywallTier } from "../paywall/Paywall";

const CALC_TIERS: PaywallTier[] = [
  {
    id: "quick",
    name: "Quick Answer",
    price: "$20",
    period: "one-time",
    description: "Reveal the answer to your current calculation.",
    badge: "For this answer only",
    featured: true,
    cta: "Unlock answer",
  },
  {
    id: "monthly",
    name: "Pro Monthly",
    price: "$250",
    period: "/month",
    description: "Unlimited access to premium calculations.",
    cta: "Start monthly",
  },
  {
    id: "yearly",
    name: "Pro Yearly",
    price: "$2,000",
    period: "/year",
    description: "Unlimited premium calculations for an entire year.",
    note: "Yes, I'm generous. I made it cheaper.",
    cta: "Go yearly",
  },
];

const OP_KEY_ID: Record<string, string> = {
  "+": "key-add",
  "−": "key-sub",
  "*": "key-mul",
  "/": "key-div",
};

export function Calculator() {
  const [state, dispatch] = useReducer(calcReducer, undefined, freshState);
  const [pressedKey, setPressedKey] = useState<string | null>(null);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const flashTimer = useRef<number | null>(null);

  const press = useCallback((keyId: string, action: CalcAction) => {
    dispatch(action);
    setPressedKey(keyId);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => setPressedKey(null), 140);
  }, []);

  /* The paywall comes up immediately — no reveal delay, no answer ever
     shown. The 0ms timer just lets the locked display paint behind the
     sheet as it springs in. */
  useEffect(() => {
    if (state.phase !== "locked") return;
    const t = window.setTimeout(() => setPaywallVisible(true), 0);
    return () => window.clearTimeout(t);
  }, [state.phase]);

  /* Keyboard input. The listener is attached once and reads live state via
     refs, so keys typed across state transitions (e.g. right after closing
     the paywall) are never dropped by a stale closure. */
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const paywallRef = useRef(paywallVisible);
  useEffect(() => {
    paywallRef.current = paywallVisible;
  }, [paywallVisible]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (paywallRef.current || stateRef.current.phase === "locked") {
        return; // the paywall owns the keys
      }

      if (/^[0-9]$/.test(e.key)) {
        press(`key-${e.key}`, { type: "digit", digit: e.key as Digit });
      } else if (e.key === ".") {
        press("key-dot", { type: "decimal" });
      } else if (e.key === "+" || e.key === "-" || e.key === "*" || e.key === "/") {
        e.preventDefault();
        press(OP_KEY_ID[e.key], { type: "op", op: KEY_TO_OP[e.key] });
      } else if (e.key === "Enter" || e.key === "=") {
        e.preventDefault();
        press("key-eq", { type: "equals" });
      } else if (e.key === "Backspace") {
        e.preventDefault();
        press("key-backspace", { type: "backspace" });
      } else if (e.key === "Escape") {
        press("key-ac", { type: "clear" });
      } else if (e.key === "%") {
        press("key-percent", { type: "percent" });
      } else if (e.key.toLowerCase() === "c") {
        press("key-ac", { type: "clear" });
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const closePaywall = useCallback(() => {
    setPaywallVisible(false);
    if (state.phase === "locked") dispatch({ type: "dismissLocked" });
    window.setTimeout(() => document.getElementById("key-eq")?.focus(), 80);
  }, [state.phase]);

  const unlock = useCallback(() => dispatch({ type: "unlock" }), []);

  const inputBlocked = state.phase === "locked";

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

          <Display state={state} />

          <div className="relative mt-2">
            <Keypad
              state={state}
              disabled={inputBlocked}
              pressedKey={pressedKey}
              onPress={press}
            />
          </div>
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="paywall"
            tiers={CALC_TIERS}
            value={state.answer != null ? formatNumber(state.answer) : "—"}
            line={expressionText(state)}
            brand="Calculator Pro"
            receiptBrand="CALCULATOR PRO"
            subline="Your calculation completed successfully. The result has been encrypted and is awaiting release — a premium feature."
            returnLabel="Return to calculator"
            dialogLabel="Unlock your answer"
            product="calculator"
            onClose={closePaywall}
            onUnlock={unlock}
          />
        )}
      </AnimatePresence>
    </>
  );
}
