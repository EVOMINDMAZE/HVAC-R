import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface CycleData {
  refrigerant: string;
  evaporatorTemp: number;
  condenserTemp: number;
  superheat: number;
  subcooling: number;
}

interface CascadeFormData {
  ltCycle: CycleData;
  htCycle: CycleData;
  cascadeHeatExchangerDT: number;
}

interface CycleResult {
  cop: number;
  refrigerationEffect: number;
  workInput: number;
  heatRejection: number;
  massFlowRate: number;
}

interface CascadeResult {
  overallCOP: number;
  ltCycleResult: CycleResult;
  htCycleResult: CycleResult;
  totalWorkInput: number;
  systemEfficiency: number;
  cascadeTemperature: number;
}

const refrigerantOptions = [
  { value: "R134a", label: "R-134a" },
  { value: "R290", label: "R-290 (Propane)" },
  { value: "R410A", label: "R-410A" },
  { value: "R404A", label: "R-404A" },
  { value: "R448A", label: "R-448A" },
  { value: "R32", label: "R-32" },
  { value: "R744", label: "R-744 (CO₂)" },
  { value: "R507A", label: "R-507A" },
];

export function CascadeCycle() {
  const [formData, setFormData] = useState<CascadeFormData>({
    ltCycle: {
      refrigerant: "",
      evaporatorTemp: -40,
      condenserTemp: -10,
      superheat: 5,
      subcooling: 5,
    },
    htCycle: {
      refrigerant: "",
      evaporatorTemp: -15,
      condenserTemp: 40,
      superheat: 5,
      subcooling: 5,
    },
    cascadeHeatExchangerDT: 5,
  });
  
  const [result, setResult] = useState<CascadeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCycleInputChange = (
    cycle: 'ltCycle' | 'htCycle',
    field: keyof CycleData,
    value: string | number
  ) => {
    setFormData(prev => ({
      ...prev,
      [cycle]: {
        ...prev[cycle],
        [field]: field === 'refrigerant' ? value : (Number(value) || 0)
      }
    }));
  };

  const handleCascadeDTChange = (value: number) => {
    setFormData(prev => ({
      ...prev,
      cascadeHeatExchangerDT: Number(value) || 0
    }));
  };

  const handleCalculate = async () => {
    if (!formData.ltCycle.refrigerant || !formData.htCycle.refrigerant) {
      setError("Please select refrigerants for both cycles");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("https://simulateon-backend.onrender.com/calculate-cascade", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          lt_cycle: {
            refrigerant: formData.ltCycle.refrigerant,
            evap_temp_c: Number(formData.ltCycle.evaporatorTemp) || 0,
            cond_temp_c: Number(formData.ltCycle.condenserTemp) || 0,
            superheat_c: Number(formData.ltCycle.superheat) || 0,
            subcooling_c: Number(formData.ltCycle.subcooling) || 0,
          },
          ht_cycle: {
            refrigerant: formData.htCycle.refrigerant,
            evap_temp_c: Number(formData.htCycle.evaporatorTemp) || 0,
            cond_temp_c: Number(formData.htCycle.condenserTemp) || 0,
            superheat_c: Number(formData.htCycle.superheat) || 0,
            subcooling_c: Number(formData.htCycle.subcooling) || 0,
          },
          cascade_hx_delta_t_c: Number(formData.cascadeHeatExchangerDT) || 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Calculation failed");
    } finally {
      setLoading(false);
    }
  };

  const CycleForm = ({ 
    title, 
    data, 
    onChange, 
    titleColor 
  }: { 
    title: string; 
    data: CycleData; 
    onChange: (field: keyof CycleData, value: string | number) => void;
    titleColor: string;
  }) => (
    <Card className="bg-white shadow-md border-gray-200">
      <CardHeader className={`${titleColor} text-white`}>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Refrigerant</Label>
          <Select value={data.refrigerant} onValueChange={(value) => onChange("refrigerant", value)}>
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
          <Label>Evaporator Temperature (°C)</Label>
          <Input
            type="number"
            value={data.evaporatorTemp}
            onChange={(e) => onChange("evaporatorTemp", parseFloat(e.target.value))}
            className="border-blue-200 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label>Condenser Temperature (°C)</Label>
          <Input
            type="number"
            value={data.condenserTemp}
            onChange={(e) => onChange("condenserTemp", parseFloat(e.target.value))}
            className="border-blue-200 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Superheat (°C)</Label>
            <Input
              type="number"
              value={data.superheat}
              onChange={(e) => onChange("superheat", parseFloat(e.target.value))}
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Subcooling (°C)</Label>
            <Input
              type="number"
              value={data.subcooling}
              onChange={(e) => onChange("subcooling", parseFloat(e.target.value))}
              className="border-blue-200 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CycleForm
          title="Low-Temperature Cycle"
          data={formData.ltCycle}
          onChange={(field, value) => handleCycleInputChange('ltCycle', field, value)}
          titleColor="bg-gradient-to-r from-cyan-600 to-blue-600"
        />

        <CycleForm
          title="High-Temperature Cycle"
          data={formData.htCycle}
          onChange={(field, value) => handleCycleInputChange('htCycle', field, value)}
          titleColor="bg-gradient-to-r from-orange-600 to-red-600"
        />
      </div>

      <Card className="bg-white shadow-lg border-purple-200">
        <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardTitle className="text-xl">Cascade System Parameters</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="max-w-md">
            <div className="space-y-2">
              <Label htmlFor="cascadeDT">Cascade Heat Exchanger ΔT (°C)</Label>
              <Input
                id="cascadeDT"
                type="number"
                value={formData.cascadeHeatExchangerDT}
                onChange={(e) => handleCascadeDTChange(parseFloat(e.target.value))}
                className="border-purple-200 focus:border-purple-500"
              />
              <p className="text-sm text-gray-600">
                Temperature difference between the two cycles in the cascade heat exchanger
              </p>
            </div>
          </div>

          <div className="mt-6">
            <Button 
              onClick={handleCalculate} 
              disabled={loading || !formData.ltCycle.refrigerant || !formData.htCycle.refrigerant}
              className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating Cascade...
                </>
              ) : (
                "Calculate Cascade"
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
              <CardTitle className="text-xl">Cascade System Performance</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-green-600 mb-2">
                  {result.performance?.overallCOP?.toFixed(2) || "N/A"}
                </div>
                <Badge variant="secondary" className="text-lg px-4 py-2">
                  Overall System COP
                </Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-semibold text-purple-600">
                    {result.performance?.totalWorkInput?.toFixed(1) || "N/A"} kW
                  </div>
                  <div className="text-sm text-purple-500 mt-1">Total Work Input</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-semibold text-blue-600">
                    {result.performance?.systemEfficiency?.toFixed(1) || "N/A"}%
                  </div>
                  <div className="text-sm text-blue-500 mt-1">System Efficiency</div>
                </div>
                <div className="text-center p-4 bg-indigo-50 rounded-lg">
                  <div className="text-2xl font-semibold text-indigo-600">
                    {result.performance?.cascadeTemperature?.toFixed(1) || "N/A"}°C
                  </div>
                  <div className="text-sm text-indigo-500 mt-1">Cascade Temperature</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white shadow-md border-cyan-200">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                <CardTitle className="text-lg">Low-Temperature Cycle Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">COP:</span>
                    <span className="font-semibold ml-2">{result.ltCycle?.cop?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Work Input:</span>
                    <span className="font-semibold ml-2">{result.ltCycle?.workInput?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Refrigeration Effect:</span>
                    <span className="font-semibold ml-2">{result.ltCycle?.refrigerationEffect?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Heat Rejection:</span>
                    <span className="font-semibold ml-2">{result.ltCycle?.heatRejection?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white shadow-md border-orange-200">
              <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                <CardTitle className="text-lg">High-Temperature Cycle Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">COP:</span>
                    <span className="font-semibold ml-2">{result.htCycle?.cop?.toFixed(2) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Work Input:</span>
                    <span className="font-semibold ml-2">{result.htCycle?.workInput?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Refrigeration Effect:</span>
                    <span className="font-semibold ml-2">{result.htCycle?.refrigerationEffect?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Heat Rejection:</span>
                    <span className="font-semibold ml-2">{result.htCycle?.heatRejection?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
