import { useState } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";

interface ComparisonFormData {
  refrigerants: string[];
  evaporatorTemp: number;
  condenserTemp: number;
  superheat: number;
  subcooling: number;
}

interface RefrigerantResult {
  refrigerant: string;
  cop: number;
  refrigerationEffect: number;
  workInput: number;
  heatRejection: number;
  volumetricCapacity: number;
  dischargePressure: number;
  suctionPressure: number;
}

interface ComparisonResult {
  results: RefrigerantResult[];
}

const refrigerantOptions = [
  { value: "R134a", label: "R-134a" },
  { value: "R290", label: "R-290 (Propane)" },
  { value: "R410A", label: "R-410A" },
  { value: "R404A", label: "R-404A" },
  { value: "R448A", label: "R-448A" },
  { value: "R32", label: "R-32" },
  { value: "R744", label: "R-744 (CO₂)" },
  { value: "R1234yf", label: "R-1234yf" },
];

const performanceMetrics = [
  { key: "cop", label: "COP", unit: "" },
  { key: "refrigerationEffect", label: "Refrigeration Effect", unit: "kJ/kg" },
  { key: "workInput", label: "Work Input", unit: "kJ/kg" },
  { key: "heatRejection", label: "Heat Rejection", unit: "kJ/kg" },
  { key: "volumetricCapacity", label: "Volumetric Capacity", unit: "kJ/m³" },
  { key: "dischargePressure", label: "Discharge Pressure", unit: "kPa" },
  { key: "suctionPressure", label: "Suction Pressure", unit: "kPa" },
];

export function RefrigerantComparison() {
  const [formData, setFormData] = useState<ComparisonFormData>({
    refrigerants: [],
    evaporatorTemp: -10,
    condenserTemp: 40,
    superheat: 5,
    subcooling: 5,
  });
  
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationData, setCalculationData] = useState<{ inputs: any; results: any } | null>(null);
  const { addToast } = useToast();

  const handleInputChange = (field: keyof Omit<ComparisonFormData, 'refrigerants'>, value: number) => {
    setFormData(prev => ({
      ...prev,
      [field]: Number(value) || 0
    }));
  };

  const handleRefrigerantToggle = (refrigerant: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      refrigerants: checked 
        ? [...prev.refrigerants, refrigerant]
        : prev.refrigerants.filter(r => r !== refrigerant)
    }));
  };

  const handleCompare = async () => {
    if (formData.refrigerants.length === 0) {
      const errorMsg = "Please select at least one refrigerant";
      setError(errorMsg);
      addToast({
        type: 'warning',
        title: 'Missing Selection',
        description: errorMsg
      });
      return;
    }

    if (formData.refrigerants.length < 2) {
      const errorMsg = "Please select at least 2 refrigerants for comparison";
      setError(errorMsg);
      addToast({
        type: 'warning',
        title: 'Insufficient Selection',
        description: errorMsg
      });
      return;
    }

    if (formData.evaporatorTemp >= formData.condenserTemp) {
      const errorMsg = "Evaporator temperature must be lower than condenser temperature";
      setError(errorMsg);
      addToast({
        type: 'warning',
        title: 'Invalid Parameters',
        description: errorMsg
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call external calculation API
      const data = await apiClient.compareRefrigerants(formData);

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data.data);

      // Save calculation to backend
      try {
        await addCalculation({
          type: 'Refrigerant Comparison',
          parameters: {
            refrigerants: formData.refrigerants,
            evaporatorTemp: formData.evaporatorTemp,
            condenserTemp: formData.condenserTemp,
            superheat: formData.superheat,
            subcooling: formData.subcooling
          },
          results: data.data,
          name: `Comparison: ${formData.refrigerants.join(', ')}`
        });

        addToast({
          type: 'success',
          title: 'Comparison Complete',
          description: `Successfully compared ${formData.refrigerants.length} refrigerants and saved to history`
        });
      } catch (saveError: any) {
        addToast({
          type: 'warning',
          title: 'Comparison Complete',
          description: saveError.message.includes('Upgrade required')
            ? saveError.message
            : `Comparison completed but could not be saved`
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Comparison failed";
      setError(errorMessage);
      addToast({
        type: 'error',
        title: 'Comparison Failed',
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const getValueForMetric = (result: RefrigerantResult, metricKey: string) => {
    const value = (result as any)[metricKey];
    return typeof value === 'number' ? value.toFixed(metricKey === 'cop' ? 2 : 1) : "N/A";
  };

  const getBestValueIndex = (metricKey: string) => {
    if (!result?.results) return -1;
    
    const values = result.results.map(r => (r as any)[metricKey]).filter(v => typeof v === 'number');
    if (values.length === 0) return -1;
    
    const bestValue = metricKey === 'cop' || metricKey === 'refrigerationEffect' || metricKey === 'volumetricCapacity'
      ? Math.max(...values)
      : Math.min(...values);
    
    return result.results.findIndex(r => (r as any)[metricKey] === bestValue);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-xl">Refrigerant Comparison</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">Select Refrigerants to Compare</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {refrigerantOptions.map((option) => (
                  <div key={option.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={option.value}
                      checked={formData.refrigerants.includes(option.value)}
                      onCheckedChange={(checked) => 
                        handleRefrigerantToggle(option.value, checked as boolean)
                      }
                    />
                    <Label htmlFor={option.value} className="text-sm cursor-pointer">
                      {option.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="evaporatorTemp">Evaporator Temperature (°C)</Label>
                <Input
                  id="evaporatorTemp"
                  type="number"
                  value={formData.evaporatorTemp}
                  onChange={(e) => handleInputChange("evaporatorTemp", parseFloat(e.target.value))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condenserTemp">Condenser Temperature (°C)</Label>
                <Input
                  id="condenserTemp"
                  type="number"
                  value={formData.condenserTemp}
                  onChange={(e) => handleInputChange("condenserTemp", parseFloat(e.target.value))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="superheat">Superheat (°C)</Label>
                <Input
                  id="superheat"
                  type="number"
                  value={formData.superheat}
                  onChange={(e) => handleInputChange("superheat", parseFloat(e.target.value))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcooling">Subcooling (°C)</Label>
                <Input
                  id="subcooling"
                  type="number"
                  value={formData.subcooling}
                  onChange={(e) => handleInputChange("subcooling", parseFloat(e.target.value))}
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <Button 
                onClick={handleCompare} 
                disabled={loading || formData.refrigerants.length === 0}
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  "Compare"
                )}
              </Button>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-700">{error}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {result && result.results && result.results.length > 0 && (
        <Card className="bg-white shadow-lg border-green-200">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
            <CardTitle className="text-xl">Comparison Results</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">Performance Metric</th>
                    {result.results.map((refrigerantResult) => (
                      <th key={refrigerantResult.refrigerant} className="text-center p-3 font-semibold text-blue-600 bg-blue-50">
                        {refrigerantResult.refrigerant}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {performanceMetrics.map((metric) => {
                    const bestIndex = getBestValueIndex(metric.key);
                    return (
                      <tr key={metric.key} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="p-3 font-medium text-gray-700 bg-gray-50">
                          {metric.label}
                          {metric.unit && <span className="text-sm text-gray-500 ml-1">({metric.unit})</span>}
                        </td>
                        {result.results.map((refrigerantResult, index) => (
                          <td 
                            key={refrigerantResult.refrigerant} 
                            className={`p-3 text-center ${
                              index === bestIndex 
                                ? 'bg-green-100 text-green-800 font-semibold' 
                                : 'text-gray-700'
                            }`}
                          >
                            {getValueForMetric(refrigerantResult, metric.key)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              <span className="inline-block w-4 h-4 bg-green-100 mr-2 rounded"></span>
              Best performance for each metric
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
