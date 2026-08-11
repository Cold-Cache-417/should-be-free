import { describe, expect, it } from "vitest";
import { costFor, formatMoney, formatTime, PAUSE_RATE_PER_HOUR } from "./stopwatch";

describe("formatTime", () => {
  it("formats zero", () => {
    expect(formatTime(0)).toBe("00:00.00");
  });

  it("formats centiseconds", () => {
    expect(formatTime(1230)).toBe("00:01.23");
  });

  it("rolls over minutes", () => {
    expect(formatTime(61_234)).toBe("01:01.23");
  });

  it("shows hours when past 60 minutes", () => {
    expect(formatTime(3_661_234)).toBe("1:01:01.23");
  });

  it("never shows negatives", () => {
    expect(formatTime(-500)).toBe("00:00.00");
  });
});

describe("costFor / formatMoney", () => {
  it("bills at $10 per minute", () => {
    expect(PAUSE_RATE_PER_HOUR).toBe(600);
    expect(costFor(3_600_000)).toBeCloseTo(600, 5);
    expect(costFor(60_000)).toBeCloseTo(10, 5);
    expect(costFor(6_000)).toBeCloseTo(1, 5);
    expect(costFor(0)).toBe(0);
  });

  it("formats dollars", () => {
    expect(formatMoney(0)).toBe("$0.00");
    expect(formatMoney(10)).toBe("$10.00");
    expect(formatMoney(0.166666)).toBe("$0.17");
  });
});
