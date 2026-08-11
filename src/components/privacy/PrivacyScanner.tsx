import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Paywall, type PaywallTier } from "../paywall/Paywall";
import { collectProfile, type PrivacyProfile } from "../../lib/privacy";
import { cn } from "../../lib/cn";

type Phase = "gate" | "collecting" | "profile" | "scrubbed";

interface Activity {
  clicks: number;
  keys: number;
  moves: number;
  scrolls: number;
}

const CERT_TIERS: PaywallTier[] = [
  {
    id: "cert-once",
    name: "Deletion Certificate",
    price: "$15",
    period: "one-time",
    description: "An official receipt for zero bytes.",
    badge: "Paper only",
    featured: true,
    cta: "Certify deletion",
  },
  {
    id: "cert-monthly",
    name: "Erase Monthly",
    price: "$500",
    period: "/month",
    description: "Unlimited certified deletions.",
    cta: "Erase monthly",
  },
  {
    id: "cert-yearly",
    name: "Erase Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of certified nothing.",
    note: "Yes, it's cheaper.",
    cta: "Erase yearly",
  },
];

/** Everything the scanner reads — disclosed verbatim before any collection. */
const DISCLOSED = [
  "Browser & OS",
  "Device & screen",
  "CPU · RAM · GPU",
  "Canvas fingerprint",
  "WebGL fingerprint",
  "Audio fingerprint",
  "Installed fonts",
  "Battery level",
  "Permissions",
  "Storage APIs",
  "Sensors",
  "Your activity",
];

const STAGE_LINES = [
  "Reading browser & OS…",
  "Measuring your screen…",
  "Tallying your hardware…",
  "Fingerprinting the canvas…",
  "Probing the GPU…",
  "Rendering an audio trace…",
  "Scanning installed fonts…",
  "Checking permissions…",
  "Battery check…",
  "Inventorying storage…",
  "Listing sensors…",
];

const fmt = (ms: number) => {
  const s = Math.floor(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export function PrivacyScanner() {
  const [phase, setPhase] = useState<Phase>("gate");
  const [profile, setProfile] = useState<PrivacyProfile | null>(null);
  const [log, setLog] = useState<string[]>([]);
  const [activity, setActivity] = useState<Activity>({ clicks: 0, keys: 0, moves: 0, scrolls: 0 });
  const [startedAt, setStartedAt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const profileRef = useRef<PrivacyProfile | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  /* Consent gate: nothing is probed until the visitor opts in. */
  const startCollection = () => {
    setPhase("collecting");
    setLog([]);
    const began = performance.now();
    STAGE_LINES.forEach((line, i) => {
      timers.current.push(window.setTimeout(() => setLog((l) => [...l, line]), i * 300));
    });
    collectProfile().then((p) => {
      profileRef.current = p;
      const minShow = (STAGE_LINES.length - 1) * 300 + 500;
      const wait = Math.max(0, minShow - (performance.now() - began));
      timers.current.push(
        window.setTimeout(() => {
          setProfile(p);
          setActivity({ clicks: 0, keys: 0, moves: 0, scrolls: 0 });
          setStartedAt(Date.now());
          setPhase("profile");
        }, wait),
      );
    });
  };

  const decline = () => {
    setProfile(null);
    setActivity({ clicks: 0, keys: 0, moves: 0, scrolls: 0 });
    setPhase("scrubbed");
  };

  /* Remove everything, in-memory only — this is the whole point. */
  const wipe = useCallback(() => {
    profileRef.current = null;
    setProfile(null);
    setLog([]);
    setActivity({ clicks: 0, keys: 0, moves: 0, scrolls: 0 });
    setStartedAt(0);
    setPhase("scrubbed");
  }, []);

  const clearActivity = () => setActivity({ clicks: 0, keys: 0, moves: 0, scrolls: 0 });

  /* Live activity — only counted after consent, only in state. */
  useEffect(() => {
    if (phase !== "profile") return;
    const bump = (k: keyof Activity) => () => setActivity((a) => ({ ...a, [k]: a[k] + 1 }));
    const click = bump("clicks");
    const key = bump("keys");
    const move = bump("moves");
    const scroll = bump("scrolls");
    window.addEventListener("pointerdown", click);
    window.addEventListener("keydown", key);
    window.addEventListener("pointermove", move);
    window.addEventListener("scroll", scroll, true);
    return () => {
      window.removeEventListener("pointerdown", click);
      window.removeEventListener("keydown", key);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("scroll", scroll, true);
    };
  }, [phase]);

  /* Time on page. */
  useEffect(() => {
    if (phase !== "profile") return;
    const id = window.setInterval(() => setElapsed(Date.now() - startedAt), 1000);
    return () => window.clearInterval(id);
  }, [phase, startedAt]);

  const openCert = () => setPaywallVisible(true);
  const closePaywall = () => setPaywallVisible(false);

  return (
    <>
      <motion.section
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 24, mass: 0.9, delay: 0.08 }}
        className="relative w-full max-w-[400px]"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 -z-10 rounded-[3.5rem] bg-[radial-gradient(60%_60%_at_50%_30%,rgba(255,159,10,0.07),transparent_70%)]"
        />

        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.09] bg-[linear-gradient(180deg,#181820_0%,#121218_45%,#0e0e12_100%)] p-5 shadow-[0_40px_90px_-24px_rgba(0,0,0,0.75),0_16px_40px_-20px_rgba(0,0,0,0.55)] sm:p-6">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_35%_at_50%_0%,rgba(255,255,255,0.045),transparent_70%)]"
          />

          {phase === "gate" && <GateView onAllow={startCollection} onDecline={decline} />}
          {phase === "collecting" && <CollectingView log={log} />}
          {phase === "profile" && profile && (
            <ProfileView
              profile={profile}
              activity={activity}
              elapsed={elapsed}
              onWipe={wipe}
              onClearActivity={clearActivity}
              onCert={openCert}
            />
          )}
          {phase === "scrubbed" && <ScrubbedView onAgain={() => setPhase("gate")} onCert={openCert} />}
        </div>
      </motion.section>

      <AnimatePresence>
        {paywallVisible && (
          <Paywall
            key="privacy-paywall"
            tiers={CERT_TIERS}
            value="PURGED"
            line="Deletion certificate"
            masked="0 B"
            brand="Privacy Scanner"
            receiptBrand="PRIVACY SCANNER"
            filename="deletion_certificate.pdf"
            headline="Your data, deleted. On paper."
            subline="The deletion itself is free and already done — this certificate just makes it official. A receipt for zero bytes."
            checkoutNote="You're paying for the paper, not the deletion. Enter payment details to certify your purge."
            returnLabel="Back to the scanner"
            dialogLabel="Certify your deletion"
            onClose={closePaywall}
            onUnlock={wipe}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* gate — full disclosure, before any collection                       */
/* ------------------------------------------------------------------ */

function GateView({ onAllow, onDecline }: { onAllow: () => void; onDecline: () => void }) {
  return (
    <motion.div
      key="gate"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
          Privacy Scanner
        </span>
        <span className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
          Read-only · Nothing stored
        </span>
      </div>

      <h2 className="font-display mt-5 text-[29px] font-semibold tracking-[-0.01em] text-zinc-50">
        I&rsquo;m getting all your info.
      </h2>
      <p className="mt-2 text-[13.5px] leading-relaxed text-zinc-400">
        Full disclosure before we begin. This app reads what your browser
        reveals about you — and shows you <em className="text-zinc-200">exactly</em> what it
        found. Nothing is stored, nothing leaves your device, and every byte
        lives in memory until you wipe it.
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {DISCLOSED.map((d) => (
          <span
            key={d}
            className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] font-medium text-zinc-300"
          >
            {d}
          </span>
        ))}
      </div>

      <div className="mt-5 space-y-2.5">
        <button
          type="button"
          onClick={onAllow}
          className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[15px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
        >
          Let them in — show me
        </button>
        <button
          type="button"
          onClick={onDecline}
          className="flex h-[44px] w-full items-center justify-center rounded-xl border border-red-400/25 bg-red-400/[0.06] text-[13px] font-semibold text-red-300 transition-all duration-150 hover:bg-red-400/[0.12] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50 active:scale-[0.98]"
        >
          Nope — erase it
        </button>
      </div>

      <p className="mt-4 text-center text-[11px] leading-relaxed text-zinc-600">
        Zero cookies. Zero storage. Zero servers. Just your browser, talking to itself.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* collecting — the probes run live, on screen                         */
/* ------------------------------------------------------------------ */

function CollectingView({ log }: { log: string[] }) {
  return (
    <motion.div
      key="collecting"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex flex-col items-center py-6 text-center"
    >
      <span className="relative grid h-16 w-16 place-items-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-amber-400/20 border-t-amber-400" aria-hidden />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          className="h-6 w-6 text-amber-300"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.2-3.2M11 8v6M8 11h6" />
        </svg>
      </span>

      <h2 className="font-display mt-4 text-[24px] font-semibold tracking-[-0.01em] text-zinc-50">
        Reading you, live
      </h2>

      <div className="mt-4 w-full max-w-[260px] space-y-1.5 text-left">
        {STAGE_LINES.map((line, i) => (
          <motion.p
            key={line}
            initial={false}
            animate={{ opacity: i < log.length ? 1 : 0.22 }}
            transition={{ duration: 0.15 }}
            className={cn(
              "flex items-center gap-2 font-mono text-[11.5px] tabular-nums",
              i < log.length ? "text-zinc-300" : "text-zinc-600",
            )}
          >
            <span className={cn("h-1 w-1 rounded-full", i < log.length ? "bg-amber-400" : "bg-zinc-700")} aria-hidden />
            {line}
          </motion.p>
        ))}
      </div>

      <p className="mt-5 text-[11px] text-zinc-600">All in memory. All yours to delete.</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* profile — everything collected, shown to the visitor                */
/* ------------------------------------------------------------------ */

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.14em] text-zinc-500">{label}</p>
      <p className="mt-0.5 truncate text-[13px] font-medium text-zinc-100">{value}</p>
    </div>
  );
}

function HashRow({ label, hash }: { label: string; hash: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
      <span className="text-[11.5px] font-medium text-zinc-300">{label}</span>
      <span className="font-mono text-[11px] tabular-nums text-amber-300">
        {hash ?? "unavailable"}
      </span>
    </div>
  );
}

function ProfileView({
  profile,
  activity,
  elapsed,
  onWipe,
  onClearActivity,
  onCert,
}: {
  profile: PrivacyProfile;
  activity: Activity;
  elapsed: number;
  onWipe: () => void;
  onClearActivity: () => void;
  onCert: () => void;
}) {
  const permColor = (s: string) =>
    s === "granted"
      ? "border-green-400/25 bg-green-400/10 text-green-300"
      : s === "denied"
        ? "border-red-400/25 bg-red-400/10 text-red-300"
        : s === "prompt"
          ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
          : "border-white/[0.08] bg-white/[0.03] text-zinc-500";

  return (
    <motion.div
      key="profile"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 rounded-full border border-green-400/25 bg-green-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-green-300">
          <span className="h-1.5 w-1.5 rounded-full bg-green-400" aria-hidden />
          Profile captured
        </span>
        <button
          type="button"
          onClick={onWipe}
          className="flex items-center gap-1.5 rounded-full border border-red-400/25 bg-red-400/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-red-300 transition-colors duration-150 hover:bg-red-400/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/50"
        >
          {TrashGlyph}
          Remove my data
        </button>
      </div>

      <h2 className="font-display mt-4 text-[26px] font-semibold tracking-[-0.01em] text-zinc-50">
        This is what I see.
      </h2>
      <p className="mt-1 text-[12.5px] text-zinc-500">
        Everything below is read live from your browser. Nothing has left this tab.
      </p>

      {/* device & browser */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <StatTile label="Browser" value={`${profile.browser.name} ${profile.browser.version}`} />
        <StatTile label="OS" value={profile.os} />
        <StatTile label="Device" value={profile.device} />
        <StatTile label="Platform" value={profile.platform} />
        <StatTile label="Language" value={profile.language} />
        <StatTile label="Timezone" value={profile.timezone} />
        <StatTile
          label="Screen"
          value={`${profile.screen.width}×${profile.screen.height} @${profile.screen.dpr}x`}
        />
        <StatTile label="Color depth" value={`${profile.screen.colorDepth}-bit`} />
        <StatTile label="CPU cores" value={String(profile.hardware.cores)} />
        <StatTile label="RAM" value={profile.hardware.memory ?? "not exposed"} />
        <div className="col-span-2">
          <StatTile label="GPU" value={profile.gpu ?? "not exposed"} />
        </div>
      </div>

      {/* fingerprints */}
      <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Fingerprints
      </p>
      <div className="mt-2 space-y-1.5">
        <HashRow label="Canvas" hash={profile.fingerprints.canvas} />
        <HashRow label="WebGL" hash={profile.fingerprints.webgl} />
        <HashRow label="Audio" hash={profile.fingerprints.audio} />
      </div>

      {/* fonts */}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Installed fonts
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {profile.fingerprints.fonts.length > 0 ? (
          profile.fingerprints.fonts.map((f) => (
            <span
              key={f}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300"
            >
              {f}
            </span>
          ))
        ) : (
          <span className="text-[12px] text-zinc-600">unavailable</span>
        )}
      </div>

      {/* permissions */}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Permissions
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(profile.permissions).map(([name, state]) => (
          <span
            key={name}
            className={cn("rounded-full border px-2.5 py-1 text-[10.5px] font-medium", permColor(state))}
          >
            {name}
          </span>
        ))}
        {Object.keys(profile.permissions).length === 0 && (
          <span className="text-[12px] text-zinc-600">not supported by this browser</span>
        )}
      </div>

      {/* storage */}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Storage APIs present
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {Object.entries(profile.storage)
          .filter(([, v]) => v)
          .map(([k]) => (
            <span
              key={k}
              className="rounded-full border border-white/[0.08] bg-white/[0.04] px-2.5 py-1 text-[11px] text-zinc-300"
            >
              {k}
            </span>
          ))}
      </div>

      {/* activity — live */}
      <p className="mt-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        Your activity, live
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <StatTile label="Clicks" value={String(activity.clicks)} />
        <StatTile label="Keys" value={String(activity.keys)} />
        <StatTile label="Mouse moves" value={String(activity.moves)} />
        <StatTile label="Scrolls" value={String(activity.scrolls)} />
      </div>
      <div className="mt-2 flex items-center justify-between rounded-xl border border-white/[0.07] bg-black/20 px-3 py-2.5">
        <span className="text-[11.5px] font-medium text-zinc-300">Time on this page</span>
        <span className="font-mono text-[12px] tabular-nums text-amber-300">{fmt(elapsed)}</span>
      </div>
      <button
        type="button"
        onClick={onClearActivity}
        className="mt-2 flex h-9 w-full items-center justify-center rounded-xl border border-white/[0.1] bg-white/[0.04] text-[12px] font-semibold text-zinc-300 transition-colors duration-150 hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
      >
        Clear activity
      </button>

      {/* certificate */}
      <button
        type="button"
        onClick={onCert}
        className="mt-4 flex h-[50px] w-full items-center justify-center gap-2 rounded-2xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[14px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
      >
        Deletion certificate — $15
      </button>
      <p className="mt-2 text-center text-[11px] text-zinc-600">
        Deleting is free (the red button above). The certificate costs $15.
      </p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* scrubbed — nothing collected, or everything erased                  */
/* ------------------------------------------------------------------ */

function ScrubbedView({ onAgain, onCert }: { onAgain: () => void; onCert: () => void }) {
  return (
    <motion.div
      key="scrubbed"
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex flex-col items-center py-6 text-center"
    >
      <motion.span
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 18, delay: 0.08 }}
        className="grid h-14 w-14 place-items-center rounded-full border border-green-400/30 bg-green-400/15 text-green-300"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6"
          aria-hidden
        >
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </svg>
      </motion.span>

      <h2 className="font-display mt-4 text-[26px] font-semibold tracking-[-0.01em] text-zinc-50">
        All data erased.
      </h2>
      <p className="mt-2 max-w-[280px] text-[13px] leading-relaxed text-zinc-400">
        Nothing was collected — or it was wiped the moment you asked. Either
        way, zero bytes remain. We take &ldquo;no&rdquo; seriously. Mostly.
      </p>

      <button
        type="button"
        onClick={onAgain}
        className="mt-6 flex h-[48px] w-full max-w-[260px] items-center justify-center rounded-2xl bg-[linear-gradient(180deg,#ffb340,#ff9505)] text-[14px] font-semibold text-[#2a1800] shadow-[0_4px_20px_-6px_rgba(255,149,5,0.65),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all duration-150 hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
      >
        Run it again
      </button>
      <button
        type="button"
        onClick={onCert}
        className="mt-2.5 flex h-11 w-full max-w-[260px] items-center justify-center rounded-xl border border-amber-400/25 bg-amber-400/[0.07] text-[12.5px] font-semibold text-amber-300 transition-colors duration-150 hover:bg-amber-400/[0.13] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60 active:scale-[0.98]"
      >
        Buy the certificate anyway — $15
      </button>
      <p className="mt-3 text-[11px] text-zinc-600">
        Deletion is free. The paper is not.
      </p>
    </motion.div>
  );
}

const TrashGlyph = (
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
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
  </svg>
);
