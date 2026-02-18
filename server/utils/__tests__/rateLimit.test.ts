import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  checkRateLimit, 
  defaultRateLimits, 
  closeRedis,
  clearMemoryStore
} from '../rateLimit';

const mockStore = new Map<string, string>();

vi.mock('redis', () => ({
  createClient: vi.fn(() => ({
    on: vi.fn(),
    connect: vi.fn().mockResolvedValue(undefined),
    get: vi.fn((key: string) => Promise.resolve(mockStore.get(key) ?? null)),
    setEx: vi.fn((key: string, _ttl: number, value: string) => {
      mockStore.set(key, value);
      return Promise.resolve('OK');
    }),
    incr: vi.fn((key: string) => {
      const current = parseInt(mockStore.get(key) ?? '0', 10);
      const newValue = current + 1;
      mockStore.set(key, String(newValue));
      return Promise.resolve(newValue);
    }),
    ttl: vi.fn(() => Promise.resolve(60)),
    quit: vi.fn(),
    multi: vi.fn(),
  })),
}));

describe('rateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.REDIS_URL = 'redis://localhost:6379';
    clearMemoryStore();
    mockStore.clear();
  });

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', async () => {
      const result = await checkRateLimit(`test-user-allow-${Date.now()}`, {
        windowMs: 60000,
        maxRequests: 10,
        keyPrefix: 'test',
      });

      expect(result.allowed).toBe(true);
      expect(result.remaining).toBe(9);
    });

    it('should block requests over the limit', async () => {
      const uniqueId = `test-user-block-${Date.now()}`;
      const config = {
        windowMs: 60000,
        maxRequests: 2,
        keyPrefix: 'test',
      };

      await checkRateLimit(uniqueId, config);
      await checkRateLimit(uniqueId, config);
      const result = await checkRateLimit(uniqueId, config);

      expect(result.allowed).toBe(false);
      expect(result.remaining).toBe(0);
    });

    it('should return retryAfter when blocked', async () => {
      const uniqueId = `test-user-retry-${Date.now()}`;
      const config = {
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'test',
      };

      await checkRateLimit(uniqueId, config);
      const result = await checkRateLimit(uniqueId, config);

      expect(result.allowed).toBe(false);
      expect(result.retryAfter).toBeDefined();
    });

    it('should use different keys for different identifiers', async () => {
      const config = {
        windowMs: 60000,
        maxRequests: 1,
        keyPrefix: 'test',
      };

      const result1 = await checkRateLimit(`user-a-${Date.now()}`, config);
      const result2 = await checkRateLimit(`user-b-${Date.now()}`, config);

      expect(result1.allowed).toBe(true);
      expect(result2.allowed).toBe(true);
    });
  });

  describe('defaultRateLimits', () => {
    it('should have api rate limit config', () => {
      expect(defaultRateLimits.api).toBeDefined();
      expect(defaultRateLimits.api.windowMs).toBe(60000);
      expect(defaultRateLimits.api.maxRequests).toBe(100);
    });

    it('should have auth rate limit config', () => {
      expect(defaultRateLimits.auth).toBeDefined();
      expect(defaultRateLimits.auth.windowMs).toBe(900000);
      expect(defaultRateLimits.auth.maxRequests).toBe(5);
    });

    it('should have calculations rate limit config', () => {
      expect(defaultRateLimits.calculations).toBeDefined();
      expect(defaultRateLimits.calculations.windowMs).toBe(3600000);
    });
  });

  describe('closeRedis', () => {
    it('should close without error when no client exists', async () => {
      await expect(closeRedis()).resolves.not.toThrow();
    });
  });
});