import { useState, useEffect } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useSupabaseCalculations } from "./useSupabaseCalculations";
import { useSubscription } from "./useStripe";
import { UserStats } from "@/lib/api";

export function useUserStats() {
  const { isAuthenticated } = useSupabaseAuth();
  const { calculations } = useSupabaseCalculations();
  const { subscription } = useSubscription();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [isAuthenticated, calculations, subscription]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Calculate real stats from Supabase data
      const totalCalculations = calculations.length;
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyCalculations = calculations.filter((calc) => {
        const calcDate = new Date(calc.created_at);
        return (
          calcDate.getMonth() === currentMonth &&
          calcDate.getFullYear() === currentYear
        );
      }).length;

      // Get real subscription data from Stripe
      const plan = subscription?.plan || "free";
      const isUnlimited = plan !== "free";
      const limit = isUnlimited ? -1 : 10;
      const remaining = isUnlimited
        ? -1
        : Math.max(0, 10 - monthlyCalculations);

      // Calculate usage by type from real calculations
      const usageByType = calculations.reduce((acc: any[], calc) => {
        const existing = acc.find(
          (item) => item.type === calc.calculation_type,
        );
        if (existing) {
          existing.count++;
        } else {
          acc.push({ type: calc.calculation_type, count: 1 });
        }
        return acc;
      }, []);

      const realStats: UserStats = {
        totalCalculations,
        monthlyCalculations,
        usageByType,
        subscription: {
          plan: plan.charAt(0).toUpperCase() + plan.slice(1),
          limit,
          remaining,
        },
      };

      setStats(realStats);
    } catch (err) {
      setError("Failed to fetch statistics");
      console.error("Error fetching user stats:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    if (isAuthenticated) {
      fetchStats();
    }
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats,
  };
}
