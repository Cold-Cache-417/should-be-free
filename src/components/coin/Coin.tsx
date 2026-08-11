import { motion } from "motion/react";
import type { CoinFace } from "../../lib/coin";
import epsteinImg from "../../assets/coin/epstein.jpg";
import diddyImg from "../../assets/coin/diddy.jpg";

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

/**
 * Engraved lettering + milled rings stamped on top of the photo, so the
 * face reads like a minted coin: dark fill with a light engraved edge.
 */
function Engraving({ id, top, bottom }: { id: string; top: string; bottom: string }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full" aria-hidden>
      <defs>
        <path id={`${id}ArcTop`} d="M25 50 A25 25 0 0 1 75 50" />
        <path id={`${id}ArcBot`} d="M25 50 A25 25 0 0 0 75 50" />
      </defs>
      <circle cx="50" cy="50" r="47.2" fill="none" stroke="rgba(70,40,0,0.75)" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="41.2" fill="none" stroke="rgba(90,50,0,0.5)" strokeWidth="1" />
      <circle
        cx="50"
        cy="50"
        r="36.4"
        fill="none"
        stroke="rgba(90,50,0,0.38)"
        strokeWidth="0.7"
        strokeDasharray="0.2 2.4"
        strokeLinecap="round"
      />
      <text
        fontSize="6.8"
        fontWeight="700"
        letterSpacing="2.4"
        fill="#4a2a00"
        stroke="#ffdf9e"
        strokeWidth="0.4"
        paintOrder="stroke"
        fontFamily="'Fraunces', Georgia, serif"
      >
        <textPath href={`#${id}ArcTop`} startOffset="50%" textAnchor="middle">
          {top}
        </textPath>
      </text>
      <text
        fontSize="5.4"
        fontWeight="600"
        letterSpacing="1.9"
        fill="#5b3400"
        stroke="#ffdf9e"
        strokeWidth="0.3"
        paintOrder="stroke"
        fontFamily="'Fraunces', Georgia, serif"
      >
        <textPath href={`#${id}ArcBot`} startOffset="50%" textAnchor="middle">
          {bottom}
        </textPath>
      </text>
    </svg>
  );
}

/**
 * One minted face: the portrait photographed onto metal — greyscale, gold
 * tint, vignette, sheen — with the engraving stamped on top.
 */
function PhotoFace({
  src,
  alt,
  pos,
  id,
  top,
  bottom,
}: {
  src: string;
  alt: string;
  pos: string;
  id: string;
  top: string;
  bottom: string;
}) {
  return (
    <div className="coin__photo" aria-hidden>
      <img src={src} alt={alt} draggable={false} style={{ objectPosition: pos }} />
      <div className="coin__tint" />
      <div className="coin__shade" />
      <div className="coin__sheen" />
      <Engraving id={id} top={top} bottom={bottom} />
    </div>
  );
}

/** HEADS — Epstein. TAILS — Diddy. Both minted in gold. */
function Faces() {
  return (
    <>
      <div className="coin__face coin__face--front">
        <PhotoFace src={epsteinImg} alt="Epstein" pos="50% 10%" id="h" top="EPSTEIN" bottom="HEADS" />
      </div>
      <div className="coin__face coin__face--back">
        <PhotoFace src={diddyImg} alt="Diddy" pos="50% 8%" id="t" top="DIDDY" bottom="TAILS" />
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
      {/* warm gold aura behind the coin */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-5 rounded-full bg-[radial-gradient(60%_60%_at_50%_45%,rgba(255,159,10,0.28),transparent_70%)]"
      />
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
