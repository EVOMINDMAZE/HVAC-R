import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    let results: any = calculation.results;
    // If results were saved as a JSON string, attempt to parse it
    if (typeof results === 'string') {
      try {
        results = JSON.parse(results);
      } catch (e) {
        // leave as string if parsing fails
        console.warn('Failed to parse calculation.results JSON string', e);
      }
    }

    // Helper to robustly read numeric values from several plausible paths
    const readNumber = (candidates: any[]) => {
      for (const v of candidates) {
        if (v === undefined || v === null) continue;
        const n = Number(v);
        if (!Number.isNaN(n)) return n;
      }
      return null;
    };

    const fmt = (v: any, digits = 2) => {
      const n = readNumber([v]);
      return n !== null ? n.toFixed(digits) : "N/A";
    };

    // Helper to fetch deep values with multiple fallback paths
    const pick = (obj: any, paths: string[][]) => {
      if (typeof obj === 'string') return undefined;
      for (const path of paths) {
        let cur = obj;
        let ok = true;
        for (const key of path) {
          if (cur === undefined || cur === null) {
            ok = false;
            break;
          }
          cur = cur[key];
        }
        if (ok && cur !== undefined) return cur;
      }
      return undefined;
    };

    // Helper to read state point values across common shapes
    const getStatePoint = (sp: any, idx: number) => {
      if (!sp) return undefined;
      // Array style
      if (Array.isArray(sp) && sp.length >= idx) return sp[idx - 1];
      // Numeric keys
      if (sp[String(idx)]) return sp[String(idx)];
      if (sp[`point_${idx}`]) return sp[`point_${idx}`];
      if (sp[`point${idx}`]) return sp[`point${idx}`];
      // keys like '1_compressor_inlet' or starting with `${idx}_`
      const keyMatch = Object.keys(sp || {}).find((k) => k && k.toString().startsWith(`${idx}_`));
      if (keyMatch) return sp[keyMatch];
      // fallback to ordered values
      const values = Object.values(sp);
      if (values && values.length >= idx) return values[idx - 1];
      return undefined;
    };

    const getStatePointValue = (sp: any, idx: number, propCandidates: string[]) => {
      const p = getStatePoint(sp, idx);
      if (!p) return null;
      for (const k of propCandidates) {
        if (p[k] !== undefined && p[k] !== null) {
          const n = Number(p[k]);
          if (!Number.isNaN(n)) return n;
          // try parse strings with units
          const parsed = Number(String(p[k]).replace(/[^0-9eE+\-\.]/g, ''));
          if (!Number.isNaN(parsed)) return parsed;
        }
      }
      return null;
    };

    switch (calculation.calculation_type) {
      case "Standard Cycle":
        // Accept multiple shapes: results.performance, results.data.performance, results.data?.data?.performance
        const perf =
          pick(results, [["performance"], ["data", "performance"], ["data", "data", "performance"]]) || {};
        const statePoints = pick(results, [["data", "state_points"], ["state_points"], ["data", "statePoints"], ["statePoints"]]);

        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-green-600 mb-3">Performance Summary</h5>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {fmt(pick(perf, [["cop"]]) ?? pick(perf, [["COP"], ["cop_approx"]]), 3)}
                  </div>
                  <div className="text-sm text-green-500">COP</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-lg font-semibold text-blue-600">
                    {fmt(pick(perf, [["refrigeration_effect_kj_kg"], ["refrigeration_effect" ]] ), 1) === "N/A" ? "N/A" : fmt(pick(perf, [["refrigeration_effect_kj_kg"], ["refrigeration_effect"]]), 1) + " kJ/kg"}
                  </div>
                  <div className="text-sm text-blue-500">Refrigeration Effect</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="text-lg font-semibold text-purple-600">
                    {fmt(pick(perf, [["work_of_compression_kj_kg"], ["work_input_kj_kg"], ["work_of_compression"]]), 1) === "N/A" ? "N/A" : fmt(pick(perf, [["work_of_compression_kj_kg"], ["work_input_kj_kg"], ["work_of_compression"]]), 1) + " kJ/kg"}
                  </div>
                  <div className="text-sm text-purple-500">Work Input</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {(() => {
                      const re = readNumber([pick(perf, [["refrigeration_effect_kj_kg"], ["refrigeration_effect"]])]) || 0;
                      const wi = readNumber([pick(perf, [["work_of_compression_kj_kg"], ["work_input_kj_kg"], ["work_of_compression"]])]) || 0;
                      const sum = re + wi;
                      return Number.isFinite(sum) && sum !== 0 ? sum.toFixed(1) + " kJ/kg" : "N/A";
                    })()}
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
                    <span>{fmt(pick(statePoints, [["1_compressor_inlet", "temp_c"], ["1", "temp_c"], ["1", "t_c" ]]), 1)}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">2 - Compressor Outlet:</span>
                    <span>{fmt(pick(statePoints, [["2_compressor_outlet", "temp_c"], ["2", "temp_c"]]), 1)}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">3 - Expansion Valve Inlet:</span>
                    <span>{fmt(pick(statePoints, [["3_expansion_valve_inlet", "temp_c"], ["3", "temp_c"]]), 1)}°C</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">4 - Evaporator Inlet:</span>
                    <span>Quality: {(() => {
                      const q = readNumber([pick(statePoints, [["4_evaporator_inlet", "vapor_quality"], ["4", "vapor_quality"], ["4", "quality" ]])]);
                      return q !== null ? q.toFixed(3) : "N/A";
                    })()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
        
      case "Refrigerant Comparison":
        const comparisonResults = pick(results, [["data","results"], ["data"], ["results"], []]) || [];

        return (
          <div className="space-y-4">
            <h5 className="font-semibold text-green-600 mb-3">Comparison Results</h5>
            {comparisonResults.map((result: any, index: number) => {
              const perf = pick(result, [["performance"], ["data","performance"], ["result","performance" ]]) || {};
              return (
                <div key={index} className="p-4 border rounded-lg">
                  <h6 className="font-semibold text-blue-600 mb-2">{result.refrigerant || result.name || `Result ${index+1}`}</h6>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium">COP:</span>
                      <span className="ml-2">{fmt(pick(perf, [["cop"], ["COP"]]), 3)}</span>
                    </div>
                    <div>
                      <span className="font-medium">Refrigeration Effect:</span>
                      <span className="ml-2">{fmt(pick(perf, [["refrigeration_effect_kj_kg"], ["refrigeration_effect"]]), 1)} kJ/kg</span>
                    </div>
                    <div>
                      <span className="font-medium">Work Input:</span>
                      <span className="ml-2">{fmt(pick(perf, [["work_of_compression_kj_kg"], ["work_input_kj_kg"], ["work_of_compression"]]), 1)} kJ/kg</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        );
        
      case "Cascade Cycle":
        // Accept multiple shapes for saved results
        const cascade = pick(results, [["data"], ["data", "data"], ["cascade"], []]) || {};

        // Try to compute overall COP if missing by using lt/ht perf values
        const maybeOverall = readNumber([pick(cascade, [["overall_performance", "cop"], ["overallCOP"], ["overall_performance", "COP"]])]);
        const ltPerf = pick(cascade, [["lt_cycle_performance"], ["lt_cycle", "performance"], ["lt_cycle_performance", "performance"], ["lt_cycle"], []]) || {};
        const htPerf = pick(cascade, [["ht_cycle_performance"], ["ht_cycle", "performance"], ["ht_cycle_performance", "performance"], ["ht_cycle"], []]) || {};

        const ltWork = readNumber([pick(ltPerf, [["work_of_compression_kj_kg"],["work_input_kj_kg"],["work_of_compression"],["work_kj_kg"]])]) || 0;
        const htWork = readNumber([pick(htPerf, [["work_of_compression_kj_kg"],["work_input_kj_kg"],["work_of_compression"],["work_kj_kg"]])]) || 0;
        const ltRe = readNumber([pick(ltPerf, [["refrigeration_effect_kj_kg"],["refrigeration_effect"],["refrig_kj_kg"]])]) || 0;
        const htRe = readNumber([pick(htPerf, [["refrigeration_effect_kj_kg"],["refrigeration_effect"],["refrig_kj_kg"]])]) || 0;

        const computedOverall = (ltWork + htWork) > 0 ? (ltRe + htRe) / (ltWork + htWork) : null;
        const overallCop = maybeOverall !== null ? maybeOverall : computedOverall;

        return (
          <div className="space-y-6">
            <div>
              <h5 className="font-semibold text-green-600 mb-3">Overall Performance</h5>
              <div className="p-4 bg-green-50 rounded-lg text-center">
                <div className="text-3xl font-bold text-green-600">
                  {overallCop !== null ? overallCop.toFixed(3) : "N/A"}
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
                    <span>{fmt(pick(ltPerf, [["cop"], ["COP"]]), 3)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Work Input:</span>
                    <span>{fmt(pick(ltPerf, [["work_of_compression_kj_kg"],["work_input_kj_kg"],["work_of_compression"]]), 1)} kJ/kg</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Refrigeration Effect:</span>
                    <span>{fmt(pick(ltPerf, [["refrigeration_effect_kj_kg"],["refrigeration_effect"]]), 1)} kJ/kg</span>
                  </div>
                </div>
              </div>

              <div>
                <h6 className="font-semibold text-red-600 mb-3">High-Temperature Cycle</h6>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">COP:</span>
                    <span>{fmt(pick(htPerf, [["cop"], ["COP"]]), 3)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Work Input:</span>
                    <span>{fmt(pick(htPerf, [["work_of_compression_kj_kg"],["work_input_kj_kg"],["work_of_compression"]]), 1)} kJ/kg</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="font-medium">Refrigeration Effect:</span>
                    <span>{fmt(pick(htPerf, [["refrigeration_effect_kj_kg"],["refrigeration_effect"]]), 1)} kJ/kg</span>
                  </div>
                </div>
              </div>

              {/* State points: try multiple possible structures */}
              <div className="md:col-span-2">
                <h5 className="font-semibold text-indigo-600 mb-3">State Points</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">1 - Compressor Inlet:</span>
                    <div>{(() => {
                      const val = getStatePointValue(pick(cascade, [["lt_cycle"], ["lt_cycle", "state_points"], ["lt_cycle", "points"], ["lt_cycle", "statePoints"], ["lt_cycle_state_points"]]) || pick(cascade, [["lt_cycle"], ["lt_cycle"]]), 1, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">2 - Compressor Outlet:</span>
                    <div>{(() => {
                      const val = getStatePointValue(pick(cascade, [["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || pick(cascade, [["lt_cycle"],["lt_cycle"]]), 2, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">3 - Expansion Valve Inlet:</span>
                    <div>{(() => {
                      const val = getStatePointValue(pick(cascade, [["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || pick(cascade, [["lt_cycle"],["lt_cycle"]]), 3, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">4 - Evaporator Inlet:</span>
                    <div>{(() => {
                      const q = getStatePointValue(pick(cascade, [["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || pick(cascade, [["lt_cycle"],["lt_cycle"]]), 4, ["vapor_quality","quality","x"]);
                      return q !== null ? `Quality: ${q.toFixed(3)}` : "Quality: N/A";
                    })()}</div>
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
