import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { UpgradeModal } from "./UpgradeModal";

interface FeatureLockProps {
  requiredTier: "pro" | "business";
  currentTier?: "free" | "pro" | "business";
  featureName?: string;
  children: ReactNode;
  description?: string;
  showLockIcon?: boolean;
  className?: string;
  overlayClassName?: string;
  disabled?: boolean;
}

export function FeatureLock({
  requiredTier,
  currentTier = "free",
  featureName,
  children,
  description,
  showLockIcon = true,
  className = "",
  overlayClassName = "",
  disabled = false,
}: FeatureLockProps) {
  // Check if feature is accessible
  const tierHierarchy = { free: 0, pro: 1, business: 2 };
  const hasAccess = tierHierarchy[currentTier] >= tierHierarchy[requiredTier];

  if (hasAccess || disabled) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={`relative ${className}`}>
      {/* Grayed out content */}
      <div className="opacity-50 pointer-events-none select-none">
        {children}
      </div>
      
      {/* Overlay with lock icon */}
      <div className={`absolute inset-0 flex items-center justify-center rounded-lg ${overlayClassName}`}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] rounded-lg" />
        <div className="relative z-10 text-center p-6 max-w-sm">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 mb-4">
            <Lock className="h-6 w-6 text-orange-600" />
          </div>
          <h3 className="font-semibold text-lg mb-2">
            {featureName || "This feature"} is locked
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {description || `Upgrade to ${requiredTier === "pro" ? "Pro" : "Business"} plan to unlock this feature and more.`}
          </p>
          
          <UpgradeModal
            requiredTier={requiredTier}
            currentTier={currentTier}
            featureName={featureName}
            description={description}
          >
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:opacity-90 transition-opacity">
              Upgrade to {requiredTier === "pro" ? "Pro" : "Business"}
            </button>
          </UpgradeModal>
        </div>
      </div>
    </div>
  );
}

// Simple component for inline feature badges
interface FeatureBadgeProps {
  requiredTier: "pro" | "business";
  currentTier?: "free" | "pro" | "business";
  className?: string;
}

export function FeatureBadge({
  requiredTier,
  currentTier = "free",
  className = "",
}: FeatureBadgeProps) {
  const tierHierarchy = { free: 0, pro: 1, business: 2 };
  const hasAccess = tierHierarchy[currentTier] >= tierHierarchy[requiredTier];

  if (hasAccess) {
    return null;
  }

  const badgeColors = {
    pro: "bg-amber-100 text-amber-800 border-amber-300",
    business: "bg-indigo-100 text-indigo-800 border-indigo-300",
  };

  const tierNames = {
    pro: "Pro",
    business: "Business",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badgeColors[requiredTier]} ${className}`}
    >
      <Lock className="h-3 w-3" />
      {tierNames[requiredTier]}
    </span>
  );
}