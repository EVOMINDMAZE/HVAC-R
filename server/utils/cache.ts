import { getRedisClient, closeRedis } from './rateLimit.js';

export interface CacheOptions {
  ttlSeconds: number;
  keyPrefix?: string;
}

export interface CacheEntry<T> {
  data: T;
  cachedAt: number;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry<unknown>>();

function cleanupMemoryCache(): void {
  const now = Date.now();
  for (const [key, value] of memoryCache.entries()) {
    if (value.expiresAt < now) {
      memoryCache.delete(key);
    }
  }
}

setInterval(cleanupMemoryCache, 60000);

export async function getCached<T>(key: string): Promise<T | null> {
  const client = await getRedisClient();
  const fullKey = key;

  if (client) {
    try {
      const cached = await client.get(fullKey);
      if (cached) {
        const parsed = JSON.parse(cached) as CacheEntry<T>;
        return parsed.data;
      }
      return null;
    } catch (error) {
      console.error('Redis cache get error:', error);
    }
  }

  const memoryEntry = memoryCache.get(fullKey) as CacheEntry<T> | undefined;
  if (memoryEntry && memoryEntry.expiresAt > Date.now()) {
    return memoryEntry.data;
  }

  memoryCache.delete(fullKey);
  return null;
}

export async function setCached<T>(
  key: string,
  data: T,
  ttlSeconds: number
): Promise<void> {
  const client = await getRedisClient();
  const fullKey = key;
  const now = Date.now();
  const entry: CacheEntry<T> = {
    data,
    cachedAt: now,
    expiresAt: now + ttlSeconds * 1000,
  };

  if (client) {
    try {
      await client.setEx(fullKey, ttlSeconds, JSON.stringify(entry));
      return;
    } catch (error) {
      console.error('Redis cache set error:', error);
    }
  }

  memoryCache.set(fullKey, entry as CacheEntry<unknown>);
}

export async function deleteCached(key: string): Promise<void> {
  const client = await getRedisClient();
  const fullKey = key;

  if (client) {
    try {
      await client.del(fullKey);
    } catch (error) {
      console.error('Redis cache delete error:', error);
    }
  }

  memoryCache.delete(fullKey);
}

export async function deleteCachedPattern(pattern: string): Promise<void> {
  const client = await getRedisClient();

  if (client) {
    try {
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Redis cache pattern delete error:', error);
    }
  }

  for (const key of memoryCache.keys()) {
    if (key.includes(pattern.replace('*', ''))) {
      memoryCache.delete(key);
    }
  }
}

export async function getOrSetCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  const cached = await getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const data = await fetcher();
  await setCached(key, data, ttlSeconds);
  return data;
}

export function createCacheKey(parts: (string | number | undefined | null)[]): string {
  return parts
    .filter((p) => p !== undefined && p !== null)
    .map((p) => String(p))
    .join(':');
}

export const cacheKeys = {
  userCompanies: (userId: string) => `user:${userId}:companies`,
  companySettings: (companyId: string) => `company:${companyId}:settings`,
  subscription: (userId: string) => `subscription:${userId}`,
  calculations: (userId: string, page: number) => `calculations:${userId}:${page}`,
  triage: (companyId: string) => `triage:${companyId}`,
  jobs: (companyId: string, status: string) => `jobs:${companyId}:${status}`,
  clients: (companyId: string) => `clients:${companyId}`,
};

export const cacheTTL = {
  short: 60,
  medium: 300,
  long: 3600,
  day: 86400,
};

export { closeRedis };