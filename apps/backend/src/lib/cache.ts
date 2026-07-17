interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  promise?: Promise<T>;
}

class InMemoryCache {
  private store = new Map<string, CacheEntry<unknown>>();

  get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs: number): void {
    this.store.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  // Request deduplication: if a fetch is in-flight for this key, return the same promise
  async getOrFetch<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== null) return cached;

    const existing = this.store.get(key);
    if (existing?.promise) return existing.promise as Promise<T>;

    const promise = fetcher().then((data) => {
      this.set(key, data, ttlMs);
      return data;
    }).catch((err) => {
      this.store.delete(key);
      throw err;
    });

    this.store.set(key, { data: null as unknown as T, expiresAt: Date.now() + ttlMs, promise });
    return promise;
  }

  delete(key: string): void {
    this.store.delete(key);
  }
}

export const cache = new InMemoryCache();

// TTLs
export const TTL = {
  CURRENT_WEATHER: 5 * 60 * 1000,    // 5 min
  FORECAST: 10 * 60 * 1000,           // 10 min
  AIR_QUALITY: 10 * 60 * 1000,        // 10 min
  ALERTS: 60 * 1000,                  // 1 min
  GEOCODING: 60 * 60 * 1000,          // 1 hour
  HISTORICAL: 30 * 60 * 1000,         // 30 min
  COMPARISON: 5 * 60 * 1000,          // 5 min
  ML_TRAINING: 30 * 60 * 1000,        // 30 min
} as const;
