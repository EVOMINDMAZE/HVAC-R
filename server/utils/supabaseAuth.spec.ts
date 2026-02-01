import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import { Request, Response } from 'express';

// Mock dependencies
const mockGetUser = vi.fn();
const mockGetSupabaseClient = vi.fn();

vi.mock('./supabase.ts', () => ({
  getSupabaseClient: (token: string) => {
      mockGetSupabaseClient(token);
      return {
          auth: {
              getUser: mockGetUser
          }
      }
  }
}));

describe('authenticateSupabaseToken', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    req = {
      headers: {},
      path: '/test'
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();
  });

  it('should reject a forged token (fix verification)', async () => {
    // 1. Setup mock to return error (mimicking Supabase rejecting invalid signature/token)
    mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
    });

    req.headers = {
      authorization: `Bearer forged-token`
    };

    // 2. Call the middleware
    await authenticateSupabaseToken(req as Request, res as Response, next);

    // 3. Assertions
    expect(mockGetSupabaseClient).toHaveBeenCalledWith('forged-token');
    expect(mockGetUser).toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should accept a valid token', async () => {
    // 1. Setup mock to return success
    const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: {
            stripe_customer_id: 'cus_123'
        }
    };

    mockGetUser.mockResolvedValue({
        data: { user: mockUser },
        error: null
    });

    req.headers = {
      authorization: `Bearer valid-token`
    };

    // 2. Call the middleware
    await authenticateSupabaseToken(req as Request, res as Response, next);

    // 3. Assertions
    expect(mockGetSupabaseClient).toHaveBeenCalledWith('valid-token');
    expect(next).toHaveBeenCalled();
    expect((req as any).user).toBeDefined();
    expect((req as any).user.id).toBe('user-123');
    expect((req as any).user.stripe_customer_id).toBe('cus_123');
  });
});
