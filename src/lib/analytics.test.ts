import { describe, expect, it } from "vitest";
import {
  emptyAnalytics,
  formatTime,
  parseAnalytics,
  visitsToday,
  withApp,
  withVisit,
} from "./analytics";

const NOW = new Date(2026, 7, 11, 14, 30).getTime(); // 2026-08-11 14:30

describe("withVisit", () => {
  it("increments total and prepends to the seen list", () => {
    let a = withVisit(emptyAnalytics(), NOW);
    a = withVisit(a, NOW + 1000);
    expect(a.totalVisits).toBe(2);
    expect(a.lastSeen).toHaveLength(2);
    expect(a.lastSeen[0]).toBe(NOW + 1000);
    expect(a.firstSeen).toBe(NOW);
  });
});

describe("withApp", () => {
  it("counts per app without touching visit history", () => {
    let a = withVisit(emptyAnalytics(), NOW);
    a = withApp(a, "flip");
    a = withApp(a, "flip");
    a = withApp(a, "weather");
    expect(a.appCounts).toEqual({ flip: 2, weather: 1 });
    expect(a.totalVisits).toBe(1);
  });
});

describe("visitsToday", () => {
  it("counts only same-day visits", () => {
    let a = withVisit(emptyAnalytics(), NOW);
    a = withVisit(a, NOW - 1000); // still today
    a = withVisit(a, NOW - 60 * 60 * 1000); // an hour ago, today
    a = withVisit(a, NOW - 30 * 24 * 60 * 60 * 1000); // a month ago
    expect(visitsToday(a, NOW)).toBe(3);
  });
});

describe("parseAnalytics", () => {
  it("survives junk", () => {
    expect(parseAnalytics(null).totalVisits).toBe(0);
    expect(parseAnalytics("not json").totalVisits).toBe(0);
    expect(parseAnalytics('{"totalVisits":5,"appCounts":{"hack":2},"lastSeen":[1,2,3]}')).toMatchObject({
      totalVisits: 5,
      appCounts: { hack: 2 },
      lastSeen: [1, 2, 3],
    });
  });
});

describe("formatTime", () => {
  it("labels same-day visits with today", () => {
    expect(formatTime(NOW)).toBe("today 14:30");
  });
});
