import type { Request, Response } from "express";
import { QueryAssistantBody } from "@workspace/api-zod";
import { generateAssistantResponse, type WeatherContext } from "../services/assistant-engine.js";
import { fetchJson } from "../lib/request-manager.js";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1";
const AIR_QUALITY_BASE = "https://air-quality-api.open-meteo.com/v1";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

interface WeatherFetchResult {
  ctx: WeatherContext;
  contextString: string;
}

const WMO_CODES: Record<number, string> = {
  0: "Clear sky", 1: "Mainly clear", 2: "Partly cloudy", 3: "Overcast",
  45: "Foggy", 48: "Rime fog", 51: "Light drizzle", 53: "Moderate drizzle",
  55: "Dense drizzle", 61: "Slight rain", 63: "Moderate rain", 65: "Heavy rain",
  66: "Light freezing rain", 67: "Heavy freezing rain",
  71: "Slight snow", 73: "Moderate snow", 75: "Heavy snow", 77: "Snow grains",
  80: "Slight rain showers", 81: "Moderate rain showers", 82: "Violent rain showers",
  85: "Slight snow showers", 86: "Heavy snow showers",
  95: "Thunderstorm", 96: "Thunderstorm with slight hail", 99: "Thunderstorm with heavy hail",
};

async function fetchWeatherContext(lat: number, lon: number): Promise<WeatherFetchResult> {
  const [weather, aq] = await Promise.all([
    fetchJson<Record<string, unknown>>(
      `${OPEN_METEO_BASE}/forecast?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,apparent_temperature,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,wind_direction_10m,cloud_cover,uv_index,is_day,visibility` +
      `&daily=precipitation_probability_max,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,wind_speed_10m_max` +
      `&hourly=precipitation_probability&forecast_days=2&timezone=auto`,
      { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500, dedupeKey: `assistant-weather:${lat.toFixed(4)}:${lon.toFixed(4)}` },
    ),
    fetchJson<Record<string, unknown>>(
      `${AIR_QUALITY_BASE}/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,pm10,nitrogen_dioxide,ozone,european_aqi&timezone=auto`,
      { timeoutMs: 8000, retryCount: 2, retryDelayMs: 500, dedupeKey: `assistant-aq:${lat.toFixed(4)}:${lon.toFixed(4)}` },
    ),
  ]);

  const cur = weather.current as Record<string, number>;
  const daily = weather.daily as Record<string, (number | string)[]>;
  const hourly = weather.hourly as Record<string, number[]>;
  const aqCur = aq.current as Record<string, number> | undefined;

  const rainProb = (daily.precipitation_probability_max?.[0] as number) ?? 0;
  const tomorrowRainProb = (daily.precipitation_probability_max?.[1] as number) ?? 0;
  const tempMax = (daily.temperature_2m_max?.[0] as number) ?? cur.temperature_2m;
  const tempMin = (daily.temperature_2m_min?.[0] as number) ?? cur.temperature_2m;
  const uvMax = (daily.uv_index_max?.[0] as number) ?? cur.uv_index;
  const windMax = (daily.wind_speed_10m_max?.[0] as number) ?? cur.wind_speed_10m;
  const sunrise = daily.sunrise?.[0] as string ?? "";
  const sunset = daily.sunset?.[0] as string ?? "";

  const hourlyRainProbs = (hourly.precipitation_probability ?? []).slice(0, 12);
  const peakRainProb = Math.max(...hourlyRainProbs, 0);

  const ctx: WeatherContext = {
    temperature: cur.temperature_2m,
    feels_like: cur.apparent_temperature,
    humidity: cur.relative_humidity_2m,
    wind_speed: cur.wind_speed_10m,
    precipitation: cur.precipitation,
    weather_code: cur.weather_code,
    cloud_cover: cur.cloud_cover,
    uv_index: cur.uv_index,
    is_day: cur.is_day,
    rain_probability: rainProb,
    temp_max: tempMax,
    temp_min: tempMin,
    aqi: aqCur?.european_aqi ?? 0,
  };

  const windDir = cur.wind_direction_10m;
  const dirs = ["N","NE","E","SE","S","SW","W","NW"];
  const windDirLabel = dirs[Math.round(windDir / 45) % 8];

  const contextString = `LIVE WEATHER DATA for this location right now:
• Temperature: ${cur.temperature_2m}°C (feels like ${cur.apparent_temperature}°C)
• Conditions: ${WMO_CODES[cur.weather_code] ?? "Mixed"} (cloud cover: ${cur.cloud_cover}%)
• Humidity: ${cur.relative_humidity_2m}%
• Wind: ${cur.wind_speed_10m} km/h ${windDirLabel} (gusts up to ${windMax} km/h today)
• Precipitation (now): ${cur.precipitation}mm
• Rain probability: ${rainProb}% today | ${tomorrowRainProb}% tomorrow | Peak next 12h: ${peakRainProb}%
• UV Index: ${cur.uv_index} (max today: ${uvMax})
• Visibility: ${(cur.visibility / 1000).toFixed(1)} km
• Today's temp range: ${tempMin}°C low → ${tempMax}°C high
• Sunrise: ${sunrise.split("T")[1] ?? "N/A"} | Sunset: ${sunset.split("T")[1] ?? "N/A"}
• Air Quality: AQI ${aqCur?.european_aqi ?? "N/A"} | PM2.5: ${aqCur?.pm2_5 ?? "N/A"} µg/m³ | PM10: ${aqCur?.pm10 ?? "N/A"} µg/m³ | NO₂: ${aqCur?.nitrogen_dioxide ?? "N/A"} µg/m³`;

  return { ctx, contextString };
}

async function queryGemini(systemPrompt: string, userMessage: string, apiKey: string): Promise<string> {
  const res = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system_instruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: "user", parts: [{ text: userMessage }] }],
      generationConfig: { maxOutputTokens: 600, temperature: 0.7 },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const json = await res.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  if (!text) throw new Error("Empty Gemini response");
  return text;
}

export class AssistantController {
  static async queryAssistant(req: Request, res: Response): Promise<void> {
    const parsed = QueryAssistantBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    const { question, lat, lon, city_name } = parsed.data;
    const cityName = city_name ?? `${lat.toFixed(2)}, ${lon.toFixed(2)}`;

    try {
      const { ctx, contextString } = await fetchWeatherContext(lat, lon);

      const geminiKey = process.env.GEMINI_API_KEY;
      if (geminiKey) {
        try {
          const systemPrompt = `You are AERISYN, an expert AI weather assistant embedded in a professional weather intelligence platform. You have access to real-time live weather data for ${cityName}.

Your role: Give concise, accurate, practical weather advice based ONLY on the live data provided. Be conversational and direct — like a knowledgeable friend, not a data readout. 

Rules:
- Answer the specific question asked. Don't dump all weather data.
- Give a clear YES/NO/RECOMMENDED verdict when appropriate, then explain why using the actual numbers.
- Keep responses under 150 words.
- End with 2-3 specific actionable bullet points (use • symbol).
- Adapt tone to urgency: calm for normal days, cautious for bad weather, alert for dangerous conditions.
- Never say "I don't have access to" — you always have the live data shown.`;

          const userMessage = `${contextString}\n\nUser question: ${question}`;
          const answer = await queryGemini(systemPrompt, userMessage, geminiKey);

          const lines = answer.split("\n");
          const recommendations: string[] = [];
          const bodyLines: string[] = [];
          for (const line of lines) {
            const cleaned = line.trim();
            if (cleaned.startsWith("•") || cleaned.startsWith("-") || cleaned.startsWith("*")) {
              recommendations.push(cleaned.replace(/^[•\-*]\s*/, ""));
            } else if (cleaned) {
              bodyLines.push(cleaned);
            }
          }

          const answerText = recommendations.length > 0 ? bodyLines.join(" ") : answer;
          const finalRecs = recommendations.length > 0 ? recommendations : [];

          res.json({
            answer: answerText || answer,
            confidence: "High",
            weather_context: contextString,
            recommendations: finalRecs,
            powered_by: "gemini",
          });
          return;
        } catch (geminiErr: unknown) {
          const msg = geminiErr instanceof Error ? geminiErr.message : String(geminiErr);
          req.log.warn({ err: geminiErr }, `Gemini failed (${msg.slice(0, 80)}), using smart fallback`);
        }
      }

      const { answer, confidence, recommendations } = generateAssistantResponse(question, ctx, cityName);
      res.json({ answer, confidence, weather_context: contextString, recommendations, powered_by: "aerisyn-engine" });

    } catch (err) {
      req.log.error({ err }, "Failed to query assistant");
      res.status(500).json({ error: "Failed to fetch weather data for your location." });
    }
  }
}
