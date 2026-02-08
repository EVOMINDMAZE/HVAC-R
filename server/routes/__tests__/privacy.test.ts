import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  recordConsent, 
  getUserConsents, 
  checkConsent, 
  submitDataSubjectRequest, 
  exportUserData 
} from '../privacy.js';
import { supabaseAdmin } from '../../utils/supabase.js';

// Mock supabaseAdmin and other dependencies
vi.mock('../../utils/supabase.js', () => ({
  supabaseAdmin: {
    rpc: vi.fn(),
  },
  getSupabaseClient: vi.fn(() => ({})),
}));

// Mock supabaseAuth
vi.mock('../../utils/supabaseAuth.js', () => ({
  authenticateSupabaseToken: vi.fn((req, res, next) => {
    (req as any).user = { id: 'test-user-id' };
    next();
  }),
}));

describe('Privacy API Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('recordConsent', () => {
    it('should return 400 when missing required fields', async () => {
      const req = {
        body: {},
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await recordConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required fields',
        details: 'consent_type, consent_version, and granted are required'
      });
    });

    it('should return 401 when user not authenticated', async () => {
      const req = {
        body: { consent_type: 'essential_cookies', consent_version: 'v1.0', granted: true },
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
        user: null, // No user
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await recordConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should return 500 when Supabase client not configured', async () => {
      // Mock getSupabaseClient to return null
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue(null);

      const req = {
        body: { consent_type: 'essential_cookies', consent_version: 'v1.0', granted: true },
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await recordConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Supabase client not configured'
      });
    });

    it('should successfully record consent and return 200', async () => {
      // Mock getSupabaseClient to return a client
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      // Mock successful RPC call
      (supabaseAdmin.rpc as any).mockResolvedValue({ data: 'consent-id-123', error: null });

      const req = {
        body: { consent_type: 'essential_cookies', consent_version: 'v1.0', granted: true },
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await recordConsent(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('record_consent', {
        p_user_id: 'test-user-id',
        p_consent_type: 'essential_cookies',
        p_consent_version: 'v1.0',
        p_granted: true,
        p_ip_address: '127.0.0.1',
        p_user_agent: 'Test User Agent'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        consent_id: 'consent-id-123',
        message: 'Consent recorded successfully'
      });
    });

    it('should return 500 when RPC call fails', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      // Mock failed RPC call
      (supabaseAdmin.rpc as any).mockResolvedValue({ 
        data: null, 
        error: new Error('Database error') 
      });

      const req = {
        body: { consent_type: 'essential_cookies', consent_version: 'v1.0', granted: true },
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await recordConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to record consent',
        details: 'Database error'
      });
    });
  });

  describe('getUserConsents', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = {
        user: null,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await getUserConsents(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should return user consents successfully', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      const mockConsents = [
        { consent_type: 'essential_cookies', consent_version: 'v1.0', granted: true, granted_at: '2026-02-07T12:00:00Z' },
        { consent_type: 'marketing_emails', consent_version: 'v1.0', granted: false, granted_at: null },
      ];
      (supabaseAdmin.rpc as any).mockResolvedValue({ data: mockConsents, error: null });

      const req = {
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await getUserConsents(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('get_user_consents', {
        p_user_id: 'test-user-id'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        consents: mockConsents
      });
    });

    it('should return empty array when no consents found', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: null, error: null });

      const req = {
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await getUserConsents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        consents: []
      });
    });
  });

  describe('checkConsent', () => {
    it('should return 400 when consent_type missing', async () => {
      const req = {
        query: {},
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await checkConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Missing required query parameter',
        details: 'consent_type is required'
      });
    });

    it('should return 401 when user not authenticated', async () => {
      const req = {
        query: { consent_type: 'essential_cookies' },
        user: null,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await checkConsent(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should check consent with specific version', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: true, error: null });

      const req = {
        query: { consent_type: 'essential_cookies', consent_version: 'v1.0' },
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await checkConsent(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('has_consent', {
        p_user_id: 'test-user-id',
        p_consent_type: 'essential_cookies',
        p_consent_version: 'v1.0'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        has_consent: true,
        consent_type: 'essential_cookies',
        consent_version: 'v1.0'
      });
    });

    it('should use "latest" as default version', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      (supabaseAdmin.rpc as any).mockResolvedValue({ data: false, error: null });

      const req = {
        query: { consent_type: 'marketing_emails' },
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await checkConsent(req, res);

      expect(supabaseAdmin.rpc).toHaveBeenCalledWith('has_consent', {
        p_user_id: 'test-user-id',
        p_consent_type: 'marketing_emails',
        p_consent_version: 'latest'
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        has_consent: false,
        consent_type: 'marketing_emails',
        consent_version: 'latest'
      });
    });
  });

  describe('submitDataSubjectRequest', () => {
    it('should return 400 for invalid request type', async () => {
      const req = {
        body: { request_type: 'invalid_type' },
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await submitDataSubjectRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid request type',
        details: 'request_type must be one of: access, deletion, correction, portability'
      });
    });

    it('should return 401 when user not authenticated', async () => {
      const req = {
        body: { request_type: 'access' },
        user: null,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await submitDataSubjectRequest(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should log DSR and return success response', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const mockDate = new Date('2026-02-07T12:00:00Z');
      vi.setSystemTime(mockDate);

      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      const req = {
        body: { 
          request_type: 'deletion',
          description: 'Please delete all my personal data' 
        },
        ip: '127.0.0.1',
        get: vi.fn(() => 'Test User Agent'),
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await submitDataSubjectRequest(req, res);

      // Should log the DSR
      expect(consoleLogSpy).toHaveBeenCalledWith('Data Subject Request received:', {
        user_id: 'test-user-id',
        request_type: 'deletion',
        description: 'Please delete all my personal data',
        timestamp: mockDate.toISOString(),
        ip_address: '127.0.0.1',
        user_agent: 'Test User Agent'
      });

      // Should return success response
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        request_id: expect.stringMatching(/^dsr_\d+_[a-z0-9]+$/),
        message: 'Your data subject request has been received. We will process it within 30 days as required by GDPR/CCPA.',
        next_steps: 'You will receive a confirmation email shortly.'
      });

      consoleLogSpy.mockRestore();
      vi.useRealTimers();
    });
  });

  describe('exportUserData', () => {
    it('should return 401 when user not authenticated', async () => {
      const req = {
        user: null,
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await exportUserData(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Authentication required'
      });
    });

    it('should return placeholder export response', async () => {
      const { getSupabaseClient } = await import('../../utils/supabase.js');
      (getSupabaseClient as any).mockReturnValue({});

      const mockDate = new Date('2026-02-07T12:00:00Z');
      vi.setSystemTime(mockDate);

      const req = {
        user: { id: 'test-user-id' },
      } as any;
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      } as any;

      await exportUserData(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Your data export request has been queued. You will receive an email with a download link within 48 hours.',
        request_id: expect.stringMatching(/^export_\d+_[a-z0-9]+$/),
        estimated_completion: new Date(mockDate.getTime() + 48 * 60 * 60 * 1000).toISOString()
      });

      vi.useRealTimers();
    });
  });
});