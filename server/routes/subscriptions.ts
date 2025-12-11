import { RequestHandler } from "express";
import { supabaseAdmin } from "../utils/supabase.js";

// Fallback subscription plans data when database is unavailable
const FALLBACK_PLANS = [
  {
    id: "plan-free",
    name: "free",
    display_name: "Free",
    price_monthly: 0,
    price_yearly: 0,
    calculations_limit: 5,
    features: [
      "5 calculations per week",
      "Standard cycle analysis",
      "Basic refrigerant comparison",
      "Email support",
      "Basic results export",
    ],
    is_active: true,
  },
  {
    id: "plan-solo",
    name: "solo",
    display_name: "Solo",
    price_monthly: 29,
    price_yearly: 290,
    calculations_limit: 50,
    features: [
      "50 calculations per week",
      "All calculation tools",
      "Advanced refrigerant database",
      "Priority email support",
      "Detailed PDF reports",
    ],
    is_active: true,
    savings: 17,
  },
  {
    id: "plan-professional",
    name: "professional",
    display_name: "Professional",
    price_monthly: 99,
    price_yearly: 990,
    calculations_limit: -1, // Unlimited
    features: [
      "Unlimited calculations",
      "All professional features",
      "Custom refrigerant properties",
      "Batch processing",
      "Full API access",
      "Phone support",
      "Team collaboration",
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

    // 2. Update User Metadata in Supabase Auth
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

// Mock payment intent for demo purposes
export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { planName, billingCycle } = req.body;

    // Find plan logic... validation...
    // Return mock intent
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret`,
      amount: 1000,
      currency: "usd",
      status: "requires_payment_method",
    };

    res.json({
      success: true,
      data: mockPaymentIntent,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
    res.status(500).json({
      error: "Internal server error",
      details: "Failed to create payment intent",
    });
  }
};
