import { loadStripe } from "@stripe/stripe-js";
import { Check, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useState } from "react";
import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { Badge } from "@/components/ui/badge";
import { BlueprintGrid } from "@/components/ui/BlueprintGrid";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { MeasurementLabel } from "@/components/ui/MeasurementLabel";
import { ROICalculator } from "@/components/ui/roi-calculator";
import { SectionNumber } from "@/components/ui/SectionNumber";
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
      title: "Precision Engineering Hub",
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
      <section className="relative bg-slate-900 dark:bg-[#111827] pt-24 sm:pt-32 pb-20 lg:pt-40 lg:pb-28 overflow-hidden">
        <BlueprintGrid opacity={0.04} />
        <SectionNumber number="01" className="top-8 -left-4 lg:-left-16" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <MeasurementLabel className="block mb-6 text-primary">
            Pricing
          </MeasurementLabel>
          <h1 className="text-[clamp(2.5rem,6vw,4.5rem)] font-black tracking-tight leading-[0.95] text-foreground font-display mb-6">
            Operations + engineering pricing built for HVAC&R growth stages.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Start free with engineering tools, then move into Business Ops when dispatch load and compliance requirements increase.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
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

          <div className="flex justify-center mb-8">
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

          <div className="mx-auto grid max-w-4xl gap-4 md:grid-cols-2">
            <GlassCard variant="default" className="px-5 py-4">
              <MeasurementLabel className="text-primary mb-2 block">
                Engineering Track
              </MeasurementLabel>
              <p className="text-sm text-muted-foreground">
                Free and Pro plans focused on cycle analysis, refrigerant comparison, and field diagnostics.
              </p>
            </GlassCard>
            <GlassCard variant="default" className="px-5 py-4">
              <MeasurementLabel className="text-primary mb-2 block">
                Precision Engineering Hub Track
              </MeasurementLabel>
              <p className="text-sm text-muted-foreground">
                Complete operations & engineering suite, white-labeled apps, and Skool community access.
              </p>
            </GlassCard>
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:py-28 bg-muted/30 relative">
        <SectionNumber number="02" className="top-8 -left-4 lg:-left-16" />
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((plan) => {
              const planData = getPlan(plan.key as keyof typeof PLANS);
              const price =
                planData.price === 0 ? "$0" : `$${planData.price}`;
              const intervalLabel =
                planData.interval === "year" ? "per year" : "per month";

              return (
                <Card
                  key={plan.key}
                  className={`relative flex flex-col bg-gradient-to-b from-card to-card/95 border-border/60 hover:border-primary/30 transition-colors duration-300 ${
                    plan.popular ? "border-primary/50" : ""
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  <CardHeader>
                    <CardTitle className="text-2xl font-semibold font-display">
                      {plan.title}
                    </CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 space-y-4">
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

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm">
            <GlassCard variant="default" className="px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Onboarding support for production rollouts</span>
            </GlassCard>
            <GlassCard variant="default" className="px-5 py-3 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-success" />
              <span className="text-muted-foreground">Cancel or upgrade anytime</span>
            </GlassCard>
          </div>

          <div className="mt-8 text-center text-sm text-muted-foreground">
            Need dispatch or compliance rollout guidance?{" "}
            <Link to="/contact" className="text-primary underline">
              Talk to the ops team
            </Link>
            .
          </div>
        </div>
      </section>

      <section className="px-4 py-20 lg:py-28 bg-muted/30 relative">
        <div className="max-w-6xl mx-auto">
          <ROICalculator />
        </div>
      </section>
    </PublicPageShell>
  );
}