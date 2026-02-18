import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatItem {
  id: string;
  label: string;
  value: string | number;
  previousValue?: number;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: React.ReactNode;
  status?: "success" | "warning" | "danger" | "neutral";
  sparklineData?: number[];
}

export interface StatsRowProps {
  stats: StatItem[];
  columns?: 2 | 3 | 4 | 5;
  className?: string;
}

function TrendBadge({ trend, value }: { trend: "up" | "down" | "neutral"; value?: string }) {
  if (!value) return null;

  const colors = {
    up: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/50",
    down: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50",
    neutral: "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800/50",
  };

  const icons = { up: TrendingUp, down: TrendingDown, neutral: Minus };
  const Icon = icons[trend];

  return (
    <span className={cn("stat-card__trend", colors[trend])}>
      <Icon className="w-3 h-3" />
      {value}
    </span>
  );
}

function MiniSparkline({ data, color = "hsl(var(--primary))" }: { data: number[]; color?: string }) {
  if (!data || data.length === 0) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 20;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={width} height={height} className="stat-card__sparkline">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
}

export function StatsRow({ stats, columns = 4, className }: StatsRowProps) {
  const statusColors = {
    success: "hsl(160 84% 39%)",
    warning: "hsl(38 92% 50%)",
    danger: "hsl(0 84% 60%)",
    neutral: "hsl(var(--primary))",
  };

  return (
    <div className={cn("stats-row", `stats-row--cols-${columns}`, className)}>
      {stats.map((stat) => {
        const accentColor = stat.status ? statusColors[stat.status] : statusColors.neutral;

        return (
          <div
            key={stat.id}
            className="stat-card"
            style={{ "--accent-color": accentColor } as React.CSSProperties}
          >
            <div className="stat-card__header">
              <span className="stat-card__label">{stat.label}</span>
              {stat.icon && <div className="stat-card__icon">{stat.icon}</div>}
            </div>

            <div className="stat-card__body">
              <div className="stat-card__value">{stat.value}</div>
              {stat.trend && stat.trendValue && (
                <TrendBadge trend={stat.trend} value={stat.trendValue} />
              )}
            </div>

            {stat.sparklineData && (
              <MiniSparkline data={stat.sparklineData} color={accentColor} />
            )}

            <div className="stat-card__accent" />
          </div>
        );
      })}
    </div>
  );
}