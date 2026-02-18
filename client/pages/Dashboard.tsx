import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import {
  Activity,
  ArrowRight,
  Briefcase,
  Calculator,
  Clock,
  FileText,
  Users,
  Wrench,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { SystemStatus } from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/PageContainer";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { AppStatCard } from "@/components/app/AppStatCard";
import { resolveFutureMonitorsFlag, resolveFutureMonitorsSkin } from "@/lib/featureFlags";
import { DashboardCommandCenter } from "@/pages/dashboard/DashboardCommandCenter";
import { DashboardV2 } from "@/pages/dashboard/DashboardV2";

function formatMoney(value: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const workflowLinks = [
  {
    title: "Dispatch Board",
    description: "Assign and route active service work.",
    to: "/dashboard/dispatch",
    icon: Wrench,
  },
  {
    title: "Triage Board",
    description: "Review incoming requests and convert to jobs.",
    to: "/dashboard/triage",
    icon: Activity,
  },
  {
    title: "Jobs",
    description: "Track current work from intake to closeout.",
    to: "/dashboard/jobs",
    icon: Briefcase,
  },
  {
    title: "Clients",
    description: "Manage accounts, sites, and service history.",
    to: "/dashboard/clients",
    icon: Users,
  },
  {
    title: "Estimate Builder",
    description: "Build and save scoped estimates quickly.",
    to: "/estimate-builder",
    icon: Calculator,
  },
  {
    title: "Compliance Report",
    description: "Generate refrigerant and leak-rate reporting.",
    to: "/tools/refrigerant-report",
    icon: FileText,
  },
];

export function Dashboard() {
  const location = useLocation();
  const futureEnabled = resolveFutureMonitorsFlag({ search: location.search });
  const skin = resolveFutureMonitorsSkin({ search: location.search });

  if (futureEnabled && skin === "hud") {
    return <DashboardCommandCenter />;
  }

  if (futureEnabled && skin === "infographic") {
    return <DashboardV2 />;
  }

  return <DashboardLegacy />;
}

function DashboardLegacy() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const { stats, isLoading: statsLoading, calculations } = useDashboardStats();
  const { revenueStats, pipelineStats } = useRevenueAnalytics();

  const firstName = useMemo(() => {
    const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
    const fromMetadata =
      typeof metadata.full_name === "string" ? metadata.full_name : undefined;
    return (
      fromMetadata?.split(" ")[0] ??
      (user?.email ? user.email.split("@")[0] : "Team")
    );
  }, [user]);

  const recentCalculations = useMemo(
    () => calculations.slice(0, 6),
    [calculations],
  );

  if (authLoading) {
    return (
      <PageContainer variant="standard" className="app-stack-24">
        <AppSectionCard className="p-8 text-sm text-muted-foreground">
          Loading dashboard...
        </AppSectionCard>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer variant="standard" className="app-stack-24">
        <AppSectionCard className="p-8 text-sm text-muted-foreground">
          Please sign in to view your dashboard.
        </AppSectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <SEO
        title="Dashboard"
        description="Operations overview for dispatch, compliance, and engineering workflows."
      />

      <AppPageHeader
        kicker="Work"
        title="Operations Dashboard"
        subtitle={`Welcome back, ${firstName}. Monitor dispatch, compliance, and engineering activity in one view.`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => navigate("/estimate-builder")}>New Estimate</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard/dispatch")}>
              Open Dispatch
            </Button>
          </div>
        }
      />

      <SystemStatus />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppStatCard
          label="This Month"
          value={statsLoading ? "--" : stats.monthlyCalculations}
          meta={
            stats.isUnlimited
              ? "Unlimited calculations"
              : `${stats.remaining} remaining before reset`
          }
          icon={<Calculator className="h-5 w-5" />}
        />
        <AppStatCard
          label="Subscription"
          value={stats.planDisplayName}
          meta={`Reset: ${stats.billingCycleResetLabel}`}
          icon={<Clock className="h-5 w-5" />}
          tone={stats.isNearLimit ? "warning" : "default"}
        />
        <AppStatCard
          label="Revenue At Risk"
          value={formatMoney(revenueStats.revenueAtRisk)}
          meta={`${revenueStats.unpaidCount} unpaid invoices`}
          icon={<FileText className="h-5 w-5" />}
          tone={revenueStats.revenueAtRisk > 0 ? "warning" : "default"}
        />
        <AppStatCard
          label="Lead Conversion"
          value={`${pipelineStats.conversionRate}%`}
          meta={`${pipelineStats.activeLeads} active leads, ${pipelineStats.convertedLeads} converted`}
          icon={<Activity className="h-5 w-5" />}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <AppSectionCard className="xl:col-span-2 app-stack-16">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Core Workflows</h2>
            <p className="text-sm text-muted-foreground">Owner and manager controls</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {workflowLinks.map((item) => (
              <button
                key={item.to}
                type="button"
                onClick={() => navigate(item.to)}
                className="app-surface-muted app-border-strong flex items-center justify-between gap-3 p-4 text-left transition-colors hover:bg-secondary"
              >
                <div className="app-stack-8">
                  <p className="text-sm font-semibold">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <item.icon className="h-4 w-4" />
                  <ArrowRight className="h-4 w-4" />
                </div>
              </button>
            ))}
          </div>
        </AppSectionCard>

        <AppSectionCard className="app-stack-16">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Recent Calculations</h2>
            <Button variant="ghost" size="sm" onClick={() => navigate("/history")}>
              View History
            </Button>
          </div>
          {recentCalculations.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              No saved calculations yet. Run a tool and your history appears here.
            </p>
          ) : (
            <div className="space-y-3">
              {recentCalculations.map((item) => (
                <div key={item.id} className="app-surface-muted p-3">
                  <p className="text-sm font-medium">
                    {item.name || `${item.calculation_type} calculation`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {item.calculation_type} • {formatTimestamp(item.created_at)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </AppSectionCard>
      </div>
    </PageContainer>
  );
}
