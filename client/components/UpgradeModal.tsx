import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Lock, Zap, Building, ArrowRight, CheckCircle, X } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import { useNavigate } from "react-router-dom";

interface UpgradeModalProps {
  requiredTier: "pro" | "business";
  currentTier?: "free" | "pro" | "business";
  featureName?: string;
  children: React.ReactNode;
  triggerClassName?: string;
  description?: string;
}

export function UpgradeModal({
  requiredTier,
  currentTier = "free",
  featureName = "This feature",
  children,
  triggerClassName,
  description,
}: UpgradeModalProps) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const getTierInfo = (tier: "free" | "pro" | "business") => {
    switch (tier) {
      case "pro":
        return {
          name: "Pro",
          icon: <Zap className="h-5 w-5 text-amber-500" />,
          price: PLANS.PRO.price,
          color: "from-amber-500 to-orange-500",
          badgeColor: "bg-amber-100 text-amber-800 border-amber-300",
        };
      case "business":
        return {
          name: "Business",
          icon: <Building className="h-5 w-5 text-indigo-500" />,
          price: PLANS.BUSINESS.price,
          color: "from-indigo-500 to-purple-500",
          badgeColor: "bg-indigo-100 text-indigo-800 border-indigo-300",
        };
      default:
        return {
          name: "Free",
          icon: null,
          price: 0,
          color: "from-slate-400 to-slate-500",
          badgeColor: "bg-slate-100 text-slate-800 border-slate-300",
        };
    }
  };

  const currentTierInfo = getTierInfo(currentTier);
  const requiredTierInfo = getTierInfo(requiredTier);

  const handleUpgrade = () => {
    setOpen(false);
    navigate("/pricing");
  };

  const getFeatureComparison = () => {
    const currentFeatures = currentTier === "free" 
      ? PLANS.FREE.features.slice(0, 3) 
      : currentTier === "pro"
      ? PLANS.PRO.features.slice(0, 3)
      : PLANS.BUSINESS.features.slice(0, 3);
    
    const requiredFeatures = requiredTier === "pro"
      ? PLANS.PRO.features.slice(0, 5)
      : PLANS.BUSINESS.features.slice(0, 5);

    return { currentFeatures, requiredFeatures };
  };

  const { currentFeatures, requiredFeatures } = getFeatureComparison();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <div className={triggerClassName}>{children}</div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Lock className="h-6 w-6 text-orange-500" />
            Upgrade Required
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {featureName} requires the{" "}
            <span className="font-bold">{requiredTierInfo.name}</span> plan.
            {description && <span className="block mt-1">{description}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Tier Comparison */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Current Plan */}
            <div className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Current Plan</h3>
                <Badge variant="outline" className={currentTierInfo.badgeColor}>
                  {currentTierInfo.name}
                </Badge>
              </div>
              <div className="space-y-2">
                {currentFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 text-sm text-muted-foreground">
                {currentTier === "free" && "Limited features, 10 calculations/month"}
                {currentTier === "pro" && "Unlimited calculations, advanced tools"}
                {currentTier === "business" && "Full business suite with team features"}
              </div>
            </div>

            {/* Required Plan */}
            <div className="border-2 border-orange-200 rounded-lg p-4 space-y-3 bg-gradient-to-br from-orange-50/50 to-transparent">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">Required Plan</h3>
                <Badge className={`bg-gradient-to-r ${requiredTierInfo.color} text-white border-0`}>
                  {requiredTierInfo.name}
                  {requiredTierInfo.icon && (
                    <span className="ml-2">{requiredTierInfo.icon}</span>
                  )}
                </Badge>
              </div>
              <div className="space-y-2">
                {requiredFeatures.map((feature, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                    <span className="font-medium">{feature}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 font-medium">
                <span className="text-2xl">${requiredTierInfo.price}</span>
                <span className="text-muted-foreground ml-1">/month</span>
              </div>
            </div>
          </div>

          {/* Upgrade Benefits */}
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4">
            <h4 className="font-semibold text-lg mb-2">Upgrade Benefits</h4>
            <ul className="space-y-2">
              {requiredTier === "pro" ? (
                <>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-orange-500 mr-2" />
                    <span>Unlimited calculations and advanced analysis tools</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-orange-500 mr-2" />
                    <span>PDF export, API access, and priority support</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-orange-500 mr-2" />
                    <span>10 saved projects with basic white-labeling</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-indigo-500 mr-2" />
                    <span>Everything in Pro plus team collaboration (up to 5 users)</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-indigo-500 mr-2" />
                    <span>White-label branding and client portal</span>
                  </li>
                  <li className="flex items-center">
                    <ArrowRight className="h-4 w-4 text-indigo-500 mr-2" />
                    <span>Automation engine and business dashboards</span>
                  </li>
                </>
              )}
  </ul>
          </div>
        </div>

        <DialogFooter className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className={`flex-1 bg-gradient-to-r ${requiredTierInfo.color} text-white hover:opacity-90`}
          >
            Upgrade to {requiredTierInfo.name} Plan
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}