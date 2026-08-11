/*
 * Hacker Prank scanner.
 *
 * Reads ONLY the visitor's own browser, live, on their own screen.
 * Nothing is stored, nothing is transmitted, nothing leaves the tab —
 * the whole "scare" is the visitor's own machine reading itself.
 */

export interface PrankScan {
  browser: string;
  os: string;
  device: string;
  screen: string;
  cores: string;
  memory: string | null;
  gpu: string | null;
  battery: string | null;
  language: string;
  timezone: string;
  canvas: string | null;
  fonts: string[];
}

export function detectBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return `Edge ${ua.match(/Edg\/([\d.]+)/)?.[1] ?? "?"}`;
  if (/OPR\//.test(ua)) return `Opera ${ua.match(/OPR\/([\d.]+)/)?.[1] ?? "?"}`;
  if (/Firefox\//.test(ua)) return `Firefox ${ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "?"}`;
  if (/Chrome\//.test(ua)) return `Chrome ${ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "?"}`;
  if (/Safari\//.test(ua) && !/Chrome/.test(ua))
    return `Safari ${ua.match(/Version\/([\d.]+)/)?.[1] ?? "?"}`;
  return "a browser, presumably";
}

export function detectOS(ua: string): string {
  if (/Windows NT 10/.test(ua)) return "Windows 10/11";
  if (/Windows/.test(ua)) return "Windows";
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Mac OS X/.test(ua)) return "macOS";
  if (/Android/.test(ua)) return "Android";
  if (/Linux/.test(ua)) return "Linux";
  return "Unknown";
}

export function detectDevice(ua: string): string {
  if (/iPad|Tablet/.test(ua)) return "Tablet";
  if (/Mobi|iPhone|Android/.test(ua)) return "Mobile";
  return "Desktop";
}

export function detectFonts(): string[] {
  try {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return [];
    const sample = "mmmmmmmmmmlli";
    const width = (f: string) => {
      ctx.font = `72px ${f}`;
      return ctx.measureText(sample).width;
    };
    const mono = width("monospace");
    const serif = width("serif");
    const sans = width("sans-serif");
    const probes = [
      "Arial",
      "Avenir",
      "Calibri",
      "Cambria",
      "Comic Sans MS",
      "Courier New",
      "Georgia",
      "Helvetica",
      "Impact",
      "Roboto",
      "Times New Roman",
      "Verdana",
      "Inter",
      "Fraunces",
    ];
    return probes.filter((f) => {
      const w = width(f);
      return w !== mono && w !== serif && w !== sans;
    });
  } catch {
    return [];
  }
}

export async function runScan(): Promise<PrankScan> {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & { deviceMemory?: number };
  let gpu: string | null = null;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") ||
      c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      gpu = ext ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : String(gl.getParameter(gl.RENDERER));
    }
  } catch {
    gpu = null;
  }
  let battery: string | null = null;
  try {
    const getBattery = (navigator as Navigator & { getBattery?: () => Promise<{ charging: boolean; level: number }> })
      .getBattery;
    if (getBattery) {
      const b = await getBattery();
      battery = `${Math.round(b.level * 100)}% · ${b.charging ? "charging" : "discharging"}`;
    }
  } catch {
    battery = null;
  }
  let canvas: string | null = null;
  try {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 60;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#f60";
      ctx.fillRect(20, 10, 120, 30);
      ctx.fillStyle = "#069";
      ctx.font = "15px Arial";
      ctx.fillText("should-be-free.vercel.app", 8, 40);
      canvas = hash(c.toDataURL());
    }
  } catch {
    canvas = null;
  }
  return {
    browser: detectBrowser(ua),
    os: detectOS(ua),
    device: detectDevice(ua),
    screen: `${window.screen?.width ?? "?"}×${window.screen?.height ?? "?"} @${window.devicePixelRatio ?? 1}x`,
    cores: String(navigator.hardwareConcurrency ?? "?"),
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : null,
    gpu,
    battery,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
    canvas,
    fonts: detectFonts(),
  };
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}
