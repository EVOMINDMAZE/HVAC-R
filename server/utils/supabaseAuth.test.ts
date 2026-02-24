import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// Mock jsonwebtoken
vi.mock('jsonwebtoken', () => ({
  default: {
    verify: vi.fn(),
    sign: vi.fn(),
  },
}));

describe('authenticateSupabaseToken', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset environment variables
    process.env = { ...originalEnv };

    // Reset mocks
    vi.clearAllMocks();

    req = {
      headers: {
        authorization: 'Bearer valid.token.here',
      },
      path: '/api/some/protected/route',
    };

    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };

    next = vi.fn();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('in development environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'development';
    });

    it('should proceed with warning if JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.SUPABASE_JWT_SECRET;

      // Mock successful verification with fallback secret
      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user123', email: 'test@example.com' } as any);

      await authenticateSupabaseToken(req as Request, res as Response, next);

      // Should have called jwt.verify with the fallback secret
      expect(jwt.verify).toHaveBeenCalledWith(
        'valid.token.here',
        'fallback-secret-change-in-production'
      );

      // Should call next()
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should proceed if JWT_SECRET is the default one', async () => {
      process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';

      // Mock successful verification
      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user123', email: 'test@example.com' } as any);

      await authenticateSupabaseToken(req as Request, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        'valid.token.here',
        'your_super_secret_jwt_key_change_in_production'
      );
      expect(next).toHaveBeenCalled();
    });
  });

  describe('in production environment', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    it('should fail securely if JWT_SECRET is missing', async () => {
      delete process.env.JWT_SECRET;
      delete process.env.SUPABASE_JWT_SECRET;

      await authenticateSupabaseToken(req as Request, res as Response, next);

      // Should return 500
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal Server Error', // Or whatever specific error message we decide
      }));

      // Should NOT call next()
      expect(next).not.toHaveBeenCalled();

      // Should NOT attempt to verify token
      expect(jwt.verify).not.toHaveBeenCalled();
    });

    it('should fail securely if JWT_SECRET is default "your_super_secret..."', async () => {
      process.env.JWT_SECRET = 'your_super_secret_jwt_key_change_in_production';

      await authenticateSupabaseToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should fail securely if JWT_SECRET is default "fallback-secret..."', async () => {
      process.env.JWT_SECRET = 'fallback-secret-change-in-production';

      await authenticateSupabaseToken(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(next).not.toHaveBeenCalled();
    });

    it('should succeed if a strong JWT_SECRET is provided', async () => {
      process.env.JWT_SECRET = 'strong-production-secret-12345';

      vi.mocked(jwt.verify).mockReturnValue({ sub: 'user123', email: 'test@example.com' } as any);

      await authenticateSupabaseToken(req as Request, res as Response, next);

      expect(jwt.verify).toHaveBeenCalledWith(
        'valid.token.here',
        'strong-production-secret-12345'
      );
      expect(next).toHaveBeenCalled();
    });
  });
});
