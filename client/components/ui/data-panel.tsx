import * as React from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface DataPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  value: string | number;
  subtitle?: string;
  trend?: number; // positive = up, negative = down, zero = neutral
  unit?: string;
  variant?: "default" | "success" | "warning" | "destructive" | "highlight" | "info";
  compact?: boolean;
  loading?: boolean;
}

const DataPanel = React.forwardRef<HTMLDivElement, DataPanelProps>(
  (
    {
      className,
      title,
      value,
      subtitle,
      trend,
      unit,
      variant = "default",
      compact = false,
      loading = false,
      ...props
    },
    ref
  ) => {
    const variantClasses = {
      default: "glass-panel border-border",
      success: "glass-panel border-success/30 bg-success/5",
      warning: "glass-panel border-warning/30 bg-warning/5",
      destructive: "glass-panel border-destructive/30 bg-destructive/5",
      highlight: "glass-panel border-highlight/30 bg-highlight/5",
      info: "glass-panel border-info/30 bg-info/5",
    };

    const valueColorClasses = {
      default: "text-foreground",
      success: "text-success",
      warning: "text-warning",
      destructive: "text-destructive",
      highlight: "text-highlight",
      info: "text-info",
    };

    const getTrendIcon = (trendValue: number) => {
      if (trendValue > 0) {
        return <TrendingUp className="h-4 w-4 text-success" />;
      } else if (trendValue < 0) {
        return <TrendingDown className="h-4 w-4 text-destructive" />;
      } else {
        return <Minus className="h-4 w-4 text-muted-foreground" />;
      }
    };

    const formatTrend = (trendValue: number) => {
      const sign = trendValue > 0 ? "+" : "";
      return `${sign}${trendValue}%`;
    };

    return (
      <div
        ref={ref}
        className={cn(
          "rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:shadow-lg",
          variantClasses[variant],
          compact && "p-4",
          className
        )}
        {...props}
      >
        {title && (
          <div className={cn("text-sm font-medium text-muted-foreground mb-2", compact && "text-xs")}>
            {title}
          </div>
        )}
        
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <div className={cn(
              "text-3xl font-bold tracking-tight",
              valueColorClasses[variant],
              compact && "text-2xl"
            )}>
              {loading ? "..." : value}
            </div>
            {unit && (
              <div className={cn("text-sm text-muted-foreground", compact && "text-xs")}>
                {unit}
              </div>
            )}
          </div>
          
          {trend !== undefined && (
            <div className="flex items-center gap-1">
              {getTrendIcon(trend)}
              <span className={cn(
                "text-sm font-medium",
                trend > 0 ? "text-success" : trend < 0 ? "text-destructive" : "text-muted-foreground"
              )}>
                {formatTrend(trend)}
              </span>
            </div>
          )}
        </div>
        
        {subtitle && (
          <div className={cn("text-sm text-muted-foreground mt-2", compact && "text-xs")}>
            {subtitle}
          </div>
        )}
      </div>
    );
  }
);
DataPanel.displayName = "DataPanel";

export { DataPanel };