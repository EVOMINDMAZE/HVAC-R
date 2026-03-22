import * as React from "react";

import { cn } from "@/lib/utils";

export interface BlueprintGridProps extends React.HTMLAttributes<HTMLDivElement> {
  opacity?: number;
}

/**
 * Renders an SVG grid overlay for an industrial/blueprint aesthetic.
 * Uses primary color at configurable opacity, absolutely positioned to cover parent.
 *
 * @example
 * ```tsx
 * // Default 3% opacity
 * <BlueprintGrid />
 *
 * // Custom 5% opacity
 * <BlueprintGrid opacity={0.05} className="z-0" />
 * ```
 */
export function BlueprintGrid({ opacity = 0.03, className, ...props }: BlueprintGridProps) {
  return (
    <div
      className={cn("absolute inset-0 w-full h-full pointer-events-none overflow-hidden", className)}
      {...props}
    >
      <svg
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <pattern
            id="blueprint-grid"
            width="80"
            height="80"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 80 0 L 0 0 0 80"
              fill="none"
              stroke={`hsl(var(--primary) / ${opacity})`}
              strokeWidth="0.5"
            />
          </pattern>
          <pattern
            id="blueprint-grid-major"
            width="240"
            height="240"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 240 0 L 0 0 0 240"
              fill="none"
              stroke={`hsl(var(--primary) / ${opacity * 2})`}
              strokeWidth="1"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />
        <rect width="100%" height="100%" fill="url(#blueprint-grid-major)" />
      </svg>
    </div>
  );
}
