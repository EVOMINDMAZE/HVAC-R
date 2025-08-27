import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useStripeCheckout, useSubscription } from "@/hooks/useStripe";
import { PLANS, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { apiClient, SubscriptionPlan } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  Check,
  X,
  Zap,
  Users,
  Shield,
  ArrowRight,
  Star,
  TrendingUp,
  BarChart3,
  Mail,
  Phone,
} from "lucide-react";

export function Pricing() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const { createCheckoutSession, loading: checkoutLoading } =
    useStripeCheckout();
  const { subscription } = useSubscription();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly",
  );
  const [currentPlan, setCurrentPlan] = useState<string>("free");

  useEffect(() => {
    fetchPlans();
    if (subscription) {
      setCurrentPlan(subscription.plan);
    }
  }, [subscription]);

  // Fallback subscription plans data when API is unavailable
  const fallbackPlans: SubscriptionPlan[] = [
    {
      id: 1,
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
      id: 2,
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
      id: 3,
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

  const fetchPlans = async () => {
    try {
      const response = await apiClient.getSubscriptionPlans();
      if (response.success && response.data) {
        setPlans(response.data);
      } else {
        // Use fallback data if API fails
        console.warn("API failed, using fallback subscription plans");
        setPlans(fallbackPlans);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
      // Use fallback data when API is unavailable
      console.warn("Using fallback subscription plans due to API error");
      setPlans(fallbackPlans);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planName: string) => {
    if (!isAuthenticated) {
      addToast({
        type: "info",
        title: "Sign in Required",
        description: "Please sign in to upgrade your subscription",
      });
      navigate("/signin");
      return;
    }

    if (planName === "free") {
      addToast({
        type: "info",
        title: "Free Plan",
        description: "You are already on the free plan",
      });
      return;
    }

    const userCurrentPlan = subscription?.plan || "free";
    if (planName === userCurrentPlan) {
      addToast({
        type: "info",
        title: "Already Subscribed",
        description: `You're already on the ${planName} plan`,
      });
      return;
    }

    try {
      // Get the appropriate Stripe price ID
      let priceId = "";

      console.log("Available Stripe Price IDs:", STRIPE_PRICE_IDS);
      console.log("Selected plan:", planName, "Billing cycle:", billingCycle);

      if (planName === "professional") {
        priceId =
          billingCycle === "yearly"
            ? STRIPE_PRICE_IDS.PROFESSIONAL_YEARLY
            : STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY;
      } else if (planName === "enterprise") {
        priceId =
          billingCycle === "yearly"
            ? STRIPE_PRICE_IDS.ENTERPRISE_YEARLY
            : STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY;
      }

      console.log("Selected price ID:", priceId);

      if (!priceId) {
        throw new Error("Invalid plan selected");
      }

      console.log(
        "Attempting to create checkout session with priceId:",
        priceId,
      );
      await createCheckoutSession(priceId);
    } catch (error: any) {
      console.error("Subscription error:", error);
      addToast({
        type: "error",
        title: "Subscription Failed",
        description: error.message || "Failed to start subscription process",
      });
    }
  };

  const getPlanIcon = (planName: string) => {
    switch (planName) {
      case "free":
        return <Calculator className="h-8 w-8" />;
      case "professional":
        return <Zap className="h-8 w-8" />;
      case "enterprise":
        return <Shield className="h-8 w-8" />;
      default:
        return <Calculator className="h-8 w-8" />;
    }
  };

  const getPlanColor = (planName: string) => {
    switch (planName) {
      case "free":
        return "from-gray-600 to-gray-700";
      case "professional":
        return "from-blue-600 to-indigo-600";
      case "enterprise":
        return "from-purple-600 to-pink-600";
      default:
        return "from-gray-600 to-gray-700";
    }
  };

  const getPrice = (plan: SubscriptionPlan) => {
    return billingCycle === "yearly" ? plan.price_yearly : plan.price_monthly;
  };

  const getMonthlyPrice = (plan: SubscriptionPlan) => {
    return billingCycle === "yearly"
      ? plan.price_yearly / 12
      : plan.price_monthly;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-blue-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-blue-900">Simulateon</h1>
          </Link>
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <Button onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Choose Your
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {" "}
              Engineering Plan
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Professional HVAC&R calculations for every engineer. Start free,
            upgrade when you need more power.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center mb-12">
            <Tabs
              value={billingCycle}
              onValueChange={(value) =>
                setBillingCycle(value as "monthly" | "yearly")
              }
            >
              <TabsList className="grid w-fit grid-cols-2 bg-white border border-blue-200">
                <TabsTrigger
                  value="monthly"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Monthly
                </TabsTrigger>
                <TabsTrigger
                  value="yearly"
                  className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                >
                  Yearly
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Badge
              variant="secondary"
              className={`ml-4 bg-green-100 text-green-700 ${billingCycle === "yearly" ? "" : "invisible"}`}
            >
              Save up to 17%
            </Badge>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative bg-white shadow-xl border-2 ${
                plan.name === "professional"
                  ? "border-blue-500 ring-4 ring-blue-100"
                  : "border-gray-200"
              } hover:shadow-2xl transition-all duration-300`}
            >
              {plan.name === "professional" && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white px-4 py-1 text-sm">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader
                className={`bg-gradient-to-r ${getPlanColor(plan.name)} text-white text-center py-8`}
              >
                <div className="flex justify-center mb-4">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="text-2xl font-bold">
                  {plan.display_name}
                </CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">
                    ${getMonthlyPrice(plan).toFixed(0)}
                  </span>
                  <span className="text-lg opacity-80">/month</span>
                  {billingCycle === "yearly" && plan.price_yearly > 0 && (
                    <div className="text-sm opacity-80 mt-1">
                      Billed ${plan.price_yearly.toFixed(0)} annually
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="p-8">
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Calculations/month</span>
                    <span className="font-bold text-blue-600">
                      {plan.calculations_limit === -1
                        ? "Unlimited"
                        : plan.calculations_limit}
                    </span>
                  </div>

                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => handleSubscribe(plan.name)}
                  disabled={plan.name === currentPlan || checkoutLoading}
                  className={`w-full ${
                    plan.name === currentPlan
                      ? "bg-gray-400 cursor-not-allowed"
                      : plan.name === "professional"
                        ? "bg-blue-600 hover:bg-blue-700"
                        : "bg-gray-800 hover:bg-gray-900"
                  } text-white py-3`}
                >
                  {checkoutLoading ? (
                    "Processing..."
                  ) : plan.name === currentPlan ? (
                    "Current Plan"
                  ) : plan.name === "free" ? (
                    "Get Started Free"
                  ) : (
                    <>
                      Upgrade to {plan.display_name}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {plan.name === "enterprise" && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    <p>Need custom features?</p>
                    <Link
                      to="/contact"
                      className="text-blue-600 hover:underline"
                    >
                      Contact Sales
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            Feature Comparison
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6 font-semibold">
                    Features
                  </th>
                  {plans.map((plan) => (
                    <th
                      key={plan.name}
                      className="text-center py-4 px-6 font-semibold"
                    >
                      {plan.display_name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    feature: "Standard Cycle Analysis",
                    free: true,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "Refrigerant Comparison",
                    free: false,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "Cascade Cycle Analysis",
                    free: false,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "Calculation History",
                    free: false,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "Export to PDF/Excel",
                    free: false,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "Priority Support",
                    free: false,
                    pro: true,
                    enterprise: true,
                  },
                  {
                    feature: "API Access",
                    free: false,
                    pro: false,
                    enterprise: true,
                  },
                  {
                    feature: "Team Collaboration",
                    free: false,
                    pro: false,
                    enterprise: true,
                  },
                  {
                    feature: "Custom Integrations",
                    free: false,
                    pro: false,
                    enterprise: true,
                  },
                ].map((row, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium">{row.feature}</td>
                    <td className="py-4 px-6 text-center">
                      {row.free ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.pro ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {row.enterprise ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : (
                        <X className="h-5 w-5 text-gray-400 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-16">
          <h3 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                q: "Can I change my plan at any time?",
                a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.",
              },
              {
                q: "What happens to my data if I downgrade?",
                a: "Your calculation history is always preserved. However, you may have limited access to certain features based on your plan.",
              },
              {
                q: "Do you offer refunds?",
                a: "We offer a 30-day money-back guarantee on all paid plans. Contact us if you're not satisfied.",
              },
              {
                q: "Is there a free trial?",
                a: "Yes! All paid plans come with a 30-day free trial. No credit card required to start.",
              },
              {
                q: "How accurate are the calculations?",
                a: "Our calculations use industry-standard NIST REFPROP data and are validated against real-world systems.",
              },
              {
                q: "Do you offer volume discounts?",
                a: "Yes! Contact our sales team for custom pricing on Enterprise plans with multiple users.",
              },
            ].map((faq, index) => (
              <div key={index} className="space-y-2">
                <h4 className="font-semibold text-lg">{faq.q}</h4>
                <p className="text-gray-600">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl mb-8 opacity-90">
            Join thousands of engineers using Simulateon for professional HVAC&R
            calculations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup">
              <Button
                size="lg"
                variant="secondary"
                className="text-lg px-8 py-4"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-4 bg-transparent border-white text-white hover:bg-white hover:text-blue-600"
              >
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
