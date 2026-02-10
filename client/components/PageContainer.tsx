import React from "react";
import { cn } from "@/lib/utils";
import { motion, HTMLMotionProps } from "framer-motion";

type PageContainerVariant = "standard" | "narrow" | "wide" | "full" | "prose";

interface PageContainerProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  variant?: PageContainerVariant;
  className?: string;
  withMotion?: boolean;
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
  ...props
}: PageContainerProps) => {
  const containerClassName = cn(
    "mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12",
    variants[variant],
    className,
  );

  if (!withMotion) {
    return (
      <div className={containerClassName} {...(props as any)}>
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
      {children}
    </motion.div>
  );
};
