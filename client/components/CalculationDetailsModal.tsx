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
    const inputs = calculation.inputs || {};

    const getInputValue = (obj: any, candidates: string[]) => {
      if (!obj) return null;
      for (const key of candidates) {
        if (obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
      }
      // try nested lt_cycle/ht_cycle keys
      for (const val of Object.values(obj)) {
        if (val && typeof val === 'object') {
          for (const key of candidates) {
            if (val[key] !== undefined && val[key] !== null && val[key] !== "") return val[key];
          }
        }
      }
      return null;
    };

    switch (calculation.calculation_type) {
      case "Standard Cycle":
        return (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium text-gray-700">Refrigerant:</span>
              <span className="ml-2">{getInputValue(inputs, ['refrigerant','refrigerant_id','refrigerantName','ref']) || 'N/A'}</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Evaporator Temp:</span>
              <span className="ml-2">{(getInputValue(inputs, ['evaporatorTemp','evap_temp_c','evapTemp','evap_temp','evap']) !== null ? getInputValue(inputs, ['evaporatorTemp','evap_temp_c','evapTemp','evap_temp','evap']).toString() : 'N/A')}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Condenser Temp:</span>
              <span className="ml-2">{(getInputValue(inputs, ['condenserTemp','cond_temp_c','condTemp','cond_temp','cond']) !== null ? getInputValue(inputs, ['condenserTemp','cond_temp_c','condTemp','cond_temp','cond']).toString() : 'N/A')}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Superheat:</span>
              <span className="ml-2">{(getInputValue(inputs, ['superheat','superheat_c','superheat_celsius']) !== null ? getInputValue(inputs, ['superheat','superheat_c','superheat_celsius']).toString() : 'N/A')}°C</span>
            </div>
            <div>
              <span className="font-medium text-gray-700">Subcooling:</span>
              <span className="ml-2">{(getInputValue(inputs, ['subcooling','subcooling_c','subcool']) !== null ? getInputValue(inputs, ['subcooling','subcooling_c','subcool']).toString() : 'N/A')}°C</span>
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
      if (p) {
        for (const k of propCandidates) {
          if (p[k] !== undefined && p[k] !== null) {
            const n = Number(p[k]);
            if (!Number.isNaN(n)) return n;
            // try parse strings with units
            const parsed = Number(String(p[k]).replace(/[^0-9eE+\-\.]/g, ''));
            if (!Number.isNaN(parsed)) return parsed;
          }
        }
      }

      // Fallback: deep search for an object that looks like a state point with required property
      const queue = [sp];
      const seen = new Set();
      while (queue.length) {
        const cur = queue.shift();
        if (!cur || seen.has(cur)) continue;
        seen.add(cur);
        if (Array.isArray(cur)) {
          if (cur.length >= idx) {
            const candidate = cur[idx - 1];
            if (candidate) {
              for (const k of propCandidates) {
                if (candidate[k] !== undefined && candidate[k] !== null) {
                  const n = Number(candidate[k]);
                  if (!Number.isNaN(n)) return n;
                  const parsed = Number(String(candidate[k]).replace(/[^0-9eE+\-\.]/g, ''));
                  if (!Number.isNaN(parsed)) return parsed;
                }
              }
            }
          }
          for (const item of cur) queue.push(item);
        } else if (typeof cur === 'object') {
          // If object has numeric-like properties, try them
          for (const k of propCandidates) {
            if (cur[k] !== undefined && cur[k] !== null) {
              const n = Number(cur[k]);
              if (!Number.isNaN(n)) return n;
              const parsed = Number(String(cur[k]).replace(/[^0-9eE+\-\.]/g, ''));
              if (!Number.isNaN(parsed)) return parsed;
            }
          }
          // enqueue nested objects
          for (const v of Object.values(cur)) {
            if (v && typeof v === 'object' && !seen.has(v)) queue.push(v);
          }
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
                    <span>{(() => {
                      const val = getStatePointValue(statePoints, 1, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">2 - Compressor Outlet:</span>
                    <span>{(() => {
                      const val = getStatePointValue(statePoints, 2, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">3 - Expansion Valve Inlet:</span>
                    <span>{(() => {
                      const val = getStatePointValue(statePoints, 3, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <span className="font-medium">4 - Evaporator Inlet:</span>
                    <span>{(() => {
                      const q = getStatePointValue(statePoints, 4, ["vapor_quality","quality","x"]);
                      return q !== null ? `Quality: ${q.toFixed(3)}` : "Quality: N/A";
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
        // Use deepPick to search multiple potential roots (results, results.data, etc.)
        const deepPick = (paths: string[][]) => {
          const bases = [results, results?.data, results?.data?.data, results?.cascade, results?.data?.cascade];
          for (const base of bases) {
            const val = pick(base, paths as any);
            if (val !== undefined) return val;
          }
          return undefined;
        };

        // Try to compute overall COP if missing by using lt/ht perf values (searching multiple roots)
        const maybeOverall = readNumber([deepPick([["overall_performance", "cop"], ["overallCOP"], ["overall_performance", "COP"]])]);
        const ltPerf = deepPick([["lt_cycle_performance"], ["lt_cycle", "performance"], ["lt_cycle"], ["lt_cycle_performance", "performance"], ["lt_cycle_state_points"], ["lt_state_points"], ["lt_cycle_points"]]) || {};
        const htPerf = deepPick([["ht_cycle_performance"], ["ht_cycle", "performance"], ["ht_cycle"], ["ht_cycle_performance", "performance"], ["ht_cycle_state_points"], ["ht_state_points"], ["ht_cycle_points"]]) || {};

        // Read primary values
        let ltWork = readNumber([deepPick([["lt_cycle_performance", "work_of_compression_kj_kg"], ["lt_cycle_performance", "work_input_kj_kg"], ["lt_cycle", "work_of_compression_kj_kg"], ["lt_cycle", "work_input_kj_kg"], ["lt_cycle", "work_kj_kg"]])]);
        let htWork = readNumber([deepPick([["ht_cycle_performance", "work_of_compression_kj_kg"], ["ht_cycle_performance", "work_input_kj_kg"], ["ht_cycle", "work_of_compression_kj_kg"], ["ht_cycle", "work_input_kj_kg"], ["ht_cycle", "work_kj_kg"]])]);
        const ltRe = readNumber([deepPick([["lt_cycle_performance", "refrigeration_effect_kj_kg"], ["lt_cycle_performance", "refrigeration_effect"], ["lt_cycle", "refrigeration_effect_kj_kg"], ["lt_cycle", "refrigeration_effect"]])]) || 0;
        const htRe = readNumber([deepPick([["ht_cycle_performance", "refrigeration_effect_kj_kg"], ["ht_cycle_performance", "refrigeration_effect"], ["ht_cycle", "refrigeration_effect_kj_kg"], ["ht_cycle", "refrigeration_effect"]])]) || 0;

        // If work is missing but COP and refrigeration effect exist, infer work = RE / COP
        if ((!ltWork || ltWork === 0) && ltRe) {
          const ltCopVal = readNumber([deepPick([["lt_cycle_performance", "cop"], ["lt_cycle", "cop"], ["lt_cycle_performance", "COP"], ["lt_cycle", "COP"]])]);
          if (ltCopVal && ltCopVal !== 0) {
            ltWork = ltRe / ltCopVal;
          }
        }
        if ((!htWork || htWork === 0) && htRe) {
          const htCopVal = readNumber([deepPick([["ht_cycle_performance", "cop"], ["ht_cycle", "cop"], ["ht_cycle_performance", "COP"], ["ht_cycle", "COP"]])]);
          if (htCopVal && htCopVal !== 0) {
            htWork = htRe / htCopVal;
          }
        }

        ltWork = ltWork || 0;
        htWork = htWork || 0;

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
                      const val = getStatePointValue(deepPick([["lt_cycle"], ["lt_cycle", "state_points"], ["lt_cycle", "points"], ["lt_cycle", "statePoints"], ["lt_cycle_state_points"], ["lt_cycle_points"], ["lt_state_points"]]) || deepPick([["lt_cycle"],["lt_cycle"]]), 1, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">2 - Compressor Outlet:</span>
                    <div>{(() => {
                      const val = getStatePointValue(deepPick([["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || deepPick([["lt_cycle"],["lt_cycle"]]), 2, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">3 - Expansion Valve Inlet:</span>
                    <div>{(() => {
                      const val = getStatePointValue(deepPick([["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || deepPick([["lt_cycle"],["lt_cycle"]]), 3, ["temperature","temp_c","t","temp","temperature_c"]);
                      return val !== null ? `${val.toFixed(1)}°C` : "N/A";
                    })()}</div>
                  </div>

                  <div>
                    <span className="font-medium">4 - Evaporator Inlet:</span>
                    <div>{(() => {
                      const q = getStatePointValue(deepPick([["lt_cycle"],["lt_cycle","state_points"],["lt_cycle","points"]]) || deepPick([["lt_cycle"],["lt_cycle"]]), 4, ["vapor_quality","quality","x"]);
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
