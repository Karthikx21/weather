import { Router, type IRouter } from "express";
import { SearchLocationsQueryParams, ReverseGeocodeQueryParams } from "@workspace/api-zod";

const router: IRouter = Router();

const GEOCODING_BASE = "https://geocoding-api.open-meteo.com/v1";
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

router.get("/geocoding/search", async (req, res): Promise<void> => {
  const parsed = SearchLocationsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { q, limit = 10 } = parsed.data;

  try {
    const url = new URL(`${GEOCODING_BASE}/search`);
    url.searchParams.set("name", q);
    url.searchParams.set("count", String(limit));
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
    const data = await response.json() as { results?: Record<string, unknown>[] };

    const results = (data.results ?? []).map((r) => ({
      id: r.id ?? null,
      name: r.name,
      lat: r.latitude,
      lon: r.longitude,
      country: r.country ?? "",
      country_code: r.country_code ?? null,
      admin1: r.admin1 ?? null,
      admin2: r.admin2 ?? null,
      timezone: r.timezone ?? null,
      elevation: r.elevation ?? null,
      population: r.population ?? null,
    }));

    res.json(results);
  } catch (err) {
    req.log.error({ err }, "Failed to geocode search");
    res.status(500).json({ error: "Failed to search locations" });
  }
});

router.get("/geocoding/reverse", async (req, res): Promise<void> => {
  const parsed = ReverseGeocodeQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { lat, lon } = parsed.data;

  try {
    const url = new URL(`${NOMINATIM_BASE}/reverse`);
    url.searchParams.set("lat", String(lat));
    url.searchParams.set("lon", String(lon));
    url.searchParams.set("format", "json");
    url.searchParams.set("accept-language", "en");

    const response = await fetch(url.toString(), {
      headers: { "User-Agent": "AERISYN Weather Platform/1.0" },
    });
    if (!response.ok) throw new Error(`Nominatim error: ${response.status}`);
    const data = await response.json() as Record<string, unknown>;

    const addr = data.address as Record<string, string> | undefined;
    const name =
      addr?.city ?? addr?.town ?? addr?.village ?? addr?.county ?? addr?.state ?? "Unknown";

    res.json({
      id: null,
      name,
      lat,
      lon,
      country: addr?.country ?? "",
      country_code: addr?.country_code?.toUpperCase() ?? null,
      admin1: addr?.state ?? null,
      admin2: addr?.county ?? null,
      timezone: null,
      elevation: null,
      population: null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to reverse geocode");
    res.status(500).json({ error: "Failed to reverse geocode location" });
  }
});

export default router;
