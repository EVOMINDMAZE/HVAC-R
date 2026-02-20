import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mock request and response
const mockRequest = () => {
  const req = {
    headers: {} as Record<string, string>,
    path: '/api/test',
  } as unknown as Request;
  return req;
};

const mockResponse = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

const mockNext = vi.fn() as NextFunction;

describe('authenticateSupabaseToken Security Check', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should REJECT requests in PRODUCTION when no secret is set', async () => {
    // Setup environment to simulate production with missing secrets
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    // Create a token signed with the KNOWN fallback secret
    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: 'attacker', email: 'hacker@example.com' }, fallbackSecret);

    const req = mockRequest();
    req.headers.authorization = `Bearer ${token}`;
    const res = mockResponse();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    // Expectation: It should fail (500) and NOT call next()
    // If the vulnerability exists, this test will fail because next() IS called.

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: "Internal server error" }));
    expect(next).not.toHaveBeenCalled();
  });

  it('should ALLOW requests in DEVELOPMENT with fallback secret (Backward Compatibility)', async () => {
    // Setup environment to simulate development
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
    delete process.env.SUPABASE_JWT_SECRET;

    const fallbackSecret = "fallback-secret-change-in-production";
    const token = jwt.sign({ sub: 'developer', email: 'dev@example.com' }, fallbackSecret);

    const req = mockRequest();
    req.headers.authorization = `Bearer ${token}`;
    const res = mockResponse();
    const next = mockNext;

    await authenticateSupabaseToken(req, res, next);

    // Should succeed
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled(); // No error response
  });
});
