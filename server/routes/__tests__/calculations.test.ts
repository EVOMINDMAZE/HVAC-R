import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveCalculation, getCalculations, deleteCalculation } from '../calculations.js';
import { getSupabaseClient } from '../../utils/supabase.js';

vi.mock('../../utils/supabase.js', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
  getSupabaseClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
          limit: vi.fn(),
          order: vi.fn(),
          range: vi.fn(),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(),
      })),
    })),
  })),
}));

vi.mock('../../utils/supabaseAuth.js', () => ({
  authenticateSupabaseToken: vi.fn((req, _res, next) => {
    (req as any).user = { id: 'test-user-id', subscription_plan: 'free' };
    next();
  }),
}));

describe('Calculations API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveCalculation', () => {
    it('should return 400 when missing required fields', async () => {
      const req = {
        body: {},
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'test-user-id', subscription_plan: 'free' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await saveCalculation(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        details: 'Type, parameters, and results are required'
      });
    });

    it('should return 500 when Supabase client not configured', async () => {
      (getSupabaseClient as any).mockReturnValueOnce(null);

      const req = {
        body: {
          type: 'superheat',
          parameters: { suction_temp: 50 },
          results: { superheat: 15 },
        },
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'test-user-id', subscription_plan: 'free' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await saveCalculation(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Database configuration missing'
      });
    });
  });

  describe('getCalculations', () => {
    it('should return 500 when Supabase client not configured', async () => {
      (getSupabaseClient as any).mockReturnValueOnce(null);

      const req = {
        headers: {},
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await getCalculations(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteCalculation', () => {
    it('should return 500 when Supabase client not configured', async () => {
      (getSupabaseClient as any).mockReturnValueOnce(null);

      const req = {
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'test-user-id' },
        params: { id: 'calc-123' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await deleteCalculation(req, res, vi.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should call delete with correct id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: null, error: null });
      const mockDelete = vi.fn().mockReturnValue({ eq: mockEq });
      const mockFrom = vi.fn().mockReturnValue({ delete: mockDelete });

      (getSupabaseClient as any).mockReturnValue({
        from: mockFrom,
      });

      const req = {
        headers: { authorization: 'Bearer test-token' },
        user: { id: 'test-user-id' },
        params: { id: 'calc-123' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await deleteCalculation(req, res, vi.fn());

      expect(mockFrom).toHaveBeenCalledWith('calculations');
      expect(mockEq).toHaveBeenCalledWith('id', 'calc-123');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Calculation deleted successfully'
      });
    });
  });
});