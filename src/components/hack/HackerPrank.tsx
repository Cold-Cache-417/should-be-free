import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { runScan, type PrankScan } from "../../lib/prank";
import { cn } from "../../lib/cn";

type Phase = "scanning" | "activity" | "reveal" | "punchline";

interface Activity {
  clicks: number;
  keys: number;
  scrolls: number;
  moves: number;
}

type LocState =
  | { state: "idle" }
  | { state: "asking" }
  | { state: "granted"; coords: string }
  | { state: "denied" }
  | { state: "error" };

const DELETE_TIERS: PaywallTier[] = [
  {
    id: "hack-delete",
    name: "Remove It",
    price: "$15",
    period: "one-time",
    description: "Erase every byte from the face of the earth.",
    badge: "Face-of-earth removal",
    featured: true,
    cta: "Erase it",
  },
  {
    id: "hack-monthly",
    name: "Erase Monthly",
    price: "$500",
    period: "/month",
    description: "Unlimited earth-removal, every month.",
    cta: "Erase monthly",
  },
  {
    id: "hack-yearly",
    name: "Erase Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of deletion.",
    note: "Yes, it's cheaper.",
    cta: "Erase yearly",
  },
];

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

const shortGpu = (g: string | null) => {
  if (!g) return "classified";
  const cut = g.split("(")[0]?.trim();
  return cut.length > 34 ? cut.slice(0, 34) + "…" : cut;
};

/** Terminal lines built from the real scan. */
function linesFor(s: PrankScan): string[] {
  const perm = (state: string) =>
    Object.entries(s.permissions)
      .filter(([, v]) => v === state)
      .map(([k]) => k);
  const granted = perm("granted");
  const denied = perm("denied");
  const promptable = perm("prompt");
  const lines: string[] = [
    "> establishing uplink…",
    "> uplink secured. device identified:",
    `  ▸ model        ${s.model}`,
    `  ▸ device       ${s.device}`,
    `  ▸ os           ${s.os}`,
    `  ▸ browser      ${s.browser}`,
    `  ▸ screen       ${s.screen} · ${s.colorDepth}`,
    `  ▸ orientation  ${s.orientation}`,
    `  ▸ cpu          ${s.cores} cores`,
    `  ▸ ram          ${s.memory ?? "classified"}`,
    `  ▸ gpu          ${shortGpu(s.gpu)}`,
    `  ▸ canvas id    ${s.canvas ?? "classified"}`,
    `  ▸ webgl id     ${s.webgl ?? "classified"}`,
    `  ▸ audio id     ${s.audio ?? "classified"}`,
    `  ▸ fonts        ${s.fonts.slice(0, 5).join(", ") || "classified"}`,
    `  ▸ battery      ${s.battery ?? "classified"}`,
    `  ▸ language     ${s.language}`,
    `  ▸ locales      ${s.languages}`,
    `  ▸ timezone     ${s.timezone} (UTC${s.tzOffset})`,
    `  ▸ pointer      ${s.pointer} · ${s.touchPoints} touch points`,
    `  ▸ network      ${s.network}${s.saveData ? " · data saver on" : ""}`,
    `  ▸ storage      ${s.storage.join(", ") || "none exposed"}`,
    `  ▸ motion pref  ${s.reducedMotion ? "reduced" : "full"}`,
    "> permissions — read only, never requested:",
    `  ▸ granted  ${granted.length ? granted.join(", ") : "nothing. a clean record."}`,
    `  ▸ denied   ${denied.length ? denied.join(", ") : "—"}`,
    `  ▸ askable  ${promptable.length ? promptable.join(", ") : "—"}`,
    "> accessing clipboard… (nope. that needs permission. and manners.)",
    "> sensing your activity…",
  ];
  return lines;
}

export function HackerPrank() {
  const scan = useScan();
  const [phase, setPhase] = useState<Phase>("scanning");
  const [visible, setVisible] = useState(0);
  const [runId, setRunId] = useState(0);
  const [activity, setActivity] = useState<Activity>({ clicks: 0, keys: 0, scrolls: 0, moves: 0 });
  const [elapsed, setElapsed] = useState(0);
  const [loc, setLoc] = useState<LocState>({ state: "idle" });
  const [deleted, setDeleted] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* Count the visitor's own activity — live, on their screen, in memory. */
  useEffect(() => {
    const bump = (k: keyof Activity) => () => setActivity((a) => ({ ...a, [k]: a[k] + 1 }));
    const click = bump("clicks");
    const key = bump("keys");
    const scroll = bump("scrolls");
    const move = bump("moves");
    window.addEventListener("pointerdown", click);
    window.addEventListener("keydown", key);
    window.addEventListener("scroll", scroll, true);
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("keydown", key);
      window.removeEventListener("scroll", scroll, true);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  /* Wall-clock on-page time. */
  useEffect(() => {
    const id = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  /* Drive the staged scan → activity → reveal → punchline. */
  useEffect(() => {
    if (!scan) return;
    setPhase("scanning");
    setVisible(0);
    const lines = linesFor(scan);
    const per = 120;
    lines.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setVisible(i + 1), i * per + 250));
    });
    const end = lines.length * per;
    timers.current.push(window.setTimeout(() => setPhase("activity"), end + 500));
    timers.current.push(window.setTimeout(() => setPhase("reveal"), end + 3800));
    timers.current.push(window.setTimeout(() => setPhase("punchline"), end + 5600));
  }, [scan, runId]);

  /* The permission ask — shown so the visitor sees what "asking" looks
     like, and gets to answer it themselves. */
  const askLocation = () => {
    if (!("geolocation" in navigator)) {
      setLoc({ state: "error" });
      return;
    }
    setLoc({ state: "asking" });
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setLoc({
          state: "granted",
          coords: `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`,
        }),
      (err) => setLoc({ state: err.code === err.PERMISSION_DENIED ? "denied" : "error" }),
      { timeout: 9000, maximumAge: 0 },
    );
  };

  const lines = scan ? linesFor(scan) : [];
  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
        className="relative w-full max-w-[420px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(34,197,94,0.07),transparent_70%)]"
        />

        <div className="prank-crt relative overflow-hidden rounded-[2.4rem] border border-green-500/[0.14] bg-[#0a0f0b] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.8),0_16px_40px_-20px_rgba(0,0,0,0.6)]">
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
              <span className="font-mono text-[10px] text-green-700">v2.1 — full dossier</span>
            </div>

            {/* terminal — all in one, no inner scroll */}
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
                      transition={{ duration: 0.05 }}
                      className={cn(
                        "whitespace-pre-wrap break-all",
                        l.startsWith("  ▸") ? "text-green-300/85" : "text-green-400",
                        l.includes("clipboard") && "text-red-400/90",
                      )}
                    >
                      {l}
                    </motion.p>
                  ))}
                  {phase === "scanning" && <Cursor />}
                </>
              )}
            </div>

            {/* live activity — the visitor's own, counted in front of them */}
            <AnimatePresence>
              {phase === "activity" && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border border-red-500/[0.2] bg-red-500/[0.05] p-3.5"
                >
                  <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" aria-hidden />
                    sensing your activity — live
                  </p>
                  <div className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-1.5 font-mono text-[12px] tabular-nums">
                    <span className="text-green-300">clicks <span className="text-red-400">{activity.clicks}</span></span>
                    <span className="text-green-300">keys <span className="text-red-400">{activity.keys}</span></span>
                    <span className="text-green-300">scrolls <span className="text-red-400">{activity.scrolls}</span></span>
                    <span className="text-green-300">moves <span className="text-red-400">{activity.moves}</span></span>
                    <span className="text-green-300">time here <span className="text-red-400">{fmtTime(elapsed)}</span></span>
                  </div>
                  <p className="mt-2 font-mono text-[10px] text-green-600">
                    every click, every key — counted live, in front of you, on your own machine.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

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

            {/* the punchline + the product */}
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
                    And the developer of this website now has all of this.
                  </p>
                  {deleted ? (
                    <>
                      <p className="mt-1.5 text-[11.5px] text-zinc-500">
                        he never had it. i just made you pay to delete nothing.
                      </p>
                      <p className="mt-1.5 text-[11.5px] text-zinc-500">
                        did the payment go through? it didn&rsquo;t — there are no
                        payments on a prank site. your card never moved.
                      </p>
                    </>
                  ) : (
                    <p className="mt-1.5 text-[11.5px] text-zinc-500">
                      no he doesn&rsquo;t lol. go back to ur life.
                    </p>
                  )}

                  {/* education */}
                  <div className="mt-3 border-t border-white/[0.07] pt-3">
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-green-500">
                      this is what spyware can get without permissions
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-400">
                      Everything above — the model, the battery, your clicks, the
                      fingerprints — any website can read without asking. That&rsquo;s
                      the entire list, and not one byte of it left this tab.
                    </p>
                    <p className="mt-1.5 text-[12.5px] leading-relaxed text-zinc-400">
                      Your name, email, GPS, camera, mic, clipboard? Those need
                      your permission — or your fingers. Anyone claiming them
                      &ldquo;without asking&rdquo; is lying, or already caught.
                    </p>
                  </div>

                  {/* the permission ask — so they can see what asking looks like */}
                  <div className="mt-3 border-t border-white/[0.07] pt-3">
                    <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-red-400">
                      want to see the question spyware asks?
                    </p>
                    {loc.state === "idle" && (
                      <button
                        type="button"
                        onClick={askLocation}
                        className="mt-2 flex h-10 w-full items-center justify-center rounded-xl border border-red-400/25 bg-red-400/[0.07] font-mono text-[12px] font-semibold text-red-300 transition-colors duration-150 hover:bg-red-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-[0.98]"
                      >
                        Attempt full location access
                      </button>
                    )}
                    {loc.state === "asking" && (
                      <p className="mt-2 font-mono text-[12px] text-amber-300">
                        waiting on your browser&rsquo;s answer…
                      </p>
                    )}
                    {loc.state === "granted" && (
                      <p className="mt-2 font-mono text-[12px] text-red-400">
                        location locked: {loc.coords} — look it up if you want. we won&rsquo;t.
                      </p>
                    )}
                    {loc.state === "denied" && (
                      <p className="mt-2 font-mono text-[12px] text-green-400">denied. smart.</p>
                    )}
                    {loc.state === "error" && (
                      <p className="mt-2 font-mono text-[12px] text-zinc-500">
                        unavailable here — denied, or a browser without a map. either way, fine.
                      </p>
                    )}
                    {loc.state === "idle" && (
                      <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
                        your browser will ask you a question. that question is the one spyware
                        needs you to click &ldquo;yes&rdquo; to. say whatever you want.
                      </p>
                    )}
                  </div>

                  {/* the product: remove it from the face of the earth */}
                  {!deleted && (
                    <div className="mt-3 border-t border-white/[0.07] pt-3">
                      <button
                        type="button"
                        onClick={() => setPaywallVisible(true)}
                        className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] font-mono text-[12.5px] font-bold uppercase tracking-[0.1em] text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
                      >
                        Remove it from the face of the earth — $15
                      </button>
                      <p className="mt-2 text-center text-[11px] text-zinc-600">
                        the data stays, the earth-removal is what costs money.
                      </p>
                    </div>
                  )}

                  <div className="mt-4 border-t border-white/[0.07] pt-3 text-center">
                    <p className="font-mono text-[10.5px] text-green-600">
                      zero bytes stored · zero bytes sent
                    </p>
                    <button
                      type="button"
                      onClick={() => setRunId((n) => n + 1)}
                      className="mt-3 h-10 w-full rounded-xl border border-green-500/25 bg-green-500/10 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-green-300 transition-colors duration-150 hover:bg-green-500/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/50 active:scale-[0.98]"
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

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="hack-paywall"
            tiers={DELETE_TIERS}
            value="PURGED"
            line="Deletion request"
            masked="0 B"
            brand="Hacker Pro"
            receiptBrand="HACKER PRO"
            filename="deletion_request.bin"
            headline="Deletion is expensive."
            subline="The developer now holds everything about your machine. Removing it from the face of the earth is a premium feature."
            checkoutNote="Deleting data that was never stored, at a premium price. Enter payment details to proceed."
            returnLabel="Back to my device"
            dialogLabel="Remove your data"
            onClose={() => setPaywallVisible(false)}
            onUnlock={() => setDeleted(true)}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function Cursor() {
  return <span className="prank-cursor inline-block h-[1em] w-[0.55em] translate-y-[2px] bg-green-400" aria-hidden />;
}
