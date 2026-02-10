import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Sparkles, Zap, Crown, TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef, useState } from "react";

const pricingTiers = [
  {
    name: "Free",
    description: "For individuals and small projects",
    priceMonthly: "$0",
    priceAnnually: "$0",
    features: [
      "Basic cycle analysis",
      "Up to 10 calculations per month",
      "Standard P-h diagrams",
      "Community support",
      "PDF export (watermarked)",
    ],
    cta: "Start Free",
    ctaVariant: "outline" as const,
    icon: Sparkles,
    popular: false,
  },
  {
    name: "Pro",
    description: "For professional engineers and teams",
    priceMonthly: "$49",
    priceAnnually: "$39",
    features: [
      "Advanced cycle analysis",
      "Unlimited calculations",
      "AI‑powered optimization",
      "Priority support",
      "Branded PDF reports",
      "Team collaboration (up to 5 users)",
      "Custom refrigerant libraries",
      "API access",
    ],
    cta: "Start Free Trial",
    ctaVariant: "default" as const,
    icon: Zap,
    popular: true,
  },
  {
    name: "Enterprise",
    description: "For organizations with custom needs",
    priceMonthly: "Custom",
    priceAnnually: "Custom",
    features: [
      "Everything in Pro, plus:",
      "Unlimited team members",
      "SLA guarantee (99.9% uptime)",
      "Dedicated account manager",
      "On‑premise deployment options",
      "Custom integrations",
      "Security audit support",
      "Training & onboarding",
    ],
    cta: "Contact Sales",
    ctaVariant: "outline" as const,
    icon: Crown,
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-32 px-4 relative overflow-hidden" ref={ref}>
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:60px_60px] -z-10" />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md text-xs"
          >
            <TrendingUp className="w-3 h-3 mr-2" />
            Transparent Pricing
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Plans that grow with
            <span className="text-primary"> your needs</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Start free, upgrade when you need more power. No hidden fees, no surprises.
          </p>

          {/* Toggle */}
          <div className="flex items-center justify-center mt-8 gap-4">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-primary/20 cursor-pointer"
              aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
              aria-pressed={isAnnual}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary"
                animate={{ x: isAnnual ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 400 }}
              />
            </button>
            <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annually <span className="text-xs text-success">(Save 20%)</span> <Badge variant="outline" className="ml-2 text-xs border-success/30 text-success bg-success/10">Limited Time</Badge>
            </span>
          </div>
        </motion.div>

        {/* Pricing Cards */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {pricingTiers.map((tier, index) => {
            const Icon = tier.icon;
            const price = isAnnual ? tier.priceAnnually : tier.priceMonthly;
            
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: "easeOut" },
                  },
                }}
                whileHover={{ y: -10 }}
                className={`relative rounded-2xl border p-8 bg-card/50 backdrop-blur-sm transition-all duration-300 ${
                  tier.popular
                    ? "border-primary/50 shadow-xl glow-primary"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Tier Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-foreground">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground">{tier.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-foreground">{price}</span>
                    {price !== "Custom" && (
                      <span className="text-muted-foreground">
                        /{isAnnual ? "year" : "month"}
                      </span>
                    )}
                  </div>
                  {price !== "Custom" && isAnnual && (
                    <p className="text-sm text-success mt-2">
                      <strong>Save $120</strong> compared to monthly billing
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start text-sm">
                      <Check className="h-4 w-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Button
                  variant={tier.ctaVariant}
                  className={`w-full h-12 rounded-lg font-medium text-base ${
                    tier.popular
                      ? "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                      : ""
                  }`}
                >
                  {tier.cta}
                </Button>

                {/* Urgency Note */}
                {tier.popular && (
                  <div className="mt-6 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                      <Badge className="bg-gradient-to-r from-warning to-warning/80 text-white px-3 py-1">
                        <Zap className="h-3 w-3 mr-1" />
                        Limited‑time offer: Free onboarding included
                      </Badge>
                      <Badge variant="outline" className="border-primary/30 text-primary bg-primary/10 px-3 py-1">
                        <Users className="h-3 w-3 mr-1" />
                        Limited spots available
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground text-center">
                      Offer ends in <strong>3 days, 14 hours</strong>. Upgrade now to secure your discount.
                    </p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom Note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-12 max-w-2xl mx-auto"
        >
          <p className="text-sm text-muted-foreground">
            All plans include a <strong>14‑day free trial</strong> of Pro features. No credit card required. 
            Need a custom plan?{" "}
            <a href="/contact" className="text-primary hover:underline">
              Contact our sales team
            </a>
            .
          </p>
        </motion.div>
      </div>
    </section>
  );
}