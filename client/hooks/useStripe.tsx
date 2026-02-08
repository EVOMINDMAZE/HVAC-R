import { useState, useEffect } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { stripePromise } from "@/lib/stripe";

interface StripeSubscription {
  id?: string;
  status?: string;
  plan?: string;
  amount?: number;
  interval?: string;
  current_period_end?: number;
  cancel_at_period_end?: boolean;
  [key: string]: any;
}

interface SubscriptionData {
  subscription: StripeSubscription | null;
  plan: string;
  status: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, session } = useSupabaseAuth();

  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription({ subscription: null, plan: "free", status: "active" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const billingEnabled = import.meta.env.VITE_BILLING_ENABLED === "true";
      if (!billingEnabled) {
        setSubscription({ subscription: null, plan: "free", status: "active" });
        return;
      }

      const token = session?.access_token;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!token || !supabaseUrl || supabaseUrl.includes("your-supabase")) {
        setSubscription({ subscription: null, plan: "free", status: "active" });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(
        `${supabaseUrl}/functions/v1/billing/subscription`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        },
      );

      clearTimeout(timeout);

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
      } else {
        setSubscription({ subscription: null, plan: "free", status: "active" });
      }
    } catch (err) {
      console.warn("Subscription fetch failed, using free plan:", err);
      setSubscription({ subscription: null, plan: "free", status: "active" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, [isAuthenticated]);

  return {
    subscription,
    loading,
    refetch: fetchSubscription,
  };
}

export function useStripeCheckout() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSupabaseAuth();

  const createCheckoutSession = async (priceId: string) => {
    try {
      setLoading(true);
      setError(null);

      const token = session?.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      console.log("Making API call to create-checkout-session with:", {
        priceId,
        hasToken: !!token,
        supabaseUrl,
        fullUrl: `${supabaseUrl}/functions/v1/billing/create-checkout-session`,
      });

      if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
        throw new Error(
          "Supabase is not configured yet. Please set VITE_SUPABASE_URL and deploy the Edge Functions.",
        );
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/billing/create-checkout-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ priceId }),
        },
      );

      console.log("API response status:", response.status);
      console.log("API response ok:", response.ok);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: Failed to create checkout session`;
        try {
          const errorData = await response.json();
          console.error("API Error Response:", errorData);
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, try to get text
          try {
            const errorText = await response.text();
            console.error("API Error Text:", errorText);
            errorMessage = errorText || errorMessage;
          } catch (textError) {
            console.error("Could not parse error response:", textError);
          }
        }
        throw new Error(errorMessage);
      }

      const responseData = await response.json();
      console.log("API Response data:", responseData);

      const { sessionId } = responseData;

      if (!sessionId) {
        throw new Error("No session ID received from server");
      }

      const stripe = await stripePromise;
      if (!stripe) {
        throw new Error("Stripe not loaded");
      }

      console.log("Redirecting to Stripe checkout with sessionId:", sessionId);
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error("Stripe checkout error:", error);
        throw new Error(error.message);
      }
    } catch (err: any) {
      console.error("Checkout session error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    createCheckoutSession,
    loading,
    error,
  };
}

export function useCustomerPortal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { session } = useSupabaseAuth();

  const openCustomerPortal = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = session?.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
        throw new Error(
          "Supabase is not configured yet. Please set VITE_SUPABASE_URL and deploy the Edge Functions.",
        );
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/billing/create-portal-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (!response.ok) {
        throw new Error("Failed to create portal session");
      }

      const { url } = await response.json();
      window.location.href = url;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    openCustomerPortal,
    loading,
    error,
  };
}
