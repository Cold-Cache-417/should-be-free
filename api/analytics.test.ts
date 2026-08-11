import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The API handlers talk to Upstash through plain fetch. This test stubs
 * the global fetch with a tiny in-memory Redis-lookalike and drives the
 * real POST/GET handlers end-to-end — no network, no env vars needed.
 */

type Cell = number | string | string[] | null;

class FakeUpstash {
  store = new Map<string, Cell>();
  calls: string[][] = [];

  fetch = vi.fn(async (input: string | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    const decoded = decodeURIComponent(url.split("/").slice(3).join("/"));
    const segs = decoded.split("/").filter(Boolean);
    this.calls.push(segs);
    const [cmd, key, ...rest] = segs;
    let result: Cell = null;

    switch (cmd) {
      case "incr": {
        const v = ((this.store.get(key) as number) ?? 0) + 1;
        this.store.set(key, v);
        result = v;
        break;
      }
      case "hincrby": {
        const arr = (this.store.get(key) as string[]) ?? [];
        const idx = arr.indexOf(rest[0]);
        if (idx === -1) {
          arr.push(rest[0], rest[1]);
        } else {
          arr[idx + 1] = String(Number(arr[idx + 1]) + Number(rest[1]));
        }
        this.store.set(key, arr);
        result = arr.length;
        break;
      }
      case "sadd": {
        const arr = (this.store.get(key) as string[]) ?? [];
        if (!arr.includes(rest[0])) arr.push(rest[0]);
        this.store.set(key, arr);
        result = arr.length;
        break;
      }
      case "setnx": {
        if (this.store.has(key)) {
          result = 0;
        } else {
          this.store.set(key, rest[0]);
          result = 1;
        }
        break;
      }
      case "get": {
        result = this.store.get(key) ?? null;
        break;
      }
      case "hgetall": {
        result = (this.store.get(key) as string[] | undefined) ?? null;
        break;
      }
      case "smembers": {
        result = (this.store.get(key) as string[] | undefined) ?? [];
        break;
      }
      case "lpush": {
        const arr = (this.store.get(key) as string[]) ?? [];
        arr.unshift(rest[0]);
        this.store.set(key, arr);
        result = arr.length;
        break;
      }
      case "ltrim": {
        const arr = (this.store.get(key) as string[]) ?? [];
        this.store.set(key, arr.slice(Number(rest[0]), Number(rest[1]) + 1));
        result = "OK";
        break;
      }
      case "lrange": {
        result = (this.store.get(key) as string[] | undefined) ?? [];
        break;
      }
    }
    return new Response(JSON.stringify({ result }), { status: 200 });
  });
}

vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://mock.upstash.io");
vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "test-token");

const { POST, GET } = await import("./analytics");

let fake: FakeUpstash;

beforeEach(() => {
  fake = new FakeUpstash();
  vi.stubGlobal("fetch", fake.fetch);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const CHROME_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const IPHONE_UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";

function post(body: string, headers: Record<string, string> = {}) {
  return POST(
    new Request("http://localhost/api/analytics", {
      method: "POST",
      headers: {
        "user-agent": CHROME_UA,
        "sec-ch-ua-mobile": "?0",
        ...headers,
      },
      body,
    }),
  );
}

describe("POST /api/analytics", () => {
  it("records a visit with derived browser and device", async () => {
    const res = await post(JSON.stringify({ type: "visit" }), { "x-vercel-ip-country": "US" });
    expect(res.status).toBe(200);
    expect(fake.store.get("sbf:total")).toBe(1);
    expect(fake.store.get("sbf:browsers")).toEqual(["Chrome", "1"]);
    expect(fake.store.get("sbf:devices")).toEqual(["Desktop", "1"]);
    expect(fake.store.get("sbf:countries")).toEqual(["US", "1"]);
    expect(fake.store.get("sbf:firstSeen")).toMatch(/^\d+$/);
  });

  it("buckets the visit into a day and hour counter", async () => {
    await post(JSON.stringify({ type: "visit" }));
    const dk = new Date().toISOString().slice(0, 10);
    const hk = new Date().toISOString().slice(0, 13).replace("T", "-");
    expect(fake.store.get(`sbf:day:${dk}`)).toBe(1);
    expect(fake.store.get(`sbf:hour:${hk}`)).toBe(1);
  });

  it("counts app usage separately", async () => {
    await post(JSON.stringify({ type: "app", app: "flip" }));
    expect(fake.store.get("sbf:apps")).toEqual(["flip", "1"]);
    expect(fake.store.get("sbf:total")).toBe(1); // app events are not visits
  });

  it("derives mobile device from UA and client hint", async () => {
    await post(JSON.stringify({ type: "visit" }), {
      "user-agent": IPHONE_UA,
      "sec-ch-ua-mobile": "?1",
    });
    expect(fake.store.get("sbf:devices")).toEqual(["Mobile", "1"]);
    expect(fake.store.get("sbf:browsers")).toEqual(["Safari", "1"]);
  });

  it("keeps the recent ring capped and includes app + country on entries", async () => {
    await post(JSON.stringify({ type: "app", app: "hack" }), { "x-vercel-ip-country": "IN" });
    const recent = fake.store.get("sbf:recent") as string[];
    expect(recent).toHaveLength(1);
    const entry = JSON.parse(recent[0]) as Record<string, unknown>;
    expect(entry.a).toBe("hack");
    expect(entry.c).toBe("IN");
    expect(entry.b).toBe("Chrome");
    expect(typeof entry.t).toBe("number");
  });

  it("drops referrers from the site's own host but keeps external ones", async () => {
    await post(JSON.stringify({ type: "visit" }), { referer: "https://should-be-free.vercel.app/#/flip", host: "should-be-free.vercel.app" });
    await post(JSON.stringify({ type: "visit" }), { referer: "https://www.google.com/search?q=x", host: "should-be-free.vercel.app" });
    expect(fake.store.get("sbf:refs")).toEqual(["google.com", "1"]);
  });

  it("answers 200 for junk or empty bodies (counts as visit)", async () => {
    const res = await post("not json");
    expect(res.status).toBe(200);
    expect(fake.store.get("sbf:total")).toBe(1);
  });
});

describe("GET /api/analytics", () => {
  it("returns the full aggregate snapshot", async () => {
    await post(JSON.stringify({ type: "visit" }), { "x-vercel-ip-country": "US" });
    await post(JSON.stringify({ type: "app", app: "weather" }), { "x-vercel-ip-country": "IN" });

    const res = await GET();
    expect(res.status).toBe(200);
    const j = (await res.json()) as {
      ok: boolean;
      totalVisits: number;
      apps: Record<string, number>;
      days: { day: string; count: number }[];
      hours: { hour: string; count: number }[];
      countries: Record<string, number>;
      browsers: Record<string, number>;
      devices: Record<string, number>;
      recent: { t: number; a?: string }[];
      firstSeen: number | null;
    };

    expect(j.ok).toBe(true);
    expect(j.totalVisits).toBe(2);
    expect(j.apps).toEqual({ weather: 1 });
    expect(j.countries).toEqual({ US: 1, IN: 1 });
    expect(j.browsers).toEqual({ Chrome: 2 });
    expect(j.devices).toEqual({ Desktop: 2 });
    expect(j.days).toHaveLength(1);
    expect(j.days[0].count).toBe(2);
    expect(j.hours).toHaveLength(1);
    expect(j.hours[0].count).toBe(2);
    expect(j.recent).toHaveLength(2);
    expect(j.recent[0].a).toBe("weather");
    expect(typeof j.firstSeen).toBe("number");
  });
});
