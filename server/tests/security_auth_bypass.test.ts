import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { authenticateSupabaseToken } from '../utils/supabaseAuth';
import { Request, Response, NextFunction } from 'express';

// Mock the Supabase client to simulate an invalid token check
vi.mock('../utils/supabase', () => ({
  getSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' }
      }),
    },
  })),
}));

describe('authenticateSupabaseToken', () => {
  it('should REJECT a forged token when signature verification is enabled', async () => {
    // 1. Create a forged token signed with a RANDOM key (not the real one)
    const forgedToken = jwt.sign(
      { sub: 'hacker-id', email: 'hacker@example.com', role: 'admin' },
      'wrong-secret'
    );

    const req = {
      headers: {
        authorization: `Bearer ${forgedToken}`,
      },
      path: '/api/test',
    } as Partial<Request> as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as Partial<Response> as Response;

    const next = vi.fn() as NextFunction;

    // 2. Call the middleware
    await authenticateSupabaseToken(req, res, next);

    // 3. Verify vulnerability IS FIXED:
    // It should NOT call next() -> SECURE
    // It should call res.status(401) -> SECURE

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Invalid token' }));
  });
});
