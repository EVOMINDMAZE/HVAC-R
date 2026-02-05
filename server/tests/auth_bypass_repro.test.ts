import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authenticateSupabaseToken } from '../utils/supabaseAuth.ts';

// Define mocks
const mockGetUser = vi.fn();
const mockSupabaseClient = {
  auth: {
    getUser: mockGetUser
  }
};

// Mock the module
vi.mock('../utils/supabase.ts', () => ({
  getSupabaseClient: vi.fn()
}));

// Import the mocked function to verify calls or change implementation
import { getSupabaseClient } from '../utils/supabase.ts';

describe('Supabase Authentication Middleware', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      path: '/api/test',
      headers: {
        authorization: 'Bearer test-token'
      }
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    next = vi.fn();

    // Reset mocks
    mockGetUser.mockReset();
    (getSupabaseClient as any).mockReturnValue(mockSupabaseClient);
  });

  it('should call next() if token is valid', async () => {
    // Mock successful user retrieval
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          user_metadata: {
            subscription_plan: 'pro'
          }
        }
      },
      error: null
    });

    await authenticateSupabaseToken(req, res, next);

    expect(getSupabaseClient).toHaveBeenCalledWith('test-token');
    expect(mockGetUser).toHaveBeenCalled();
    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe('user-123');
    expect(req.user.subscription_plan).toBe('pro');
  });

  it('should return 401 if token is invalid (getUser fails)', async () => {
    // Mock error from Supabase
    mockGetUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid token' }
    });

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('should return 500 if supabase client cannot be created', async () => {
     (getSupabaseClient as any).mockReturnValueOnce(null);

     await authenticateSupabaseToken(req, res, next);

     expect(res.status).toHaveBeenCalledWith(500);
     expect(next).not.toHaveBeenCalled();
  });
});
