import { describe, expect, it } from "vitest";
import { detectBrowser, detectDevice, detectOS, hashFingerprint } from "./privacy";

describe("hashFingerprint", () => {
  it("is stable and 32-bit hex", () => {
    expect(hashFingerprint("same input")).toBe(hashFingerprint("same input"));
    expect(hashFingerprint("a")).toMatch(/^[0-9a-f]{8}$/);
  });

  it("differs across inputs", () => {
    expect(hashFingerprint("a")).not.toBe(hashFingerprint("b"));
  });
});

describe("detectBrowser", () => {
  it("detects Chrome, Firefox, Safari, Edge", () => {
    expect(detectBrowser("Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")).toEqual({
      name: "Chrome",
      version: "120.0.0.0",
    });
    expect(detectBrowser("Mozilla/5.0 Firefox/121.0")).toEqual({ name: "Firefox", version: "121.0" });
    expect(detectBrowser("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15")).toEqual({
      name: "Safari",
      version: "17.2",
    });
    expect(detectBrowser("Mozilla/5.0 Edg/120.0.0.0")).toEqual({ name: "Edge", version: "120.0.0.0" });
  });
});

describe("detectOS", () => {
  it("detects macOS, Windows, iOS, Android, Linux", () => {
    expect(detectOS("Macintosh; Intel Mac OS X 10_15_7")).toBe("macOS");
    expect(detectOS("Windows NT 10.0; Win64")).toBe("Windows 10/11");
    expect(detectOS("iPhone; CPU iPhone OS 17_2 like Mac OS X")).toBe("iOS");
    expect(detectOS("Android 14; Mobile")).toBe("Android");
    expect(detectOS("X11; Linux x86_64")).toBe("Linux");
  });
});

describe("detectDevice", () => {
  it("classifies desktop, mobile and tablet", () => {
    expect(detectDevice("Windows NT 10.0")).toBe("Desktop");
    expect(detectDevice("iPhone; CPU iPhone OS 17_2")).toBe("Mobile");
    expect(detectDevice("Android 14")).toBe("Mobile");
    expect(detectDevice("iPad; CPU OS 17_2")).toBe("Tablet");
  });
});
