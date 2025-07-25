import { RequestHandler } from "express";
import { planDb, userDb } from "../database/index.ts";

export const getSubscriptionPlans: RequestHandler = async (req, res) => {
  try {
    const plans = planDb.getAll.all();
    
    const formattedPlans = plans.map(plan => ({
      ...plan,
      features: JSON.parse(plan.features),
      savings: plan.price_yearly < (plan.price_monthly * 12) 
        ? Math.round(((plan.price_monthly * 12 - plan.price_yearly) / (plan.price_monthly * 12)) * 100)
        : 0
    }));

    res.json({
      success: true,
      data: formattedPlans
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to retrieve subscription plans'
    });
  }
};

export const getCurrentSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const currentPlan = planDb.findByName.get(user.subscription_plan);

    if (!currentPlan) {
      return res.status(404).json({
        error: 'Subscription plan not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...currentPlan,
        features: JSON.parse(currentPlan.features),
        status: user.subscription_status,
        trialEndsAt: user.trial_ends_at
      }
    });

  } catch (error) {
    console.error('Get current subscription error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to retrieve current subscription'
    });
  }
};

export const updateSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;
    const { planName, billingCycle } = req.body;

    // Validate plan exists
    const plan = planDb.findByName.get(planName);
    if (!plan) {
      return res.status(400).json({
        error: 'Invalid subscription plan'
      });
    }

    // For now, we'll simulate payment processing
    // In a real app, you'd integrate with Stripe, PayPal, etc.
    
    // Update user subscription
    const trialEndsAt = planName === 'free' ? null : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    
    userDb.updateSubscription.run(
      planName,
      'active',
      trialEndsAt,
      user.id
    );

    // Get updated plan details
    const updatedPlan = planDb.findByName.get(planName);

    res.json({
      success: true,
      data: {
        ...updatedPlan,
        features: JSON.parse(updatedPlan.features),
        status: 'active',
        trialEndsAt,
        message: planName === 'free' 
          ? 'Successfully downgraded to free plan' 
          : `Successfully upgraded to ${updatedPlan.display_name} plan`
      }
    });

  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to update subscription'
    });
  }
};

export const cancelSubscription: RequestHandler = async (req, res) => {
  try {
    const user = (req as any).user;

    // Update to free plan
    userDb.updateSubscription.run(
      'free',
      'active',
      null,
      user.id
    );

    res.json({
      success: true,
      message: 'Subscription cancelled successfully. You have been moved to the free plan.'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to cancel subscription'
    });
  }
};

// Mock payment intent for demo purposes
export const createPaymentIntent: RequestHandler = async (req, res) => {
  try {
    const { planName, billingCycle } = req.body;
    
    const plan = planDb.findByName.get(planName);
    if (!plan) {
      return res.status(400).json({
        error: 'Invalid subscription plan'
      });
    }

    const amount = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // In a real app, you'd create a payment intent with your payment processor
    const mockPaymentIntent = {
      id: `pi_mock_${Date.now()}`,
      client_secret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
      amount: Math.round(amount * 100), // Amount in cents
      currency: 'usd',
      status: 'requires_payment_method'
    };

    res.json({
      success: true,
      data: mockPaymentIntent
    });

  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: 'Failed to create payment intent'
    });
  }
};
