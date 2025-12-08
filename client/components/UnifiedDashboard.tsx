import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  TrendingUp,
  Activity,
  DollarSign,
  Leaf,
  Calculator,
  BarChart3,
  Zap,
  CheckCircle,
  Info,
  Star,
  Users,
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
  const { calculations, isLoading: isLoadingCalculations } = useSupabaseCalculations();
  const { stats, isLoading: isLoadingStats } = useUserStats();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const recentProjects = calculations.slice(0, 5);

  // Extract unique refrigerants from history
  const recentRefrigerants = Array.from(new Set(
    calculations
      .flatMap(c => c.inputs?.refrigerants || [c.inputs?.refrigerant])
      .filter(Boolean)
  )).slice(0, 5);

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
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome to Your HVAC Command Center
              </h1>
              <p className="text-gray-600 mt-1">
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
              <div className="text-sm text-gray-600">
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
              <div className="text-blue-600"><Calculator className="h-4 w-4" /></div>
              <TrendingUp className="h-3 w-3 text-green-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats?.totalCalculations || 0}</div>
              <div className="text-sm font-medium text-gray-900">Total Calculations</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-green-600"><Activity className="h-4 w-4" /></div>
              <TrendingUp className="h-3 w-3 text-green-600" />
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{stats?.monthlyCalculations || 0}</div>
              <div className="text-sm font-medium text-gray-900">This Month</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-purple-600"><Building className="h-4 w-4" /></div>
              {/* Placeholder for future usage trend */}
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">{recentRefrigerants.length}</div>
              <div className="text-sm font-medium text-gray-900">Active Refrigerants</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-red-600"><Zap className="h-4 w-4" /></div>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {stats?.subscription.remaining === -1 ? "∞" : stats?.subscription.remaining}
              </div>
              <div className="text-sm font-medium text-gray-900">Remaining Runs</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-blue-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => navigate(action.path)}
              >
                <div className="flex items-center gap-3">
                  {action.icon}
                  <div className="text-left">
                    <div className="font-semibold">{action.label}</div>
                  </div>
                </div>
              </Button>
            ))}

            <Separator className="my-4" />

            {recentRefrigerants.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Recent Refrigerants</h4>
                <div className="flex flex-wrap gap-1">
                  {recentRefrigerants.map((ref: any) => (
                    <Badge
                      key={ref}
                      variant="secondary"
                      className="text-xs"
                    >
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
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Recent Calculations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length > 0 ? (
              recentProjects.map((project) => (
                <div
                  key={project.id}
                  className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                  onClick={() => navigate('/history')}
                >
                  <div>
                    <div className="font-semibold text-sm">{project.name || project.calculation_type}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(project.created_at).toLocaleDateString()} • {project.calculation_type}
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
              <div className="text-center py-8 text-gray-500">
                <p>No calculations yet.</p>
                <Button variant="link" onClick={() => navigate('/standard-cycle')}>Start your first calculation</Button>
              </div>
            )}

            {recentProjects.length > 0 && (
              <Button variant="ghost" className="w-full text-sm" onClick={() => navigate('/history')}>
                View All History →
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Professional Insights Panel (Static but useful educational content) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-blue-600" />
            Professional Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Efficiency Tip</span>
              </div>
              <div className="text-sm text-gray-600">
                Optimizing superheat settings can improve COP by 8-15%. For R32
                systems, target 10-12°C superheat for optimal performance.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Sustainability Focus</span>
              </div>
              <div className="text-sm text-gray-600">
                Natural refrigerants like R290 and R744 are gaining traction.
                Consider them for new installations to future-proof against data.
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">System Logic</span>
              </div>
              <div className="text-sm text-gray-600">
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
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
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
