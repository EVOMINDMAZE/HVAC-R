import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from './supabaseAuth.ts';

// Use vi.hoisted for any variables needed inside vi.mock factory
const { mockRequest, mockResponse, mockNext } = vi.hoisted(() => {
  return {
    mockRequest: {
      headers: {},
      path: '/test'
    },
    mockResponse: {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    },
    mockNext: vi.fn()
  };
});

describe('authenticateSupabaseToken Security Check', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    mockResponse.status.mockClear();
    mockResponse.json.mockClear();
    mockNext.mockClear();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('DEV MODE: Allows fallback secret when env vars are missing', async () => {
    // Simulate development environment
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    // Create a token signed with the hardcoded fallback
    const fallbackSecret = "fallback-secret-change-in-production";
    const payload = { sub: 'user-123', email: 'dev@example.com' };
    const token = jwt.sign(payload, fallbackSecret);

    const req = { ...mockRequest, headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse;
    const next = mockNext;

    // Call middleware
    await authenticateSupabaseToken(req as any, res as any, next);

    // Should proceed with warning
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-123');
  });

  it('PRODUCTION MODE: Rejects fallback secret with 500 error', async () => {
    // Simulate production environment
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    // Create a token signed with the hardcoded fallback
    const fallbackSecret = "fallback-secret-change-in-production";
    const payload = { sub: 'attacker-123', email: 'attacker@example.com' };
    const token = jwt.sign(payload, fallbackSecret);

    const req = { ...mockRequest, headers: { authorization: `Bearer ${token}` } };
    const res = mockResponse;
    const next = mockNext;

    // Call middleware
    await authenticateSupabaseToken(req as any, res as any, next);

    // Should return 500 error
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      error: expect.stringContaining('Server configuration error')
    }));
  });
});
