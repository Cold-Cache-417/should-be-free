import { describe, expect, it } from "vitest";
import { detectBrowser, detectDevice, detectOS } from "./prank";

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
