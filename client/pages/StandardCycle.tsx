import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface StandardCycleFormData {
  refrigerant: string;
  evaporatorTemp: number;
  condenserTemp: number;
  superheat: number;
  subcooling: number;
}

interface StatePoint {
  name: string;
  temperature: number;
  pressure: number;
  enthalpy: number;
  entropy: number;
}

interface StandardCycleResult {
  cop: number;
  refrigerationEffect: number;
  workInput: number;
  heatRejection: number;
  statePoints: StatePoint[];
}

const refrigerantOptions = [
  { value: "R134a", label: "R-134a" },
  { value: "R290", label: "R-290 (Propane)" },
  { value: "R410A", label: "R-410A" },
  { value: "R404A", label: "R-404A" },
  { value: "R448A", label: "R-448A" },
  { value: "R32", label: "R-32" },
];

export function StandardCycle() {
  const [formData, setFormData] = useState<StandardCycleFormData>({
    refrigerant: "",
    evaporatorTemp: -10,
    condenserTemp: 40,
    superheat: 5,
    subcooling: 5,
  });
  
  const [result, setResult] = useState<StandardCycleResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (field: keyof StandardCycleFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCalculate = async () => {
    if (!formData.refrigerant) {
      setError("Please select a refrigerant");
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch("https://simulateon-backend.onrender.com/calculate-standard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refrigerant: formData.refrigerant,
          evap_temp_c: formData.evaporatorTemp,
          cond_temp_c: formData.condenserTemp,
          superheat_c: formData.superheat,
          subcooling_c: formData.subcooling,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-xl">Standard Refrigeration Cycle</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label htmlFor="refrigerant">Refrigerant</Label>
              <Select value={formData.refrigerant} onValueChange={(value) => handleInputChange("refrigerant", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select refrigerant" />
                </SelectTrigger>
                <SelectContent>
                  {refrigerantOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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

          <div className="mt-6">
            <Button 
              onClick={handleCalculate} 
              disabled={loading || !formData.refrigerant}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                "Calculate"
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <div className="space-y-6">
          <Card className="bg-white shadow-lg border-green-200">
            <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
              <CardTitle className="text-xl">Performance Summary</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {result.cop.toFixed(2)}
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Coefficient of Performance (COP)
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-semibold text-blue-600">
                    {result.refrigerationEffect?.toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-blue-500 mt-1">Refrigeration Effect</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-semibold text-purple-600">
                    {result.workInput?.toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-purple-500 mt-1">Work Input</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-semibold text-orange-600">
                    {result.heatRejection?.toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-orange-500 mt-1">Heat Rejection</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {result.statePoints && result.statePoints.length > 0 && (
            <Card className="bg-white shadow-lg border-blue-200">
              <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
                <CardTitle className="text-xl">State Points</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left p-3 font-semibold text-gray-700">State Point</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Temperature (°C)</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Pressure (kPa)</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Enthalpy (kJ/kg)</th>
                        <th className="text-left p-3 font-semibold text-gray-700">Entropy (kJ/kg·K)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.statePoints.map((point, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="p-3 font-medium text-blue-600">{point.name}</td>
                          <td className="p-3">{point.temperature?.toFixed(1) || "N/A"}</td>
                          <td className="p-3">{point.pressure?.toFixed(1) || "N/A"}</td>
                          <td className="p-3">{point.enthalpy?.toFixed(1) || "N/A"}</td>
                          <td className="p-3">{point.entropy?.toFixed(3) || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
