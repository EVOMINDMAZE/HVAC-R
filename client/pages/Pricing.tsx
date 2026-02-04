import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Check,
  Loader2,
  ShieldCheck,
  ArrowLeft,
  Zap,
  Star,
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
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Initialize Stripe (Replace with your Publishable Key)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder",
);

export default function Pricing() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [billingInterval, setBillingInterval] = useState<"monthly" | "yearly">(
    "monthly",
  );

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // HVAC-R Pro Monthly Subscription ($29.99)
      const PRICE_ID = "price_1RoubeDEMsXB9pF0W6wzgCFX";

      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade your plan.",
        });
        navigate("/signin"); // Redirect to sign in if not authenticated
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
          body: JSON.stringify({ priceId: PRICE_ID }),
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
      setLoading(false);
    }
  };

  const fadeInUp = {
    initial: { opacity: 0, y: 30 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5, ease: "easeOut" },
  };

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500/30">
      <Header variant="landing" />

      <main className="flex-grow pt-24 pb-20 px-4 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute top-0 inset-x-0 h-[600px] bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/10 dark:to-transparent pointer-events-none -z-10" />
        <div className="absolute top-[10%] right-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[10%] left-[-10%] w-[600px] h-[600px] bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />

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
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-orange-700">
                Pricing
              </span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs. No hidden fees. Cancel
              anytime.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Free Plan */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="h-full relative overflow-hidden border-border bg-card/50 backdrop-blur-sm hover:shadow-xl hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center justify-between">
                    Starter
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    Essential tools for students and hobbyists.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-4xl font-bold">$0</span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Standard Vapor Compression Cycles",
                      "Basic Interactive Charts",
                      "Limited Calculation History",
                      "Community Support",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mr-3 shrink-0">
                          <Check className="h-3 w-3 text-slate-600 dark:text-slate-400" />
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
                    disabled
                  >
                    Current Plan
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>

            {/* Pro Plan */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="relative"
            >
              <div className="absolute -inset-[2px] rounded-[22px] bg-gradient-to-r from-slate-600 via-orange-600 to-slate-600 opacity-75 blur-sm animate-pulse" />
              <Card className="h-full relative overflow-hidden border-transparent bg-background/90 backdrop-blur-xl transition-all duration-300">
                <div className="absolute top-0 right-0 p-4">
                  <Badge className="bg-gradient-to-r from-slate-600 to-orange-600 border-0 text-white px-3 py-1">
                    Most Popular
                  </Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    Professional
                    <Zap className="h-5 w-5 text-amber-400 fill-amber-400" />
                  </CardTitle>
                  <CardDescription className="text-base mt-2">
                    For professional engineers and serious technicians.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <span className="text-5xl font-bold text-foreground">
                      $29
                    </span>
                    <span className="text-muted-foreground ml-2">/ month</span>
                  </div>
                  <div className="space-y-4">
                    {[
                      "Advanced Multi-Stage Systems",
                      "Unlimited Calculation History",
                      "Professional PDF Reports & Exports",
                      "Team Collaboration Tools",
                      "Priority Email Support",
                      "Cloud Synchronization",
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center">
                        <div className="h-5 w-5 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mr-3 shrink-0">
                          <Check className="h-3 w-3 text-orange-600 dark:text-orange-400" />
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
                    className="w-full h-12 text-lg bg-gradient-to-r from-slate-600 to-orange-600 hover:from-slate-700 hover:to-orange-700 text-white shadow-lg shadow-orange-500/25 border-0"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      "Upgrade to Pro"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>

          {/* Trusted by section removed until specific partnerships are established */}
        </div>
      </main>
      <Footer />
    </div>
  );
}
