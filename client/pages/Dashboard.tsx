import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { Header } from "@/components/Header";
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
  Target
} from "lucide-react";

function QuickStats() {
  const { user } = useSupabaseAuth();
  const { calculations } = useSupabaseCalculations();
  const navigate = useNavigate();

  // Calculate real stats from user's calculations
  const totalCalculations = calculations.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyCalculations = calculations.filter(calc => {
    const calcDate = new Date(calc.created_at);
    return calcDate.getMonth() === currentMonth && calcDate.getFullYear() === currentYear;
  }).length;

  const stats = {
    totalCalculations,
    monthlyCalculations,
    subscription: { plan: 'Free', remaining: Math.max(0, 10 - monthlyCalculations) }
  };

  const remainingText = stats?.subscription.remaining === -1
    ? "Unlimited"
    : stats?.subscription.remaining?.toString() || "0";

  const usagePercentage = Math.min((monthlyCalculations / 10) * 100, 100);
  const isNearLimit = usagePercentage > 70;
  const isAtLimit = monthlyCalculations >= 10;

  return (
    <div className="space-y-6">
      {/* Usage Warning Banner */}
      {isNearLimit && (
        <Card className={`border-2 ${isAtLimit ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-3 h-3 rounded-full ${isAtLimit ? 'bg-red-500' : 'bg-yellow-500'}`}></div>
                <div>
                  <p className={`font-semibold ${isAtLimit ? 'text-red-800' : 'text-yellow-800'}`}>
                    {isAtLimit ? 'Monthly Limit Reached!' : 'Approaching Monthly Limit'}
                  </p>
                  <p className={`text-sm ${isAtLimit ? 'text-red-600' : 'text-yellow-600'}`}>
                    {isAtLimit
                      ? 'Upgrade now to continue your calculations and unlock unlimited access'
                      : `You've used ${monthlyCalculations}/10 calculations this month. Upgrade for unlimited access.`
                    }
                  </p>
                </div>
              </div>
              <Button
                className={isAtLimit ? 'bg-red-600 hover:bg-red-700' : 'bg-yellow-600 hover:bg-yellow-700'}
                onClick={() => navigate('/pricing')}
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
                <p className="text-2xl font-bold">{stats?.totalCalculations || 0}</p>
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
                <p className="text-2xl font-bold">{stats?.monthlyCalculations || 0}/10</p>
                <div className="w-full bg-purple-300 rounded-full h-2 mt-2">
                  <div
                    className="bg-white rounded-full h-2 transition-all duration-300"
                    style={{ width: `${usagePercentage}%` }}
                  ></div>
                </div>
              </div>
              <FileText className="h-8 w-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-gradient-to-r ${stats.subscription.remaining <= 2 ? 'from-red-500 to-red-600' : 'from-green-500 to-green-600'} text-white`}>
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

        <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white cursor-pointer hover:from-orange-600 hover:to-orange-700 transition-all duration-200" onClick={() => navigate('/pricing')}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Current Plan</p>
                <p className="text-xl font-bold capitalize">Free</p>
                <p className="text-orange-200 text-xs mt-1">Click to upgrade</p>
              </div>
              <BarChart3 className="h-8 w-8 text-orange-200" />
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No calculations yet</h3>
            <p className="text-gray-600 mb-4">Start by running your first calculation</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentCalculations.map((calc) => (
              <div key={calc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Calculator className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{calc.name || calc.calculation_type}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(calc.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{calc.calculation_type}</Badge>
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
          onClick={() => navigate('/standard-cycle')}
        >
          <Calculator className="h-4 w-4 mr-2" />
          New Standard Cycle
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate('/refrigerant-comparison')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Compare Refrigerants
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate('/cascade-cycle')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Cascade Analysis
        </Button>
        <Button
          className="w-full justify-start"
          variant="outline"
          onClick={() => navigate('/history')}
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
          <h2 className="text-2xl font-bold mb-4">Unlock Professional Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <Zap className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Unlimited Calculations</h3>
              <p className="text-blue-100 text-sm">No monthly limits on your analysis</p>
            </div>
            <div className="text-center">
              <Target className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Advanced Analytics</h3>
              <p className="text-blue-100 text-sm">Detailed reports & optimization tips</p>
            </div>
            <div className="text-center">
              <FileText className="h-8 w-8 text-yellow-300 mx-auto mb-2" />
              <h3 className="font-semibold">Export & Share</h3>
              <p className="text-blue-100 text-sm">PDF reports & team collaboration</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-lg p-4 mb-6">
            <p className="text-lg font-semibold text-yellow-300">Save 20+ hours per month</p>
            <p className="text-blue-100">Professional engineers save an average of $2,400/month in consulting time</p>
          </div>
          <Button
            className="bg-yellow-400 hover:bg-yellow-500 text-purple-900 font-bold px-8 py-3"
            onClick={() => navigate('/pricing')}
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        <SystemStatus />

        <div className="space-y-8">
          <QuickStats />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <RecentCalculations />
            <QuickActions />
          </div>

          <ValueProposition />
        </div>
      </main>
    </div>
  );
}
