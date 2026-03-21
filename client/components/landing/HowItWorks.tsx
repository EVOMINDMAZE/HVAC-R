import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { Settings, Brain, FileText, Sparkles, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
      staggerChildren: 0.35,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any },
  },
};

export function HowItWorks() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });

  return (
    <section className="py-36 px-4 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background -z-30" />
      <div className="absolute top-[30%] left-[5%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px] -z-20" />
      <div className="absolute bottom-[30%] right-[5%] w-[500px] h-[400px] bg-highlight/[0.03] rounded-full blur-[130px] -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.015)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.015)_1px,transparent_1px)] bg-[size:80px_80px] -z-10" />

      <div className="max-w-[1600px] mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-24 max-w-3xl mx-auto"
        >
          <Badge
            variant="outline"
            className="mb-6 px-5 py-2 rounded-full border-primary/30 bg-primary/[0.05] text-primary backdrop-blur-md text-xs font-medium tracking-wide"
          >
            <Sparkles className="w-3.5 h-3.5 mr-2" />
            How It Works
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            From input to insight in
            <span className="text-primary relative">
              <span className="relative z-10"> three simple steps</span>
              <span className="absolute -bottom-2 left-0 right-0 h-2.5 bg-primary/10 blur-xl rounded-full" />
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-[1.7]">
            ThermoNeural transforms complex thermodynamic calculations into a streamlined, professional workflow.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="relative"
        >
          <div className="absolute top-[4.5rem] left-0 right-0 h-[2px] bg-border/20 hidden md:block">
            <motion.div
              initial={{ width: 0 }}
              animate={isInView ? { width: "100%" } : { width: 0 }}
              transition={{ duration: 1.8, delay: 0.3 }}
              className="h-full bg-gradient-to-r from-primary/40 via-highlight/40 to-success/40"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-10 md:gap-12 max-w-6xl mx-auto">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const colorClass = step.color === "highlight" ? "text-highlight" : step.color === "success" ? "text-success" : "text-primary";
              const bgClass = step.color === "highlight" ? "bg-highlight/[0.06]" : step.color === "success" ? "bg-success/[0.06]" : "bg-primary/[0.06]";
              const borderClass = step.color === "highlight" ? "border-highlight/15" : step.color === "success" ? "border-success/15" : "border-primary/15";

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ y: -12 }}
                  className="relative"
                >
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-background border-4 border-background z-10">
                    <div className={`w-12 h-12 rounded-full ${bgClass} flex items-center justify-center shadow-sm`}>
                      <span className="text-lg font-bold text-foreground/80">{index + 1}</span>
                    </div>
                  </div>

                  <div className={`pt-14 pb-10 px-8 rounded-3xl border ${borderClass} bg-card/60 backdrop-blur-sm transition-all duration-500 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/[0.05]`}>
                    <div className={`w-18 h-18 rounded-2xl ${bgClass} flex items-center justify-center mb-6 mx-auto`}>
                      <Icon className={`h-8 w-8 ${colorClass}`} />
                    </div>

                    <h3 className="text-2xl font-bold text-foreground mb-4 text-center tracking-tight">
                      {step.title}
                    </h3>

                    <p className="text-muted-foreground mb-8 leading-[1.7] text-center">
                      {step.description}
                    </p>

                    <ul className="space-y-3">
                      {step.details.map((detail, i) => (
                        <li key={i} className="flex items-center text-sm text-muted-foreground/80">
                          <div className={`w-2 h-2 rounded-full ${colorClass} mr-4 opacity-60`} />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {index < steps.length - 1 && (
                    <div className="md:hidden flex justify-center mt-10 mb-6">
                      <ArrowRight className="h-6 w-6 text-border/50" />
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 1 }}
          className="text-center mt-20"
        >
          <p className="text-muted-foreground text-lg mb-8">
            Ready to experience the future of HVAC calculations?
          </p>
          <Link to="/signup">
            <Button
              size="lg"
              className="px-10 py-3.5 bg-gradient-to-r from-primary to-primary/85 hover:from-primary/95 hover:to-primary/75 text-white font-medium rounded-xl shadow-[0_8px_30px_-8px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_-8px_rgba(0,0,0,0.25)] transition-all duration-300"
            >
              Start Your Free Trial
              <ArrowRight className="ml-2.5 h-4.5 w-4.5" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground/60 mt-6">
            No credit card required • Get started in 2 minutes • Introductory offer available
          </p>
        </motion.div>
      </div>
    </section>
  );
}
