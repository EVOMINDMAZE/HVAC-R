import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';

// Mock Stripe module completely to avoid instantiation error
vi.mock('../utils/stripe.ts', () => {
  return {
    stripe: {
      paymentIntents: { create: vi.fn() },
      billingPortal: { sessions: { create: vi.fn() } },
      checkout: { sessions: { create: vi.fn() } },
      subscriptions: { list: vi.fn(), cancel: vi.fn(), retrieve: vi.fn(), update: vi.fn() },
      customers: { list: vi.fn() },
      webhooks: { constructEvent: vi.fn() }
    },
    WEBHOOK_SECRET: 'test_secret',
    createCustomerPortalSession: vi.fn(),
    createCheckoutSession: vi.fn(),
    getCustomerSubscription: vi.fn(),
    cancelSubscription: vi.fn(),
    updateSubscription: vi.fn(),
  };
});

// Import createServer AFTER mocking
import { createServer } from '../index.ts';

describe('Rate Limiting', () => {
  let app;

  beforeAll(() => {
    app = createServer();
  });

  it('should rate limit login attempts', async () => {
    const agent = request(app);

    // Make 5 requests (allowed)
    for (let i = 0; i < 5; i++) {
      const res = await agent
        .post('/api/auth/signin')
        .send({ email: 'test@example.com', password: 'wrongpassword' });

      // Should result in 400 or 401, but NOT 429
      expect(res.status).not.toBe(429);
    }

    // Make 6th request (should be blocked)
    const res = await agent
      .post('/api/auth/signin')
      .send({ email: 'test@example.com', password: 'wrongpassword' });

    expect(res.status).toBe(429);
    expect(res.text).toBe("Too many login attempts, please try again after 15 minutes");
  });
});
