import { describe, expect, it } from "vitest";
import { dayKey, domainOf, hourKey, parseUa } from "./analyticsServer";

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

describe("dayKey / hourKey", () => {
  it("buckets epoch ms into UTC day and hour keys", () => {
    const ts = Date.UTC(2026, 7, 11, 14, 30, 0); // 2026-08-11 14:30 UTC
    expect(dayKey(ts)).toBe("2026-08-11");
    expect(hourKey(ts)).toBe("2026-08-11-14");
  });
});
