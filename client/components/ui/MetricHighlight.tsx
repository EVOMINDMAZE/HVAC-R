import * as React from "react";

import { cn } from "@/lib/utils";

export interface MetricHighlightProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Renders text with an animated underline that "draws" from left to right on mount.
 * Respects prefers-reduced-motion by showing the underline immediately without animation.
 *
 * @example
 * ```tsx
 * <MetricHighlight>Coefficient of Performance</MetricHighlight>
 * <MetricHighlight className="text-primary">Energy Efficiency Ratio</MetricHighlight>
 * ```
 */
export function MetricHighlight({ children, className, ...props }: MetricHighlightProps) {
  return (
    <span
      className={cn("relative inline-block", className)}
      style={{ fontFamily: "inherit" }}
      {...props}
    >
      {children}
      <span
        className="absolute -bottom-1 left-0 h-[2px] w-full animate-draw-underline bg-highlight"
        aria-hidden="true"
      />
    </span>
  );
}
