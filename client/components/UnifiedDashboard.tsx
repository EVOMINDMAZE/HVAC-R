import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  TrendingUp,
  Activity,
  DollarSign,
  Leaf,
  Calculator,
  BarChart3,
  Clock,
  Zap,
  AlertTriangle,
  CheckCircle,
  Info,
  Star,
  Globe,
  Users,
  Building,
  Thermometer,
  Gauge,
  RefreshCw,
} from "lucide-react";
import { MCPRecommendations } from "@/components/MCPRecommendations";

interface DashboardProps {
  recentCalculations?: any[];
  performanceMetrics?: any;
  industryNews?: any[];
}

interface KPI {
  label: string;
  value: string;
  change: string;
  trend: "up" | "down" | "stable";
  icon: React.ReactNode;
  color: string;
}

export function UnifiedDashboard({
  recentCalculations = [],
  performanceMetrics,
  industryNews = [],
}: DashboardProps) {
  const [time, setTime] = useState(new Date());
  const [activeWidget, setActiveWidget] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Mock data for demonstration
  const mockKPIs: KPI[] = [
    {
      label: "Calculations Today",
      value: "12",
      change: "+3 from yesterday",
      trend: "up",
      icon: <Calculator className="h-4 w-4" />,
      color: "text-blue-600",
    },
    {
      label: "Average COP",
      value: "3.2",
      change: "+0.3 from last week",
      trend: "up",
      icon: <TrendingUp className="h-4 w-4" />,
      color: "text-green-600",
    },
    {
      label: "Energy Efficiency",
      value: "87%",
      change: "+5% improvement",
      trend: "up",
      icon: <Zap className="h-4 w-4" />,
      color: "text-yellow-600",
    },
    {
      label: "Cost Savings",
      value: "$2,340",
      change: "This month",
      trend: "stable",
      icon: <DollarSign className="h-4 w-4" />,
      color: "text-purple-600",
    },
  ];

  const mockRecentProjects = [
    {
      id: 1,
      name: "Office Building HVAC Retrofit",
      refrigerant: "R32",
      status: "In Progress",
      lastModified: "2 hours ago",
      efficiency: 92,
    },
    {
      id: 2,
      name: "Cold Storage Facility",
      refrigerant: "R744",
      status: "Completed",
      lastModified: "1 day ago",
      efficiency: 78,
    },
    {
      id: 3,
      name: "Residential Heat Pump System",
      refrigerant: "R410A",
      status: "Under Review",
      lastModified: "3 days ago",
      efficiency: 85,
    },
  ];

  const mockIndustryUpdates = [
    {
      title: "New EU F-Gas Regulations Take Effect",
      summary:
        "Updated regulations on high-GWP refrigerants will impact HVAC design requirements.",
      date: "2024-01-15",
      importance: "high",
      category: "Regulatory",
    },
    {
      title: "R32 Adoption Accelerates in Commercial Applications",
      summary:
        "Industry report shows 40% increase in R32 usage for commercial refrigeration systems.",
      date: "2024-01-12",
      importance: "medium",
      category: "Technology",
    },
    {
      title: "Energy Efficiency Standards Updated",
      summary:
        "New ASHRAE standards require higher minimum efficiency ratings for commercial equipment.",
      date: "2024-01-10",
      importance: "high",
      category: "Standards",
    },
  ];

  const mockQuickActions = [
    {
      label: "New Standard Cycle",
      icon: <Calculator className="h-4 w-4" />,
      action: "standard",
    },
    {
      label: "Compare Refrigerants",
      icon: <BarChart3 className="h-4 w-4" />,
      action: "compare",
    },
    {
      label: "Cascade Analysis",
      icon: <Activity className="h-4 w-4" />,
      action: "cascade",
    },
    {
      label: "Generate Report",
      icon: <RefreshCw className="h-4 w-4" />,
      action: "report",
    },
  ];

  const getImportanceColor = (importance: string) => {
    switch (importance) {
      case "high":
        return "border-red-200 bg-red-50";
      case "medium":
        return "border-yellow-200 bg-yellow-50";
      default:
        return "border-blue-200 bg-blue-50";
    }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case "down":
        return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />;
      default:
        return <Activity className="h-3 w-3 text-gray-600" />;
    }
  };

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
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                Professional Platform
              </Badge>
              <div className="text-sm text-gray-600">
                Empowering HVAC Professionals Worldwide
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {mockKPIs.map((kpi, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
              activeWidget === `kpi-${index}` ? "ring-2 ring-blue-500" : ""
            }`}
            onClick={() =>
              setActiveWidget(
                activeWidget === `kpi-${index}` ? null : `kpi-${index}`,
              )
            }
          >
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className={kpi.color}>{kpi.icon}</div>
                {getTrendIcon(kpi.trend)}
              </div>
              <div className="mt-2">
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="text-sm font-medium text-gray-900">
                  {kpi.label}
                </div>
                <div className="text-xs text-gray-600 mt-1">{kpi.change}</div>
              </div>
            </CardContent>
          </Card>
        ))}
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
            {mockQuickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => console.log(`Action: ${action.action}`)}
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

            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Recent Refrigerants</h4>
              <div className="flex flex-wrap gap-1">
                {["R32", "R134a", "R410A", "R290"].map((ref) => (
                  <Badge
                    key={ref}
                    variant="secondary"
                    className="text-xs cursor-pointer hover:bg-blue-100"
                  >
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-green-600" />
              Recent Projects
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockRecentProjects.map((project) => (
              <div
                key={project.id}
                className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="font-semibold text-sm">{project.name}</div>
                  <Badge
                    variant={
                      project.status === "Completed" ? "default" : "outline"
                    }
                    className="text-xs"
                  >
                    {project.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Refrigerant: {project.refrigerant}</span>
                  <span>{project.efficiency}% efficiency</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {project.lastModified}
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full text-sm">
              View All Projects →
            </Button>
          </CardContent>
        </Card>

        {/* Industry News & Updates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Industry Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {mockIndustryUpdates.map((news, index) => (
              <div
                key={index}
                className={`p-3 border rounded-lg ${getImportanceColor(news.importance)}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {news.category}
                  </Badge>
                  {news.importance === "high" && (
                    <AlertTriangle className="h-3 w-3 text-red-600" />
                  )}
                </div>
                <div className="font-semibold text-sm mb-1">{news.title}</div>
                <div className="text-xs text-gray-600 mb-2">{news.summary}</div>
                <div className="text-xs text-gray-500">
                  {new Date(news.date).toLocaleDateString()}
                </div>
              </div>
            ))}

            <Button variant="ghost" className="w-full text-sm">
              View All Updates →
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Professional Insights Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-600" />
            Today's Professional Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Efficiency Tip */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Thermometer className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Efficiency Tip</span>
              </div>
              <div className="text-sm text-gray-600">
                Optimizing superheat settings can improve COP by 8-15%. For R32
                systems, target 10-12°C superheat for optimal performance in
                moderate climates.
              </div>
              <Button size="sm" variant="outline">
                Learn More
              </Button>
            </div>

            {/* Sustainability Focus */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="font-semibold">Sustainability Focus</span>
              </div>
              <div className="text-sm text-gray-600">
                Natural refrigerants like R290 and R744 are gaining traction.
                Consider them for new installations to future-proof against
                evolving regulations.
              </div>
              <Button size="sm" variant="outline">
                Explore Alternatives
              </Button>
            </div>

            {/* Market Intelligence */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-blue-600" />
                <span className="font-semibold">Market Intelligence</span>
              </div>
              <div className="text-sm text-gray-600">
                Variable speed compressor adoption is up 35% this quarter. They
                offer significant energy savings in part-load conditions.
              </div>
              <Button size="sm" variant="outline">
                View Report
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Platform Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">CoolProp API: Online</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Calculation Engine: Operational</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm">Database: Connected</span>
            </div>
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Last Update: 2 minutes ago</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
