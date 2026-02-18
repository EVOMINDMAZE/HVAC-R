import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { withPersistedUiFlags, shouldBypassAuth } from "@/lib/featureFlags";
import {
  OpsStatusBar,
  deriveOpsStages,
  ActionQueue,
  QuickActionsPanel,
  NavigationRail,
  DEFAULT_NAV_ITEMS,
  RecentActivity,
  InsightsAccordion,
  HeroMetrics,
} from "@/components/infographic";
import type { ActionItem, RecentActivityItem, InsightCard, HeroMetric } from "@/components/infographic";
import { useDashboardCommandCenter } from "@/hooks/useDashboardCommandCenter";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";

function deriveFirstName(user: any): string {
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const fromMetadata =
    typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  return (
    fromMetadata?.split(" ")[0] ??
    (user?.email ? user.email.split("@")[0] : "Team")
  );
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function DashboardV2() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    auth,
    telemetry,
    telemetryLoading: _telemetryLoading,
    recentCalculations,
    recentLoading,
    readiness,
  } = useDashboardCommandCenter();

  const dashboard = useDashboardStats();
  const revenue = useRevenueAnalytics();

  const [selectedJobId, setSelectedJobId] = useState<string | undefined>();

  const firstName = useMemo(() => deriveFirstName(auth.user), [auth.user]);

  const stages = useMemo(() => deriveOpsStages(telemetry), [telemetry]);

  const techs = useMemo(
    () => ({
      total: telemetry?.team?.technicians ?? ("--" as const),
      active: telemetry?.team?.technicians ?? ("--" as const),
    }),
    [telemetry]
  );

  const heroMetrics: HeroMetric[] = useMemo(() => {
    const jobs = telemetry?.jobs;
    return [
      {
        id: "active-jobs",
        label: "Active Jobs",
        value: (jobs?.pending ?? 0) + (jobs?.enRoute ?? 0) + (jobs?.onSite ?? 0),
        format: "number",
        status: (jobs?.pending ?? 0) > 0 ? "warning" : "success",
        sparklineData: [3, 5, 4, 6, 8, 7, 9, 5, 4, 6, 7, 8],
        trend: "up",
        trendValue: "+12%",
      },
      {
        id: "completed",
        label: "Completed Today",
        value: jobs?.completed ?? 0,
        format: "number",
        status: "success",
        sparklineData: [2, 4, 3, 5, 4, 6, 5, 7, 6, 8, 7, 9],
        trend: "up",
        trendValue: "+8%",
      },
      {
        id: "scheduled",
        label: "Scheduled",
        value: jobs?.scheduledToday ?? 0,
        format: "number",
        status: "neutral",
        sparklineData: [5, 4, 6, 5, 7, 6, 8, 7, 9, 8, 10, 9],
        trend: "neutral",
        trendValue: "0%",
      },
      {
        id: "revenue",
        label: "Revenue Risk",
        value: revenue.revenueStats.revenueAtRisk,
        format: "currency",
        status: revenue.revenueStats.revenueAtRisk > 0 ? "danger" : "success",
        trend: revenue.revenueStats.revenueAtRisk > 0 ? "down" : "neutral",
        trendValue: revenue.revenueStats.revenueAtRisk > 0 ? "Attention" : "Clear",
      },
    ];
  }, [telemetry, revenue]);

  const actionItems: ActionItem[] = useMemo(() => {
    const items: ActionItem[] = [];
    const jobs = telemetry?.jobs;

    if (!jobs) return items;

    if (jobs.pending && jobs.pending > 0) {
      items.push({
        id: `pending-${items.length}`,
        jobNumber: "Queue",
        type: "Pending dispatch",
        location: `${jobs.pending} job${jobs.pending > 1 ? "s" : ""}`,
        priority: "urgent",
        age: "Awaiting",
        onView: () => navigate(withPersistedUiFlags("/dashboard/dispatch", { search: location.search })),
      });
    }

    if (jobs.unassigned && jobs.unassigned > 0) {
      items.push({
        id: `unassigned-${items.length}`,
        jobNumber: "Unassigned",
        type: "No technician",
        location: `${jobs.unassigned} job${jobs.unassigned > 1 ? "s" : ""}`,
        priority: "today",
        age: "Needs assignment",
        onView: () => navigate(withPersistedUiFlags("/dashboard/dispatch", { search: location.search })),
      });
    }

    if (jobs.scheduledToday && jobs.scheduledToday > 0) {
      items.push({
        id: `scheduled-${items.length}`,
        jobNumber: "Today",
        type: "Scheduled",
        location: `${jobs.scheduledToday} job${jobs.scheduledToday > 1 ? "s" : ""}`,
        priority: "scheduled",
        age: "Today",
        onView: () => navigate(withPersistedUiFlags("/dashboard/jobs", { search: location.search })),
      });
    }

    return items.slice(0, 3);
  }, [telemetry, navigate, location.search]);

  const recentItems: RecentActivityItem[] = useMemo(() => {
    if (recentLoading || recentCalculations.length === 0) {
      return [];
    }
    return recentCalculations.slice(0, 5).map((calc) => ({
      id: calc.id,
      name: calc.name || `${calc.calculation_type} calculation`,
      type: calc.calculation_type,
      timestamp: calc.created_at,
    }));
  }, [recentCalculations, recentLoading]);

  const insightCards: InsightCard[] = useMemo(() => {
    const monthly = dashboard.isLoading ? "--" : dashboard.stats.monthlyCalculations;
    const plan = dashboard.isLoading ? "--" : dashboard.stats.planDisplayName;
    const risk = revenue.isLoading ? "--" : formatMoney(revenue.revenueStats.revenueAtRisk);
    const conv = revenue.isLoading ? "--" : `${revenue.pipelineStats.conversionRate}%`;

    return [
      { id: "monthly", label: "This Month", value: monthly, meta: "Saved calculations" },
      { id: "plan", label: "Plan", value: plan, meta: `Reset: ${dashboard.stats.billingCycleResetLabel}` },
      {
        id: "risk",
        label: "Revenue Risk",
        value: risk,
        meta: "Unpaid invoices",
        tone: revenue.revenueStats.revenueAtRisk > 0 ? "warning" : "default",
      },
      {
        id: "conversion",
        label: "Lead Conversion",
        value: conv,
        meta: "Pipeline signal",
        tone: "info",
      },
    ];
  }, [dashboard, revenue]);

  const navItems = useMemo(() => {
    return DEFAULT_NAV_ITEMS.map((item) => {
      let count: number | "--" = "--";
      if (item.id === "dispatch" && telemetry?.jobs?.pending != null) {
        count = telemetry.jobs.pending;
      } else if (item.id === "triage" && telemetry?.triage?.new != null) {
        count = telemetry.triage.new;
      } else if (item.id === "jobs" && telemetry?.jobs?.total != null) {
        count = telemetry.jobs.total;
      } else if (item.id === "clients" && telemetry?.clients?.total != null) {
        count = telemetry.clients.total;
      }
      return { ...item, count };
    });
  }, [telemetry]);

  const handleNavigate = (to: string) => {
    navigate(withPersistedUiFlags(to, { search: location.search }));
  };

  const handleViewHistory = () => {
    navigate(withPersistedUiFlags("/history", { search: location.search }));
  };

  if (auth.isLoading) {
    return (
      <PageContainer variant="standard" className="dashboard-v2 dashboard-v2--loading">
        <SEO title="Dashboard" description="Loading command center..." />
        <div className="dashboard-v2__skeleton">
          <div className="dashboard-v2__skeleton-header" />
          <div className="dashboard-v2__skeleton-content">
            <div className="dashboard-v2__skeleton-card" />
            <div className="dashboard-v2__skeleton-card" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (!auth.user && !shouldBypassAuth()) {
    return (
      <PageContainer variant="standard" className="dashboard-v2 dashboard-v2--unauth">
        <SEO title="Dashboard" description="Please sign in" />
        <div className="dashboard-v2__unauth">
          <h2>Sign in required</h2>
          <p>Please sign in to view your command center.</p>
          <Button onClick={() => navigate("/signin")}>Sign In</Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="dashboard-v2">
      <SEO
        title="Dashboard"
        description="Mission control operations dashboard for dispatch, triage, jobs, and clients."
      />

      <header className="dashboard-v2__header">
        <div className="dashboard-v2__greeting">
          <span className="dashboard-v2__kicker">Command Center</span>
          <h1 className="dashboard-v2__title">Welcome back, {firstName}</h1>
          <p className="dashboard-v2__subtitle">
            Run dispatch, intake, and field operations with live mission signals.
          </p>
        </div>
        <div className="dashboard-v2__actions">
          <Button onClick={() => handleNavigate("/estimate-builder")}>
            New Estimate
          </Button>
          <Button variant="outline" onClick={() => handleNavigate("/dashboard/dispatch")}>
            Open Dispatch
          </Button>
        </div>
      </header>

      <HeroMetrics metrics={heroMetrics} />

      <OpsStatusBar
        stages={stages}
        techs={techs}
        readiness={readiness.readinessPercent ?? undefined}
      />

      <main className="dashboard-v2__main">
        <div className="dashboard-v2__column">
          <ActionQueue
            items={actionItems}
            onViewAll={() => handleNavigate("/dashboard/dispatch")}
          />

          <NavigationRail
            items={navItems}
            onNavigate={handleNavigate}
          />
        </div>

        <div className="dashboard-v2__column">
          <QuickActionsPanel
            selectedJobId={selectedJobId}
            technicians={[
              { id: "tech-1", name: "Mike Johnson", available: true },
              { id: "tech-2", name: "Sarah Chen", available: true },
              { id: "tech-3", name: "David Park", available: false },
            ]}
            onDispatch={(jobId, techId, priority, notes) => {
              console.log("Dispatch:", { jobId, techId, priority, notes });
              setSelectedJobId(undefined);
            }}
            onSchedule={(clientId, jobType, datetime) => {
              console.log("Schedule:", { clientId, jobType, datetime });
            }}
          />
        </div>
      </main>

      <RecentActivity
        items={recentItems}
        onViewHistory={handleViewHistory}
      />

      <InsightsAccordion
        summary={`subscription: ${dashboard.stats.planDisplayName}, revenue at risk: ${formatMoney(revenue.revenueStats.revenueAtRisk)}, conversion: ${revenue.pipelineStats.conversionRate}%`}
        cards={insightCards}
        onViewDetails={handleViewHistory}
      />
    </PageContainer>
  );
}
