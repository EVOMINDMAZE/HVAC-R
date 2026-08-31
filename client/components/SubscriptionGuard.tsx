import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";

interface SubscriptionGuardProps {
  children?: React.ReactNode;
  requiredTier?: string; // e.g. "free", "pro", "business"
}

const TIER_HIERARCHY = {
  free: 0,
  pro: 1,
  business: 2,
};

function getTierLevel(tier: string | undefined): number {
  if (!tier) return TIER_HIERARCHY.free;
  const normalized = tier.toLowerCase();
  return TIER_HIERARCHY[normalized as keyof typeof TIER_HIERARCHY] ?? TIER_HIERARCHY.free;
}

function meetsTierRequirement(userTier: string | undefined, requiredTier: string | undefined): boolean {
  if (!requiredTier) return true; // No tier requirement
  const userLevel = getTierLevel(userTier);
  const requiredLevel = getTierLevel(requiredTier);
  return userLevel >= requiredLevel;
}

export function SubscriptionGuard({
  children,
  requiredTier,
}: SubscriptionGuardProps) {
  const { user } = useSupabaseAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [userTier, setUserTier] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Try to get subscription with plan from subscriptions table
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from("subscriptions")
          .select("status, plan")
          .eq("user_id", user.id)
          .single();

        let tier = "free";

        // Helper to map plan name to tier
        const planToTier = (plan: string | undefined): string => {
          if (!plan) return "free";
          const normalized = plan.toLowerCase();
          // Map old plan names to new tiers
          if (normalized === "pro" || normalized === "professional" || normalized === "solo") {
            return "pro";
          }
          if (normalized === "business" || normalized === "enterprise") {
            return "business";
          }
          // Default mapping
          if (normalized === "free") return "free";
          // Unrecognized plan: never grant a paid tier by default.
          return "free";
        };

        if (!subscriptionError && subscriptionData) {
          // User has a subscription record
          if (subscriptionData.status === "active") {
            tier = planToTier(subscriptionData.plan);
          }
        } else {
          // Fallback to user metadata
          const userPlan = user.user_metadata?.subscription_plan;
          tier = planToTier(userPlan);
        }

        setUserTier(tier);
      } catch (err) {
        console.error("Failed to check subscription:", err);
        setUserTier("free");
      } finally {
        setLoading(false);
      }
    }

    checkSubscription();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
      </div>
    );
  }

  // Check if user meets tier requirement
  const hasRequiredTier = meetsTierRequirement(userTier, requiredTier);

  if (!hasRequiredTier) {
    // Explain the paywall instead of silently bouncing the user.
    return (
      <Navigate
        to="/pricing"
        replace
        state={{ requiredTier, userTier, from: location.pathname }}
      />
    );
  }

  // Support both Wrapper (children) and Outlet (Route) patterns
  return children ? <>{children}</> : <Outlet />;
}
