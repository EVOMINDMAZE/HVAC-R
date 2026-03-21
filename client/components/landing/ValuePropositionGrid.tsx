import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { Clock, CheckCircle, FileText, Sparkles } from "lucide-react";
import { useRef } from "react";

import { Badge } from "@/components/ui/badge";
import { metrics } from "@/config/metrics";

const valueProps = [
  {
    icon: Clock,
    title: "Time Savings",
    description: "Reduce calculation time from hours to minutes with automated workflows and AI-powered insights. Based on internal testing.",
    metric: metrics.performance.timeSavings.value,
    metricLabel: "Time reduction",
    color: "primary",
  },
  {
    icon: CheckCircle,
    title: "Unmatched Accuracy",
    description: "Professional-grade calculations validated against NIST Refprop reference data. Validated against industry standards.",
    metric: metrics.performance.accuracy.value,
    metricLabel: "Calculation accuracy",
    color: "success",
  },
  {
    icon: FileText,
    title: "Professional Reports",
    description: "Generate client-ready reports in multiple formats with branded templates and compliance documentation.",
    metric: metrics.performance.reportsGenerated.value,
    metricLabel: "Reports generated",
    color: "highlight",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as any },
  },
};

export function ValuePropositionGrid() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50%" });

  return (
    <section className="py-36 px-4 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/50 to-background -z-30" />
      <div className="absolute top-[25%] left-[5%] w-[500px] h-[500px] bg-primary/[0.03] rounded-full blur-[150px] -z-20" />
      <div className="absolute bottom-[25%] right-[5%] w-[500px] h-[400px] bg-highlight/[0.03] rounded-full blur-[130px] -z-20" />
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
            Why Choose ThermoNeural
          </Badge>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 tracking-tight leading-[1.1]">
            Transform your workflow with
            <span className="text-primary relative">
              <span className="relative z-10"> measurable results</span>
              <span className="absolute -bottom-2 left-0 right-0 h-2.5 bg-primary/10 blur-xl rounded-full" />
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-[1.7]">
            Professional HVAC engineers rely on ThermoNeural for faster, more accurate calculations and client‑ready deliverables.
          </p>
        </motion.div>

        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          className="grid md:grid-cols-3 gap-10 max-w-6xl mx-auto"
        >
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            const colorClass = prop.color === "success" ? "text-success" : prop.color === "highlight" ? "text-highlight" : "text-primary";
            const bgClass = prop.color === "success" ? "bg-success/[0.06]" : prop.color === "highlight" ? "bg-highlight/[0.06]" : "bg-primary/[0.06]";
            const borderClass = prop.color === "success" ? "border-success/15" : prop.color === "highlight" ? "border-highlight/15" : "border-primary/15";
            const barClass = prop.color === "success" ? "bg-success/40" : prop.color === "highlight" ? "bg-highlight/40" : "bg-primary/40";

            return (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -12, scale: 1.02 }}
                className="group"
              >
                <div className={`h-full p-10 rounded-3xl border ${borderClass} bg-card/60 backdrop-blur-sm transition-all duration-500 hover:bg-card/80 hover:shadow-xl hover:shadow-primary/[0.05]`}>
                  <div className={`w-18 h-18 rounded-2xl ${bgClass} flex items-center justify-center mb-8`}>
                    <Icon className={`h-9 w-9 ${colorClass}`} />
                  </div>

                  <h3 className="text-2xl font-bold text-foreground mb-5 tracking-tight">
                    {prop.title}
                  </h3>

                  <p className="text-muted-foreground/80 mb-8 leading-[1.7]">
                    {prop.description}
                  </p>

                  <div className="pt-8 border-t border-border/30">
                    <div className="flex items-end gap-3">
                      <span className={`text-5xl font-bold ${colorClass} tracking-tight`}>
                        {prop.metric}
                      </span>
                      <span className="text-base text-muted-foreground/60 mb-1.5">
                        {prop.metricLabel}
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 h-1.5 w-full bg-border/20 overflow-hidden rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={isInView ? { width: "100%" } : { width: 0 }}
                      transition={{ duration: 1.4, delay: index * 0.15 }}
                      className={`h-full ${barClass} rounded-full`}
                    />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center mt-12">
          <p className="text-xs text-muted-foreground/50">{metrics.meta.asOfLabel}</p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ delay: 0.7 }}
          className="text-center mt-16"
        >
          <p className="text-sm text-muted-foreground/70">
            Join <span className="font-bold text-foreground/90">{metrics.users.totalEngineers} engineers</span> who trust ThermoNeural for their critical calculations.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
