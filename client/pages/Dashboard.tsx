import { useMemo } from "react";
import { useMemo } from "react";
import type { User } from "@supabase/supabase-js";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useSubscription } from "@/hooks/useStripe";
import { Header } from "@/components/Header";
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
} from "lucide-react";

function formatNumber(n: number) {
  return new Intl.NumberFormat(undefined).format(n);
}

function QuickStats({ stats, user, isLoading, onRefresh }: any) {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Your workspace at a glance — quick access to recent activity and
            plan usage.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            className="bg-primary text-primary-foreground hover:opacity-95 whitespace-nowrap"
            onClick={() => navigate("/standard-cycle")}
            aria-label="Start new calculation"
          >
            <Calculator className="h-4 w-4 mr-2" />
            New Calculation
          </Button>

          <Button
            variant="ghost"
            className="hidden sm:inline-flex items-center"
            onClick={onRefresh}
            aria-label="Refresh dashboard data"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Refresh
          </Button>

          <Button
            variant="outline"
            className="hidden sm:inline-flex whitespace-nowrap"
            onClick={() => navigate("/history")}
            aria-label="View calculation history"
          >
            <HistoryIcon className="h-4 w-4 mr-2" />
            View History
          </Button>
        </div>
      </div>

      {stats.isNearLimit && (
        <Card
          className={`border-2 ${
            stats.isAtLimit
              ? "border-destructive bg-destructive/10"
              : "border-yellow-500 bg-yellow-50"
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${stats.isAtLimit ? "bg-red-500" : "bg-yellow-500"}`}
                />
                <div>
                  <p
                    className={`font-semibold ${stats.isAtLimit ? "text-red-800" : "text-yellow-800"}`}
                  >
                    {stats.isAtLimit
                      ? "Monthly Limit Reached!"
                      : "Approaching Monthly Limit"}
                  </p>
                  <p
                    className={`text-sm ${stats.isAtLimit ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {stats.isAtLimit
                      ? "You've reached your monthly calculation cap. Upgrade to continue."
                      : `You've used ${stats.monthlyCalculations}/${stats.monthlyLimit} calculations this month.`}
                  </p>
                </div>
              </div>
              <Button
                className={
                  stats.isAtLimit
                    ? "bg-destructive text-white"
                    : "bg-yellow-600 text-white"
                }
                onClick={() => navigate("/pricing")}
              >
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-600 to-sky-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Calculations</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats.totalCalculations)}
                </p>
                <p className="text-xs opacity-80 mt-1">All time</p>
              </div>
              <Calculator className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-600 to-violet-500 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">This Month</p>
                <p className="text-3xl font-bold mt-1">
                  {formatNumber(stats.monthlyCalculations)}
                  {!stats.isUnlimited && (
                    <span className="text-base font-medium">
                      /{stats.monthlyLimit}
                    </span>
                  )}
                </p>

                {!stats.isUnlimited ? (
                  <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${stats.usagePercentage}%` }}
                    />
                  </div>
                ) : (
                  <p className="text-sm opacity-80 mt-2">Unlimited</p>
                )}
              </div>
              <FileText className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-r ${stats.remainingValue <= 2 ? "from-red-600 to-red-500" : "from-emerald-600 to-green-500"} text-white`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Remaining</p>
                <p className="text-3xl font-bold mt-1">{stats.remainingText}</p>
                <p className="text-xs opacity-80 mt-1">This month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-white/80" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          onClick={() => (window.location.href = "/pricing")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Current Plan</p>
                <p className="text-xl font-semibold mt-1">
                  {stats.planDisplayName}
                </p>
                <p className="text-xs opacity-80 mt-1">
                  {stats.plan === "free"
                    ? "Click to upgrade"
                    : "Manage subscription"}
                </p>
              </div>
              {stats.plan === "free" ? (
                <BarChart3 className="h-8 w-8 text-white/80" />
              ) : (
                <Crown className="h-8 w-8 text-white/80" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function RecentCalculations({ isLoading }: any) {
  const navigate = useNavigate();
  const { calculations } = useSupabaseCalculations();
  const recentCalculations = calculations.slice(0, 5);

  return (
    <Card className="bg-white shadow-md border">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center">
          <HistoryIcon className="h-5 w-5 mr-2" />
          Recent Calculations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-200 rounded-md" />
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/5 mb-2" />
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : recentCalculations.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No calculations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by running your first calculation — it's quick and easy.
            </p>
            <div className="max-w-xs mx-auto">
              <Button
                className="w-full"
                onClick={() => navigate("/standard-cycle")}
              >
                Run First Calculation
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {recentCalculations.map((calc: any) => (
              <div
                key={calc.id}
                className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-md flex items-center justify-center flex-shrink-0">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-medium text-gray-900 truncate max-w-[28ch]">
                      {calc.name || calc.calculation_type}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(calc.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  <Badge variant="secondary">{calc.calculation_type}</Badge>
                  <Button
                    variant="ghost"
                    className="text-sm px-3 py-1"
                    onClick={() => navigate(`/calculations/${calc.id}`)}
                  >
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm px-3 py-1"
                    onClick={() => navigate("/standard-cycle")}
                  >
                    Run
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/history")}
          >
            View All Calculations
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function QuickActions() {
  const navigate = useNavigate();

  return (
    <Card className="bg-white shadow-md border">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white">
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-3">
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate("/standard-cycle")}
        >
          <Calculator className="h-4 w-4 mr-2" />
          New Standard Cycle
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate("/refrigerant-comparison")}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Compare Refrigerants
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate("/cascade-cycle")}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Cascade Analysis
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate("/history")}
        >
          <FileText className="h-4 w-4 mr-2" />
          View History
        </Button>
      </CardContent>
    </Card>
  );
}

function ValueProposition() {
  const navigate = useNavigate();

  return (
    <Card className="rounded-xl overflow-hidden shadow-xl">
      <div className="bg-gradient-to-r from-blue-600 to-violet-700 text-white p-10">
        <div className="max-w-4xl mx-auto text-center">
          <Crown
            className="h-16 w-16 text-yellow-300 mx-auto mb-4"
            aria-hidden
          />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">
            Unlock Professional Features
          </h2>
          <p className="text-md opacity-90 mb-8">
            Powerful tools for engineers: faster analysis, sharing and export.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <Zap
                className="h-8 w-8 text-yellow-300 mx-auto mb-3"
                aria-hidden
              />
              <h3 className="font-semibold">
                Unlimited
                <br />
                Calculations
              </h3>
              <p className="text-sm opacity-85 mt-1">
                No monthly limits on your analysis
              </p>
            </div>

            <div className="text-center">
              <Target
                className="h-8 w-8 text-yellow-300 mx-auto mb-3"
                aria-hidden
              />
              <h3 className="font-semibold">Advanced Analytics</h3>
              <p className="text-sm opacity-85 mt-1">
                Detailed reports & optimization tips
              </p>
            </div>

            <div className="text-center">
              <FileText
                className="h-8 w-8 text-yellow-300 mx-auto mb-3"
                aria-hidden
              />
              <h3 className="font-semibold">Export & Share</h3>
              <p className="text-sm opacity-85 mt-1">
                PDF reports & team collaboration
              </p>
            </div>
          </div>

          <div className="bg-white/12 rounded-lg p-6 mb-6 backdrop-blur-sm border border-white/10">
            <p className="text-lg font-semibold text-yellow-300 mb-1">
              Save 20+ hours per month
            </p>
            <p className="text-sm opacity-90">
              Professional engineers save an average of $2,400/month in
              consulting time
            </p>
          </div>

          <div className="flex justify-center">
            <Button
              className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold px-8 py-3 rounded-full shadow-lg"
              onClick={() => navigate("/pricing")}
            >
              Upgrade Now - Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

export function Dashboard() {
  const { user } = useSupabaseAuth();
  const {
    calculations,
    isLoading: calculationsLoading,
    refetch,
  } = useSupabaseCalculations();
  const {
    subscription,
    loading: subscriptionLoading,
    refetch: subscriptionRefetch,
  } = useSubscription();

  const stats = useMemo(() => {
    const totalCalculations = calculations.length;
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthlyCalculations = calculations.filter((calc: any) => {
      const calcDate = new Date(calc.created_at);
      return (
        calcDate.getMonth() === currentMonth &&
        calcDate.getFullYear() === currentYear
      );
    }).length;

    const plan = subscription?.plan || "free";
    const planDisplayName =
      plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " ");
    const isUnlimited = plan !== "free";
    const monthlyLimit = isUnlimited ? monthlyCalculations || 0 : 10;
    const remaining = isUnlimited
      ? -1
      : Math.max(0, monthlyLimit - monthlyCalculations);
    const remainingText = remaining === -1 ? "Unlimited" : remaining.toString();
    const usagePercentage = isUnlimited
      ? 0
      : Math.min((monthlyCalculations / monthlyLimit) * 100, 100);
    const isNearLimit = !isUnlimited && usagePercentage > 70;
    const isAtLimit = !isUnlimited && monthlyCalculations >= monthlyLimit;

    return {
      totalCalculations,
      monthlyCalculations,
      plan,
      planDisplayName,
      isUnlimited,
      remaining,
      remainingText,
      monthlyLimit,
      usagePercentage,
      isNearLimit,
      isAtLimit,
      remainingValue: remaining,
    };
  }, [calculations, subscription]);

  const isLoading = calculationsLoading || subscriptionLoading;

  const handleRefresh = async () => {
    try {
      await Promise.all([refetch(), subscriptionRefetch?.()]);
    } catch (e) {
      // silent - errors handled by hooks/toast
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-blue-50">
      <Header variant="dashboard" />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <SystemStatus />

        <section className="mb-6">
          <QuickStats
            stats={stats}
            user={user}
            isLoading={isLoading}
            onRefresh={handleRefresh}
          />
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentCalculations isLoading={isLoading} />

            <Card className="p-4 shadow-md">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Tips
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Use comparators to evaluate refrigerants quickly.</li>
                <li>Run batch calculations from the History page.</li>
                <li>Upgrade for export and team collaboration.</li>
              </ul>
            </Card>

            <ValueProposition />
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24">
            <QuickActions />

            <Card className="p-4 shadow-md">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">
                Usage
              </h3>
              <p className="text-xs text-gray-500">
                Monthly usage and quick insights
              </p>
              <div className="mt-4">
                <div className="w-full h-16 bg-gradient-to-r from-white to-white/50 rounded-md flex items-center justify-center">
                  <svg
                    width="100%"
                    height="40"
                    viewBox="0 0 120 40"
                    className="mx-2"
                  >
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points="0,30 20,22 40,10 60,14 80,8 100,12 120,6"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-between mt-3 text-sm">
                  <div>
                    <div className="text-xs text-gray-500">This month</div>
                    <div className="text-lg font-bold">
                      {formatNumber(stats.monthlyCalculations)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div className="text-lg font-semibold text-green-600">
                      {stats.remainingText}
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </aside>
        </section>
      </main>

      <Footer />
    </div>
  );
}
