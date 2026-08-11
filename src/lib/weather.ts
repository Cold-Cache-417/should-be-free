/*
 * Weather engine — real data, Celsius, the whole world.
 *
 * Forecasts come from Open-Meteo (free, no key). The weather is real;
 * the pricing is the joke. Current conditions cost $10. The details
 * (hourly + 7-day) cost $15.
 */

export type Condition = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow";

export const CONDITIONS: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly Cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Thunderstorm",
  snow: "Snow",
};

export interface Hour {
  t: string;
  temp: number;
  icon: Condition;
}

export interface Day {
  day: string;
  icon: Condition;
  lo: number;
  hi: number;
}

export interface CityForecast {
  city: string;
  country: string;
  temp: number;
  hi: number;
  lo: number;
  feels: number;
  condition: Condition;
  conditionLabel: string;
  humidity: number;
  wind: number;
  hourly: Hour[];
  days: Day[];
  timezone: string;
}

export interface CityRef {
  name: string;
  country: string;
  lat: number;
  lon: number;
}

/** WMO weather code → our condition. */
export function wmoToCondition(code: number): Condition {
  if (code === 0) return "clear";
  if (code <= 2) return "partly";
  if (code === 3 || code === 45 || code === 48) return "cloudy";
  if (code === 71 || code === 73 || code === 75 || code === 77 || code === 85 || code === 86)
    return "snow";
  if (code >= 95) return "storm";
  return "rain"; // 51–67, 80–82 and anything else damp
}

function hourLabel(iso: string, isNow: boolean): string {
  if (isNow) return "Now";
  const h = Number(iso.slice(11, 13));
  if (Number.isNaN(h)) return iso;
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}${h < 12 ? "AM" : "PM"}`;
}

function dayLabel(iso: string, index: number): string {
  if (index === 0) return "Today";
  if (index === 1) return "Tomorrow";
  const d = new Date(`${iso}T00:00:00`);
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** Map a raw Open-Meteo forecast response to our shape. */
export function mapForecast(city: CityRef, json: unknown): CityForecast {
  const j = (json ?? {}) as {
    current?: {
      time?: string;
      temperature_2m?: number;
      apparent_temperature?: number;
      relative_humidity_2m?: number;
      wind_speed_10m?: number;
      weather_code?: number;
    };
    hourly?: { time?: string[]; temperature_2m?: number[]; weather_code?: number[] };
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
    timezone?: string;
  };
  const cur = j.current ?? {};
  const hourly = j.hourly ?? {};
  const daily = j.daily ?? {};

  const now = cur.time;
  const times = hourly.time ?? [];
  let start = 0;
  if (now) {
    const idx = times.indexOf(now);
    if (idx >= 0) start = idx;
  }

  const hours: Hour[] = [];
  for (let i = start; i < Math.min(start + 12, times.length); i++) {
    const t = times[i] ?? "";
    hours.push({
      t: hourLabel(t, i === start),
      temp: Math.round(hourly.temperature_2m?.[i] ?? 0),
      icon: wmoToCondition(hourly.weather_code?.[i] ?? 0),
    });
  }

  const dayTimes = daily.time ?? [];
  const days: Day[] = dayTimes.slice(0, 7).map((t, i) => ({
    day: dayLabel(t, i),
    icon: wmoToCondition(daily.weather_code?.[i] ?? 0),
    lo: Math.round(daily.temperature_2m_min?.[i] ?? 0),
    hi: Math.round(daily.temperature_2m_max?.[i] ?? 0),
  }));

  const cond = wmoToCondition(cur.weather_code ?? 0);

  return {
    city: city.name,
    country: city.country,
    temp: Math.round(cur.temperature_2m ?? 0),
    hi: days[0]?.hi ?? Math.round(cur.temperature_2m ?? 0),
    lo: days[0]?.lo ?? Math.round(cur.temperature_2m ?? 0),
    feels: Math.round(cur.apparent_temperature ?? cur.temperature_2m ?? 0),
    condition: cond,
    conditionLabel: CONDITIONS[cond],
    humidity: Math.round(cur.relative_humidity_2m ?? 0),
    wind: Math.round(cur.wind_speed_10m ?? 0),
    hourly: hours,
    days,
    timezone: j.timezone ?? "auto",
  };
}

export async function fetchForecast(city: CityRef): Promise<CityForecast> {
  const url =
    "https://api.open-meteo.com/v1/forecast" +
    `?latitude=${city.lat}&longitude=${city.lon}` +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
    "&hourly=temperature_2m,weather_code" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min" +
    "&timezone=auto&forecast_days=7";
  const res = await fetch(url);
  if (!res.ok) throw new Error(`forecast ${res.status}`);
  return mapForecast(city, await res.json());
}

/** Search any city on Earth via Open-Meteo geocoding. */
export async function searchCities(query: string): Promise<CityRef[]> {
  const q = query.trim();
  if (q.length < 2) return [];
  const url =
    "https://geocoding-api.open-meteo.com/v1/search" +
    `?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const j = (await res.json()) as {
    results?: Array<{ name?: string; country?: string; latitude?: number; longitude?: number }>;
  };
  return (j.results ?? [])
    .filter((r) => r.name && typeof r.latitude === "number" && typeof r.longitude === "number")
    .map((r) => ({
      name: r.name as string,
      country: r.country ?? "",
      lat: r.latitude as number,
      lon: r.longitude as number,
    }));
}

export const DEFAULT_CITIES: CityRef[] = [
  { name: "Cupertino", country: "United States", lat: 37.323, lon: -122.032 },
  { name: "New York", country: "United States", lat: 40.7128, lon: -74.006 },
  { name: "London", country: "United Kingdom", lat: 51.5074, lon: -0.1278 },
  { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 },
  { name: "Tokyo", country: "Japan", lat: 35.6762, lon: 139.6503 },
  { name: "Dubai", country: "United Arab Emirates", lat: 25.2048, lon: 55.2708 },
  { name: "Mumbai", country: "India", lat: 19.076, lon: 72.8777 },
  { name: "Sydney", country: "Australia", lat: -33.8688, lon: 151.2093 },
  { name: "Lagos", country: "Nigeria", lat: 6.5244, lon: 3.3792 },
  { name: "São Paulo", country: "Brazil", lat: -23.5505, lon: -46.6333 },
];

export const CURRENT_TIERS = [
  {
    id: "wx-current",
    name: "See Weather",
    price: "$10",
    period: "one-time",
    description: "Today's conditions, released from the blur.",
    badge: "Just today",
    featured: true,
    cta: "See the weather",
  },
  {
    id: "wx-current-monthly",
    name: "Weather Monthly",
    price: "$500",
    period: "/month",
    description: "All the conditions, all month.",
    cta: "Weather monthly",
  },
  {
    id: "wx-current-yearly",
    name: "Weather Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of visibility.",
    note: "Yes, it's cheaper.",
    cta: "Weather yearly",
  },
];

export const TEMP_TIERS = [
  {
    id: "wx-temp",
    name: "See the Temperature",
    price: "$5",
    period: "one-time",
    description: "Just the degrees. Nothing else.",
    badge: "Just degrees",
    featured: true,
    cta: "See the temperature",
  },
  {
    id: "wx-temp-monthly",
    name: "Temperature Monthly",
    price: "$500",
    period: "/month",
    description: "All the degrees, all month.",
    cta: "Temperature monthly",
  },
  {
    id: "wx-temp-yearly",
    name: "Temperature Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of warmth.",
    note: "Yes, it's cheaper.",
    cta: "Temperature yearly",
  },
];

export const CONDITIONS_TIERS = [
  {
    id: "wx-conditions",
    name: "Conditions & Stats",
    price: "$10",
    period: "one-time",
    description: "Condition, highs and lows, feels-like, humidity, wind.",
    badge: "The stats",
    featured: true,
    cta: "See the conditions",
  },
  {
    id: "wx-conditions-monthly",
    name: "Conditions Monthly",
    price: "$500",
    period: "/month",
    description: "All the stats, all month.",
    cta: "Conditions monthly",
  },
  {
    id: "wx-conditions-yearly",
    name: "Conditions Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of specifics.",
    note: "Yes, it's cheaper.",
    cta: "Conditions yearly",
  },
];

export const DETAILS_TIERS = [
  {
    id: "wx-details",
    name: "Forecast Details",
    price: "$15",
    period: "one-time",
    description: "Hourly strip + full 7-day outlook.",
    badge: "The details",
    featured: true,
    cta: "Pay for details",
  },
  {
    id: "wx-details-monthly",
    name: "Details Monthly",
    price: "$500",
    period: "/month",
    description: "Every detail, every month.",
    cta: "Details monthly",
  },
  {
    id: "wx-details-yearly",
    name: "Details Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of specifics.",
    note: "Yes, it's cheaper.",
    cta: "Details yearly",
  },
];
