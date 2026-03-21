import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { Check, Sparkles, Zap, Crown, TrendingUp } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
    ctaLink: "/signup",
    ctaVariant: "outline" as const,
    icon: Sparkles,
    popular: false,
  },
  {
    name: "Business in a Box",
    description: "Complete operations & engineering suite",
    priceMonthly: "$199",
    priceAnnually: "$159",
    features: [
      "Skool Community Access",
      "White-labeled Pro App",
      "Automation Engine (Review Hunter, Invoice Chaser)",
      "Team collaboration (up to 5 users)",
      "Client portal for customer access",
      "Unlimited advanced calculations",
      "Priority dedicated support",
    ],
    cta: "Start Free Trial",
    ctaLink: "/signup",
    ctaVariant: "default" as const,
    icon: Crown,
    popular: true,
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
      "Priority email support",
      "Branded PDF reports",
      "Custom refrigerant libraries",
    ],
    cta: "Get Pro",
    ctaLink: "/signup",
    ctaVariant: "outline" as const,
    icon: Zap,
    popular: false,
  },
];

export function PricingSection() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });
  const [isAnnual, setIsAnnual] = useState(true);

  return (
    <section className="py-36 px-4 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background -z-30" />
      <div className="absolute top-[20%] left-[5%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px] -z-20" />
      <div className="absolute bottom-[20%] right-[5%] w-[500px] h-[400px] bg-highlight/[0.03] rounded-full blur-[130px] -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.015)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.015)_1px,transparent_1px)] bg-[size:80px_80px] -z-10" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="mb-6 px-5 py-2 rounded-full border-primary/30 bg-primary/[0.05] text-primary backdrop-blur-md text-xs font-medium tracking-wide"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-2" />
            Transparent Pricing
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            Plans that grow with
            <span className="text-primary relative">
              <span className="relative z-10"> your needs</span>
              <span className="absolute -bottom-2 left-0 right-0 h-2.5 bg-primary/10 blur-xl rounded-full" />
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-[1.7]">
            Start free, upgrade when you need more power. No hidden fees, no surprises.
          </p>

          <div className="flex items-center justify-center mt-10 gap-5">
            <span className={`text-sm font-medium transition-colors duration-300 ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Monthly
            </span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className="relative w-14 h-7 rounded-full bg-primary/15 cursor-pointer hover:bg-primary/25 transition-colors duration-300"
              aria-label={isAnnual ? "Switch to monthly billing" : "Switch to annual billing"}
              aria-pressed={isAnnual}
            >
              <motion.div
                className="absolute top-1 left-1 w-5 h-5 rounded-full bg-primary shadow-sm"
                animate={{ x: isAnnual ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              />
            </button>
            <span className={`text-sm font-medium transition-colors duration-300 ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>
              Annually <span className="text-xs text-success/80">(Save 20%)</span> <Badge variant="outline" className="ml-2.5 text-xs border-success/20 text-success/80 bg-success/[0.04]">Introductory</Badge>
            </span>
          </div>
        </motion.div>

        <motion.div
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.25,
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
                  hidden: { opacity: 0, y: 50 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                  },
                }}
                whileHover={{ y: -12 }}
                className={`relative rounded-3xl p-8 bg-card/70 backdrop-blur-sm transition-all duration-500 ${
                  tier.popular
                    ? "border-2 border-primary/30 shadow-xl shadow-primary/[0.08]"
                    : "border border-border/30 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/[0.04]"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-5 py-1.5 shadow-lg shadow-primary/20">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <div className="flex items-center gap-4 mb-8">
                  <div className="w-13 h-13 rounded-xl bg-primary/[0.06] flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-bold text-foreground tracking-tight">{tier.name}</h3>
                    <p className="text-sm text-muted-foreground/70">{tier.description}</p>
                  </div>
                </div>

                <div className="mb-8">
                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl font-bold text-foreground tracking-tight">{price}</span>
                    {price !== "Custom" && (
                      <span className="text-muted-foreground/60">
                        /month{isAnnual && <span className="text-xs">, billed annually</span>}
                      </span>
                    )}
                  </div>
                  {price !== "Custom" && isAnnual && price !== "$0" && (
                    <p className="text-sm text-success/80 mt-3">
                      Save 20% compared to monthly billing
                    </p>
                  )}
                </div>

                <ul className="space-y-4 mb-10">
                  {tier.features.map((feature, i) => {
                    const isHighlighted =
                      feature.includes("Skool Community Access") ||
                      feature.includes("White-labeled Pro App") ||
                      feature.includes("Automation Engine");

                    return (
                      <li key={i} className="flex items-start text-sm">
                        {isHighlighted ? (
                          <Sparkles className="h-4 w-4 text-primary mr-3 mt-0.5 flex-shrink-0" />
                        ) : (
                          <Check className="h-4 w-4 text-primary/70 mr-3 mt-0.5 flex-shrink-0" />
                        )}
                        <span className={isHighlighted ? "text-foreground font-semibold" : "text-muted-foreground/80"}>
                          {feature}
                        </span>
                      </li>
                    );
                  })}
                </ul>

                <Link to={tier.ctaLink}>
                  <Button
                    variant={tier.ctaVariant}
                    className={`w-full h-12 rounded-xl font-medium text-base transition-all duration-300 ${
                      tier.popular
                        ? "bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/75 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)]"
                        : "hover:bg-secondary/50"
                    }`}
                  >
                    {tier.cta}
                  </Button>
                </Link>

                {tier.popular && (
                  <p className="text-xs text-muted-foreground/50 text-center mt-5">
                    14-day free trial included
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-16 max-w-2xl mx-auto"
        >
          <p className="text-sm text-muted-foreground/70">
            All plans include a <strong className="text-foreground/80">14‑day free trial</strong> of Pro features. No credit card required.
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
