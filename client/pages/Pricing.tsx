import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Check, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

// Initialize Stripe (Replace with your Publishable Key)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_placeholder");

export default function Pricing() {
  const { user, isAuthenticated } = useSupabaseAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const stripe = await stripePromise;
      if (!stripe) throw new Error("Stripe failed to load");

      // HVAC-R Pro Monthly Subscription ($29.99)
      const PRICE_ID = "price_1RoubeDEMsXB9pF0W6wzgCFX";

      const { data: { session }, error } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please sign in to upgrade your plan.",
        });
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
        }
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
        description: error.message || "Could not initiate checkout. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Header variant="landing" />

      {/* Warm/Thermo Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-100/50 blur-[100px] animate-pulse" />
        <div className="absolute top-[20%] right-[-5%] w-[30%] h-[30%] rounded-full bg-red-100/40 blur-[100px] animate-pulse delay-1000" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-indigo-100/30 blur-[100px] animate-pulse delay-2000" />
      </div>

      <div className="relative z-10 w-full px-4 py-8 md:py-12">
        <div className="mx-auto max-w-5xl">
          <Button
            variant="ghost"
            className="mb-8 pl-0 hover:bg-transparent hover:text-blue-600"
            onClick={() => navigate(isAuthenticated ? '/dashboard' : '/')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <div className="text-center">
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Upgrade to <span className="text-blue-600">Pro</span>
            </h1>
            <p className="mb-12 text-lg text-slate-600 md:text-xl">
              Unlock professional tools to manage jobs, generate reports, and grow your HVAC business.
            </p>

            <div className="grid gap-8 md:grid-cols-2 lg:gap-12 mt-16 max-w-4xl mx-auto">
              {/* Free Plan */}
              <Card className="relative flex flex-col border-slate-200 shadow-sm transition-all hover:shadow-md bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Starter</CardTitle>
                  <CardDescription>Essential tools for every technician</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6 text-4xl font-bold text-slate-900">$0<span className="text-lg font-normal text-slate-500">/mo</span></div>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center text-slate-600">
                      <Check className="mr-2 h-5 w-5 text-green-500" />
                      Standard Superheat/Subcool
                    </li>
                    <li className="flex items-center text-slate-600">
                      <Check className="mr-2 h-5 w-5 text-green-500" />
                      Airflow Calculator
                    </li>
                    <li className="flex items-center text-slate-600">
                      <Check className="mr-2 h-5 w-5 text-green-500" />
                      Basic History (Local)
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled>Current Plan</Button>
                </CardFooter>
              </Card>

              {/* Pro Plan */}
              <Card className="relative flex flex-col border-blue-200 bg-blue-50/50 shadow-lg ring-1 ring-blue-200 transition-all hover:shadow-xl overflow-visible backdrop-blur-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-blue-600 px-4 py-1 text-sm font-medium text-white shadow-md z-10">
                  Most Popular
                </div>
                <CardHeader>
                  <CardTitle className="text-2xl text-blue-900">Professional</CardTitle>
                  <CardDescription className="text-blue-700">For serious HVAC businesses</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6 text-4xl font-bold text-blue-900">$29<span className="text-lg font-normal text-blue-600">/mo</span></div>
                  <ul className="space-y-3 text-left">
                    <li className="flex items-center text-slate-700">
                      <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                      <strong>Job Management</strong> (Clients, Status)
                    </li>
                    <li className="flex items-center text-slate-700">
                      <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                      <strong>PDF Reports</strong> & Export
                    </li>
                    <li className="flex items-center text-slate-700">
                      <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                      Cloud Sync & Backup
                    </li>
                    <li className="flex items-center text-slate-700">
                      <ShieldCheck className="mr-2 h-5 w-5 text-blue-600" />
                      Priority Support
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    className="w-full bg-blue-600 text-lg hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                    size="lg"
                    onClick={handleSubscribe}
                    disabled={loading}
                  >
                    {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "Upgrade Now"}
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
