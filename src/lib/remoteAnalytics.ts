/*
 * Client adapter for the serverless analytics API.
 *
 * Reports are fire-and-forget: visit/app/time/pay pings use sendBeacon
 * (survives unload) or a keepalive fetch. If the API is unreachable (local
 * dev, no deployment) the site silently keeps its localStorage mirror —
 * analytics are optional, never blocking. Everything reported is anonymous
 * aggregate data; the server derives device, OS, model and sessions itself.
 */

import type { GlobalAnalytics } from "./analyticsServer";

export type { GlobalAnalytics };

const API = "/api/analytics";

function beacon(payload: Record<string, unknown>): void {
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(API, new Blob([body], { type: "application/json" }));
    } else if (typeof fetch === "function") {
      void fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* analytics are optional */
  }
}

export function reportAnalytics(type: "visit" | "app", app?: string): void {
  const screen =
    typeof window !== "undefined" && window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
  const lang =
    typeof navigator !== "undefined" && navigator.language ? navigator.language.slice(0, 20).toLowerCase() : undefined;
  beacon({
    type,
    ...(app ? { app } : {}),
    ...(screen ? { screen } : {}),
    ...(lang ? { lang } : {}),
  });
}

/** A fake purchase went through on an app's paywall. */
export function reportPaywall(app: string): void {
  beacon({ type: "pay", app });
}

/** Engaged milliseconds spent in an app before leaving. */
export function reportTime(app: string, ms: number): void {
  if (!Number.isFinite(ms) || ms < 250) return;
  beacon({ type: "time", app, ms: Math.round(ms) });
}

export async function fetchGlobalAnalytics(): Promise<GlobalAnalytics | null> {
  try {
    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) return null;
    const j = (await res.json()) as GlobalAnalytics;
    return j && j.ok ? j : null;
  } catch {
    return null;
  }
}
