import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-06-20' as any,
});

export const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || '';

// Create a customer portal session for subscription management
export async function createCustomerPortalSession(customerId: string, returnUrl: string) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
  return session;
}

// Create a checkout session for subscription
export async function createCheckoutSession(
  priceId: string,
  stripeCustomerId?: string,
  customerEmail?: string,
  userId?: string
) {
  const sessionConfig: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile?success=true`,
    cancel_url: `${process.env.CLIENT_URL || 'http://localhost:3000'}/pricing`,
    metadata: {
      userId: userId || '',
    },
    subscription_data: {
      metadata: {
        userId: userId || '',
      }
    }
  };

  if (stripeCustomerId) {
    sessionConfig.customer = stripeCustomerId;
  } else if (customerEmail) {
    sessionConfig.customer_email = customerEmail;
  }

  const session = await stripe.checkout.sessions.create(sessionConfig);
  return session;
}

// Get customer's subscription details
export async function getCustomerSubscription(customerId: string) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

// Cancel subscription
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.cancel(subscriptionId);
  return subscription;
}

// Update subscription
export async function updateSubscription(subscriptionId: string, newPriceId: string) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  const itemId = subscription.items.data[0]?.id;
  if (!itemId) {
    throw new Error('No subscription item found');
  }

  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        price: newPriceId,
      },
    ],
    proration_behavior: 'always_invoice',
  });

  return updatedSubscription;
}
