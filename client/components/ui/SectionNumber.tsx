import * as React from "react";

import { cn } from "@/lib/utils";

export interface SectionNumberProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  number: string;
  standalone?: boolean;
}

/**
 * Renders large editorial section numbers like "01", "02", "03" for marking sections.
 * Positioned absolutely by default for overlay use, or relative when standalone prop is true.
 *
 * @example
 * ```tsx
 * // Absolute positioned (overlay style)
 * <SectionNumber number="01" className="top-0 -left-8" />
 *
 * // Standalone (normal flow)
 * <SectionNumber number="02" standalone />
 * ```
 */
export function SectionNumber({ number, className, standalone = false, ...props }: SectionNumberProps) {
  return (
    <span
      className={cn(
        "text-8xl font-black tabular-nums select-none pointer-events-none",
        standalone ? "relative" : "absolute",
        className
      )}
      style={{ color: "hsl(var(--border) / 0.3)" }}
      {...props}
    >
      {number}
    </span>
  );
}
