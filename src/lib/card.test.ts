import { describe, expect, it } from "vitest";
import {
  cardBrand,
  formatCardNumber,
  formatExpiry,
  last4,
  moneyFor,
  validateCard,
} from "./card";

describe("card formatting", () => {
  it("groups 16-digit numbers", () => {
    expect(formatCardNumber("4242424242424242")).toBe("4242 4242 4242 4242");
  });

  it("uses 4-6-5 grouping for Amex", () => {
    expect(formatCardNumber("378282246310005")).toBe("3782 822463 10005");
  });

  it("strips non-digits and caps length", () => {
    expect(formatCardNumber("42-42 abc 42")).toBe("4242 42");
  });

  it("detects brands", () => {
    expect(cardBrand("4111111111111111")).toBe("Visa");
    expect(cardBrand("5555555555554444")).toBe("Mastercard");
    expect(cardBrand("378282246310005")).toBe("Amex");
    expect(cardBrand("6011111111111117")).toBe("Discover");
  });

  it("formats expiry", () => {
    expect(formatExpiry("1228")).toBe("12/28");
    expect(formatExpiry("1")).toBe("1");
    expect(formatExpiry("12")).toBe("12");
  });

  it("extracts last four", () => {
    expect(last4("4242 4242 4242 1234")).toBe("1234");
  });

  it("turns a price string into money", () => {
    expect(moneyFor("$20")).toBe("$20.00");
    expect(moneyFor("$2,000")).toBe("$2,000.00");
  });
});

describe("validateCard", () => {
  const ok = { name: "Jane Doe", number: "4242 4242 4242 4242", expiry: "12/30", cvc: "123" };

  it("accepts a complete card", () => {
    expect(validateCard(ok)).toEqual({});
  });

  it("rejects a short number", () => {
    expect(validateCard({ ...ok, number: "4242" }).number).toBeTruthy();
  });

  it("rejects a missing name", () => {
    expect(validateCard({ ...ok, name: "" }).name).toBeTruthy();
  });

  it("rejects a bad expiry", () => {
    expect(validateCard({ ...ok, expiry: "13/30" }).expiry).toBeTruthy();
    expect(validateCard({ ...ok, expiry: "12/99" }).expiry).toBeUndefined();
  });

  it("rejects a bad cvc", () => {
    expect(validateCard({ ...ok, cvc: "12" }).cvc).toBeTruthy();
    expect(validateCard({ ...ok, cvc: "1234" }).cvc).toBeUndefined();
  });
});
