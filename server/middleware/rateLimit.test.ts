
import { describe, it, expect, vi } from 'vitest';
import { createRateLimiter } from './rateLimit';
import { Request, Response } from 'express';

describe('createRateLimiter', () => {
  it('should set correct X-RateLimit-Reset header on 429', () => {
    const windowMs = 60000; // 1 minute
    const limiter = createRateLimiter({
      windowMs,
      maxRequests: 1, // Fail on 2nd request
    });

    const req = {
      ip: '127.0.0.1',
      headers: {},
      connection: { remoteAddress: '127.0.0.1' },
    } as unknown as Request;

    const headerMap = new Map<string, string>();
    const res = {
      setHeader: vi.fn((key, value) => headerMap.set(key, String(value))),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
      on: vi.fn(),
    } as unknown as Response;

    const next = vi.fn();

    // 1st request - success
    limiter(req, res, next);
    expect(next).toHaveBeenCalled();

    // 2nd request - fail
    limiter(req, res, next);

    expect(res.status).toHaveBeenCalledWith(429);

    const resetHeader = headerMap.get('X-RateLimit-Reset');
    expect(resetHeader).toBeDefined();

    // The reset time should be in the future (approx windowMs from now)
    // Because of the bug, it likely defaults to Date.now() (in seconds? no code says Date.now())
    // Code: String(Math.ceil(defaultStore[req.rateLimitKey || '']?.resetTime / 1000) || Date.now())
    // Date.now() returns ms. standard unix timestamp is seconds.
    // If it returns Date.now(), it's a HUGE number (ms) instead of seconds.

    const resetTime = parseInt(resetHeader!, 10);
    const nowSeconds = Math.ceil(Date.now() / 1000);

    // If correct, resetTime should be roughly nowSeconds + 60
    // If buggy (falling back to Date.now()), it will be nowSeconds * 1000

    console.log('Reset Header:', resetHeader);
    console.log('Now Seconds:', nowSeconds);

    // Assert that it is a reasonable unix timestamp (seconds), not milliseconds
    expect(resetTime).toBeLessThan(nowSeconds + 120);
    expect(resetTime).toBeGreaterThan(nowSeconds);
  });
});
