import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import express from 'express';
import jwt from 'jsonwebtoken';
import { createServer } from './index';
import { Server } from 'http';
import { AddressInfo } from 'net';

// Mock dependencies to avoid side effects
vi.mock('./utils/stripe.ts', () => ({
  stripe: {
    customers: { list: vi.fn() },
    webhooks: { constructEvent: vi.fn() }
  },
  createCustomerPortalSession: vi.fn(),
  getCustomerSubscription: vi.fn(),
  createCheckoutSession: vi.fn()
}));

// Mock Supabase to simulate authentication failure for invalid tokens
vi.mock('./utils/supabase.ts', () => ({
  getSupabaseClient: vi.fn().mockImplementation((token) => ({
    auth: {
      getUser: vi.fn().mockImplementation(async () => {
        // If the token is the fake one we generated, fail.
        // In a real scenario, Supabase would reject the signature.
        if (token && token.includes('fake')) { // Our test uses a token that will look like a JWT but verify as invalid
             return { data: { user: null }, error: { message: 'Invalid token' } };
        }
        // If we want to simulate success for other tests, we could do it here
        return { data: { user: null }, error: { message: 'Invalid token' } };
      })
    }
  })),
  supabaseAdmin: null
}));

describe('Security: Auth Bypass Vulnerability', () => {
  let app: express.Express;
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    app = createServer();

    // Start server on ephemeral port
    return new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const address = server.address() as AddressInfo;
        baseUrl = `http://localhost:${address.port}`;
        console.log(`Test server running at ${baseUrl}`);
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('should REJECT access with a self-signed (fake) token', async () => {
    // 1. Create a fake token signed with a random secret
    const fakePayload = {
      sub: '12345678-1234-1234-1234-123456789012',
      email: 'hacker@example.com',
      user_metadata: {
        subscription_plan: 'enterprise',
        subscription_status: 'active'
      },
      exp: Math.floor(Date.now() / 1000) + 3600
    };

    // Sign with a secret ONLY KNOWN TO ATTACKER (not the real one)
    // We add 'fake' to the payload string representation so our mock detects it if it inspects it,
    // but here we just rely on our mock logic.
    const fakeToken = jwt.sign(fakePayload, 'attacker-secret');

    // 2. Request a protected endpoint
    const response = await fetch(`${baseUrl}/api/billing/subscription`, {
      headers: {
        'Authorization': `Bearer ${fakeToken}`
      }
    });

    // 3. Verify it FAILS (Status 401)
    // Currently (before fix), this will fail (it gets 200).
    // After fix, this should pass (it gets 401).
    if (response.status === 200) {
        console.log('Vulnerability STILL PRESENT: Got 200 OK with fake token');
    } else {
        console.log('Vulnerability MITIGATED: Got', response.status);
    }

    expect(response.status).toBe(401);
  });
});
