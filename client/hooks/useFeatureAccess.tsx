import { ReactNode, useState, useCallback, useEffect } from "react";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useSubscription } from "./useStripe";
import { useUsageTracking } from "./useUsageTracking";
import { FeatureLock, FeatureBadge } from "@/components/FeatureLock";
import { UpgradeModal } from "@/components/UpgradeModal";

type Tier = "free" | "pro" | "business";
type RequiredTier = "pro" | "business";

interface UseFeatureAccessOptions {
  requiredTier: RequiredTier;
  featureName?: string;
  description?: string;
  currentTier?: Tier; // If not provided, will try to get from subscription
}

interface FeatureAccessResult {
  // Access check
  hasAccess: boolean;
  currentTier: Tier;
  requiredTier: Tier;
  
  // Helper components
  FeatureLock: ({ children }: { children: ReactNode }) => JSX.Element;
  FeatureBadge: () => JSX.Element | null;
  UpgradeModal: ({ children }: { children: ReactNode }) => JSX.Element;
  
  // Conditional rendering helper
  withAccess: <T extends any[]>(
    callback: (...args: T) => void,
    fallback?: (...args: T) => void
  ) => (...args: T) => void;
  
  // Guard function for early returns
  guard: (callback?: () => void) => boolean;
}

export function useFeatureAccess({
  requiredTier,
  featureName,
  description,
  currentTier: explicitCurrentTier,
}: UseFeatureAccessOptions): FeatureAccessResult {
  const { subscription } = useSubscription();
  const { user } = useSupabaseAuth();
  
  // Determine current tier
  const getCurrentTier = (): Tier => {
    // Use explicit tier if provided
    if (explicitCurrentTier) return explicitCurrentTier;
    
    // Try to get from subscription
    if (subscription?.plan) {
      // Map subscription plan names to tier
      const plan = subscription.plan.toLowerCase();
      if (plan === "pro" || plan === "solo") return "pro";
      if (plan === "business" || plan === "enterprise" || plan === "professional") return "business";
      return "free";
    }
    
    // Default to free
    return "free";
  };
  
  const currentTier = getCurrentTier();
  
  // Tier hierarchy for comparison
  const tierHierarchy: Record<Tier, number> = {
    free: 0,
    pro: 1,
    business: 2,
  };
  
  const hasAccess = tierHierarchy[currentTier] >= tierHierarchy[requiredTier];
  
  // Helper components
  const FeatureLockWrapper = ({ children }: { children: ReactNode }) => (
    <FeatureLock
      requiredTier={requiredTier}
      currentTier={currentTier}
      featureName={featureName}
      description={description}
    >
      {children}
    </FeatureLock>
  );
  
  const FeatureBadgeWrapper = () => (
    <FeatureBadge
      requiredTier={requiredTier}
      currentTier={currentTier}
    />
  );
  
  const UpgradeModalWrapper = ({ children }: { children: ReactNode }) => (
    <UpgradeModal
      requiredTier={requiredTier}
      currentTier={currentTier}
      featureName={featureName}
      description={description}
    >
      {children}
    </UpgradeModal>
  );
  
  // Conditional execution helper
  const withAccess = <T extends any[]>(
    callback: (...args: T) => void,
    fallback?: (...args: T) => void
  ) => {
    return (...args: T) => {
      if (hasAccess) {
        callback(...args);
      } else if (fallback) {
        fallback(...args);
      }
    };
  };
  
  // Guard function for early returns
  const guard = (callback?: () => void): boolean => {
    if (!hasAccess && callback) {
      callback();
    }
    return hasAccess;
  };
  
  return {
    hasAccess,
    currentTier,
    requiredTier,
    FeatureLock: FeatureLockWrapper,
    FeatureBadge: FeatureBadgeWrapper,
    UpgradeModal: UpgradeModalWrapper,
    withAccess,
    guard,
  };
}

// Convenience hook for checking specific features
export function useProFeature(featureName?: string, description?: string) {
  return useFeatureAccess({
    requiredTier: "pro",
    featureName,
    description,
  });
}

export function useBusinessFeature(featureName?: string, description?: string) {
  return useFeatureAccess({
    requiredTier: "business",
    featureName,
    description,
  });
}

// Hook for checking calculation limits (Free tier has 10/month)
export function useCalculationLimit() {
  const { subscription } = useSubscription();
  const { user } = useSupabaseAuth();
  const { getUsage, isLoading, error } = useUsageTracking();
  
  const [usageData, setUsageData] = useState<{
    current_count?: number;
    limit?: number | null;
    limit_exceeded?: boolean;
    period?: string;
  } | null>(null);
  
  // Determine calculation limit based on subscription plan
  const getLimit = (): number | null => {
    const plan = subscription?.plan?.toLowerCase() || 'free';
    if (plan === 'free') return 10;
    // Pro, Business, solo, enterprise, professional are unlimited
    return null; // null means unlimited
  };
  
  // Fetch current usage
  const fetchUsage = useCallback(async () => {
    if (!user) {
      setUsageData(null);
      return;
    }
    
    try {
      const result = await getUsage('calculation');
      if (result.success) {
        setUsageData({
          current_count: result.current_count,
          limit: result.limit,
          limit_exceeded: result.limit_exceeded,
          period: result.period,
        });
      } else {
        setUsageData(null);
      }
    } catch (err) {
      setUsageData(null);
    }
  }, [user, getUsage]);
  
  // Fetch usage on mount and when subscription changes
  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);
  
  // Calculate remaining calculations
  const getRemainingCalculations = (): { remaining: number; total: number; exceeded: boolean } => {
    const limit = getLimit();
    const currentCount = usageData?.current_count || 0;
    
    if (limit === null) {
      // Unlimited
      return { remaining: Infinity, total: Infinity, exceeded: false };
    }
    
    const remaining = Math.max(0, limit - currentCount);
    const exceeded = usageData?.limit_exceeded || remaining <= 0;
    
    return { remaining, total: limit, exceeded };
  };
  
  const canPerformCalculation = (): boolean => {
    const { exceeded } = getRemainingCalculations();
    return !exceeded;
  };
  
  const { remaining, total, exceeded } = getRemainingCalculations();
  
  return {
    remaining,
    total,
    exceeded,
    canPerformCalculation,
    isLoading,
    error,
    refresh: fetchUsage,
    period: usageData?.period || 'month',
  };
}