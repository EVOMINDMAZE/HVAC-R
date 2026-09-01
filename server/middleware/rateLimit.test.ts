import { describe, it, expect, vi } from 'vitest';
import { createSlidingWindowRateLimiter } from './rateLimit';
import { Request, Response, NextFunction } from 'express';

describe('createSlidingWindowRateLimiter', () => {
  it('should treat users independently (per-client rate limiting)', () => {
    // Create a limiter that allows 2 requests per minute
    const rateLimiter = createSlidingWindowRateLimiter(60000, 2);

    const req1 = { ip: '1.2.3.4', rateLimitKey: 'ip:1.2.3.4' } as unknown as Request;
    const res1 = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next1 = vi.fn();

    const req2 = { ip: '5.6.7.8', rateLimitKey: 'ip:5.6.7.8' } as unknown as Request;
    const res2 = {
      setHeader: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    } as unknown as Response;
    const next2 = vi.fn();

    // User 1 makes 2 requests (allowed)
    rateLimiter(req1, res1, next1);
    rateLimiter(req1, res1, next1);
    expect(next1).toHaveBeenCalledTimes(2);

    // User 2 makes 1 request (should be allowed)
    rateLimiter(req2, res2, next2);

    // In the vulnerable implementation, this fails because the count is global (3 > 2)
    // So next2 will NOT be called.
    // We expect this test to FAIL if the vulnerability exists.
    expect(next2).toHaveBeenCalledTimes(1);
  });
});
