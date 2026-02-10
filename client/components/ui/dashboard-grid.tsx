import * as React from "react";
import { cn } from "@/lib/utils";

interface DashboardGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  columns?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  gap?: "none" | "xs" | "sm" | "md" | "lg" | "xl";
  dense?: boolean;
}

const DashboardGrid = React.forwardRef<HTMLDivElement, DashboardGridProps>(
  (
    {
      className,
      children,
      columns = { sm: 1, md: 2, lg: 3, xl: 4, "2xl": 4 },
      gap = "md",
      dense = false,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      none: "gap-0",
      xs: "gap-2",
      sm: "gap-4",
      md: "gap-6",
      lg: "gap-8",
      xl: "gap-10",
    };

    // Generate responsive grid columns based on breakpoints
    const getGridColumnsClass = () => {
      const classes = [];
      
      if (columns.sm !== undefined) {
        classes.push(`grid-cols-${columns.sm}`);
      }
      
      if (columns.md !== undefined) {
        classes.push(`md:grid-cols-${columns.md}`);
      }
      
      if (columns.lg !== undefined) {
        classes.push(`lg:grid-cols-${columns.lg}`);
      }
      
      if (columns.xl !== undefined) {
        classes.push(`xl:grid-cols-${columns.xl}`);
      }
      
      if (columns["2xl"] !== undefined) {
        classes.push(`2xl:grid-cols-${columns["2xl"]}`);
      }
      
      // Fallback to default if no columns specified
      if (classes.length === 0) {
        classes.push("grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4");
      }
      
      return classes.join(" ");
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          getGridColumnsClass(),
          gapClasses[gap],
          dense && "grid-flow-dense auto-rows-fr",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DashboardGrid.displayName = "DashboardGrid";

// Grid Item component for consistent styling
interface DashboardGridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  span?: {
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    "2xl"?: number;
  };
  rowSpan?: number;
  className?: string;
}

const DashboardGridItem = React.forwardRef<HTMLDivElement, DashboardGridItemProps>(
  ({ className, children, span, rowSpan, ...props }, ref) => {
    const getSpanClass = () => {
      if (!span) return "";
      
      const classes = [];
      
      if (span.sm !== undefined) {
        classes.push(`col-span-${span.sm}`);
      }
      
      if (span.md !== undefined) {
        classes.push(`md:col-span-${span.md}`);
      }
      
      if (span.lg !== undefined) {
        classes.push(`lg:col-span-${span.lg}`);
      }
      
      if (span.xl !== undefined) {
        classes.push(`xl:col-span-${span.xl}`);
      }
      
      if (span["2xl"] !== undefined) {
        classes.push(`2xl:col-span-${span["2xl"]}`);
      }
      
      return classes.join(" ");
    };

    const rowSpanClass = rowSpan ? `row-span-${rowSpan}` : "";

    return (
      <div
        ref={ref}
        className={cn(
          "glass-card rounded-xl p-4 transition-all duration-300 hover:shadow-lg",
          getSpanClass(),
          rowSpanClass,
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
DashboardGridItem.displayName = "DashboardGridItem";

export { DashboardGrid, DashboardGridItem };