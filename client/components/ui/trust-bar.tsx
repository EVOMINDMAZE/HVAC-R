import { CheckCircle, Lock, Users, Award, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUserCount } from "@/hooks/useUserCount";
import { motion } from "framer-motion";

const trustItems = [
  {
    icon: Clock,
    label: "SOC 2 In Progress",
    color: "warning",
    description: "SOC 2 Type II certification audit scheduled for Q2 2025. We're committed to meeting the highest security standards.",
    pulse: true,
  },
  {
    icon: CheckCircle,
    label: "ASHRAE Compliant",
    color: "primary",
    description: "Our calculations follow ASHRAE standards and guidelines for HVAC&R engineering.",
  },
  {
    icon: Lock,
    label: "256-bit Encryption",
    color: "primary",
    description: "All data is encrypted using AES-256 both at rest and in transit.",
    glow: true,
  },
  {
    icon: Users,
    label: "Users",
    color: "primary",
    description: "Join engineers worldwide using ThermoNeural for their calculations.",
    dynamic: true,
  },
  {
    icon: Award,
    label: "NIST Validated",
    color: "primary",
    description: "Thermodynamic calculations validated against NIST Refprop reference data.",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 5 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
};

export function TrustBar() {
  const { formattedCount, loading } = useUserCount();

  return (
    <TooltipProvider>
      <motion.div
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="w-full bg-gradient-to-r from-secondary/30 to-background/30 border-b border-border/50 backdrop-blur-sm"
      >
        <div className="max-w-[1600px] mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12 text-xs md:text-sm">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              const colorClass = item.color === "warning" ? "text-warning" : "text-primary";
              const bgClass = item.color === "warning" ? "bg-warning/10" : "bg-primary/10";
              const pulseClass = item.pulse ? "animate-pulse" : "";
              const glowClass = item.glow ? "glow-primary" : "";

              return (
                <motion.div
                  key={index}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center"
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <motion.div
                        className={`flex items-center gap-2 text-muted-foreground cursor-help p-2 rounded-lg ${bgClass} ${glowClass} ${pulseClass} hover:bg-primary/20 transition-all`}
                        whileHover={{ backgroundColor: "rgba(59, 130, 246, 0.15)" }}
                      >
                        <Icon className={`h-4 w-4 ${colorClass}`} />
                        <span className="font-medium">
                          {item.dynamic ? (loading ? "Loading..." : formattedCount) : item.label}
                        </span>
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-xs">
                      <p className="text-xs">{item.description}</p>
                    </TooltipContent>
                  </Tooltip>
                  {index < trustItems.length - 1 && (
                    <div className="hidden md:block w-px h-4 bg-border ml-6" />
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </TooltipProvider>
  );
}
