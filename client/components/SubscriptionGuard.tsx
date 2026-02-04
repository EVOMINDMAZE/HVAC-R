import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

interface SubscriptionGuardProps {
  children?: React.ReactNode;
  requiredTier?: string; // e.g. "pro", "business" - currently unused but enabling prop
}

export function SubscriptionGuard({
  children,
  requiredTier,
}: SubscriptionGuardProps) {
  const { user } = useSupabaseAuth();
  const [loading, setLoading] = useState(true);
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    async function checkSubscription() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("subscriptions")
          .select("status")
          .eq("user_id", user.id)
          .single();

        if (error && error.code !== "PGRST116") {
          console.error("Error checking subscription:", error);
        }

        // Check if status is active or trialing
        setHasSubscription(data?.status === "active");
      } catch (err) {
        console.error("Failed to check subscription:", err);
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

  if (!hasSubscription) {
    return <Navigate to="/pricing" replace />;
  }

  // Support both Wrapper (children) and Outlet (Route) patterns
  return children ? <>{children}</> : <Outlet />;
}
