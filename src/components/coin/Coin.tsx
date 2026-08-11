import { useEffect, useState } from "react";
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

interface FaceOpts {
  src: string;
  /** Where to aim the vertical crop (0–1 down the photo). */
  posY: number;
  /** Bust zoom — larger = tighter on the face. */
  zoom: number;
  /** Zoom pivot point (0–1 down the coin) — centers the face. */
  originY: number;
  top: string;
  bottom: string;
}

/**
 * One minted face, drawn entirely in SVG: a gold disc, the portrait's
 * luminance sculpted into bas-relief by diffuse + specular lighting, a
 * vignette that melts it into the metal, then milled rings and engraved
 * lettering stamped on top. The crop geometry is computed from the photo's
 * real dimensions so the face sits dead-center on the coin.
 */
function ReliefFace({ id, opts }: { id: string; opts: FaceOpts }) {
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let alive = true;
    const im = new Image();
    im.onload = () => {
      if (alive) setDims({ w: im.naturalWidth, h: im.naturalHeight });
    };
    im.src = opts.src;
    return () => {
      alive = false;
    };
  }, [opts.src]);

  const S = 200;
  let crop: { x: number; y: number; rw: number; rh: number; cx: number; cy: number } | null = null;
  if (dims) {
    const scale = Math.max(S / dims.w, S / dims.h);
    const rw = dims.w * scale;
    const rh = dims.h * scale;
    crop = {
      x: 0.5 * (S - rw),
      y: opts.posY * (S - rh),
      rw,
      rh,
      cx: 100,
      cy: opts.originY * S,
    };
  }

  return (
    <svg viewBox="0 0 200 200" className="h-full w-full" aria-hidden>
      <defs>
        <radialGradient id={`${id}-g`} cx="0.34" cy="0.26" r="0.92">
          <stop offset="0" stopColor="#ffe6ad" />
          <stop offset="0.36" stopColor="#f7b93f" />
          <stop offset="0.7" stopColor="#dd9218" />
          <stop offset="1" stopColor="#9a5c00" />
        </radialGradient>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.46" r="0.74">
          <stop offset="0.5" stopColor="#000" stopOpacity="0" />
          <stop offset="0.82" stopColor="#3a2000" stopOpacity="0.55" />
          <stop offset="1" stopColor="#241200" stopOpacity="0.92" />
        </radialGradient>
        <linearGradient id={`${id}-sh`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fffdf4" stopOpacity="0.6" />
          <stop offset="0.4" stopColor="#fffdf4" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={`${id}-c`}>
          <circle cx="100" cy="100" r="96" />
        </clipPath>
        <filter id={`${id}-r`} x="-30%" y="-30%" width="160%" height="160%">
          <feColorMatrix type="saturate" values="0" result="gray" />
          <feColorMatrix in="gray" type="luminanceToAlpha" result="bump" />
          <feGaussianBlur in="bump" stdDeviation="1" result="smooth" />
          {/* shade the grayscale photo with the bump-mapped light */}
          <feDiffuseLighting
            in="smooth"
            surfaceScale="14"
            diffuseConstant="1.15"
            lightingColor="#ffd98a"
            result="diffuse"
          >
            <fePointLight x="150" y="60" z="260" />
          </feDiffuseLighting>
          <feComposite
            in="gray"
            in2="diffuse"
            operator="arithmetic"
            k1="1"
            k2="0"
            k3="0"
            k4="0"
            result="shaded"
          />
          {/* metallic glints on the raised features */}
          <feSpecularLighting
            in="smooth"
            surfaceScale="10"
            specularConstant="0.7"
            specularExponent="32"
            lightingColor="#fffdf4"
            result="specular"
          >
            <fePointLight x="150" y="60" z="260" />
          </feSpecularLighting>
          <feComposite
            in="shaded"
            in2="specular"
            operator="arithmetic"
            k1="0"
            k2="1"
            k3="0.5"
            k4="0"
          />
        </filter>
        <path id={`${id}-aTop`} d="M 50 100 A 50 50 0 0 1 150 100" />
        <path id={`${id}-aBot`} d="M 50 100 A 50 50 0 0 0 150 100" />
      </defs>

      {/* gold disc */}
      <circle cx="100" cy="100" r="99" fill={`url(#${id}-g)`} />

      {/* the sculpted portrait */}
      <g clipPath={`url(#${id}-c)`}>
        {crop && dims ? (
          <>
            <image
              href={opts.src}
              x={crop.x}
              y={crop.y}
              width={crop.rw}
              height={crop.rh}
              filter={`url(#${id}-r)`}
              transform={`translate(${crop.cx} ${crop.cy}) scale(${opts.zoom}) translate(${-crop.cx} ${-crop.cy})`}
            />
            <rect x="0" y="0" width="200" height="200" fill={`url(#${id}-vig)`} />
            <ellipse cx="70" cy="50" rx="100" ry="58" fill={`url(#${id}-sh)`} transform="rotate(-14 70 50)" />
          </>
        ) : (
          <circle cx="100" cy="100" r="96" fill={`url(#${id}-g)`} />
        )}
      </g>

      {/* milled rings */}
      <circle cx="100" cy="100" r="97.5" fill="none" stroke="#5f3400" strokeOpacity="0.8" strokeWidth="2" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#5f3400" strokeOpacity="0.45" strokeWidth="1.4" />
      <circle cx="100" cy="100" r="82" fill="none" stroke="#5f3400" strokeOpacity="0.32" strokeWidth="1" strokeDasharray="0.5 5" />

      {/* engraved lettering */}
      <text
        fontSize="15"
        fontWeight="700"
        letterSpacing="3"
        fill="#4a2a00"
        stroke="#ffe6ad"
        strokeWidth="0.6"
        paintOrder="stroke"
        fontFamily="Fraunces, Georgia, serif"
      >
        <textPath href={`#${id}-aTop`} startOffset="50%" textAnchor="middle">
          {opts.top}
        </textPath>
      </text>
      <text
        fontSize="12"
        fontWeight="600"
        letterSpacing="2.5"
        fill="#5b3400"
        stroke="#ffe6ad"
        strokeWidth="0.5"
        paintOrder="stroke"
        fontFamily="Fraunces, Georgia, serif"
      >
        <textPath href={`#${id}-aBot`} startOffset="50%" textAnchor="middle">
          {opts.bottom}
        </textPath>
      </text>
    </svg>
  );
}

/** HEADS — Epstein. TAILS — Diddy. Both minted in gold. */
function Faces() {
  return (
    <>
      <div className="coin__face coin__face--front">
        <ReliefFace
          id="h"
          opts={{
            src: epsteinImg,
            posY: 0.28,
            zoom: 1.42,
            originY: 0.24,
            top: "EPSTEIN",
            bottom: "HEADS",
          }}
        />
      </div>
      <div className="coin__face coin__face--back">
        <ReliefFace
          id="t"
          opts={{
            src: diddyImg,
            posY: 0.02,
            zoom: 1.8,
            originY: 0.52,
            top: "DIDDY",
            bottom: "TAILS",
          }}
        />
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
