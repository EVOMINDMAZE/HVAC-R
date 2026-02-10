import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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
import { GlassCard } from "@/components/ui/glass-card";
import { DataPanel } from "@/components/ui/data-panel";
import { DashboardGrid, DashboardGridItem } from "@/components/ui/dashboard-grid";
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

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <GlassCard variant="data" className="rounded-2xl p-1 border border-primary/20" glow={true}>
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
              >
                <Zap className="w-3 h-3 mr-2" />
                SYSTEM USAGE
              </Badge>
              <h3 className="mt-3 text-xl font-bold text-primary font-mono">
                {stats.monthlyCalculations}/{stats.monthlyLimit} CALCULATIONS DEPLOYED
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                RESET PROTOCOL: {stats.billingCycleResetLabel}
              </p>
            </div>
            <Badge
              variant="outline"
              className={`px-4 py-1.5 rounded-full ${color.border} ${color.bg} ${color.text} backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-xs`}
            >
              {roundedUsage}% UTILIZED
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">0%</span>
              <span className="text-muted-foreground">100%</span>
            </div>
            <div className="h-3 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.usagePercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={`h-full rounded-full bg-gradient-to-r ${color.gradientFrom} ${color.gradientTo}`}
              />
            </div>
            <div className="flex justify-center">
              <div className="text-xs font-mono text-muted-foreground">
                SYSTEM CAPACITY: {stats.usagePercentage.toFixed(1)}% LOAD
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-primary/20">
            <div className="text-sm font-mono text-primary">
              <span className="text-muted-foreground">RESERVE:</span> {stats.remaining} CALCULATION{stats.remaining === 1 ? "" : "S"}
            </div>
            <Button
              variant="neon"
              size="sm"
              className="font-mono tracking-wider"
              onClick={onUpgrade}
            >
              UPGRADE TO UNLIMITED
            </Button>
          </div>
        </div>
      </GlassCard>
    </motion.div>
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
      {/* Command Center Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="glass-panel rounded-2xl p-6 border border-primary/20 mb-8"
      >
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex-1">
            <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px] sm:text-xs"
              >
                <Sparkles className="w-3 h-3 mr-2" />
                COMMAND INTERFACE
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-xs text-muted-foreground font-mono">SYSTEM ONLINE</div>
              </div>
            </motion.div>
            
            <motion.h2 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-mono">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
                OPERATOR: {firstName ? firstName.toUpperCase() : "SYSTEM"}
              </span>
            </motion.h2>
            
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-muted-foreground mt-4 max-w-2xl leading-relaxed font-light">
              Mission control dashboard for thermal analysis operations. Real-time metrics and system status displayed below.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="mt-6 flex flex-wrap items-center gap-4">
              <OnboardingGuide userName={firstName} />
              {!stats.isUnlimited && (
                <Badge
                  variant="outline"
                  className="px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px] sm:text-xs"
                >
                  {stats.remaining} CALCULATION{stats.remaining === 1 ? "" : "S"} REMAINING
                </Badge>
              )}
            </motion.div>
          </div>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row lg:flex-col gap-3">
            <Button
              variant="neon"
              size="lg"
              className="font-mono tracking-wider h-12 px-6"
              onClick={() => navigate("/tools/standard-cycle")}
            >
              <Calculator className="h-4 w-4 mr-3" />
              INITIATE CALCULATION
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="font-mono tracking-wider h-12 px-6 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
              onClick={onRefresh}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-3" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-3" />
              )}
              REFRESH DATA
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* System Alert */}
      {stats.isNearLimit && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <GlassCard
            variant="command"
            className={`rounded-2xl p-1 border ${stats.isAtLimit ? "border-destructive/30" : "border-warning/30"}`}
            glow={true}
          >
            <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-full ${stats.isAtLimit ? "bg-destructive/20" : "bg-warning/20"} border ${stats.isAtLimit ? "border-destructive/30" : "border-warning/30"}`}>
                  <Sparkles className={`h-5 w-5 ${stats.isAtLimit ? "text-destructive" : "text-warning"}`} />
                </div>
                <div>
                  <h3 className={`text-lg font-bold font-mono ${stats.isAtLimit ? "text-destructive" : "text-warning"}`}>
                    {stats.isAtLimit ? "SYSTEM LIMIT REACHED" : "APPROACHING SYSTEM LIMIT"}
                  </h3>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {stats.isAtLimit
                      ? "Upgrade to Pro for unlimited calculations."
                      : `You've used ${stats.monthlyCalculations}/${stats.monthlyLimit} calculations.`}
                  </p>
                </div>
              </div>
              <Button
                variant={stats.isAtLimit ? "neonDestructive" : "neonWarning"}
                size="lg"
                className="font-mono tracking-wider px-6"
                onClick={handleUpgrade}
              >
                {stats.isAtLimit ? "IMMEDIATE UPGRADE" : "UPGRADE SYSTEM"}
              </Button>
            </div>
          </GlassCard>
        </motion.div>
      )}

      {!stats.isUnlimited && (
        <UsageProgressCard stats={stats} onUpgrade={handleUpgrade} />
      )}

      {/* Mission Critical Metrics */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="space-y-6"
      >
        <DashboardGrid columns={{ sm: 1, md: 2, lg: 4 }} gap="lg">
          <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
            <motion.div variants={fadeInUp}>
              <DataPanel
                title="TOTAL CALCULATIONS"
                value={formatNumber(stats.totalCalculations)}
                subtitle="ALL TIME DEPLOYMENTS"
                variant="highlight"
                compact
              />
            </motion.div>
          </DashboardGridItem>
          
          <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
            <motion.div variants={fadeInUp}>
              <DataPanel
                title="THIS MONTH"
                value={`${formatNumber(stats.monthlyCalculations)}${!stats.isUnlimited ? `/${stats.monthlyLimit}` : ""}`}
                subtitle={
                  !stats.isUnlimited
                    ? `${Math.round(stats.usagePercentage)}% UTILIZED`
                    : "UNLIMITED OPERATIONS"
                }
                variant={!stats.isUnlimited && stats.usagePercentage >= 70 ? "warning" : "success"}
                compact
              />
            </motion.div>
          </DashboardGridItem>
          
          <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
            <motion.div variants={fadeInUp}>
              <DataPanel
                title="SYSTEM RESERVE"
                value={stats.remainingText}
                subtitle="REMAINING CAPACITY"
                variant={stats.remainingValue <= 2 ? "destructive" : "success"}
                compact
              />
            </motion.div>
          </DashboardGridItem>
          
          <DashboardGridItem span={{ sm: 1, md: 1, lg: 1 }}>
            <motion.div variants={fadeInUp}>
              <GlassCard
                variant="command"
                className="rounded-2xl p-1 border border-primary/20 cursor-pointer group relative overflow-hidden hover:glow-primary transition-all"
                onClick={handleUpgrade}
                glow={true}
              >
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <Badge
                        variant="outline"
                        className="px-3 py-1 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
                      >
                        SYSTEM PLAN
                      </Badge>
                      <p className="mt-3 text-xl font-bold text-primary font-mono">
                        {stats.planDisplayName}
                      </p>
                      <p className="mt-1 text-xs text-primary flex items-center font-mono">
                        {stats.plan === "free"
                          ? "UPGRADE TO PRO COMMAND"
                          : "MANAGE SUBSCRIPTION"}
                        <ArrowRight className="h-3 w-3 ml-1 group-hover:translate-x-1 transition-transform" />
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg">
                      {stats.plan === "free" ? (
                        <BarChart3 className="h-6 w-6" />
                      ) : (
                        <Crown className="h-6 w-6" />
                      )}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          </DashboardGridItem>
        </DashboardGrid>
      </motion.div>
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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.2 }}
    >
      <GlassCard variant="data" className="rounded-2xl p-1 border border-primary/20 h-full flex flex-col" glow={true}>
        <div className="p-5 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className="px-3 py-1 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
              >
                <HistoryIcon className="w-3 h-3 mr-2" />
                RECENT ACTIVITY
              </Badge>
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            </div>
            <Button
              variant="outline"
              size="sm"
              className="font-mono tracking-wider border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/calculations")}
            >
              VIEW ALL
            </Button>
          </div>
        </div>
        
        <div className="flex-1 p-5">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="animate-pulse flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-secondary rounded w-3/4" />
                    <div className="h-3 bg-secondary rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentCalculations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border border-primary/20">
                <Calculator className="h-10 w-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold text-primary font-mono mb-3">
                NO CALCULATIONS DETECTED
              </h3>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Initiate your first thermal analysis to populate the activity log.
              </p>
              <Button
                variant="neon"
                className="font-mono tracking-wider"
                onClick={() => navigate("/tools/standard-cycle")}
              >
                INITIATE CALCULATION
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {recentCalculations.map((calc: any) => (
                <motion.div
                  key={calc.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group flex items-center justify-between p-4 rounded-xl border border-primary/10 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer"
                  onClick={() => navigate(`/calculations/${calc.id}`)}
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/20">
                      <Calculator className="h-6 w-6" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-primary truncate font-mono text-sm">
                        {calc.name || calc.calculation_type}
                      </h4>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-2 font-mono">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{new Date(calc.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="w-1 h-1 bg-secondary rounded-full" />
                        <Badge
                          variant="outline"
                          className="px-2 py-0.5 rounded-full border-primary/30 bg-primary/5 text-primary text-[10px] font-mono uppercase tracking-wider"
                        >
                          {calc.calculation_type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-primary/50 group-hover:text-primary group-hover:translate-x-2 transition-all" />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

function QuickActions() {
  const navigate = useNavigate();

  const actions = [
    {
      label: "STANDARD CYCLE",
      icon: Calculator,
      path: "/tools/standard-cycle",
      color: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
    },
    {
      label: "COMPARE REFRIGERANTS",
      icon: TrendingUp,
      path: "/tools/refrigerant-comparison",
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/30",
    },
    {
      label: "CASCADE ANALYSIS",
      icon: BarChart3,
      path: "/tools/cascade-cycle",
      color: "text-purple-400",
      bg: "bg-purple-500/10",
      border: "border-purple-500/30",
    },
    {
      label: "REPORTS & PDF",
      icon: FileText,
      path: "/tools/advanced-reporting",
      color: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
    },
    {
      label: "MY PROJECTS",
      icon: Layers,
      path: "/dashboard/projects",
      color: "text-slate-400",
      bg: "bg-slate-500/10",
      border: "border-slate-500/30",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: 0.3 }}
    >
      <GlassCard variant="command" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
        <div className="p-5 border-b border-cyan-500/20">
          <div className="flex items-center gap-3">
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
            >
              <Zap className="w-3 h-3 mr-2" />
              QUICK ACTIONS
            </Badge>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </div>
          <p className="text-slate-300 text-sm mt-2">
            Rapid deployment of thermal analysis tools.
          </p>
        </div>
        
        <div className="p-5 space-y-3">
          {actions.map((action) => (
            <motion.button
              key={action.path}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              whileHover={{ scale: 1.02, x: 5 }}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-cyan-500/10 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all group"
              onClick={() => navigate(action.path)}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${action.bg} ${action.border} ${action.color} group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="font-bold text-cyan-300 font-mono text-sm tracking-wide">
                  {action.label}
                </span>
              </div>
              <ArrowRight className="h-5 w-5 text-cyan-500/50 group-hover:text-cyan-400 group-hover:translate-x-2 transition-all" />
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </motion.div>
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
          className="w-full bg-gradient-to-r from-amber-400 to-cyan-500 hover:from-amber-500 hover:to-cyan-600 text-white font-bold shadow-lg shadow-cyan-500/25 border-0"
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20 h-64 animate-pulse" />
        <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20 h-64 animate-pulse" />
      </div>
    );
  }

  const revenueData = [
    { name: "COLLECTED", value: 0, color: "#06b6d4" }, // cyan-500
    { name: "AT RISK", value: revenueStats.revenueAtRisk, color: "#f97316" }, // cyan-500
  ];

  const pipelineData = [
    { name: "LEADS", value: pipelineStats.activeLeads, color: "#8b5cf6" }, // purple-500
    { name: "JOBS", value: pipelineStats.convertedLeads, color: "#10b981" }, // emerald-500
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-8"
    >
      {/* Revenue at Risk Chart */}
      <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
            >
              <Target className="w-3 h-3 mr-2" />
              REVENUE HEALTH
            </Badge>
            <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
          </div>
          
          <div className="h-[180px] w-full">
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
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                  width={80}
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
                    fontFamily: "monospace",
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
          
          <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-cyan-500/20">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">UNPAID INVOICES</p>
              <p className="text-2xl font-bold text-cyan-300 font-mono mt-1">
                ${formatNumber(revenueStats.revenueAtRisk)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">INVOICE COUNT</p>
              <p className="text-2xl font-bold text-cyan-300 font-mono mt-1">
                {revenueStats.unpaidCount}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Lead Pipeline Chart */}
      <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-6">
            <Badge
              variant="outline"
              className="px-3 py-1 rounded-full border-purple-500/50 bg-purple-500/10 text-purple-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
            >
              <TrendingUp className="w-3 h-3 mr-2" />
              LEAD PIPELINE
            </Badge>
            <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
          </div>
          
          <div className="h-[180px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={pipelineData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
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
                    fontFamily: "monospace",
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
          
          <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t border-cyan-500/20">
            <div>
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">CONVERSION RATE</p>
              <p className="text-2xl font-bold text-purple-300 font-mono mt-1">
                {pipelineStats.conversionRate}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">ACTIVE LEADS</p>
              <p className="text-2xl font-bold text-purple-300 font-mono mt-1">
                {pipelineStats.activeLeads}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>
    </motion.div>
  );
}

export function Dashboard() {
  const { user, isLoading: authLoading } = useSupabaseAuth();
  const { stats, isLoading, refreshStats } = useDashboardStats();

  console.log("[Dashboard] Debug:", {
    user: user?.id,
    authLoading,
    dashboardLoading: isLoading,
    stats,
    hasUser: !!user,
    hasStats: !!stats,
  });

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
