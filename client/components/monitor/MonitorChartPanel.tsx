import { useId, useMemo } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  LineChart as LineChartIcon,
} from "lucide-react";
import { Area, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import type { MonitorSeries } from "@/types/monitor";
import type { FutureMonitorSkin } from "@/lib/featureFlags";

interface MonitorChartPanelProps {
  series?: MonitorSeries;
  compact?: boolean;
  reducedMotion?: boolean;
  skin?: FutureMonitorSkin;
  variant?: "default" | "sparkline";
}

const defaultConfig = {
  value: {
    label: "Value",
    theme: {
      light: "hsl(var(--primary))",
      dark: "hsl(var(--primary))",
    },
  },
} satisfies ChartConfig;

export function MonitorChartPanel({
  series,
  compact = false,
  reducedMotion = false,
  skin = "classic",
  variant = "default",
}: MonitorChartPanelProps) {
  const isHud = skin === "hud";
  const isSparkline = variant === "sparkline";
  const areaGradientId = `monitor-area-${useId().replace(/:/g, "")}`;
  const glowFilterId = `monitor-glow-${useId().replace(/:/g, "")}`;
  const hasData = Boolean(series?.points?.length);
  const points = series?.points || [];
  const total = useMemo(
    () => points.reduce((acc, point) => acc + point.value, 0),
    [points],
  );
  const pointCount = points.length;
  const unitSuffix = series?.unit ? ` ${series.unit}` : "";
  const delta =
    pointCount >= 2 ? (points[pointCount - 1]?.value ?? 0) - (points[0]?.value ?? 0) : null;
  const { minValue, maxValue, avgValue } = useMemo(() => {
    if (!pointCount) {
      return { minValue: 0, maxValue: 0, avgValue: 0 };
    }
    const values = points.map((point) => point.value);
    return {
      minValue: Math.min(...values),
      maxValue: Math.max(...values),
      avgValue: Math.round(total / pointCount),
    };
  }, [pointCount, points, total]);
  const trendNarrative =
    delta == null
      ? "Collecting baseline"
      : delta > 0
        ? "Rising trajectory"
        : delta < 0
          ? "Cooling trajectory"
          : "Stable trajectory";

  return (
    <section
      className={cn(
        "monitor-panel monitor-panel-chart rounded-xl border border-border/70 bg-card/70 p-4",
        isHud ? "monitor-panel-hud" : null,
      )}
      data-testid="monitor-chart-panel"
      data-skin={skin}
    >
      <div className="monitor-panel-grid" aria-hidden />
      <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="monitor-panel-kicker inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-2 py-1 text-[10px] font-semibold tracking-[0.1em] text-muted-foreground">
            <LineChartIcon className="h-3 w-3 text-primary" />
            TREND ANALYSIS
          </p>
          <p className="text-sm font-semibold text-foreground">
            {series?.title || "Signal Timeline"}
          </p>
          <p className="text-xs text-muted-foreground">
            {series?.description || "No chart metadata available"}
          </p>
        </div>
        {hasData ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <p className="monitor-chip inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs text-muted-foreground">
              <Activity className="h-3.5 w-3.5 text-primary" />
              {pointCount} data points
            </p>
            {delta !== null ? (
              <p
                className={cn(
                  "monitor-chip inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium",
                  delta > 0
                    ? "border-success/35 bg-success/10 text-success"
                    : delta < 0
                      ? "border-destructive/35 bg-destructive/10 text-destructive"
                      : "border-border/70 bg-background/80 text-muted-foreground",
                )}
              >
                {delta > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : delta < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : null}
                {delta > 0 ? "+" : ""}
                {delta}
                {unitSuffix}
              </p>
            ) : null}
            <div className="monitor-chip-strong rounded-lg border border-border/70 bg-background/80 px-2.5 py-1.5 text-right">
              <p className="text-[11px] text-muted-foreground">Total</p>
              <p className="text-sm font-semibold">
                {total}
                {unitSuffix}
              </p>
            </div>
          </div>
        ) : null}
      </div>

      {!hasData ? (
        <div className="monitor-chart-empty rounded-lg border border-dashed border-border/80 bg-background/60 p-6 text-center text-sm text-muted-foreground">
          No live chart data available yet.
        </div>
      ) : (
        <div className="monitor-chart-frame rounded-lg border border-border/80 bg-background/55 p-2.5 sm:p-3">
          <ChartContainer
            config={defaultConfig}
            className={
              isSparkline
                ? "h-[140px] min-h-[140px] w-full"
                : compact
                  ? "h-[170px] min-h-[170px] w-full"
                  : "h-[210px] min-h-[210px] w-full"
            }
          >
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, left: 4, bottom: 0 }}
            >
              <defs>
                <linearGradient id={areaGradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-value)" stopOpacity={0.26} />
                  <stop offset="100%" stopColor="var(--color-value)" stopOpacity={0.02} />
                </linearGradient>
                {isHud ? (
                  <filter
                    id={glowFilterId}
                    x="-25%"
                    y="-25%"
                    width="150%"
                    height="150%"
                  >
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="2.8"
                      floodColor="var(--color-value)"
                      floodOpacity="0.38"
                    />
                    <feDropShadow
                      dx="0"
                      dy="0"
                      stdDeviation="6"
                      floodColor="var(--color-value)"
                      floodOpacity="0.18"
                    />
                  </filter>
                ) : null}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                strokeOpacity={isHud ? 0.34 : 0.5}
                horizontal={!isSparkline}
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={16}
                tick={
                  isSparkline
                    ? false
                    : isHud
                    ? ({ x, y, payload }: any) => (
                        <text
                          x={x}
                          y={y}
                          dy={16}
                          textAnchor="middle"
                          fill="hsl(var(--muted-foreground) / 0.9)"
                          fontSize={10}
                        >
                          {payload?.value}
                        </text>
                      )
                    : undefined
                }
              />
              {isSparkline ? null : (
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  width={36}
                  tick={
                    isHud
                      ? ({ x, y, payload }: any) => (
                          <text
                            x={x}
                            y={y}
                            dy={3}
                            textAnchor="end"
                            fill="hsl(var(--muted-foreground) / 0.75)"
                            fontSize={10}
                          >
                            {payload?.value}
                          </text>
                        )
                      : undefined
                  }
                />
              )}
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeDasharray: "4 4" }}
                content={<ChartTooltipContent hideLabel indicator="line" />}
              />
              <Area
                type="monotone"
                dataKey="value"
                fill={`url(#${areaGradientId})`}
                stroke="none"
                filter={isHud ? `url(#${glowFilterId})` : undefined}
                isAnimationActive={!compact && !reducedMotion}
                animationDuration={480}
              />
              <Line
                type="monotone"
                dataKey="value"
                stroke="var(--color-value)"
                strokeWidth={isHud ? 2.9 : 2.5}
                filter={isHud ? `url(#${glowFilterId})` : undefined}
                dot={
                  isHud
                    ? (props: { cx?: number; cy?: number; index?: number }) => {
                        const { cx, cy, index } = props;
                        if (typeof cx !== "number" || typeof cy !== "number") return null;
                        if (index !== points.length - 1) return null;
                        return (
                          <circle
                            cx={cx}
                            cy={cy}
                            r={4}
                            fill="var(--color-value)"
                            stroke="hsl(var(--background))"
                            strokeWidth={1.5}
                            opacity={0.95}
                          />
                        );
                      }
                    : false
                }
                activeDot={{
                  r: 3.5,
                  fill: "var(--color-value)",
                  stroke: "hsl(var(--background))",
                  strokeWidth: 1.5,
                }}
                isAnimationActive={!compact && !reducedMotion}
                animationDuration={560}
              />
            </LineChart>
          </ChartContainer>
        </div>
      )}
      {hasData ? (
        <div className="monitor-chart-summary mt-3 space-y-2">
          <div className="monitor-chart-stat-grid grid grid-cols-3 gap-2">
            <article className="monitor-chart-stat rounded-lg border border-border/70 bg-background/70 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Min</p>
              <p className="text-sm font-semibold text-foreground">
                {minValue}
                {unitSuffix}
              </p>
            </article>
            <article className="monitor-chart-stat rounded-lg border border-border/70 bg-background/70 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Avg</p>
              <p className="text-sm font-semibold text-foreground">
                {avgValue}
                {unitSuffix}
              </p>
            </article>
            <article className="monitor-chart-stat rounded-lg border border-border/70 bg-background/70 px-2 py-1.5">
              <p className="text-[10px] uppercase tracking-[0.08em] text-muted-foreground">Max</p>
              <p className="text-sm font-semibold text-foreground">
                {maxValue}
                {unitSuffix}
              </p>
            </article>
          </div>
          <p
            className={cn(
              "monitor-chart-story inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium",
              delta != null && delta < 0
                ? "border-destructive/30 bg-destructive/10 text-destructive"
                : delta != null && delta > 0
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border/70 bg-background/70 text-muted-foreground",
            )}
          >
            Story: {trendNarrative}
          </p>
        </div>
      ) : null}
    </section>
  );
}
