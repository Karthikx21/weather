export interface TrainingData {
  dates: string[];
  tempMax: number[];
  tempMin: number[];
  precipitation: number[];
  windSpeed: number[];
  humidity: number[];
  pressure: number[];
}

export class WeatherService {
  private static OPEN_METEO_ARCHIVE = "https://archive-api.open-meteo.com/v1";

  static async fetchHistoricalForML(lat: number, lon: number, days = 90): Promise<TrainingData> {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() - 1);
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const fmt = (d: Date) => d.toISOString().split("T")[0];

    const url = new URL(`${this.OPEN_METEO_ARCHIVE}/archive`);
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));
    url.searchParams.set("start_date", fmt(startDate));
    url.searchParams.set("end_date", fmt(endDate));
    url.searchParams.set("daily", [
      "temperature_2m_max",
      "temperature_2m_min",
      "precipitation_sum",
      "wind_speed_10m_max",
    ].join(","));
    url.searchParams.set("hourly", "relative_humidity_2m,surface_pressure");
    url.searchParams.set("timezone", "auto");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Archive API error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const daily = data.daily as Record<string, unknown[]>;
    const hourly = data.hourly as Record<string, unknown[]>;

    const hourlyHumidity = hourly.relative_humidity_2m as number[];
    const hourlyPressure = hourly.surface_pressure as number[];
    const dailyCount = (daily.time as string[]).length;
    const hoursPerDay = Math.floor(hourlyHumidity.length / dailyCount);

    const humidity: number[] = [];
    const pressure: number[] = [];
    for (let d = 0; d < dailyCount; d++) {
      const slice = hourlyHumidity.slice(d * hoursPerDay, (d + 1) * hoursPerDay).filter((v) => v != null);
      humidity.push(slice.length > 0 ? slice.reduce((a, b) => a + b, 0) / slice.length : 60);
      const pSlice = hourlyPressure.slice(d * hoursPerDay, (d + 1) * hoursPerDay).filter((v) => v != null);
      pressure.push(pSlice.length > 0 ? pSlice.reduce((a, b) => a + b, 0) / pSlice.length : 1013);
    }

    return {
      dates: daily.time as string[],
      tempMax: daily.temperature_2m_max as number[],
      tempMin: daily.temperature_2m_min as number[],
      precipitation: daily.precipitation_sum as number[],
      windSpeed: daily.wind_speed_10m_max as number[],
      humidity,
      pressure,
    };
  }
}
