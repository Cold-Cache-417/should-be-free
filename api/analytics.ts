/*
 * Analytics API — Vercel Function backed by Upstash Redis (REST, no SDK).
 *
 *   POST /api/analytics   record a visit or app usage
 *   GET  /api/analytics   read the global aggregate snapshot
 *
 * Aggregate-only by design: counters for visits, apps, countries,
 * browsers, devices and referrers, plus day/hour histograms and a
 * bounded recent-visits ring. No IPs, no fingerprints, no identities.
 * Aggregates are never trimmed — only the raw ring buffer is capped.
 *
 * Env: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 * Without them the API answers 503 and the site falls back to local counts.
 */

import {
  dayKey,
  domainOf,
  hourKey,
  parseUa,
  type GlobalAnalytics,
  type RecentEntry,
} from "../src/lib/analyticsServer.js";

const REST_URL = process.env.UPSTASH_REDIS_REST_URL ?? "";
const REST_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN ?? "";

const KEY = {
  total: "sbf:total",
  apps: "sbf:apps",
  days: "sbf:days",
  hours: "sbf:hours",
  countries: "sbf:countries",
  browsers: "sbf:browsers",
  devices: "sbf:devices",
  refs: "sbf:refs",
  screens: "sbf:screens",
  langs: "sbf:langs",
  recent: "sbf:recent",
  firstSeen: "sbf:firstSeen",
} as const;

const RECENT_CAP = 1000;

interface UpstashResult {
  result?: unknown;
  error?: string;
}

async function run<T>(...segments: (string | number)[]): Promise<T> {
  const path = segments.map((s) => encodeURIComponent(String(s))).join("/");
  const res = await fetch(`${REST_URL}/${path}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` },
  });
  if (!res.ok) throw new Error(`upstash ${res.status}`);
  const j = (await res.json()) as UpstashResult;
  if (j.error) throw new Error(j.error);
  return j.result as T;
}

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function POST(req: Request): Promise<Response> {
  if (!REST_URL || !REST_TOKEN) return json({ ok: false, reason: "not configured" }, 503);

  let body: { type?: unknown; app?: unknown; screen?: unknown; lang?: unknown } = {};
  try {
    body = JSON.parse(await req.text()) as {
      type?: unknown;
      app?: unknown;
      screen?: unknown;
      lang?: unknown;
    };
  } catch {
    /* empty body — counts as a visit */
  }

  const type = body.type === "app" ? "app" : "visit";
  const app = typeof body.app === "string" ? body.app.slice(0, 32) : undefined;
  const screen =
    typeof body.screen === "string" && /^\d{1,5}x\d{1,5}$/.test(body.screen) ? body.screen : undefined;
  const lang =
    typeof body.lang === "string" && /^[a-z-]{2,20}$/i.test(body.lang) ? body.lang.slice(0, 20).toLowerCase() : undefined;
  const now = Date.now();

  const ua = req.headers.get("user-agent") ?? "";
  const { browser, device } = parseUa(ua, req.headers.get("sec-ch-ua-mobile"));
  const country = req.headers.get("x-vercel-ip-country");
  const host = req.headers.get("host");
  const ref = domainOf(req.headers.get("referer"));
  const externalRef = ref && host && (ref === host || ref.endsWith(`.${host}`)) ? null : ref;

  const entry: RecentEntry = { t: now, b: browser, d: device };
  if (type === "app" && app) entry.a = app;
  if (country) entry.c = country;
  if (externalRef) entry.r = externalRef;
  if (screen) entry.s = screen;
  if (lang) entry.l = lang;

  try {
    const tasks: Promise<unknown>[] = [
      run("incr", KEY.total),
      run("incr", `sbf:day:${dayKey(now)}`),
      run("incr", `sbf:hour:${hourKey(now)}`),
      run("sadd", KEY.days, dayKey(now)),
      run("sadd", KEY.hours, hourKey(now)),
      run("setnx", KEY.firstSeen, now),
      run("lpush", KEY.recent, JSON.stringify(entry)),
      run("ltrim", KEY.recent, 0, RECENT_CAP - 1),
      run("hincrby", KEY.browsers, browser, 1),
      run("hincrby", KEY.devices, device, 1),
    ];
    if (type === "app" && app) tasks.push(run("hincrby", KEY.apps, app, 1));
    if (country) tasks.push(run("hincrby", KEY.countries, country, 1));
    if (externalRef) tasks.push(run("hincrby", KEY.refs, externalRef, 1));
    if (screen) tasks.push(run("hincrby", KEY.screens, screen, 1));
    if (lang) tasks.push(run("hincrby", KEY.langs, lang, 1));
    await Promise.all(tasks);
  } catch (e) {
    return json({ ok: false, reason: e instanceof Error ? e.message : "upstash error" }, 500);
  }

  return json({ ok: true }, 200);
}

export async function GET(): Promise<Response> {
  if (!REST_URL || !REST_TOKEN) return json({ ok: false, reason: "not configured" }, 503);

  try {
    const [
      totalRaw,
      firstRaw,
      appsFlat,
      countriesFlat,
      browsersFlat,
      devicesFlat,
      refsFlat,
      screensFlat,
      langsFlat,
      days,
      hours,
      recentRaw,
    ] = await Promise.all([
      run<string | null>("get", KEY.total),
      run<string | null>("get", KEY.firstSeen),
      run<string[] | null>("hgetall", KEY.apps),
      run<string[] | null>("hgetall", KEY.countries),
      run<string[] | null>("hgetall", KEY.browsers),
      run<string[] | null>("hgetall", KEY.devices),
      run<string[] | null>("hgetall", KEY.refs),
      run<string[] | null>("hgetall", KEY.screens),
      run<string[] | null>("hgetall", KEY.langs),
      run<string[]>("smembers", KEY.days),
      run<string[]>("smembers", KEY.hours),
      run<string[]>("lrange", KEY.recent, 0, RECENT_CAP - 1),
    ]);

    const dayCounts = await Promise.all(
      days
        .sort()
        .map(async (d) => ({ day: d, count: Number((await run<string | null>("get", `sbf:day:${d}`)) ?? 0) })),
    );
    const hourCounts = await Promise.all(
      hours
        .sort()
        .map(async (h) => ({ hour: h, count: Number((await run<string | null>("get", `sbf:hour:${h}`)) ?? 0) })),
    );

    const toMap = (flat: string[] | null): Record<string, number> => {
      const m: Record<string, number> = {};
      if (flat) for (let i = 0; i + 1 < flat.length; i += 2) m[flat[i]] = Number(flat[i + 1]) || 0;
      return m;
    };

    const recent: RecentEntry[] = recentRaw
      .map((r) => {
        try {
          return JSON.parse(r) as RecentEntry;
        } catch {
          return null;
        }
      })
      .filter((r): r is RecentEntry => r !== null);

    const out: GlobalAnalytics = {
      ok: true,
      totalVisits: Number(totalRaw ?? 0),
      firstSeen: firstRaw ? Number(firstRaw) : null,
      apps: toMap(appsFlat),
      days: dayCounts.slice(-14),
      hours: hourCounts.slice(-24),
      countries: toMap(countriesFlat),
      browsers: toMap(browsersFlat),
      devices: toMap(devicesFlat),
      refs: toMap(refsFlat),
      screens: toMap(screensFlat),
      langs: toMap(langsFlat),
      recent,
    };

    return json(out, 200);
  } catch (e) {
    return json({ ok: false, reason: e instanceof Error ? e.message : "upstash error" }, 500);
  }
}
