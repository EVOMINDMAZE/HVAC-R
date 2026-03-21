import { loadStripe } from "@stripe/stripe-js";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ROICalculator } from "@/components/ui/roi-calculator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";
import { PLANS, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { supabase } from "@/lib/supabase";

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
);

export default function Pricing() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );

  useEffect(() => {
    trackMarketingEvent("pricing_view", { section: "hero" });
  }, []);

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      let priceId = "";
      if (planId === "pro" && billingInterval === "monthly") {
        priceId = STRIPE_PRICE_IDS.PROFESSIONAL_MONTHLY;
      } else if (planId === "pro" && billingInterval === "yearly") {
        priceId = STRIPE_PRICE_IDS.PROFESSIONAL_YEARLY;
      } else if (planId === "business" && billingInterval === "monthly") {
        priceId = STRIPE_PRICE_IDS.ENTERPRISE_MONTHLY;
      } else if (planId === "business" && billingInterval === "yearly") {
        priceId = STRIPE_PRICE_IDS.ENTERPRISE_YEARLY;
      } else {
        throw new Error("Invalid plan selection");
      }

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (!session || sessionError) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade your plan.",
        });
        navigate("/signin");
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ priceId }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const result = await stripe.redirectToCheckout({ sessionId });

      if (result.error) {
        throw new Error(result.error.message);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description:
          error.message || "Could not initiate checkout. Please try again.",
      });
    } finally {
      setLoading(null);
    }
  };

  const getPlan = (basePlan: keyof typeof PLANS) => {
    if (billingInterval === "yearly" && basePlan === "PRO") {
      return PLANS.PRO_YEARLY;
    }
    if (billingInterval === "yearly" && basePlan === "BUSINESS") {
      return PLANS.BUSINESS_YEARLY;
    }
    return PLANS[basePlan];
  };

  const plans = [
    {
      key: "FREE",
      title: "Engineering Free",
      description: "For entrepreneurs and teams starting with core HVAC&R analysis.",
      cta: "Start Free",
      action: () => navigate("/signup"),
      popular: false,
    },
    {
      key: "BUSINESS",
      title: "Business in a Box",
      description: "Complete operations & engineering suite. Skool access, white-label app & automation.",
      cta: "Start Free Trial",
      action: () => handleSubscribe("business"),
      popular: true,
    },
    {
      key: "PRO",
      title: "Engineering Pro",
      description: "For technicians and engineers who need advanced cycle and refrigerant tools.",
      cta: "Upgrade to Pro",
      action: () => handleSubscribe("pro"),
      popular: false,
    },
  ] as const;

  return (
    <PublicPageShell mainClassName="pb-20">
      {/* Hero Section */}
      <section className="relative bg-slate-900 dark:bg-[#111827] pt-20 sm:pt-28 pb-16 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">Pricing</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold font-display">
              Operations + engineering pricing built for HVAC&R growth stages.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Start free with engineering tools, then move into Business Ops when dispatch load and compliance requirements increase.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => {
                  trackMarketingEvent("pricing_plan_cta_click", {
                    section: "hero",
                    plan: "engineering_free",
                    destination: "/signup",
                  });
                  navigate("/signup");
                }}
              >
                Start Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => {
                  trackMarketingEvent("pricing_plan_cta_click", {
                    section: "hero",
                    plan: "ops_demo",
                    destination: "/contact",
                  });
                  navigate("/contact");
                }}
              >
                Book Ops Demo
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Same two next steps as the storefront: start free now or book an operations demo for rollout planning.
            </p>

            <div className="mx-auto mt-7 grid max-w-4xl gap-3 text-left md:grid-cols-2">
              <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Engineering Track
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Free and Pro plans focused on cycle analysis, refrigerant comparison, and field diagnostics.
                </p>
              </div>
              <div className="rounded-xl border border-border/70 bg-card/70 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Business in a Box Track
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Complete operations & engineering suite, white-labeled apps, and Skool community access.
                </p>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Tabs
                defaultValue="monthly"
                value={billingInterval}
                onValueChange={(value) => {
                  const interval = value as "monthly" | "yearly";
                  setBillingInterval(interval);
                  trackMarketingEvent("pricing_interval_toggle", {
                    section: "billing_interval",
                    segment: interval,
                  });
                }}
                className="w-full max-w-sm"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">
                    Yearly
                    <Badge className="ml-2 bg-success text-success-foreground">
                      Save 2 months
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span>Onboarding support for production rollouts</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span>Cancel or upgrade anytime</span>
              </div>
	        </div>
	      </div>
      </section>

        <section className="px-4 py-16 bg-muted/30 relative">
          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const planData = getPlan(plan.key as keyof typeof PLANS);
              const price =
                planData.price === 0 ? "$0" : `$${planData.price}`;
              const intervalLabel =
                planData.interval === "year" ? "per year" : "per month";

              return (
                <Card
                  key={plan.key}
                  className={`border-border/60 bg-card/50 backdrop-blur-sm hover:-translate-y-1 transition-all hover:shadow-lg ${
                    plan.popular ? "shadow-lg border-primary/50" : ""
                  }`}
                >
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold font-display">
                      {plan.title}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-4xl font-semibold text-foreground font-display">
                        {price}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {plan.key === "FREE" ? "" : intervalLabel}
                      </div>
                    </div>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      {planData.features.slice(0, 6).map((feature) => {
                        const isHighlighted =
                          feature.includes("Skool Community Access") ||
                          feature.includes("White-labeled Pro App") ||
                          feature.includes("Automation Engine");

                        return (
                          <li key={feature} className="flex items-start gap-2">
                            {isHighlighted ? (
                              <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                            ) : (
                              <Check className="h-4 w-4 text-success mt-0.5" />
                            )}
                            <span className={isHighlighted ? "text-foreground font-medium" : ""}>
                              {feature}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => {
                        trackMarketingEvent("pricing_plan_cta_click", {
                          section: "plan_card",
                          plan: plan.key.toLowerCase(),
                          destination:
                            plan.key === "BUSINESS"
                              ? "/contact"
                              : plan.key === "FREE"
                                ? "/signup"
                                : "stripe_checkout",
                        });
                        plan.action();
                      }}
                      disabled={loading === plan.key.toLowerCase()}
                    >
                      {loading === plan.key.toLowerCase() ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        plan.cta
                      )}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="max-w-6xl mx-auto mt-8 text-sm text-muted-foreground">
            Need dispatch or compliance rollout guidance?{" "}
            <Link to="/contact" className="text-primary underline">
              Talk to the ops team
            </Link>
            .
          </div>
        </section>

        <section className="px-4 py-16 bg-muted/30 relative">
          <div className="max-w-6xl mx-auto">
            <ROICalculator />
          </div>
        </section>
    </PublicPageShell>
  );
}
