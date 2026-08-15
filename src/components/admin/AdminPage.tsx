import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "motion/react";
import { fetchGlobalAnalytics, type GlobalAnalytics } from "../../lib/remoteAnalytics";
import { ANALYTICS_KEY, formatFirstSeen, formatTime, loadAnalytics, type Analytics } from "../../lib/analytics";
import { dayKey, hourKey, type RecentEntry } from "../../lib/analyticsServer";

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
    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{children}</p>
  );
}

function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 ${className}`}>
      {children}
    </div>
  );
}

function Stat({ label, value, accent = false }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <Panel className="px-5 py-4">
      <p className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p
        className={`font-display mt-1.5 text-[32px] font-semibold leading-none tabular-nums ${
          accent ? "text-amber-300" : "text-zinc-100"
        }`}
      >
        {value}
      </p>
    </Panel>
  );
}

function BarList({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, n]) => n));
  return (
    <div className="mt-3 space-y-2">
      {data.length === 0 && <p className="text-[11.5px] text-zinc-600">nothing yet.</p>}
      {data.map(([label, n]) => (
        <div key={label}>
          <div className="flex items-center justify-between gap-3 text-[11.5px]">
            <span className="truncate text-zinc-300">{label}</span>
            <span className="font-semibold tabular-nums text-zinc-500">{n}</span>
          </div>
          <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.07]">
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

function Chart({
  data,
  label,
  height = 120,
}: {
  data: { label: string; count: number }[];
  label: string;
  height?: number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  const step = Math.max(1, Math.ceil(data.length / 10));
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div
        className="mt-3 flex items-end gap-[3px]"
        style={{ height }}
      >
        {data.length === 0 && <p className="text-[11.5px] text-zinc-600">nothing yet.</p>}
        {data.map((d) => (
          <div
            key={d.label}
            title={`${d.label}: ${d.count}`}
            className="group relative flex-1 rounded-t-[3px] bg-white/[0.06] transition-colors hover:bg-amber-400/40"
            style={{ height: `${Math.max(5, (d.count / max) * 100)}%` }}
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
      <div className="mt-1.5 flex gap-[3px]">
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

export function AdminPage() {
  const [global, setGlobal] = useState<GlobalAnalytics | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [appFilter, setAppFilter] = useState<string>("all");
  const [query, setQuery] = useState("");

  const local: Analytics = useMemo(
    () =>
      loadAnalytics({
        get: () => localStorage.getItem(ANALYTICS_KEY),
        set: () => {},
      }),
    [],
  );

  const load = useCallback(() => {
    fetchGlobalAnalytics().then((g) => {
      if (g) setGlobal(g);
      setLoaded(true);
      setLastUpdated(Date.now());
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const id = setInterval(load, 15000);
    return () => clearInterval(id);
  }, [autoRefresh, load]);

  /* derived stats */
  const total = global ? global.totalVisits : local.totalVisits;
  const todayUtc = new Date().toISOString().slice(0, 10);
  const yesterdayUtc = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const weekAgo = new Date(Date.now() - 6 * 86_400_000).toISOString().slice(0, 10);

  /* local fallback derives the same shapes the server sends, from lastSeen */
  const localDays = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of local.lastSeen) {
      const d = dayKey(t);
      counts[d] = (counts[d] ?? 0) + 1;
    }
    return Object.keys(counts)
      .sort()
      .slice(-14)
      .map((day) => ({ day, count: counts[day] }));
  }, [local]);

  const localHours = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of local.lastSeen) {
      const h = hourKey(t);
      counts[h] = (counts[h] ?? 0) + 1;
    }
    return Object.keys(counts)
      .sort()
      .slice(-24)
      .map((hour) => ({ hour, count: counts[hour] }));
  }, [local]);

  const days = global ? global.days : localDays;
  const hours = global ? global.hours : localHours;
  const today = global ? (global.days.find((d) => d.day === todayUtc)?.count ?? 0) : (localDays.find((d) => d.day === todayUtc)?.count ?? 0);
  const yesterday = global
    ? (global.days.find((d) => d.day === yesterdayUtc)?.count ?? 0)
    : (localDays.find((d) => d.day === yesterdayUtc)?.count ?? 0);
  const thisWeek = global
    ? global.days.filter((d) => d.day >= weekAgo).reduce((s, d) => s + d.count, 0)
    : localDays.filter((d) => d.day >= weekAgo).reduce((s, d) => s + d.count, 0);
  const bestDay = global
    ? global.days.reduce<{ day: string; count: number } | null>(
        (best, d) => (!best || d.count > best.count ? d : best),
        null,
      )
    : null;
  const peakHour = global
    ? global.hours.reduce<{ hour: string; count: number } | null>(
        (best, h) => (!best || h.count > best.count ? h : best),
        null,
      )
    : null;
  const appOpens = global
    ? Object.values(global.apps).reduce((s, n) => s + n, 0)
    : Object.values(local.appCounts).reduce((s, n) => s + n, 0);

  const appEntries = (global ? Object.entries(global.apps) : Object.entries(local.appCounts)).sort(
    (a, b) => b[1] - a[1],
  );

  const top = (m: Record<string, number> | undefined, n = 6) =>
    Object.entries(m ?? {}).sort((a, b) => b[1] - a[1]).slice(0, n);

  /* last-7-days per-app trend from the recent ring */
  const weekCut = Date.now() - 7 * 86_400_000;
  const last7ByApp = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of global?.recent ?? []) {
      if (e.t < weekCut) continue;
      const app = e.a ?? "home";
      counts[app] = (counts[app] ?? 0) + 1;
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [global, weekCut]);

  /* filtered recent table */
  const recentRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let rows: RecentEntry[] = global?.recent ?? [];
    if (appFilter !== "all") rows = rows.filter((e) => (e.a ?? "home") === appFilter);
    if (q) {
      rows = rows.filter((e) => {
        const hay = [
          countryName(e.c ?? ""),
          e.b ?? "",
          e.d ?? "",
          e.s ?? "",
          e.l ?? "",
          e.r ?? "",
          APP_LABELS[e.a ?? "home"] ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
    }
    return rows.slice(0, 40);
  }, [global, appFilter, query]);

  const exportData = () => {
    const payload = global ?? { local, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "should-be-free-analytics.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const live = global !== null;

  return (
    <div className="min-h-dvh w-full bg-[#0b0b0e] text-zinc-200">
      {/* header */}
      <header className="sticky top-0 z-10 border-b border-white/[0.06] bg-[#0b0b0e]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div className="flex items-center gap-3">
            <a href="#/" className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60">
              <span className="grid h-8 w-8 place-items-center rounded-full border border-amber-400/40 bg-[linear-gradient(155deg,#ffd98a,#f5a623_40%,#c97f0a)] text-[14px] font-extrabold text-[#5b3400]">
                $
              </span>
            </a>
            <div>
              <h1 className="font-display text-[17px] font-semibold tracking-[-0.01em] text-zinc-50">
                Admin Console
              </h1>
              <p className="text-[10.5px] text-zinc-500">
                {live ? "Live · global counters" : loaded ? "Local fallback · server offline or unconfigured" : "Syncing…"}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[9.5px] font-semibold uppercase tracking-[0.16em] ${
                live ? "border-amber-400/25 bg-amber-400/10 text-amber-300" : "border-white/[0.1] bg-white/[0.05] text-zinc-400"
              }`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${live ? "animate-pulse bg-amber-400" : "bg-zinc-500"}`} aria-hidden />
              {live ? "LIVE" : "LOCAL"}
            </span>
            {lastUpdated && (
              <span className="text-[10.5px] tabular-nums text-zinc-600">
                {new Date(lastUpdated).toLocaleTimeString()}
              </span>
            )}
            <button
              type="button"
              onClick={() => setAutoRefresh((v) => !v)}
              className={`rounded-full border px-3 py-1.5 text-[10.5px] font-semibold transition-colors ${
                autoRefresh
                  ? "border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20"
                  : "border-white/[0.1] bg-white/[0.04] text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Auto-refresh {autoRefresh ? "on" : "off"}
            </button>
            <button
              type="button"
              onClick={load}
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[10.5px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.1]"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={exportData}
              className="rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1.5 text-[10.5px] font-semibold text-amber-300 transition-colors hover:bg-amber-400/20"
            >
              Export JSON
            </button>
            <a
              href="#/"
              className="rounded-full border border-white/[0.1] bg-white/[0.04] px-3 py-1.5 text-[10.5px] font-semibold text-zinc-300 transition-colors hover:bg-white/[0.1]"
            >
              Exit →
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1180px] px-5 pb-16 pt-6">
        {/* headline stats */}
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-8">
          <Stat label="Total visits" value={total} accent />
          <Stat label="Today" value={today} />
          <Stat label="Yesterday" value={yesterday} />
          <Stat label="This week" value={thisWeek} />
          <Stat label="App opens" value={appOpens} />
          <Stat label="Best day" value={bestDay ? bestDay.count : "—"} />
          <Stat label="Peak hour" value={peakHour ? `${peakHour.hour.slice(11)}:00` : "—"} />
          <Stat label="First seen" value={formatFirstSeen(global?.firstSeen ?? local.firstSeen)} />
        </div>

        {/* time series */}
        <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
          <Panel>
            <Chart
              label="Visits · last 14 days"
              data={days.map((d) => ({ label: d.day.slice(5), count: d.count }))}
              height={130}
            />
          </Panel>
          <Panel>
            <Chart
              label="Visits · last 24 hours"
              data={hours.map((h) => ({ label: h.hour.slice(11), count: h.count }))}
              height={130}
            />
          </Panel>
        </div>

        {/* apps */}
        <div className="mt-3 grid gap-2.5 lg:grid-cols-2">
          <Panel>
            <SectionLabel>Apps · all time</SectionLabel>
            <div className="mt-2 space-y-2">
              {appEntries.length === 0 && <p className="text-[12px] text-zinc-600">no apps visited yet.</p>}
              {appEntries.map(([app, n]) => {
                const max = Math.max(1, ...appEntries.map(([, x]) => x));
                return (
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
                );
              })}
            </div>
          </Panel>
          <Panel>
            <SectionLabel>Apps · last 7 days (from recent ring)</SectionLabel>
            <BarList data={last7ByApp.map(([a, n]) => [APP_LABELS[a] ?? a, n])} />
          </Panel>
        </div>

        {/* dimensions */}
        <div className="mt-3 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
          <Panel>
            <SectionLabel>Countries</SectionLabel>
            <BarList data={top(global?.countries).map(([c, n]) => [countryName(c), n])} />
          </Panel>
          <Panel>
            <SectionLabel>Browsers</SectionLabel>
            <BarList data={top(global?.browsers)} />
          </Panel>
          <Panel>
            <SectionLabel>Devices</SectionLabel>
            <BarList data={top(global?.devices)} />
          </Panel>
          <Panel>
            <SectionLabel>Referrers</SectionLabel>
            <BarList data={top(global?.refs)} />
          </Panel>
          <Panel>
            <SectionLabel>Screens</SectionLabel>
            <BarList data={top(global?.screens)} />
          </Panel>
          <Panel>
            <SectionLabel>Languages</SectionLabel>
            <BarList data={top(global?.langs)} />
          </Panel>
        </div>

        {/* recent visits table */}
        <Panel className="mt-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionLabel>Recent visits · {global ? `last ${global.recent.length} captured` : "this browser"}</SectionLabel>
            <div className="flex items-center gap-2">
              <select
                value={appFilter}
                onChange={(e) => setAppFilter(e.target.value)}
                className="rounded-lg border border-white/[0.1] bg-[#15151a] px-2.5 py-1.5 text-[11px] text-zinc-300 focus:border-amber-400/50 focus:outline-none"
              >
                <option value="all">All apps</option>
                {Object.entries(APP_LABELS).map(([id, name]) => (
                  <option key={id} value={id}>
                    {name}
                  </option>
                ))}
              </select>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search country, browser, device…"
                className="w-52 rounded-lg border border-white/[0.1] bg-[#15151a] px-2.5 py-1.5 text-[11px] text-zinc-300 placeholder:text-zinc-600 focus:border-amber-400/50 focus:outline-none"
              />
            </div>
          </div>

          {global ? (
            <>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-white/[0.08] text-[9.5px] uppercase tracking-[0.14em] text-zinc-600">
                      <th className="py-2 pr-3 font-semibold">Time</th>
                      <th className="py-2 pr-3 font-semibold">App</th>
                      <th className="py-2 pr-3 font-semibold">Country</th>
                      <th className="py-2 pr-3 font-semibold">Browser</th>
                      <th className="py-2 pr-3 font-semibold">Device</th>
                      <th className="py-2 pr-3 font-semibold">Screen</th>
                      <th className="py-2 pr-3 font-semibold">Lang</th>
                      <th className="py-2 font-semibold">Referrer</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentRows.map((e, i) => (
                      <tr key={`${e.t}-${i}`} className="border-b border-white/[0.04] last:border-b-0">
                        <td className="py-1.5 pr-3 text-[11px] tabular-nums text-zinc-400">{formatTime(e.t)}</td>
                        <td className="py-1.5 pr-3 text-[11px] text-zinc-300">
                          {e.a ? (APP_LABELS[e.a] ?? e.a) : <span className="text-zinc-600">home</span>}
                        </td>
                        <td className="py-1.5 pr-3 text-[11px] text-zinc-400">{e.c ? countryName(e.c) : "—"}</td>
                        <td className="py-1.5 pr-3 text-[11px] text-zinc-400">{e.b ?? "—"}</td>
                        <td className="py-1.5 pr-3 text-[11px] text-zinc-400">{e.d ?? "—"}</td>
                        <td className="py-1.5 pr-3 text-[11px] tabular-nums text-zinc-500">{e.s ?? "—"}</td>
                        <td className="py-1.5 pr-3 text-[11px] text-zinc-500">{e.l ?? "—"}</td>
                        <td className="py-1.5 text-[11px] text-zinc-500">{e.r ?? "—"}</td>
                      </tr>
                    ))}
                    {recentRows.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-3 text-[11.5px] text-zinc-600">
                          nothing matches.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-[10px] text-zinc-600">
                Ring keeps the last 1,000 visits. All counters are permanent. Nothing here identifies anyone — no names, no IPs, no fingerprints.
              </p>
            </>
          ) : (
            <p className="mt-3 text-[12px] text-zinc-600">
              {loaded
                ? "Server analytics are not configured on this deployment — showing this browser only. Add UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in Vercel and redeploy to see global data."
                : "Syncing…"}
            </p>
          )}
        </Panel>
      </main>
    </div>
  );
}
