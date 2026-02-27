import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth.js';
import jwt from 'jsonwebtoken';

// Mock request and response objects
const mockRequest = (headers: any = {}) => ({
  headers,
  path: '/api/test',
} as any);

const mockResponse = () => {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn();

describe('authenticateSupabaseToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it('should fail (500) if no JWT_SECRET is configured', async () => {
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    const req = mockRequest({ authorization: 'Bearer valid.token.here' });
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('CRITICAL: No JWT_SECRET'));
  });

  it('should fail (500) if using default weak secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';

    const req = mockRequest({ authorization: 'Bearer valid.token.here' });
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Server configuration error' });
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('CRITICAL: Insecure JWT secret'));
  });

  it('should allow default weak secret in development (with warning)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';

    // Create a valid signed token with the weak secret
    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, process.env.JWT_SECRET);
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(console.warn).toHaveBeenCalledWith(expect.stringContaining('WARNING: Using default JWT_SECRET'));
    expect(mockNext).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user123');
  });

  it('should succeed with a strong secret in production', async () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'strong-random-secret-key-12345';

    const token = jwt.sign({ sub: 'user123', email: 'test@example.com' }, process.env.JWT_SECRET);
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(res.status).not.toHaveBeenCalled();
    expect(mockNext).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
  });

  it('should fail (401) with invalid token signature', async () => {
    process.env.JWT_SECRET = 'secret-A';
    const wrongSecret = 'secret-B';

    const token = jwt.sign({ sub: 'user123' }, wrongSecret);
    const req = mockRequest({ authorization: `Bearer ${token}` });
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token signature' });
  });

    it('should fail (401) if no token provided', async () => {
    const req = mockRequest({});
    const res = mockResponse();

    await authenticateSupabaseToken(req, res, mockNext);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
  });
});
