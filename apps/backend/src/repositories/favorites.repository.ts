import { eq } from "drizzle-orm";
import { db, favoriteCitiesTable } from "@workspace/db";
import type { InsertFavoriteCity, FavoriteCity } from "@workspace/db";

export class FavoritesRepository {
  static async getAll(): Promise<FavoriteCity[]> {
    return db
      .select()
      .from(favoriteCitiesTable)
      .orderBy(favoriteCitiesTable.addedAt);
  }

  static async add(data: InsertFavoriteCity): Promise<FavoriteCity> {
    const [row] = await db
      .insert(favoriteCitiesTable)
      .values(data)
      .returning();
    return row;
  }

  static async delete(id: number): Promise<void> {
    await db.delete(favoriteCitiesTable).where(eq(favoriteCitiesTable.id, id));
  }
}
