import { motion } from "motion/react";
import type { CoinFace } from "../../lib/coin";

export type CoinPhase = "idle" | "flipping" | "locked" | "unlocked";

interface CoinProps {
  phase: CoinPhase;
  result: CoinFace | null;
  flipCount: number;
  reduced?: boolean;
}

const LockBadge = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-7 w-7"
    aria-hidden
  >
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
);

/** The two engraved faces. Front is gold "$", back is silver "FREE". */
function Faces() {
  return (
    <>
      <div className="coin__face coin__face--front">
        <div className="coin__disc coin__disc--gold">
          <span className="coin__label coin__label--top">SHOULD BE FREE</span>
          <span className="coin__mark">$</span>
          <span className="coin__label coin__label--bottom">ONE FLIP</span>
        </div>
      </div>
      <div className="coin__face coin__face--back">
        <div className="coin__disc coin__disc--silver">
          <span className="coin__mark coin__mark--small">FREE</span>
          <span className="coin__label coin__label--bottom">NO REFUNDS</span>
        </div>
      </div>
    </>
  );
}

/**
 * The tumbling coin. The result is decided in state and the spinning is
 * purely theatrical — the locked overlay guarantees the outcome is never
 * visible before payment.
 */
function CoinSpin({
  phase,
  result,
  flipCount,
  reduced,
}: {
  phase: CoinPhase;
  result: CoinFace | null;
  flipCount: number;
  reduced: boolean;
}) {
  if (phase === "unlocked" && result) {
    return (
      <motion.div
        key={`reveal-${flipCount}`}
        className="coin__spin"
        initial={{ rotateY: result === "tails" ? 0 : 180, scale: 0.86, opacity: 0.65 }}
        animate={{ rotateY: result === "tails" ? 180 : 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 210, damping: 18, mass: 0.9 }}
      >
        <Faces />
      </motion.div>
    );
  }

  if (phase === "flipping") {
    const end = result === "tails" ? 900 : 720; // ≡ 180° / 0° — lands on the right face
    return (
      <motion.div
        key={`flip-${flipCount}`}
        className="coin__spin"
        initial={{ rotateY: 0, rotateX: 0, y: 0, scale: 1 }}
        animate={{
          rotateY: [0, 360, 720, end - 60, end],
          rotateX: [0, 18, -12, 6, 0],
          y: [0, -22, -13, -5, 0],
          scale: [1, 1.06, 1.03, 1, 1],
        }}
        transition={{
          duration: reduced ? 0.3 : 1.9,
          times: [0, 0.35, 0.62, 0.86, 1],
          ease: "easeInOut",
        }}
      >
        <Faces />
      </motion.div>
    );
  }

  // idle / locked — at rest behind the overlay
  return (
    <motion.div
      key={phase === "locked" ? `locked-${flipCount}` : "idle"}
      className="coin__spin"
      initial={{ rotateY: 0, scale: 1 }}
      animate={{ rotateY: 0, scale: 1 }}
    >
      <Faces />
    </motion.div>
  );
}

export function Coin({ phase, result, flipCount, reduced = false }: CoinProps) {
  return (
    <div className="coin relative mx-auto h-36 w-36 sm:h-44 sm:w-44">
      <CoinSpin phase={phase} result={result} flipCount={flipCount} reduced={reduced} />

      {phase === "locked" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="coin__locked"
        >
          <span className="text-amber-300">{LockBadge}</span>
          <span className="coin__locked-label">LOCKED</span>
        </motion.div>
      )}
    </div>
  );
}
