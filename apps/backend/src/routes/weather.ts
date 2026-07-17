import { Router, type IRouter } from "express";
import {
  GetCurrentWeatherQueryParams,
  GetWeatherForecastQueryParams,
  GetHistoricalWeatherQueryParams,
  GetWeatherAlertsQueryParams,
} from "@workspace/api-zod";
import { getWeatherDescription, getAlerts } from "../lib/weather-utils";

const router: IRouter = Router();

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1";

router.get("/weather/current", async (req, res): Promise<void> => {
  const parsed = GetCurrentWeatherQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon, timezone = "auto" } = parsed.data;

  try {
    const url = new URL(`${OPEN_METEO_BASE}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", timezone);
    url.searchParams.set("current", [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "surface_pressure",
      "wind_speed_10m",
      "wind_direction_10m",
      "wind_gusts_10m",
      "visibility",
      "cloud_cover",
      "precipitation",
      "snowfall",
      "uv_index",
      "weather_code",
      "is_day",
      "rain",
    ].join(","));
    url.searchParams.set("daily", "sunrise,sunset");
    url.searchParams.set("forecast_days", "1");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const cur = data.current as Record<string, unknown>;
    const daily = data.daily as Record<string, unknown[]>;

    res.json({
      temperature: cur.temperature_2m,
      feels_like: cur.apparent_temperature,
      humidity: cur.relative_humidity_2m,
      pressure: cur.surface_pressure,
      wind_speed: cur.wind_speed_10m,
      wind_direction: cur.wind_direction_10m,
      wind_gusts: cur.wind_gusts_10m ?? null,
      visibility: (cur.visibility as number) / 1000,
      cloud_cover: cur.cloud_cover,
      rainfall: (cur.rain as number) ?? (cur.precipitation as number) ?? 0,
      snowfall: cur.snowfall ?? null,
      uv_index: cur.uv_index,
      weather_code: cur.weather_code,
      weather_description: getWeatherDescription(cur.weather_code as number),
      is_day: cur.is_day,
      sunrise: (daily.sunrise?.[0] as string) ?? "",
      sunset: (daily.sunset?.[0] as string) ?? "",
      moonrise: null,
      moonset: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch current weather");
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
});

router.get("/weather/forecast", async (req, res): Promise<void> => {
  const parsed = GetWeatherForecastQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon, timezone = "auto", days = 7 } = parsed.data;

  try {
    const url = new URL(`${OPEN_METEO_BASE}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", timezone);
    url.searchParams.set("forecast_days", String(Math.min(days, 16)));
    url.searchParams.set("hourly", [
      "temperature_2m",
      "apparent_temperature",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "surface_pressure",
      "uv_index",
      "is_day",
    ].join(","));
    url.searchParams.set("daily", [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "uv_index_max",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const hourly = data.hourly as Record<string, unknown[]>;
    const daily = data.daily as Record<string, unknown[]>;

    const hourlyArr = (hourly.time as string[]).map((time, i) => ({
      time,
      temperature: (hourly.temperature_2m as number[])[i],
      feels_like: (hourly.apparent_temperature as number[])?.[i] ?? null,
      humidity: (hourly.relative_humidity_2m as number[])[i],
      precipitation_probability: (hourly.precipitation_probability as number[])[i] ?? 0,
      precipitation: (hourly.precipitation as number[])?.[i] ?? null,
      weather_code: (hourly.weather_code as number[])[i],
      weather_description: getWeatherDescription((hourly.weather_code as number[])[i]),
      wind_speed: (hourly.wind_speed_10m as number[])[i],
      pressure: (hourly.surface_pressure as number[])?.[i] ?? null,
      uv_index: (hourly.uv_index as number[])?.[i] ?? null,
      is_day: (hourly.is_day as number[])[i],
    }));

    const dailyArr = (daily.time as string[]).map((date, i) => ({
      date,
      temp_max: (daily.temperature_2m_max as number[])[i],
      temp_min: (daily.temperature_2m_min as number[])[i],
      weather_code: (daily.weather_code as number[])[i],
      weather_description: getWeatherDescription((daily.weather_code as number[])[i]),
      sunrise: (daily.sunrise as string[])[i],
      sunset: (daily.sunset as string[])[i],
      uv_index_max: (daily.uv_index_max as number[])?.[i] ?? null,
      precipitation_sum: (daily.precipitation_sum as number[])[i] ?? 0,
      precipitation_probability_max: (daily.precipitation_probability_max as number[])[i] ?? 0,
      wind_speed_max: (daily.wind_speed_10m_max as number[])[i],
      wind_gusts_max: (daily.wind_gusts_10m_max as number[])?.[i] ?? null,
    }));

    res.json({ hourly: hourlyArr, daily: dailyArr });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch forecast");
    res.status(500).json({ error: "Failed to fetch forecast data" });
  }
});

router.get("/weather/historical", async (req, res): Promise<void> => {
  const parsed = GetHistoricalWeatherQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon, start_date, end_date, timezone = "auto" } = parsed.data;

  try {
    const url = new URL(`${OPEN_METEO_ARCHIVE}/archive`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("timezone", timezone);
    url.searchParams.set("start_date", start_date);
    url.searchParams.set("end_date", end_date);
    url.searchParams.set("daily", [
      "weather_code",
      "temperature_2m_max",
      "temperature_2m_min",
      "sunrise",
      "sunset",
      "precipitation_sum",
      "precipitation_probability_max",
      "wind_speed_10m_max",
      "wind_gusts_10m_max",
    ].join(","));
    url.searchParams.set("hourly", [
      "temperature_2m",
      "relative_humidity_2m",
      "precipitation_probability",
      "precipitation",
      "weather_code",
      "wind_speed_10m",
      "surface_pressure",
      "is_day",
    ].join(","));

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo archive error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const hourly = data.hourly as Record<string, unknown[]>;
    const daily = data.daily as Record<string, unknown[]>;

    const hourlyArr = (hourly.time as string[]).map((time, i) => ({
      time,
      temperature: (hourly.temperature_2m as number[])[i],
      feels_like: null,
      humidity: (hourly.relative_humidity_2m as number[])[i],
      precipitation_probability: (hourly.precipitation_probability as number[])?.[i] ?? 0,
      precipitation: (hourly.precipitation as number[])?.[i] ?? null,
      weather_code: (hourly.weather_code as number[])[i],
      weather_description: getWeatherDescription((hourly.weather_code as number[])[i]),
      wind_speed: (hourly.wind_speed_10m as number[])[i],
      pressure: (hourly.surface_pressure as number[])?.[i] ?? null,
      uv_index: null,
      is_day: (hourly.is_day as number[])?.[i] ?? 1,
    }));

    const dailyArr = (daily.time as string[]).map((date, i) => ({
      date,
      temp_max: (daily.temperature_2m_max as number[])[i],
      temp_min: (daily.temperature_2m_min as number[])[i],
      weather_code: (daily.weather_code as number[])[i],
      weather_description: getWeatherDescription((daily.weather_code as number[])[i]),
      sunrise: (daily.sunrise as string[])?.[i] ?? "",
      sunset: (daily.sunset as string[])?.[i] ?? "",
      uv_index_max: null,
      precipitation_sum: (daily.precipitation_sum as number[])[i] ?? 0,
      precipitation_probability_max: (daily.precipitation_probability_max as number[])?.[i] ?? 0,
      wind_speed_max: (daily.wind_speed_10m_max as number[])[i],
      wind_gusts_max: (daily.wind_gusts_10m_max as number[])?.[i] ?? null,
    }));

    res.json({ hourly: hourlyArr, daily: dailyArr });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch historical weather");
    res.status(500).json({ error: "Failed to fetch historical weather data" });
  }
});

router.get("/weather/alerts", async (req, res): Promise<void> => {
  const parsed = GetWeatherAlertsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon } = parsed.data;

  try {
    const url = new URL(`${OPEN_METEO_BASE}/forecast`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", [
      "temperature_2m",
      "wind_speed_10m",
      "wind_gusts_10m",
      "precipitation",
      "weather_code",
      "visibility",
    ].join(","));
    url.searchParams.set("hourly", "precipitation,wind_speed_10m,temperature_2m,weather_code");
    url.searchParams.set("forecast_days", "2");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Open-Meteo error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const cur = data.current as Record<string, number>;
    const alerts = getAlerts(cur);

    res.json(alerts);
  } catch (err) {
    req.log.error({ err }, "Failed to fetch weather alerts");
    res.status(500).json({ error: "Failed to fetch weather alerts" });
  }
});

export default router;
