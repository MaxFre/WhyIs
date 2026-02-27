/**
 * Simple in-process cache using Map with TTL.
 * For production, swap this for Redis or Vercel KV.
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key) as CacheEntry<T> | undefined;
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheSet<T>(key: string, value: T, ttlSeconds: number): void {
  store.set(key, {
    value,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

export function cacheDelete(key: string): void {
  store.delete(key);
}

export const TTL = {
  QUOTE: 60,           // 1 min — real-time feel
  CANDLES: 300,        // 5 min
  NEWS: 600,           // 10 min
  AI_SUMMARY: 900,     // 15 min — regenerate every 15 min
  MARKET_CONTEXT: 120, // 2 min
};
