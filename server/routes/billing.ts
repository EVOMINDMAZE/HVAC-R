import express from "express";
import { authenticateSupabaseToken } from "../utils/supabaseAuth.js";
import {
  stripe,
  createCustomerPortalSession,
  getCustomerSubscription,
} from "../utils/stripe.js";

const router = express.Router();

// Ensure database is initialized
// ensureDbInitialized();

// Test route to verify billing routes are working
router.get("/test", (req, res) => {
  res.json({ message: "Billing routes are working!" });
});

// Test route without auth to debug routing
router.post("/test-checkout", (req, res) => {
  console.log("Test checkout route called with body:", req.body);
  res.json({ message: "Test checkout route works!", body: req.body });
});

// Test Stripe configuration without auth
router.get("/test-stripe-config", async (req, res) => {
  try {
    const hasStripeKey = !!process.env.STRIPE_SECRET_KEY;
    const hasPublishableKey = !!process.env.VITE_STRIPE_PUBLISHABLE_KEY;
    const priceIds = {
      professional_monthly:
        process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || "not-set",
      professional_yearly:
        process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || "not-set",
      enterprise_monthly:
        process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || "not-set",
      enterprise_yearly:
        process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || "not-set",
    };

    // Test Stripe import
    let stripeImportError = null;
    try {
      const { createCheckoutSession } = await import("../utils/stripe.js");
      console.log("Stripe utilities imported successfully");
    } catch (error: any) {
      stripeImportError = error.message;
      console.error("Stripe import error:", error);
    }

    res.json({
      message: "Stripe configuration test",
      config: {
        hasStripeSecretKey: hasStripeKey,
        hasPublishableKey: hasPublishableKey,
        priceIds,
        stripeImportError,
      },
    });
  } catch (error: any) {
    console.error("Stripe config test error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Create checkout session
router.post(
  "/create-checkout-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      console.log("Checkout session request received:", req.body);
      const { priceId } = req.body;
      const userId = req.user.id;
      const userEmail = req.user.email;

      console.log("User info:", { userId, userEmail, priceId });

      if (!priceId) {
        console.log("Missing price ID");
        return res.status(400).json({ error: "Price ID is required" });
      }

      // Check if Stripe is configured
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        console.log("Stripe not configured");
        return res
          .status(500)
          .json({
            error: "Payment processing not configured. Please contact support.",
          });
      }

      // Dynamically import and use Stripe
      try {
        const { createCheckoutSession } = await import("../utils/stripe.js");
        const session = await createCheckoutSession(
          priceId,
          undefined,
          userEmail,
        );

        res.json({
          sessionId: session.id,
          url: session.url,
        });
      } catch (stripeError: any) {
        console.error("Stripe error:", stripeError);
        return res
          .status(500)
          .json({
            error: "Failed to create checkout session. Please try again.",
          });
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      res.status(500).json({ error: error.message });
    }
  },
);

// Create customer portal session
router.post(
  "/create-portal-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      const userEmail = req.user.email;

      // Check if Stripe is configured
      const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
      if (!stripeSecretKey) {
        return res
          .status(500)
          .json({
            error: "Payment processing not configured. Please contact support.",
          });
      }

      // Find customer by email
      const customers = await stripe.customers.list({
        email: userEmail,
        limit: 1,
      });

      if (customers.data.length === 0) {
        return res
          .status(400)
          .json({
            error: "No Stripe customer found. Please make a purchase first.",
          });
      }

      const customerId = customers.data[0].id;
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
    const userEmail = req.user.email;

    // Check if Stripe is configured
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
      return res.json({
        subscription: null,
        plan: "free",
        status: "active",
      });
    }

    // Find customer by email
    const customers = await stripe.customers.list({
      email: userEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return res.json({
        subscription: null,
        plan: "free",
        status: "active",
      });
    }

    const customerId = customers.data[0].id;
    const subscription = await getCustomerSubscription(customerId);

    if (!subscription) {
      return res.json({
        subscription: null,
        plan: "free",
        status: "active",
      });
    }

    // Extract plan info from subscription
    const priceId = subscription.items.data[0]?.price.id;
    let planName = "free";

    // Map price IDs to plan names (these should match your Stripe price IDs)
    const priceIdToPlan: { [key: string]: string } = {
      [process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || ""]:
        "professional",
      [process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || ""]:
        "professional_yearly",
      [process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || ""]: "enterprise",
      [process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ""]:
        "enterprise_yearly",
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
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(400).send("Webhook secret not configured");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err: any) {
      console.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    try {
      switch (event.type) {
        case "checkout.session.completed":
          console.log("Checkout session completed:", event.data.object.id);
          break;

        case "customer.subscription.updated":
          console.log("Subscription updated:", event.data.object.id);
          break;

        case "customer.subscription.deleted":
          console.log("Subscription deleted:", event.data.object.id);
          break;

        case "invoice.payment_succeeded":
          console.log("Payment succeeded for invoice:", event.data.object.id);
          break;

        case "invoice.payment_failed":
          console.log("Payment failed for invoice:", event.data.object.id);
          break;

        default:
          console.log(`Unhandled event type ${event.type}`);
      }
    } catch (error) {
      console.error("Error processing webhook:", error);
      return res.status(500).json({ error: "Webhook processing failed" });
    }

    res.json({ received: true });
  },
);

export default router;
