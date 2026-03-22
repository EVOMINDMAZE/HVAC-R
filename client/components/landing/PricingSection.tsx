import { motion } from "framer-motion";
import { Check, Sparkles, Zap, Crown, TrendingUp } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { landingVariants } from "@/lib/animations/landingVariants";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const pricingTiers = [
  {
    name: "Standard",
    description: "Essential precision for individuals",
    priceMonthly: "$0",
    priceAnnually: "$0",
    features: [
      "Basic cycle analysis",
      "Up to 10 calculations/mo",
      "Standard P-h diagrams",
      "Community support",
      "PDF export (watermarked)",
    ],
    cta: "Initialize",
    ctaLink: "/signup",
    ctaVariant: "outline" as const,
    icon: Sparkles,
    popular: false,
    planId: "engineering_free",
  },
  {
    name: "Enterprise",
    description: "Full industrial operations suite",
    priceMonthly: "$199",
    priceAnnually: "$159",
    features: [
      "Skool Community Access",
      "White-labeled Pro App",
      "Automation Engine",
      "Team collab (5 users)",
      "Client portal access",
      "Unlimited calculations",
      "Dedicated node support",
    ],
    cta: "Deploy Now",
    ctaLink: "/signup",
    ctaVariant: "default" as const,
    icon: Crown,
    popular: true,
    planId: "enterprise",
  },
  {
    name: "Pro",
    description: "Advanced engineering for teams",
    priceMonthly: "$49",
    priceAnnually: "$39",
    features: [
      "Advanced cycle analysis",
      "Unlimited calculations",
      "AI‑powered optimization",
      "Priority email support",
      "Branded PDF reports",
      "Custom refrigerant libs",
    ],
    cta: "Upgrade",
    ctaLink: "/signup",
    ctaVariant: "outline" as const,
    icon: Zap,
    popular: false,
    planId: "pro",
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-24 px-4 relative overflow-hidden bg-background" ref={ref}>
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] text-primary" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={landingVariants.hudFadeIn}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1 rounded-none border-primary/30 bg-primary/5 text-primary font-mono text-[10px] uppercase tracking-[0.2em]"
          >
            <TrendingUp className="w-3 h-3 mr-2" />
            Service Architecture
          </Badge>
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6 tracking-tight leading-tight">
            Scalable plans for
            <span className="text-primary block md:inline"> industrial demand</span>
          </h2>
          
          <div className="flex items-center justify-center mt-10 gap-4">
            <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 ${!isAnnual ? "text-primary" : "text-muted-foreground"}`}>
              Monthly_Cycle
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-12 h-6 rounded-none border border-primary/30 bg-primary/5 cursor-pointer"
              role="switch"
              aria-checked={isAnnual}
              aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
            >
              <motion.div
                className="absolute top-1 left-1 w-4 h-4 bg-primary"
                animate={{ x: isAnnual ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={`text-[10px] font-mono uppercase tracking-widest transition-colors duration-300 ${isAnnual ? "text-primary" : "text-muted-foreground"}`}>
              Annual_Cycle <span className="text-success text-[9px] ml-1">(-20%)</span>
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={landingVariants.staggerChildren}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto"
        >
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const price = isAnnual ? tier.priceAnnually : tier.priceMonthly;

            return (
              <motion.div
                key={index}
                variants={landingVariants.hudFadeIn}
                whileHover={{ y: -5 }}
                className={`relative group h-full`}
              >
                <div className={`h-full p-8 glass-blur hud-border bg-card/40 transition-all duration-300 flex flex-col ${
                  tier.popular ? "border-primary/40 cyan-glow bg-card/60" : "border-primary/10"
                }`}>
                  {tier.popular && (
                    <div className="absolute -top-3 left-6">
                      <div className="bg-primary text-primary-foreground px-3 py-0.5 font-mono text-[9px] uppercase tracking-widest font-bold">
                        Priority_Selection
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-2.5 bg-background/50 border border-primary/20 rounded-sm">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-display font-bold text-foreground tracking-tight uppercase">{tier.name}</h3>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{tier.description}</p>
                    </div>
                  </div>

                  <div className="mb-8">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-display font-bold text-foreground tracking-tighter">{price}</span>
                      {price !== "Custom" && (
                        <span className="text-[10px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                          /period
                        </span>
                      )}
                    </div>
                    {price !== "Custom" && isAnnual && price !== "$0" && (
                      <p className="text-[9px] font-mono text-success uppercase mt-2">
                        // EFFICIENCY_GAINED: 20%_REDUCTION
                      </p>
                    )}
                  </div>

                  <ul className="space-y-4 mb-10 flex-grow">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-3 w-3 text-primary mr-3 mt-1 flex-shrink-0" />
                        <span className="text-[11px] font-mono text-muted-foreground/80 leading-relaxed uppercase">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <Link 
                    to={tier.ctaLink}
                    onClick={() => trackMarketingEvent("pricing_plan_cta_click", { 
                      section: "hero", 
                      destination: tier.ctaLink, 
                      plan: tier.planId 
                    })}
                  >
                    <Button
                      variant={tier.ctaVariant}
                      className={`w-full h-10 rounded-none font-mono text-xs uppercase tracking-widest transition-all duration-300 ${
                        tier.popular
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "border-primary/30 hover:bg-primary/5"
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 1 }}
          className="text-center mt-12 max-w-2xl mx-auto"
        >
          <p className="text-[10px] font-mono text-muted-foreground/40 uppercase tracking-[0.2em]">
            System status: nominal // Trial available for all new nodes // <a href="/contact" className="text-primary/60 hover:text-primary transition-colors underline underline-offset-4">Request_Custom_Protocol</a>
          </p>
        </motion.div>
      </div>
    </section>
  );
}
