import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { SEO } from "@/components/SEO";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { withPersistedUiFlags } from "@/lib/featureFlags";
import { HudBadge } from "@/components/hud/HudBadge";
import { OpsMissions } from "@/components/dashboard/OpsMissions";
import { useDashboardCommandCenter } from "@/hooks/useDashboardCommandCenter";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { cn } from "@/lib/utils";

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function deriveFirstName(user: any) {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fromMetadata =
    typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  return (
    fromMetadata?.split(" ")[0] ??
    (user?.email ? user.email.split("@")[0] : "Team")
  );
}

function InsightsPanel() {
  const navigate = useNavigate();
  const location = useLocation();

  const [mounted, setMounted] = useState(false);

  return (
    <details
      className="hud-insights"
      onToggle={(event) => {
        const nextOpen = (event.target as HTMLDetailsElement).open;
        if (nextOpen) setMounted(true);
      }}
    >
      <summary className="hud-insights__summary">
        <span className="hud-insights__text">
          <span className="hud-insights__label">Insights</span>
          <span className="hud-insights__hint">
            Load subscription + pipeline analytics on demand
          </span>
        </span>
        <span className="hud-insights__chev" aria-hidden>
          <ChevronDown className="hud-insights__chevDown" />
          <ChevronUp className="hud-insights__chevUp" />
        </span>
      </summary>

      {mounted ? (
        <DashboardInsightsContent
          onOpenHistory={() =>
            navigate(withPersistedUiFlags("/history", { search: location.search }))
          }
        />
      ) : null}
    </details>
  );
}

function DashboardInsightsContent({ onOpenHistory }: { onOpenHistory: () => void }) {
  // Heavy hooks are mounted only when the user opens Insights.
  // Keep this page compatible with the current hooks on `main` (no options arg).
  const dashboard = useDashboardStats();
  const revenue = useRevenueAnalytics();

  const monthly = dashboard.isLoading ? "--" : dashboard.stats.monthlyCalculations;
  const plan = dashboard.isLoading ? "--" : dashboard.stats.planDisplayName;
  const reset = dashboard.isLoading ? "--" : dashboard.stats.billingCycleResetLabel;
  const risk = revenue.isLoading ? "--" : revenue.revenueStats.revenueAtRisk.toLocaleString();
  const conv = revenue.isLoading ? "--" : `${revenue.pipelineStats.conversionRate}%`;

  return (
    <div className="hud-insights__content">
      <div className="hud-insightsGrid">
        <div className="hud-insightCard">
          <p className="hud-insightCard__label">This Month</p>
          <p className="hud-insightCard__value">{monthly}</p>
          <p className="hud-insightCard__meta">Saved calculations</p>
        </div>
        <div className="hud-insightCard">
          <p className="hud-insightCard__label">Plan</p>
          <p className="hud-insightCard__value">{plan}</p>
          <p className="hud-insightCard__meta">Reset: {reset}</p>
        </div>
        <div className="hud-insightCard" data-tone="warning">
          <p className="hud-insightCard__label">Revenue Risk</p>
          <p className="hud-insightCard__value">{risk}</p>
          <p className="hud-insightCard__meta">Unpaid invoices</p>
        </div>
        <div className="hud-insightCard" data-tone="info">
          <p className="hud-insightCard__label">Lead Conversion</p>
          <p className="hud-insightCard__value">{conv}</p>
          <p className="hud-insightCard__meta">Pipeline signal</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={onOpenHistory}>
          View History <ArrowRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {dashboard.isLoading || revenue.isLoading ? (
        <p className="mt-2 text-xs text-muted-foreground">Loading insights…</p>
      ) : null}
    </div>
  );
}

export function DashboardCommandCenter() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    auth,
    telemetry,
    telemetryLoading,
    modules,
    recentCalculations,
    recentLoading,
    readiness,
  } = useDashboardCommandCenter();

  const firstName = useMemo(() => deriveFirstName(auth.user), [auth.user]);

  if (auth.isLoading) {
    return (
      <PageContainer variant="standard" className="app-stack-16">
        <div className="hud-surface p-6 text-sm text-muted-foreground">Loading command center…</div>
      </PageContainer>
    );
  }

  if (!auth.user) {
    return (
      <PageContainer variant="standard" className="app-stack-16">
        <div className="hud-surface p-6 text-sm text-muted-foreground">
          Please sign in to view your dashboard.
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="hud-dashboard app-stack-16">
      <SEO
        title="Dashboard"
        description="Gamified operations command center for dispatch, triage, jobs, and clients."
      />

      <div className="hud-dashboardHeader">
        <div className="min-w-0">
          <p className="hud-dashboardKicker">Command Center</p>
          <h1 className="hud-dashboardTitle">Welcome back, {firstName}</h1>
          <p className="hud-dashboardSubtitle">
            Run dispatch, intake, and field operations with live mission signals.
          </p>
        </div>
        <div className="hud-dashboardActions">
          <Button onClick={() => navigate(withPersistedUiFlags("/estimate-builder", { search: location.search }))}>
            New Estimate
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(withPersistedUiFlags("/dashboard/dispatch", { search: location.search }))}
          >
            Open Dispatch
          </Button>
        </div>
      </div>

      <div className="hud-dashboardGrid">
        <section className="hud-modulesDeck">
          <div className="hud-modulesDeck__header">
            <h2 className="hud-modulesDeck__title">Modules</h2>
            <p className="hud-modulesDeck__meta">
              {telemetryLoading ? "Syncing signals…" : `${readiness.completed}/${readiness.known || "--"} clear`}
            </p>
          </div>

          <div className="hud-modulesDeck__grid" data-testid="hud-modules">
            {modules.map((module) => (
              <button
                key={module.id}
                type="button"
                className="hud-tile"
                onClick={() =>
                  navigate(withPersistedUiFlags(module.to, { search: location.search }))
                }
              >
                <HudBadge badgeKey={module.badgeKey} size={64} priority decorative />
                <div className="min-w-0">
                  <p className="hud-tile__title">{module.title}</p>
                  <p className="hud-tile__desc">{module.description}</p>
                </div>
                <span className="hud-tile__open">
                  Open <ArrowRight className="ml-1 h-4 w-4" />
                </span>
              </button>
            ))}
          </div>
        </section>

        <OpsMissions telemetry={telemetry} />
      </div>

      <section className={cn("hud-recent hud-contentAuto")} data-testid="hud-recent">
        <header className="hud-recent__header">
          <h2 className="hud-recent__title">Recent Calculations</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(withPersistedUiFlags("/history", { search: location.search }))}
          >
            View History
          </Button>
        </header>

        {recentLoading ? (
          <div className="hud-recent__skeleton">
            <div className="hud-recent__skeletonRow" />
            <div className="hud-recent__skeletonRow" />
            <div className="hud-recent__skeletonRow" />
          </div>
        ) : recentCalculations.length === 0 ? (
          <p className="hud-empty">
            No saved calculations yet. Run a tool and your history appears here.
          </p>
        ) : (
          <div className="hud-recent__grid">
            {recentCalculations.map((item) => (
              <div key={item.id} className="hud-recentItem">
                <p className="hud-recentItem__title">
                  {item.name || `${item.calculation_type} calculation`}
                </p>
                <p className="hud-recentItem__meta">
                  {item.calculation_type} • {formatTimestamp(item.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <InsightsPanel />
    </PageContainer>
  );
}
