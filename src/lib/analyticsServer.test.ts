import { describe, expect, it } from "vitest";
import { botFamily, dayKey, domainOf, hashKey, hourKey, parseUa } from "./analyticsServer";

describe("parseUa", () => {
  it("recognizes Chrome on desktop", () => {
    const info = parseUa(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      "?0",
    );
    expect(info.browser).toBe("Chrome");
    expect(info.device).toBe("Desktop");
  });

  it("recognizes iPhone Safari as mobile", () => {
    const info = parseUa(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
      "?1",
    );
    expect(info.browser).toBe("Safari");
    expect(info.device).toBe("Mobile");
  });

  it("recognizes Android Chrome with only the UA (no client hint)", () => {
    const info = parseUa(
      "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36",
      null,
    );
    expect(info.browser).toBe("Chrome");
    expect(info.device).toBe("Mobile");
  });

  it("derives the OS family", () => {
    expect(parseUa("Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0", "?0").os).toBe("Windows");
    expect(parseUa("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0", "?0").os).toBe("macOS");
    expect(parseUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1", "?1").os).toBe("iOS");
    expect(parseUa("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0 Mobile", null).os).toBe("Android");
    expect(parseUa("Mozilla/5.0 (X11; Linux x86_64) Chrome/126.0", "?0").os).toBe("Linux");
    expect(parseUa("Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) Chrome/126.0", "?0").os).toBe("ChromeOS");
  });

  it("extracts the device model when the UA reveals one", () => {
    expect(parseUa("Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0 Mobile", null).model).toBe("Pixel 8");
    expect(parseUa("Mozilla/5.0 (Linux; Android 13; SM-G998B) Chrome/126.0 Mobile", null).model).toBe("SM-G998B");
    expect(parseUa("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Safari/604.1", "?1").model).toBe("iPhone");
    expect(parseUa("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/126.0", "?0").model).toBe("");
  });

  it("recognizes Firefox", () => {
    const info = parseUa(
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0",
      "?0",
    );
    expect(info.browser).toBe("Firefox");
    expect(info.device).toBe("Desktop");
  });

  it("recognizes Edge and Samsung Internet", () => {
    expect(parseUa("Mozilla/5.0 ... Edg/126.0", "?0").browser).toBe("Edge");
    expect(parseUa("Mozilla/5.0 ... SamsungBrowser/25.0 ...", "?1").browser).toBe("Samsung Internet");
  });

  it("defaults unknown browsers to Other", () => {
    expect(parseUa("Totally Unknown Browser/1.0", null).browser).toBe("Other");
  });

  it("handles iPad tablets", () => {
    const info = parseUa("Mozilla/5.0 (iPad; CPU OS 12_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1", "?0");
    expect(info.device).toBe("Tablet");
  });
});

describe("domainOf", () => {
  it("strips protocol, path and www", () => {
    expect(domainOf("https://www.google.com/search?q=hi")).toBe("google.com");
    expect(domainOf("http://twitter.com/foo")).toBe("twitter.com");
  });

  it("returns null for missing or unparsable input", () => {
    expect(domainOf(null)).toBeNull();
    expect(domainOf("")).toBeNull();
    expect(domainOf("not a url")).toBeNull();
  });
});

describe("botFamily", () => {
  it("classifies messenger preview crawlers as sharing signals", () => {
    expect(botFamily("Mozilla/5.0 (compatible; facebookexternalhit/1.1; facebookexternalhit/1.1)")).toBe("messenger");
    expect(botFamily("WhatsApp/2.23.20.0 (Windows NT 10.0; Win64; x64)")).toBe("messenger");
  });

  it("classifies search, AI and monitor crawlers", () => {
    expect(botFamily("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")).toBe("search");
    expect(botFamily("Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.0")).toBe("ai");
    expect(botFamily("Pingdom.com_bot_version_1.4")).toBe("monitor");
  });

  it("leaves real browsers alone", () => {
    expect(botFamily("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0 Safari/537.36")).toBeNull();
    expect(botFamily("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Version/17.5 Mobile/15E148 Safari/604.1")).toBeNull();
    expect(botFamily(null)).toBeNull();
  });
});

describe("hashKey", () => {
  it("is stable and short", () => {
    const a = hashKey("1.2.3.4|ua-string");
    const b = hashKey("1.2.3.4|ua-string");
    const c = hashKey("5.6.7.8|ua-string");
    expect(a).toBe(b);
    expect(a).not.toBe(c);
    expect(a.length).toBeLessThan(10);
  });
});

describe("dayKey / hourKey", () => {
  it("buckets epoch ms into UTC day and hour keys", () => {
    const ts = Date.UTC(2026, 7, 11, 14, 30, 0); // 2026-08-11 14:30 UTC
    expect(dayKey(ts)).toBe("2026-08-11");
    expect(hourKey(ts)).toBe("2026-08-11-14");
  });
});
