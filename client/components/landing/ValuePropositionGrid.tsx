import { Clock, CheckCircle, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const valueProps = [
  {
    icon: Clock,
    title: "Time Savings",
    description: "Reduce calculation time from hours to minutes with automated workflows and AI-powered insights.",
    metric: "85%",
    metricLabel: "Average time reduction",
    color: "primary",
  },
  {
    icon: CheckCircle,
    title: "Unmatched Accuracy",
    description: "Professional-grade calculations validated against NIST Refprop with 99.8% accuracy guarantee.",
    metric: "99.8%",
    metricLabel: "Calculation accuracy",
    color: "success",
  },
  {
    icon: FileText,
    title: "Professional Reports",
    description: "Generate client-ready reports in multiple formats with branded templates and compliance documentation.",
    metric: "10k+",
    metricLabel: "Reports generated",
    color: "highlight",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

export function ValuePropositionGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });

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
            <Sparkles className="w-3 h-3 mr-2" />
            Why Choose ThermoNeural
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Transform your workflow with
            <span className="text-primary"> measurable results</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Professional HVAC engineers rely on ThermoNeural for faster, more accurate calculations and client‑ready deliverables.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            const colorClass = prop.color === "success" ? "text-success" : prop.color === "highlight" ? "text-highlight" : "text-primary";
            const bgClass = prop.color === "success" ? "bg-success/10" : prop.color === "highlight" ? "bg-highlight/10" : "bg-primary/10";
            const borderClass = prop.color === "success" ? "border-success/20" : prop.color === "highlight" ? "border-highlight/20" : "border-primary/20";
            
            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className={`h-full p-8 rounded-2xl border ${borderClass} bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl hover:glow-primary`}>
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${bgClass} flex items-center justify-center mb-6`}>
                    <Icon className={`h-8 w-8 ${colorClass}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-foreground mb-4">
                    {prop.title}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {prop.description}
                  </p>

                  {/* Metric */}
                  <div className="pt-6 border-t border-border/50">
                    <div className="flex items-end gap-2">
                      <span className={`text-5xl font-bold ${colorClass}`}>
                        {prop.metric}
                      </span>
                      <span className="text-lg text-muted-foreground mb-2">
                        {prop.metricLabel}
                      </span>
                    </div>
                  </div>

                  {/* Animated Bar */}
                  <div className="mt-4 h-1.5 w-full bg-border/50 overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: "100%" } : { width: 0 }}
                      transition={{ duration: 1.2, delay: index * 0.1 }}
                      className={`h-full ${prop.color === "success" ? "bg-success" : prop.color === "highlight" ? "bg-highlight" : "bg-primary"}`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.6 }}
          className="text-center mt-16"
        >
          <p className="text-muted-foreground text-sm">
            Join <span className="font-bold text-primary">1,200+ engineers</span> who trust ThermoNeural for their critical calculations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}