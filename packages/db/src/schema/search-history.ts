import { pgTable, serial, text, real, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const searchHistoryTable = pgTable("search_history", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  lat: real("lat").notNull(),
  lon: real("lon").notNull(),
  country: text("country").notNull(),
  countryCode: text("country_code"),
  admin1: text("admin1"),
  timezone: text("timezone"),
  searchedAt: timestamp("searched_at").defaultNow().notNull(),
});

export const insertSearchHistorySchema = createInsertSchema(searchHistoryTable).omit({ id: true, searchedAt: true });
export type InsertSearchHistory = z.infer<typeof insertSearchHistorySchema>;
export type SearchHistoryItem = typeof searchHistoryTable.$inferSelect;
