import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getCached, 
  setCached, 
  deleteCached, 
  getOrSetCached,
  createCacheKey,
  cacheKeys,
  cacheTTL 
} from '../cache';

vi.mock('../rateLimit', () => ({
  getRedisClient: vi.fn(() => null),
  closeRedis: vi.fn(),
}));

describe('cache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCached and setCached', () => {
    it('should store and retrieve cached data', async () => {
      const testData = { id: '123', name: 'Test' };
      
      await setCached('test-key', testData, 60);
      const result = await getCached<typeof testData>('test-key');
      
      expect(result).toEqual(testData);
    });

    it('should return null for non-existent keys', async () => {
      const result = await getCached('non-existent-key');
      expect(result).toBeNull();
    });

    it('should handle different data types', async () => {
      await setCached('string-key', 'test string', 60);
      await setCached('number-key', 42, 60);
      await setCached('array-key', [1, 2, 3], 60);
      
      expect(await getCached<string>('string-key')).toBe('test string');
      expect(await getCached<number>('number-key')).toBe(42);
      expect(await getCached<number[]>('array-key')).toEqual([1, 2, 3]);
    });
  });

  describe('deleteCached', () => {
    it('should delete cached data', async () => {
      await setCached('delete-test', 'data', 60);
      
      await deleteCached('delete-test');
      
      const result = await getCached('delete-test');
      expect(result).toBeNull();
    });
  });

  describe('getOrSetCached', () => {
    it('should return cached data if exists', async () => {
      await setCached('or-set-key', 'cached', 60);
      
      const fetcher = vi.fn().mockResolvedValue('fresh');
      const result = await getOrSetCached('or-set-key', fetcher, 60);
      
      expect(result).toBe('cached');
      expect(fetcher).not.toHaveBeenCalled();
    });

    it('should fetch and cache if not exists', async () => {
      const fetcher = vi.fn().mockResolvedValue('fresh data');
      const result = await getOrSetCached('new-key', fetcher, 60);
      
      expect(result).toBe('fresh data');
      expect(fetcher).toHaveBeenCalledTimes(1);
      
      const cached = await getCached<string>('new-key');
      expect(cached).toBe('fresh data');
    });
  });

  describe('createCacheKey', () => {
    it('should create key from parts', () => {
      const key = createCacheKey(['user', '123', 'settings']);
      expect(key).toBe('user:123:settings');
    });

    it('should filter out undefined and null values', () => {
      const key = createCacheKey(['user', undefined, '123', null, 'profile']);
      expect(key).toBe('user:123:profile');
    });

    it('should handle numbers', () => {
      const key = createCacheKey(['page', 1, 'limit', 10]);
      expect(key).toBe('page:1:limit:10');
    });
  });

  describe('cacheKeys', () => {
    it('should generate user companies key', () => {
      const key = cacheKeys.userCompanies('user-123');
      expect(key).toBe('user:user-123:companies');
    });

    it('should generate company settings key', () => {
      const key = cacheKeys.companySettings('company-456');
      expect(key).toBe('company:company-456:settings');
    });

    it('should generate subscription key', () => {
      const key = cacheKeys.subscription('user-789');
      expect(key).toBe('subscription:user-789');
    });

    it('should generate calculations key with page', () => {
      const key = cacheKeys.calculations('user-123', 2);
      expect(key).toBe('calculations:user-123:2');
    });
  });

  describe('cacheTTL', () => {
    it('should have predefined TTL values', () => {
      expect(cacheTTL.short).toBe(60);
      expect(cacheTTL.medium).toBe(300);
      expect(cacheTTL.long).toBe(3600);
      expect(cacheTTL.day).toBe(86400);
    });
  });
});