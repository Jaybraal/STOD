interface CacheItem<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheItem<any>>();

export function get<T>(key: string): T | null {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiry) {
    cache.delete(key);
    return null;
  }

  return item.data as T;
}

export function set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
  cache.set(key, {
    data,
    expiry: Date.now() + ttlMs
  });
}

export function invalidate(pattern: string): void {
  const keys = Array.from(cache.keys());
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  });
}

export function clear(): void {
  cache.clear();
}

export function getStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  };
}
