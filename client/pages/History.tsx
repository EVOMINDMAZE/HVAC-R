import { useState } from "react";
import { useCalculationHistory, CalculationResult } from "@/hooks/useCalculationHistory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  History as HistoryIcon, 
  Search, 
  Calendar, 
  Download, 
  Trash2, 
  Calculator,
  TrendingUp,
  BarChart3,
  Filter,
  Eye,
  Edit
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function History() {
  const { calculations, deleteCalculation, updateCalculation } = useCalculationHistory();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [selectedCalculation, setSelectedCalculation] = useState<CalculationResult | null>(null);

  // Filter and sort calculations
  const filteredCalculations = calculations
    .filter(calc => {
      const matchesSearch = calc.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           calc.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === "all" || calc.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        case "oldest":
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        case "name":
          return (a.name || a.type).localeCompare(b.name || b.type);
        default:
          return 0;
      }
    });

  const getCalculationIcon = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return <Calculator className="h-4 w-4" />;
      case "Refrigerant Comparison":
        return <TrendingUp className="h-4 w-4" />;
      case "Cascade Cycle":
        return <BarChart3 className="h-4 w-4" />;
      default:
        return <Calculator className="h-4 w-4" />;
    }
  };

  const getCalculationTypeColor = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return "bg-blue-100 text-blue-700";
      case "Refrigerant Comparison":
        return "bg-purple-100 text-purple-700";
      case "Cascade Cycle":
        return "bg-green-100 text-green-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const formatResultSummary = (calc: CalculationResult) => {
    switch (calc.type) {
      case "Standard Cycle":
        return `COP: ${calc.results?.performance?.cop?.toFixed(2) || "N/A"}`;
      case "Refrigerant Comparison":
        return `${calc.parameters?.refrigerants?.length || 0} refrigerants compared`;
      case "Cascade Cycle":
        return `Overall COP: ${calc.results?.performance?.overallCOP?.toFixed(2) || "N/A"}`;
      default:
        return "";
    }
  };

  const exportCalculation = (calc: CalculationResult) => {
    const dataStr = JSON.stringify(calc, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${calc.name || calc.type}_${new Date(calc.timestamp).toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => window.history.back()}>
                ← Back to Dashboard
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-blue-900 flex items-center">
                  <HistoryIcon className="h-8 w-8 mr-3" />
                  Calculation History
                </h1>
                <p className="text-blue-600 mt-1">
                  {calculations.length} calculations saved
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters and Search */}
        <Card className="bg-white shadow-lg border-blue-200 mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search calculations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-blue-200 focus:border-blue-500"
                />
              </div>
              
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Standard Cycle">Standard Cycle</SelectItem>
                  <SelectItem value="Refrigerant Comparison">Refrigerant Comparison</SelectItem>
                  <SelectItem value="Cascade Cycle">Cascade Cycle</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="border-blue-200 focus:border-blue-500">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="name">Name A-Z</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Filter className="h-4 w-4 mr-2" />
                  Advanced
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Calculations List */}
        {filteredCalculations.length === 0 ? (
          <Card className="bg-white shadow-lg border-blue-200">
            <CardContent className="p-12 text-center">
              <HistoryIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {searchTerm || filterType !== "all" ? "No matching calculations found" : "No calculations yet"}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchTerm || filterType !== "all" 
                  ? "Try adjusting your search or filter criteria."
                  : "Start by running some calculations in the dashboard."
                }
              </p>
              {!searchTerm && filterType === "all" && (
                <Button onClick={() => window.history.back()}>
                  Go to Dashboard
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredCalculations.map((calc) => (
              <Card key={calc.id} className="bg-white shadow-lg border-blue-200 hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getCalculationTypeColor(calc.type)}`}>
                        {getCalculationIcon(calc.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {calc.name || calc.type}
                          </h3>
                          <Badge variant="secondary" className={getCalculationTypeColor(calc.type)}>
                            {calc.type}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(calc.timestamp).toLocaleDateString()}</span>
                          </div>
                          <span>{formatResultSummary(calc)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedCalculation(calc)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => exportCalculation(calc)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteCalculation(calc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detailed View Modal */}
        {selectedCalculation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <CardTitle className="flex items-center justify-between">
                  <span>{selectedCalculation.name || selectedCalculation.type}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedCalculation(null)}
                    className="text-white hover:bg-white/20"
                  >
                    ✕
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Calculation Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{selectedCalculation.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Date:</span>
                        <span className="ml-2 font-medium">
                          {new Date(selectedCalculation.timestamp).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Parameters</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedCalculation.parameters, null, 2)}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">Results</h4>
                    <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
                      {JSON.stringify(selectedCalculation.results, null, 2)}
                    </pre>
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => exportCalculation(selectedCalculation)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        deleteCalculation(selectedCalculation.id);
                        setSelectedCalculation(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
