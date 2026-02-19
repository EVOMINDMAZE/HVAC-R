
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from '../supabaseAuth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

vi.mock('jsonwebtoken');

describe('authenticateSupabaseToken', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    // Mock user structure for request
    req = {
      headers: { authorization: 'Bearer valid.token.here' },
      path: '/api/protected'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.mocked(jwt.verify).mockReset();
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.clearAllMocks();
  });

  it('should FAIL SECURELY in production when JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    await authenticateSupabaseToken(req as Request, res as Response, next);

    // Should NOT use fallback secret
    expect(jwt.verify).not.toHaveBeenCalledWith(
      expect.any(String),
      'fallback-secret-change-in-production'
    );

    // Should return 500 Internal Server Error
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Server configuration error'
    }));
  });

  it('should use fallback secret in development when JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    // Mock verify to return valid decoded token
    vi.mocked(jwt.verify).mockReturnValue({ sub: 'user-123', email: 'test@example.com' } as any);

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      'valid.token.here',
      'fallback-secret-change-in-production'
    );
    expect(next).toHaveBeenCalled();
  });
});
