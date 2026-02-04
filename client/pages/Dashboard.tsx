import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useDashboardStats, DashboardStats } from "@/hooks/useDashboardStats";
import { Footer } from "@/components/Footer";
import { SystemStatus } from "@/components/SystemStatus";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Calculator,
  History as HistoryIcon,
  TrendingUp,
  FileText,
  Plus,
  Clock,
  BarChart3,
  Crown,
  Zap,
  Target,
  RefreshCw,
  Loader2,
  ArrowRight,
  Sparkles,
  Layers,
} from "lucide-react";
import { RiskShield } from "@/components/OwnerDashboard/RiskShield";
import { SEO } from "@/components/SEO";
import { PageContainer } from "@/components/PageContainer";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

interface QuickStatsProps {
  stats: DashboardStats;
  user: any;
  isLoading: boolean;
  onRefresh: () => void;
}

interface UsageProgressCardProps {
  stats: DashboardStats;
  onUpgrade: () => void;
}

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

function UsageProgressCard({ stats, onUpgrade }: UsageProgressCardProps) {
  const roundedUsage = Math.round(stats.usagePercentage);

  return (
    <Card className="glass-card border-primary/20 hover-lift animate-fade-in">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">
              Free plan usage
            </p>
            <h3 className="mt-1 text-lg font-semibold text-foreground">
              {stats.monthlyCalculations} of {stats.monthlyLimit} calculations
              used
            </h3>
            <p className="text-sm text-muted-foreground">
              Resets on {stats.billingCycleResetLabel}
            </p>
          </div>
          <Badge className="glass border-primary/20 text-primary">
            {roundedUsage}% used
          </Badge>
        </div>

        <Progress
          value={stats.usagePercentage}
          aria-label="Monthly calculation usage"
          className="h-2 bg-muted"
        />

        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
          <span>
            {stats.remaining} calculation{stats.remaining === 1 ? "" : "s"}{" "}
            remaining this month
          </span>
          <Button
            size="sm"
            onClick={onUpgrade}
            className="glass hover:bg-primary/20 text-primary border-primary/20"
          >
            Upgrade plan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickStats({ stats, user, isLoading, onRefresh }: QuickStatsProps) {
  const navigate = useNavigate();
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataName =
    typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  const firstName =
    metadataName?.split(" ")[0] ??
    (user?.email ? user.email.split("@")[0] : undefined);

  const handleUpgrade = () => navigate("/pricing");

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between animate-fade-in">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back{firstName ? `, ${firstName}` : ""}{" "}
            <span className="inline-block animate-bounce">👋</span>
          </h2>
          <p className="mt-2 text-lg text-muted-foreground">
            Your workspace is ready. Here's what's happening today.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <OnboardingGuide userName={firstName} />
            {!stats.isUnlimited && (
              <Badge variant="outline" className="glass text-primary px-3 py-1">
                {stats.remaining} calculation{stats.remaining === 1 ? "" : "s"}{" "}
                left this month
              </Badge>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all duration-300 transform hover:-translate-y-0.5 rounded-full px-6"
            onClick={() => navigate("/tools/standard-cycle")}
          >
            <Calculator className="h-4 w-4 mr-2" />
            New Calculation
          </Button>

          <Button
            variant="outline"
            className="glass hover-lift hidden sm:inline-flex items-center"
            onClick={onRefresh}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>
        </div>
      </div>

      {stats.isNearLimit && (
        <Card
          className={`glass-card border-l-4 ${
            stats.isAtLimit
              ? "border-l-destructive bg-destructive/5"
              : "border-l-amber-500 bg-amber-50/50 dark:bg-amber-950/20"
          } animate-slide-up`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2 rounded-full ${stats.isAtLimit ? "bg-red-100 text-red-600 dark:bg-red-900/20 dark:text-red-400" : "bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"}`}
                >
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">
                    {stats.isAtLimit
                      ? "Monthly Limit Reached"
                      : "Approaching Monthly Limit"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {stats.isAtLimit
                      ? "Upgrade to Pro for unlimited calculations."
                      : `You've used ${stats.monthlyCalculations}/${stats.monthlyLimit} calculations.`}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className={
                  stats.isAtLimit
                    ? "bg-destructive text-white hover:bg-destructive/90"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }
                onClick={handleUpgrade}
              >
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!stats.isUnlimited && (
        <UsageProgressCard stats={stats} onUpgrade={handleUpgrade} />
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <StatsCard
          title="Total Calculations"
          value={formatNumber(stats.totalCalculations)}
          subtitle="All time"
          icon={Calculator}
          gradient="from-orange-500 to-slate-600"
          delay={0}
        />
        <StatsCard
          title="This Month"
          value={`${formatNumber(stats.monthlyCalculations)}${!stats.isUnlimited ? `/${stats.monthlyLimit}` : ""}`}
          subtitle={
            !stats.isUnlimited
              ? `${Math.round(stats.usagePercentage)}% used`
              : "Unlimited"
          }
          icon={FileText}
          gradient="from-slate-500 to-slate-600"
          delay={100}
        />
        <StatsCard
          title="Remaining"
          value={stats.remainingText}
          subtitle="This month"
          icon={TrendingUp}
          gradient={
            stats.remainingValue <= 2
              ? "from-red-500 to-rose-600"
              : "from-emerald-500 to-teal-600"
          }
          delay={200}
        />
        <Card
          className="glass-card hover-lift cursor-pointer group relative overflow-hidden"
          onClick={handleUpgrade}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          <CardContent className="p-6 relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Current Plan
                </p>
                <p className="mt-2 text-2xl font-bold text-foreground">
                  {stats.planDisplayName}
                </p>
                <p className="mt-1 text-xs text-primary flex items-center">
                  {stats.plan === "free"
                    ? "Upgrade to Pro"
                    : "Manage Subscription"}
                  <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </p>
              </div>
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg">
                {stats.plan === "free" ? (
                  <BarChart3 className="h-6 w-6" />
                ) : (
                  <Crown className="h-6 w-6" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  gradient,
  delay,
}: any) {
  return (
    <Card
      className="glass-card hover-lift overflow-hidden relative group"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`absolute top-0 right-0 p-20 bg-gradient-to-br ${gradient} opacity-10 blur-3xl rounded-full -mr-10 -mt-10 transition-opacity group-hover:opacity-20`}
      />
      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold text-foreground tracking-tight">
              {value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground font-medium">
              {subtitle}
            </p>
          </div>
          <div
            className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg transform group-hover:scale-110 transition-transform duration-300`}
          >
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function RecentCalculations({ isLoading }: any) {
  const navigate = useNavigate();
  const { calculations } = useSupabaseCalculations();
  const recentCalculations = calculations.slice(0, 5);

  return (
    <Card
      className="glass-card h-full flex flex-col animate-slide-up"
      style={{ animationDelay: "300ms" }}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-foreground">
          <HistoryIcon className="h-5 w-5 mr-2 text-primary" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 flex-1">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentCalculations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center p-6">
            <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
              <Calculator className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              No calculations yet
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Start your first calculation to see it appear here.
            </p>
            <Button
              onClick={() => navigate("/tools/standard-cycle")}
              className="glass text-primary hover:bg-primary/10"
            >
              Start Calculation
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {recentCalculations.map((calc: any) => (
              <div
                key={calc.id}
                className="group flex items-center justify-between p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                onClick={() => navigate(`/calculations/${calc.id}`)}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate">
                      {calc.name || calc.calculation_type}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(calc.created_at).toLocaleDateString()}
                      </span>
                      <span className="w-1 h-1 bg-muted-foreground rounded-full" />
                      <span className="uppercase tracking-wider font-medium text-[10px]">
                        {calc.calculation_type}
                      </span>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "Standard Cycle",
      icon: Calculator,
      path: "/tools/standard-cycle",
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      label: "Compare Refrigerants",
      icon: TrendingUp,
      path: "/tools/refrigerant-comparison",
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      label: "Cascade Analysis",
      icon: BarChart3,
      path: "/tools/cascade-cycle",
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/20",
    },
    {
      label: "Reports & PDF",
      icon: FileText,
      path: "/tools/advanced-reporting",
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      label: "My Projects",
      icon: Layers,
      path: "/dashboard/projects",
      color: "text-slate-600 dark:text-slate-400",
      bg: "bg-slate-50 dark:bg-slate-900/20",
    },
  ];

  return (
    <Card
      className="glass-card animate-slide-up"
      style={{ animationDelay: "400ms" }}
    >
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="flex items-center text-lg font-semibold text-foreground">
          <Zap className="h-5 w-5 mr-2 text-amber-500" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 grid grid-cols-1 gap-3">
        {actions.map((action) => (
          <Button
            key={action.path}
            variant="ghost"
            className="w-full justify-start h-auto py-3 px-4 hover:bg-muted/50 border border-transparent hover:border-border transition-all group"
            onClick={() => navigate(action.path)}
          >
            <div
              className={`p-2 rounded-lg ${action.bg} ${action.color} mr-3 group-hover:scale-110 transition-transform`}
            >
              <action.icon className="h-4 w-4" />
            </div>
            <span className="font-medium text-muted-foreground group-hover:text-foreground">
              {action.label}
            </span>
            <ArrowRight className="ml-auto h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}

function ValueProposition() {
  const navigate = useNavigate();

  return (
    <Card
      className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white animate-slide-up"
      style={{ animationDelay: "500ms" }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -mr-16 -mt-16 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-slate-500/20 blur-[80px] rounded-full -ml-12 -mb-12 pointer-events-none" />

      <CardContent className="p-8 relative z-10 text-center">
        <div className="inline-flex p-3 rounded-2xl bg-white/10 backdrop-blur-md mb-6 shadow-xl border border-white/10">
          <Crown className="h-8 w-8 text-amber-400" />
        </div>

        <h2 className="text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
          Unlock Professional Power
        </h2>

        <p className="text-slate-300 mb-8 max-w-sm mx-auto leading-relaxed">
          Get unlimited calculations, PDF exports, and advanced team features.
        </p>

        <div className="grid grid-cols-3 gap-4 mb-8 text-center">
          {[
            { label: "Unlimited", icon: Zap },
            { label: "Analytics", icon: Target },
            { label: "Exports", icon: FileText },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-2">
              <div className="p-2 rounded-lg bg-white/5 border border-white/10">
                <item.icon className="h-4 w-4 text-slate-300" />
              </div>
              <span className="text-xs font-medium text-slate-400">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        <Button
          className="w-full bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/25 border-0"
          onClick={() => navigate("/pricing")}
        >
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}

function AnalyticsCharts() {
  const { revenueStats, pipelineStats, isLoading } = useRevenueAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
        <div className="h-64 bg-muted/50 rounded-xl" />
        <div className="h-64 bg-muted/50 rounded-xl" />
      </div>
    );
  }

  const revenueData = [
    { name: "Collected", value: 0, color: "#10b981" }, // Placeholder for now
    { name: "At Risk", value: revenueStats.revenueAtRisk, color: "#f59e0b" },
  ];

  const pipelineData = [
    { name: "Leads", value: pipelineStats.activeLeads, color: "#f97316" }, // orange-500
    { name: "Jobs", value: pipelineStats.convertedLeads, color: "#475569" }, // slate-600
  ];

  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-slide-up"
      style={{ animationDelay: "200ms" }}
    >
      {/* Revenue at Risk Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Target className="h-5 w-5 mr-2 text-amber-500" />
            Revenue Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={revenueData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fill: "currentColor", fontSize: 12 }}
                  width={60}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
            <div>
              <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
              <p className="text-2xl font-bold text-amber-500">
                ${formatNumber(revenueStats.revenueAtRisk)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Invoice Count</p>
              <p className="text-xl font-semibold text-foreground">
                {revenueStats.unpaidCount}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lead Pipeline Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-slate-500" />
            Lead Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "currentColor" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <RechartsTooltip
                  cursor={{ fill: "rgba(255,255,255,0.1)" }}
                  contentStyle={{
                    backgroundColor: "rgba(0,0,0,0.8)",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={48}>
                  {pipelineData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 flex justify-between items-center px-2">
            <div>
              <p className="text-sm text-muted-foreground">
                Conversion Probability
              </p>
              <p className="text-2xl font-bold text-slate-500">
                {pipelineStats.conversionRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Active Leads</p>
              <p className="text-xl font-semibold text-foreground">
                {pipelineStats.activeLeads}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard() {
  const { user } = useSupabaseAuth();
  const { stats, isLoading, refreshStats } = useDashboardStats();

  return (
    <PageContainer variant="standard" className="space-y-8">
      <SEO
        title="Dashboard"
        description="Manage your thermodynamic projects, view real-time system status, and access quick calculation tools."
      />
      <SystemStatus />

      <QuickStats
        stats={stats}
        user={user}
        isLoading={isLoading}
        onRefresh={refreshStats}
      />

      <AnalyticsCharts />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="lg:hidden">
            <QuickActions />
          </div>
          <RecentCalculations isLoading={isLoading} />
        </div>

        <aside className="space-y-8 lg:sticky lg:top-24">
          <div className="hidden lg:block">
            <QuickActions />
          </div>
          <RiskShield />
          <ValueProposition />
        </aside>
      </div>
    </PageContainer>
  );
}
