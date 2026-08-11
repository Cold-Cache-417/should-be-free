import { describe, expect, it } from "vitest";
import { CITIES, CONDITIONS, cityById } from "./weather";

describe("forecast data", () => {
  it("has sane, complete data for every city", () => {
    for (const c of CITIES) {
      expect(c.hourly.length).toBeGreaterThanOrEqual(12);
      expect(c.days.length).toBe(7);
      expect(c.days[0].day).toBe("Today");
      expect(c.days[1].day).toBe("Tomorrow");
      expect(Object.keys(CONDITIONS)).toContain(c.condition);
      for (const h of c.hourly) expect(Object.keys(CONDITIONS)).toContain(h.icon);
      expect(c.lo).toBeLessThanOrEqual(c.hi);
      for (const d of c.days) {
        expect(d.lo).toBeLessThanOrEqual(d.hi);
        expect(Object.keys(CONDITIONS)).toContain(d.icon);
      }
    }
  });
});

describe("cityById", () => {
  it("returns the requested city and falls back to Cupertino", () => {
    expect(cityById("tokyo").city).toBe("Tokyo");
    expect(cityById("nope").city).toBe("Cupertino");
  });
});
