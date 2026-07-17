import { Router, type IRouter } from "express";
import { GetAirQualityQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1";

function aqiCategory(aqi: number): string {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// Compute US AQI approximation from PM2.5
function pm25ToAqi(pm25: number): number {
  const breakpoints = [
    [0, 12, 0, 50],
    [12.1, 35.4, 51, 100],
    [35.5, 55.4, 101, 150],
    [55.5, 150.4, 151, 200],
    [150.5, 250.4, 201, 300],
    [250.5, 350.4, 301, 400],
    [350.5, 500.4, 401, 500],
  ];
  for (const [cLow, cHigh, iLow, iHigh] of breakpoints) {
    if (pm25 >= cLow && pm25 <= cHigh) {
      return Math.round(((iHigh - iLow) / (cHigh - cLow)) * (pm25 - cLow) + iLow);
    }
  }
  return Math.min(500, Math.round(pm25 * 2));
}

router.get("/air-quality", async (req, res): Promise<void> => {
  const parsed = GetAirQualityQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon } = parsed.data;

  try {
    const url = new URL(`${AIR_QUALITY_BASE}/air-quality`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("current", [
      "pm10",
      "pm2_5",
      "carbon_monoxide",
      "nitrogen_dioxide",
      "ozone",
      "sulphur_dioxide",
      "dust",
      "uv_index",
    ].join(","));
    url.searchParams.set("hourly", [
      "pm2_5",
      "pm10",
      "ozone",
      "nitrogen_dioxide",
    ].join(","));
    url.searchParams.set("forecast_days", "1");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Air quality API error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const cur = data.current as Record<string, number | null>;
    const hourly = data.hourly as Record<string, unknown[]>;

    const pm25 = cur.pm2_5 ?? 0;
    const aqi = pm25ToAqi(Number(pm25));

    const hourlyArr = (hourly.time as string[]).slice(0, 24).map((time, i) => ({
      time,
      aqi: pm25ToAqi(Number((hourly.pm2_5 as number[])[i] ?? 0)),
      pm2_5: (hourly.pm2_5 as number[])[i] ?? 0,
      pm10: (hourly.pm10 as number[])[i] ?? 0,
      ozone: (hourly.ozone as number[])?.[i] ?? null,
      nitrogen_dioxide: (hourly.nitrogen_dioxide as number[])?.[i] ?? null,
    }));

    res.json({
      aqi,
      aqi_category: aqiCategory(aqi),
      pm2_5: cur.pm2_5 ?? 0,
      pm10: cur.pm10 ?? 0,
      carbon_monoxide: cur.carbon_monoxide ?? 0,
      nitrogen_dioxide: cur.nitrogen_dioxide ?? 0,
      ozone: cur.ozone ?? 0,
      sulphur_dioxide: cur.sulphur_dioxide ?? 0,
      dust: cur.dust ?? null,
      uv_index: cur.uv_index ?? 0,
      hourly: hourlyArr,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch air quality");
    res.status(500).json({ error: "Failed to fetch air quality data" });
  }
});

export default router;
