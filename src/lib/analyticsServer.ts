/*
 * Pure helpers shared by the serverless analytics API (api/analytics.ts)
 * and its tests. Everything here turns a raw request into anonymous
 * aggregate counters — no personal data, no per-visitor profiles.
 */

export interface RecentEntry {
  /** epoch ms */
  t: number;
  /** app id, if any */
  a?: string;
  /** external referrer domain, if any */
  r?: string;
  /** country code, if the platform provided it */
  c?: string;
  /** browser family */
  b?: string;
  /** device class */
  d?: string;
  /** screen size, e.g. "1920x1080" */
  s?: string;
  /** primary language, e.g. "en-us" */
  l?: string;
}

/** Shape returned by GET /api/analytics. */
export interface GlobalAnalytics {
  ok: true;
  totalVisits: number;
  firstSeen: number | null;
  apps: Record<string, number>;
  days: { day: string; count: number }[];
  hours: { hour: string; count: number }[];
  countries: Record<string, number>;
  browsers: Record<string, number>;
  devices: Record<string, number>;
  refs: Record<string, number>;
  screens: Record<string, number>;
  langs: Record<string, number>;
  recent: RecentEntry[];
}

export interface UaInfo {
  browser: string;
  device: string;
}

/** Coarse, aggregate-only browser family + device class from a UA string. */
export function parseUa(ua: string, mobileHint: string | null): UaInfo {
  const u = ua ?? "";
  let device: string;
  if (mobileHint === "?1") {
    device = "Mobile";
  } else if (/iPad|Tablet|Silk/i.test(u)) {
    device = "Tablet";
  } else if (/Mobile|iPhone|iPod|Android/i.test(u)) {
    device = "Mobile";
  } else {
    device = "Desktop";
  }

  let browser: string;
  if (/Edg\//i.test(u)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(u)) browser = "Opera";
  else if (/SamsungBrowser/i.test(u)) browser = "Samsung Internet";
  else if (/Chrome\/|CriOS\//i.test(u)) browser = "Chrome";
  else if (/Firefox\/|FxiOS\//i.test(u)) browser = "Firefox";
  else if (/Safari\//i.test(u)) browser = "Safari";
  else browser = "Other";

  return { browser, device };
}

/** Top-level domain of a referrer, without protocol or www. */
export function domainOf(ref: string | null): string | null {
  if (!ref) return null;
  try {
    const host = new URL(ref).hostname;
    return host.replace(/^www\./, "") || null;
  } catch {
    return null;
  }
}

/** UTC calendar-day bucket, e.g. "2026-08-11". */
export function dayKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

/** UTC hour bucket, e.g. "2026-08-11-14". */
export function hourKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 13).replace("T", "-");
}
