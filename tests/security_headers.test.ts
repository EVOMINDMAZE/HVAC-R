import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import http from 'http';
import fetch from 'node-fetch';

// Mocks to allow server startup without external dependencies
vi.mock('../server/utils/stripe', () => ({
  stripe: {
    billingPortal: { sessions: { create: vi.fn() } },
    checkout: { sessions: { create: vi.fn() } },
    subscriptions: { list: vi.fn(), cancel: vi.fn(), retrieve: vi.fn(), update: vi.fn() }
  },
  WEBHOOK_SECRET: 'whsec_mock'
}));

vi.mock('../server/utils/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn(),
    auth: { admin: { getUserById: vi.fn() } }
  },
  getSupabaseClient: vi.fn()
}));

// Set env vars before importing app
process.env.VITE_SUPABASE_URL = 'https://example.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-key';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

// Dynamic import to ensure mocks apply
const { createServer: createExpressApp } = await import('../server/index');

describe('Security Headers', () => {
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    const app = createExpressApp();
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, () => resolve());
    });
    const address = server.address();
    if (address && typeof address !== 'string') {
      port = address.port;
    }
  });

  afterAll(() => {
    server.close();
  });

  it('should respond with security headers', async () => {
    const res = await fetch(`http://localhost:${port}/api/health`);
    expect(res.status).toBe(200);

    const headers = res.headers;
    expect(headers.get('x-content-type-options')).toBe('nosniff');
    expect(headers.get('x-frame-options')).toBe('DENY');
    expect(headers.get('strict-transport-security')).toContain('max-age=31536000');
    expect(headers.get('x-xss-protection')).toBe('1; mode=block');
    expect(headers.get('referrer-policy')).toBe('strict-origin-when-cross-origin');
  });
});
