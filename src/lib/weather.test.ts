import { describe, expect, it } from "vitest";
import { mapForecast, wmoToCondition, type CityRef } from "./weather";

const PARIS: CityRef = { name: "Paris", country: "France", lat: 48.8566, lon: 2.3522 };

const FIXTURE = {
  current: {
    time: "2026-08-11T13:00",
    temperature_2m: 21.4,
    apparent_temperature: 20.1,
    relative_humidity_2m: 62,
    wind_speed_10m: 14.2,
    weather_code: 2,
  },
  hourly: {
    time: [
      "2026-08-11T00:00",
      "2026-08-11T01:00",
      "2026-08-11T13:00",
      "2026-08-11T14:00",
      "2026-08-11T15:00",
    ],
    temperature_2m: [14, 13.5, 21.4, 22.1, 22.8],
    weather_code: [0, 0, 2, 2, 1],
  },
  daily: {
    time: ["2026-08-11", "2026-08-12", "2026-08-13"],
    weather_code: [2, 61, 95],
    temperature_2m_max: [24.2, 22.0, 21.1],
    temperature_2m_min: [12.3, 13.0, 12.5],
  },
  timezone: "Europe/Paris",
};

describe("wmoToCondition", () => {
  it("maps WMO codes to conditions", () => {
    expect(wmoToCondition(0)).toBe("clear");
    expect(wmoToCondition(1)).toBe("partly");
    expect(wmoToCondition(3)).toBe("cloudy");
    expect(wmoToCondition(61)).toBe("rain");
    expect(wmoToCondition(71)).toBe("snow");
    expect(wmoToCondition(95)).toBe("storm");
  });
});

describe("mapForecast", () => {
  const f = mapForecast(PARIS, FIXTURE);

  it("rounds current conditions to Celsius", () => {
    expect(f.temp).toBe(21);
    expect(f.feels).toBe(20);
    expect(f.humidity).toBe(62);
    expect(f.wind).toBe(14);
    expect(f.condition).toBe("partly");
  });

  it("starts the hourly strip at the current hour", () => {
    expect(f.hourly.length).toBe(3);
    expect(f.hourly[0].t).toBe("Now");
    expect(f.hourly[0].temp).toBe(21);
    expect(f.hourly[1].t).toBe("2PM");
    expect(f.hourly[2].t).toBe("3PM");
  });

  it("builds the 7-day list with labels", () => {
    expect(f.days.length).toBe(3);
    expect(f.days[0].day).toBe("Today");
    expect(f.days[1].day).toBe("Tomorrow");
    expect(f.days[0].hi).toBe(24);
    expect(f.days[0].lo).toBe(12);
    expect(f.days[1].icon).toBe("rain");
  });

  it("survives empty payloads", () => {
    const empty = mapForecast(PARIS, {});
    expect(empty.temp).toBe(0);
    expect(empty.days).toEqual([]);
    expect(empty.hourly).toEqual([]);
  });
});
