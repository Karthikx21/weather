import { db, searchHistoryTable } from "@workspace/db";
import type { InsertSearchHistory, SearchHistoryItem } from "@workspace/db";

export class SearchHistoryRepository {
  static async getAll(limit = 20): Promise<SearchHistoryItem[]> {
    return db
      .select()
      .from(searchHistoryTable)
      .orderBy(searchHistoryTable.searchedAt)
      .limit(limit);
  }

  static async add(data: InsertSearchHistory): Promise<SearchHistoryItem> {
    const [row] = await db
      .insert(searchHistoryTable)
      .values(data)
      .returning();
    return row;
  }

  static async clear(): Promise<void> {
    await db.delete(searchHistoryTable);
  }
}
