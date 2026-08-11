import { describe, expect, it } from "vitest";
import { flipCoin, faceLabel } from "./coin";

describe("flipCoin", () => {
  it("returns heads for rng values below 0.5", () => {
    const rng = () => 0.49;
    expect(flipCoin(rng)).toBe("heads");
  });

  it("returns tails for rng values at or above 0.5", () => {
    expect(flipCoin(() => 0.5)).toBe("tails");
    expect(flipCoin(() => 0.99)).toBe("tails");
  });

  it("is deterministic for a fixed rng sequence", () => {
    const seq = [0.1, 0.8, 0.5, 0.2];
    let i = 0;
    const rng = () => seq[i++ % seq.length];
    expect(Array.from({ length: 8 }, () => flipCoin(rng))).toEqual([
      "heads",
      "tails",
      "tails",
      "heads",
      "heads",
      "tails",
      "tails",
      "heads",
    ]);
  });

  it("produces both faces across a range", () => {
    let i = 0;
    const rng = () => (i++ * 0.37) % 1;
    const results = new Set(Array.from({ length: 100 }, () => flipCoin(rng)));
    expect(results).toEqual(new Set(["heads", "tails"]));
  });
});

describe("faceLabel", () => {
  it("labels faces", () => {
    expect(faceLabel("heads")).toBe("HEADS");
    expect(faceLabel("tails")).toBe("TAILS");
  });
});
