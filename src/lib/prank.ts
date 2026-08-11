/*
 * Hacker Prank scanner.
 *
 * Reads ONLY the visitor's own browser, live, on their own screen.
 * Nothing is stored, nothing is transmitted, nothing leaves the tab —
 * the whole "scare" is the visitor's own machine reading itself.
 * Clipboard, camera, mic, GPS are never accessed — their permission
 * states are only *read* (and that part of the scold is the joke).
 */

export interface PrankScan {
  browser: string;
  os: string;
  device: string;
  model: string;
  screen: string;
  colorDepth: string;
  orientation: string;
  cores: string;
  memory: string | null;
  gpu: string | null;
  webgl: string | null;
  audio: string | null;
  canvas: string | null;
  fonts: string[];
  battery: string | null;
  language: string;
  languages: string;
  timezone: string;
  tzOffset: string;
  pointer: string;
  touchPoints: string;
  network: string;
  saveData: boolean;
  reducedMotion: boolean;
  permissions: Record<string, "granted" | "denied" | "prompt" | "unsupported">;
  storage: string[];
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

/** Best-guess model: exact from UA data when the browser offers it,
    otherwise matched from specs (screen, cores, RAM). Always honest. */
export function detectModel(
  ua: string,
  uaModel: string | null,
  screen: { w: number; h: number; dpr: number },
  cores: number,
  memory: number | null,
): string {
  if (uaModel) return uaModel;
  if (/iPhone/.test(ua)) return "iPhone (exact model withheld by browser)";
  if (/iPad/.test(ua)) return "iPad";
  if (/Mac OS X/.test(ua)) {
    const retina = screen.dpr >= 2;
    const beefy = cores >= 8 && (memory ?? 0) >= 16;
    if (beefy && retina) return "MacBook Pro, likely (matched by specs)";
    if (retina) return "MacBook Air, likely (matched by specs)";
    return "A Mac, probably (matched by specs)";
  }
  if (/Windows/.test(ua)) return "A Windows PC (model hidden from browsers)";
  if (/Android/.test(ua)) return "An Android phone (model hidden from browsers)";
  if (/Linux/.test(ua)) return "A Linux machine (very cool of you)";
  return "Unknown";
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

const PERMISSION_PROBES = [
  "geolocation",
  "camera",
  "microphone",
  "clipboard-read",
  "clipboard-write",
  "notifications",
  "midi",
  "usb",
  "bluetooth",
  "persistent-storage",
  "accelerometer",
  "gyroscope",
];

export async function runScan(): Promise<PrankScan> {
  const ua = navigator.userAgent;
  const nav = navigator as Navigator & {
    deviceMemory?: number;
    getBattery?: () => Promise<{ level: number; charging: boolean }>;
    userAgentData?: {
      mobile: boolean;
      platform: string;
      getHighEntropyValues?: (hints: string[]) => Promise<{ model?: string }>;
    };
  };

  /* Exact model when the browser volunteers it (Chrome mobile). */
  let uaModel: string | null = null;
  try {
    const res = await nav.userAgentData?.getHighEntropyValues?.(["model"]);
    if (res?.model) uaModel = res.model;
  } catch {
    uaModel = null;
  }

  let gpu: string | null = null;
  let webgl: string | null = null;
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") ||
      c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      const renderer = ext
        ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
        : String(gl.getParameter(gl.RENDERER));
      gpu = renderer;
      webgl = hash(renderer);
    }
  } catch {
    gpu = null;
  }

  let audio: string | null = null;
  try {
    const AC =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (AC) {
      const ctx = new AC(1, 44100, 44100);
      const osc = ctx.createOscillator();
      osc.type = "triangle";
      osc.frequency.value = 10000;
      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -50;
      comp.knee.value = 40;
      comp.ratio.value = 12;
      osc.connect(comp);
      comp.connect(ctx.destination);
      osc.start(0);
      const buf = await ctx.startRendering();
      const ch = buf.getChannelData(0);
      let sum = 0;
      for (let i = 4500; i < 5000; i++) sum += Math.abs(ch[i]);
      audio = hash(`${sum}:${buf.length}`);
    }
  } catch {
    audio = null;
  }

  let battery: string | null = null;
  try {
    const getBattery = nav.getBattery;
    if (getBattery) {
      const b = await getBattery();
      battery = `${Math.round(b.level * 100)}% · ${b.charging ? "charging" : "discharging"}`;
    }
  } catch {
    battery = null;
  }

  const permissions: PrankScan["permissions"] = {};
  if (navigator.permissions?.query) {
    for (const name of PERMISSION_PROBES) {
      try {
        const st = await navigator.permissions.query({ name: name as PermissionName });
        permissions[name] = st.state;
      } catch {
        permissions[name] = "unsupported";
      }
    }
  }

  const storage: string[] = [];
  const has = (fn: () => boolean, label: string) => {
    try {
      if (fn()) storage.push(label);
    } catch {
      /* not available */
    }
  };
  has(() => navigator.cookieEnabled, "cookies");
  has(() => typeof window.localStorage !== "undefined", "localStorage");
  has(() => typeof window.sessionStorage !== "undefined", "sessionStorage");
  has(() => typeof window.indexedDB !== "undefined", "indexedDB");
  has(() => typeof navigator.serviceWorker !== "undefined", "serviceWorker");
  has(() => typeof caches !== "undefined", "cacheStorage");

  const conn = (
    navigator as Navigator & {
      connection?: { effectiveType?: string; downlink?: number; saveData?: boolean };
    }
  ).connection;

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

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown";
  const offMin = -new Date().getTimezoneOffset();
  const tzOff = `${offMin >= 0 ? "+" : ""}${Math.floor(offMin / 60)}:${String(Math.abs(offMin % 60)).padStart(2, "0")}`;

  return {
    browser: detectBrowser(ua),
    os: detectOS(ua),
    device: detectDevice(ua),
    model: detectModel(ua, uaModel, {
      w: window.screen?.width ?? 0,
      h: window.screen?.height ?? 0,
      dpr: window.devicePixelRatio ?? 1,
    }, navigator.hardwareConcurrency ?? 0, nav.deviceMemory ?? null),
    screen: `${window.screen?.width ?? "?"}×${window.screen?.height ?? "?"} @${window.devicePixelRatio ?? 1}x`,
    colorDepth: `${window.screen?.colorDepth ?? "?"}-bit`,
    orientation:
      typeof window.screen !== "undefined" && "orientation" in window.screen
        ? (window.screen as unknown as { orientation?: { type?: string } }).orientation?.type ?? "landscape"
        : "n/a",
    cores: String(navigator.hardwareConcurrency ?? "?"),
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : null,
    gpu,
    webgl,
    audio,
    canvas,
    fonts: detectFonts(),
    battery,
    language: navigator.language,
    languages: (navigator.languages ?? [navigator.language]).join(", "),
    timezone: tz,
    tzOffset: tzOff,
    pointer: matchMedia("(pointer: coarse)").matches ? "touch (coarse)" : "fine (mouse)",
    touchPoints: String(navigator.maxTouchPoints ?? 0),
    network: conn?.effectiveType ? `${conn.effectiveType} · ${conn.downlink ?? "?"} Mbps` : "unknown",
    saveData: conn?.saveData ?? false,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    permissions,
    storage,
  };
}

function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}
