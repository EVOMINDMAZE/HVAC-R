import * as React from "react";

import { cn } from "@/lib/utils";

export interface MeasurementLabelProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
}

/**
 * Renders terminal-style labels wrapped in brackets like `[METRICS]`.
 * Styled with monospace font, uppercase, and tracking for an industrial/technical aesthetic.
 *
 * @example
 * ```tsx
 * <MeasurementLabel>SYSTEM STATUS</MeasurementLabel>
 * <MeasurementLabel className="text-primary">EFFICIENCY</MeasurementLabel>
 * ```
 */
export function MeasurementLabel({ children, className, ...props }: MeasurementLabelProps) {
  return (
    <span
      className={cn(
        "font-mono uppercase text-xs tracking-wider text-muted-foreground",
        className
      )}
      {...props}
    >
      [{children}]
    </span>
  );
}
