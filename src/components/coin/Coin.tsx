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

/** Shared bust silhouette (head + shoulders), engraved dark on gold. */
const Bust = (
  <g fill="#5f3400">
    <circle cx="50" cy="34" r="9" />
    <path d="M44 41 L41 51.5 L28 57.5 C26.2 60 28 62.5 31 62.5 L69 62.5 C72 62.5 73.8 60 72 57.5 L59 51.5 L56 41 Z" />
  </g>
);

function GoldFace({
  id,
  top,
  bottom,
  children,
}: {
  id: string;
  top: string;
  bottom: string;
  children?: React.ReactNode;
}) {
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden focusable="false">
      <defs>
        <radialGradient id={`${id}Gold`} cx="34%" cy="26%" r="85%">
          <stop offset="0%" stopColor="#ffe6ad" />
          <stop offset="36%" stopColor="#f7b93f" />
          <stop offset="70%" stopColor="#dd9218" />
          <stop offset="100%" stopColor="#9a5c00" />
        </radialGradient>
        <path id={`${id}ArcTop`} d="M25 50 A25 25 0 0 1 75 50" />
        <path id={`${id}ArcBot`} d="M25 50 A25 25 0 0 0 75 50" />
      </defs>

      {/* disc */}
      <circle cx="50" cy="50" r="47.5" fill={`url(#${id}Gold)`} />
      <circle cx="50" cy="50" r="46.4" fill="none" stroke="#8a5300" strokeWidth="1.6" />
      <circle cx="50" cy="50" r="41" fill="none" stroke="rgba(90,50,0,0.42)" strokeWidth="1" />
      <circle
        cx="50"
        cy="50"
        r="36.2"
        fill="none"
        stroke="rgba(90,50,0,0.3)"
        strokeWidth="0.8"
        strokeDasharray="0.2 2.6"
        strokeLinecap="round"
      />

      {/* gloss */}
      <ellipse cx="38" cy="27" rx="17" ry="8" fill="rgba(255,255,255,0.3)" transform="rotate(-16 38 27)" />

      {/* engraved text */}
      <text fontSize="6.8" fontWeight="800" letterSpacing="2.2" fill="#6b3d00" fontFamily="inherit">
        <textPath href={`#${id}ArcTop`} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text fontSize="5.2" fontWeight="700" letterSpacing="1.8" fill="#7a4a00" fontFamily="inherit">
        <textPath href={`#${id}ArcBot`} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>

      {children}
    </svg>
  );
}

/** HEADS — Epstein, in a suit. */
function HeadsFace() {
  return (
    <GoldFace id="h" top="EPSTEIN" bottom="HEADS">
      {Bust}
      <path d="M50 52 L45.5 62.5 L54.5 62.5 Z" fill="#7a4a00" opacity="0.55" />
    </GoldFace>
  );
}

/** TAILS — Diddy, with the chain. */
function TailsFace() {
  return (
    <GoldFace id="t" top="DIDDY" bottom="TAILS">
      {Bust}
      <path
        d="M41.5 53.5 Q50 60 58.5 53.5"
        fill="none"
        stroke="#5f3400"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="50" cy="57.4" r="2.3" fill="none" stroke="#5f3400" strokeWidth="1.1" />
    </GoldFace>
  );
}

/** The two engraved gold faces. Front is Epstein, back is Diddy. */
function Faces() {
  return (
    <>
      <div className="coin__face coin__face--front">
        <HeadsFace />
      </div>
      <div className="coin__face coin__face--back">
        <TailsFace />
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
