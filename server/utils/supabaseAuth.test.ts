
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth';
import { Request, Response, NextFunction } from 'express';

describe('authenticateSupabaseToken Security Check', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/protected',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Partial<Response>;
    next = vi.fn();

    // Clear ENV vars by default
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('SUPABASE_JWT_SECRET', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('FAIL SECURE: rejects authentication when JWT_SECRET is missing', async () => {
    const token = jwt.sign({ sub: 'user-123' }, 'some-secret');
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
  });

  it('FAIL SECURE: rejects token signed with old fallback secret when correct secret is configured', async () => {
    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: 'user-123' }, fallbackSecret);
    req.headers = { authorization: `Bearer ${token}` };

    // Set a proper secret
    vi.stubEnv('JWT_SECRET', 'proper-secret-value');

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401); // Invalid signature because secrets don't match
  });

  it('SUCCESS: authenticates with valid token when JWT_SECRET is set', async () => {
    const secret = 'proper-secret-value';
    vi.stubEnv('JWT_SECRET', secret);

    const token = jwt.sign({
      sub: 'user-123',
      email: 'test@example.com',
      user_metadata: { role: 'user' }
    }, secret);

    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-123');
  });

  it('FAIL SECURE: fails in production if using default secret', async () => {
     vi.stubEnv('NODE_ENV', 'production');
     vi.stubEnv('JWT_SECRET', 'your_super_secret_jwt_key_change_in_production');

     const token = jwt.sign({ sub: 'user-123' }, 'your_super_secret_jwt_key_change_in_production');
     req.headers = { authorization: `Bearer ${token}` };

     await authenticateSupabaseToken(req as Request, res as Response, next);

     expect(next).not.toHaveBeenCalled();
     expect(res.status).toHaveBeenCalledWith(500);
     expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
  });
});
