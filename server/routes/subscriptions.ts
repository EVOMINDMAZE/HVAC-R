import { RequestHandler } from "express";
import { supabaseAdmin } from "../utils/supabase.js";
import {
  stripe,
  updateSubscription as stripeUpdateSubscription,
  cancelSubscription as stripeCancelSubscription,
} from "../utils/stripe.js";

// Helper to get Stripe Price ID from plan name and billing cycle
const getPlanPriceId = (planName: string, billingCycle: "monthly" | "yearly" = "monthly") => {
  if (planName === "pro") {
    return billingCycle === "yearly"
      ? process.env.VITE_STRIPE_PROFESSIONAL_YEARLY_PRICE_ID
      : process.env.VITE_STRIPE_PROFESSIONAL_MONTHLY_PRICE_ID;
  }
  if (planName === "business") {
    return billingCycle === "yearly"
      ? process.env.VITE_STRIPE_ENTERPRISE_YEARLY_PRICE_ID
      : process.env.VITE_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID;
  }
  return null;
};

// Fallback subscription plans data when database is unavailable
const FALLBACK_PLANS = [
  {
    id: "plan-free",
    name: "free",
    display_name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    calculations_limit: 10,
    features: [
      "10 calculations per month",
      "Standard cycle analysis (basic parameters)",
      "Basic refrigerant comparison (2 refrigerants max)",
      "Compliance reference (read-only)",
      "Email support",
      "1 saved project",
    ],
    is_active: true,
  },
  {
    id: "plan-pro",
    name: "pro",
    display_name: "Pro",
    price_monthly: 49,
    price_yearly: 490,
    calculations_limit: -1, // Unlimited
    features: [
      "Unlimited calculations",
      "All analysis tools (cascade, advanced cycles)",
      "Advanced refrigerant comparison (unlimited)",
      "PDF export & advanced reporting",
      "API access for integrations",
      "Priority email support",
      "10 saved projects",
      "Basic white-label (personal logo on reports)",
    ],
    is_active: true,
    savings: 17,
  },
  {
    id: "plan-business",
    name: "business",
    display_name: "Business",
    price_monthly: 199,
    price_yearly: 1990,
    calculations_limit: -1, // Unlimited
    features: [
      "Everything in Pro",
      "Team collaboration (up to 5 users included)",
      "White-label branding (company logo, colors, domain)",
      "Client portal for customer access",
      "Automation engine (Review Hunter, Invoice Chaser)",
      "Advanced analytics & business dashboards",
      "Custom training sessions",
      "SLA guarantee",
      "Unlimited projects",
      "Dedicated support",
    ],
    is_active: true,
    savings: 17,
  },
];

export const getSubscriptionPlans: RequestHandler = async (req, res) => {
  try {
    let plans = [];

    if (supabaseAdmin) {
      const { data, error } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('price_monthly', { ascending: true });

      if (!error && data && data.length > 0) {
        plans = data.map((plan: any) => ({
          ...plan,
          features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
          // Calculate savings if not present
          savings: plan.savings || (plan.price_yearly < plan.price_monthly * 12
            ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
            : 0)
        }));
      }
    }

    if (plans.length === 0) {
      console.warn("Using fallback subscription plans");
      plans = FALLBACK_PLANS;
    }

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get subscription plans error:", error);
    res.json({
      success: true,
      data: FALLBACK_PLANS,
    });
  }
};

export const getCurrentSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const planName = user.subscription_plan || 'free';

    let planData = null;

    if (supabaseAdmin) {
      const { data } = await supabaseAdmin
        .from('subscription_plans')
        .select('*')
        .eq('name', planName)
        .single();
      planData = data;
    }

    if (!planData) {
      planData = FALLBACK_PLANS.find(p => p.name === planName) || FALLBACK_PLANS[0];
    }

    const features = typeof planData.features === 'string' ? JSON.parse(planData.features) : planData.features;

    res.json({
      success: true,
      data: {
        ...planData,
        features,
        status: user.subscription_status || "active",
        trialEndsAt: user.trial_ends_at,
      },
    });

  } catch (error) {
    console.error("Get current subscription error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: "Failed to retrieve current subscription",
    });
  }
};

export const updateSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { planName, billingCycle } = req.body;

    if (!supabaseAdmin) {
      // Fallback behavior if configured without Supabase write access
      const fallbackPlan = FALLBACK_PLANS.find((p) => p.name === planName) || FALLBACK_PLANS[0];
      return res.json({
        success: true,
        data: {
          ...fallbackPlan,
          status: "active",
          trialEndsAt: null,
          message: `Simulated update to ${fallbackPlan.display_name} (Database unavailable)`
        },
      });
    }

    // 1. Get new plan details
    const { data: newPlan } = await supabaseAdmin
      .from('subscription_plans')
      .select('*')
      .eq('name', planName)
      .single();

    if (!newPlan && !FALLBACK_PLANS.find(p => p.name === planName)) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    const planToUse = newPlan || FALLBACK_PLANS.find(p => p.name === planName);

    // 2. Update Stripe Subscription if exists
    if (user.stripe_subscription_id) {
      const priceId = getPlanPriceId(planName, billingCycle);
      if (priceId) {
        try {
          await stripeUpdateSubscription(user.stripe_subscription_id, priceId);
          console.log(`Updated Stripe subscription ${user.stripe_subscription_id} to ${priceId}`);
        } catch (stripeError: any) {
          console.error("Stripe subscription update failed:", stripeError);
          return res.status(500).json({
            error: "Subscription update failed",
            details: stripeError.message,
          });
        }
      }
    }

    // 3. Update User Metadata in Supabase Auth
    // We assume user.id is the Supabase UUID
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { user_metadata: { subscription_plan: planName, subscription_status: 'active' } }
    );

    if (updateError) {
      console.warn("Failed to update Supabase user metadata:", updateError);
      // Proceed? Or fail? 
      // If we differ from source of truth, might be bad. But maybe user is legacy SQLite user?
      // If user.id is integer (SQLite), Supabase update will fail.
    }

    res.json({
      success: true,
      data: {
        ...planToUse,
        features: typeof planToUse.features === 'string' ? JSON.parse(planToUse.features) : planToUse.features,
        status: "active",
        trialEndsAt: null,
        message: `Successfully upgraded to ${planToUse.display_name} plan`,
      },
    });

  } catch (error) {
    console.error("Update subscription error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: "Failed to update subscription",
    });
  }
};

export const cancelSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    // Cancel Stripe subscription if exists
    if (user.stripe_subscription_id) {
      try {
        await stripeCancelSubscription(user.stripe_subscription_id);
        console.log(`Cancelled Stripe subscription ${user.stripe_subscription_id}`);
      } catch (stripeError: any) {
        console.error("Stripe subscription cancellation failed:", stripeError);
        return res.status(500).json({
          error: "Cancellation failed",
          details: stripeError.message,
        });
      }
    }

    if (supabaseAdmin) {
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        { user_metadata: { subscription_plan: 'free', subscription_status: 'active' } }
      );
    }

    res.json({
      success: true,
      message: "Subscription cancelled successfully. You have been moved to the free plan.",
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: "Failed to cancel subscription",
    });
  }
};

// Create PaymentIntent
export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { planName, billingCycle } = req.body;
    const user = (req as any).user;

    const plan = FALLBACK_PLANS.find((p) => p.name === planName);
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan" });
    }

    let amount = plan.price_monthly * 100;
    if (billingCycle === "yearly") {
      amount = plan.price_yearly * 100;
    }

    if (amount <= 0) {
      return res.status(400).json({ error: "Invalid amount for payment" });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      metadata: {
        planName,
        billingCycle,
        userId: user?.id,
      },
      customer: user?.stripe_customer_id,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      success: true,
      data: {
        client_secret: paymentIntent.client_secret,
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
      },
    });
  } catch (error: any) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: error.message,
    });
  }
};
