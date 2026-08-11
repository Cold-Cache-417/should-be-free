import { useEffect, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { formatFirstSeen, formatTime, visitsToday, type Analytics } from "../../lib/analytics";
import { fetchGlobalAnalytics, type GlobalAnalytics } from "../../lib/remoteAnalytics";
import type { RecentEntry } from "../../lib/analyticsServer";

const APP_LABELS: Record<string, string> = {
  home: "Home",
  calculator: "Calculator",
  flip: "Coin Flip",
  stopwatch: "Stopwatch",
  weather: "Weather",
  words: "Word Counter",
  hack: "Hacker Prank",
};

const COUNTRIES: Record<string, string> = {
  US: "United States",
  GB: "United Kingdom",
  IN: "India",
  DE: "Germany",
  FR: "France",
  BR: "Brazil",
  JP: "Japan",
  CA: "Canada",
  AU: "Australia",
  NL: "Netherlands",
  SE: "Sweden",
  NO: "Norway",
  DK: "Denmark",
  FI: "Finland",
  IE: "Ireland",
  ES: "Spain",
  IT: "Italy",
  PT: "Portugal",
  PL: "Poland",
  UA: "Ukraine",
  TR: "Turkey",
  AE: "United Arab Emirates",
  SA: "Saudi Arabia",
  EG: "Egypt",
  NG: "Nigeria",
  KE: "Kenya",
  ZA: "South Africa",
  MX: "Mexico",
  AR: "Argentina",
  CO: "Colombia",
  CL: "Chile",
  PE: "Peru",
  ID: "Indonesia",
  MY: "Malaysia",
  SG: "Singapore",
  TH: "Thailand",
  VN: "Vietnam",
  PH: "Philippines",
  KR: "South Korea",
  TW: "Taiwan",
  HK: "Hong Kong",
  CN: "China",
  RU: "Russia",
  IL: "Israel",
  PK: "Pakistan",
  BD: "Bangladesh",
  NZ: "New Zealand",
  CH: "Switzerland",
  AT: "Austria",
  BE: "Belgium",
  CZ: "Czechia",
  GR: "Greece",
  HU: "Hungary",
  RO: "Romania",
  BG: "Bulgaria",
  SK: "Slovakia",
  HR: "Croatia",
  RS: "Serbia",
  LT: "Lithuania",
  LV: "Latvia",
  EE: "Estonia",
  IS: "Iceland",
  LU: "Luxembourg",
  MT: "Malta",
  CY: "Cyprus",
  LK: "Sri Lanka",
  NP: "Nepal",
  IR: "Iran",
  IQ: "Iraq",
  JO: "Jordan",
  LB: "Lebanon",
  KW: "Kuwait",
  QA: "Qatar",
  BH: "Bahrain",
  OM: "Oman",
  MM: "Myanmar",
  KH: "Cambodia",
  ET: "Ethiopia",
  TZ: "Tanzania",
  UG: "Uganda",
  GH: "Ghana",
  SN: "Senegal",
  CM: "Cameroon",
  DZ: "Algeria",
  MA: "Morocco",
  TN: "Tunisia",
  VE: "Venezuela",
  EC: "Ecuador",
  UY: "Uruguay",
  BO: "Bolivia",
  PY: "Paraguay",
  CR: "Costa Rica",
  PA: "Panama",
  DO: "Dominican Republic",
  CU: "Cuba",
  JM: "Jamaica",
  HT: "Haiti",
  TT: "Trinidad",
};

const countryName = (code: string) => COUNTRIES[code] ?? code;

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{children}</p>
  );
}

function BarList({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <div className="mt-2 space-y-1.5">
      {data.length === 0 && <p className="text-[11.5px] text-zinc-600">nothing yet.</p>}
      {data.map(([label, n]) => (
        <div key={label}>
          <div className="flex items-center justify-between text-[11.5px]">
            <span className="truncate pr-2 text-zinc-300">{label}</span>
            <span className="font-semibold tabular-nums text-zinc-500">{n}</span>
          </div>
          <div className="mt-0.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
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
  );
}

function MiniChart({ data, label }: { data: { label: string; count: number }[]; label: string }) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = Math.max(1, Math.ceil(data.length / 8));
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-2 flex h-16 items-end gap-[3px]">
        {data.length === 0 && <p className="text-[11.5px] text-zinc-600">nothing yet.</p>}
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${d.count}`}
            className="group relative flex-1 rounded-t-[3px] bg-white/[0.09] transition-colors hover:bg-amber-400/60"
            style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }}
          >
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "100%" }}
              transition={{ type: "spring", stiffness: 180, damping: 24 }}
              className="absolute inset-x-0 bottom-0 rounded-t-[3px] bg-[linear-gradient(180deg,#ffd98a,#f5a623_55%,#c97f0a)]"
            />
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-[3px]">
        {data.map((d, i) => (
          <span
            key={d.label}
            className={`flex-1 text-center text-[8.5px] tabular-nums text-zinc-600 ${i % step === 0 ? "" : "invisible"}`}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminDashboard({
  analytics,
  onClose,
}: {
  analytics: Analytics;
  onClose: () => void;
}) {
  const [global, setGlobal] = useState<GlobalAnalytics | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchGlobalAnalytics().then((g) => {
      if (!alive) return;
      setGlobal(g);
      setLoaded(true);
    });
    return () => {
      alive = false;
    };
  }, []);

  const total = global ? global.totalVisits : analytics.totalVisits;
  const todayUtc = new Date().toISOString().slice(0, 10);
  const today = global
    ? (global.days.find((d) => d.day === todayUtc)?.count ?? 0)
    : visitsToday(analytics);

  const appEntries = (global ? Object.entries(global.apps) : Object.entries(analytics.appCounts)).sort(
    (a, b) => b[1] - a[1],
  );
  const maxApp = Math.max(1, ...appEntries.map(([, n]) => n));

  const top5 = (m: Record<string, number> | undefined) =>
    Object.entries(m ?? {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

  const recent: RecentEntry[] = global
    ? global.recent.slice(0, 10)
    : analytics.lastSeen.slice(0, 10).map((ts) => ({ t: ts }));

  const firstSeen = global ? global.firstSeen : analytics.firstSeen;

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
        className="relative z-10 max-h-[92dvh] w-full max-w-[560px] overflow-y-auto rounded-[1.9rem] border border-white/10 bg-[#141419]/[0.97] p-5 shadow-[0_50px_120px_-30px_rgba(0,0,0,0.9)] sm:p-6"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        />

        {/* header */}
        <div className="flex items-center justify-between">
          <span
            className={`flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              global
                ? "border-amber-400/25 bg-amber-400/10 text-amber-300"
                : "border-white/[0.1] bg-white/[0.05] text-zinc-400"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${global ? "bg-amber-400" : "bg-zinc-500"}`}
              aria-hidden
            />
            {global ? "Admin · Live" : loaded ? "Admin · Local" : "Admin · Syncing…"}
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
          {global
            ? "Aggregate counts from the server — every visit, everywhere."
            : "Server not wired yet — showing this browser only."}
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

        {/* time series */}
        {global && (
          <>
            <MiniChart
              data={global.days.map((d) => ({ label: d.day.slice(5), count: d.count }))}
              label="Last 14 days"
            />
            <MiniChart
              data={global.hours.map((h) => ({ label: h.hour.slice(11), count: h.count }))}
              label="Last 24 hours"
            />
          </>
        )}

        {/* per-app bars */}
        <SectionLabel>Apps used</SectionLabel>
        <div className="mt-2 space-y-2">
          {appEntries.length === 0 && <p className="text-[12px] text-zinc-600">no apps visited yet.</p>}
          {appEntries.map(([app, n]) => (
            <div key={app}>
              <div className="flex items-center justify-between text-[12px]">
                <span className="font-medium text-zinc-200">{APP_LABELS[app] ?? app}</span>
                <span className="font-semibold tabular-nums text-zinc-400">{n}</span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(n / maxApp) * 100}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                  className="h-full rounded-full bg-[linear-gradient(90deg,#ffb340,#ff9505)]"
                />
              </div>
            </div>
          ))}
        </div>

        {/* breakdown grid */}
        <div className="mt-5 grid grid-cols-2 gap-x-5">
          <div>
            <SectionLabel>Countries</SectionLabel>
            <BarList data={top5(global?.countries).map(([c, n]) => [countryName(c), n])} />
          </div>
          <div>
            <SectionLabel>Browsers</SectionLabel>
            <BarList data={top5(global?.browsers)} />
          </div>
          <div className="mt-4">
            <SectionLabel>Devices</SectionLabel>
            <BarList data={top5(global?.devices)} />
          </div>
          <div className="mt-4">
            <SectionLabel>Referrers</SectionLabel>
            <BarList data={top5(global?.refs)} />
          </div>
        </div>

        {/* recent visits */}
        <SectionLabel>Recent visits</SectionLabel>
        <div className="mt-2 overflow-hidden rounded-2xl border border-white/[0.07] bg-black/20">
          {recent.map((entry, i) => (
            <div
              key={`${entry.t}-${i}`}
              className="flex items-center justify-between gap-2 border-b border-white/[0.05] px-3.5 py-2 last:border-b-0"
            >
              <span className="truncate text-[11.5px] tabular-nums text-zinc-300">
                {formatTime(entry.t)}
                {entry.a && <span className="ml-2 text-zinc-500">{APP_LABELS[entry.a] ?? entry.a}</span>}
                {entry.c && <span className="ml-2 text-zinc-600">{countryName(entry.c)}</span>}
              </span>
              <span className="shrink-0 text-[10px] uppercase tracking-[0.14em] text-zinc-600">
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
          <span className="text-[11.5px] font-medium text-zinc-300">{formatFirstSeen(firstSeen ?? 0)}</span>
        </div>

        <p className="mt-4 text-center text-[10.5px] leading-relaxed text-zinc-600">
          Aggregate, anonymous counts — no names, no devices, no fingerprints,
          nothing per visitor. The raw ring keeps the last 1,000 visits; every
          counter is permanent. Type &ldquo;admin&rdquo; anywhere to open this again.
        </p>
      </motion.div>
    </div>
  );
}
