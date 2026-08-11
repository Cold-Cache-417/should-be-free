export type WatchPhase = "idle" | "running" | "paused";

/** "Time is money" — the meter bills $10 per minute, so the cost is
    visibly ticking within seconds (and a minute of dithering already costs
    as much as the pause itself). */
export const PAUSE_RATE_PER_HOUR = 600;

/** mm:ss.cc (or h:mm:ss.cc past the hour). */
export function formatTime(ms: number): string {
  const total = Math.max(0, Math.floor(ms));
  const cs = Math.floor(total / 10) % 100;
  const sec = Math.floor(total / 1000) % 60;
  const min = Math.floor(total / 60000) % 60;
  const hr = Math.floor(total / 3600000);
  const cc = String(cs).padStart(2, "0");
  const ss = String(sec).padStart(2, "0");
  const mm = String(min).padStart(2, "0");
  return hr > 0 ? `${hr}:${mm}:${ss}.${cc}` : `${mm}:${ss}.${cc}`;
}

/** What the running meter has cost so far, in dollars. */
export function costFor(ms: number, ratePerHour: number = PAUSE_RATE_PER_HOUR): number {
  return (Math.max(0, ms) / 3_600_000) * ratePerHour;
}

export function formatMoney(dollars: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(dollars);
}
