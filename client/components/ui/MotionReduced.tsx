import { useReducedMotion } from "framer-motion";
import * as React from "react";

import { cn } from "@/lib/utils";

export interface MotionReducedProps {
  children: React.ReactNode;
  animationClassName?: string;
  fallbackClassName?: string;
  forceMotion?: boolean;
}

/**
 * A wrapper component that conditionally applies animation classes based on
 * the user's prefers-reduced-motion setting. Uses framer-motion's useReducedMotion hook.
 *
 * @example
 * ```tsx
 * // Applies slide-up animation normally, static if reduced motion
 * <MotionReduced animationClassName="animate-slide-up" fallbackClassName="opacity-100">
 *   <Card>Content</Card>
 * </MotionReduced>
 *
 * // Force motion regardless of user preference (for testing)
 * <MotionReduced animationClassName="animate-fade-in" forceMotion>
 *   <Component />
 * </MotionReduced>
 * ```
 */
export function MotionReduced({
  children,
  animationClassName,
  fallbackClassName,
  forceMotion = false,
}: MotionReducedProps) {
  const prefersReducedMotion = useReducedMotion();

  const shouldAnimate = forceMotion || !prefersReducedMotion;

  if (!animationClassName && !fallbackClassName) {
    return <>{children}</>;
  }

  return (
    <div
      className={cn(
        shouldAnimate ? animationClassName : fallbackClassName
      )}
    >
      {children}
    </div>
  );
}
