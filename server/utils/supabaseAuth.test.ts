
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import jwt from 'jsonwebtoken';

describe('authenticateSupabaseToken Security Check', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/api/test'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('should fail securely in production when JWT secrets are missing', async () => {
    // Simulate production environment
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('SUPABASE_JWT_SECRET', '');

    // Create a token signed with the fallback secret
    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, fallbackSecret);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    // EXPECTATION: Should FAIL (500 or 401 with specific error) because we are in production
    // CURRENT BEHAVIOR (Vulnerability): It proceeds because it uses the fallback secret

    // If next() is called, the vulnerability exists
    if (next.mock.calls.length > 0) {
      throw new Error("VULNERABILITY DETECTED: Middleware accepted fallback secret in production!");
    }

    // Ideally it should log an error and return 500
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: "Internal Server Error"
    }));
  });

  it('should allow fallback in development', async () => {
    // Simulate development environment
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('SUPABASE_JWT_SECRET', '');

    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, fallbackSecret);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});
