import { describe, expect, it } from "vitest";
import {
  DivideByZeroError,
  evaluate,
  formatNumber,
  parseEntry,
  type Token,
} from "./calculator";

const n = (value: number): Token => ({ kind: "number", value });
const op = (op: "+" | "−" | "×" | "÷"): Token => ({ kind: "op", op });

const expr = (...tokens: Token[]) => tokens;

describe("evaluate — operator precedence", () => {
  it("adds and subtracts", () => {
    expect(evaluate(expr(n(2), op("+"), n(3)))).toBe(5);
    expect(evaluate(expr(n(10), op("−"), n(4)))).toBe(6);
  });

  it("multiplication binds tighter than addition", () => {
    expect(evaluate(expr(n(2), op("+"), n(3), op("×"), n(4)))).toBe(14);
    expect(evaluate(expr(n(2), op("×"), n(3), op("+"), n(4)))).toBe(10);
  });

  it("division binds tighter than subtraction", () => {
    expect(evaluate(expr(n(20), op("−"), n(10), op("÷"), n(5)))).toBe(18);
  });

  it("is left-associative for same precedence", () => {
    expect(evaluate(expr(n(10), op("−"), n(3), op("−"), n(2)))).toBe(5);
    expect(evaluate(expr(n(20), op("÷"), n(4), op("÷"), n(2)))).toBe(2.5);
  });

  it("handles decimals cleanly", () => {
    expect(evaluate(expr(n(0.1), op("+"), n(0.2)))).toBeCloseTo(0.3, 12);
    expect(evaluate(expr(n(1.5), op("×"), n(2.5)))).toBe(3.75);
  });

  it("handles negative operands", () => {
    expect(evaluate(expr(n(-2), op("+"), n(3)))).toBe(1);
    expect(evaluate(expr(n(-5), op("×"), n(-4)))).toBe(20);
  });

  it("handles long chains", () => {
    expect(evaluate(expr(n(2), op("+"), n(3), op("×"), n(4), op("−"), n(5), op("÷"), n(2)))).toBe(
      11.5,
    );
  });

  it("throws on division by zero", () => {
    expect(() => evaluate(expr(n(5), op("÷"), n(0)))).toThrow(DivideByZeroError);
    expect(() => evaluate(expr(n(0), op("÷"), n(0)))).toThrow(DivideByZeroError);
  });

  it("throws on malformed input", () => {
    expect(() => evaluate([])).toThrow();
    expect(() => evaluate(expr(n(1), op("+")))).toThrow();
  });
});

describe("formatNumber", () => {
  it("formats integers with grouping", () => {
    expect(formatNumber(0)).toBe("0");
    expect(formatNumber(1234)).toBe("1,234");
    expect(formatNumber(1234567890)).toBe("1,234,567,890");
  });

  it("hides float noise", () => {
    expect(formatNumber(0.1 + 0.2)).toBe("0.3");
    expect(formatNumber(1 / 3)).toBe("0.333333333333");
  });

  it("formats decimals without trailing zeros", () => {
    expect(formatNumber(2.5)).toBe("2.5");
    expect(formatNumber(2.5 * 2)).toBe("5");
  });

  it("falls back to exponential for extreme magnitudes", () => {
    expect(formatNumber(1e16)).toBe("1e+16");
    expect(formatNumber(1e-10)).toBe("1e-10");
  });

  it("handles negatives", () => {
    expect(formatNumber(-42)).toBe("-42");
    expect(formatNumber(-0.5)).toBe("-0.5");
  });
});

describe("parseEntry", () => {
  it("parses valid entries", () => {
    expect(parseEntry("42")).toBe(42);
    expect(parseEntry("3.14")).toBeCloseTo(3.14);
    expect(parseEntry(".5")).toBe(0.5);
    expect(parseEntry("12.")).toBe(12);
    expect(parseEntry("-7")).toBe(-7);
  });

  it("returns null for incomplete entries", () => {
    expect(parseEntry("")).toBeNull();
    expect(parseEntry("-")).toBeNull();
    expect(parseEntry(".")).toBeNull();
  });
});
