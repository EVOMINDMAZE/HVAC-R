import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Check,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Star,
  Building,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { PLANS, STRIPE_PRICE_IDS } from "@/lib/stripe";
import { ROICalculator } from "@/components/ui/roi-calculator";

// Initialize Stripe (Replace with your Publishable Key)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
);

export default function Pricing() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const handleSubscribe = async (planId: string) => {
    setLoading(planId);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // Get the appropriate price ID based on plan and billing interval
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

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  // Get plans based on billing interval
  const getPlan = (basePlan: keyof typeof PLANS) => {
    if (billingInterval === "yearly" && basePlan === "PRO") {
      return PLANS.PRO_YEARLY;
    }
    if (billingInterval === "yearly" && basePlan === "BUSINESS") {
      return PLANS.BUSINESS_YEARLY;
    }
    return PLANS[basePlan];
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30">
      <Header variant="landing" />

      <main className="flex-grow pt-24 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-[1600px] mx-auto">
          <motion.div
            initial="initial"
            animate="animate"
            variants={fadeInUp}
            className="text-center mb-16 space-y-4"
          >
            <Button
              variant="ghost"
              className="mb-8 hover:bg-transparent hover:text-primary pl-0"
              onClick={() => navigate(isAuthenticated ? "/dashboard" : "/")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Simple, Transparent <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees. Cancel
              anytime.
            </p>

            {/* Billing Interval Toggle */}
            <div className="flex justify-center mt-8">
              <Tabs
                defaultValue="monthly"
                value={billingInterval}
                onValueChange={(value) =>
                  setBillingInterval(value as "monthly" | "yearly")
                }
                className="w-full max-w-sm"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="monthly">Monthly</TabsTrigger>
                  <TabsTrigger value="yearly">
                    Yearly{" "}
                    <Badge className="ml-2 bg-success hover:bg-success/80 text-success-foreground">
                      Save 2 months
                    </Badge>
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Trust Signals */}
            <div className="flex flex-wrap items-center justify-center gap-6 mt-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success" />
                <span>30-Day Money-Back Guarantee</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="h-8 w-auto" viewBox="0 0 50 16" fill="currentColor">
                  <text x="0" y="12" fontSize="10" fontWeight="bold">VISA</text>
                </svg>
                <svg className="h-6 w-auto" viewBox="0 0 40 24" fill="currentColor">
                  <circle cx="20" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                  <circle cx="14" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none"/>
                </svg>
                <span className="text-xs">Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" />
                <span>No Credit Card Required for Trial</span>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full relative overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-mono flex items-center justify-between">
                    Free
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Essential tools for students and hobbyists.
                  </CardDescription>
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-secondary text-xs font-medium text-muted-foreground">
                    Best for Students & Hobbyists
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold font-mono">$0</span>
                    <span className="text-muted-foreground ml-2">
                      / {billingInterval === "yearly" ? "year" : "month"}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {PLANS.FREE.features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-secondary flex items-center justify-center mr-3 shrink-0">
                          <Check className="h-3 w-3 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-8">
                  <Button
                    variant="outline"
                    className="w-full h-12 text-lg"
                    onClick={() => navigate("/signup")}
                  >
                    Get Started Free
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-primary via-primary to-primary opacity-75 blur-sm animate-pulse" />
              <Card className="h-full relative overflow-hidden border-transparent bg-card/90 backdrop-blur-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 border-0 text-primary-foreground px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-mono flex items-center gap-2">
                    Pro
                    <Zap className="h-5 w-5 text-warning fill-warning" />
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    For professional engineers and serious technicians.
                  </CardDescription>
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-xs font-medium text-primary">
                    Best for Professional Engineers
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-5xl font-bold font-mono text-foreground">
                      ${getPlan("PRO").price}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      / {billingInterval === "yearly" ? "year" : "month"}
                      {billingInterval === "yearly" && (
                        <span className="ml-2 text-sm text-success font-medium">
                          (Save ${PLANS.PRO.price * 12 - PLANS.PRO_YEARLY.price})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {getPlan("PRO").features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center mr-3 shrink-0">
                          <Check className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-medium text-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-8">
                  <Button
                    className="w-full h-12 text-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground shadow-lg shadow-primary/25 border-0"
                    onClick={() => handleSubscribe("pro")}
                    disabled={loading === "pro"}
                  >
                    {loading === "pro" ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Upgrade to Pro"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Business Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="relative"
            >
              <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-highlight via-highlight to-highlight opacity-75 blur-sm" />
              <Card className="h-full relative overflow-hidden border-transparent bg-card/90 backdrop-blur-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-gradient-to-r from-highlight to-highlight/80 border-0 text-highlight-foreground px-3 py-1">
                    Business
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold font-mono flex items-center gap-2">
                    Business
                    <Building className="h-5 w-5 text-highlight" />
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Complete "Business in a Box" for HVAC business owners.
                  </CardDescription>
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-highlight/10 text-xs font-medium text-highlight">
                    Best for HVAC Business Owners
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-5xl font-bold font-mono text-foreground">
                      ${getPlan("BUSINESS").price}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      / {billingInterval === "yearly" ? "year" : "month"}
                      {billingInterval === "yearly" && (
                        <span className="ml-2 text-sm text-success font-medium">
                          (Save ${PLANS.BUSINESS.price * 12 - PLANS.BUSINESS_YEARLY.price})
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {getPlan("BUSINESS").features.map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3 shrink-0">
                          <Check className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <span className="font-medium text-foreground">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className="mt-auto pt-8 flex flex-col gap-3">
                  <Button
                    className="w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/25 border-0"
                    onClick={() => handleSubscribe("business")}
                    disabled={loading === "business"}
                  >
                    {loading === "business" ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Get Business Plan"
                    )}
                  </Button>
                  <Link to="/contact" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full h-10 text-sm border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                    >
                      Contact Sales for Custom Pricing
                    </Button>
                  </Link>
                  <p className="text-xs text-muted-foreground text-center">
                    Teams larger than 5 users? We offer custom pricing.
                  </p>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Comparison Table */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-24 max-w-5xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              Compare All Features
            </h2>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              {/* Desktop Table Header */}
              <div className="hidden md:grid grid-cols-4 border-b border-border bg-muted/50">
                <div className="p-4 font-semibold">Feature</div>
                <div className="p-4 text-center font-semibold">Free</div>
                <div className="p-4 text-center font-semibold">Pro</div>
                <div className="p-4 text-center font-semibold">Business</div>
              </div>
              {[
                { name: "Calculations per month", free: "10", pro: "Unlimited", business: "Unlimited" },
                { name: "Calculation History", free: "Limited", pro: "Unlimited", business: "Unlimited" },
                { name: "Advanced Analysis Tools", free: "Basic", pro: "✓ All", business: "✓ All" },
                { name: "PDF Export & Reports", free: "—", pro: "✓ Advanced", business: "✓ Advanced + White-label" },
                { name: "API Access", free: "—", pro: "✓", business: "✓" },
                { name: "Team Collaboration", free: "—", pro: "Basic", business: "✓ Up to 5 users" },
                { name: "Client Portal", free: "—", pro: "—", business: "✓" },
                { name: "Automation Engine", free: "—", pro: "—", business: "✓" },
                { name: "Business Analytics", free: "—", pro: "Basic", business: "✓ Advanced" },
                { name: "Support", free: "Email", pro: "Priority Email", business: "Dedicated + SLA" },
              ].map((row, i) => (
                <div key={i} className={`${i % 2 === 0 ? "bg-card" : "bg-muted/30"} border-b border-border last:border-b-0`}>
                  {/* Mobile Layout */}
                  <div className="md:hidden p-4">
                    <div className="font-medium mb-3">{row.name}</div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Free</div>
                        <div className="font-medium">{row.free}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Pro</div>
                        <div className="font-medium text-primary">{row.pro}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs text-muted-foreground mb-1">Business</div>
                        <div className="font-medium text-highlight">{row.business}</div>
                      </div>
                    </div>
                  </div>
                  {/* Desktop Layout */}
                  <div className="hidden md:grid grid-cols-4">
                    <div className="p-4 font-medium">{row.name}</div>
                    <div className="p-4 text-center">{row.free}</div>
                    <div className="p-4 text-center text-primary font-medium">{row.pro}</div>
                    <div className="p-4 text-center text-highlight font-medium">{row.business}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* ROI Calculator */}
          <ROICalculator />

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="mt-24 max-w-3xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-center mb-8">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I switch plans at any time?",
                  a: "Yes, you can upgrade or downgrade at any time. When upgrading, you'll be charged the prorated difference. When downgrading, changes take effect at the end of your billing cycle."
                },
                {
                  q: "Do you offer discounts for students or non-profits?",
                  a: "Yes! We offer 50% discounts for verified students and educational institutions. Contact our support team for more information."
                },
                {
                  q: "What happens if I exceed my calculation limit on the Free plan?",
                  a: "You'll receive a notification and won't be able to perform additional calculations until the next monthly reset. You can upgrade to Pro for unlimited calculations."
                },
                {
                  q: "Is there a free trial for paid plans?",
                  a: "We offer a 14-day free trial for both Pro and Business plans. No credit card required to start the trial."
                },
                {
                  q: "How does team collaboration work on the Business plan?",
                  a: "The Business plan includes up to 5 user seats. You can invite team members and assign them roles (admin, technician, client). Additional seats can be purchased for $39/month each."
                },
              ].map((faq, i) => (
                <div key={i} className="border border-border rounded-lg p-6 bg-card/50">
                  <h3 className="font-semibold text-lg mb-2">{faq.q}</h3>
                  <p className="text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
}