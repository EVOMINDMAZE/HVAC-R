import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { Header } from "@/components/Header";
import { SupabaseStatus } from "@/components/SupabaseStatus";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { ApiTester } from "@/components/ApiTester";
import { SystemStatus } from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calculator,
  History as HistoryIcon,
  TrendingUp,
  FileText,
  Plus,
  Clock,
  BarChart3
} from "lucide-react";

// Import calculation components - these are used ONLY within dashboard tabs
import { StandardCycleContent } from "./StandardCycleContent";
import { RefrigerantComparisonContent } from "./RefrigerantComparisonContent"; 
import { CascadeCycleContent } from "./CascadeCycleContent";
import { History } from "./History";

function QuickStats() {
  const { user } = useSupabaseAuth();
  const { calculations } = useSupabaseCalculations();

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
              <p className="text-xl font-bold capitalize">Free</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
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

function QuickActions({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
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
          onClick={() => setActiveTab('standard')}
        >
          <Calculator className="h-4 w-4 mr-2" />
          New Standard Cycle
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setActiveTab('comparison')}
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Compare Refrigerants
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setActiveTab('cascade')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Cascade Analysis
        </Button>
        <Button 
          className="w-full justify-start" 
          variant="outline"
          onClick={() => setActiveTab('history')}
        >
          <FileText className="h-4 w-4 mr-2" />
          View History
        </Button>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        <SystemStatus />
        <SupabaseStatus />
        <ApiTester />
        <ApiServiceStatus />
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
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
            <QuickStats />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <RecentCalculations />
              <QuickActions setActiveTab={setActiveTab} />
            </div>
          </TabsContent>
          
          <TabsContent value="standard" className="space-y-6">
            <StandardCycleContent />
          </TabsContent>
          
          <TabsContent value="comparison" className="space-y-6">
            <RefrigerantComparisonContent />
          </TabsContent>
          
          <TabsContent value="cascade" className="space-y-6">
            <CascadeCycleContent />
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <History />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
