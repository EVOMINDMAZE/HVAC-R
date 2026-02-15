
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth';
import { Request, Response, NextFunction } from 'express';

describe('authenticateSupabaseToken Security Check', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/protected',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();

    // Save original env
    originalEnv = process.env;
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should REJECT request with 500 when JWT secrets are missing', async () => {
    // Clear secrets
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    const fallbackSecret = "fallback-secret-change-in-production";
    const payload = { sub: 'user-123', email: 'attacker@example.com' };
    const token = jwt.sign(payload, fallbackSecret);
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Server configuration error"
    }));
  });

  it('should ACCEPT request with valid token signed by configured secret', async () => {
    const secret = "test-secret-123";
    process.env.JWT_SECRET = secret;

    const payload = { sub: 'user-valid', email: 'valid@example.com' };
    const token = jwt.sign(payload, secret);
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user.id).toBe('user-valid');
  });

  it('should REJECT request with token signed by WRONG secret', async () => {
    const serverSecret = "server-secret-KEY";
    process.env.JWT_SECRET = serverSecret;

    const attackerSecret = "attacker-secret-KEY";
    const payload = { sub: 'user-attacker', email: 'attacker@example.com' };
    const token = jwt.sign(payload, attackerSecret);
    req.headers = { authorization: `Bearer ${token}` };

    await authenticateSupabaseToken(req as Request, res as Response, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401); // Verification failed
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Invalid token signature"
    }));
  });
});
