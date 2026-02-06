import express from "express";
import { authenticateSupabaseToken } from "../utils/supabaseAuth.js";
import { supabaseAdmin } from "../utils/supabase.js";
import {
  stripe,
  createCustomerPortalSession,
  getCustomerSubscription,
  createCheckoutSession
} from "../utils/stripe.js";

const router = express.Router();

const priceIdToPlan: { [key: string]: string } = {
  [process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || ""]: "solo",
  [process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || ""]: "solo",
  [process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || ""]: "professional",
  [process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ""]: "professional",
};

// Test route
router.get("/test", (req, res) => {
  res.json({ message: "Billing routes are working!" });
});

// Create checkout session
router.post(
  "/create-checkout-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      const { priceId } = req.body;
      const user = (req as any).user;

      if (!priceId) {
        return res.status(400).json({ error: "Price ID is required" });
      }

      const session = await createCheckoutSession(
        priceId,
        user.stripe_customer_id, // Might be null
        user.email,
        user.id // Pass user ID for metadata
      );

      res.json({
        sessionId: session.id,
        url: session.url,
      });
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message || "Checkout failed" });
    }
  },
);

// Create customer portal session
router.post(
  "/create-portal-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      const user = (req as any).user;

      let customerId = user.stripe_customer_id;

      if (!customerId) {
        // Try fallback lookup
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        if (customers.data.length > 0) {
          customerId = customers.data[0].id;
        }
      }

      if (!customerId) {
        return res.status(400).json({ error: "No Stripe customer found. Please make a purchase first." });
      }

      const returnUrl = `${process.env.CLIENT_URL || "http://localhost:3000"}/profile`;
      const session = await createCustomerPortalSession(customerId, returnUrl);

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Get subscription details
router.get("/subscription", authenticateSupabaseToken, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return res.json({ subscription: null, plan: user.subscription_plan || "free", status: "active" });
    }

    let customerId = user.stripe_customer_id;
    if (!customerId) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    if (!customerId) {
      return res.json({ subscription: null, plan: "free", status: "active" });
    }

    const subscription = await getCustomerSubscription(customerId);

    if (!subscription) {
      return res.json({ subscription: null, plan: "free", status: "active" });
    }

    const priceId = subscription.items.data[0]?.price.id;
    const planName = (priceId && priceIdToPlan[priceId]) || "free";

    res.json({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        current_period_end: (subscription as any).current_period_end,
        plan: planName,
        amount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
        currency: subscription.items.data[0]?.price.currency,
        interval: subscription.items.data[0]?.price.recurring?.interval,
      },
      plan: planName,
      status: subscription.status,
    });
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    res.status(500).json({ error: error.message });
  }
});

// Stripe webhook handler
router.post(
  "/webhook",
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) return res.status(400).send("Webhook secret not configured");

    let event;
    try {
      const rawBody = (req as any).rawBody;
      event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (!supabaseAdmin) {
      console.error("Supabase Admin not initialized, cannot update user");
      return res.status(500).send("Database error");
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as any;
          const userId = session.metadata?.userId;
          const customerId = session.customer;

          if (userId) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                stripe_customer_id: customerId,
                subscription_status: 'active'
                // We don't verify plan here easily without fetching sub, 
                // but usually sub update comes next.
              }
            });
          }
          break;
        }

        case "customer.subscription.updated": {
          const sub = event.data.object as any;
          const priceId = sub.items.data[0].price.id;
          const planName = priceIdToPlan[priceId] || 'free';
          const status = sub.status; // active, past_due, etc.
          const userId = sub.metadata?.userId; // From subscription metadata
          const customerId = sub.customer;

          console.log(`Processing subscription update for customer ${customerId}: ${planName} (${status})`);

          // If we have userId in metadata, great. If not, we might be stuck unless 
          // we search users by stripe_customer_id in metadata?
          // But Supabase doesn't allow searching by user_metadata easily without exact match. 
          // We'll rely on userId being present from checkout.

          if (userId) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_plan: planName,
                subscription_status: status,
                stripe_subscription_id: sub.id,
                stripe_customer_id: customerId
              }
            });
          } else {
            console.warn("No userId in subscription metadata - cannot update Supabase user automatically", sub.id);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as any;
          const userId = sub.metadata?.userId;

          if (userId) {
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_plan: 'free',
                subscription_status: 'canceled',
                stripe_subscription_id: null
              }
            });
          }
          break;
        }
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return res.status(500).json({ error: "Webhook handling failed" });
    }

    res.json({ received: true });
  },
);

export default router;
