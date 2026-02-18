import { type CSSProperties } from "react";
import {
  GaugeCircle,
  Info,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitorKpiItem } from "@/types/monitor";

interface MonitorKpiStripProps {
  items: MonitorKpiItem[];
  compact?: boolean;
}

const toneClassMap: Record<string, string> = {
  default: "border-border/70",
  success: "border-success/30",
  warning: "border-warning/30",
  danger: "border-destructive/30",
  info: "border-info/30",
};

const toneMetaMap = {
  default: { label: "Baseline", icon: GaugeCircle },
  success: { label: "Growth", icon: Sparkles },
  warning: { label: "Attention", icon: TriangleAlert },
  danger: { label: "Risk", icon: ShieldAlert },
  info: { label: "Signal", icon: Info },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function resolveMeterValue(item: MonitorKpiItem, index: number): number {
  if (typeof item.trend === "number") {
    return Math.round(clamp(Math.abs(item.trend) * 6 + 30, 18, 96));
  }

  const raw =
    typeof item.value === "number"
      ? item.value
      : Number(String(item.value).replace(/[^\d.-]/g, ""));
  if (Number.isFinite(raw)) {
    if (raw > 100) {
      const scaled = Math.log10(Math.abs(raw) + 1) * 32;
      return Math.round(clamp(scaled, 22, 95));
    }
    return Math.round(clamp(Math.abs(raw), 12, 95));
  }

  return Math.round(clamp(72 - index * 9, 28, 84));
}

export function MonitorKpiStrip({ items, compact = false }: MonitorKpiStripProps) {
  return (
    <div
      className={cn(
        "grid gap-3",
        compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-4",
      )}
      data-testid="monitor-kpi-strip"
    >
      {items.map((item, index) => {
        const tone = item.tone || "default";
        const trend = item.trend;
        const toneMeta = toneMetaMap[tone as keyof typeof toneMetaMap] || toneMetaMap.default;
        const MetricIcon = toneMeta.icon;
        const meterValue = resolveMeterValue(item, index);
        const meterStyle = {
          "--monitor-kpi-meter": `${meterValue}%`,
        } as CSSProperties;
        const barHeights = [
          Math.max(18, meterValue - 32),
          Math.max(24, meterValue - 16),
          Math.max(30, meterValue + 6),
        ];

        return (
          <article
            key={item.id}
            className={cn(
              "monitor-kpi group rounded-xl border bg-card/70 p-3.5",
              toneClassMap[tone] || toneClassMap.default,
            )}
            data-testid={`monitor-kpi-${item.id}`}
            data-tone={tone}
          >
            <div className="monitor-kpi-grid" aria-hidden />
            <div className="monitor-kpi-topline mb-2 flex items-center justify-between gap-2">
              <p className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
                <MetricIcon className="h-3.5 w-3.5 text-primary/70" />
                {item.label}
              </p>
              <span className="monitor-infographic-tag inline-flex items-center rounded-full border border-border/70 bg-background/75 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                {toneMeta.label}
              </span>
            </div>
            <div className="monitor-kpi-accent mb-2 h-1 w-12 rounded-full" />
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <p
                  className={cn(
                    "monitor-kpi-value font-semibold tracking-tight text-foreground",
                    compact ? "text-lg" : "text-xl",
                  )}
                >
                  {item.value}
                </p>
              </div>

              <div className="monitor-kpi-illustration flex items-end gap-2">
                <div className="monitor-kpi-meter" style={meterStyle}>
                  <span className="monitor-kpi-meter-value">{meterValue}</span>
                </div>
                <div className="monitor-kpi-bars">
                  {barHeights.map((height, idx) => (
                    <span key={idx} style={{ height: `${height}%` }} />
                  ))}
                </div>
              </div>
            </div>
            {typeof trend === "number" ? (
              <div
                className={cn(
                  "mt-2 inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-xs font-medium",
                  trend > 0
                    ? "border-success/30 bg-success/10 text-success"
                    : trend < 0
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-border bg-secondary text-muted-foreground",
                )}
              >
                {trend > 0 ? (
                  <TrendingUp className="h-3 w-3" />
                ) : trend < 0 ? (
                  <TrendingDown className="h-3 w-3" />
                ) : null}
                {trend > 0 ? "+" : ""}
                {trend}%
              </div>
            ) : null}
            {item.sublabel ? (
              <p className="mt-2 border-t border-border/60 pt-2 text-xs text-muted-foreground">
                {item.sublabel}
              </p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
