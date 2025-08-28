import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useSubscription } from "@/hooks/useStripe";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { SystemStatus } from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
} from "lucide-react";

function QuickStats() {
  const { user } = useSupabaseAuth();
  const { calculations } = useSupabaseCalculations();
  const { subscription } = useSubscription();
  const navigate = useNavigate();

  // Calculate real stats from user's calculations
  const totalCalculations = calculations.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyCalculations = calculations.filter((calc) => {
    const calcDate = new Date(calc.created_at);
    return (
      calcDate.getMonth() === currentMonth &&
      calcDate.getFullYear() === currentYear
    );
  }).length;

  // Get real subscription data from Stripe
  const plan = subscription?.plan || "free";
  const planDisplayName =
    plan.charAt(0).toUpperCase() + plan.slice(1).replace("_", " ");
  const isUnlimited = plan !== "free";
  const remaining = isUnlimited ? -1 : Math.max(0, 10 - monthlyCalculations);

  const stats = {
    totalCalculations,
    monthlyCalculations,
    subscription: { plan: planDisplayName, remaining },
  };

  const remainingText =
    stats?.subscription.remaining === -1
      ? "Unlimited"
      : stats?.subscription.remaining?.toString() || "0";

  // Calculate usage based on plan limits
  const monthlyLimit = isUnlimited ? monthlyCalculations : 10;
  const usagePercentage = isUnlimited
    ? 0
    : Math.min((monthlyCalculations / 10) * 100, 100);
  const isNearLimit = !isUnlimited && usagePercentage > 70;
  const isAtLimit = !isUnlimited && monthlyCalculations >= 10;

  return (
    <div className="space-y-6">
      {/* Header with quick action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Welcome back{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
          </h2>
          <p className="text-sm text-gray-600">
            Your workspace at a glance — quick access to common tasks and usage.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap"
            onClick={() => navigate("/standard-cycle")}
            aria-label="Start new calculation"
          >
            <Calculator className="h-4 w-4 mr-2" />
            New Calculation
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

      {/* Usage Warning Banner */}
      {isNearLimit && (
        <Card
          className={`border-2 ${isAtLimit ? "border-red-500 bg-red-50" : "border-yellow-500 bg-yellow-50"}`}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`w-3 h-3 rounded-full ${isAtLimit ? "bg-red-500" : "bg-yellow-500"}`}
                ></div>
                <div>
                  <p
                    className={`font-semibold ${isAtLimit ? "text-red-800" : "text-yellow-800"}`}
                  >
                    {isAtLimit
                      ? "Monthly Limit Reached!"
                      : "Approaching Monthly Limit"}
                  </p>
                  <p
                    className={`text-sm ${isAtLimit ? "text-red-600" : "text-yellow-600"}`}
                  >
                    {isAtLimit
                      ? "Upgrade now to continue your calculations and unlock unlimited access"
                      : `You've used ${monthlyCalculations}/10 calculations this month. Upgrade for unlimited access.`}
                  </p>
                </div>
              </div>
              <Button
                className={
                  isAtLimit
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-yellow-600 hover:bg-yellow-700"
                }
                onClick={() => navigate("/pricing")}
              >
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Calculations</p>
                <p className="text-2xl font-bold">
                  {stats?.totalCalculations || 0}
                </p>
                <p className="text-blue-200 text-xs mt-1">All time</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">This Month</p>
                <p className="text-2xl font-bold">
                  {stats?.monthlyCalculations || 0}
                  {isUnlimited ? "" : "/10"}
                </p>
                {!isUnlimited && (
                  <div className="w-full bg-purple-300 rounded-full h-2 mt-2">
                    <div
                      className="bg-white rounded-full h-2 transition-all duration-300"
                      style={{ width: `${usagePercentage}%` }}
                    ></div>
                  </div>
                )}
                {isUnlimited && (
                  <p className="text-purple-200 text-xs mt-1">Unlimited</p>
                )}
              </div>
              <FileText className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={`bg-gradient-to-r ${stats.subscription.remaining <= 2 ? "from-red-500 to-red-600" : "from-green-500 to-green-600"} text-white`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Remaining</p>
                <p className="text-2xl font-bold">{remainingText}</p>
                <p className="text-green-200 text-xs mt-1">This month</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card
          className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
          onClick={() => navigate("/pricing")}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Current Plan</p>
                <p className="text-xl font-bold">{stats.subscription.plan}</p>
                <p className="text-orange-200 text-xs mt-1">
                  {plan === "free" ? "Click to upgrade" : "Manage subscription"}
                </p>
              </div>
              {plan === "free" ? (
                <BarChart3 className="h-8 w-8 text-orange-200" />
              ) : (
                <Crown className="h-8 w-8 text-orange-200" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}

function RecentCalculations() {
  const navigate = useNavigate();
  const { calculations } = useSupabaseCalculations();
  const recentCalculations = calculations.slice(0, 5);

  return (
    <Card className="bg-white shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center">
          <HistoryIcon className="h-5 w-5 mr-2" />
          Recent Calculations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {recentCalculations.length === 0 ? (
          <div className="text-center py-8">
            <Calculator className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No calculations yet
            </h3>
            <p className="text-gray-600 mb-4">
              Start by running your first calculation
            </p>
          </div>
        ) : (
          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {recentCalculations.map((calc) => (
              <div
                key={calc.id}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate max-w-[28ch]">
                      {calc.name || calc.calculation_type}
                    </h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>
                        {new Date(calc.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3 flex-shrink-0">
                  <Badge variant="secondary">{calc.calculation_type}</Badge>
                  <Button
                    variant="ghost"
                    className="text-sm px-3 py-1"
                    onClick={() => navigate(`/calculations/${calc.id}`)}
                    aria-label={`View ${calc.calculation_type} details`}
                  >
                    Details
                  </Button>
                  <Button
                    variant="outline"
                    className="text-sm px-3 py-1"
                    onClick={() => navigate("/standard-cycle")}
                    aria-label="Run this calculation"
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
    <Card className="bg-white shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
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
    <Card className="bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-xl">
      <CardContent className="p-8">
        <div className="text-center">
          <Crown className="h-12 w-12 text-yellow-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">
            Unlock Professional Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <Zap className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Unlimited Calculations</h3>
              <p className="text-blue-100 text-sm">
                No monthly limits on your analysis
              </p>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Advanced Analytics</h3>
              <p className="text-blue-100 text-sm">
                Detailed reports & optimization tips
              </p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Export & Share</h3>
              <p className="text-blue-100 text-sm">
                PDF reports & team collaboration
              </p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-yellow-300">
              Save 20+ hours per month
            </p>
            <p className="text-blue-100">
              Professional engineers save an average of $2,400/month in
              consulting time
            </p>
          </div>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold px-8 py-3"
            onClick={() => navigate("/pricing")}
          >
            Upgrade Now - Start Free Trial
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />

      <main className="max-w-7xl mx-auto px-4 py-10">
        <SystemStatus />

        {/* Summary */}
        <section className="mb-6">
          <QuickStats />
        </section>

        {/* Main content area */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentCalculations />

            {/* Tips card moved into main column per design updates */}
            <Card className="mt-6 p-4 shadow-md">
              <h3 className="text-base font-semibold text-gray-800 mb-3">
                Tips
              </h3>
              <ul className="text-sm text-gray-600 space-y-2">
                <li>Use comparators to evaluate refrigerants quickly.</li>
                <li>Run batch calculations from the History page.</li>
                <li>Upgrade for export and team collaboration.</li>
              </ul>
            </Card>
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
                    <div className="text-lg font-bold"></div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-500">Remaining</div>
                    <div className="text-lg font-semibold text-green-600"></div>
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
