import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const favoriteCitiesTable = pgTable("favorite_cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code"),
  admin1: text("admin1"),
  timezone: text("timezone"),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export const insertFavoriteCitySchema = createInsertSchema(favoriteCitiesTable).omit({ id: true, addedAt: true });
export type InsertFavoriteCity = z.infer<typeof insertFavoriteCitySchema>;
export type FavoriteCity = typeof favoriteCitiesTable.$inferSelect;
