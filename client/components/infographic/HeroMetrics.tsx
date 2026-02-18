import React, { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface HeroMetric {
  id: string;
  label: string;
  value: number;
  previousValue?: number;
  format?: "number" | "currency" | "percent";
  prefix?: string;
  suffix?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  sparklineData?: number[];
  status?: "success" | "warning" | "danger" | "neutral";
}

export interface HeroMetricsProps {
  metrics: HeroMetric[];
  className?: string;
}

function formatValue(value: number, format?: string, prefix?: string, suffix?: string): string {
  const formatted = format === "currency"
    ? new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value)
    : format === "percent"
    ? `${value}%`
    : new Intl.NumberFormat().format(value);
  return `${prefix || ""}${formatted}${suffix || ""}`;
}

function AnimatedNumber({ value, format, prefix, suffix }: { value: number; format?: string; prefix?: string; suffix?: string }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 60;
    const stepValue = value / steps;
    let current = 0;
    const interval = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setDisplayValue(value);
        clearInterval(interval);
      } else {
        setDisplayValue(Math.floor(current));
      }
    }, duration / steps);
    return () => clearInterval(interval);
  }, [value]);

  return <span>{formatValue(displayValue, format, prefix, suffix)}</span>;
}

function Sparkline({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 80;
  const height = 24;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

function TrendBadge({ trend, value }: { trend: "up" | "down" | "neutral"; value?: string }) {
  if (!value) return null;

  const colors = {
    up: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950",
    down: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950",
    neutral: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
  };

  const icons = {
    up: TrendingUp,
    down: TrendingDown,
    neutral: Minus,
  };

  const Icon = icons[trend];

  return (
    <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium", colors[trend])}>
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
}

function HeroCard({ metric, size = "normal" }: { metric: HeroMetric; size?: "large" | "normal" }) {
  const statusColors = {
    success: "hsl(160 84% 39%)",
    warning: "hsl(38 92% 50%)",
    danger: "hsl(0 84% 60%)",
    neutral: "hsl(var(--primary))",
  };

  const accentColor = metric.status ? statusColors[metric.status] : statusColors.neutral;

  return (
    <div
      className={cn(
        "hero-card",
        size === "large" && "hero-card--large"
      )}
      style={{ "--accent-color": accentColor } as React.CSSProperties}
    >
      <div className="hero-card__header">
        <span className="hero-card__label">{metric.label}</span>
        {metric.trend && metric.trendValue && (
          <TrendBadge trend={metric.trend} value={metric.trendValue} />
        )}
      </div>

      <div className="hero-card__value">
        <AnimatedNumber
          value={metric.value}
          format={metric.format}
          prefix={metric.prefix}
          suffix={metric.suffix}
        />
      </div>

      {metric.sparklineData && (
        <div className="hero-card__sparkline">
          <Sparkline data={metric.sparklineData} color={accentColor} />
        </div>
      )}

      <div className="hero-card__accent" />
    </div>
  );
}

export function HeroMetrics({ metrics, className }: HeroMetricsProps) {
  if (metrics.length === 0) return null;

  return (
    <div className={cn("hero-metrics", className)}>
      {metrics.map((metric, index) => (
        <HeroCard
          key={metric.id}
          metric={metric}
          size={index === 0 ? "large" : "normal"}
        />
      ))}
    </div>
  );
}