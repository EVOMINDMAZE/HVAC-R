import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useCalculationHistory } from "@/hooks/useCalculationHistory";
import { useUserStats } from "@/hooks/useUserStats";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  History as HistoryIcon,
  User,
  Settings,
  TrendingUp,
  FileText,
  Plus,
  Clock,
  BarChart3
} from "lucide-react";
import { StandardCycle } from "./StandardCycle";
import { RefrigerantComparison } from "./RefrigerantComparison";
import { CascadeCycle } from "./CascadeCycle";
import { History } from "./History";



function DashboardHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="bg-white shadow-sm border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Simulateon</h1>
            <p className="text-blue-600 mt-1">
              Welcome back, {user?.firstName || "Engineer"}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/profile")}
            >
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStats() {
  const { stats, isLoading } = useUserStats();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="bg-gradient-to-r from-gray-400 to-gray-500 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-100 text-sm">Loading...</p>
                  <div className="w-16 h-6 bg-gray-300 rounded animate-pulse"></div>
                </div>
                <div className="w-8 h-8 bg-gray-300 rounded animate-pulse"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const remainingText = stats?.subscription.remaining === -1
    ? "Unlimited"
    : stats?.subscription.remaining?.toString() || "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Calculations</p>
              <p className="text-2xl font-bold">{stats?.totalCalculations || 0}</p>
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
              <p className="text-2xl font-bold">{stats?.monthlyCalculations || 0}</p>
            </div>
            <FileText className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Plan Remaining</p>
              <p className="text-2xl font-bold">{remainingText}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Current Plan</p>
              <p className="text-xl font-bold capitalize">{user?.subscription_plan || 'Free'}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentCalculations() {
  const { calculations } = useCalculationHistory();
  const navigate = useNavigate();
  const recentCalculations = calculations.slice(0, 5);

  const formatResultSummary = (calc: any) => {
    switch (calc.type) {
      case "Standard Cycle":
        return `COP: ${calc.results?.performance?.cop?.toFixed(2) || "N/A"}`;
      case "Refrigerant Comparison":
        return `${calc.parameters?.refrigerants?.length || 0} refrigerants`;
      case "Cascade Cycle":
        return `Overall COP: ${calc.results?.performance?.overallCOP?.toFixed(2) || "N/A"}`;
      default:
        return "";
    }
  };

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
                    <h4 className="font-semibold text-gray-900">{calc.name || calc.type}</h4>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(calc.timestamp).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="secondary">{calc.type}</Badge>
                  <p className="text-sm text-gray-600 mt-1">{formatResultSummary(calc)}</p>
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
  return (
    <Card className="bg-white shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
        <CardTitle className="flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <Button className="w-full justify-start" variant="outline">
          <Calculator className="h-4 w-4 mr-2" />
          New Standard Cycle
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <TrendingUp className="h-4 w-4 mr-2" />
          Compare Refrigerants
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <BarChart3 className="h-4 w-4 mr-2" />
          Cascade Analysis
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Load Project
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <DashboardHeader />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <QuickStats />
        
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-8 bg-white border border-blue-200">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="standard" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Standard Cycle
            </TabsTrigger>
            <TabsTrigger 
              value="comparison" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Refrigerant Comparison
            </TabsTrigger>
            <TabsTrigger 
              value="cascade" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              Cascade Cycle
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white"
            >
              History
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentCalculations />
              <QuickActions />
            </div>
          </TabsContent>
          
          <TabsContent value="standard" className="space-y-6">
            <StandardCycle />
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6">
            <RefrigerantComparison />
          </TabsContent>
          
          <TabsContent value="cascade" className="space-y-6">
            <CascadeCycle />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <History />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
