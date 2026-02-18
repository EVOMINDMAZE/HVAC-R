import { useEffect, useState } from "react";
import {
  Activity,
  TrendingDown,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Clock,
  Database,
  DollarSign,
  Info,
  RefreshCcw,
  Route,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  User,
  Users,
  Briefcase,
  HardHat,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitorLayoutTemplate, MonitorPageModel } from "@/types/monitor";
import { MonitorChartPanel } from "@/components/monitor/MonitorChartPanel";
import { MonitorDiagramPanel } from "@/components/monitor/MonitorDiagramPanel";
import { MonitorEmptyState } from "@/components/monitor/MonitorEmptyState";
import { MonitorKpiStrip } from "@/components/monitor/MonitorKpiStrip";
import { MonitorSkeleton } from "@/components/monitor/MonitorSkeleton";
import type { FutureMonitorSkin } from "@/lib/featureFlags";
import type { MonitorKpiItem, MonitorTone, MonitorSeriesPoint } from "@/types/monitor";
import { MonitorSignature } from "@/components/monitor/MonitorSignature";
import type { HudBadgeKey } from "@/components/hud/HudBadge";
import { HudBadge } from "@/components/hud/HudBadge";
import { HudQuickJump } from "@/components/hud/HudQuickJump";
import { HudMetaTooltip } from "@/components/hud/HudMetaTooltip";
import type { MonitorDiagramItem } from "@/types/monitor";

interface MonitorShellProps {
  model: MonitorPageModel;
  density?: "compact" | "expanded";
  /** @deprecated use density instead */
  compact?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  className?: string;
  skin?: FutureMonitorSkin;
}

type HeroValueParts = {
  prefix: string;
  value: string;
  unit: string | null;
};

type SparklineModel = {
  d: string;
  lastX: number;
  lastY: number;
  lastValue: number;
  prevValue: number;
  delta: number;
  min: number;
  max: number;
  sum: number;
  pointCount: number;
};

function stringifyKpiValue(value: MonitorKpiItem["value"]): string {
  if (typeof value === "number") return value.toLocaleString();
  return String(value ?? "");
}

function splitHeroValue(value: MonitorKpiItem["value"]): HeroValueParts {
  const raw = stringifyKpiValue(value).trim();
  if (!raw) {
    return { prefix: "", value: "--", unit: null };
  }

  const currencyMatch = raw.match(/^\$([\d,.]+)(.*)$/);
  if (currencyMatch) {
    const tail = (currencyMatch[2] || "").trim();
    return { prefix: "$", value: currencyMatch[1] ?? "", unit: tail ? tail : null };
  }

  const percentMatch = raw.match(/^(-?[\d,.]+)%$/);
  if (percentMatch) {
    return { prefix: "", value: percentMatch[1] ?? "", unit: "%" };
  }

  const numberUnitMatch = raw.match(/^(-?[\d,.]+)\s*([a-zA-Z]+)$/);
  if (numberUnitMatch) {
    return { prefix: "", value: numberUnitMatch[1] ?? "", unit: numberUnitMatch[2] ?? null };
  }

  return { prefix: "", value: raw, unit: null };
}

const toneLabelMap: Record<MonitorTone, string> = {
  default: "Baseline",
  success: "Optimal",
  warning: "Attention",
  danger: "Risk",
  info: "Signal",
};

function buildSparkline(points: MonitorSeriesPoint[] | undefined): SparklineModel | null {
  if (!points || points.length < 2) return null;
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pointCount = points.length;
  const sum = values.reduce((acc, value) => acc + value, 0);
  const lastValue = values[values.length - 1] ?? 0;
  const prevValue = values[values.length - 2] ?? lastValue;
  const delta = lastValue - prevValue;

  const coords = values.map((value, idx) => {
    const x = (idx / (pointCount - 1)) * 100;
    const y = (1 - (value - min) / span) * 32;
    return { x, y };
  });

  const d = coords
    .map((coord, idx) => `${idx === 0 ? "M" : "L"} ${coord.x.toFixed(2)} ${coord.y.toFixed(2)}`)
    .join(" ");

  const last = coords[coords.length - 1]!;

  return {
    d,
    lastX: last.x,
    lastY: last.y,
    lastValue,
    prevValue,
    delta,
    min,
    max,
    sum,
    pointCount,
  };
}

function resolveMetricIcon(item: MonitorKpiItem) {
  const id = item.id.toLowerCase();
  if (
    id.includes("open-work") ||
    id.includes("jobs") ||
    id.includes("workload") ||
    id.includes("dispatch")
  ) {
    return Briefcase;
  }
  if (id.includes("lead") || id.includes("triage")) {
    return Activity;
  }
  if (id.includes("client")) {
    return Users;
  }
  if (id.includes("tech")) {
    return HardHat;
  }
  if (id.includes("ttfb") || id.includes("dom") || id.includes("load") || id.includes("render")) {
    return Clock;
  }
  if (id.includes("revenue") || stringifyKpiValue(item.value).trim().startsWith("$")) {
    return DollarSign;
  }
  if (id.includes("role") || id.includes("session") || id.includes("operator")) {
    return User;
  }
  if (id.includes("route") || id.includes("path")) {
    return Route;
  }

  const tone = item.tone || "default";
  if (tone === "success") return Sparkles;
  if (tone === "warning") return TriangleAlert;
  if (tone === "danger") return ShieldAlert;
  if (tone === "info") return Info;
  return Activity;
}

function toNullableNumber(value: MonitorKpiItem["value"] | undefined): number | null {
  if (value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  if (raw === "--") return null;
  const match = raw.replace(/,/g, "").match(/^-?\d+(\.\d+)?$/);
  if (!match) return null;
  const parsed = Number(raw.replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveDashboardBadgeKey(kpi: MonitorKpiItem): HudBadgeKey | null {
  const id = kpi.id.toLowerCase();
  if (id.includes("dispatch")) return "dispatch";
  if (id.includes("triage") || id.includes("lead")) return "triage";
  if (id.includes("job") || id.includes("workload") || id.includes("inflight") || id.includes("scheduled")) {
    return "jobs";
  }
  if (id.includes("client")) return "clients";
  return null;
}

function resolveHudBadgeKey(
  presentation: MonitorPageModel["presentation"] | undefined,
  item: MonitorKpiItem,
): HudBadgeKey | null {
  const byId = resolveDashboardBadgeKey(item);
  if (byId) return byId;

  const id = item.id.toLowerCase();
  if (id.includes("fleet") || id.includes("truck")) return "fleet";
  if (id.includes("project") || id.includes("layer")) return "projects";
  if (id.includes("portal") || id.includes("shield")) return "portal";
  if (id.includes("tech") || id.includes("field")) return "tech";
  if (id.includes("track") || id.includes("map")) return "track";
  if (id.includes("setting")) return "settings";
  if (id.includes("estimate") || id.includes("calculator")) return "estimate";
  if (id.includes("compliance") || id.includes("report")) return "compliance";

  if (presentation?.modeLabel === "PUBLIC") return "public";
  if (presentation?.modeLabel === "AUTH") return "auth";
  if (presentation?.modeLabel === "TOOLS") return "tools";

  return null;
}

function HudExecOpsFlow({
  diagram,
  techValue,
}: {
  diagram: MonitorDiagramItem | undefined;
  techValue: MonitorKpiItem["value"] | undefined;
}) {
  const nodes = diagram?.nodes || [];
  const findNode = (id: string) => nodes.find((node) => node.id === id);

  const stages = [
    { id: "queued", label: "Queued", Icon: Route },
    { id: "en-route", label: "En Route", Icon: Truck },
    { id: "on-site", label: "On Site", Icon: HardHat },
    { id: "done", label: "Done", Icon: CheckCircle2 },
    { id: "techs", label: "Techs", Icon: HardHat },
  ].map((stage) => {
    if (stage.id === "techs") {
      return {
        ...stage,
        value: stringifyKpiValue(techValue ?? "--"),
        tone: "info" as const,
      };
    }
    const node = findNode(stage.id);
    return {
      ...stage,
      value: node?.value ?? "--",
      tone: (node?.tone || "default") as MonitorTone,
    };
  });

  return (
    <div className="monitor-exec-flow hidden sm:block" data-testid="monitor-exec-flow">
      <div className="monitor-exec-flow__header">
        <span className="monitor-exec-flow__label">Ops Flow</span>
        <span className="monitor-exec-flow__hint">Live stage counts</span>
      </div>
      <div
        className="monitor-exec-flow__track"
        aria-label="Operations flow"
        style={{ ["--flow-cols" as any]: stages.length }}
      >
        {stages.map((stage) => (
          <div
            key={stage.id}
            className="monitor-exec-flow__node"
            data-tone={stage.tone}
            title={`${stage.label}: ${stage.value}`}
          >
            <stage.Icon className="monitor-exec-flow__icon" aria-hidden="true" />
            <div className="monitor-exec-flow__text">
              <span className="monitor-exec-flow__value">{stage.value}</span>
              <span className="monitor-exec-flow__name">{stage.label}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function HudExecReadiness({
  heroValue,
  kpis,
}: {
  heroValue: MonitorKpiItem["value"] | undefined;
  kpis: MonitorKpiItem[];
}) {
  const openWorkload = toNullableNumber(heroValue);

  const missions = [
    { id: "dispatch", label: "Dispatch Queue", kpiId: "dispatch-queue" },
    { id: "unassigned", label: "Unassigned", kpiId: "dispatch-unassigned" },
    { id: "triage", label: "New Leads", kpiId: "triage-new" },
    { id: "scheduled", label: "Scheduled Today", kpiId: "scheduled-today" },
    { id: "inflight", label: "In Flight", kpiId: "inflight-jobs" },
  ].map((mission) => {
    const item = kpis.find((kpi) => kpi.id === mission.kpiId);
    const value = toNullableNumber(item?.value);
    return { ...mission, value };
  });

  const knownMissions = missions.filter((m) => typeof m.value === "number");
  const known = knownMissions.length;
  const completed = knownMissions.filter((m) => m.value === 0).length;

  const tier =
    openWorkload == null
      ? { label: "WAITING", tone: "info" as const }
      : openWorkload <= 0
        ? { label: "CLEAR", tone: "success" as const }
        : openWorkload <= 6
          ? { label: "BUSY", tone: "warning" as const }
          : { label: "CRITICAL", tone: "danger" as const };

  return (
    <div className="hud-readiness" data-tone={tier.tone} data-testid="hud-readiness">
      <div className="hud-readiness__row">
        <span className="hud-readiness__label">Queue Health</span>
        <span className="hud-readiness__tier" data-tone={tier.tone}>
          {tier.label}
        </span>
      </div>
      <div className="hud-readiness__bar" role="img" aria-label="Queue health indicators">
        {missions.map((mission, idx) => {
          const state =
            mission.value == null
              ? "unknown"
              : mission.value === 0
                ? "clear"
                : "pending";
          const countLabel =
            mission.value == null ? "--" : mission.value.toLocaleString();
          return (
          <span
            key={idx}
            className="hud-readiness__seg"
            data-state={state}
            title={`${mission.label}: ${countLabel}`}
          />
          );
        })}
      </div>
      <div className="hud-readiness__meta">
        <span className="hud-readiness__pct">{known === 0 ? "--" : `${completed}/${known}`}</span>
        <span className="hud-readiness__note">
          {known === 0 ? "Waiting for signals" : "queues clear"}
        </span>
      </div>
    </div>
  );
}

function useReducedMotionPreference() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(mediaQuery.matches);
    update();

    try {
      mediaQuery.addEventListener("change", update);
      return () => mediaQuery.removeEventListener("change", update);
    } catch {
      mediaQuery.addListener(update);
      return () => mediaQuery.removeListener(update);
    }
  }, []);

  return reducedMotion;
}

export function MonitorShell({
  model,
  density,
  compact = false,
  expanded,
  onToggleExpanded,
  className,
  skin = "classic",
}: MonitorShellProps) {
  const reducedMotion = useReducedMotionPreference();
  const isHud = skin === "hud";
  const skinClass = isHud ? "monitor-skin-hud" : "monitor-skin-classic";
  const resolvedDensity = density ?? (compact ? "compact" : "expanded");
  const isCompact = resolvedDensity === "compact";
  const isExpanded = expanded ?? resolvedDensity === "expanded";
  const template = (model.presentation?.template || "executive") as MonitorLayoutTemplate;

  if (model.state === "loading") {
    return (
      <div className={cn(skinClass, className)} data-monitor-skin={skin}>
        <MonitorSkeleton compact={isCompact} />
      </div>
    );
  }

  const presentation = model.presentation;
  const heroKpi = model.kpis[0];
  const heroTone = heroKpi?.tone || "default";
  const heroLabel = heroKpi?.label || model.title;
  const heroParts = heroKpi ? splitHeroValue(heroKpi.value) : splitHeroValue("--");
  const heroStatus = toneLabelMap[heroTone] || toneLabelMap.default;
  const metricChips = model.kpis.slice(1, 4);
  const isExecutiveDashboardCompact =
    Boolean(isHud && isCompact && template === "executive" && presentation?.icon === "gauge");
  const isPipelineCompact = Boolean(isHud && isCompact && template === "pipeline");
  const execCompactItems = isExecutiveDashboardCompact ? model.kpis.slice(1, 7) : [];
  const sparkline = isExecutiveDashboardCompact
    ? buildSparkline(model.series?.points)
    : null;
  const sparklineDelta = sparkline?.delta ?? 0;
  const sparklineDeltaDirection = sparklineDelta > 0 ? "up" : sparklineDelta < 0 ? "down" : "flat";
  const techKpi = isExecutiveDashboardCompact ? model.kpis.find((kpi) => kpi.id === "techs") : undefined;

  const metaChip =
    model.sourceLabel || model.updatedAt ? (
      <div
        className={cn(
          "monitor-meta-chip rounded-xl border border-border/70 bg-background/70 px-3 py-2 text-right text-xs text-muted-foreground",
          isCompact ? "hidden lg:block" : null,
        )}
      >
        {model.sourceLabel ? (
          <p className="inline-flex items-center gap-1">
            <Database className="h-3.5 w-3.5" />
            {model.sourceLabel}
          </p>
        ) : null}
        {model.updatedAt ? (
          <p className="mt-1 inline-flex items-center gap-1">
            <RefreshCcw className="h-3.5 w-3.5" />
            Updated {new Date(model.updatedAt).toLocaleString()}
          </p>
        ) : null}
      </div>
    ) : null;

  const hudMeta = isHud && isCompact ? (
    <HudMetaTooltip sourceLabel={model.sourceLabel} updatedAt={model.updatedAt} />
  ) : null;

  const expandToggle = onToggleExpanded ? (
    <button
      type="button"
      onClick={onToggleExpanded}
      aria-expanded={isExpanded}
      className={cn(
        "monitor-expand-toggle inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/70 px-3 py-1.5 text-xs font-semibold text-foreground/90 transition-colors hover:bg-background/90",
      )}
    >
      {isExpanded ? (
        <ChevronUp className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      )}
      {isExpanded ? "Collapse" : "Expand"}
    </button>
  ) : null;

  if (model.state === "error" || model.state === "empty") {
    return (
      <div className={cn(skinClass, className)} data-monitor-skin={skin}>
        <section
          className={cn(
            "monitor-shell rounded-2xl border border-border/80 bg-card/80",
            isExecutiveDashboardCompact || isPipelineCompact
              ? "p-3 sm:p-3.5"
              : isCompact
                ? "p-3.5 sm:p-4"
                : "p-5 sm:p-6",
            reducedMotion ? "monitor-motion-reduced" : "monitor-motion-enabled",
          )}
          data-monitor-shell
          data-testid="monitor-shell"
          data-compact={isCompact ? "true" : "false"}
          data-reduced-motion={reducedMotion ? "true" : "false"}
          data-skin={skin}
        >
          <div aria-hidden className="monitor-shell-grid" />
          <div aria-hidden className="monitor-shell-orbit" />

          <header
            className={cn(
              "monitor-dock-header flex flex-wrap items-start justify-between gap-3",
              isCompact ? "mb-2" : "mb-3",
            )}
          >
            <MonitorSignature
              presentation={presentation}
              fallbackLabel={model.title}
              compact={isCompact}
              skin={skin}
            />
            <div className="flex items-start gap-2">
              {hudMeta ?? metaChip}
              {expandToggle}
            </div>
          </header>

          <MonitorEmptyState
            title={model.title}
            message={
              model.state === "error"
                ? model.errorMessage || "Monitor failed to load for this route."
                : model.emptyMessage || "No monitor data available yet."
            }
            tone={model.state === "error" ? "error" : "empty"}
          />
        </section>
      </div>
    );
  }

  return (
    <div className={cn(skinClass, className)} data-monitor-skin={skin}>
      <section
        className={cn(
          "monitor-shell rounded-2xl border border-border/80 bg-card/80",
          isExecutiveDashboardCompact || isPipelineCompact
            ? "p-3 sm:p-3.5"
            : isCompact
              ? "p-3.5 sm:p-4"
              : "p-5 sm:p-6",
          reducedMotion ? "monitor-motion-reduced" : "monitor-motion-enabled",
        )}
        data-monitor-shell
        data-testid="monitor-shell"
        data-compact={isCompact ? "true" : "false"}
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-skin={skin}
      >
        <div aria-hidden className="monitor-shell-grid" />
        <div aria-hidden className="monitor-shell-orbit" />

        <header
          className={cn(
            "monitor-dock-header flex flex-wrap items-start justify-between gap-3",
            isCompact ? "mb-2" : "mb-3",
          )}
        >
          <MonitorSignature
            presentation={presentation}
            fallbackLabel={model.title}
            compact={isCompact}
            skin={skin}
          />
          <div className="flex items-start gap-2">
            {hudMeta ?? metaChip}
            {expandToggle}
          </div>
        </header>

        {!isCompact ? (
          <div className="mb-4 h-px w-full bg-gradient-to-r from-primary/25 via-border to-transparent" />
        ) : null}

        {isHud ? (
          <section
            className={cn(
              "monitor-hero",
              isCompact ? "monitor-hero-compact" : null,
              isExecutiveDashboardCompact ? "monitor-hero-exec" : null,
              isPipelineCompact && !isExecutiveDashboardCompact ? "monitor-hero-pipeline" : null,
            )}
            data-testid="monitor-hero"
            data-tone={heroTone}
          >
            <div className="monitor-hero-grid" aria-hidden />
            <div className="monitor-hero-reading">
              <div className="flex flex-wrap items-center gap-2">
                <p className="monitor-hero-kicker">{heroLabel}</p>
                {isCompact ? (
                  <span className="monitor-hero-statusInline" data-tone={heroTone}>
                    {heroStatus}
                  </span>
                ) : null}
              </div>
              <div className="monitor-hero-valueRow">
                {heroParts.prefix ? (
                  <span className="monitor-hero-prefix">{heroParts.prefix}</span>
                ) : null}
                <span className="monitor-hero-value">{heroParts.value}</span>
                {heroParts.unit ? (
                  <span className="monitor-hero-unit">{heroParts.unit}</span>
                ) : null}
              </div>
              {heroKpi?.sublabel ? (
                <p className={cn("monitor-hero-subtitle", isExecutiveDashboardCompact ? "hud-clamp-1" : null)}>
                  {heroKpi.sublabel}
                </p>
              ) : null}
              {isExecutiveDashboardCompact ? (
                <HudExecOpsFlow diagram={model.diagram} techValue={techKpi?.value} />
              ) : null}
            </div>
            {!isCompact ? (
              <div className="monitor-hero-statusStack">
                <p className="monitor-hero-status" data-tone={heroTone}>
                  {heroStatus}
                </p>
                <p className="monitor-hero-statusNote">Real-data monitor signal</p>
              </div>
            ) : isExecutiveDashboardCompact && execCompactItems.length ? (
              <div className="monitor-exec-microgrid" data-testid="monitor-exec-microgrid">
                {execCompactItems.map((item) => {
                  const tone = item.tone || "default";
                  const MetricIcon = resolveMetricIcon(item);
                  const badgeKey = resolveHudBadgeKey(presentation, item);
                  return (
                    <article
                      key={item.id}
                      className="monitor-microstat"
                      data-tone={tone}
                      title={item.sublabel || undefined}
                      data-testid={`monitor-micro-${item.id}`}
                    >
                      <p className="monitor-microstat-label">
                        {badgeKey ? (
                          <HudBadge badgeKey={badgeKey} size={26} decorative tone={tone} />
                        ) : (
                          <span className="monitor-microstat-iconWrap" aria-hidden>
                            <MetricIcon className="monitor-microstat-icon" />
                          </span>
                        )}
                        <span className="monitor-microstat-labelText">{item.label}</span>
                      </p>
                      <p className="monitor-microstat-value">
                        {stringifyKpiValue(item.value)}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : null}
            {isExecutiveDashboardCompact ? (
              <div
                className="monitor-exec-footer"
                data-testid="monitor-exec-footer"
                data-has-sparkline={sparkline ? "true" : "false"}
              >
                <HudQuickJump
                  counts={{
                    dispatch: {
                      value: stringifyKpiValue(
                        model.kpis.find((kpi) => kpi.id === "dispatch-queue")?.value ?? "--",
                      ),
                      tone: model.kpis.find((kpi) => kpi.id === "dispatch-queue")?.tone || "default",
                    },
                    triage: {
                      value: stringifyKpiValue(
                        model.kpis.find((kpi) => kpi.id === "triage-new")?.value ?? "--",
                      ),
                      tone: model.kpis.find((kpi) => kpi.id === "triage-new")?.tone || "default",
                    },
                    jobs: {
                      value: stringifyKpiValue(heroKpi?.value ?? "--"),
                      tone: heroTone,
                    },
                    clients: {
                      value: stringifyKpiValue(
                        model.kpis.find((kpi) => kpi.id === "clients-total")?.value ?? "--",
                      ),
                      tone: model.kpis.find((kpi) => kpi.id === "clients-total")?.tone || "default",
                    },
                  }}
                />
                <HudExecReadiness heroValue={heroKpi?.value} kpis={model.kpis} />
                {sparkline ? (
                  <div className="monitor-exec-sparkline" data-testid="monitor-exec-sparkline">
                    <div className="monitor-exec-sparkline-meta">
                      <span className="monitor-exec-sparkline-label">
                        {model.series?.title || "Signal Trend"}
                      </span>
                      <span className="monitor-exec-sparkline-range">
                        <span className="monitor-exec-sparkline-last">
                          {sparkline.lastValue.toLocaleString()}
                          {model.series?.unit ? ` ${model.series.unit}` : ""}
                        </span>
                        {sparklineDeltaDirection !== "flat" ? (
                          <span
                            className="monitor-exec-sparkline-delta"
                            data-direction={sparklineDeltaDirection}
                            aria-label={`Delta ${sparklineDeltaDirection === "up" ? "up" : "down"} ${Math.abs(sparklineDelta).toLocaleString()}`}
                          >
                            {sparklineDeltaDirection === "up" ? (
                              <TrendingUp className="h-3.5 w-3.5" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" />
                            )}
                            {Math.abs(sparklineDelta).toLocaleString()}
                          </span>
                        ) : (
                          <span className="monitor-exec-sparkline-delta" data-direction="flat">
                            ±0
                          </span>
                        )}
                      </span>
                    </div>
                    <svg
                      className="monitor-sparkline"
                      viewBox="0 0 100 32"
                      preserveAspectRatio="none"
                      role="img"
                      aria-label="Trend sparkline"
                    >
                      <path
                        d={sparkline.d}
                        fill="none"
                        stroke="hsl(var(--primary) / 0.9)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <circle
                        cx={sparkline.lastX}
                        cy={sparkline.lastY}
                        r="2.4"
                        fill="hsl(var(--highlight) / 0.9)"
                      />
                    </svg>
                  </div>
                ) : null}
              </div>
            ) : metricChips.length ? (
              <div className="monitor-orbit" data-testid="monitor-orbit">
                <div className="monitor-orbit-connectors" aria-hidden />
                {metricChips.map((item) => {
                  const tone = item.tone || "default";
                  const MetricIcon = resolveMetricIcon(item);
                  const badgeKey = resolveHudBadgeKey(presentation, item);
                  return (
                    <article
                      key={item.id}
                      className="monitor-orbit-chip"
                      data-tone={tone}
                      data-testid={`monitor-orbit-${item.id}`}
                    >
                      <p className="monitor-orbit-chip-label">
                        {badgeKey ? (
                          <HudBadge badgeKey={badgeKey} size={22} decorative tone={tone} />
                        ) : (
                          <MetricIcon className="h-3.5 w-3.5 text-primary/80" />
                        )}
                        {item.label}
                      </p>
                      <p className="monitor-orbit-chip-value">
                        {stringifyKpiValue(item.value)}
                      </p>
                    </article>
                  );
                })}
              </div>
            ) : null}
          </section>
        ) : (
          <MonitorKpiStrip items={model.kpis} compact={isCompact} />
        )}

        {isHud && metricChips.length && !isCompact ? (
          <div className="monitor-metric-row" data-testid="monitor-metric-row">
            {metricChips.map((item) => {
              const tone = item.tone || "default";
              const MetricIcon = resolveMetricIcon(item);
              const badgeKey = resolveHudBadgeKey(presentation, item);
              return (
                <article
                  key={item.id}
                  className="monitor-metric-chip"
                  data-tone={tone}
                  data-testid={`monitor-metric-${item.id}`}
                >
                  <div className="monitor-metric-chip-grid" aria-hidden />
                  <div className="flex items-center justify-between gap-2">
                    <p className="monitor-metric-chip-label">
                      {badgeKey ? (
                        <HudBadge badgeKey={badgeKey} size={24} decorative tone={tone} />
                      ) : (
                        <MetricIcon className="h-3.5 w-3.5 text-primary/80" />
                      )}
                      {item.label}
                    </p>
                    <span className="monitor-metric-chip-tone">{toneLabelMap[tone]}</span>
                  </div>
                  <p className="monitor-metric-chip-value">{stringifyKpiValue(item.value)}</p>
                  {item.sublabel ? (
                    <p className="monitor-metric-chip-subtitle">{item.sublabel}</p>
                  ) : null}
                </article>
              );
            })}
          </div>
        ) : null}

        {!isCompact ? (
          template === "pipeline" ? (
            <div className="mt-3 grid gap-3">
              <MonitorDiagramPanel diagram={model.diagram} skin={skin} layout="pipeline" />
              <MonitorChartPanel
                series={model.series}
                compact
                variant="sparkline"
                reducedMotion={reducedMotion}
                skin={skin}
              />
            </div>
          ) : template === "network" ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonitorDiagramPanel diagram={model.diagram} skin={skin} layout="network" />
              </div>
              <MonitorChartPanel
                series={model.series}
                compact
                reducedMotion={reducedMotion}
                skin={skin}
              />
            </div>
          ) : template === "tool" ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <MonitorChartPanel
                series={model.series}
                compact
                reducedMotion={reducedMotion}
                skin={skin}
              />
              <MonitorDiagramPanel diagram={model.diagram} skin={skin} />
            </div>
          ) : template === "auth" ? (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonitorDiagramPanel diagram={model.diagram} skin={skin} />
              </div>
              <MonitorChartPanel
                series={model.series}
                compact
                variant="sparkline"
                reducedMotion={reducedMotion}
                skin={skin}
              />
            </div>
          ) : template === "public" ? (
            <div className="mt-3 grid gap-3">
              <MonitorChartPanel
                series={model.series}
                compact
                variant="sparkline"
                reducedMotion={reducedMotion}
                skin={skin}
              />
              <MonitorDiagramPanel diagram={model.diagram} skin={skin} />
            </div>
          ) : (
            <div className="mt-3 grid gap-3 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <MonitorChartPanel
                  series={model.series}
                  compact
                  reducedMotion={reducedMotion}
                  skin={skin}
                />
              </div>
              <MonitorDiagramPanel diagram={model.diagram} skin={skin} />
            </div>
          )
        ) : null}
      </section>
    </div>
  );
}
