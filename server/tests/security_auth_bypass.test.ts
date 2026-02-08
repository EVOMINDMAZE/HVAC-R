import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import jwt from 'jsonwebtoken';
// We need to mock BEFORE import if we were using jest.doMock, but with vi.mock hoisted it's fine.
// But we need to define the mock function using vi.hoisted so it's available inside the factory.
const { mockGetUser } = vi.hoisted(() => {
  return { mockGetUser: vi.fn() };
});

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      getUser: mockGetUser
    }
  })
}));

import { authenticateSupabaseToken } from '../utils/supabaseAuth';
import { Request, Response, NextFunction } from 'express';


describe('authenticateSupabaseToken', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
    process.env.VITE_SUPABASE_ANON_KEY = 'valid-anon-key';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should reject a forged token when verification fails', async () => {
    // 1. Mock getUser to return error (simulation of verification failure)
    mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Invalid token' } });

    const forgedToken = jwt.sign({ sub: 'hacker-id' }, 'wrong-secret');
    const req = {
      headers: { authorization: `Bearer ${forgedToken}` },
      path: '/api/test',
    } as Partial<Request> as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as Partial<Response> as Response;
    const next = vi.fn() as NextFunction;

    await authenticateSupabaseToken(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
  });

  it('should accept a valid token when verification succeeds', async () => {
    // 2. Mock getUser to return success
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'valid-user',
          email: 'user@example.com',
          user_metadata: { role: 'user' }
        }
      },
      error: null
    });

    const validToken = jwt.sign({ sub: 'valid-user' }, 'correct-secret'); // Signature doesn't matter for the mock
    const req = {
      headers: { authorization: `Bearer ${validToken}` },
      path: '/api/test',
    } as Partial<Request> as Request;

    const res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as Partial<Response> as Response;
    const next = vi.fn() as NextFunction;

    await authenticateSupabaseToken(req, res, next);

    expect(next).toHaveBeenCalled();
    expect((req as any).user.id).toBe('valid-user');
  });
});
