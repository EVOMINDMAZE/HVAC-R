import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth.ts';
import jwt from 'jsonwebtoken';

// Mock getSupabaseClient
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser,
  },
};

vi.mock('./supabase.ts', () => ({
  getSupabaseClient: vi.fn(() => mockSupabaseClient),
}));

describe('authenticateSupabaseToken', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      headers: {},
      path: '/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    mockGetUser.mockReset();
  });

  it('should verify token with Supabase and attach user to request', async () => {
    // Setup
    const token = 'valid-token';
    req.headers.authorization = `Bearer ${token}`;

    const mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      user_metadata: {
        stripe_customer_id: 'cus_123',
        subscription_plan: 'pro',
      },
    };

    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    // Execute
    await authenticateSupabaseToken(req, res, next);

    // Verify
    // The current implementation uses jwt.decode, so this test might fail if we don't mock jwt.decode
    // or provide a token that jwt.decode can handle.
    // However, we are writing this test for the FIXED implementation.
    // So we expect getSupabaseClient to be called.

    // For now, let's just check the outcome we want:
    // If we fix the code, this should pass.
    // If the code is NOT fixed, this might pass (if jwt.decode works) OR fail (if jwt.decode fails on 'valid-token').
    // 'valid-token' is not a valid JWT, so jwt.decode might return null.
    // If jwt.decode returns null, the current code returns 401.
    // So with 'valid-token', current code returns 401 (fail). New code returns success (pass).
    // So this test failing confirms we are not using the new logic yet?
    // Actually, if we use a real JWT, jwt.decode works.

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
    expect(req.user.email).toBe('test@example.com');
  });

  it('should reject invalid tokens (where Supabase getUser fails)', async () => {
    // Setup
    // We create a token that looks valid to jwt.decode (so current implementation accepts it)
    // but fails Supabase verification (so fixed implementation rejects it).
    const token = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, 'fake-secret');
    req.headers.authorization = `Bearer ${token}`;

    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    // Execute
    await authenticateSupabaseToken(req, res, next);

    // Verify
    // Current implementation: jwt.decode works -> calls next() -> FAIL assertion
    // Fixed implementation: getUser fails -> returns 401 -> PASS assertion
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
