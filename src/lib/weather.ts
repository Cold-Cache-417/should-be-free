/*
 * Weather engine — every forecast is a static array (the whole joke).
 * Today is free. Tomorrow is a premium feature.
 */

export type Condition = "clear" | "partly" | "cloudy" | "rain" | "storm" | "snow";

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
  id: string;
  city: string;
  country: string;
  temp: number;
  hi: number;
  lo: number;
  condition: Condition;
  conditionLabel: string;
  humidity: number;
  wind: number;
  hourly: Hour[];
  days: Day[];
}

export const CONDITIONS: Record<Condition, string> = {
  clear: "Clear",
  partly: "Partly Cloudy",
  cloudy: "Cloudy",
  rain: "Rain",
  storm: "Thunderstorm",
  snow: "Snow",
};

const CU: CityForecast = {
  id: "cupertino",
  city: "Cupertino",
  country: "United States",
  temp: 72,
  hi: 78,
  lo: 58,
  condition: "clear",
  conditionLabel: "Clear",
  humidity: 41,
  wind: 6,
  hourly: [
    { t: "Now", temp: 72, icon: "clear" },
    { t: "1PM", temp: 74, icon: "clear" },
    { t: "2PM", temp: 76, icon: "clear" },
    { t: "3PM", temp: 77, icon: "clear" },
    { t: "4PM", temp: 78, icon: "clear" },
    { t: "5PM", temp: 76, icon: "partly" },
    { t: "6PM", temp: 73, icon: "partly" },
    { t: "7PM", temp: 69, icon: "clear" },
    { t: "8PM", temp: 66, icon: "clear" },
    { t: "9PM", temp: 64, icon: "clear" },
    { t: "10PM", temp: 62, icon: "clear" },
    { t: "11PM", temp: 60, icon: "clear" },
  ],
  days: [
    { day: "Today", icon: "clear", lo: 58, hi: 78 },
    { day: "Tomorrow", icon: "clear", lo: 59, hi: 79 },
    { day: "Wed", icon: "partly", lo: 60, hi: 77 },
    { day: "Thu", icon: "rain", lo: 57, hi: 70 },
    { day: "Fri", icon: "rain", lo: 55, hi: 68 },
    { day: "Sat", icon: "cloudy", lo: 56, hi: 69 },
    { day: "Sun", icon: "clear", lo: 58, hi: 74 },
  ],
};

const NYC: CityForecast = {
  id: "nyc",
  city: "New York",
  country: "United States",
  temp: 64,
  hi: 71,
  lo: 55,
  condition: "partly",
  conditionLabel: "Partly Cloudy",
  humidity: 52,
  wind: 9,
  hourly: [
    { t: "Now", temp: 64, icon: "partly" },
    { t: "1PM", temp: 66, icon: "partly" },
    { t: "2PM", temp: 68, icon: "partly" },
    { t: "3PM", temp: 70, icon: "clear" },
    { t: "4PM", temp: 71, icon: "clear" },
    { t: "5PM", temp: 69, icon: "partly" },
    { t: "6PM", temp: 67, icon: "cloudy" },
    { t: "7PM", temp: 65, icon: "cloudy" },
    { t: "8PM", temp: 63, icon: "cloudy" },
    { t: "9PM", temp: 61, icon: "partly" },
    { t: "10PM", temp: 60, icon: "partly" },
    { t: "11PM", temp: 58, icon: "clear" },
  ],
  days: [
    { day: "Today", icon: "partly", lo: 55, hi: 71 },
    { day: "Tomorrow", icon: "rain", lo: 53, hi: 64 },
    { day: "Wed", icon: "rain", lo: 52, hi: 63 },
    { day: "Thu", icon: "cloudy", lo: 54, hi: 67 },
    { day: "Fri", icon: "clear", lo: 56, hi: 72 },
    { day: "Sat", icon: "clear", lo: 57, hi: 74 },
    { day: "Sun", icon: "partly", lo: 58, hi: 73 },
  ],
};

const LDN: CityForecast = {
  id: "london",
  city: "London",
  country: "United Kingdom",
  temp: 58,
  hi: 62,
  lo: 51,
  condition: "rain",
  conditionLabel: "Light Rain",
  humidity: 78,
  wind: 12,
  hourly: [
    { t: "Now", temp: 58, icon: "rain" },
    { t: "1PM", temp: 59, icon: "rain" },
    { t: "2PM", temp: 60, icon: "rain" },
    { t: "3PM", temp: 61, icon: "rain" },
    { t: "4PM", temp: 62, icon: "cloudy" },
    { t: "5PM", temp: 61, icon: "cloudy" },
    { t: "6PM", temp: 60, icon: "rain" },
    { t: "7PM", temp: 58, icon: "rain" },
    { t: "8PM", temp: 57, icon: "rain" },
    { t: "9PM", temp: 56, icon: "cloudy" },
    { t: "10PM", temp: 55, icon: "cloudy" },
    { t: "11PM", temp: 54, icon: "cloudy" },
  ],
  days: [
    { day: "Today", icon: "rain", lo: 51, hi: 62 },
    { day: "Tomorrow", icon: "rain", lo: 50, hi: 61 },
    { day: "Wed", icon: "cloudy", lo: 51, hi: 63 },
    { day: "Thu", icon: "rain", lo: 49, hi: 59 },
    { day: "Fri", icon: "partly", lo: 50, hi: 62 },
    { day: "Sat", icon: "clear", lo: 52, hi: 66 },
    { day: "Sun", icon: "partly", lo: 53, hi: 64 },
  ],
};

const TYO: CityForecast = {
  id: "tokyo",
  city: "Tokyo",
  country: "Japan",
  temp: 81,
  hi: 86,
  lo: 74,
  condition: "storm",
  conditionLabel: "Thunderstorms",
  humidity: 71,
  wind: 14,
  hourly: [
    { t: "Now", temp: 81, icon: "storm" },
    { t: "1PM", temp: 83, icon: "storm" },
    { t: "2PM", temp: 85, icon: "rain" },
    { t: "3PM", temp: 86, icon: "rain" },
    { t: "4PM", temp: 84, icon: "storm" },
    { t: "5PM", temp: 82, icon: "storm" },
    { t: "6PM", temp: 80, icon: "rain" },
    { t: "7PM", temp: 78, icon: "rain" },
    { t: "8PM", temp: 77, icon: "cloudy" },
    { t: "9PM", temp: 76, icon: "cloudy" },
    { t: "10PM", temp: 76, icon: "cloudy" },
    { t: "11PM", temp: 75, icon: "clear" },
  ],
  days: [
    { day: "Today", icon: "storm", lo: 74, hi: 86 },
    { day: "Tomorrow", icon: "rain", lo: 73, hi: 83 },
    { day: "Wed", icon: "rain", lo: 72, hi: 82 },
    { day: "Thu", icon: "cloudy", lo: 73, hi: 84 },
    { day: "Fri", icon: "clear", lo: 75, hi: 87 },
    { day: "Sat", icon: "clear", lo: 76, hi: 88 },
    { day: "Sun", icon: "partly", lo: 77, hi: 87 },
  ],
};

const SYD: CityForecast = {
  id: "sydney",
  city: "Sydney",
  country: "Australia",
  temp: 63,
  hi: 69,
  lo: 52,
  condition: "clear",
  conditionLabel: "Clear",
  humidity: 44,
  wind: 7,
  hourly: [
    { t: "Now", temp: 63, icon: "clear" },
    { t: "1PM", temp: 65, icon: "clear" },
    { t: "2PM", temp: 67, icon: "clear" },
    { t: "3PM", temp: 68, icon: "clear" },
    { t: "4PM", temp: 69, icon: "clear" },
    { t: "5PM", temp: 67, icon: "clear" },
    { t: "6PM", temp: 64, icon: "clear" },
    { t: "7PM", temp: 61, icon: "clear" },
    { t: "8PM", temp: 59, icon: "clear" },
    { t: "9PM", temp: 57, icon: "clear" },
    { t: "10PM", temp: 55, icon: "clear" },
    { t: "11PM", temp: 54, icon: "clear" },
  ],
  days: [
    { day: "Today", icon: "clear", lo: 52, hi: 69 },
    { day: "Tomorrow", icon: "partly", lo: 53, hi: 70 },
    { day: "Wed", icon: "partly", lo: 54, hi: 68 },
    { day: "Thu", icon: "cloudy", lo: 53, hi: 66 },
    { day: "Fri", icon: "rain", lo: 51, hi: 63 },
    { day: "Sat", icon: "rain", lo: 50, hi: 62 },
    { day: "Sun", icon: "clear", lo: 51, hi: 65 },
  ],
};

export const CITIES: CityForecast[] = [CU, NYC, LDN, TYO, SYD];

export function cityById(id: string): CityForecast {
  return CITIES.find((c) => c.id === id) ?? CU;
}

/** The page itself is free. Tomorrow is where the money is. */
export const TOMORROW_TIERS = [
  {
    id: "wx-tomorrow",
    name: "Tomorrow's Forecast",
    price: "$10",
    period: "one-time",
    description: "The future, unlocked. For today.",
    badge: "The future",
    featured: true,
    cta: "Reveal tomorrow",
  },
  {
    id: "wx-monthly",
    name: "Forecast Monthly",
    price: "$500",
    period: "/month",
    description: "All the tomorrows, on tap.",
    cta: "Forecast monthly",
  },
  {
    id: "wx-yearly",
    name: "Forecast Yearly",
    price: "$1,799",
    period: "/year",
    description: "A whole year of future.",
    note: "Yes, it's cheaper.",
    cta: "Forecast yearly",
  },
];
