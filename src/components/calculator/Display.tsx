import { motion } from "motion/react";
import {
  deriveMain,
  expressionText,
  displayFontSize,
  type CalcState,
} from "../../lib/calcReducer";
import { cn } from "../../lib/cn";

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

interface DisplayProps {
  state: CalcState;
  compact?: boolean;
}

export function Display({ state, compact = false }: DisplayProps) {
  const { text, tone } = deriveMain(state);
  const expression = expressionText(state);
  const baseSize = displayFontSize(text);
  const fontSize = Math.round(baseSize * (compact ? 0.78 : 0.92));

  const locked = state.phase === "locked";
  const unlocked = state.phase === "unlocked";
  const isReveal = locked || unlocked;

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative flex h-[8.75rem] flex-col justify-end overflow-hidden px-2.5 pb-2.5"
    >
      {/* status row: expression line + state chip */}
      <div className="flex h-6 items-center justify-between gap-3">
        <span
          className={cn(
            "min-w-0 truncate text-[12.5px] font-medium tracking-wide",
            locked ? "text-zinc-400" : "text-zinc-500",
          )}
        >
          {expression || "\u00A0"}
        </span>
        {locked && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-amber-300">
            {LockIcon}
            Answer locked
          </span>
        )}
        {unlocked && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-green-300">
            {CheckIcon}
            Unlocked
          </span>
        )}
      </div>

      {/* main value */}
      <div className="relative mt-1.5 flex h-[4.5rem] items-center justify-end overflow-hidden">
        <motion.span
          key={text}
          initial={isReveal ? { opacity: 0, y: 14, scale: 0.94 } : { opacity: 0.35 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={
            isReveal
              ? { type: "spring", stiffness: 300, damping: 22, mass: 0.9 }
              : { duration: 0.12, ease: "easeOut" }
          }
          aria-hidden={locked}
          className={cn(
            "origin-right whitespace-nowrap font-light tabular-nums leading-none tracking-[-0.03em] text-zinc-100",
            locked && "select-none text-amber-300/80",
            tone === "error" && "text-[#ff453a]",
          )}
          style={{ fontSize }}
        >
          {text}
        </motion.span>
      </div>

      {/* error shake layer */}
      {tone === "error" && (
        <div className="animate-shake absolute inset-x-0 bottom-0 top-8" aria-hidden />
      )}
    </div>
  );
}
