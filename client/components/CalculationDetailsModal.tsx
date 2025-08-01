import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculation } from "@/hooks/useSupabaseCalculations";

interface CalculationDetailsModalProps {
  calculation: Calculation;
}

export function CalculationDetailsModal({ calculation }: CalculationDetailsModalProps) {
  const getCalculationColor = (type: string) => {
    switch (type) {
      case "Standard Cycle":
        return "bg-blue-100 text-blue-800";
      case "Refrigerant Comparison":
        return "bg-green-100 text-green-800";
      case "Cascade Cycle":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const renderInputs = () => {
    const inputs = calculation.inputs;
    
    switch (calculation.calculation_type) {
      case "Standard Cycle":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Refrigerant:</span>
              <span className="ml-2">{inputs.refrigerant}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Evaporator Temp:</span>
              <span className="ml-2">{inputs.evaporatorTemp}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Condenser Temp:</span>
              <span className="ml-2">{inputs.condenserTemp}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Superheat:</span>
              <span className="ml-2">{inputs.superheat}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Subcooling:</span>
              <span className="ml-2">{inputs.subcooling}°C</span>
            </div>
          </div>
        );
        
      case "Refrigerant Comparison":
        return (
          <div className="space-y-4">
            <div>
              <span className="font-medium text-gray-700">Refrigerants:</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {inputs.refrigerants?.map((ref: string) => (
                  <Badge key={ref} variant="outline">{ref}</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Evaporator Temp:</span>
                <span className="ml-2">{inputs.evaporatorTemp}°C</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Condenser Temp:</span>
                <span className="ml-2">{inputs.condenserTemp}°C</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Superheat:</span>
                <span className="ml-2">{inputs.superheat}°C</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Subcooling:</span>
                <span className="ml-2">{inputs.subcooling}°C</span>
              </div>
            </div>
          </div>
        );
        
      case "Cascade Cycle":
        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-blue-600 mb-3">Low-Temperature Cycle</h5>
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div>
                  <span className="font-medium text-gray-700">Refrigerant:</span>
                  <span className="ml-2">{inputs.ltCycle?.refrigerant}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Evaporator Temp:</span>
                  <span className="ml-2">{inputs.ltCycle?.evaporatorTemp}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Condenser Temp:</span>
                  <span className="ml-2">{inputs.ltCycle?.condenserTemp}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Superheat:</span>
                  <span className="ml-2">{inputs.ltCycle?.superheat}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Subcooling:</span>
                  <span className="ml-2">{inputs.ltCycle?.subcooling}°C</span>
                </div>
              </div>
            </div>
            
            <div>
              <h5 className="font-semibold text-red-600 mb-3">High-Temperature Cycle</h5>
              <div className="grid grid-cols-2 gap-4 ml-4">
                <div>
                  <span className="font-medium text-gray-700">Refrigerant:</span>
                  <span className="ml-2">{inputs.htCycle?.refrigerant}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Evaporator Temp:</span>
                  <span className="ml-2">{inputs.htCycle?.evaporatorTemp}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Condenser Temp:</span>
                  <span className="ml-2">{inputs.htCycle?.condenserTemp}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Superheat:</span>
                  <span className="ml-2">{inputs.htCycle?.superheat}°C</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Subcooling:</span>
                  <span className="ml-2">{inputs.htCycle?.subcooling}°C</span>
                </div>
              </div>
            </div>
            
            <div>
              <span className="font-medium text-gray-700">Cascade Heat Exchanger ΔT:</span>
              <span className="ml-2">{inputs.cascadeHeatExchangerDT}°C</span>
            </div>
          </div>
        );
        
      default:
        return <div className="text-gray-500">No input details available</div>;
    }
  };

  const renderResults = () => {
    const results = calculation.results;
    
    switch (calculation.calculation_type) {
      case "Standard Cycle":
        const performance = results?.data?.performance;
        const statePoints = results?.data?.state_points;
        
        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-green-600 mb-3">Performance Summary</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {performance?.cop?.toFixed(3) || "N/A"}
                  </div>
                  <div className="text-sm text-green-500">COP</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {performance?.refrigeration_effect_kj_kg?.toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-blue-500">Refrigeration Effect</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {performance?.work_of_compression_kj_kg?.toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-purple-500">Work Input</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {((performance?.refrigeration_effect_kj_kg || 0) + (performance?.work_of_compression_kj_kg || 0)).toFixed(1) || "N/A"} kJ/kg
                  </div>
                  <div className="text-sm text-orange-500">Heat Rejection</div>
                </div>
              </div>
            </div>
            
            {statePoints && (
              <div>
                <h5 className="font-semibold text-indigo-600 mb-3">State Points</h5>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">1 - Compressor Inlet:</span>
                    <span>{statePoints["1_compressor_inlet"]?.temp_c?.toFixed(1) || "N/A"}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">2 - Compressor Outlet:</span>
                    <span>{statePoints["2_compressor_outlet"]?.temp_c?.toFixed(1) || "N/A"}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">3 - Expansion Valve Inlet:</span>
                    <span>{statePoints["3_expansion_valve_inlet"]?.temp_c?.toFixed(1) || "N/A"}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">4 - Evaporator Inlet:</span>
                    <span>Quality: {statePoints["4_evaporator_inlet"]?.vapor_quality?.toFixed(3) || "N/A"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case "Refrigerant Comparison":
        const comparisonResults = results?.data?.results || results?.data || [];
        
        return (
          <div className="space-y-4">
            <h5 className="font-semibold text-green-600 mb-3">Comparison Results</h5>
            {comparisonResults.map((result: any, index: number) => (
              <div key={index} className="p-4 border rounded-lg">
                <h6 className="font-semibold text-blue-600 mb-2">{result.refrigerant}</h6>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">COP:</span>
                    <span className="ml-2">{result.performance?.cop?.toFixed(3) || "N/A"}</span>
                  </div>
                  <div>
                    <span className="font-medium">Refrigeration Effect:</span>
                    <span className="ml-2">{result.performance?.refrigeration_effect_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div>
                    <span className="font-medium">Work Input:</span>
                    <span className="ml-2">{result.performance?.work_of_compression_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );
        
      case "Cascade Cycle":
        const cascadeData = results?.data;
        
        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-green-600 mb-3">Overall Performance</h5>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {cascadeData?.overall_performance?.cop?.toFixed(3) || "N/A"}
                </div>
                <div className="text-sm text-green-500">Overall System COP</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h6 className="font-semibold text-blue-600 mb-3">Low-Temperature Cycle</h6>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">COP:</span>
                    <span>{cascadeData?.lt_cycle_performance?.cop?.toFixed(3) || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Work Input:</span>
                    <span>{cascadeData?.lt_cycle_performance?.work_of_compression_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Refrigeration Effect:</span>
                    <span>{cascadeData?.lt_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h6 className="font-semibold text-red-600 mb-3">High-Temperature Cycle</h6>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">COP:</span>
                    <span>{cascadeData?.ht_cycle_performance?.cop?.toFixed(3) || "N/A"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Work Input:</span>
                    <span>{cascadeData?.ht_cycle_performance?.work_of_compression_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Refrigeration Effect:</span>
                    <span>{cascadeData?.ht_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(1) || "N/A"} kJ/kg</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return <div className="text-gray-500">No result details available</div>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h4 className="font-semibold mb-2">Calculation Type</h4>
        <Badge className={getCalculationColor(calculation.calculation_type)}>
          {calculation.calculation_type}
        </Badge>
      </div>
      
      <div>
        <h4 className="font-semibold mb-2">Created</h4>
        <p className="text-sm text-gray-600">
          {new Date(calculation.created_at).toLocaleString()}
        </p>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Input Parameters</h4>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            {renderInputs()}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h4 className="font-semibold mb-3">Results</h4>
        <Card className="bg-gray-50">
          <CardContent className="p-4">
            {renderResults()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
