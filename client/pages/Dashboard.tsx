import { motion, useReducedMotion } from "framer-motion";
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
  Layers,
  ChevronDown,
  Lock,
  Star,
  Receipt,
  Users,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Cell,
} from "recharts";

import { AppPageHeader } from "@/components/app/AppPageHeader";
import { Footer } from "@/components/Footer";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { RiskShield } from "@/components/OwnerDashboard/RiskShield";
import { PageContainer } from "@/components/PageContainer";
import { SEO } from "@/components/SEO";
import { SystemStatus } from "@/components/SystemStatus";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { DashboardGrid, DashboardGridItem } from "@/components/ui/dashboard-grid";
import { DataPanel } from "@/components/ui/data-panel";
import { GlassCard } from "@/components/ui/glass-card";
import { MeasurementLabel } from "@/components/ui/MeasurementLabel";
import { Progress } from "@/components/ui/progress";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { useDashboardStats, DashboardStats } from "@/hooks/useDashboardStats";
import { useRevenueAnalytics } from "@/hooks/useRevenueAnalytics";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";

const prefersReducedMotion = typeof window !== "undefined"
  ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
  : false;

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: prefersReducedMotion ? 0 : 0.5, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: prefersReducedMotion ? 0 : 0.1,
    },
  },
};

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
  const reducedMotion = useReducedMotion();
  const roundedUsage = Math.round(stats.usagePercentage);
  const usageColor = stats.usagePercentage >= 90 ? "red" : stats.usagePercentage >= 70 ? "amber" : "cyan";

  const colorClasses = {
    red: {
      border: "border-destructive/50",
      bg: "bg-destructive/10",
      text: "text-destructive",
      gradientFrom: "from-destructive",
      gradientTo: "to-destructive/80",
    },
    amber: {
      border: "border-warning/50",
      bg: "bg-warning/10",
      text: "text-warning",
      gradientFrom: "from-warning",
      gradientTo: "to-warning/80",
    },
    cyan: {
      border: "border-primary/50",
      bg: "bg-primary/10",
      text: "text-primary",
      gradientFrom: "from-primary",
      gradientTo: "to-primary/80",
    },
  };

  const color = colorClasses[usageColor];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <MeasurementLabel className="text-primary">Usage</MeasurementLabel>
            <h3 className="mt-2 text-2xl font-bold text-foreground">
              {stats.monthlyCalculations}/{stats.monthlyLimit}
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Billing cycle resets: {stats.billingCycleResetLabel}
            </p>
          </div>
          <Badge
            variant="outline"
            className={`px-3 py-1 rounded-full ${color.border} ${color.bg} ${color.text}`}
          >
            {roundedUsage}% used
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.usagePercentage}%` }}
              transition={{ duration: reducedMotion ? 0 : 0.8, ease: "easeOut" }}
              className={`h-full rounded-full bg-gradient-to-r ${color.gradientFrom} ${color.gradientTo}`}
            />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>100%</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
          <div className="text-sm text-foreground">
            <span className="text-muted-foreground">Remaining:</span> {stats.remaining} calculation{stats.remaining === 1 ? "" : "s"}
          </div>
          <Button
            variant="default"
            size="sm"
            onClick={onUpgrade}
          >
            Upgrade Plan
          </Button>
        </div>
      </div>
    </div>
  );
}

function QuickStats({ stats, user, isLoading, onRefresh }: QuickStatsProps) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const metadataName =
    typeof metadata.full_name === "string" ? metadata.full_name : undefined;
  const firstName =
    metadataName?.split(" ")[0] ??
    (user?.email ? user.email.split("@")[0] : undefined);

  const handleUpgrade = () => navigate("/pricing");

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={staggerContainer}
      className="space-y-8"
    >
      <div className="relative">
        <SectionNumber number="01" className="-top-4 -left-4 md:-top-6 md:-left-8" />
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <MeasurementLabel>Daily Overview</MeasurementLabel>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-success" />
                  <span className="text-xs text-muted-foreground">Live</span>
                </div>
              </div>

              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-foreground">
                Welcome, {firstName || "Team"}
              </h2>

              <p className="text-base text-muted-foreground mt-2 max-w-2xl leading-relaxed">
                Track operations, monitor system health, and keep your field team moving with real-time visibility.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <OnboardingGuide userName={firstName} />
                {!stats.isUnlimited && (
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full border-border bg-secondary/40 text-foreground"
                  >
                    {stats.remaining} calculation{stats.remaining === 1 ? "" : "s"} remaining
                  </Badge>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
              <Button
                variant="default"
                size="lg"
                className="h-11 px-5"
                onClick={() => navigate("/tools/standard-cycle")}
              >
                <Calculator className="h-4 w-4 mr-2" />
                Start Calculation
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-11 px-5"
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
        </div>
      </div>

      {stats.isNearLimit && (
        <motion.div
          initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.4 }}
        >
          <GlassCard
            variant="command"
            className={`rounded-2xl p-1 ${stats.isAtLimit ? "border-destructive/30" : "border-warning/30"}`}
            glow={true}
          >
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-lg ${stats.isAtLimit ? "bg-destructive/20" : "bg-warning/20"} border ${stats.isAtLimit ? "border-destructive/30" : "border-warning/30"}`}>
                  <Zap className={`h-5 w-5 ${stats.isAtLimit ? "text-destructive" : "text-warning"}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${stats.isAtLimit ? "text-destructive" : "text-warning"}`}>
                    {stats.isAtLimit ? "Monthly Limit Reached" : "Approaching Monthly Limit"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {stats.isAtLimit
                      ? "Upgrade to Pro for unlimited calculations."
                      : `You've used ${stats.monthlyCalculations}/${stats.monthlyLimit} calculations.`}
                  </p>
                </div>
              </div>
              <Button
                variant={stats.isAtLimit ? "destructive" : "secondary"}
                onClick={handleUpgrade}
              >
                {stats.isAtLimit ? "Upgrade Now" : "Upgrade Plan"}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {!stats.isUnlimited && (
        <UsageProgressCard stats={stats} onUpgrade={handleUpgrade} />
      )}

      <div className="relative">
        <SectionNumber number="02" className="-top-4 -left-4 md:-top-6 md:-left-8" />
        <div className="space-y-4">
          <div>
            <MeasurementLabel>Primary Metrics</MeasurementLabel>
            <p className="text-sm text-muted-foreground mt-1">Scan usage risk, capacity, and plan in one row.</p>
          </div>
          <DashboardGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="md">
            <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
              <DataPanel
                title="Total Calculations"
                value={formatNumber(stats.totalCalculations)}
                subtitle="All-time calculations"
                variant="default"
                compact
              />
            </DashboardGridItem>

            <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
              <DataPanel
                title="This Month"
                value={`${formatNumber(stats.monthlyCalculations)}${!stats.isUnlimited ? `/${stats.monthlyLimit}` : ""}`}
                subtitle={
                  !stats.isUnlimited
                    ? `${Math.round(stats.usagePercentage)}% used`
                    : "Unlimited access"
                }
                variant={!stats.isUnlimited && stats.usagePercentage >= 70 ? "warning" : "success"}
                compact
              />
            </DashboardGridItem>

            <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
              <DataPanel
                title="Remaining Capacity"
                value={stats.remainingText}
                subtitle="Remaining capacity"
                variant={stats.remainingValue <= 2 ? "destructive" : "success"}
                compact
              />
            </DashboardGridItem>

            <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
              <div
                className="rounded-xl border border-border bg-card p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                onClick={handleUpgrade}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <MeasurementLabel className="text-muted-foreground">Current Plan</MeasurementLabel>
                    <p className="mt-1 text-xl font-semibold text-foreground">
                      {stats.planDisplayName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center">
                      {stats.plan === "free"
                        ? "Upgrade to Pro"
                        : "Manage subscription"}
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-muted border border-border">
                    {stats.plan === "free" ? (
                      <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Crown className="h-5 w-5 text-warning" />
                    )}
                  </div>
                </div>
              </div>
            </DashboardGridItem>
          </DashboardGrid>
        </div>
      </div>
    </motion.div>
  );
}

function RecentCalculations({ isLoading }: any) {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();
  const { calculations } = useSupabaseCalculations();
  const recentCalculations = calculations.slice(0, 5);

  return (
    <div className="h-full flex flex-col">
      <div className="border-b border-border pb-4 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MeasurementLabel>Recent Activity</MeasurementLabel>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="text-primary hover:text-primary hover:bg-primary/10"
            onClick={() => navigate("/calculations")}
          >
            View All
          </Button>
        </div>
      </div>

      <div className="flex-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
                <div className="w-10 h-10 bg-muted rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : recentCalculations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <div className="w-14 h-14 bg-muted rounded-xl flex items-center justify-center mb-4">
              <Calculator className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="font-semibold text-foreground mb-1">No Calculations Yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Initiate your first thermal analysis.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={() => navigate("/tools/standard-cycle")}
            >
              Start Calculation
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentCalculations.map((calc: any) => (
              <div
                key={calc.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => navigate(`/calculations/${calc.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-muted-foreground flex-shrink-0">
                    <Calculator className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-foreground truncate text-sm">
                      {calc.name || calc.calculation_type}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(calc.created_at).toLocaleDateString()}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <Badge
                        variant="outline"
                        className="px-2 py-0 rounded-full text-[10px]"
                      >
                        {calc.calculation_type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function QuickActions() {
  const navigate = useNavigate();
  const reducedMotion = useReducedMotion();

  const actions = [
    {
      label: "Standard Cycle",
      icon: Calculator,
      path: "/tools/standard-cycle",
    },
    {
      label: "Compare Refrigerants",
      icon: TrendingUp,
      path: "/tools/refrigerant-comparison",
    },
    {
      label: "Cascade Analysis",
      icon: BarChart3,
      path: "/tools/cascade-cycle",
    },
    {
      label: "Reports and PDF",
      icon: FileText,
      path: "/tools/advanced-reporting",
    },
    {
      label: "My Projects",
      icon: Layers,
      path: "/dashboard/projects",
    },
  ];

  return (
    <div>
      <div className="border-b border-border pb-4 mb-4">
        <MeasurementLabel>Quick Actions</MeasurementLabel>
        <p className="text-sm text-muted-foreground mt-1">
          Open the tools your team uses most.
        </p>
      </div>

      <div className="space-y-2">
        {actions.map((action) => (
          <button
            key={action.path}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card hover:bg-muted/30 cursor-pointer transition-colors group"
            onClick={() => navigate(action.path)}
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted border border-border">
                <action.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <span className="font-medium text-foreground text-sm">
                {action.label}
              </span>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ValueProposition() {
  const navigate = useNavigate();

  return (
    <Card className="relative overflow-hidden border border-border bg-card">
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-lg bg-warning/10 border border-warning/20">
            <Crown className="h-5 w-5 text-warning" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Unlock Professional Power</h3>
            <p className="text-xs text-muted-foreground">Get unlimited calculations and advanced features.</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: "Unlimited", icon: Zap },
            { label: "Analytics", icon: Target },
            { label: "Exports", icon: FileText },
          ].map((item) => (
            <div key={item.label} className="flex flex-col items-center gap-1 p-3 rounded-lg bg-muted/50 border border-border">
              <item.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>

        <Button
          className="w-full"
          onClick={() => navigate("/pricing")}
        >
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  );
}

function AnalyticsCharts() {
  const reducedMotion = useReducedMotion();
  const { revenueStats, pipelineStats, isLoading } = useRevenueAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border bg-card h-52 animate-pulse" />
        <div className="rounded-xl border border-border bg-card h-52 animate-pulse" />
      </div>
    );
  }

  const revenueData = [
    { name: "COLLECTED", value: 0, color: "#06b6d4" },
    { name: "AT RISK", value: revenueStats.revenueAtRisk, color: "#f97316" },
  ];

  const pipelineData = [
    { name: "LEADS", value: pipelineStats.activeLeads, color: "#8b5cf6" },
    { name: "JOBS", value: pipelineStats.convertedLeads, color: "#10b981" },
  ];

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <MeasurementLabel>Revenue Health</MeasurementLabel>
        </div>

        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={revenueData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
            >
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "500" }}
                width={60}
                axisLine={false}
                tickLine={false}
              />
              <RechartsTooltip
                cursor={{ fill: "transparent" }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(6, 182, 212, 0.5)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={24}>
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Open Invoices</p>
            <p className="text-xl font-semibold text-foreground mt-0.5">
              ${formatNumber(revenueStats.revenueAtRisk)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Invoice Count</p>
            <p className="text-xl font-semibold text-foreground mt-0.5">
              {revenueStats.unpaidCount}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-4">
          <MeasurementLabel>Lead Pipeline</MeasurementLabel>
        </div>

        <div className="h-[140px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={pipelineData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <XAxis
                dataKey="name"
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "500" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <RechartsTooltip
                cursor={{ fill: "rgba(139, 92, 246, 0.1)" }}
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  border: "1px solid rgba(139, 92, 246, 0.5)",
                  borderRadius: "8px",
                  color: "#e2e8f0",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                {pipelineData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div>
            <p className="text-xs text-muted-foreground">Conversion Rate</p>
            <p className="text-xl font-semibold text-foreground mt-0.5">
              {pipelineStats.conversionRate}%
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Active Leads</p>
            <p className="text-xl font-semibold text-foreground mt-0.5">
              {pipelineStats.activeLeads}
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function BusinessOperationsWidget({ user }: { user: any }) {
  const navigate = useNavigate();
  const metadata = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const isBusinessTier = metadata.subscriptionTier === "business" || metadata.plan === "business";

  const features = [
    { name: "Review Hunter Automation", description: "Automate customer review requests post-service.", icon: Star },
    { name: "Invoice Chaser", description: "Smart follow-ups for outstanding payments.", icon: Receipt },
    { name: "Private Community Access", description: "Connect with top-tier HVAC-R professionals.", icon: Users }
  ];

  return (
    <div className="relative">
      <SectionNumber number="04" className="-top-4 -left-4 md:-top-6 md:-left-8" />
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border">
          <div>
            <MeasurementLabel>BUSINESS OPERATIONS</MeasurementLabel>
            <p className="text-sm text-muted-foreground mt-1">
              Advanced automation and community tools for growing teams.
            </p>
          </div>
          {isBusinessTier ? (
            <Badge variant="outline" className="border-success/50 bg-success/10 text-success">
              Active
            </Badge>
          ) : (
            <Badge variant="outline" className="border-muted bg-muted text-muted-foreground">
              Preview
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className={`p-4 rounded-xl border ${isBusinessTier ? 'border-border bg-card' : 'border-dashed border-border bg-muted/20'} relative flex flex-col`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${isBusinessTier ? 'bg-primary/10 border-primary/20' : 'bg-muted border-border'} border`}>
                    <Icon className={`h-4 w-4 ${isBusinessTier ? 'text-primary' : 'text-muted-foreground'}`} />
                  </div>
                  {!isBusinessTier && (
                    <Lock className="h-4 w-4 text-muted-foreground/50" />
                  )}
                </div>
                <h4 className={`font-medium text-sm ${!isBusinessTier ? 'text-muted-foreground' : 'text-foreground'} mb-1`}>
                  {feature.name}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

        {!isBusinessTier && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/10">
            <div>
              <h4 className="font-semibold text-foreground text-sm">Ready to scale your operations?</h4>
              <p className="text-xs text-muted-foreground mt-1">
                Unlock these features and more with the Precision Engineering Hub tier.
              </p>
            </div>
            <Button
              variant="default"
              onClick={() => navigate('/pricing')}
              className="w-full sm:w-auto shrink-0"
            >
              Upgrade to Precision Engineering Hub
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export function Dashboard() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const { stats, isLoading, refreshStats } = useDashboardStats();
  const [showAdvancedInsights, setShowAdvancedInsights] = useState(false);

  if (authLoading) {
    return (
      <PageContainer variant="standard" className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <p>Loading authentication...</p>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer variant="standard" className="space-y-8">
        <div className="flex items-center justify-center h-64">
          <p>Please log in to view dashboard.</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <SEO
        title="Dashboard"
        description="Manage your thermodynamic projects, view real-time system status, and access quick calculation tools."
      />
      <AppPageHeader
        kicker="Work"
        title="Operations Dashboard"
        subtitle="Monitor daily activity, usage, and revenue health across dispatch and engineering workflows."
      />
      <SystemStatus />

      <QuickStats
        stats={stats}
        user={user}
        isLoading={isLoading}
        onRefresh={refreshStats}
      />

      <Collapsible
        open={showAdvancedInsights}
        onOpenChange={setShowAdvancedInsights}
        className="rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <MeasurementLabel>Advanced Insights</MeasurementLabel>
            <p className="text-sm text-muted-foreground mt-1">Revenue and pipeline details on demand.</p>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              {showAdvancedInsights ? "Hide details" : "Show details"}
              <ChevronDown className={`h-4 w-4 transition-transform ${showAdvancedInsights ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="pt-4">
          <AnalyticsCharts />
        </CollapsibleContent>
      </Collapsible>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="lg:hidden">
            <QuickActions />
          </div>
          <div className="relative">
            <SectionNumber number="03" className="-top-4 -left-4 md:-top-6 md:-left-8" />
            <div className="rounded-2xl border border-border bg-card p-5">
              <RecentCalculations isLoading={isLoading} />
            </div>
          </div>
          <BusinessOperationsWidget user={user} />
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <div className="hidden lg:block">
            <QuickActions />
          </div>
          <RiskShield />
          <Collapsible className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2">
              <MeasurementLabel>Growth Options</MeasurementLabel>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  Explore
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </CollapsibleTrigger>
            </div>
            <CollapsibleContent className="pt-4">
              <ValueProposition />
            </CollapsibleContent>
          </Collapsible>
        </aside>
      </div>
    </PageContainer>
  );
}