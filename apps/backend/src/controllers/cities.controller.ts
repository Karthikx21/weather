import type { Request, Response } from "express";
import { FavoritesRepository } from "../repositories/favorites.repository";
import { SearchHistoryRepository } from "../repositories/search-history.repository";
import {
  AddFavoriteCityBody,
  RemoveFavoriteCityParams,
  AddSearchHistoryBody,
} from "@workspace/api-zod";

export class CitiesController {
  static async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      const favorites = await FavoritesRepository.getAll();
      res.json(
        favorites.map((f) => ({
          id: f.id,
          name: f.name,
          lat: f.lat,
          lon: f.lon,
          country: f.country,
          country_code: f.countryCode,
          admin1: f.admin1,
          timezone: f.timezone,
          added_at: f.addedAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to get favorites");
      res.status(500).json({ error: "Failed to get favorites" });
    }
  }

  static async addFavorite(req: Request, res: Response): Promise<void> {
    const parsed = AddFavoriteCityBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const row = await FavoritesRepository.add({
        name: parsed.data.name,
        lat: parsed.data.lat,
        lon: parsed.data.lon,
        country: parsed.data.country,
        countryCode: parsed.data.country_code ?? null,
        admin1: parsed.data.admin1 ?? null,
        timezone: parsed.data.timezone ?? null,
      });

      res.status(201).json({
        id: row.id,
        name: row.name,
        lat: row.lat,
        lon: row.lon,
        country: row.country,
        country_code: row.countryCode,
        admin1: row.admin1,
        timezone: row.timezone,
        added_at: row.addedAt.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to add favorite");
      res.status(500).json({ error: "Failed to add favorite city" });
    }
  }

  static async removeFavorite(req: Request, res: Response): Promise<void> {
    const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const params = RemoveFavoriteCityParams.safeParse({ id: Number(rawId) });
    if (!params.success) {
      res.status(400).json({ error: params.error.message });
      return;
    }

    try {
      await FavoritesRepository.delete(params.data.id);
      res.sendStatus(204);
    } catch (err) {
      req.log.error({ err }, "Failed to remove favorite");
      res.status(500).json({ error: "Failed to remove favorite city" });
    }
  }

  static async getSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      const history = await SearchHistoryRepository.getAll(20);
      res.json(
        history.map((h) => ({
          id: h.id,
          name: h.name,
          lat: h.lat,
          lon: h.lon,
          country: h.country,
          country_code: h.countryCode,
          admin1: h.admin1,
          timezone: h.timezone,
          searched_at: h.searchedAt.toISOString(),
        })),
      );
    } catch (err) {
      req.log.error({ err }, "Failed to get search history");
      res.status(500).json({ error: "Failed to get search history" });
    }
  }

  static async addSearchHistory(req: Request, res: Response): Promise<void> {
    const parsed = AddSearchHistoryBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }

    try {
      const row = await SearchHistoryRepository.add({
        name: parsed.data.name,
        lat: parsed.data.lat,
        lon: parsed.data.lon,
        country: parsed.data.country,
        countryCode: parsed.data.country_code ?? null,
        admin1: parsed.data.admin1 ?? null,
        timezone: parsed.data.timezone ?? null,
      });

      res.status(201).json({
        id: row.id,
        name: row.name,
        lat: row.lat,
        lon: row.lon,
        country: row.country,
        country_code: row.countryCode,
        admin1: row.admin1,
        timezone: row.timezone,
        searched_at: row.searchedAt.toISOString(),
      });
    } catch (err) {
      req.log.error({ err }, "Failed to add search history");
      res.status(500).json({ error: "Failed to add to search history" });
    }
  }

  static async clearSearchHistory(req: Request, res: Response): Promise<void> {
    try {
      await SearchHistoryRepository.clear();
      res.sendStatus(204);
    } catch (err) {
      req.log.error({ err }, "Failed to clear search history");
      res.status(500).json({ error: "Failed to clear search history" });
    }
  }
}
