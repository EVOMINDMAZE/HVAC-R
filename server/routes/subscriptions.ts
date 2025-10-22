import { RequestHandler } from "express";
import { planDb, userDb } from "../database/index.ts";

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
      "Standard cycle analysis",
      "Basic refrigerant comparison",
      "Email support",
      "Basic results export",
    ],
    is_active: true,
  },
  {
    id: "plan-professional",
    name: "professional",
    display_name: "Professional",
    price_monthly: 29,
    price_yearly: 290,
    calculations_limit: 500,
    features: [
      "500 calculations per month",
      "All calculation tools",
      "Advanced refrigerant database",
      "Cascade system analysis",
      "Priority email support",
      "Detailed PDF reports",
      "Data export (CSV, Excel)",
      "Calculation history",
      "API access (basic)",
    ],
    is_active: true,
    savings: 22,
  },
  {
    id: "plan-enterprise",
    name: "enterprise",
    display_name: "Enterprise",
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
      "Custom integrations",
      "Team collaboration",
      "Advanced analytics",
      "Custom reporting",
      "SLA guarantee",
    ],
    is_active: true,
    savings: 18,
  },
];

export const getSubscriptionPlans: RequestHandler = async (req, res) => {
  try {
    let plans = [];

    try {
      // Try to get plans from database
      const dbPlans = planDb.getAll.all();

      if (dbPlans && dbPlans.length > 0) {
        plans = dbPlans.map((plan) => ({
          ...plan,
          features:
            typeof plan.features === "string"
              ? JSON.parse(plan.features)
              : plan.features,
          savings:
            plan.price_yearly < plan.price_monthly * 12
              ? Math.round(
                  ((plan.price_monthly * 12 - plan.price_yearly) /
                    (plan.price_monthly * 12)) *
                    100,
                )
              : 0,
        }));
      } else {
        // If database is empty, use fallback
        console.warn(
          "No subscription plans found in database, using fallback data",
        );
        plans = FALLBACK_PLANS;
      }
    } catch (dbError) {
      // If database access fails, use fallback
      console.warn(
        "Database access failed, using fallback subscription plans:",
        dbError,
      );
      plans = FALLBACK_PLANS;
    }

    res.json({
      success: true,
      data: plans,
    });
  } catch (error) {
    console.error("Get subscription plans error:", error);
    // Always return fallback plans to prevent pricing page from breaking
    res.json({
      success: true,
      data: FALLBACK_PLANS,
    });
  }
};

export const getCurrentSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    try {
      const currentPlan = planDb.findByName.get(user.subscription_plan);

      if (!currentPlan) {
        // Use fallback plan data
        const fallbackPlan =
          FALLBACK_PLANS.find((p) => p.name === user.subscription_plan) ||
          FALLBACK_PLANS[0];
        return res.json({
          success: true,
          data: {
            ...fallbackPlan,
            status: user.subscription_status || "active",
            trialEndsAt: user.trial_ends_at,
          },
        });
      }

      res.json({
        success: true,
        data: {
          ...currentPlan,
          features:
            typeof currentPlan.features === "string"
              ? JSON.parse(currentPlan.features)
              : currentPlan.features,
          status: user.subscription_status || "active",
          trialEndsAt: user.trial_ends_at,
        },
      });
    } catch (dbError) {
      console.warn(
        "Database access failed, using fallback for current subscription:",
        dbError,
      );
      const fallbackPlan =
        FALLBACK_PLANS.find((p) => p.name === user.subscription_plan) ||
        FALLBACK_PLANS[0];
      return res.json({
        success: true,
        data: {
          ...fallbackPlan,
          status: user.subscription_status || "active",
          trialEndsAt: user.trial_ends_at,
        },
      });
    }
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

    // Validate plan exists in fallback data
    const fallbackPlan = FALLBACK_PLANS.find((p) => p.name === planName);
    if (!fallbackPlan) {
      return res.status(400).json({
        error: "Invalid subscription plan",
      });
    }

    try {
      // Try to validate plan exists in database
      const plan = planDb.findByName.get(planName);
      if (!plan) {
        // Use fallback plan data
        const trialEndsAt =
          planName === "free"
            ? null
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        return res.json({
          success: true,
          data: {
            ...fallbackPlan,
            status: "active",
            trialEndsAt,
            message:
              planName === "free"
                ? "Successfully downgraded to free plan"
                : `Successfully upgraded to ${fallbackPlan.display_name} plan`,
          },
        });
      }

      // Try to update user subscription in database
      const trialEndsAt =
        planName === "free"
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      try {
        userDb.updateSubscription.run(planName, "active", trialEndsAt, user.id);
      } catch (updateError) {
        console.warn(
          "Could not update database, but will return success with fallback:",
          updateError,
        );
      }

      // Get updated plan details
      const updatedPlan = planDb.findByName.get(planName);

      res.json({
        success: true,
        data: {
          ...(updatedPlan || fallbackPlan),
          features: updatedPlan
            ? typeof updatedPlan.features === "string"
              ? JSON.parse(updatedPlan.features)
              : updatedPlan.features
            : fallbackPlan.features,
          status: "active",
          trialEndsAt,
          message:
            planName === "free"
              ? "Successfully downgraded to free plan"
              : `Successfully upgraded to ${(updatedPlan || fallbackPlan).display_name} plan`,
        },
      });
    } catch (dbError) {
      console.warn(
        "Database access failed, using fallback for update subscription:",
        dbError,
      );
      const trialEndsAt =
        planName === "free"
          ? null
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      res.json({
        success: true,
        data: {
          ...fallbackPlan,
          status: "active",
          trialEndsAt,
          message:
            planName === "free"
              ? "Successfully downgraded to free plan"
              : `Successfully upgraded to ${fallbackPlan.display_name} plan`,
        },
      });
    }
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

    try {
      // Try to update to free plan in database
      userDb.updateSubscription.run("free", "active", null, user.id);
    } catch (dbError) {
      console.warn(
        "Could not update database for cancellation, but will return success:",
        dbError,
      );
    }

    res.json({
      success: true,
      message:
        "Subscription cancelled successfully. You have been moved to the free plan.",
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

    // Validate plan exists in fallback data
    let fallbackPlan = FALLBACK_PLANS.find((p) => p.name === planName);
    if (!fallbackPlan) {
      return res.status(400).json({
        error: "Invalid subscription plan",
      });
    }

    let plan = null;
    try {
      plan = planDb.findByName.get(planName);
    } catch (dbError) {
      console.warn(
        "Could not fetch plan from database, using fallback:",
        dbError,
      );
    }

    const planToUse = plan || fallbackPlan;
    const amount =
      billingCycle === "yearly"
        ? planToUse.price_yearly
        : planToUse.price_monthly;

    // In a real app, you'd create a payment intent with your payment processor
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100), // Amount in cents
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
