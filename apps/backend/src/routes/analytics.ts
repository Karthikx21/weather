import { Router, type IRouter } from "express";
import { GetHistoricalSummaryQueryParams, CompareCitiesBody } from "@workspace/api-zod";
import { getWeatherDescription } from "../lib/weather-utils.js";
import { cache, TTL } from "../lib/cache.js";
import { fetchJson } from "../lib/request-manager.js";

const router: IRouter = Router();
const OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1";
const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1";

function getDateRange(period: string): { startDate: string; endDate: string } {
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date(end);
  if (period === "week") start.setDate(start.getDate() - 7);
  else if (period === "year") start.setFullYear(start.getFullYear() - 1);
  else start.setMonth(start.getMonth() - 1); // default: month
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return { startDate: fmt(start), endDate: fmt(end) };
}

router.get("/analytics/historical-summary", async (req, res): Promise<void> => {
  const parsed = GetHistoricalSummaryQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon, period = "month" } = parsed.data;
  const { startDate, endDate } = getDateRange(period);
  const cacheKey = `hist-summary:${lat.toFixed(4)}:${lon.toFixed(4)}:${period}`;

  try {
    const result = await cache.getOrFetch(cacheKey, TTL.HISTORICAL, async () => {
      const url = new URL(`${OPEN_METEO_ARCHIVE}/archive`);
      url.searchParams.set("latitude", String(lat));
      url.searchParams.set("longitude", String(lon));
      url.searchParams.set("start_date", startDate);
      url.searchParams.set("end_date", endDate);
      url.searchParams.set("daily", [
        "weather_code",
        "temperature_2m_max",
        "temperature_2m_min",
        "precipitation_sum",
        "wind_speed_10m_max",
        "wind_gusts_10m_max",
      ].join(","));
      url.searchParams.set("hourly", "relative_humidity_2m,surface_pressure");
      url.searchParams.set("timezone", "auto");

      const data = await fetchJson<Record<string, unknown>>(url.toString(), {
        timeoutMs: 8000,
        retryCount: 2,
        retryDelayMs: 500,
        dedupeKey: `analytics-historical:${cacheKey}`,
      });

      const daily = data.daily as Record<string, unknown[]>;
      const hourly = data.hourly as Record<string, number[]>;

      const tempMax = (daily.temperature_2m_max as number[]) ?? [];
      const tempMin = (daily.temperature_2m_min as number[]) ?? [];
      const precipitation = (daily.precipitation_sum as number[]) ?? [];
      const windSpeed = (daily.wind_speed_10m_max as number[]) ?? [];
      const dates = (daily.time as string[]) ?? [];
      const weatherCodes = (daily.weather_code as number[]) ?? [];
      const humidity = (hourly.relative_humidity_2m as number[] | undefined) ?? [];
      const pressure = (hourly.surface_pressure as number[] | undefined) ?? [];

      const avg = (arr: number[]) => arr.filter((v) => v != null).reduce((a, b) => a + b, 0) / (arr.filter((v) => v != null).length || 1);
      const max = (arr: number[]) => Math.max(...arr.filter((v) => v != null));
      const min = (arr: number[]) => Math.min(...arr.filter((v) => v != null));
      const sum = (arr: number[]) => arr.filter((v) => v != null).reduce((a, b) => a + b, 0);

      const n = dates.length;
      const hoursPerDay = n > 0 ? Math.floor(humidity.length / n) : 0;
      const dailyHumidity = dates.map((_, i) => avg(humidity.slice(i * hoursPerDay, (i + 1) * hoursPerDay)));
      const dailyPressure = dates.map((_, i) => avg(pressure.slice(i * hoursPerDay, (i + 1) * hoursPerDay)));

      const dailyData = dates.map((date, i) => ({
        date,
        temp_max: tempMax[i],
        temp_min: tempMin[i],
        weather_code: weatherCodes[i],
        weather_description: getWeatherDescription(weatherCodes[i]),
        sunrise: "",
        sunset: "",
        uv_index_max: null,
        precipitation_sum: precipitation[i] ?? 0,
        precipitation_probability_max: 0,
        wind_speed_max: windSpeed[i] ?? 0,
        wind_gusts_max: (daily.wind_gusts_10m_max as number[])?.[i] ?? null,
      }));

      return {
        period,
        avg_temp: Math.round(avg([...tempMax, ...tempMin]) * 10) / 10,
        max_temp: Math.round(max(tempMax) * 10) / 10,
        min_temp: Math.round(min(tempMin) * 10) / 10,
        avg_humidity: Math.round(avg(dailyHumidity) * 10) / 10,
        total_rainfall: Math.round(sum(precipitation) * 10) / 10,
        avg_wind_speed: Math.round(avg(windSpeed) * 10) / 10,
        avg_pressure: Math.round(avg(dailyPressure) * 10) / 10,
        avg_aqi: null,
        daily_data: dailyData,
      };
    });
    res.json(result);
  } catch (err) {
    req.log.error({ err }, "Failed to get historical summary");
    res.status(500).json({ error: "Failed to get historical summary" });
  }
});

router.post("/analytics/comparison", async (req, res): Promise<void> => {
  const parsed = CompareCitiesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { cities } = parsed.data;

  try {
    const results = await Promise.all(
      cities.map(async (city) => {
        const { lat, lon } = city;
        const cityCacheKey = `compare:${lat.toFixed(4)}:${lon.toFixed(4)}`;

        return cache.getOrFetch(cityCacheKey, TTL.COMPARISON, async () => {
          const [weather, aq, forecast] = await Promise.all([
            fetchJson<Record<string, unknown>>(
              `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,relative_humidity_2m,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m,visibility,cloud_cover,precipitation,snowfall,uv_index,weather_code,is_day,rain&daily=sunrise,sunset&forecast_days=1&timezone=auto`,
              { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500, dedupeKey: `analytics-weather:${cityCacheKey}` },
            ),
            fetchJson<Record<string, unknown>>(
              `${AIR_QUALITY_BASE}/air-quality?latitude=${lat}&longitude=${lon}&current=pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,ozone,sulphur_dioxide,dust,uv_index&timezone=auto`,
              { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500, dedupeKey: `analytics-aq:${cityCacheKey}` },
            ),
            fetchJson<Record<string, unknown>>(
              `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,precipitation_sum,precipitation_probability_max,wind_speed_10m_max&forecast_days=1&timezone=auto`,
              { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500, dedupeKey: `analytics-forecast:${cityCacheKey}` },
            ),
          ]);

          const cur = weather.current as Record<string, unknown>;
          const daily = weather.daily as Record<string, unknown[]>;
          const aqCur = aq.current as Record<string, number | null>;
          const fDaily = forecast.daily as Record<string, unknown[]>;

          if (!cur) throw new Error(`No current weather data for ${city.name}`);
          if (!fDaily) throw new Error(`No forecast data for ${city.name}`);

          const pm25 = Number(aqCur?.pm2_5 ?? 0);
          const breakpoints = [[0,12,0,50],[12.1,35.4,51,100],[35.5,55.4,101,150],[55.5,150.4,151,200],[150.5,250.4,201,300]];
          let aqi = Math.round(pm25 * 2);
          for (const [cL,cH,iL,iH] of breakpoints) {
            if (pm25 >= cL && pm25 <= cH) { aqi = Math.round(((iH-iL)/(cH-cL))*(pm25-cL)+iL); break; }
          }
          const aqiCat = aqi<=50?"Good":aqi<=100?"Moderate":aqi<=150?"Unhealthy for Sensitive Groups":aqi<=200?"Unhealthy":"Very Unhealthy";

          return {
            city,
            current_weather: {
              temperature: cur.temperature_2m,
              feels_like: cur.apparent_temperature,
              humidity: cur.relative_humidity_2m,
              pressure: cur.surface_pressure,
              wind_speed: cur.wind_speed_10m,
              wind_direction: cur.wind_direction_10m,
              wind_gusts: cur.wind_gusts_10m ?? null,
              visibility: (cur.visibility as number) / 1000,
              cloud_cover: cur.cloud_cover,
              rainfall: cur.rain ?? cur.precipitation ?? 0,
              snowfall: cur.snowfall ?? null,
              uv_index: cur.uv_index,
              weather_code: cur.weather_code,
              weather_description: (() => {
                const codes: Record<number,string> = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",95:"Thunderstorm"};
                return codes[cur.weather_code as number] ?? "Unknown";
              })(),
              is_day: cur.is_day,
              sunrise: (daily.sunrise?.[0] as string) ?? "",
              sunset: (daily.sunset?.[0] as string) ?? "",
              moonrise: null,
              moonset: null,
            },
            air_quality: {
              aqi,
              aqi_category: aqiCat,
              pm2_5: aqCur?.pm2_5 ?? 0,
              pm10: aqCur?.pm10 ?? 0,
              carbon_monoxide: aqCur?.carbon_monoxide ?? 0,
              nitrogen_dioxide: aqCur?.nitrogen_dioxide ?? 0,
              ozone: aqCur?.ozone ?? 0,
              sulphur_dioxide: aqCur?.sulphur_dioxide ?? 0,
              dust: aqCur?.dust ?? null,
              uv_index: aqCur?.uv_index ?? 0,
              hourly: [],
            },
            forecast_today: {
              date: (fDaily.time as string[])?.[0] ?? "",
              temp_max: (fDaily.temperature_2m_max as number[])?.[0],
              temp_min: (fDaily.temperature_2m_min as number[])?.[0],
              weather_code: (fDaily.weather_code as number[])?.[0],
              weather_description: (() => {
                const c = (fDaily.weather_code as number[])?.[0];
                const codes: Record<number,string> = {0:"Clear sky",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",45:"Foggy",61:"Slight rain",63:"Moderate rain",65:"Heavy rain",95:"Thunderstorm"};
                return codes[c] ?? "Unknown";
              })(),
              sunrise: (fDaily.sunrise as string[])?.[0] ?? "",
              sunset: (fDaily.sunset as string[])?.[0] ?? "",
              uv_index_max: null,
              precipitation_sum: (fDaily.precipitation_sum as number[])?.[0] ?? 0,
              precipitation_probability_max: (fDaily.precipitation_probability_max as number[])?.[0] ?? 0,
              wind_speed_max: (fDaily.wind_speed_10m_max as number[])?.[0] ?? 0,
              wind_gusts_max: null,
            },
          };
        }); // end cache.getOrFetch
      }),
    );

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to compare cities");
    const status = (err as any)?.status === 429 ? 429 : 500;
    res.status(status).json({ error: status === 429 ? "Rate limited by upstream API, please wait" : "Failed to compare cities" });
  }
});

export default router;
