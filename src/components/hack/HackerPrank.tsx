import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { runScan, type PrankScan } from "../../lib/prank";
import { cn } from "../../lib/cn";

type Phase = "scanning" | "reveal" | "punchline";

function useScan() {
  const [scan, setScan] = useState<PrankScan | null>(null);
  useEffect(() => {
    let alive = true;
    runScan().then((s) => alive && setScan(s));
    return () => {
      alive = false;
    };
  }, []);
  return scan;
}

/** Build the terminal lines once the scan is in. */
function linesFor(s: PrankScan): string[] {
  const gpu = s.gpu?.split("(")[0]?.trim() ?? "classified";
  return [
    "> establishing uplink…",
    "> uplink secured. reading device…",
    `  ▸ browser      ${s.browser}`,
    `  ▸ os           ${s.os}`,
    `  ▸ device       ${s.device}`,
    `  ▸ screen       ${s.screen}`,
    `  ▸ cpu          ${s.cores} cores`,
    `  ▸ ram          ${s.memory ?? "classified"}`,
    `  ▸ gpu          ${gpu}`,
    `  ▸ battery      ${s.battery ?? "classified"}`,
    `  ▸ language     ${s.language}`,
    `  ▸ timezone     ${s.timezone}`,
    `  ▸ canvas id    ${s.canvas ?? "classified"}`,
    `  ▸ fonts        ${s.fonts.slice(0, 4).join(", ") || "classified"}`,
    "> accessing clipboard… (nope. that would be rude.)",
    "> tracking cursor… done.",
    "> compiling dossier… done.",
    "> transmitting to @lxqmxn_24…",
  ];
}

export function HackerPrank() {
  const scan = useScan();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [visible, setVisible] = useState(0);
  const [runId, setRunId] = useState(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* Drive the staged scan → reveal → punchline. */
  useEffect(() => {
    if (!scan) return;
    setPhase("scanning");
    setVisible(0);
    const lines = linesFor(scan);
    const per = 170;
    lines.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setVisible(i + 1), i * per + 300));
    });
    timers.current.push(
      window.setTimeout(() => setPhase("reveal"), lines.length * per + 800),
    );
    timers.current.push(
      window.setTimeout(() => setPhase("punchline"), lines.length * per + 2600),
    );
  }, [scan, runId]);

  const lines = scan ? linesFor(scan) : [];

  return (
    <motion.section
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
      className="relative w-full max-w-[400px]"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(34,197,94,0.07),transparent_70%)]"
      />

      <div className="prank-crt relative overflow-hidden rounded-[2.4rem] border border-green-500/[0.14] bg-[#0a0f0b] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8),0_16px_40px_-20px_rgba(0,0,0,0.6)]">
        {/* CRT scanlines + vignette */}
        <div aria-hidden className="prank-scanlines pointer-events-none absolute inset-0" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(255,255,255,0.04),transparent_60%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent"
        />

        <div className="relative px-5 py-4 sm:px-6 sm:py-5">
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" aria-hidden />
              root@uplink
            </span>
            <span className="font-mono text-[10px] text-green-700">v1.3.7</span>
          </div>

          {/* terminal */}
          <div className="mt-4 rounded-2xl border border-green-500/[0.12] bg-black/40 p-4 font-mono text-[12px] leading-[1.7]">
            {!scan ? (
              <p className="text-green-600">
                <Cursor /> establishing uplink…
              </p>
            ) : (
              <>
                {lines.slice(0, visible).map((l, i) => (
                  <motion.p
                    key={`${runId}-${i}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.06 }}
                    className={cn(
                      "whitespace-pre-wrap",
                      l.startsWith("  ▸") ? "text-green-300/85" : "text-green-400",
                    )}
                  >
                    {l}
                  </motion.p>
                ))}
                {phase === "scanning" && <Cursor />}
              </>
            )}
          </div>

          {/* glitch reveal */}
          <AnimatePresence mode="wait">
            {phase === "reveal" && (
              <motion.div
                key="reveal"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mt-5 flex flex-col items-center"
              >
                <motion.p
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 16 }}
                  className="prank-glitch font-mono text-[44px] font-black uppercase tracking-[0.08em] text-red-500"
                >
                  I see you.
                </motion.p>
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-green-600">
                  device compromised
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* the punchline */}
          <AnimatePresence>
            {phase === "punchline" && (
              <motion.div
                key="punchline"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
              >
                <p className="font-display text-[17px] font-semibold text-zinc-100">
                  And @lxqmxn_24 now has all of this.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-400">
                  …he doesn&rsquo;t. Nothing left this tab. That was your own
                  browser, reading itself, in front of you. No data, no
                  storage, no server. A prank, and a well-executed one.
                  Go back to your life.
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <p className="font-mono text-[10.5px] text-green-600">
                    zero bytes stored · zero bytes sent
                  </p>
                  <button
                    type="button"
                    onClick={() => setRunId((n) => n + 1)}
                    className="rounded-xl border border-green-500/25 bg-green-500/10 px-3.5 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-green-300 transition-colors duration-150 hover:bg-green-500/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50 active:scale-[0.97]"
                  >
                    Run scan again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-4 text-center text-[10.5px] text-zinc-600">
            A prank site. It tells you what it sees, to your face.
          </p>
        </div>
      </div>
    </motion.section>
  );
}

function Cursor() {
  return <span className="prank-cursor inline-block h-[1em] w-[0.55em] translate-y-[2px] bg-green-400" aria-hidden />;
}
