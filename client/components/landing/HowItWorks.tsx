import { Settings, Brain, FileText, Sparkles, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const steps = [
  {
    icon: Settings,
    title: "Input Parameters",
    description: "Enter refrigerant, temperatures, pressures, and system parameters in our intuitive interface.",
    color: "primary",
    details: ["50+ refrigerants", "Custom cycle configurations", "Real‑time validation"],
  },
  {
    icon: Brain,
    title: "AI Analysis",
    description: "Our thermodynamic engine analyzes the cycle, calculates COP, capacity, and provides optimization suggestions.",
    color: "highlight",
    details: ["NIST Refprop validated", "AI‑powered insights", "Performance optimization"],
  },
  {
    icon: FileText,
    title: "Professional Report",
    description: "Generate client‑ready reports with P‑h diagrams, state points, and compliance documentation.",
    color: "success",
    details: ["PDF/CSV export", "Branded templates", "ASHRAE compliance"],
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.3,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });

  return (
    <section className="py-32 px-4 relative overflow-hidden" ref={ref}>
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/3 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute bottom-1/3 right-1/4 w-96 h-96 bg-highlight/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:60px_60px] -z-10" />
      
      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-20 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md text-xs"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            How It Works
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            From input to insight in
            <span className="text-primary"> three simple steps</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            ThermoNeural transforms complex thermodynamic calculations into a streamlined, professional workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          {/* Connecting Line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border/30 hidden md:block">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "100%" } : { width: 0 }}
              transition={{ duration: 1.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-primary via-highlight to-success"
            />
          </div>

          {/* Steps */}
          <div className="grid md:grid-cols-3 gap-12 md:gap-8 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colorClass = step.color === "highlight" ? "text-highlight" : step.color === "success" ? "text-success" : "text-primary";
              const bgClass = step.color === "highlight" ? "bg-highlight/10" : step.color === "success" ? "bg-success/10" : "bg-primary/10";
              const borderClass = step.color === "highlight" ? "border-highlight/20" : step.color === "success" ? "border-success/20" : "border-primary/20";
              
              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -10 }}
                  className="relative"
                >
                  {/* Step Number */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-background border-4 border-background flex items-center justify-center z-10">
                    <div className={`w-10 h-10 rounded-full ${bgClass} flex items-center justify-center`}>
                      <span className="text-lg font-bold text-foreground">{index + 1}</span>
                    </div>
                  </div>

                  {/* Step Card */}
                  <div className={`pt-12 pb-8 px-8 rounded-2xl border ${borderClass} bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:glow-primary`}>
                    {/* Icon */}
                    <div className={`w-16 h-16 rounded-2xl ${bgClass} flex items-center justify-center mb-6 mx-auto`}>
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold text-foreground mb-4 text-center">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground mb-6 leading-relaxed text-center">
                      {step.description}
                    </p>

                    {/* Details List */}
                    <ul className="space-y-2">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-sm text-muted-foreground">
                          <div className={`w-1.5 h-1.5 rounded-full ${colorClass} mr-3`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Arrow Connector (Mobile) */}
                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-8 mb-4">
                      <ArrowRight className="h-6 w-6 text-border" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground text-lg mb-6">
            Ready to experience the future of HVAC calculations?
          </p>
          <div className="mb-6">
            <Badge className="bg-gradient-to-r from-warning to-warning/80 text-white px-4 py-1 mb-4">
              <Zap className="h-3 w-3 mr-1" />
              Limited Time: First 100 users get 50% off first month
            </Badge>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 text-white font-medium rounded-lg shadow-lg hover:shadow-primary/30 transition-all"
          >
            Start Your Free Trial
          </motion.button>
          <p className="text-sm text-muted-foreground mt-4">
            No credit card required • Get started in 2 minutes • Offer ends soon
          </p>
        </motion.div>
      </div>
    </section>
  );
}