import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import http from 'http';
import { AddressInfo } from 'net';

// Mock dependencies before importing the server
vi.mock('../database/index.ts', () => ({
  ensureDbInitialized: vi.fn(),
  userDb: {
    findByEmail: { get: vi.fn() },
    findById: { get: vi.fn() },
  },
  sessionDb: {
    findByToken: { get: vi.fn() },
  },
  // Add other necessary exports as minimal mocks
  db: {},
  initializeDatabase: vi.fn(),
  usageDb: {},
  calculationDb: {},
  planDb: {},
  billingDb: {},
  teamDb: {},
}));

vi.mock('../utils/stripe.ts', () => ({
  stripe: {
    webhooks: {
      constructEvent: vi.fn().mockImplementation((body) => {
        if (Buffer.isBuffer(body) || typeof body === 'string') {
          return { type: 'test_event', data: { object: {} } };
        }
        throw new Error('Webhook must be called with raw body');
      }),
    },
    customers: { list: vi.fn() },
    billingPortal: { sessions: { create: vi.fn() } },
    checkout: { sessions: { create: vi.fn() } },
    subscriptions: { list: vi.fn(), cancel: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
  },
  WEBHOOK_SECRET: 'whsec_test',
  createCustomerPortalSession: vi.fn(),
  createCheckoutSession: vi.fn(),
  getCustomerSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
  updateSubscription: vi.fn(),
}));

vi.mock('../utils/supabase.ts', () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        updateUserById: vi.fn(),
      },
    },
  },
}));

vi.mock('../utils/supabaseAuth.ts', () => ({
  authenticateSupabaseToken: (req: any, res: any, next: any) => next(),
}));

// Now import the server creator
import { createServer } from '../index.ts';

describe('Stripe Webhook Middleware Order', () => {
  let app: any;
  let server: http.Server;
  let port: number;

  beforeAll(async () => {
    // Set env var for webhook secret
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

    app = createServer();
    server = http.createServer(app);

    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        port = (server.address() as AddressInfo).port;
        resolve();
      });
    });
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should verify signature using raw body and succeed', async () => {
    const payload = JSON.stringify({ id: 'evt_test' });

    const options = {
      hostname: 'localhost',
      port: port,
      path: '/api/billing/webhook',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Stripe-Signature': 't=123,v1=signature',
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    return new Promise<void>((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          if (res.statusCode !== 200) {
             console.log('Test failed with status:', res.statusCode, 'Data:', data);
          }
          expect(res.statusCode).toBe(200);
          expect(JSON.parse(data)).toEqual({ received: true });
          resolve();
        });
      });

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  });
});
