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
    const gridColsClassMap: Record<number, string> = {
      1: "grid-cols-1",
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
    };

    const mdColsClassMap: Record<number, string> = {
      1: "md:grid-cols-1",
      2: "md:grid-cols-2",
      3: "md:grid-cols-3",
      4: "md:grid-cols-4",
      5: "md:grid-cols-5",
      6: "md:grid-cols-6",
    };

    const lgColsClassMap: Record<number, string> = {
      1: "lg:grid-cols-1",
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
      6: "lg:grid-cols-6",
    };

    const xlColsClassMap: Record<number, string> = {
      1: "xl:grid-cols-1",
      2: "xl:grid-cols-2",
      3: "xl:grid-cols-3",
      4: "xl:grid-cols-4",
      5: "xl:grid-cols-5",
      6: "xl:grid-cols-6",
    };

    const xxlColsClassMap: Record<number, string> = {
      1: "2xl:grid-cols-1",
      2: "2xl:grid-cols-2",
      3: "2xl:grid-cols-3",
      4: "2xl:grid-cols-4",
      5: "2xl:grid-cols-5",
      6: "2xl:grid-cols-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "grid",
          gridColsClassMap[columns.sm || 1] || gridColsClassMap[1],
          columns.md ? mdColsClassMap[columns.md] : null,
          columns.lg ? lgColsClassMap[columns.lg] : null,
          columns.xl ? xlColsClassMap[columns.xl] : null,
          columns["2xl"] ? xxlColsClassMap[columns["2xl"]] : null,
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
    const colSpanMap: Record<number, string> = {
      1: "col-span-1",
      2: "col-span-2",
      3: "col-span-3",
      4: "col-span-4",
      5: "col-span-5",
      6: "col-span-6",
    };

    const mdColSpanMap: Record<number, string> = {
      1: "md:col-span-1",
      2: "md:col-span-2",
      3: "md:col-span-3",
      4: "md:col-span-4",
      5: "md:col-span-5",
      6: "md:col-span-6",
    };

    const lgColSpanMap: Record<number, string> = {
      1: "lg:col-span-1",
      2: "lg:col-span-2",
      3: "lg:col-span-3",
      4: "lg:col-span-4",
      5: "lg:col-span-5",
      6: "lg:col-span-6",
    };

    const xlColSpanMap: Record<number, string> = {
      1: "xl:col-span-1",
      2: "xl:col-span-2",
      3: "xl:col-span-3",
      4: "xl:col-span-4",
      5: "xl:col-span-5",
      6: "xl:col-span-6",
    };

    const xxlColSpanMap: Record<number, string> = {
      1: "2xl:col-span-1",
      2: "2xl:col-span-2",
      3: "2xl:col-span-3",
      4: "2xl:col-span-4",
      5: "2xl:col-span-5",
      6: "2xl:col-span-6",
    };

    const rowSpanMap: Record<number, string> = {
      1: "row-span-1",
      2: "row-span-2",
      3: "row-span-3",
      4: "row-span-4",
      5: "row-span-5",
      6: "row-span-6",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "app-surface rounded-xl p-4 transition-all duration-300 hover:shadow-lg",
          span?.sm ? colSpanMap[span.sm] : null,
          span?.md ? mdColSpanMap[span.md] : null,
          span?.lg ? lgColSpanMap[span.lg] : null,
          span?.xl ? xlColSpanMap[span.xl] : null,
          span?.["2xl"] ? xxlColSpanMap[span["2xl"]] : null,
          rowSpan ? rowSpanMap[rowSpan] : null,
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
