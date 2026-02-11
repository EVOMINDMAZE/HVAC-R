import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { authenticateSupabaseToken } from './supabaseAuth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

describe('authenticateSupabaseToken', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;
    let next: NextFunction;

    const originalEnv = process.env;

    beforeEach(() => {
        mockReq = {
            headers: {},
            path: '/api/test'
        };
        mockRes = {
            status: vi.fn().mockReturnThis(),
            json: vi.fn()
        };
        next = vi.fn();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
        vi.restoreAllMocks();
    });

    it('PREVENTED: rejects token signed with fallback secret when env vars are missing', async () => {
        // Clear secrets
        delete process.env.JWT_SECRET;
        delete process.env.SUPABASE_JWT_SECRET;

        const fallbackSecret = "fallback-secret-change-in-production";
        const token = jwt.sign({ sub: 'user123', email: 'hacker@example.com' }, fallbackSecret);

        mockReq.headers = { authorization: `Bearer ${token}` };

        await authenticateSupabaseToken(mockReq as Request, mockRes as Response, next);

        // Should return 500 because configuration is missing
        expect(mockRes.status).toHaveBeenCalledWith(500);
        expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({
            error: "Server configuration error"
        }));
        expect(next).not.toHaveBeenCalled();
    });

    it('SUCCESS: accepts token signed with valid secret', async () => {
        process.env.JWT_SECRET = "valid-secret";
        const token = jwt.sign({
            sub: 'user123',
            email: 'user@example.com',
            user_metadata: { subscription_plan: 'pro' }
        }, "valid-secret");

        mockReq.headers = { authorization: `Bearer ${token}` };

        await authenticateSupabaseToken(mockReq as Request, mockRes as Response, next);

        expect(next).toHaveBeenCalled();
        expect((mockReq as any).user).toBeDefined();
        expect((mockReq as any).user.email).toBe('user@example.com');
        expect((mockReq as any).user.subscription_plan).toBe('pro');
    });
});
