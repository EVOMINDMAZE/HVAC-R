import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";
import { InlineMonitorSlot } from "@/components/monitor/InlineMonitorSlot";

type PageContainerVariant = "standard" | "narrow" | "wide" | "full" | "prose";

interface PageContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: PageContainerVariant;
  className?: string;
  withMotion?: boolean;
  showInlineMonitor?: boolean;
}


const variants: Record<PageContainerVariant, string> = {
  standard: "max-w-[1440px]",
  narrow: "max-w-4xl",
  wide: "max-w-[1600px]",
  full: "max-w-full",
  prose: "max-w-3xl",
};

export const PageContainer = ({
  children,
  variant = "standard",
  className,
  withMotion = true,
  showInlineMonitor = false,
  ...props
}: PageContainerProps) => {
  const containerClassName = cn(
    "app-page",
    variants[variant],
    className,
  );

  if (!withMotion) {
    return (
      <div className={containerClassName} {...(props as any)}>
        {showInlineMonitor ? <InlineMonitorSlot /> : null}
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={containerClassName}
      {...props}
    >
      {showInlineMonitor ? <InlineMonitorSlot /> : null}
      {children}
    </motion.div>
  );
};
