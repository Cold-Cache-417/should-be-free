/*
 * Privacy Scanner engine.
 *
 * Reads ONLY the visitor's own browser profile, entirely in-memory:
 * nothing is stored, persisted, or transmitted anywhere. Collection is
 * opt-in — the caller must not invoke these probes until the visitor
 * has given explicit consent on-screen.
 */

export interface BatteryState {
  charging: boolean;
  level: number; // 0..1
}

export interface PrivacyProfile {
  collectedAt: number;
  browser: { name: string; version: string; ua: string };
  os: string;
  device: string;
  platform: string;
  language: string;
  timezone: string;
  screen: { width: number; height: number; dpr: number; colorDepth: number };
  hardware: { cores: number; memory: string | null };
  gpu: string | null;
  battery: BatteryState | null;
  permissions: Record<string, "granted" | "denied" | "prompt" | "unsupported">;
  fingerprints: {
    canvas: string | null;
    webgl: string | null;
    audio: string | null;
    fonts: string[];
  };
  storage: {
    cookies: boolean;
    localStorage: boolean;
    sessionStorage: boolean;
    indexedDB: boolean;
    serviceWorker: boolean;
    cacheStorage: boolean;
  };
  sensors: { deviceOrientation: boolean; deviceMotion: boolean };
}

/** Stable 32-bit hash of any string, rendered as hex. */
export function hashFingerprint(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i++) h = ((h << 5) + h + input.charCodeAt(i)) >>> 0;
  return h.toString(16).padStart(8, "0");
}

export function detectBrowser(ua: string): { name: string; version: string } {
  if (/Edg\//.test(ua)) return { name: "Edge", version: ua.match(/Edg\/([\d.]+)/)?.[1] ?? "?" };
  if (/OPR\//.test(ua)) return { name: "Opera", version: ua.match(/OPR\/([\d.]+)/)?.[1] ?? "?" };
  if (/Firefox\//.test(ua)) return { name: "Firefox", version: ua.match(/Firefox\/([\d.]+)/)?.[1] ?? "?" };
  if (/Chrome\//.test(ua)) return { name: "Chrome", version: ua.match(/Chrome\/([\d.]+)/)?.[1] ?? "?" };
  if (/Safari\//.test(ua) && !/Chrome/.test(ua))
    return { name: "Safari", version: ua.match(/Version\/([\d.]+)/)?.[1] ?? "?" };
  return { name: "Unknown", version: "?" };
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

/** A canvas drawn with text, shapes and colors — its pixels hash uniquely. */
export function canvasFingerprint(): string | null {
  try {
    const c = document.createElement("canvas");
    c.width = 240;
    c.height = 60;
    const ctx = c.getContext("2d");
    if (!ctx) return null;
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#f60";
    ctx.fillRect(20, 10, 120, 30);
    ctx.fillStyle = "#069";
    ctx.font = "15px Arial";
    ctx.fillText("Should Be Free — 2+2=4, for $20", 8, 40);
    ctx.strokeStyle = "rgba(102, 204, 0, 0.7)";
    ctx.beginPath();
    ctx.arc(190, 30, 18, 0, Math.PI * 2);
    ctx.stroke();
    return hashFingerprint(c.toDataURL());
  } catch {
    return null;
  }
}

/** The GPU's reported renderer string — a reliable hardware fingerprint. */
export function webglInfo(): { renderer: string; hash: string | null } | null {
  try {
    const c = document.createElement("canvas");
    const gl = (c.getContext("webgl") ||
      c.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return null;
    const ext = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = ext
      ? String(gl.getParameter(ext.UNMASKED_RENDERER_WEBGL))
      : String(gl.getParameter(gl.RENDERER));
    return { renderer, hash: hashFingerprint(renderer) };
  } catch {
    return null;
  }
}

/** A short audio render through the browser's compressor — hashes per device. */
export async function audioFingerprint(): Promise<string | null> {
  try {
    const AC =
      window.OfflineAudioContext ??
      (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext })
        .webkitOfflineAudioContext;
    if (!AC) return null;
    const ctx = new AC(1, 44100, 44100);
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = 10000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -50;
    comp.knee.value = 40;
    comp.ratio.value = 12;
    comp.attack.value = 0;
    comp.release.value = 0.25;
    osc.connect(comp);
    comp.connect(ctx.destination);
    osc.start(0);
    const buf = await ctx.startRendering();
    const ch = buf.getChannelData(0);
    let sum = 0;
    for (let i = 4500; i < 5000; i++) sum += Math.abs(ch[i]);
    return hashFingerprint(`${sum}:${buf.length}`);
  } catch {
    return null;
  }
}

const FONT_PROBES = [
  "monospace",
  "serif",
  "sans-serif",
  "Arial",
  "Arial Black",
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
  "Trebuchet MS",
  "Verdana",
  "Inter",
  "Fraunces",
];

/** Which of a probe list of fonts is actually installed. */
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
    return FONT_PROBES.filter((f) => {
      if (f === "monospace" || f === "serif" || f === "sans-serif") return true;
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
  "notifications",
  "clipboard-read",
  "clipboard-write",
  "midi",
  "usb",
  "bluetooth",
  "persistent-storage",
  "accelerometer",
  "gyroscope",
  "magnetometer",
  "ambient-light-sensor",
];

/** Read-only state of every probeable permission — never prompts. */
export async function probePermissions(): Promise<
  Record<string, "granted" | "denied" | "prompt" | "unsupported">
> {
  const out: Record<string, "granted" | "denied" | "prompt" | "unsupported"> = {};
  if (!navigator.permissions?.query) return out;
  for (const name of PERMISSION_PROBES) {
    try {
      const st = await navigator.permissions.query({ name: name as PermissionName });
      out[name] = st.state;
    } catch {
      out[name] = "unsupported";
    }
  }
  return out;
}

export async function probeBattery(): Promise<BatteryState | null> {
  try {
    const nav = navigator as Navigator & { getBattery?: () => Promise<BatteryState> };
    if (!nav.getBattery) return null;
    const b = await nav.getBattery();
    return { charging: !!b.charging, level: b.level };
  } catch {
    return null;
  }
}

export function probeStorage(): PrivacyProfile["storage"] {
  const has = (fn: () => boolean) => {
    try {
      return fn();
    } catch {
      return false;
    }
  };
  return {
    cookies: has(() => navigator.cookieEnabled),
    localStorage: has(() => typeof window.localStorage !== "undefined"),
    sessionStorage: has(() => typeof window.sessionStorage !== "undefined"),
    indexedDB: has(() => typeof window.indexedDB !== "undefined"),
    serviceWorker: has(() => typeof navigator.serviceWorker !== "undefined"),
    cacheStorage: has(() => typeof caches !== "undefined"),
  };
}

export function probeSensors(): PrivacyProfile["sensors"] {
  return {
    deviceOrientation: typeof window.DeviceOrientationEvent !== "undefined",
    deviceMotion: typeof window.DeviceMotionEvent !== "undefined",
  };
}

/** Run the full read — call only after explicit consent. */
export async function collectProfile(): Promise<PrivacyProfile> {
  const ua = navigator.userAgent;
  const [battery, permissions, audio] = await Promise.all([
    probeBattery(),
    probePermissions(),
    audioFingerprint(),
  ]);
  const gl = webglInfo();
  const nav = navigator as Navigator & { deviceMemory?: number };
  return {
    collectedAt: Date.now(),
    browser: { ...detectBrowser(ua), ua },
    os: detectOS(ua),
    device: detectDevice(ua),
    platform: navigator.platform ?? "unknown",
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone ?? "unknown",
    screen: {
      width: window.screen?.width ?? 0,
      height: window.screen?.height ?? 0,
      dpr: window.devicePixelRatio ?? 1,
      colorDepth: window.screen?.colorDepth ?? 0,
    },
    hardware: {
      cores: navigator.hardwareConcurrency ?? 0,
      memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : null,
    },
    gpu: gl?.renderer ?? null,
    battery,
    permissions,
    fingerprints: {
      canvas: canvasFingerprint(),
      webgl: gl?.hash ?? null,
      audio,
      fonts: detectFonts(),
    },
    storage: probeStorage(),
    sensors: probeSensors(),
  };
}
