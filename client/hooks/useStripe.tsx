import { useState, useEffect } from "react";
import { stripePromise } from "@/lib/stripe";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { AuthErrorHandler } from "@/utils/authErrorHandler";

interface Subscription {
  id: string;
  status: string;
  current_period_start: number;
  current_period_end: number;
  cancel_at_period_end: boolean;
  plan: string;
  amount: number;
  currency: string;
  interval: string;
}

interface SubscriptionData {
  subscription: Subscription | null;
  plan: string;
  status: string;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, session } = useSupabaseAuth();

  const fetchSubscription = async () => {
    if (!isAuthenticated) {
      setSubscription({ subscription: null, plan: "free", status: "active" });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const token = session?.access_token;

      if (!token) {
        throw new Error("No access token available");
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      if (!supabaseUrl || supabaseUrl === "your-supabase-project-url") {
        setSubscription({ subscription: null, plan: "free", status: "active" });
        setLoading(false);
        return;
      }

      console.log("Fetching subscription from Supabase Edge Function", { supabaseUrl, hasToken: !!token });

      // Add a fetch timeout to avoid hanging requests
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      let response: Response;
      try {
        response = await fetch(
          `${supabaseUrl}/functions/v1/billing/subscription`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
            mode: "cors",
          },
        );
      } catch (fetchErr: any) {
        clearTimeout(timeout);
        console.error("Network error while fetching subscription:", fetchErr);
        // Try fallback to internal server API (/api/subscriptions/current)
        try {
          console.log("Attempting fallback to internal API /api/subscriptions/current");
          const fallbackController = new AbortController();
          const fallbackTimeout = setTimeout(() => fallbackController.abort(), 8000);
          const fallbackResponse = await fetch(`${window.location.origin}/api/subscriptions/current`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: fallbackController.signal,
          });
          clearTimeout(fallbackTimeout);

          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setSubscription(fallbackData);
            return;
          } else {
            console.error("Fallback API responded with non-OK status", fallbackResponse.status);
          }
        } catch (fallbackErr: any) {
          console.error("Fallback attempt failed:", fallbackErr);
        }

        // Final fallback to free plan when network fails
        setSubscription({ subscription: null, plan: "free", status: "active" });
        setError(fetchErr.message || "Network error");
        return;
      } finally {
        clearTimeout(timeout);
      }

      if (!response.ok) {
        // Check for auth-related errors
        if (response.status === 401) {
          AuthErrorHandler.handleAuthError(
            new Error("Unauthorized - invalid token"),
          );
          return;
        }
        let errorMsg = `HTTP ${response.status}: Failed to fetch subscription`;
        try {
          const errData = await response.json();
          console.error("Subscription API error response:", errData);
          errorMsg = errData.error || errData.message || errorMsg;
        } catch (e) {
          console.error("Could not parse error body from subscription endpoint", e);
        }
        setError(errorMsg);
        // Fallback to free plan on server error
        setSubscription({ subscription: null, plan: "free", status: "active" });
        return;
      }

      try {
        const data = await response.json();
        setSubscription(data);
      } catch (parseErr) {
        console.error("Failed to parse subscription response json:", parseErr);
        setSubscription({ subscription: null, plan: "free", status: "active" });
        setError("Failed to parse subscription response");
      }
    } catch (err: any) {
      // Handle auth errors specifically
      if (
        err.message.includes("Invalid Refresh Token") ||
        err.message.includes("Unauthorized")
      ) {
        AuthErrorHandler.handleAuthError(err);
        return;
      }
      setError(err.message);
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
    error,
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
