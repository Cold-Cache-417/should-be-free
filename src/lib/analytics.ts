/*
 * Analytics engine — aggregate and anonymous.
 *
 * Counts page loads and per-app visits. No personal data: no
 * fingerprints, no identities, no per-visitor profiles, no location —
 * just numbers. Storage is injectable; the app uses localStorage,
 * which means counts are per-browser (a server-side store can be
 * swapped in later without touching this file).
 */

export interface Analytics {
  totalVisits: number;
  appCounts: Record<string, number>;
  /** Timestamps of recent visits, newest first. */
  lastSeen: number[];
  firstSeen: number;
}

export const ANALYTICS_KEY = "sbf:analytics:v1";
const MAX_SEEN = 100;

export interface Store {
  get: () => string | null;
  set: (value: string) => void;
}

export function emptyAnalytics(): Analytics {
  return { totalVisits: 0, appCounts: {}, lastSeen: [], firstSeen: 0 };
}

export function parseAnalytics(raw: string | null): Analytics {
  if (!raw) return emptyAnalytics();
  try {
    const j = JSON.parse(raw) as Partial<Analytics>;
    return {
      totalVisits: typeof j.totalVisits === "number" ? j.totalVisits : 0,
      appCounts: j.appCounts && typeof j.appCounts === "object" ? (j.appCounts as Record<string, number>) : {},
      lastSeen: Array.isArray(j.lastSeen) ? j.lastSeen.filter((n) => typeof n === "number").slice(0, MAX_SEEN) : [],
      firstSeen: typeof j.firstSeen === "number" ? j.firstSeen : 0,
    };
  } catch {
    return emptyAnalytics();
  }
}

export function loadAnalytics(store: Store): Analytics {
  try {
    return parseAnalytics(store.get());
  } catch {
    return emptyAnalytics();
  }
}

export function saveAnalytics(a: Analytics, store: Store): void {
  try {
    store.set(JSON.stringify(a));
  } catch {
    /* storage full or blocked — analytics are optional */
  }
}

export function withVisit(a: Analytics, now: number = Date.now()): Analytics {
  return {
    totalVisits: a.totalVisits + 1,
    appCounts: a.appCounts,
    lastSeen: [now, ...a.lastSeen].slice(0, MAX_SEEN),
    firstSeen: a.firstSeen === 0 ? now : a.firstSeen,
  };
}

export function withApp(a: Analytics, app: string): Analytics {
  return {
    ...a,
    appCounts: { ...a.appCounts, [app]: (a.appCounts[app] ?? 0) + 1 },
  };
}

/** Visits that landed today (same calendar day as `now`). */
export function visitsToday(a: Analytics, now: number = Date.now()): number {
  const day = new Date(now);
  const start = new Date(day.getFullYear(), day.getMonth(), day.getDate()).getTime();
  return a.lastSeen.filter((t) => t >= start).length;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  if (sameDay) return `today ${hh}:${mm}`;
  return `${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} ${hh}:${mm}`;
}

export function formatFirstSeen(ts: number): string {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
