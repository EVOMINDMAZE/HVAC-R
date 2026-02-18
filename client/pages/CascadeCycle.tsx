import { useState, useCallback, useEffect } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2,
  Calculator,
  Eye,
  FileText,
  Wrench,
  AlertTriangle,
  Thermometer,
  Zap,
  ArrowDownCircle,
  Activity,
} from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { EnhancedRefrigerantSelector } from "@/components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "@/components/CycleVisualization";
import { EquipmentDiagrams } from "@/components/EquipmentDiagrams";
import {
  validateCycleConditions,
  getRefrigerantById,
} from "@/lib/refrigerants";
import { consumeCalculationPreset } from "@/lib/historyPresets";

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

interface CascadeResult {
  overall_performance?: {
    cop: number;
    system_efficiency?: number;
    cascade_temperature?: number;
  };
  lt_cycle_performance?: {
    cop: number;
    work_of_compression_kj_kg: number;
    refrigeration_effect_kj_kg: number;
    pressure_ratio?: number;
    refrigerant?: string;
  };
  ht_cycle_performance?: {
    cop: number;
    work_of_compression_kj_kg: number;
    refrigeration_effect_kj_kg: number;
    pressure_ratio?: number;
    refrigerant?: string;
  };
  lt_cycle?: {
    point_1?: any;
    point_2?: any;
    point_3?: any;
    point_4?: any;
  };
  ht_cycle?: {
    point_1?: any;
    point_2?: any;
    point_3?: any;
    point_4?: any;
  };
}

const DEFAULT_LOW_TEMP_CYCLE: CycleData = {
  refrigerant: "R744",
  evaporatorTemp: -45,
  condenserTemp: -5,
  superheat: 6,
  subcooling: 3,
};

const DEFAULT_HIGH_TEMP_CYCLE: CycleData = {
  refrigerant: "R134a",
  evaporatorTemp: -10,
  condenserTemp: 40,
  superheat: 6,
  subcooling: 4,
};

const DEFAULT_CASCADE_FORM: CascadeFormData = {
  ltCycle: DEFAULT_LOW_TEMP_CYCLE,
  htCycle: DEFAULT_HIGH_TEMP_CYCLE,
  cascadeHeatExchangerDT: 5,
};

const RECOMMENDED_GUIDANCE = {
  superheat: { min: 4, max: 12 },
  subcooling: { min: 3, max: 8 },
  cascadeDeltaT: { min: 3, max: 8 },
} as const;

const buildCycleWarnings = (cycleData: CycleData): string[] => {
  const refProps = getRefrigerantById(cycleData.refrigerant);
  if (!refProps) return [];
  return validateCycleConditions(refProps, {
    evaporatorTemp: cycleData.evaporatorTemp,
    condenserTemp: cycleData.condenserTemp,
    superheat: cycleData.superheat,
    subcooling: cycleData.subcooling,
  });
};

// Content component for use within Dashboard tabs (no header)
export function CascadeCycleContent() {
  const [formData, setFormData] = useState<CascadeFormData>(() => ({
    ltCycle: { ...DEFAULT_LOW_TEMP_CYCLE },
    htCycle: { ...DEFAULT_HIGH_TEMP_CYCLE },
    cascadeHeatExchangerDT: DEFAULT_CASCADE_FORM.cascadeHeatExchangerDT,
  }));

  const [result, setResult] = useState<CascadeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationData, setCalculationData] = useState<{
    inputs: any;
    results: any;
  } | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<{
    lt: string[];
    ht: string[];
  }>(() => ({
    lt: buildCycleWarnings(DEFAULT_LOW_TEMP_CYCLE),
    ht: buildCycleWarnings(DEFAULT_HIGH_TEMP_CYCLE),
  }));
  const [selectedVisualizationCycle, setSelectedVisualizationCycle] = useState<
    "lt" | "ht"
  >("lt");
  const [pendingPreset, setPendingPreset] = useState<CascadeFormData | null>(
    null,
  );
  const { addToast } = useToast();
  const { saveCalculation } = useSupabaseCalculations();

  useEffect(() => {
    const preset = consumeCalculationPreset();
    if (preset?.type !== "Cascade Cycle" || !preset.inputs) {
      return;
    }

    try {
      const rawInputs = preset.inputs as Partial<CascadeFormData>;
      const normalizeCycle = (
        fallback: CycleData,
        incoming?: Partial<CycleData>,
      ): CycleData => ({
        refrigerant:
          typeof incoming?.refrigerant === "string" && incoming.refrigerant
            ? incoming.refrigerant
            : fallback.refrigerant,
        evaporatorTemp:
          typeof incoming?.evaporatorTemp === "number"
            ? incoming.evaporatorTemp
            : fallback.evaporatorTemp,
        condenserTemp:
          typeof incoming?.condenserTemp === "number"
            ? incoming.condenserTemp
            : fallback.condenserTemp,
        superheat:
          typeof incoming?.superheat === "number"
            ? incoming.superheat
            : fallback.superheat,
        subcooling:
          typeof incoming?.subcooling === "number"
            ? incoming.subcooling
            : fallback.subcooling,
      });

      const normalizedLt = normalizeCycle(
        DEFAULT_LOW_TEMP_CYCLE,
        rawInputs.ltCycle,
      );
      const normalizedHt = normalizeCycle(
        DEFAULT_HIGH_TEMP_CYCLE,
        rawInputs.htCycle,
      );

      const normalized: CascadeFormData = {
        ltCycle: normalizedLt,
        htCycle: normalizedHt,
        cascadeHeatExchangerDT:
          typeof rawInputs.cascadeHeatExchangerDT === "number"
            ? rawInputs.cascadeHeatExchangerDT
            : DEFAULT_CASCADE_FORM.cascadeHeatExchangerDT,
      };

      setFormData(normalized);
      setValidationWarnings({
        lt: buildCycleWarnings(normalized.ltCycle),
        ht: buildCycleWarnings(normalized.htCycle),
      });
      setSelectedVisualizationCycle("lt");
      setPendingPreset(normalized);
    } catch (error) {
      console.warn("Failed to apply preset for cascade cycle", error);
    }
  }, []);

  const handleCycleInputChange = useCallback(
    (
      cycle: "ltCycle" | "htCycle",
      field: keyof CycleData,
      value: string | number,
    ) => {
      setFormData((prev) => {
        const updatedData = {
          ...prev,
          [cycle]: {
            ...prev[cycle],
            [field]: field === "refrigerant" ? value : Number(value) || 0,
          },
        };

        // Update validation warnings for the changed cycle
        if (field !== "refrigerant") {
          const cycleData = updatedData[cycle];
          const warnings = buildCycleWarnings(cycleData);
          setValidationWarnings((current) => ({
            ...current,
            [cycle === "ltCycle" ? "lt" : "ht"]: warnings,
          }));
        }

        return updatedData;
      });
    },
    [],
  );

  const handleRefrigerantChange = useCallback(
    (cycle: "ltCycle" | "htCycle", refrigerant: string) => {
      setFormData((prev) => ({
        ...prev,
        [cycle]: {
          ...prev[cycle],
          refrigerant,
        },
      }));

      const targetCycle = {
        ...formData[cycle],
        refrigerant,
      } as CycleData;

      const warnings = buildCycleWarnings(targetCycle);
      setValidationWarnings((current) => ({
        ...current,
        [cycle === "ltCycle" ? "lt" : "ht"]: warnings,
      }));
    },
    [formData],
  );

  const handleCascadeDTChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      cascadeHeatExchangerDT: Number(value) || 0,
    }));
  }, []);

  const handleApplyDefaults = useCallback(() => {
    const ltDefaults = { ...DEFAULT_LOW_TEMP_CYCLE };
    const htDefaults = { ...DEFAULT_HIGH_TEMP_CYCLE };

    setFormData({
      ltCycle: ltDefaults,
      htCycle: htDefaults,
      cascadeHeatExchangerDT: DEFAULT_CASCADE_FORM.cascadeHeatExchangerDT,
    });

    setValidationWarnings({
      lt: buildCycleWarnings(ltDefaults),
      ht: buildCycleWarnings(htDefaults),
    });

    addToast({
      type: "info",
      title: "Recommended settings applied",
      description:
        "We've loaded common R744/R134a cascade parameters to get you started.",
    });
  }, [addToast]);

  const handleCalculate = async () => {
    if (!formData.ltCycle.refrigerant || !formData.htCycle.refrigerant) {
      const errorMsg = "Please select refrigerants for both cycles";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Missing Information",
        description: errorMsg,
      });
      return;
    }

    if (formData.ltCycle.evaporatorTemp >= formData.ltCycle.condenserTemp) {
      const errorMsg =
        "LT cycle: Evaporator temperature must be lower than condenser temperature";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Invalid LT Cycle Parameters",
        description: errorMsg,
      });
      return;
    }

    if (formData.htCycle.evaporatorTemp >= formData.htCycle.condenserTemp) {
      const errorMsg =
        "HT cycle: Evaporator temperature must be lower than condenser temperature";
      setError(errorMsg);
      addToast({
        type: "warning",
        title: "Invalid HT Cycle Parameters",
        description: errorMsg,
      });
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Call external calculation API
      const data = await apiClient.calculateCascadeCycle(formData);

      if (data.error) {
        throw new Error(data.error);
      }

      // Handle different response structures from the API
      const resultData = data.data || data;

      // Robust performance calculation with fallbacks and numeric coercion
      const asNum = (v: any) => (typeof v === "number" ? v : Number(v)) || 0;

      const ltWork = asNum(
        resultData.lt_cycle_performance?.work_of_compression_kj_kg ??
          resultData.lt_cycle?.performance?.work_of_compression_kj_kg ??
          resultData.lt_cycle?.work_of_compression_kj_kg ??
          (resultData.performance as any)?.lt_cycle_work_of_compression_kj_kg,
      );
      const htWork = asNum(
        resultData.ht_cycle_performance?.work_of_compression_kj_kg ??
          resultData.ht_cycle?.performance?.work_of_compression_kj_kg ??
          resultData.ht_cycle?.work_of_compression_kj_kg ??
          (resultData.performance as any)?.ht_cycle_work_of_compression_kj_kg,
      );

      const ltRefrigerationEffect = asNum(
        resultData.lt_cycle_performance?.refrigeration_effect_kj_kg ??
          resultData.lt_cycle?.performance?.refrigeration_effect_kj_kg ??
          resultData.lt_cycle?.refrigeration_effect_kj_kg ??
          (resultData.performance as any)?.lt_cycle_refrigeration_effect_kj_kg,
      );
      const htRefrigerationEffect = asNum(
        resultData.ht_cycle_performance?.refrigeration_effect_kj_kg ??
          resultData.ht_cycle?.performance?.refrigeration_effect_kj_kg ??
          resultData.ht_cycle?.refrigeration_effect_kj_kg ??
          (resultData.performance as any)?.ht_cycle_refrigeration_effect_kj_kg,
      );

      const totalWork = ltWork + htWork;
      const totalRefrigerationEffect =
        ltRefrigerationEffect + htRefrigerationEffect;

      const ltCop = asNum(
        resultData.lt_cycle_performance?.cop ??
          resultData.lt_cycle?.performance?.cop ??
          resultData.lt_cycle?.cop ??
          (resultData.performance as any)?.lt_cycle_cop,
      );
      const htCop = asNum(
        resultData.ht_cycle_performance?.cop ??
          resultData.ht_cycle?.performance?.cop ??
          resultData.ht_cycle?.cop ??
          (resultData.performance as any)?.ht_cycle_cop,
      );
      const avgCop = (ltCop + htCop) / 2;

      const overallCop =
        totalWork > 0 ? totalRefrigerationEffect / totalWork : 0;
      const systemEfficiency =
        avgCop > 0 ? Math.min(100, (overallCop / avgCop) * 100) : 0;

      const processedResult: CascadeResult = {
        overall_performance: {
          cop: overallCop,
          system_efficiency: systemEfficiency,
          cascade_temperature: formData.ltCycle.condenserTemp,
        },
        lt_cycle_performance: {
          cop:
            resultData.lt_cycle_performance?.cop ??
            resultData.lt_cycle?.performance?.cop ??
            resultData.lt_cycle?.cop ??
            resultData.performance?.lt_cycle_cop,
          work_of_compression_kj_kg:
            resultData.lt_cycle_performance?.work_of_compression_kj_kg ??
            resultData.lt_cycle?.performance?.work_of_compression_kj_kg ??
            resultData.lt_cycle?.work_of_compression_kj_kg ??
            resultData.performance?.lt_cycle_work_of_compression_kj_kg,
          refrigeration_effect_kj_kg:
            resultData.lt_cycle_performance?.refrigeration_effect_kj_kg ??
            resultData.lt_cycle?.performance?.refrigeration_effect_kj_kg ??
            resultData.lt_cycle?.refrigeration_effect_kj_kg ??
            resultData.performance?.lt_cycle_refrigeration_effect_kj_kg,
        },
        ht_cycle_performance: {
          cop:
            resultData.ht_cycle_performance?.cop ??
            resultData.ht_cycle?.performance?.cop ??
            resultData.ht_cycle?.cop ??
            resultData.performance?.ht_cycle_cop,
          work_of_compression_kj_kg:
            resultData.ht_cycle_performance?.work_of_compression_kj_kg ??
            resultData.ht_cycle?.performance?.work_of_compression_kj_kg ??
            resultData.ht_cycle?.work_of_compression_kj_kg ??
            resultData.performance?.ht_cycle_work_of_compression_kj_kg,
          refrigeration_effect_kj_kg:
            resultData.ht_cycle_performance?.refrigeration_effect_kj_kg ??
            resultData.ht_cycle?.performance?.refrigeration_effect_kj_kg ??
            resultData.ht_cycle?.refrigeration_effect_kj_kg ??
            resultData.performance?.ht_cycle_refrigeration_effect_kj_kg,
        },
        lt_cycle: resultData.lt_cycle,
        ht_cycle: resultData.ht_cycle,
      };

      setResult(processedResult);

      // Store data for saving
      setCalculationData({
        inputs: formData,
        results: data,
      });

      try {
        // Auto-record the cascade calculation so counts/history reflect every run
        void saveCalculation(
          "Cascade Cycle",
          formData,
          data,
          `Cascade Cycle - ${new Date().toLocaleString()}`,
          { silent: true },
        ).catch((e) => console.warn("Auto-save failed for cascade:", e));
      } catch (e) {
        console.warn("Auto-save invocation error for cascade:", e);
      }

      addToast({
        type: "success",
        title: "Cascade Analysis Complete",
        description: `${formData.ltCycle.refrigerant}/${formData.htCycle.refrigerant} cascade system analysis completed`,
      });
    } catch (err) {
      const originalMessage =
        err instanceof Error ? err.message : "Calculation failed";
      let errorMessage = originalMessage;

      // Handle specific CoolProp errors
      if (
        originalMessage.includes(
          "Two-phase inputs not supported for pseudo-pure",
        )
      ) {
        errorMessage =
          "CoolProp limitation: One or both refrigerants are blends and two-phase calculations are not supported. " +
          "Try increasing superheat and subcooling values, or use pure refrigerants like R134a, R32, or R290.";
      } else if (originalMessage.includes("PropsSI")) {
        errorMessage =
          "CoolProp calculation error: The specified operating conditions may be outside the valid range. " +
          "Please check your temperature and pressure values for both cycles.";
      }

      setError(errorMessage);
      addToast({
        type: "error",
        title: "Cascade Analysis Failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!pendingPreset) {
      return;
    }

    void handleCalculate();
    setPendingPreset(null);
  }, [handleCalculate, pendingPreset]);

  const getVisualizationData = (cycle: "lt" | "ht") => {
    if (!result) return null;

    const extractPointData = (point: any, key: string) => {
      const keys = [
        `${key}_c`,
        `${key}_kpa`,
        `${key}_kj_kg`,
        `${key}_kj_kgk`,
        key,
      ];

      for (const k of keys) {
        if (point[k] !== undefined) return point[k];
      }
      return 0;
    };

    const cycleData = cycle === "lt" ? result.lt_cycle : result.ht_cycle;
    const refrigerant =
      cycle === "lt"
        ? formData.ltCycle.refrigerant
        : formData.htCycle.refrigerant;

    // Prefer state_points if available, otherwise fallback to point_1, point_2, etc.
    const statePoints = (cycleData as any)?.state_points || cycleData;
    const points = [
      statePoints["1"] || statePoints["point_1"] || {},
      statePoints["2"] || statePoints["point_2"] || {},
      statePoints["3"] || statePoints["point_3"] || {},
      statePoints["4"] || statePoints["point_4"] || {},
    ];

    // Check if we have at least some temperature data
    if (
      !points.some(
        (p) => p.temperature_c !== undefined || p.temperature !== undefined,
      )
    ) {
      return null;
    }

    // Detailed point mapping with comprehensive data extraction
    const pointNames = [
      "Evaporator Outlet",
      "Compressor Outlet",
      "Condenser Outlet",
      "Expansion Valve Outlet",
    ] as const;
    const mappedPoints = points.map((point, index) => ({
      id: `${index + 1}`,
      name: pointNames[index] ?? `Point ${index + 1}`,
      temperature: extractPointData(point, "temperature") ?? 0,
      pressure: extractPointData(point, "pressure") ?? 0,
      enthalpy: extractPointData(point, "enthalpy") ?? 0,
      entropy: extractPointData(point, "entropy") ?? 0,
      quality: point.vapor_quality ?? point.quality,
      x: 0,
      y: 0,
    }));

    // Include saturation dome data if available
    const saturationDome = (cycleData as any)?.saturation_dome || {};

    return {
      points: mappedPoints,
      refrigerant: refrigerant,
      cycleType: (cycle === "lt" ? "cascade-low" : "cascade-high") as
        | "cascade-low"
        | "cascade-high",
      saturationDome: {
        ph_diagram: saturationDome.ph_diagram,
        ts_diagram: saturationDome.ts_diagram,
        tv_diagram: saturationDome.tv_diagram,
      },
    };
  };



  return (
    <div className="min-h-screen bg-slate-950 text-foreground animate-in fade-in duration-500 pb-20 selection:bg-cyan-500/30">
      <div className="container mx-auto px-4 py-8 max-w-[1600px]">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-mono tracking-tight bg-gradient-to-r from-cyan-600 to-slate-600 bg-clip-text text-transparent">
              Enhanced Cascade System
            </h1>
            <p className="text-muted-foreground mt-1 text-lg">
              Advanced dual-cycle analysis for ultra-low temperature
              applications
            </p>
          </div>
          <div className="flex items-center gap-2">
            {calculationData && (
              <SaveCalculation
                calculationType="Cascade Cycle"
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
            <Card className="border-t-4 border-t-slate-500 shadow-lg dark:bg-slate-900/50 backdrop-blur-sm max-h-[calc(100vh-8rem)] overflow-y-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-slate-500" />
                  System Configuration
                </CardTitle>
                <CardDescription>
                  Define parameters for Low & High stages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* LOW STAGE */}
                <div className="space-y-4 border rounded-lg p-4 bg-cyan-50/20 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/30">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-semibold mb-2">
                    <Thermometer className="w-4 h-4" /> Low Temperature Cycle
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">
                      Refrigerant
                    </Label>
                    <EnhancedRefrigerantSelector
                      value={formData.ltCycle.refrigerant}
                      onChange={(val) =>
                        handleRefrigerantChange("ltCycle", val)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Evap Temp (°C)</Label>
                      <Input
                        type="number"
                        value={formData.ltCycle.evaporatorTemp}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "ltCycle",
                            "evaporatorTemp",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cond Temp (°C)</Label>
                      <Input
                        type="number"
                        value={formData.ltCycle.condenserTemp}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "ltCycle",
                            "condenserTemp",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Superheat (K)</Label>
                      <Input
                        type="number"
                        value={formData.ltCycle.superheat}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "ltCycle",
                            "superheat",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subcooling (K)</Label>
                      <Input
                        type="number"
                        value={formData.ltCycle.subcooling}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "ltCycle",
                            "subcooling",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                  {validationWarnings.lt.length > 0 && (
                    <Alert variant="destructive" className="py-2 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="ml-2">
                        {validationWarnings.lt[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                {/* CASCADE INTERFACE */}
                <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-dashed border-gray-300 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4" /> Cascade Heat
                      Exchanger
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-600 dark:text-slate-400">
                    Interstage ΔT (°C)
                  </Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      value={formData.cascadeHeatExchangerDT}
                      onChange={(e) =>
                        handleCascadeDTChange(parseFloat(e.target.value))
                      }
                      className="border-slate-200 dark:border-slate-900 focus:border-slate-500"
                    />
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      (Rec: {RECOMMENDED_GUIDANCE.cascadeDeltaT.min}-
                      {RECOMMENDED_GUIDANCE.cascadeDeltaT.max}°C)
                    </span>
                  </div>
                </div>

                {/* HIGH STAGE */}
                <div className="space-y-4 border rounded-lg p-4 bg-cyan-50/20 dark:bg-cyan-900/10 border-cyan-100 dark:border-cyan-800/30">
                  <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-400 font-semibold mb-2">
                    <Zap className="w-4 h-4" /> High Temperature Cycle
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground font-bold">
                      Refrigerant
                    </Label>
                    <EnhancedRefrigerantSelector
                      value={formData.htCycle.refrigerant}
                      onChange={(val) =>
                        handleRefrigerantChange("htCycle", val)
                      }
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">Evap Temp (°C)</Label>
                      <Input
                        type="number"
                        value={formData.htCycle.evaporatorTemp}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "htCycle",
                            "evaporatorTemp",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Cond Temp (°C)</Label>
                      <Input
                        type="number"
                        value={formData.htCycle.condenserTemp}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "htCycle",
                            "condenserTemp",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Superheat (K)</Label>
                      <Input
                        type="number"
                        value={formData.htCycle.superheat}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "htCycle",
                            "superheat",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Subcooling (K)</Label>
                      <Input
                        type="number"
                        value={formData.htCycle.subcooling}
                        onChange={(e) =>
                          handleCycleInputChange(
                            "htCycle",
                            "subcooling",
                            parseFloat(e.target.value),
                          )
                        }
                        className="h-8"
                      />
                    </div>
                  </div>
                  {validationWarnings.ht.length > 0 && (
                    <Alert variant="destructive" className="py-2 text-xs">
                      <AlertTriangle className="h-3 w-3" />
                      <AlertDescription className="ml-2">
                        {validationWarnings.ht[0]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="pt-2 gap-2 flex flex-col">
                  <Button
                    className="w-full h-12 text-lg font-semibold shadow-lg shadow-slate-500/10 hover:shadow-slate-500/20 bg-gradient-to-r from-cyan-600 to-slate-600 hover:from-cyan-700 hover:to-slate-700"
                    onClick={handleCalculate}
                    disabled={
                      loading ||
                      !formData.ltCycle.refrigerant ||
                      !formData.htCycle.refrigerant
                    }
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Solving System...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-5 w-5" />
                        Run Analysis
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleApplyDefaults}
                    className="text-xs text-muted-foreground hover:text-primary"
                  >
                    Reset to Defaults
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT MAIN: RESULTS */}
          <div className="xl:col-span-8 space-y-6">
            {!result ? (
              <div className="min-h-[600px] flex flex-col items-center justify-center border-4 border-dashed rounded-xl bg-muted/20 text-muted-foreground p-8 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="p-6 bg-slate-950 rounded-full shadow-lg mb-6">
                  <Activity className="h-12 w-12 text-slate-500" />
                </div>
                <h3 className="text-2xl font-bold font-mono mb-2">Ready to Simulate</h3>
                <p className="max-w-md">
                  Configure the Low and High temperature cycles to analyze the
                  performance of the complete cascade refrigeration system.
                </p>
              </div>
            ) : (
              <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-6">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-950/30 dark:to-emerald-900/10 border-green-200 dark:border-green-800">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-green-700 dark:text-green-400 uppercase tracking-wider">
                        System COP
                      </span>
                      <span className="text-4xl font-bold text-green-800 dark:text-green-300 mt-2">
                        {result.overall_performance?.cop?.toFixed(2) ?? "N/A"}
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-slate-50 to-cyan-100 dark:from-slate-950/30 dark:to-cyan-900/10 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        Efficiency
                      </span>
                      <span className="text-4xl font-bold text-slate-800 dark:text-slate-300 mt-2">
                        {result.overall_performance?.system_efficiency?.toFixed(
                          1,
                        ) ?? "N/A"}
                        %
                      </span>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-slate-50 to-violet-100 dark:from-slate-950/30 dark:to-violet-900/10 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">
                        Total Work
                      </span>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className="text-4xl font-bold text-slate-800 dark:text-slate-300">
                          {(
                            (result.lt_cycle_performance
                              ?.work_of_compression_kj_kg || 0) +
                            (result.ht_cycle_performance
                              ?.work_of_compression_kj_kg || 0)
                          ).toFixed(1)}
                        </span>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          kJ/kg
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6 mb-6">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" /> System Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="visualization"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <Eye className="w-4 h-4" /> Cycle Diagrams
                    </TabsTrigger>
                    <TabsTrigger
                      value="equipment"
                      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all flex items-center gap-2"
                    >
                      <Wrench className="w-4 h-4" /> Equipment
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* LT Result Card */}
                      <Card className="border-l-4 border-l-cyan-500 overflow-hidden dark:bg-slate-900/40">
                        <div className="bg-cyan-500/10 p-4 border-b border-cyan-100 dark:border-cyan-800/20 flex justify-between items-center">
                          <h3 className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                            <Thermometer className="w-4 h-4" /> Low Temp Cycle (
                            {result.lt_cycle_performance?.refrigerant})
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-cyan-200 text-cyan-700"
                          >
                            Evap: {formData.ltCycle.evaporatorTemp}°C
                          </Badge>
                        </div>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-2 divide-x divide-y dark:divide-slate-800">
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.lt_cycle_performance?.cop?.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                COP
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.lt_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(
                                  1,
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Ref. Effect (kJ/kg)
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.lt_cycle_performance?.work_of_compression_kj_kg?.toFixed(
                                  1,
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Work Input (kJ/kg)
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.lt_cycle_performance?.pressure_ratio?.toFixed(
                                  2,
                                ) ?? "-"}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Compression Ratio
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* HT Result Card */}
                      <Card className="border-l-4 border-l-cyan-500 overflow-hidden dark:bg-slate-900/40">
                        <div className="bg-cyan-500/10 p-4 border-b border-cyan-100 dark:border-cyan-800/20 flex justify-between items-center">
                          <h3 className="font-bold text-cyan-700 dark:text-cyan-400 flex items-center gap-2">
                            <Zap className="w-4 h-4" /> High Temp Cycle (
                            {result.ht_cycle_performance?.refrigerant})
                          </h3>
                          <Badge
                            variant="outline"
                            className="border-cyan-200 text-cyan-700"
                          >
                            Evap: {formData.htCycle.evaporatorTemp}°C
                          </Badge>
                        </div>
                        <CardContent className="p-0">
                          <div className="grid grid-cols-2 divide-x divide-y dark:divide-slate-800">
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.ht_cycle_performance?.cop?.toFixed(2)}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                COP
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.ht_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(
                                  1,
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Ref. Effect (kJ/kg)
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.ht_cycle_performance?.work_of_compression_kj_kg?.toFixed(
                                  1,
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Work Input (kJ/kg)
                              </div>
                            </div>
                            <div className="p-4 text-center">
                              <div className="text-2xl font-bold text-slate-700 dark:text-slate-200">
                                {result.ht_cycle_performance?.pressure_ratio?.toFixed(
                                  2,
                                ) ?? "-"}
                              </div>
                              <div className="text-xs text-muted-foreground uppercase">
                                Compression Ratio
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="visualization" className="mt-0">
                    <Card className="dark:bg-slate-900">
                      <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                          <CardTitle>Pressure-Enthalpy Diagrams</CardTitle>
                          <CardDescription>
                            Visualize the thermodynamic cycle for each stage
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={
                              selectedVisualizationCycle === "lt"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setSelectedVisualizationCycle("lt")}
                            className={
                              selectedVisualizationCycle === "lt"
                                ? "bg-cyan-600 hover:bg-cyan-700"
                                : ""
                            }
                          >
                            Low Temp ({formData.ltCycle.refrigerant})
                          </Button>
                          <Button
                            variant={
                              selectedVisualizationCycle === "ht"
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() => setSelectedVisualizationCycle("ht")}
                            className={
                              selectedVisualizationCycle === "ht"
                                ? "bg-cyan-600 hover:bg-cyan-700"
                                : ""
                            }
                          >
                            High Temp ({formData.htCycle.refrigerant})
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const vizData = getVisualizationData(
                            selectedVisualizationCycle,
                          );
                          return vizData ? (
                            <CycleVisualization cycleData={vizData} />
                          ) : (
                            <div className="p-12 text-center text-muted-foreground">
                              Visualization Data Unavailable
                            </div>
                          );
                        })()}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="equipment" className="mt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Low Temp Column */}
                      <div>
                        {(() => {
                          const ltData = getVisualizationData("lt");
                          return ltData ? (
                            <EquipmentDiagrams
                              cycleData={ltData}
                              isAnimating={!loading}
                            />
                          ) : (
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                              Low Temp Data Unavailable
                            </div>
                          );
                        })()}
                      </div>

                      {/* High Temp Column */}
                      <div>
                        {(() => {
                          const htData = getVisualizationData("ht");
                          return htData ? (
                            <EquipmentDiagrams
                              cycleData={htData}
                              isAnimating={!loading}
                            />
                          ) : (
                            <div className="h-64 flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-muted-foreground bg-slate-50 dark:bg-slate-900/50">
                              High Temp Data Unavailable
                            </div>
                          );
                        })()}
                      </div>
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

// Standalone wrapper
export function CascadeCycle() {
  return <CascadeCycleContent />;
}
