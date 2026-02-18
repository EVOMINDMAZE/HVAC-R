import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth';

describe('authenticateSupabaseToken Security Check', () => {
  const FALLBACK_SECRET = "fallback-secret-change-in-production";

  beforeEach(() => {
    // Clear environment variables to simulate missing configuration
    vi.stubEnv('JWT_SECRET', '');
    vi.stubEnv('SUPABASE_JWT_SECRET', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('SECURE: refuses to authenticate with fallback secret in PRODUCTION', async () => {
    vi.stubEnv('NODE_ENV', 'production');

    // Create token signed with fallback secret
    const token = jwt.sign(
      { sub: 'user-attacker', email: 'attacker@example.com' },
      FALLBACK_SECRET
    );

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      path: '/api/sensitive'
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    // Call middleware
    await authenticateSupabaseToken(req, res, next);

    // Verification
    // Should NOT call next()
    expect(next).not.toHaveBeenCalled();
    // Should return 500 status
    expect(res.status).toHaveBeenCalledWith(500);
    // Should return error message
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Server configuration error'
    }));
  });

  it('DEV MODE: allows fallback secret in DEVELOPMENT with warning', async () => {
    vi.stubEnv('NODE_ENV', 'development');

    // Create token signed with fallback secret
    const token = jwt.sign(
      { sub: 'user-dev', email: 'dev@example.com' },
      FALLBACK_SECRET
    );

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
      path: '/api/dev-test'
    };

    const res: any = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };

    const next = vi.fn();

    // Call middleware
    await authenticateSupabaseToken(req, res, next);

    // Verification
    // Should call next() because we are in dev mode
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-dev');
  });
});
