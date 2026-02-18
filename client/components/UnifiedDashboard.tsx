import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Activity,
  Leaf,
  Calculator,
  BarChart3,
  Zap,
  Star,
  Building,
  Thermometer,
  RefreshCw,
} from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { useUserStats } from "@/hooks/useUserStats";
import { useNavigate } from "react-router-dom";
import { SupabaseStatus } from "@/components/SupabaseStatus";

export function UnifiedDashboard() {
  const [time, setTime] = useState(new Date());
  const { calculations } =
    useSupabaseCalculations();
  const { stats } = useUserStats();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentProjects = calculations.slice(0, 5);

  // Extract unique refrigerants from history
  const recentRefrigerants = Array.from(
    new Set(
      calculations
        .flatMap((c) => c.inputs?.refrigerants || [c.inputs?.refrigerant])
        .filter(Boolean),
    ),
  ).slice(0, 5);

  const quickActions = [
    {
      label: "New Standard Cycle",
      icon: <Calculator className="h-4 w-4" />,
      path: "/standard-cycle",
    },
    {
      label: "Compare Refrigerants",
      icon: <BarChart3 className="h-4 w-4" />,
      path: "/refrigerant-comparison",
    },
    {
      label: "Cascade Analysis",
      icon: <Activity className="h-4 w-4" />,
      path: "/cascade-cycle",
    },
    {
      label: "Comparison History",
      icon: <RefreshCw className="h-4 w-4" />,
      path: "/history",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="border-2 border-orange-200 dark:border-orange-800 bg-gradient-to-r from-orange-50 via-slate-50 to-slate-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                Welcome to Your HVAC Command Center
              </h1>
              <p className="text-muted-foreground mt-1">
                {time.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}{" "}
                • {time.toLocaleTimeString()}
              </p>
            </div>
            <div className="text-right hidden sm:block">
              <Badge variant="outline" className="mb-2">
                {stats?.subscription.plan || "Free Plan"}
              </Badge>
              <div className="text-sm text-muted-foreground">
                Professional Platform
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Real Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-orange-600 dark:text-orange-400">
                <Calculator className="h-4 w-4" />
              </div>
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-foreground">
                {stats?.totalCalculations || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Total Calculations
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-green-600 dark:text-green-400">
                <Activity className="h-4 w-4" />
              </div>
              <TrendingUp className="h-3 w-3 text-green-600 dark:text-green-400" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-foreground">
                {stats?.monthlyCalculations || 0}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                This Month
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-slate-600 dark:text-slate-400">
                <Building className="h-4 w-4" />
              </div>
              {/* Placeholder for future usage trend */}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-foreground">
                {recentRefrigerants.length}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Active Refrigerants
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-red-600 dark:text-red-400">
                <Zap className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold text-foreground">
                {stats?.subscription.remaining === -1
                  ? "∞"
                  : stats?.subscription.remaining}
              </div>
              <div className="text-sm font-medium text-muted-foreground">
                Remaining Runs
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4 hover:bg-accent hover:text-accent-foreground"
                onClick={() => navigate(action.path)}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-semibold text-foreground">
                      {action.label}
                    </div>
                  </div>
                </div>
              </Button>
            ))}

            <Separator className="my-4" />

            {recentRefrigerants.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground">
                  Recent Refrigerants
                </h4>
                <div className="flex flex-wrap gap-1">
                  {recentRefrigerants.map((ref: any) => (
                    <Badge key={ref} variant="secondary" className="text-xs">
                      {ref}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects (Real Data) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Building className="h-5 w-5 text-green-600 dark:text-green-400" />
              Recent Calculations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border rounded-lg hover:bg-accent cursor-pointer flex items-center justify-between transition-colors"
                  onClick={() => navigate("/history")}
                >
                  <div>
                    <div className="font-semibold text-sm text-foreground">
                      {project.name || project.calculation_type}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {new Date(project.created_at).toLocaleDateString()} •{" "}
                      {project.calculation_type}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs">
                      {project.inputs?.refrigerant || "Multiple"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No calculations yet.</p>
                <Button
                  variant="link"
                  onClick={() => navigate("/standard-cycle")}
                >
                  Start your first calculation
                </Button>
              </div>
            )}

            {recentProjects.length > 0 && (
              <Button
                variant="ghost"
                className="w-full text-sm"
                onClick={() => navigate("/history")}
              >
                View All History →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Professional Insights Panel (Static but useful educational content) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Star className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            Professional Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-foreground">
                  Efficiency Tip
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Optimizing superheat settings can improve COP by 8-15%. For R32
                systems, target 10-12°C superheat for optimal performance.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600 dark:text-green-400" />
                <span className="font-semibold text-foreground">
                  Sustainability Focus
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Natural refrigerants like R290 and R744 are gaining traction.
                Consider them for new installations to future-proof against
                data.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <span className="font-semibold text-foreground">
                  System Logic
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Variable speed compressor adoption offers significant energy
                savings in part-load conditions.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SupabaseStatus />
        </CardContent>
      </Card>
    </div>
  );
}
