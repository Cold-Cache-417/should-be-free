/*
 * Client adapter for the serverless analytics API.
 *
 * Reports are fire-and-forget: a visit ping uses sendBeacon (survives
 * unload), app pings use a keepalive fetch. If the API is unreachable
 * (local dev, no deployment) the site silently keeps its localStorage
 * mirror — analytics are optional, never blocking.
 */

import type { GlobalAnalytics } from "./analyticsServer";

export type { GlobalAnalytics };

const API = "/api/analytics";

export function reportAnalytics(type: "visit" | "app", app?: string): void {
  const screen =
    typeof window !== "undefined" && window.screen ? `${window.screen.width}x${window.screen.height}` : undefined;
  const lang =
    typeof navigator !== "undefined" && navigator.language ? navigator.language.slice(0, 20).toLowerCase() : undefined;
  const payload = JSON.stringify({
    type,
    ...(app ? { app } : {}),
    ...(screen ? { screen } : {}),
    ...(lang ? { lang } : {}),
  });
  try {
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(API, new Blob([payload], { type: "application/json" }));
    } else if (typeof fetch === "function") {
      void fetch(API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  } catch {
    /* analytics are optional */
  }
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
