import { useMemo } from "react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

export interface DashboardStats {
  totalCalculations: number;
  monthlyCalculations: number;
  plan: string;
  planDisplayName: string;
  isUnlimited: boolean;
  remaining: number;
  remainingText: string;
  monthlyLimit: number;
  usagePercentage: number;
  isNearLimit: boolean;
  isAtLimit: boolean;
  remainingValue: number;
  billingCycleResetLabel: string;
}

export function useDashboardStats(options?: { enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const {
    calculations,
    isLoading: calculationsLoading,
    refetch: refetchCalculations,
    subscription,
    subscriptionLoading,
    refetchSubscription,
  } = useSupabaseCalculations({ enabled });

  const stats = useMemo<DashboardStats>(() => {
    const totalCalculations = calculations.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyCalculations = calculations.filter((calc: any) => {
      const calcDate = new Date(calc.created_at);
      return (
        calcDate.getMonth() === currentMonth &&
        calcDate.getFullYear() === currentYear
      );
    }).length;

    const plan = subscription?.plan || "free";
    const planDisplayName =
      plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " ");
    const isUnlimited = plan !== "free";
    const monthlyLimit = isUnlimited ? monthlyCalculations || 0 : 10;
    const remaining = isUnlimited
      ? -1
      : Math.max(0, monthlyLimit - monthlyCalculations);
    const remainingText = remaining === -1 ? "Unlimited" : remaining.toString();
    const usagePercentage = isUnlimited
      ? 0
      : Math.min((monthlyCalculations / monthlyLimit) * 100, 100);
    const isNearLimit = !isUnlimited && usagePercentage > 70;
    const isAtLimit = !isUnlimited && monthlyCalculations >= monthlyLimit;
    const billingCycleReset = new Date(currentYear, currentMonth + 1, 1);
    const billingCycleResetLabel = billingCycleReset.toLocaleDateString(
      undefined,
      {
        month: "long",
        day: "numeric",
      },
    );

    return {
      totalCalculations,
      monthlyCalculations,
      plan,
      planDisplayName,
      isUnlimited,
      remaining,
      remainingText,
      monthlyLimit,
      usagePercentage,
      isNearLimit,
      isAtLimit,
      remainingValue: remaining,
      billingCycleResetLabel,
    };
  }, [calculations, subscription]);

  const isLoading = calculationsLoading || subscriptionLoading;

  const refreshStats = async () => {
    try {
      await Promise.all([refetchCalculations(), refetchSubscription()]);
    } catch (_e) {
      // silent
    }
  };

  return { stats, isLoading, refreshStats, calculations };
}
