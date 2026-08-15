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
  /** OS family */
  o?: string;
  /** device model, when the UA reveals one */
  m?: string;
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
  /** OS family → visits */
  os: Record<string, number>;
  /** device model → visits (only models the UA reveals) */
  models: Record<string, number>;
  /** hour of day (UTC 0-23) → visits */
  hoursOfDay: Record<string, number>;
  /** weekday (UTC 0=Sun .. 6=Sat) → visits */
  weekdays: Record<string, number>;
  /** app → fake purchases */
  paywalls: Record<string, number>;
  /** app → total milliseconds of engaged time */
  timeSum: Record<string, number>;
  /** app → number of time reports */
  timeCount: Record<string, number>;
  /** bot/preview request families → count */
  shares: Record<string, number>;
  /** distinct sessions (server-side bucketing, no identifiers) */
  sessions: number;
  /** engaged milliseconds summed across active sessions */
  sessDur: number;
  /** sessions that reached at least two page events */
  multiPage: number;
  recent: RecentEntry[];
}

/** Parse the browser family, device class, OS family and device model. */
export function parseUa(ua: string | null, mobileHint: string | null): {
  browser: string;
  device: string;
  os: string;
  model: string;
} {
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

  let os = "Other";
  if (/iPhone|iPad|iPod/i.test(u)) os = "iOS";
  else if (/Android/i.test(u)) os = "Android";
  else if (/Windows/i.test(u)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(u)) os = "macOS";
  else if (/CrOS|Chromebook/i.test(u)) os = "ChromeOS";
  else if (/Linux|X11/i.test(u)) os = "Linux";

  /* Device models browsers actually volunteer: Android builds put the
     hardware name in the UA ("SM-G998B", "Pixel 8"); iOS only says
     iPhone/iPad — the exact model is never exposed. */
  let model = "";
  if (/iPhone/i.test(u)) model = "iPhone";
  else if (/iPad/i.test(u)) model = "iPad";
  /* Android puts the hardware name before "Build/" (Samsung etc.) or as the
     last token after the Android version (stock Chrome: "Android 14; Pixel 8"). */
  const androidBuild = u.match(/;\s*([^;()]+?)\s*Build\//);
  if (androidBuild && androidBuild[1]) model = androidBuild[1].trim();
  if (!model) {
    const androidDev = u.match(/Android\s+[\d.]+;\s*([^;()]+)/);
    if (androidDev && androidDev[1]) model = androidDev[1].trim();
  }

  return { browser, device, os, model };
}

export type BotFamily = "messenger" | "search" | "ai" | "monitor" | "other";

const BOT_RE =
  /bot|crawl|spider|slurp|scan|lighthouse|headless|preview|monitor|uptime|pingdom|statuscake|vercel|googlebot|bingbot|duckduckbot|semrush|ahrefs|mj12|petalbot|gptbot|claudebot|perplexity|ccbot|bytespider|applebot|facebookexternalhit|whatsapp|telegram|twitterbot|linkedinbot|slackbot|discordbot|skypeuripreview|yandex|baidu|sogou|exabot|ia_archiver/i;

/**
 * Classify automated requests so the human counters stay clean.
 * Messenger crawlers (WhatsApp/Telegram/Instagram link previews) are the
 * interesting case: they mean someone pasted the link into a chat — a
 * sharing signal, counted separately, never as a visit.
 */
export function botFamily(ua: string | null): BotFamily | null {
  const u = (ua ?? "").toLowerCase();
  if (!u || !BOT_RE.test(u)) return null;
  if (/whatsapp|telegram|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot|skypeuripreview|line\/|viber|messenger/i.test(u))
    return "messenger";
  if (/googlebot|bingbot|duckduckbot|yandex|baidu|sogou|exabot|ia_archiver|slurp|petalbot/i.test(u)) return "search";
  if (/gptbot|claudebot|perplexity|ccbot|bytespider|applebot|anthropic|openai/i.test(u)) return "ai";
  if (/monitor|uptime|pingdom|statuscake|lighthouse/i.test(u)) return "monitor";
  return "other";
}

/**
 * Short stable hash of a seed (djb2). Used only to bucket requests into
 * server-side sessions — the raw IP/UA is never stored, and the hash is
 * transient (TTL-scoped) and never exposed in any output.
 */
export function hashKey(seed: string): string {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h + seed.charCodeAt(i)) >>> 0;
  return h.toString(36);
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

/** UTC hour of day (0-23) and weekday index (0=Sun). */
export function timeOfDay(ts: number): { hour: number; weekday: number } {
  const d = new Date(ts);
  return { hour: d.getUTCHours(), weekday: d.getUTCDay() };
}
