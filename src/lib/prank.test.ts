import { describe, expect, it } from "vitest";
import { detectBrowser, detectDevice, detectModel, detectOS } from "./prank";

describe("detectBrowser", () => {
  it("detects the majors", () => {
    expect(detectBrowser("Mozilla/5.0 Chrome/120.0.0.0 Safari/537.36")).toBe("Chrome 120.0.0.0");
    expect(detectBrowser("Mozilla/5.0 Firefox/121.0")).toBe("Firefox 121.0");
    expect(
      detectBrowser("Mozilla/5.0 (Macintosh) AppleWebKit/605.1.15 Version/17.2 Safari/605.1.15"),
    ).toBe("Safari 17.2");
    expect(detectBrowser("Mozilla/5.0 Edg/120.0.0.0")).toBe("Edge 120.0.0.0");
  });
});

describe("detectOS", () => {
  it("detects desktop and mobile OSes", () => {
    expect(detectOS("Macintosh; Intel Mac OS X 10_15_7")).toBe("macOS");
    expect(detectOS("Windows NT 10.0; Win64")).toBe("Windows 10/11");
    expect(detectOS("iPhone; CPU iPhone OS 17_2 like Mac OS X")).toBe("iOS");
    expect(detectOS("Android 14; Mobile")).toBe("Android");
  });
});

describe("detectDevice", () => {
  it("classifies by form factor", () => {
    expect(detectDevice("Windows NT 10.0")).toBe("Desktop");
    expect(detectDevice("iPhone; CPU iPhone OS 17_2")).toBe("Mobile");
    expect(detectDevice("iPad; CPU OS 17_2")).toBe("Tablet");
  });
});

describe("detectModel", () => {
  const scr = { w: 1512, h: 982, dpr: 2 };
  it("prefers the exact UA-data model", () => {
    expect(detectModel("Chrome/120 Android", "Pixel 8", scr, 8, 8)).toBe("Pixel 8");
  });
  it("matches a MacBook Pro from specs", () => {
    expect(detectModel("Macintosh; Mac OS X 10_15_7", null, scr, 10, 32)).toContain("MacBook Pro");
  });
  it("matches a MacBook Air from modest specs", () => {
    expect(detectModel("Macintosh; Mac OS X 10_15_7", null, { ...scr, dpr: 2 }, 4, 8)).toContain("MacBook Air");
  });
  it("stays honest when hidden", () => {
    expect(detectModel("Windows NT 10.0", null, scr, 8, 16)).toContain("Windows PC");
    expect(detectModel("X11; Linux x86_64", null, scr, 8, 16)).toContain("Linux");
  });
});
