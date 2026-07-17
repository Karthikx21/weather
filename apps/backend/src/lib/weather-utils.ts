// WMO Weather Code descriptions
export function getWeatherDescription(code: number): string {
  const descriptions: Record<number, string> = {
    0: "Clear sky",
    1: "Mainly clear",
    2: "Partly cloudy",
    3: "Overcast",
    45: "Foggy",
    48: "Depositing rime fog",
    51: "Light drizzle",
    53: "Moderate drizzle",
    55: "Dense drizzle",
    56: "Light freezing drizzle",
    57: "Heavy freezing drizzle",
    61: "Slight rain",
    63: "Moderate rain",
    65: "Heavy rain",
    66: "Light freezing rain",
    67: "Heavy freezing rain",
    71: "Slight snow",
    73: "Moderate snow",
    75: "Heavy snow",
    77: "Snow grains",
    80: "Slight rain showers",
    81: "Moderate rain showers",
    82: "Violent rain showers",
    85: "Slight snow showers",
    86: "Heavy snow showers",
    95: "Thunderstorm",
    96: "Thunderstorm with slight hail",
    99: "Thunderstorm with heavy hail",
  };
  return descriptions[code] ?? "Unknown";
}

export interface WeatherAlertData {
  temperature_2m?: number;
  wind_speed_10m?: number;
  wind_gusts_10m?: number;
  precipitation?: number;
  weather_code?: number;
  visibility?: number;
}

export function getAlerts(cur: WeatherAlertData): Array<{
  id: string;
  type: string;
  severity: "low" | "medium" | "high" | "extreme";
  title: string;
  description: string;
  start_time: null;
  end_time: null;
}> {
  const alerts = [];

  const temp = cur.temperature_2m ?? 0;
  const windSpeed = cur.wind_speed_10m ?? 0;
  const windGusts = cur.wind_gusts_10m ?? 0;
  const precipitation = cur.precipitation ?? 0;
  const weatherCode = cur.weather_code ?? 0;
  const visibility = (cur.visibility ?? 10000) / 1000;

  // Heatwave
  if (temp >= 40) {
    alerts.push({
      id: "heatwave-extreme",
      type: "Heatwave",
      severity: "extreme" as const,
      title: "Extreme Heatwave Warning",
      description: `Temperature is ${temp.toFixed(1)}°C. Dangerous heat levels. Stay indoors and hydrate.`,
      start_time: null,
      end_time: null,
    });
  } else if (temp >= 35) {
    alerts.push({
      id: "heatwave-high",
      type: "Heatwave",
      severity: "high" as const,
      title: "Heatwave Alert",
      description: `Temperature is ${temp.toFixed(1)}°C. Limit outdoor activity during peak hours.`,
      start_time: null,
      end_time: null,
    });
  }

  // Extreme cold
  if (temp <= -20) {
    alerts.push({
      id: "extreme-cold",
      type: "Extreme Cold",
      severity: "extreme" as const,
      title: "Extreme Cold Warning",
      description: `Temperature is ${temp.toFixed(1)}°C. Risk of frostbite and hypothermia.`,
      start_time: null,
      end_time: null,
    });
  }

  // Strong wind
  if (windGusts >= 90 || windSpeed >= 62) {
    alerts.push({
      id: "storm-force-wind",
      type: "Strong Wind",
      severity: "extreme" as const,
      title: "Storm Force Wind Warning",
      description: `Wind gusts up to ${windGusts.toFixed(0)} km/h. Dangerous conditions. Stay indoors.`,
      start_time: null,
      end_time: null,
    });
  } else if (windGusts >= 60 || windSpeed >= 40) {
    alerts.push({
      id: "strong-wind",
      type: "Strong Wind",
      severity: "high" as const,
      title: "Strong Wind Warning",
      description: `Wind gusts up to ${windGusts.toFixed(0)} km/h. Secure loose objects outdoors.`,
      start_time: null,
      end_time: null,
    });
  }

  // Heavy rain
  if (precipitation >= 50) {
    alerts.push({
      id: "heavy-rain-extreme",
      type: "Heavy Rain",
      severity: "extreme" as const,
      title: "Extreme Heavy Rain Warning",
      description: `${precipitation.toFixed(1)}mm precipitation. Severe flood risk. Avoid low-lying areas.`,
      start_time: null,
      end_time: null,
    });
  } else if (precipitation >= 20) {
    alerts.push({
      id: "heavy-rain",
      type: "Heavy Rain",
      severity: "high" as const,
      title: "Heavy Rain Warning",
      description: `${precipitation.toFixed(1)}mm precipitation expected. Possible flooding.`,
      start_time: null,
      end_time: null,
    });
  }

  // Thunderstorm
  if (weatherCode >= 95) {
    alerts.push({
      id: "thunderstorm",
      type: "Thunderstorm",
      severity: weatherCode >= 99 ? "extreme" as const : "high" as const,
      title: weatherCode >= 99 ? "Severe Thunderstorm with Hail" : "Thunderstorm Warning",
      description: "Thunderstorm activity detected. Stay indoors and away from windows.",
      start_time: null,
      end_time: null,
    });
  }

  // Fog
  if (visibility < 1) {
    alerts.push({
      id: "dense-fog",
      type: "Fog",
      severity: "high" as const,
      title: "Dense Fog Warning",
      description: `Visibility is only ${(visibility * 1000).toFixed(0)}m. Dangerous driving conditions.`,
      start_time: null,
      end_time: null,
    });
  } else if (visibility < 5) {
    alerts.push({
      id: "fog",
      type: "Fog",
      severity: "medium" as const,
      title: "Fog Advisory",
      description: `Visibility reduced to ${visibility.toFixed(1)}km. Drive with caution.`,
      start_time: null,
      end_time: null,
    });
  }

  // Snow
  if (weatherCode >= 71 && weatherCode <= 77) {
    const severity = weatherCode >= 75 ? "high" as const : "medium" as const;
    alerts.push({
      id: "snowfall",
      type: "Snowfall",
      severity,
      title: severity === "high" ? "Heavy Snowfall Warning" : "Snowfall Advisory",
      description: "Snowfall detected. Roads may be icy. Drive slowly and cautiously.",
      start_time: null,
      end_time: null,
    });
  }

  return alerts;
}
