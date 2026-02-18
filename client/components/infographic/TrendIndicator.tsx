import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TrendIndicatorProps {
  direction: "up" | "down" | "neutral";
  value?: string | number;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrendIndicator({
  direction,
  value,
  label,
  size = "md",
  className,
}: TrendIndicatorProps) {
  const colors = {
    up: {
      text: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/50",
      icon: "text-emerald-500",
    },
    down: {
      text: "text-red-600 dark:text-red-400",
      bg: "bg-red-50 dark:bg-red-950/50",
      icon: "text-red-500",
    },
    neutral: {
      text: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-800/50",
      icon: "text-slate-500",
    },
  };

  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const sizes = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const Icon = icons[direction];
  const colorSet = colors[direction];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full font-medium",
        colorSet.bg,
        colorSet.text,
        sizes[size],
        className
      )}
    >
      <Icon className={cn(iconSizes[size], colorSet.icon)} />
      {value !== undefined && <span>{value}{typeof value === 'number' ? '%' : ''}</span>}
      {label && <span className="opacity-70">{label}</span>}
    </span>
  );
}

export function getTrendDirection(current: number, previous: number): "up" | "down" | "neutral" {
  const diff = current - previous;
  const threshold = previous * 0.01;
  if (diff > threshold) return "up";
  if (diff < -threshold) return "down";
  return "neutral";
}

export function formatTrendValue(current: number, previous: number): string {
  if (previous === 0) return "N/A";
  const change = ((current - previous) / previous) * 100;
  const sign = change > 0 ? "+" : "";
  return `${sign}${change.toFixed(1)}%`;
}