import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

describe('authenticateSupabaseToken', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.resetModules();
    process.env.NODE_ENV = 'test';
  });

  afterEach(() => {
    vi.clearAllMocks();
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
  });

  it('should allow access with default secret in development', async () => {
    process.env.NODE_ENV = 'development';
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, 'fallback-secret-change-in-production');
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user123');
  });

  it('should deny access with default secret in production', async () => {
    process.env.NODE_ENV = 'production';
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, 'fallback-secret-change-in-production');
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      message: "Server misconfiguration"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should deny access if JWT_SECRET is missing in production', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    // In current implementation, it uses "fallback-secret-change-in-production" inside jwt.verify
    // We want to verify that we intercept this before jwt.verify
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, 'fallback-secret-change-in-production');
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      message: "Server misconfiguration"
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should allow access with valid secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'super-strong-production-secret-12345';

    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, process.env.JWT_SECRET);
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user123');
  });
});
