import React, { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api";
import { Footer } from "@/components/Footer";
import { ApiServiceStatus } from "@/components/ApiServiceStatus";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  BarChart3,
  Eye,
  FileText,
  AlertTriangle,
  Trash2,
  Trophy,
  Calculator,
  Info,
} from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { SaveCalculation } from "@/components/SaveCalculation";
import { EnhancedRefrigerantSelector } from "@/components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "@/components/CycleVisualization";
import {
  validateCycleConditions,
  getRefrigerantById,
  REFRIGERANT_DATABASE,
} from "@/lib/refrigerants";
import { consumeCalculationPreset } from "@/lib/historyPresets";

interface ComparisonFormData {
  refrigerants: string[];
  evaporatorTemp: number;
  condenserTemp: number;
  superheat: number;
  subcooling: number;
}

const DEFAULT_COMPARISON_FORM: ComparisonFormData = {
  refrigerants: [],
  evaporatorTemp: -10,
  condenserTemp: 40,
  superheat: 5,
  subcooling: 5,
};

interface RefrigerantResult {
  refrigerant: string;
  cop: number;
  refrigerationEffect: number;
  workInput: number;
  heatRejection: number;
  volumetricCapacity: number;
  dischargePressure: number;
  suctionPressure: number;
  point_1?: any;
  point_2?: any;
  point_3?: any;
  point_4?: any;
  performance?: any;
}

interface ComparisonResult {
  results: RefrigerantResult[];
}

const performanceMetrics = [
  { key: "cop", label: "COP", unit: "", higherIsBetter: true },
  {
    key: "refrigerationEffect",
    label: "Refrigeration Effect",
    unit: "kJ/kg",
    higherIsBetter: true,
  },
  {
    key: "workInput",
    label: "Work Input",
    unit: "kJ/kg",
    higherIsBetter: false,
  },
  {
    key: "heatRejection",
    label: "Heat Rejection",
    unit: "kJ/kg",
    higherIsBetter: false,
  },
  {
    key: "volumetricCapacity",
    label: "Volumetric Capacity",
    unit: "kJ/m³",
    higherIsBetter: true,
  },
  {
    key: "dischargePressure",
    label: "Discharge Pressure",
    unit: "kPa",
    higherIsBetter: false,
  },
  {
    key: "suctionPressure",
    label: "Suction Pressure",
    unit: "kPa",
    higherIsBetter: true,
  },
];

// Content component for use within Dashboard tabs (no header)
export function RefrigerantComparisonContent() {
  const [formData, setFormData] = useState<ComparisonFormData>({
    ...DEFAULT_COMPARISON_FORM,
  });

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const { saveCalculation } = useSupabaseCalculations();
  const [error, setError] = useState<string | null>(null);
  const [calculationData, setCalculationData] = useState<{
    inputs: any;
    results: any;
  } | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<{
    [key: string]: string[];
  }>({});
  const [pendingPreset, setPendingPreset] = useState<ComparisonFormData | null>(
    null,
  );
  const [
    selectedRefrigerantForVisualization,
    setSelectedRefrigerantForVisualization,
  ] = useState<string | null>(null);
  const { addToast } = useToast();

  useEffect(() => {
    const preset = consumeCalculationPreset();
    if (preset?.type !== "Refrigerant Comparison" || !preset.inputs) {
      return;
    }

    try {
      const rawInputs = preset.inputs as Partial<ComparisonFormData>;
      const normalizedInputs: ComparisonFormData = {
        refrigerants: Array.isArray(rawInputs.refrigerants)
          ? [...rawInputs.refrigerants]
          : [],
        evaporatorTemp:
          typeof rawInputs.evaporatorTemp === "number"
            ? rawInputs.evaporatorTemp
            : DEFAULT_COMPARISON_FORM.evaporatorTemp,
        condenserTemp:
          typeof rawInputs.condenserTemp === "number"
            ? rawInputs.condenserTemp
            : DEFAULT_COMPARISON_FORM.condenserTemp,
        superheat:
          typeof rawInputs.superheat === "number"
            ? rawInputs.superheat
            : DEFAULT_COMPARISON_FORM.superheat,
        subcooling:
          typeof rawInputs.subcooling === "number"
            ? rawInputs.subcooling
            : DEFAULT_COMPARISON_FORM.subcooling,
      };

      setFormData(normalizedInputs);
      setPendingPreset(normalizedInputs);
      setSelectedRefrigerantForVisualization(
        normalizedInputs.refrigerants[0] || null,
      );

      const warningsRecord: { [key: string]: string[] } = {};
      normalizedInputs.refrigerants.forEach((refId) => {
        const refProps = getRefrigerantById(refId);
        if (!refProps) return;
        const warnings = validateCycleConditions(refProps, {
          evaporatorTemp: normalizedInputs.evaporatorTemp,
          condenserTemp: normalizedInputs.condenserTemp,
          superheat: normalizedInputs.superheat,
          subcooling: normalizedInputs.subcooling,
        });
        if (warnings.length > 0) {
          warningsRecord[refId] = warnings;
        }
      });
      setValidationWarnings(warningsRecord);
    } catch (error) {
      console.warn("Failed to apply preset for refrigerant comparison", error);
    }
  }, []);

  const handleInputChange = useCallback(
    (field: keyof Omit<ComparisonFormData, "refrigerants">, value: number) => {
      setFormData((prev) => ({
        ...prev,
        [field]: Number(value) || 0,
      }));

      // Update validation warnings for all selected refrigerants
      const newWarnings: { [key: string]: string[] } = {};
      formData.refrigerants.forEach((refId) => {
        const refProps = getRefrigerantById(refId);
        if (refProps) {
          const warnings = validateCycleConditions(refProps, {
            evaporatorTemp:
              field === "evaporatorTemp" ? value : formData.evaporatorTemp,
            condenserTemp:
              field === "condenserTemp" ? value : formData.condenserTemp,
            superheat: field === "superheat" ? value : formData.superheat,
            subcooling: field === "subcooling" ? value : formData.subcooling,
          });
          if (warnings.length > 0) {
            newWarnings[refId] = warnings;
          }
        }
      });
      setValidationWarnings(newWarnings);
    },
    [formData],
  );

  const handleRefrigerantToggle = useCallback(
    (refrigerant: string, checked: boolean) => {
      setFormData((prev) => {
        const newRefrigerants = checked
          ? [...prev.refrigerants, refrigerant]
          : prev.refrigerants.filter((r) => r !== refrigerant);

        // Update validation warnings
        if (checked) {
          const refProps = getRefrigerantById(refrigerant);
          if (refProps) {
            const warnings = validateCycleConditions(refProps, {
              evaporatorTemp: prev.evaporatorTemp,
              condenserTemp: prev.condenserTemp,
              superheat: prev.superheat,
              subcooling: prev.subcooling,
            });
            if (warnings.length > 0) {
              setValidationWarnings((current) => ({
                ...current,
                [refrigerant]: warnings,
              }));
            }
          }
        } else {
          setValidationWarnings((current) => {
            const updated = { ...current };
            delete updated[refrigerant];
            return updated;
          });
        }

        return {
          ...prev,
          refrigerants: newRefrigerants,
        };
      });
    },
    [],
  );

  const handleClearSelections = useCallback(() => {
    setFormData((prev) => ({
      ...prev,
      refrigerants: [],
    }));
    setValidationWarnings({});
    setSelectedRefrigerantForVisualization(null);
  }, []);

  const handleCompare = async () => {
    if (formData.refrigerants.length === 0) {
      const errorMsg = "Please select at least one refrigerant";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Missing Selection",
        description: errorMsg,
      });
      return;
    }

    if (formData.refrigerants.length < 2) {
      const errorMsg = "Please select at least 2 refrigerants for comparison";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Insufficient Selection",
        description: errorMsg,
      });
      return;
    }

    if (formData.evaporatorTemp >= formData.condenserTemp) {
      const errorMsg =
        "Evaporator temperature must be lower than condenser temperature";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Invalid Parameters",
        description: errorMsg,
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

      // Handle different response structures from the API
      const resultData = data.data || data;

      // Ensure we have a results array
      let processedResult;
      if (Array.isArray(resultData)) {
        // If resultData is directly an array of results
        processedResult = { results: resultData };
      } else if (resultData.results && Array.isArray(resultData.results)) {
        // If resultData has a results property that's an array
        processedResult = resultData;
      } else if (resultData.data && Array.isArray(resultData.data)) {
        // If resultData has a data property that's an array
        processedResult = { results: resultData.data };
      } else {
        // Fallback - assume the whole object is the result structure
        processedResult = resultData;
      }

      setResult(processedResult);
      setSelectedRefrigerantForVisualization(
        processedResult.results[0]?.refrigerant || null,
      );

      // Store data for saving
      setCalculationData({
        inputs: formData,
        results: data,
      });

      // Temporary: store raw API response for debugging
      try {
        // Auto-record the comparison so counts/history reflect every run
        void saveCalculation(
          "Refrigerant Comparison",
          formData,
          data,
          `Refrigerant Comparison - ${new Date().toLocaleString()}`,
          { silent: true },
        ).catch((e) => console.warn("Auto-save failed for comparison:", e));
      } catch (e) {
        console.warn("Auto-save invocation error for comparison:", e);
      }

      addToast({
        type: "success",
        title: "Comparison Complete",
        description: `Successfully compared ${formData.refrigerants.length} refrigerants`,
      });
    } catch (err) {
      const originalMessage =
        err instanceof Error ? err.message : "Comparison failed";
      let errorMessage = originalMessage;

      // Handle specific CoolProp errors
      if (
        originalMessage.includes(
          "Two-phase inputs not supported for pseudo-pure",
        )
      ) {
        errorMessage =
          "CoolProp limitation: Some selected refrigerants are blends and two-phase calculations are not supported. " +
          "Try using pure refrigerants (R134a, R32, R290, R744) or increase superheat/subcooling values.";
      } else if (originalMessage.includes("PropsSI")) {
        errorMessage =
          "CoolProp calculation error: The specified operating conditions may be outside the valid range for some refrigerants. " +
          "Please check your temperature and pressure values.";
      }

      setError(errorMessage);
      addToast({
        type: "error",
        title: "Comparison Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  const parseNumber = (val: any): number | null => {
    if (val === undefined || val === null) return null;
    if (typeof val === "number") return isFinite(val) ? val : null;
    if (typeof val === "string") {
      const cleaned = val.replace(/[,\s]+/g, "").replace(/[a-zA-Z%]+/g, "");
      const n = Number(cleaned);
      return isNaN(n) ? null : n;
    }
    return null;
  };

  const getStatePointValue = (
    result: any,
    pathNames: string[],
  ): number | null => {
    if (!result) return null;

    const containers = [
      "point_1",
      "point_2",
      "point_3",
      "point_4",
      "point1",
      "point2",
      "point3",
      "point4",
      "points",
      "state_points",
      "statePoints",
      "state_points_array",
    ];

    for (const containerName of containers) {
      const container = result[containerName];
      if (!container) continue;

      let candidates: any[] = [];
      if (Array.isArray(container)) candidates = container;
      else if (typeof container === "object") {
        // If object has numeric keys or point_1 keys, use ordered values
        const keys = Object.keys(container);
        const numericKeys = keys
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => Number(a) - Number(b));
        if (numericKeys.length >= 1) {
          candidates = numericKeys.map((k) => container[k]);
        } else {
          // fallback to object values
          candidates = Object.values(container);
        }
      }

      for (const c of candidates) {
        if (!c || typeof c !== "object") continue;
        for (const key of pathNames) {
          if (c[key] !== undefined && c[key] !== null) {
            const parsed = parseNumber(c[key]);
            if (parsed !== null) return parsed;
          }
        }
        // Some responses nest properties under 'properties' or 'state'
        const nested = c.properties || c.state || c.values || null;
        if (nested && typeof nested === "object") {
          for (const key of pathNames) {
            if (nested[key] !== undefined && nested[key] !== null) {
              const parsed = parseNumber(nested[key]);
              if (parsed !== null) return parsed;
            }
          }
        }
      }
    }

    return null;
  };

  useEffect(() => {
    if (!pendingPreset) {
      return;
    }

    void handleCompare();
    setPendingPreset(null);
  }, [handleCompare, pendingPreset]);

  const getNumericValue = (result: any, metricKey: string): number | null => {
    if (result?.error) {
      return null;
    }
    // Try direct property
    let v = parseNumber(result[metricKey]);
    // Try common variants
    const perf = result.performance || result.perf || result.results || {};

    if (v === null) {
      switch (metricKey) {
        case "cop":
          v = parseNumber(result.cop) ?? parseNumber(perf.cop);
          break;
        case "refrigerationEffect":
          v =
            parseNumber(result.refrigerationEffect) ??
            parseNumber(perf.refrigeration_effect_kj_kg) ??
            parseNumber(perf.refrigeration_effect) ??
            parseNumber(perf.refrigeration_capacity_kw) ??
            parseNumber(perf.refrigeration_capacity) ??
            null;
          break;
        case "workInput":
          v =
            parseNumber(result.workInput) ??
            parseNumber(perf.work_of_compression_kj_kg) ??
            parseNumber(perf.work_input) ??
            parseNumber(perf.compressor_work_kw) ??
            parseNumber(perf.compressor_work) ??
            null;
          break;
        case "heatRejection":
          // Q_cond = Q_evap + W_comp
          {
            const qEvap =
              parseNumber(perf.refrigeration_effect_kj_kg) ??
              parseNumber(perf.refrigeration_effect) ??
              parseNumber(perf.cooling_capacity_kw) ??
              parseNumber(perf.cooling_capacity) ??
              null;
            const wComp =
              parseNumber(perf.work_of_compression_kj_kg) ??
              parseNumber(perf.work_input) ??
              parseNumber(perf.compressor_work_kw) ??
              parseNumber(perf.compressor_work) ??
              null;
            if (qEvap !== null || wComp !== null) {
              v = (qEvap || 0) + (wComp || 0);
            }
          }
          break;
        case "volumetricCapacity":
          v =
            parseNumber(result.volumetricCapacity) ??
            parseNumber(perf.volumetric_capacity) ??
            parseNumber(perf.volumetricCapacity) ??
            parseNumber(perf.volumetric_capacity_kj_m3) ??
            // attempt to compute from refrigeration effect * density
            ((): number | null => {
              const refEffect = getNumericValue(result, "refrigerationEffect");
              // Try to obtain density via multiple approaches
              let density = getStatePointValue(result, [
                "density_kg_m3",
                "density",
                "rho",
                "rho_kg_m3",
              ]);

              // If density not found, try to compute from specific volume (1 / v)
              if (density === null) {
                const specVol = getStatePointValue(result, [
                  "specific_volume",
                  "specific_volume_m3_kg",
                  "v",
                  "specificVolume",
                ]);
                if (specVol !== null && specVol !== 0) {
                  density = specVol ? 1 / specVol : null;
                }
              }

              if (density === null) {
                // try performance-level density
                density =
                  parseNumber(perf.density_kg_m3) ?? parseNumber(perf.density);
              }

              if (refEffect !== null && density !== null)
                return refEffect * density;
              return null;
            })();
          break;
        case "dischargePressure":
          v =
            parseNumber(result.dischargePressure) ??
            parseNumber(perf.discharge_pressure) ??
            parseNumber(perf.dischargePressure) ??
            parseNumber(perf.discharge_pressure_kpa) ??
            // try state point pressures (compressor outlet is often point 2 or 3)
            getStatePointValue(result, [
              "pressure_kpa",
              "pressure",
              "P_kPa",
              "P",
            ]);
          break;
        case "suctionPressure":
          v =
            parseNumber(result.suctionPressure) ??
            parseNumber(perf.suction_pressure) ??
            parseNumber(perf.suctionPressure) ??
            parseNumber(perf.suction_pressure_kpa) ??
            // try state point pressures (evaporator outlet is often point 1)
            getStatePointValue(result, [
              "pressure_kpa",
              "pressure",
              "P_kPa",
              "P",
            ]);
          break;
        default:
          v = parseNumber(result[metricKey]) ?? parseNumber(perf[metricKey]);
      }
    }

    return v;
  };

  const getRefrigerantError = (result: any) => {
    const err = result.error;
    if (!err) return null;
    if (typeof err === 'string' && err.includes("critical temperature")) {
      return {
        title: "Critical Temp Exceeded",
        description: "Condenser temperature is above the critical point (31°C).",
        tip: "Try Condenser Temp < 30°C",
      };
    }
    return {
      title: "Calculation Failed",
      description: "The solver could not converge for these inputs.",
      tip: "Check input values",
    };
  };

  const getValueForMetric = (result: RefrigerantResult, metricKey: string) => {
    // If this refrigerant had a calculation error on the backend, show detailed error info
    if ((result as any).error) {
      const errorInfo = getRefrigerantError(result);
      if (metricKey === "cop") return errorInfo?.title || "Error";
      return "Error";
    }

    const num = getNumericValue(result as any, metricKey);
    if (num === null) return "N/A";
    return metricKey === "cop" ? num.toFixed(3) : num.toFixed(1);
  };

  const getBestValueIndex = (metricKey: string) => {
    if (!result?.results?.length) return -1;

    const metric = performanceMetrics.find((m) => m.key === metricKey);
    if (!metric) return -1;

    const numericValues = result.results
      .map((r) => getNumericValue(r as any, metricKey))
      .filter((v) => v !== null) as number[];

    if (numericValues.length === 0) return -1;

    const bestValue = metric.higherIsBetter
      ? Math.max(...numericValues)
      : Math.min(...numericValues);

    return result.results.findIndex((r) => {
      const value = getNumericValue(r as any, metricKey);
      return value === bestValue;
    });
  };

  const getVisualizationData = (refrigerantResult: RefrigerantResult) => {
    // Preferred: explicit point_1..point_4
    if (
      refrigerantResult.point_1 &&
      refrigerantResult.point_2 &&
      refrigerantResult.point_3 &&
      refrigerantResult.point_4
    ) {
      return {
        points: [
          {
            ...refrigerantResult.point_1,
            label: "Evaporator Outlet",
            description: "Superheated vapor",
          },
          {
            ...refrigerantResult.point_2,
            label: "Compressor Outlet",
            description: "High pressure vapor",
          },
          {
            ...refrigerantResult.point_3,
            label: "Condenser Outlet",
            description: "Subcooled liquid",
          },
          {
            ...refrigerantResult.point_4,
            label: "Expansion Valve Outlet",
            description: "Low pressure mixture",
          },
        ],
        refrigerant: refrigerantResult.refrigerant,
        cycleType: "standard" as const,
      };
    }

    // Fallback: look for state_points / points array / statePoints
    const sources = [
      (refrigerantResult as any).state_points,
      (refrigerantResult as any).statePoints,
      (refrigerantResult as any).points,
      (refrigerantResult as any).point_array,
    ];

    for (const src of sources) {
      if (!src) continue;
      let arr: any[] = [];
      if (Array.isArray(src)) arr = src;
      else if (typeof src === "object") {
        const keys = Object.keys(src);
        const numericKeys = keys
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => Number(a) - Number(b));
        if (numericKeys.length >= 1) {
          arr = numericKeys.map((k) => src[k]);
        } else arr = Object.values(src);
      }

      if (arr.length >= 4) {
        // Map first 4 to the expected labels and sanitize numeric fields
        const toNumeric = (v: any): number | null => {
          if (v === undefined || v === null) return null;
          const cleaned = String(v).trim();
          if (cleaned === "") return null;
          // remove common non-numeric chars but allow exponentials and signs
          const n = Number(cleaned.replace(/[^0-9eE+\-\.]/g, ""));
          return Number.isFinite(n) ? n : null;
        };

        const pickFirstNumeric = (p: any, candidates: string[]) => {
          for (const k of candidates) {
            if (p[k] !== undefined && p[k] !== null) {
              const val = toNumeric(p[k]);
              if (val !== null) return val;
            }
          }
          return null;
        };

        const sanitizePoint = (p: any, i: number) => {
          const tempKeys = [
            "temperature",
            "temperature_c",
            "temp_c",
            "t",
            "tempC",
          ];
          const presKeys = [
            "pressure",
            "pressure_kpa",
            "p",
            "press_kpa",
            "pressure_kpa",
          ];
          const enthKeys = ["enthalpy", "enthalpy_kj_kg", "h", "h_kj_kg"];
          const entrKeys = ["entropy", "entropy_kj_kgk", "entropy_kj_kg", "s"];
          const svKeys = [
            "specific_volume",
            "specificVolume",
            "specific_volume_m3_kg",
            "v",
            "specificVolume_m3_kg",
          ];
          const qualityKeys = ["quality", "vapor_quality", "vaporQuality", "x"];

          const sanitized = {
            ...p,
            id: p.id !== undefined ? String(p.id) : String(i + 1),
            label:
              i === 0
                ? "Evaporator Outlet"
                : i === 1
                  ? "Compressor Outlet"
                  : i === 2
                    ? "Condenser Outlet"
                    : "Expansion Valve Outlet",
            temperature: pickFirstNumeric(p, tempKeys),
            pressure: pickFirstNumeric(p, presKeys),
            enthalpy: pickFirstNumeric(p, enthKeys),
            entropy: pickFirstNumeric(p, entrKeys),
            specificVolume: pickFirstNumeric(p, svKeys),
            quality: pickFirstNumeric(p, qualityKeys),
          };

          return sanitized;
        };

        const pts = arr
          .slice(0, 4)
          .map((p: any, i: number) => sanitizePoint(p, i));

        return {
          points: pts,
          refrigerant: refrigerantResult.refrigerant,
          cycleType: "standard" as const,
        };
      }
    }

    return null;
  };

  const getTotalWarnings = () => {
    return Object.values(validationWarnings).reduce(
      (total, warnings) => total + warnings.length,
      0,
    );
  };

  const selectedCount = formData.refrigerants.length;
  const hasSelections = selectedCount > 0;

  return (
    <div className="min-h-screen bg-background text-foreground animate-in fade-in duration-500 pb-20">
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">

        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-green-500 to-emerald-600 bg-clip-text text-transparent">
              Refrigerant Comparison
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Analyze and benchmark different working fluids
            </p>
          </div>
          <div className="flex items-center gap-2">
            {calculationData && (
              <SaveCalculation
                calculationType="Refrigerant Comparison"
                inputs={calculationData.inputs}
                results={calculationData.results}
                disabled={loading}
              />
            )}
            <ApiServiceStatus />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">

          {/* LEFT SIDEBAR: CONFIGURATION */}
          <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">
            <Card className="border-t-4 border-t-green-500 shadow-lg dark:bg-slate-900/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-green-500" />
                  Configuration
                </CardTitle>
                <CardDescription>
                  Select refrigerants and operating conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">

                {/* 1. Refrigerant Selection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Refrigerants (Select up to 4)</Label>
                    {hasSelections && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleClearSelections}
                        className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto p-2 border rounded-md bg-muted/20">
                    {REFRIGERANT_DATABASE.map((refrigerant) => {
                      const warnings = validationWarnings[refrigerant.id] || [];
                      const hasWarnings = warnings.length > 0;
                      const isCriticalError = warnings.some(w => w.includes("critical temperature"));

                      return (
                        <div
                          key={refrigerant.id}
                          className={`flex flex-col p-2 rounded-lg transition-all ${hasWarnings
                            ? 'bg-amber-50 dark:bg-amber-900/10 border border-amber-200/50 col-span-2'
                            : 'hover:bg-muted/50'
                            }`}
                        >
                          <div className="flex items-start space-x-2">
                            <Checkbox
                              id={refrigerant.id}
                              checked={formData.refrigerants.includes(refrigerant.id)}
                              onCheckedChange={(checked) => handleRefrigerantToggle(refrigerant.id, checked as boolean)}
                            />
                            <div className="grid gap-0.5 w-full">
                              <div className="flex justify-between items-center w-full">
                                <label
                                  htmlFor={refrigerant.id}
                                  className="text-sm font-medium leading-none cursor-pointer"
                                >
                                  {refrigerant.name}
                                </label>
                                <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground border-transparent bg-muted/50">
                                  {refrigerant.safety_class}
                                </Badge>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                GWP: {refrigerant.gwp}
                              </span>

                              {/* Proactive Selection Advice */}
                              {hasWarnings && (
                                <div className="mt-2 animate-in slide-in-from-top-1 fade-in duration-200">
                                  {warnings.map((w, idx) => (
                                    <div key={idx} className="flex gap-2 items-start text-[11px] text-amber-700 dark:text-amber-400 leading-tight bg-amber-100/50 dark:bg-amber-900/20 p-2 rounded mb-1">
                                      <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                                      <div className="flex-1">
                                        <p>{w}</p>
                                        {isCriticalError && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-6 mt-1.5 w-full text-[10px] border-amber-300 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-900/40 text-amber-800 dark:text-amber-300"
                                            onClick={(e) => {
                                              e.preventDefault();
                                              handleInputChange("condenserTemp", 30);
                                            }}
                                          >
                                            Optimize Inputs (Set 30°C)
                                          </Button>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formData.refrigerants.length} selected.
                  </div>
                </div>

                <Separator />

                {/* 2. Temperatures */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sky-600 dark:text-sky-400">Evaporator (°C)</Label>
                    <Input
                      type="number"
                      value={formData.evaporatorTemp}
                      onChange={(e) =>
                        handleInputChange("evaporatorTemp", parseFloat(e.target.value))
                      }
                      className="bg-background/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-rose-600 dark:text-rose-400">Condenser (°C)</Label>
                    <Input
                      type="number"
                      value={formData.condenserTemp}
                      onChange={(e) =>
                        handleInputChange("condenserTemp", parseFloat(e.target.value))
                      }
                      className="bg-background/50"
                    />
                  </div>
                </div>

                {/* 3. SH / SC */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Superheat (K)</Label>
                    <Input
                      type="number"
                      value={formData.superheat}
                      onChange={(e) =>
                        handleInputChange("superheat", parseFloat(e.target.value))
                      }
                      min={0}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subcooling (K)</Label>
                    <Input
                      type="number"
                      value={formData.subcooling}
                      onChange={(e) =>
                        handleInputChange("subcooling", parseFloat(e.target.value))
                      }
                      min={0}
                    />
                  </div>
                </div>

                {getTotalWarnings() > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-900/10">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-xs text-amber-800 dark:text-amber-400">
                      Some selected refrigerants have validation warnings for these conditions.
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <Button
                  className="w-full h-12 text-lg font-semibold shadow-lg shadow-green-500/10 hover:shadow-green-500/20 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  onClick={handleCompare}
                  disabled={loading || !hasSelections}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Comparing...
                    </>
                  ) : (
                    <>
                      <BarChart3 className="mr-2 h-5 w-5" />
                      Run Comparison
                    </>
                  )}
                </Button>

              </CardContent>
            </Card>
          </div>

          {/* RIGHT MAIN: RESULTS */}
          <div className="xl:col-span-8 space-y-6">
            {!result || !result.results || result.results.length === 0 ? (
              <div className="min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed rounded-xl bg-muted/20 text-muted-foreground p-8 text-center">
                <div className="p-6 bg-background rounded-full shadow-lg mb-6">
                  <BarChart3 className="h-12 w-12 text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Ready to Compare</h3>
                <p className="max-w-md">
                  Select multiple refrigerants from the list and define your operating conditions to see a side-by-side performance analysis.
                </p>
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-6">

                {/* Tabs for different views */}
                <Tabs defaultValue="comparison" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 mb-6">
                    <TabsTrigger
                      value="comparison"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" /> Comparison Table
                    </TabsTrigger>
                    <TabsTrigger
                      value="visualization"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Cycle Visualization
                    </TabsTrigger>
                    <TabsTrigger
                      value="details"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> Cards View
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="comparison" className="mt-0">
                    <Card className="border-none shadow-md bg-card/50 dark:bg-slate-900/50 backdrop-blur">
                      <CardHeader>
                        <CardTitle>Performance Metrics</CardTitle>
                        <CardDescription>Highlighted cells indicate best performance in category</CardDescription>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b bg-muted/30">
                                <th className="text-left p-4 font-semibold text-muted-foreground">Metric</th>
                                {result.results.map((r, i) => (
                                  <th key={i} className="text-center p-4 font-semibold text-foreground">
                                    {r.refrigerant}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {performanceMetrics.map((metric) => {
                                const bestIndex = getBestValueIndex(metric.key);
                                return (
                                  <tr key={metric.key} className="border-b last:border-0 hover:bg-muted/10 transition-colors">
                                    <td className="p-4 font-medium text-muted-foreground">
                                      {metric.label} {metric.unit && <span className="text-xs opacity-70">({metric.unit})</span>}
                                    </td>
                                    {result.results.map((r, i) => {
                                      const val = getValueForMetric(r, metric.key);
                                      const isBest = i === bestIndex && !(r as any).error && val !== "N/A";

                                      // Get error info with potential fix types
                                      const errorInfo = (r as any).error ? (() => {
                                        const err = (r as any).error;
                                        if (typeof err === 'string' && err.includes("critical temperature")) {
                                          return {
                                            title: "Transcritical Limit",
                                            description: "R-744 (CO₂) cannot operate in a standard cycle above 31°C.",
                                            fixType: "CRITICAL_TEMP",
                                            fixLabel: "Auto-set to 30°C",
                                          };
                                        }
                                        return {
                                          title: "Calculation Error",
                                          description: "The solver could not converge for these inputs.",
                                          fixType: null,
                                        };
                                      })() : null;

                                      return (
                                        <td key={i} className={`p-4 text-center ${isBest ? "bg-green-500/10 dark:bg-green-500/20" : ""}`}>
                                          <div className="flex flex-col items-center justify-center h-full relative group/error-cell">
                                            {errorInfo ? (
                                              metric.key === "cop" ? (
                                                <>
                                                  {/* Seamless Status Badge */}
                                                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 cursor-help transition-all hover:bg-orange-500/20 hover:scale-105">
                                                    <AlertTriangle className="h-3.5 w-3.5" />
                                                    <span className="text-xs font-medium">Limit Reached</span>
                                                  </div>

                                                  {/* Interactive Smart Tooltip - Bridged for hover seamlessness */}
                                                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 hidden group-hover/error-cell:block w-72 z-50 animate-in fade-in slide-in-from-top-1 duration-200">
                                                    <div className="h-2 w-full absolute -top-2 left-0"></div> {/* Invisible bridge */}

                                                    <div className="bg-popover text-popover-foreground rounded-xl shadow-2xl border p-4 text-left backdrop-blur-xl bg-opacity-95">
                                                      <div className="flex gap-3">
                                                        <div className="shrink-0 p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                                                          <AlertTriangle className="h-5 w-5" />
                                                        </div>
                                                        <div className="space-y-1">
                                                          <h4 className="font-semibold text-sm">{errorInfo.title}</h4>
                                                          <p className="text-xs text-muted-foreground leading-relaxed">
                                                            {errorInfo.description}
                                                          </p>
                                                        </div>
                                                      </div>

                                                      {/* Quick Fix Action */}
                                                      {errorInfo.fixType === "CRITICAL_TEMP" && (
                                                        <div className="mt-4 pt-3 border-t flex items-center justify-between gap-2">
                                                          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Suggestion</p>
                                                          <Button
                                                            variant="default"
                                                            size="sm"
                                                            className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-sm"
                                                            onClick={() => handleInputChange("condenserTemp", 30)}
                                                          >
                                                            <div className="mr-1.5 flex items-center justify-center rounded-full bg-white/20 w-4 h-4">
                                                              <Calculator className="h-2.5 w-2.5" />
                                                            </div>
                                                            {errorInfo.fixLabel}
                                                          </Button>
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                </>
                                              ) : (
                                                <span className="text-muted-foreground/20 text-xl font-light">-</span>
                                              )
                                            ) : (
                                              <>
                                                <span className={`font-mono font-semibold text-lg ${isBest ? "text-green-700 dark:text-green-400 scale-110" : "text-foreground"}`}>
                                                  {val}
                                                </span>
                                                {isBest && <Badge variant="outline" className="mt-1 text-[10px] text-green-600 border-green-200 dark:border-green-800 h-5 px-1.5">Best</Badge>}
                                              </>
                                            )}
                                          </div>
                                        </td>
                                      )
                                    })}
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="visualization" className="mt-0">
                    <Card className="border-none dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Pressure-Enthalpy Diagram</CardTitle>
                          <CardDescription>Visualize and overlay cycles</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          {result.results.map((r) => (
                            <Button
                              key={r.refrigerant}
                              variant={selectedRefrigerantForVisualization === r.refrigerant ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedRefrigerantForVisualization(r.refrigerant)}
                            >
                              {r.refrigerant}
                            </Button>
                          ))}
                        </div>
                      </CardHeader>
                      <CardContent>
                        {selectedRefrigerantForVisualization && (() => {
                          const selectedResult = result.results.find(
                            (r) => r.refrigerant === selectedRefrigerantForVisualization,
                          );
                          const vizData = selectedResult ? getVisualizationData(selectedResult) : null;
                          return vizData ? <CycleVisualization cycleData={vizData} /> : <div className="p-8 text-center text-muted-foreground">No diagram available</div>
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="details" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {result.results.map((r, i) => {
                        const refProps = getRefrigerantById(r.refrigerant);
                        return (
                          <Card key={i} className="hover:shadow-lg transition-all dark:bg-slate-900/50">
                            <CardHeader className="pb-3 border-b">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-xl text-primary">{r.refrigerant}</CardTitle>
                                  <CardDescription>
                                    {refProps?.fullName || "Unknown Composition"}
                                  </CardDescription>
                                </div>
                                <Badge variant={refProps?.safety_class === "A1" ? "default" : "destructive"}>
                                  {refProps?.safety_class || "N/A"}
                                </Badge>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-muted/30 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{getValueForMetric(r, "cop")}</div>
                                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">COP</div>
                                </div>
                                <div className="p-3 bg-muted/30 rounded-lg text-center">
                                  <div className="text-2xl font-bold">{getValueForMetric(r, "refrigerationEffect")}</div>
                                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">Ref. Effect</div>
                                </div>
                              </div>
                              {refProps && (
                                <div className="pt-2">
                                  <p className="text-sm font-medium mb-2">Details:</p>
                                  <div className="grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
                                    <span>GWP: <span className="text-foreground">{refProps.gwp}</span></span>
                                    <span>Critical T: <span className="text-foreground">{refProps.limits.critical_temp_c}°C</span></span>
                                    <span>ODP: <span className="text-foreground">{refProps.odp}</span></span>
                                  </div>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  </TabsContent>

                </Tabs>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

// Keep the standalone wrapper for consistent export
export function RefrigerantComparison() {
  return <RefrigerantComparisonContent />;
}
