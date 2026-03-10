import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth';

const OLD_FALLBACK_SECRET = "fallback-secret-change-in-production";
const NEW_DEFAULT_SECRET = "your_super_secret_jwt_key_change_in_production";
const CUSTOM_SECRET = "my-custom-secret-123";

describe('authenticateSupabaseToken', () => {
  let req: any;
  let res: any;
  let next: any;
  let originalJwtSecret: string | undefined;
  let originalSupabaseJwtSecret: string | undefined;
  let originalNodeEnv: string | undefined;

  beforeEach(() => {
    vi.resetModules();
    originalJwtSecret = process.env.JWT_SECRET;
    originalSupabaseJwtSecret = process.env.SUPABASE_JWT_SECRET;
    originalNodeEnv = process.env.NODE_ENV;

    // Clear secrets by default
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    process.env.NODE_ENV = 'development'; // Default to dev

    req = {
      headers: {},
      path: '/api/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    process.env.JWT_SECRET = originalJwtSecret;
    process.env.SUPABASE_JWT_SECRET = originalSupabaseJwtSecret;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('SECURITY FIX: should REJECT a token signed with the old hardcoded fallback secret when JWT_SECRET is missing', async () => {
    const token = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, OLD_FALLBACK_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Invalid token signature'
    }));
  });

  it('DEVELOPMENT: should accept a token signed with the NEW default secret when JWT_SECRET is missing', async () => {
    const token = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, NEW_DEFAULT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
  });

  it('PRODUCTION: should RETURN 500 ERROR if JWT_SECRET is missing', async () => {
    process.env.NODE_ENV = 'production';

    // Even with a valid token (signed by some secret), configuration is missing so it should fail
    const token = jwt.sign({ sub: 'user-123' }, 'some-secret');
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Internal server configuration error'
    }));
  });

  it('PRODUCTION: should RETURN 500 ERROR if JWT_SECRET is set to the default', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = NEW_DEFAULT_SECRET;

    const token = jwt.sign({ sub: 'user-123' }, NEW_DEFAULT_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: 'Internal server configuration error'
    }));
  });

  it('PRODUCTION: should accept a token signed with a CUSTOM secret', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = CUSTOM_SECRET;

    const token = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, CUSTOM_SECRET);
    req.headers.authorization = `Bearer ${token}`;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
  });
});
