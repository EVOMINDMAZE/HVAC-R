import express from "express";

import { BillingService } from "../services/billing/BillingService.js";
import {
  stripe,
} from "../utils/stripe.js";
import { supabaseAdmin } from "../utils/supabase.js";
import { authenticateSupabaseToken } from "../utils/supabaseAuth.js";

import {
  toCompatEnvelope,
  toCompatErrorEnvelope,
} from "./compat/apiAdapter.js";


const router = express.Router();
const billingService = new BillingService();

type RuntimeTaggedRequest = express.Request & {
  runtimePath?: string;
};

type CompatMetaOptions = {
  migrationTags?: string[];
  compatContext?: Record<string, unknown>;
};

function getCompatOptions(req: RuntimeTaggedRequest, meta?: CompatMetaOptions) {
  const metaHeader = req.headers["x-compat-meta"];
  const metaRaw = Array.isArray(metaHeader) ? metaHeader[0] : metaHeader;
  const includeMeta = metaRaw === "1" || metaRaw === "true";
  const runtimePath =
    req.runtimePath ||
    (Array.isArray(req.headers["x-runtime-path"])
      ? req.headers["x-runtime-path"][0]
      : req.headers["x-runtime-path"]);

  return {
    includeMeta,
    runtimePath,
    ...meta,
  };
}

function sendCompatSuccess(
  req: RuntimeTaggedRequest,
  res: express.Response,
  payload: Record<string, unknown>,
  statusCode = 200,
  meta?: CompatMetaOptions,
) {
  return res
    .status(statusCode)
    .json(toCompatEnvelope(payload, getCompatOptions(req, meta)));
}

function sendCompatError(
  req: RuntimeTaggedRequest,
  res: express.Response,
  payload: Record<string, unknown>,
  statusCode = 500,
  meta?: CompatMetaOptions,
) {
  return res
    .status(statusCode)
    .json(toCompatErrorEnvelope(payload, getCompatOptions(req, meta)));
}

const priceIdToPlan: { [key: string]: string } = {
  [process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID || ""]: "pro",
  [process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID || ""]: "pro",
  [process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID || ""]: "business",
  [process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID || ""]: "business",
};

function createCheckoutSessionResponder(service: BillingService) {
  return async (req: RuntimeTaggedRequest, res: express.Response) => {
    const result = await service.createCheckoutSessionRouteModel({
      priceId: req.body?.priceId,
      user: (req as any).user,
    });

    if (!result.ok) {
      return sendCompatError(
        req,
        res,
        result.payload,
        "statusCode" in result ? result.statusCode : 500,
        result.meta,
      );
    }

    return sendCompatSuccess(req, res, result.payload, 200, result.meta);
  };
}

function createPortalSessionResponder(service: BillingService) {
  return async (req: RuntimeTaggedRequest, res: express.Response) => {
    const result = await service.createPortalSessionRouteModel({
      user: (req as any).user,
      clientUrl: process.env.CLIENT_URL || "http://localhost:3000",
    });

    if (!result.ok) {
      return sendCompatError(
        req,
        res,
        result.payload,
        "statusCode" in result ? result.statusCode : 500,
        result.meta,
      );
    }

    return sendCompatSuccess(req, res, result.payload, 200, result.meta);
  };
}

export function createGetSubscriptionHandler(service: BillingService) {
  return async (req: RuntimeTaggedRequest, res: express.Response) => {
    const result = await service.getSubscriptionRouteModel({
      user: (req as any).user,
      priceIdToPlan,
    });

    return sendCompatSuccess(req, res, result.payload, 200, result.meta);
  };
}

const handleCreateCheckoutSession = createCheckoutSessionResponder(billingService);
const handleCreatePortalSession = createPortalSessionResponder(billingService);
const handleGetSubscription = createGetSubscriptionHandler(billingService);

// Test route
router.get("/test", (req, res) => {
  sendCompatSuccess(req, res, { message: "Billing routes are working!" });
});

// Create checkout session
router.post(
  "/create-checkout-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      return await handleCreateCheckoutSession(req, res);
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      return sendCompatError(
        req,
        res,
        { error: error.message || "Checkout failed" },
        500,
      );
    }
  },
);

// Create customer portal session
router.post(
  "/create-portal-session",
  authenticateSupabaseToken,
  async (req, res) => {
    try {
      return await handleCreatePortalSession(req, res);
    } catch (error: any) {
      console.error("Error creating portal session:", error);
      return sendCompatError(req, res, { error: error.message }, 500);
    }
  },
);

// Get subscription details
router.get("/subscription", authenticateSupabaseToken, async (req, res) => {
  try {
    return await handleGetSubscription(req, res);
  } catch (error: any) {
    console.error("Error fetching subscription:", error);
    return sendCompatError(req, res, { error: error.message }, 500);
  }
});

// Stripe webhook handler
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) return res.status(400).send("Webhook secret not configured");

    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
            // Update user metadata
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_plan: planName,
                subscription_status: status,
                stripe_subscription_id: sub.id,
                stripe_customer_id: customerId
              }
            });

            // Update subscriptions table
            await supabaseAdmin
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                price_id: priceId,
                plan: planName,
                status: status,
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'stripe_subscription_id',
                ignoreDuplicates: false,
              });
          } else {
            console.warn("No userId in subscription metadata - cannot update Supabase user automatically", sub.id);
          }
          break;
        }

        case "customer.subscription.deleted": {
          const sub = event.data.object as any;
          const userId = sub.metadata?.userId;
          const customerId = sub.customer;

          if (userId) {
            // Update user metadata
            await supabaseAdmin.auth.admin.updateUserById(userId, {
              user_metadata: {
                subscription_plan: 'free',
                subscription_status: 'canceled',
                stripe_subscription_id: null
              }
            });

            // Update subscriptions table
            await supabaseAdmin
              .from('subscriptions')
              .upsert({
                user_id: userId,
                stripe_customer_id: customerId,
                stripe_subscription_id: sub.id,
                status: 'canceled',
                plan: 'free',
                updated_at: new Date().toISOString(),
              }, {
                onConflict: 'stripe_subscription_id',
                ignoreDuplicates: false,
              });
          }
          break;
        }
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      return sendCompatError(
        req,
        res,
        { error: "Webhook handling failed" },
        500,
      );
    }

    return sendCompatSuccess(req, res, { received: true });
  },
);

export default router;
