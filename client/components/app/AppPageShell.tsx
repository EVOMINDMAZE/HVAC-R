import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { InlineMonitorSlot } from "@/components/monitor/InlineMonitorSlot";

interface AppPageShellProps {
  children: React.ReactNode;
  className?: string;
  withMotion?: boolean;
  showInlineMonitor?: boolean;
}

export function AppPageShell({
  children,
  className,
  withMotion = true,
  showInlineMonitor = false,
}: AppPageShellProps) {
  if (!withMotion) {
    return (
      <div className={cn("app-page app-stack-24", className)}>
        {showInlineMonitor ? <InlineMonitorSlot /> : null}
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn("app-page app-stack-24", className)}
    >
      {showInlineMonitor ? <InlineMonitorSlot /> : null}
      {children}
    </motion.div>
  );
}
