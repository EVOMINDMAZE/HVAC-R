import { describe, it, expect, vi } from 'vitest';
import { validateRequest, commonSchemas, authSchemas, calculationSchemas, consentSchemas, dsrSchemas, jobSchemas, clientSchemas } from '../validation';

describe('validation', () => {
  describe('validateRequest', () => {
    const mockReq = (body = {}, query = {}, params = {}) => ({ body, query, params });
    const mockRes = () => {
      const res: Record<string, unknown> = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);
      return res as unknown as { status: ReturnType<typeof vi.fn>; json: ReturnType<typeof vi.fn> };
    };
    const mockNext = vi.fn();

    it('should pass validation with valid body', () => {
      const schema = commonSchemas.nonEmptyString;
      const middleware = validateRequest({ body: schema });
      
      const req = mockReq('test');
      const res = mockRes();
      
      middleware(req as any, res as any, mockNext);
      
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('commonSchemas', () => {
    it('should validate email', () => {
      expect(commonSchemas.email.safeParse('test@example.com').success).toBe(true);
      expect(commonSchemas.email.safeParse('invalid').success).toBe(false);
    });

    it('should validate positive number', () => {
      expect(commonSchemas.positiveNumber.safeParse(5).success).toBe(true);
      expect(commonSchemas.positiveNumber.safeParse(-1).success).toBe(false);
      expect(commonSchemas.positiveNumber.safeParse(0).success).toBe(false);
    });

    it('should validate pagination with defaults', () => {
      const result = commonSchemas.pagination.parse({});
      expect(result.page).toBe(1);
      expect(result.limit).toBe(10);
    });

    it('should coerce pagination values', () => {
      const result = commonSchemas.pagination.parse({ page: '2', limit: '20' });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(20);
    });
  });

  describe('authSchemas', () => {
    it('should validate signIn', () => {
      const valid = { email: 'test@example.com', password: 'password123' };
      expect(authSchemas.signIn.safeParse(valid).success).toBe(true);
    });

    it('should require strong password for signUp', () => {
      const weak = { email: 'test@example.com', password: 'weak', fullName: 'Test' };
      expect(authSchemas.signUp.safeParse(weak).success).toBe(false);
      
      const strong = { email: 'test@example.com', password: 'StrongPass1', fullName: 'Test' };
      expect(authSchemas.signUp.safeParse(strong).success).toBe(true);
    });
  });

  describe('calculationSchemas', () => {
    it('should validate calculation types', () => {
      const valid = {
        type: 'superheat',
        parameters: { temp: 50 },
        results: { superheat: 15 },
      };
      expect(calculationSchemas.save.safeParse(valid).success).toBe(true);
    });

    it('should reject invalid calculation types', () => {
      const invalid = {
        type: 'invalid',
        parameters: {},
        results: {},
      };
      expect(calculationSchemas.save.safeParse(invalid).success).toBe(false);
    });
  });

  describe('consentSchemas', () => {
    it('should validate consent record', () => {
      const valid = {
        consent_type: 'essential_cookies',
        consent_version: 'v1.0',
        granted: true,
      };
      expect(consentSchemas.record.safeParse(valid).success).toBe(true);
    });
  });

  describe('dsrSchemas', () => {
    it('should validate DSR request types', () => {
      expect(dsrSchemas.submit.safeParse({ request_type: 'access' }).success).toBe(true);
      expect(dsrSchemas.submit.safeParse({ request_type: 'deletion' }).success).toBe(true);
      expect(dsrSchemas.submit.safeParse({ request_type: 'invalid' }).success).toBe(false);
    });
  });

  describe('jobSchemas', () => {
    it('should validate job creation', () => {
      const valid = {
        clientId: '123e4567-e89b-12d3-a456-426614174000',
        jobType: 'Maintenance',
      };
      expect(jobSchemas.create.safeParse(valid).success).toBe(true);
    });

    it('should validate job status update', () => {
      const valid = { status: 'completed' };
      expect(jobSchemas.update.safeParse(valid).success).toBe(true);
    });
  });

  describe('clientSchemas', () => {
    it('should validate client creation', () => {
      const valid = {
        name: 'Test Client',
        email: 'client@example.com',
      };
      expect(clientSchemas.create.safeParse(valid).success).toBe(true);
    });

    it('should require name for client', () => {
      const invalid = { email: 'client@example.com' };
      expect(clientSchemas.create.safeParse(invalid).success).toBe(false);
    });
  });
});