import { motion } from "motion/react";
import { formatFirstSeen, formatTime, visitsToday, type Analytics } from "../../lib/analytics";

const APP_LABELS: Record<string, string> = {
  home: "Home",
  calculator: "Calculator",
  flip: "Coin Flip",
  stopwatch: "Stopwatch",
  weather: "Weather",
  words: "Word Counter",
  hack: "Hacker Prank",
};

export function AdminDashboard({
  analytics,
  onClose,
}: {
  analytics: Analytics;
  onClose: () => void;
}) {
  const total = analytics.totalVisits;
  const today = visitsToday(analytics);
  const entries = Object.entries(analytics.appCounts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map(([, n]) => n));
  const recent = analytics.lastSeen.slice(0, 10);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Admin analytics"
      className="fixed inset-0 z-[60] flex items-end justify-center p-3 sm:items-center sm:p-6"
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <motion.button
        type="button"
        aria-label="Close"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 cursor-default bg-black/70 backdrop-blur-[6px]"
        tabIndex={-1}
      />
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: "spring", stiffness: 300, damping: 28, mass: 0.92 }}
        className="relative z-10 max-h-[90dvh] w-full max-w-[480px] overflow-y-auto rounded-[1.9rem] border border-white/10 bg-[#141419]/[0.97] p-5 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* header */}
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-amber-300">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden />
            Admin · Analytics
          </span>
          <button
            type="button"
            data-autofocus
            onClick={onClose}
            aria-label="Close"
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-zinc-400 transition-colors duration-150 hover:bg-white/[0.1] hover:text-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <h2 className="font-display mt-4 text-[27px] font-semibold tracking-[-0.01em] text-zinc-50">
          Who&rsquo;s been here.
        </h2>
        <p className="mt-1 text-[12.5px] text-zinc-500">
          Aggregate counts. No names, no devices, no data worth stealing.
        </p>

        {/* headline stats */}
        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3.5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Total visits
            </p>
            <p className="font-display mt-1 text-[30px] font-semibold tabular-nums text-amber-300">
              {total}
            </p>
          </div>
          <div className="rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3.5">
            <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
              Today
            </p>
            <p className="font-display mt-1 text-[30px] font-semibold tabular-nums text-zinc-100">
              {today}
            </p>
          </div>
        </div>

        {/* per-app bars */}
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Apps used
        </p>
        <div className="mt-2 space-y-2">
          {entries.length === 0 && (
            <p className="text-[12px] text-zinc-600">no apps visited yet.</p>
          )}
          {entries.map(([app, n]) => (
            <div key={app}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-zinc-200">{APP_LABELS[app] ?? app}</span>
                <span className="font-semibold tabular-nums text-zinc-400">{n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / max) * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffb340,#ff9505)]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* recent visits */}
        <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
          Recent visits
        </p>
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
          {recent.map((ts, i) => (
            <div
              key={`${ts}-${i}`}
              className="flex items-center justify-between border-b border-white/[0.05] px-3.5 py-2 last:border-b-0"
            >
              <span className="text-[11.5px] tabular-nums text-zinc-300">{formatTime(ts)}</span>
              <span className="text-[10px] uppercase tracking-[0.14em] text-zinc-600">
                {i === 0 ? "latest" : `${i + 1} ago`}
              </span>
            </div>
          ))}
          {recent.length === 0 && (
            <p className="px-3.5 py-2.5 text-[11.5px] text-zinc-600">nothing yet.</p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-black/25 px-4 py-3">
          <span className="text-[11px] text-zinc-500">First seen</span>
          <span className="text-[11.5px] font-medium text-zinc-300">{formatFirstSeen(analytics.firstSeen)}</span>
        </div>

        <p className="mt-4 text-center text-[10.5px] leading-relaxed text-zinc-600">
          Counts live in this browser&rsquo;s localStorage — no server, no
          personal data. Your friends&rsquo; visits count on their own machines.
          Type &ldquo;admin&rdquo; anywhere to open this again.
        </p>
      </motion.div>
    </div>
  );
}
