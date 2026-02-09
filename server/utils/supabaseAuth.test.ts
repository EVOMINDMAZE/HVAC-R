import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth.ts';
import { getSupabaseClient } from './supabase.ts';
import jwt from 'jsonwebtoken';

vi.mock('./supabase.ts', () => ({
  getSupabaseClient: vi.fn(),
}));

describe('authenticateSupabaseToken', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    // Create a token signed with a dummy secret.
    // A real verification should reject this if the server doesn't have the same secret
    // (which in Supabase case, means verifying with Supabase auth server).
    const token = jwt.sign({ sub: 'user-123', email: 'test@example.com' }, 'dummy-secret');

    req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
      path: '/api/test',
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  it('should reject invalid tokens (verification failure)', async () => {
    // Mock getUser to fail (simulating verification failure by Supabase)
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' },
    });

    (getSupabaseClient as any).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    await authenticateSupabaseToken(req, res, next);

    // EXPECTATION: Should fail verification and return 401
    // The current vulnerable implementation will fail this test because it calls next()
    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('should accept valid tokens', async () => {
    // Mock getUser to succeed
    const mockGetUser = vi.fn().mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            subscription_plan: 'pro',
          },
        },
      },
      error: null,
    });

    (getSupabaseClient as any).mockReturnValue({
      auth: {
        getUser: mockGetUser,
      },
    });

    await authenticateSupabaseToken(req, res, next);

    // The fixed implementation should pass this.
    // The current implementation might also pass this (false positive) because it just decodes.
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
  });
});
