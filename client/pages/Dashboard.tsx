import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Calculator, 
  History, 
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

// Mock data for user calculations history
const mockCalculations = [
  {
    id: 1,
    type: "Standard Cycle",
    refrigerant: "R-134a",
    cop: 3.86,
    createdAt: "2024-01-15T10:30:00Z",
    parameters: {
      evapTemp: -10,
      condTemp: 40,
      superheat: 5,
      subcooling: 5
    }
  },
  {
    id: 2,
    type: "Refrigerant Comparison",
    refrigerants: ["R-410A", "R-32", "R-744"],
    bestCOP: 4.12,
    createdAt: "2024-01-14T15:45:00Z"
  },
  {
    id: 3,
    type: "Cascade System",
    ltRefrigerant: "R-744",
    htRefrigerant: "R-134a",
    overallCOP: 2.95,
    createdAt: "2024-01-13T09:15:00Z"
  }
];

interface DashboardHeaderProps {
  userName?: string;
}

function DashboardHeader({ userName = "Engineer" }: DashboardHeaderProps) {
  return (
    <div className="bg-white shadow-sm border-b border-blue-200">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Simulateon</h1>
            <p className="text-blue-600 mt-1">Welcome back, {userName}</p>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
            <Button variant="outline" size="sm">
              <User className="h-4 w-4 mr-2" />
              Profile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStats() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Calculations</p>
              <p className="text-2xl font-bold">24</p>
            </div>
            <Calculator className="h-8 w-8 text-blue-200" />
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Projects Saved</p>
              <p className="text-2xl font-bold">8</p>
            </div>
            <FileText className="h-8 w-8 text-purple-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Avg COP Improvement</p>
              <p className="text-2xl font-bold">12%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">This Month</p>
              <p className="text-2xl font-bold">6</p>
            </div>
            <BarChart3 className="h-8 w-8 text-orange-200" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RecentCalculations() {
  return (
    <Card className="bg-white shadow-lg border-blue-200">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <CardTitle className="flex items-center">
          <History className="h-5 w-5 mr-2" />
          Recent Calculations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {mockCalculations.map((calc) => (
            <div key={calc.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Calculator className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{calc.type}</h4>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(calc.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                {calc.type === "Standard Cycle" && (
                  <div>
                    <Badge variant="secondary">{calc.refrigerant}</Badge>
                    <p className="text-sm text-gray-600 mt-1">COP: {calc.cop}</p>
                  </div>
                )}
                {calc.type === "Refrigerant Comparison" && (
                  <div>
                    <Badge variant="secondary">{calc.refrigerants?.length} refrigerants</Badge>
                    <p className="text-sm text-gray-600 mt-1">Best COP: {calc.bestCOP}</p>
                  </div>
                )}
                {calc.type === "Cascade System" && (
                  <div>
                    <Badge variant="secondary">Cascade</Badge>
                    <p className="text-sm text-gray-600 mt-1">COP: {calc.overallCOP}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 text-center">
          <Button variant="outline" className="w-full">
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
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle>Calculation History</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center py-12">
                  <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Full History Coming Soon</h3>
                  <p className="text-gray-600 mb-6">
                    We're building a comprehensive calculation history with search, filters, and export options.
                  </p>
                  <Button variant="outline">
                    Request Early Access
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
