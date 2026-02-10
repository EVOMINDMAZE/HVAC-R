import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface AppPageShellProps {
  children: React.ReactNode;
  className?: string;
  withMotion?: boolean;
}

export function AppPageShell({
  children,
  className,
  withMotion = true,
}: AppPageShellProps) {
  if (!withMotion) {
    return <div className={cn("app-page app-stack-24", className)}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: "easeOut" }}
      className={cn("app-page app-stack-24", className)}
    >
      {children}
    </motion.div>
  );
}
