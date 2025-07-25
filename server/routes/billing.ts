import express from 'express';
import { stripe, createCheckoutSession, createCustomerPortalSession, getCustomerSubscription } from '../utils/stripe.js';
import { userDb, billingDb, ensureDbInitialized } from '../database/index.js';
import { authenticateSupabaseToken } from '../utils/supabaseAuth.js';

const router = express.Router();

// Ensure database is initialized
ensureDbInitialized();

// Create checkout session
router.post('/create-checkout-session', authenticateToken, async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;
    const userEmail = req.user.email;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Check if user already has a Stripe customer ID
    let customerId = req.user.stripe_customer_id;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: {
          userId: userId.toString(),
        },
      });
      customerId = customer.id;

      // Update user with Stripe customer ID
      userDb.updateStripeInfo.run(customerId, null, userId);
    }

    const session = await createCheckoutSession(priceId, customerId);

    res.json({ 
      sessionId: session.id,
      url: session.url 
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create customer portal session
router.post('/create-portal-session', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({ error: 'No Stripe customer found' });
    }

    const returnUrl = `${process.env.CLIENT_URL || 'http://localhost:3000'}/profile`;
    const session = await createCustomerPortalSession(customerId, returnUrl);

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Error creating portal session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get subscription details
router.get('/subscription', authenticateToken, async (req, res) => {
  try {
    const customerId = req.user.stripe_customer_id;

    if (!customerId) {
      return res.json({ 
        subscription: null,
        plan: 'free',
        status: 'active'
      });
    }

    const subscription = await getCustomerSubscription(customerId);

    if (!subscription) {
      return res.json({ 
        subscription: null,
        plan: 'free',
        status: 'active'
      });
    }

    // Extract plan info from subscription
    const priceId = subscription.items.data[0]?.price.id;
    let planName = 'free';

    // Map price IDs to plan names (these should match your Stripe price IDs)
    const priceIdToPlan: { [key: string]: string } = {
      [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '']: 'professional',
      [process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '']: 'professional_yearly',
      [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '']: 'enterprise',
      [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '']: 'enterprise_yearly',
    };

    if (priceId && priceIdToPlan[priceId]) {
      planName = priceIdToPlan[priceId];
    }

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        plan: planName,
        amount: subscription.items.data[0]?.price.unit_amount / 100,
        currency: subscription.items.data[0]?.price.currency,
        interval: subscription.items.data[0]?.price.recurring?.interval,
      },
      plan: planName,
      status: subscription.status
    });
  } catch (error: any) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('Stripe webhook secret not configured');
    return res.status(400).send('Webhook secret not configured');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Check if we've already processed this event
  const existingEvent = billingDb.findEventById.get(event.id);
  if (existingEvent && existingEvent.processed) {
    return res.json({ received: true });
  }

  // Store the event
  try {
    billingDb.createEvent.run(
      event.id,
      event.type,
      event.data.object.customer || null,
      event.data.object.subscription || null,
      JSON.stringify(event.data)
    );
  } catch (error) {
    // Event might already exist, which is fine
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    // Mark event as processed
    billingDb.markEventProcessed.run(event.id);
  } catch (error) {
    console.error('Error processing webhook:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }

  res.json({ received: true });
});

// Webhook event handlers
async function handleCheckoutCompleted(session: any) {
  const customerId = session.customer;
  const subscriptionId = session.subscription;

  if (!customerId) return;

  const user = userDb.findByStripeCustomerId.get(customerId);
  if (!user) {
    console.error('User not found for customer:', customerId);
    return;
  }

  // Update user with subscription info
  userDb.updateStripeInfo.run(customerId, subscriptionId, user.id);

  // Fetch subscription details to determine plan
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const priceId = subscription.items.data[0]?.price.id;

  let planName = 'professional'; // default

  const priceIdToPlan: { [key: string]: string } = {
    [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '']: 'professional',
    [process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '']: 'professional',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '']: 'enterprise',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '']: 'enterprise',
  };

  if (priceId && priceIdToPlan[priceId]) {
    planName = priceIdToPlan[priceId];
  }

  userDb.updateSubscription.run(planName, 'active', null, user.id);
}

async function handleSubscriptionUpdated(subscription: any) {
  const customerId = subscription.customer;
  const user = userDb.findByStripeCustomerId.get(customerId);
  
  if (!user) return;

  const priceId = subscription.items.data[0]?.price.id;
  let planName = 'professional';

  const priceIdToPlan: { [key: string]: string } = {
    [process.env.STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || '']: 'professional',
    [process.env.STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || '']: 'professional',
    [process.env.STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || '']: 'enterprise',
    [process.env.STRIPE_ENTERPRISE_YEARLY_PRICE_ID || '']: 'enterprise',
  };

  if (priceId && priceIdToPlan[priceId]) {
    planName = priceIdToPlan[priceId];
  }

  userDb.updateSubscription.run(planName, subscription.status, null, user.id);
}

async function handleSubscriptionDeleted(subscription: any) {
  const customerId = subscription.customer;
  const user = userDb.findByStripeCustomerId.get(customerId);
  
  if (!user) return;

  userDb.updateSubscription.run('free', 'cancelled', null, user.id);
  userDb.updateStripeInfo.run(customerId, null, user.id);
}

async function handlePaymentSucceeded(invoice: any) {
  // Payment succeeded - could send confirmation email here
  console.log('Payment succeeded for invoice:', invoice.id);
}

async function handlePaymentFailed(invoice: any) {
  // Payment failed - could send notification here
  console.log('Payment failed for invoice:', invoice.id);
}

export default router;
