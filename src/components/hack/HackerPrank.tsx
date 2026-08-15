import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { ipLocation, runScan, type PrankScan } from "../../lib/prank";
import { cn } from "../../lib/cn";

type Phase = "scanning" | "activity" | "reveal" | "punchline";

interface Activity {
  clicks: number;
  keys: number;
  scrolls: number;
  moves: number;
}

type LocState =
  | { state: "asking" }
  | { state: "granted"; coords: string }
  | { state: "denied" }
  | { state: "error" };

type ClipState =
  | { state: "asking" }
  | { state: "needsGesture" }
  | { state: "granted"; text: string }
  | { state: "denied" }
  | { state: "unsupported" };

type CamState = { state: "off" } | { state: "asking" } | { state: "on" } | { state: "denied" } | { state: "error" };

type IpState = { state: "loading" } | { state: "ok"; area: string; country: string } | { state: "fail" };

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

/** The beat for any permission the visitor turns down. */
const DENIED_BEAT = "denied. smart. you might have a little bit more survival instincts than a peanut.";

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
    `  ▸ ram          ${s.memory ? `${s.memory} · browser estimate` : "classified"}`,
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
    "> permissions — read only, never requested:",
    `  ▸ granted  ${granted.length ? granted.join(", ") : "nothing. a clean record."}`,
    `  ▸ denied   ${denied.length ? denied.join(", ") : "—"}`,
    `  ▸ askable  ${promptable.length ? promptable.join(", ") : "—"}`,
    "> requesting access — your browser is asking you questions now…",
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
  const [loc, setLoc] = useState<LocState>({ state: "asking" });
  const [clip, setClip] = useState<ClipState>({ state: "asking" });
  const [cam, setCam] = useState<CamState>({ state: "off" });
  const [ip, setIp] = useState<IpState>({ state: "loading" });
  const [deleted, setDeleted] = useState(false);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [shared, setShared] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const vidRef = useRef<HTMLVideoElement>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* Ask the moment the page opens — so the visitor sees the questions
     spyware asks, and gets to answer them themselves. */
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLoc({
            state: "granted",
            coords: `${pos.coords.latitude.toFixed(4)}°, ${pos.coords.longitude.toFixed(4)}°`,
          }),
        (err) => setLoc({ state: err.code === err.PERMISSION_DENIED ? "denied" : "error" }),
        { timeout: 9000, maximumAge: 0 },
      );
    } else {
      setLoc({ state: "error" });
    }

    void (async () => {
      if (!navigator.clipboard?.readText) {
        setClip({ state: "unsupported" });
        return;
      }
      try {
        const text = await navigator.clipboard.readText();
        setClip({ state: "granted", text: text.slice(0, 100) });
      } catch {
        /* Chrome needs a tap — offer one. */
        setClip({ state: "needsGesture" });
      }
    })();

    void ipLocation().then((r) =>
      setIp(r ? { state: "ok", area: r.area, country: r.country } : { state: "fail" }),
    );
  }, []);

  const grantClipboard = async () => {
    setClip({ state: "asking" });
    try {
      const text = await navigator.clipboard.readText();
      setClip({ state: "granted", text: text.slice(0, 100) });
    } catch {
      setClip({ state: "denied" });
    }
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCam({ state: "error" });
      return;
    }
    setCam({ state: "asking" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      setCam({ state: "on" });
    } catch {
      setCam({ state: "denied" });
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCam({ state: "off" });
  };

  useEffect(() => {
    const v = vidRef.current;
    if (cam.state === "on" && v && streamRef.current) {
      v.srcObject = streamRef.current;
      void v.play().catch(() => undefined);
    }
  }, [cam]);

  useEffect(
    () => () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const share = async () => {
    const url = `${location.origin}${location.pathname}#/hack`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "should-be-free", text: url, url });
      } else {
        await navigator.clipboard.writeText(url);
        setShared(true);
        timers.current.push(window.setTimeout(() => setShared(false), 2500));
      }
    } catch {
      /* cancelled — fine */
    }
  };

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
    const per = 110;
    lines.forEach((_, i) => {
      timers.current.push(window.setTimeout(() => setVisible(i + 1), i * per + 200));
    });
    const end = lines.length * per;
    timers.current.push(window.setTimeout(() => setPhase("activity"), end + 400));
    timers.current.push(window.setTimeout(() => setPhase("reveal"), end + 3400));
    timers.current.push(window.setTimeout(() => setPhase("punchline"), end + 5000));
  }, [scan, runId]);

  const lines = scan ? linesFor(scan) : [];
  const fmtTime = (s: number) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <>
      <div className="prank-crt fixed inset-0 z-40 overflow-y-auto bg-[#05080a]">
        <div aria-hidden className="prank-scanlines pointer-events-none fixed inset-0" />
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 bg-[radial-gradient(90%_60%_at_50%_0%,rgba(34,197,94,0.05),transparent_55%)]"
        />

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9 }}
          className="relative mx-auto flex min-h-full w-full max-w-[460px] flex-col px-4 py-6 sm:px-5 sm:py-8"
        >
          {/* header */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 rounded-full border border-green-500/25 bg-green-500/10 px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-green-400">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" aria-hidden />
              root@uplink
            </span>
            <a
              href="#/"
              className="font-mono text-[10px] text-green-700 transition-colors hover:text-green-400"
            >
              v2.2 — escape →
            </a>
          </div>

          {/* terminal — all in one, no inner scroll */}
          <div className="mt-5 rounded-2xl border border-green-500/[0.1] bg-black/30 p-5 font-mono text-[12px] leading-[1.75]">
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
                    )}
                  >
                    {l}
                  </motion.p>
                ))}
                {phase === "scanning" && <Cursor />}
              </>
            )}
          </div>

          {/* evidence — what the asks revealed, live */}
          <AnimatePresence>
            {(phase === "activity" || phase === "reveal" || phase === "punchline") && (
              <motion.div
                key="evidence"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-2xl border border-red-500/[0.12] bg-red-500/[0.03] p-4"
              >
                <p className="flex items-center gap-2 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-red-400">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400" aria-hidden />
                  evidence — from your own answers
                </p>

                <div className="mt-2.5 space-y-2 font-mono text-[11.5px] leading-relaxed">
                  {/* IP → area, no permission needed */}
                  <div>
                    <p className="text-green-500">▸ location (from your IP)</p>
                    {ip.state === "loading" && <p className="text-green-300/80">locating…</p>}
                    {ip.state === "ok" && (
                      <p className="text-green-300/90">
                        {ip.area}, {ip.country} — no permission needed. any site can do this.
                      </p>
                    )}
                    {ip.state === "fail" && (
                      <p className="text-green-300/90">somewhere on earth. the lookup was shy.</p>
                    )}
                  </div>

                  {/* precise location — permission-gated */}
                  <div>
                    <p className="text-green-500">▸ precise location (asked)</p>
                    {loc.state === "asking" && <p className="text-green-300/80">waiting on your browser…</p>}
                    {loc.state === "granted" && (
                      <p className="text-red-400">{loc.coords} — look it up if you want. we won&rsquo;t.</p>
                    )}
                    {loc.state === "denied" && <p className="text-green-300/90">{DENIED_BEAT}</p>}
                    {loc.state === "error" && (
                      <p className="text-green-300/90">unavailable here — denied, or a browser without a map.</p>
                    )}
                  </div>

                  {/* clipboard — permission-gated */}
                  <div>
                    <p className="text-green-500">▸ clipboard (asked)</p>
                    {clip.state === "asking" && <p className="text-green-300/80">waiting…</p>}
                    {clip.state === "granted" && (
                      <p className="break-all text-green-300/90">
                        &ldquo;{clip.text || "(empty)"}&rdquo;{clip.text.length >= 100 ? "…" : ""}
                      </p>
                    )}
                    {clip.state === "needsGesture" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-amber-300">browser needs a tap to reveal — </span>
                        <button
                          type="button"
                          onClick={grantClipboard}
                          className="rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-300 transition-colors hover:bg-amber-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50"
                        >
                          tap to reveal clipboard
                        </button>
                      </div>
                    )}
                    {clip.state === "denied" && <p className="text-green-300/90">{DENIED_BEAT}</p>}
                    {clip.state === "unsupported" && (
                      <p className="text-green-300/90">your browser keeps it sealed. nice.</p>
                    )}
                  </div>

                  {/* camera — permission-gated, button-triggered */}
                  <div>
                    <p className="text-green-500">▸ camera (asked when you tap)</p>
                    {cam.state === "off" && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={startCamera}
                          className="rounded-lg border border-red-400/30 bg-red-400/10 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition-colors hover:bg-red-400/[0.18] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
                        >
                          enable camera feed
                        </button>
                        <span className="text-green-300/80">we won&rsquo;t. you might want to see it.</span>
                      </div>
                    )}
                    {cam.state === "asking" && <p className="text-green-300/80">waiting…</p>}
                    {cam.state === "on" && (
                      <div className="mt-1">
                        <div className="relative overflow-hidden rounded-lg border border-red-500/30">
                          <video ref={vidRef} autoPlay playsInline muted className="h-40 w-full bg-black object-cover" />
                          <span className="absolute left-2 top-2 flex items-center gap-1.5 rounded-full bg-black/70 px-2 py-0.5 font-mono text-[10px] font-bold text-red-500">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" aria-hidden />
                            REC
                          </span>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-green-300/80">
                            a real camera, showing you to you. nothing is recorded.
                          </span>
                          <button
                            type="button"
                            onClick={stopCamera}
                            className="rounded-lg border border-white/[0.12] bg-white/[0.05] px-2.5 py-1 text-[10.5px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                          >
                            stop feed
                          </button>
                        </div>
                      </div>
                    )}
                    {cam.state === "denied" && <p className="text-green-300/90">{DENIED_BEAT}</p>}
                    {cam.state === "error" && (
                      <p className="text-green-300/90">no camera here. or the browser said no.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* live activity — persists through the whole show */}
          <AnimatePresence>
            {(phase === "activity" || phase === "reveal" || phase === "punchline") && (
              <motion.div
                key="activity"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 rounded-2xl border border-red-500/[0.14] bg-red-500/[0.03] p-4"
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

          {/* I SEE YOU — stays on screen from here on */}
          <AnimatePresence>
            {(phase === "reveal" || phase === "punchline") && (
              <motion.div
                key="glitch"
                initial={{ opacity: 0, scale: 0.75 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 16 }}
                className="mt-7 flex flex-col items-center"
              >
                <p
                  className={cn(
                    "prank-glitch font-display font-semibold uppercase tracking-[0.04em] text-red-500",
                    phase === "reveal" ? "text-[46px]" : "text-[32px]",
                  )}
                >
                  I see you.
                </p>
                <p className="mt-2 font-mono text-[10.5px] uppercase tracking-[0.3em] text-green-600">
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
                className="mt-7 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5"
              >
                <p className="font-display text-center text-[19px] font-semibold tracking-[-0.01em] text-zinc-50">
                  And the developer of this website now has all of this.
                </p>
                {deleted ? (
                  <>
                    <p className="font-display mt-3 text-center text-[13px] italic text-zinc-400">
                      he never had it. i just made you pay to delete nothing.
                    </p>
                    <p className="font-display mt-1.5 text-center text-[13px] italic text-zinc-400">
                      did the payment go through? it didn&rsquo;t — there are no
                      payments on a prank site. your card never moved.
                    </p>
                  </>
                ) : (
                  <p className="font-display mt-3 text-center text-[13.5px] italic text-zinc-400">
                    no he doesn&rsquo;t lol. go back to ur life.
                  </p>
                )}

                {/* education */}
                <div className="mt-3 border-t border-white/[0.07] pt-3">
                  <p className="text-center font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-green-500">
                    this is what spyware can get without permissions
                  </p>
                  <p className="mt-1.5 text-center text-[12px] leading-relaxed text-zinc-400">
                    The device, the battery, your clicks, the fingerprints, even
                    your area from your IP — any site can read all of that
                    without asking. That&rsquo;s the entire list, and none of it left
                    this tab.
                  </p>
                  <p className="mt-1.5 text-center text-[12px] leading-relaxed text-zinc-400">
                    Your name, email, GPS, camera, clipboard? Those need your
                    permission — or your fingers. Anyone claiming them
                    &ldquo;without asking&rdquo; is lying, or already caught.
                  </p>
                  <p className="mt-1.5 text-center text-[12px] leading-relaxed text-zinc-400">
                    Ram and cores are browser-reported estimates, rounded down
                    to powers of two — even real sites see the same guesses,
                    never your exact hardware.
                  </p>
                </div>

                {/* share — nonchalant */}
                <div className="mt-3 border-t border-white/[0.07] pt-3">
                  <button
                    type="button"
                    onClick={share}
                    className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.04] text-[13px] font-semibold text-zinc-100 transition-colors duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 active:scale-[0.98]"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4" aria-hidden>
                      <path d="M12 3v13m0-13-4 4m4-4 4 4" />
                      <path d="M5 14.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4.5" />
                    </svg>
                    Prank ur friends
                  </button>
                  {shared && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-2 text-center text-[11px] text-zinc-500"
                    >
                      link copied.
                    </motion.p>
                  )}
                </div>

                {/* the product — smaller, centered */}
                {!deleted && (
                  <div className="mt-3 border-t border-white/[0.07] pt-3 text-center">
                    <button
                      type="button"
                      onClick={() => setPaywallVisible(true)}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] px-4 text-[12px] font-semibold text-[#2a1800] shadow-[0_4px_18px_-6px_rgba(255,149,5,0.6),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.97]"
                    >
                      Remove it from the face of the earth — $15
                    </button>
                    <p className="mt-2 text-center text-[10.5px] text-zinc-600">
                      the data stays. the earth-removal is what costs money.
                    </p>
                  </div>
                )}

                <div className="mt-4 border-t border-white/[0.07] pt-3 text-center">
                  <p className="font-mono text-[10px] text-green-600">
                    nothing stored · your IP touched ipapi.co once, to name your area · nothing kept
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

          <p className="mt-7 pb-2 text-center font-mono text-[10.5px] tracking-wide text-zinc-600">
            a prank site. it tells you what it sees, to your face.
          </p>
        </motion.div>
      </div>

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
            product="hack"
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
