type CacheEntry<T> = {
  data: T;
  expires: number;
};

const cache = new Map<string, CacheEntry<any>>();

export function setCache<T>(key: string, data: T, ttl = 60000) {
  cache.set(key, {
    data,
    expires: Date.now() + ttl,
  });
}

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }

  return entry.data as T;
}

export function clearCache() {
  cache.clear();
}
