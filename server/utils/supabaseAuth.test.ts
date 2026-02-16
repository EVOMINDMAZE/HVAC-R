import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth';

// Mock request and response objects
const mockReq = (headers = {}) => ({
  headers,
  path: '/test',
  body: {},
} as any);

const mockRes = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn();

describe('authenticateSupabaseToken Security Fix Verification', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;
    // Default to 'development' for most tests
    process.env.NODE_ENV = 'development';
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should REJECT a token signed with the OLD vulnerable fallback secret when env vars are missing', async () => {
    const oldVulnerableSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: '123', email: 'test@example.com' }, oldVulnerableSecret);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid token signature" });
  });

  it('should accept a token signed with the NEW explicit default secret in DEVELOPMENT', async () => {
    const newDefaultSecret = "your_super_secret_jwt_key_change_in_production";
    const token = jwt.sign({ sub: '123', email: 'test@example.com' }, newDefaultSecret);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('123');
  });

  it('should FAIL securely (500) if JWT_SECRET is missing in PRODUCTION', async () => {
    process.env.NODE_ENV = 'production';

    // Generate any token, it shouldn't matter as it should fail before verification
    const token = jwt.sign({ sub: '123' }, 'any-secret');
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server configuration error" });
  });

  it('should FAIL securely (500) if JWT_SECRET is the default value in PRODUCTION', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = "your_super_secret_jwt_key_change_in_production";

    const token = jwt.sign({ sub: '123' }, process.env.JWT_SECRET);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Server configuration error" });
  });

  it('should verify correctly with a custom JWT_SECRET', async () => {
    process.env.JWT_SECRET = "my-custom-strong-secret";

    const token = jwt.sign({ sub: '456', email: 'user@example.com' }, process.env.JWT_SECRET);
    const req = mockReq({ authorization: `Bearer ${token}` });
    const res = mockRes();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user.id).toBe('456');
  });
});
