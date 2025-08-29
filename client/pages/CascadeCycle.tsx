import React, { useState, useCallback } from "react";
import { useToast } from "@/hooks/useToast";
import { apiClient } from "@/lib/api";
import { Header } from "@/components/Header";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  Loader2,
  Calculator,
  Eye,
  FileText,
  Wrench,
  AlertTriangle,
  Thermometer,
  Zap,
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
  point_1?: any;
  point_2?: any;
  point_3?: any;
  point_4?: any;
}

interface CascadeResult {
  overall_performance?: {
    cop: number;
  };
  lt_cycle_performance?: {
    cop: number;
    work_of_compression_kj_kg: number;
    refrigeration_effect_kj_kg: number;
  };
  ht_cycle_performance?: {
    cop: number;
    work_of_compression_kj_kg: number;
    refrigeration_effect_kj_kg: number;
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

// Content component for use within Dashboard tabs (no header)
export function CascadeCycleContent() {
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
  const [calculationData, setCalculationData] = useState<{
    inputs: any;
    results: any;
  } | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<{
    lt: string[];
    ht: string[];
  }>({ lt: [], ht: [] });
  const [selectedVisualizationCycle, setSelectedVisualizationCycle] = useState<
    "lt" | "ht"
  >("lt");
  const { addToast } = useToast();
  const { saveCalculation } = useSupabaseCalculations();

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
          const refProps = getRefrigerantById(cycleData.refrigerant);
          if (refProps) {
            const warnings = validateCycleConditions(refProps, {
              evaporatorTemp: cycleData.evaporatorTemp,
              condenserTemp: cycleData.condenserTemp,
              superheat: cycleData.superheat,
              subcooling: cycleData.subcooling,
            });
            setValidationWarnings((current) => ({
              ...current,
              [cycle === "ltCycle" ? "lt" : "ht"]: warnings,
            }));
          }
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

      // Update validation warnings
      const cycleData = formData[cycle];
      const refProps = getRefrigerantById(refrigerant);
      if (refProps) {
        const warnings = validateCycleConditions(refProps, {
          evaporatorTemp: cycleData.evaporatorTemp,
          condenserTemp: cycleData.condenserTemp,
          superheat: cycleData.superheat,
          subcooling: cycleData.subcooling,
        });
        setValidationWarnings((current) => ({
          ...current,
          [cycle === "ltCycle" ? "lt" : "ht"]: warnings,
        }));
      }
    },
    [formData],
  );

  const handleCascadeDTChange = useCallback((value: number) => {
    setFormData((prev) => ({
      ...prev,
      cascadeHeatExchangerDT: Number(value) || 0,
    }));
  }, []);

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
      setResult(resultData);

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
          { silent: true }
        ).catch((e) => console.warn('Auto-save failed for cascade:', e));
      } catch (e) {
        console.warn('Auto-save invocation error for cascade:', e);
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

  const getVisualizationData = (cycle: "lt" | "ht") => {
    if (!result) return null;

    const cycleData = cycle === "lt" ? result.lt_cycle : result.ht_cycle;
    const refrigerant =
      cycle === "lt"
        ? formData.ltCycle.refrigerant
        : formData.htCycle.refrigerant;

    // Try multiple possible data structures from API
    const points = [
      cycleData?.point_1 || (cycleData as any)?.state_points?.[0] || {},
      cycleData?.point_2 || (cycleData as any)?.state_points?.[1] || {},
      cycleData?.point_3 || (cycleData as any)?.state_points?.[2] || {},
      cycleData?.point_4 || (cycleData as any)?.state_points?.[3] || {},
    ];

    // Check if we have at least some temperature data
    if (
      !points.some(
        (p) => p.temperature_c !== undefined || p.temperature !== undefined,
      )
    ) {
      return null;
    }

    return {
      points: [
        {
          id: "1",
          name: "Evaporator Outlet",
          temperature: points[0].temperature_c || points[0].temperature || 0,
          pressure: points[0].pressure_kpa || points[0].pressure || 0,
          enthalpy: points[0].enthalpy_kj_kg || points[0].enthalpy || 0,
          entropy: points[0].entropy_kj_kg_k || points[0].entropy || 0,
          quality: points[0].quality,
          x: 0,
          y: 0,
        },
        {
          id: "2",
          name: "Compressor Outlet",
          temperature: points[1].temperature_c || points[1].temperature || 0,
          pressure: points[1].pressure_kpa || points[1].pressure || 0,
          enthalpy: points[1].enthalpy_kj_kg || points[1].enthalpy || 0,
          entropy: points[1].entropy_kj_kg_k || points[1].entropy || 0,
          quality: points[1].quality,
          x: 0,
          y: 0,
        },
        {
          id: "3",
          name: "Condenser Outlet",
          temperature: points[2].temperature_c || points[2].temperature || 0,
          pressure: points[2].pressure_kpa || points[2].pressure || 0,
          enthalpy: points[2].enthalpy_kj_kg || points[2].enthalpy || 0,
          entropy: points[2].entropy_kj_kg_k || points[2].entropy || 0,
          quality: points[2].quality,
          x: 0,
          y: 0,
        },
        {
          id: "4",
          name: "Expansion Valve Outlet",
          temperature: points[3].temperature_c || points[3].temperature || 0,
          pressure: points[3].pressure_kpa || points[3].pressure || 0,
          enthalpy: points[3].enthalpy_kj_kg || points[3].enthalpy || 0,
          entropy: points[3].entropy_kj_kg_k || points[3].entropy || 0,
          quality: points[3].quality,
          x: 0,
          y: 0,
        },
      ],
      refrigerant: refrigerant,
      cycleType:
        cycle === "lt" ? ("cascade-low" as const) : ("cascade-high" as const),
    };
  };

  const CycleForm = ({
    title,
    data,
    onChange,
    onRefrigerantChange,
    titleColor,
    cycle,
    warnings,
  }: {
    title: string;
    data: CycleData;
    onChange: (field: keyof CycleData, value: string | number) => void;
    onRefrigerantChange: (refrigerant: string) => void;
    titleColor: string;
    cycle: "ltCycle" | "htCycle";
    warnings: string[];
  }) => (
    <Card className="bg-white shadow-md border-gray-200">
      <CardHeader className={`${titleColor} text-white`}>
        <CardTitle className="text-lg flex items-center justify-between">
          {title}
          {warnings.length > 0 && (
            <AlertTriangle className="h-4 w-4 text-yellow-200" />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <Label>Refrigerant</Label>
          <EnhancedRefrigerantSelector
            value={data.refrigerant}
            onChange={onRefrigerantChange}
          />
          {data.refrigerant && (
            <div className="text-sm text-gray-600">
              {(() => {
                const refProps = getRefrigerantById(data.refrigerant);
                return refProps ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{refProps.safety_class}</Badge>
                    <Badge
                      variant={
                        refProps.coolpropSupport === "full"
                          ? "default"
                          : "secondary"
                      }
                    >
                      {refProps.coolpropSupport}
                    </Badge>
                  </div>
                ) : null;
              })()}
            </div>
          )}
        </div>

        {warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc ml-4">
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>Evaporator Temperature (°C)</Label>
          <Input
            type="number"
            value={data.evaporatorTemp}
            onChange={(e) =>
              onChange("evaporatorTemp", parseFloat(e.target.value))
            }
            className="border-blue-200 focus:border-blue-500"
          />
        </div>

        <div className="space-y-2">
          <Label>Condenser Temperature (°C)</Label>
          <Input
            type="number"
            value={data.condenserTemp}
            onChange={(e) =>
              onChange("condenserTemp", parseFloat(e.target.value))
            }
            className="border-blue-200 focus:border-blue-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Superheat (°C)</Label>
            <Input
              type="number"
              value={data.superheat}
              onChange={(e) =>
                onChange("superheat", parseFloat(e.target.value))
              }
              className="border-blue-200 focus:border-blue-500"
            />
          </div>

          <div className="space-y-2">
            <Label>Subcooling (°C)</Label>
            <Input
              type="number"
              value={data.subcooling}
              onChange={(e) =>
                onChange("subcooling", parseFloat(e.target.value))
              }
              className="border-blue-200 focus:border-blue-500"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Enhanced Cascade Refrigeration System
        </h1>
        <p className="text-gray-600">
          Advanced dual-cycle analysis with real-time visualization and
          equipment simulation
        </p>
      </div>

      <Tabs defaultValue="calculation" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation
          </TabsTrigger>
          <TabsTrigger
            value="visualization"
            className="flex items-center gap-2"
            disabled={!result}
          >
            <Eye className="h-4 w-4" />
            Visualization
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="flex items-center gap-2"
            disabled={!result}
          >
            <FileText className="h-4 w-4" />
            Results
          </TabsTrigger>
          <TabsTrigger
            value="equipment"
            className="flex items-center gap-2"
            disabled={!result}
          >
            <Wrench className="h-4 w-4" />
            Equipment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculation">
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <CycleForm
                title="Low-Temperature Cycle"
                data={formData.ltCycle}
                onChange={(field, value) =>
                  handleCycleInputChange("ltCycle", field, value)
                }
                onRefrigerantChange={(refrigerant) =>
                  handleRefrigerantChange("ltCycle", refrigerant)
                }
                titleColor="bg-gradient-to-r from-cyan-600 to-blue-600"
                cycle="ltCycle"
                warnings={validationWarnings.lt}
              />

              <CycleForm
                title="High-Temperature Cycle"
                data={formData.htCycle}
                onChange={(field, value) =>
                  handleCycleInputChange("htCycle", field, value)
                }
                onRefrigerantChange={(refrigerant) =>
                  handleRefrigerantChange("htCycle", refrigerant)
                }
                titleColor="bg-gradient-to-r from-orange-600 to-red-600"
                cycle="htCycle"
                warnings={validationWarnings.ht}
              />
            </div>

            <Card className="bg-white shadow-lg border-purple-200">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <CardTitle className="text-xl">
                  Cascade System Parameters
                </CardTitle>
                <CardDescription className="text-purple-100">
                  Configure the cascade heat exchanger and system integration
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="max-w-md">
                  <div className="space-y-2">
                    <Label htmlFor="cascadeDT">
                      Cascade Heat Exchanger ΔT (°C)
                    </Label>
                    <Input
                      id="cascadeDT"
                      type="number"
                      value={formData.cascadeHeatExchangerDT}
                      onChange={(e) =>
                        handleCascadeDTChange(parseFloat(e.target.value))
                      }
                      className="border-purple-200 focus:border-purple-500"
                    />
                    <p className="text-sm text-gray-600">
                      Temperature difference between the two cycles in the
                      cascade heat exchanger
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex gap-4">
                  <Button
                    onClick={handleCalculate}
                    disabled={
                      loading ||
                      !formData.ltCycle.refrigerant ||
                      !formData.htCycle.refrigerant
                    }
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Calculating Cascade...
                      </>
                    ) : (
                      <>
                        <Calculator className="mr-2 h-4 w-4" />
                        Calculate Cascade
                      </>
                    )}
                  </Button>

                  {calculationData && (
                    <SaveCalculation
                      calculationType="Cascade Cycle"
                      inputs={calculationData.inputs}
                      results={calculationData.results}
                      disabled={loading}
                    />
                  )}
                </div>

                {error && (
                  <Alert variant="destructive" className="mt-4">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visualization">
          <Card className="bg-white shadow-lg border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
              <CardTitle className="text-xl">
                Cascade Cycle Visualization
              </CardTitle>
              <CardDescription className="text-purple-100">
                P-h diagrams for both low and high temperature cycles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {result ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <Label>Select Cycle for Visualization:</Label>
                    <div className="flex gap-2">
                      <Button
                        variant={
                          selectedVisualizationCycle === "lt"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedVisualizationCycle("lt")}
                        className="flex items-center gap-2"
                      >
                        <Thermometer className="h-4 w-4" />
                        Low Temperature ({formData.ltCycle.refrigerant})
                      </Button>
                      <Button
                        variant={
                          selectedVisualizationCycle === "ht"
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedVisualizationCycle("ht")}
                        className="flex items-center gap-2"
                      >
                        <Zap className="h-4 w-4" />
                        High Temperature ({formData.htCycle.refrigerant})
                      </Button>
                    </div>
                  </div>

                  <div>
                    {(() => {
                      const visualizationData = getVisualizationData(
                        selectedVisualizationCycle,
                      );
                      return visualizationData ? (
                        <CycleVisualization cycleData={visualizationData} />
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          Cycle visualization data not available for{" "}
                          {selectedVisualizationCycle === "lt"
                            ? "Low Temperature"
                            : "High Temperature"}{" "}
                          cycle
                        </div>
                      );
                    })()}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Calculate a cascade cycle to view the P-h diagram
                  visualizations
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          {result && (
            <div className="space-y-6">
              <Card className="bg-white shadow-lg border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="text-xl">
                    Cascade System Performance
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Overall system performance and efficiency metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-center mb-6">
                    <div className="text-4xl font-bold text-green-600 mb-2">
                      {result.overall_performance?.cop?.toFixed(3) || "N/A"}
                    </div>
                    <Badge variant="secondary" className="text-lg px-4 py-2">
                      Overall System COP
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-semibold text-purple-600">
                        {(
                          (result.lt_cycle_performance
                            ?.work_of_compression_kj_kg || 0) +
                          (result.ht_cycle_performance
                            ?.work_of_compression_kj_kg || 0)
                        ).toFixed(1) || "N/A"}{" "}
                        kJ/kg
                      </div>
                      <div className="text-sm text-purple-500 mt-1">
                        Total Work Input
                      </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-semibold text-blue-600">
                        {(
                          ((result.overall_performance?.cop || 0) * 100) /
                          (((result.lt_cycle_performance?.cop || 0) +
                            (result.ht_cycle_performance?.cop || 0)) /
                            2 || 1)
                        ).toFixed(1) || "N/A"}
                        %
                      </div>
                      <div className="text-sm text-blue-500 mt-1">
                        System Efficiency
                      </div>
                    </div>
                    <div className="text-center p-4 bg-indigo-50 rounded-lg">
                      <div className="text-2xl font-semibold text-indigo-600">
                        {formData.ltCycle.condenserTemp.toFixed(1)}°C
                      </div>
                      <div className="text-sm text-indigo-500 mt-1">
                        Cascade Temperature
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-white shadow-md border-cyan-200">
                  <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                    <CardTitle className="text-lg">
                      Low-Temperature Cycle Performance
                    </CardTitle>
                    <CardDescription className="text-cyan-100">
                      {formData.ltCycle.refrigerant} cycle analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">COP:</span>
                        <span className="font-semibold ml-2">
                          {result.lt_cycle_performance?.cop?.toFixed(3) ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Work Input:</span>
                        <span className="font-semibold ml-2">
                          {result.lt_cycle_performance?.work_of_compression_kj_kg?.toFixed(
                            1,
                          ) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          Refrigeration Effect:
                        </span>
                        <span className="font-semibold ml-2">
                          {result.lt_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(
                            1,
                          ) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Heat Rejection:</span>
                        <span className="font-semibold ml-2">
                          {(
                            (result.lt_cycle_performance
                              ?.refrigeration_effect_kj_kg || 0) +
                            (result.lt_cycle_performance
                              ?.work_of_compression_kj_kg || 0)
                          ).toFixed(1) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white shadow-md border-orange-200">
                  <CardHeader className="bg-gradient-to-r from-orange-600 to-red-600 text-white">
                    <CardTitle className="text-lg">
                      High-Temperature Cycle Performance
                    </CardTitle>
                    <CardDescription className="text-orange-100">
                      {formData.htCycle.refrigerant} cycle analysis
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">COP:</span>
                        <span className="font-semibold ml-2">
                          {result.ht_cycle_performance?.cop?.toFixed(3) ||
                            "N/A"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Work Input:</span>
                        <span className="font-semibold ml-2">
                          {result.ht_cycle_performance?.work_of_compression_kj_kg?.toFixed(
                            1,
                          ) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">
                          Refrigeration Effect:
                        </span>
                        <span className="font-semibold ml-2">
                          {result.ht_cycle_performance?.refrigeration_effect_kj_kg?.toFixed(
                            1,
                          ) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Heat Rejection:</span>
                        <span className="font-semibold ml-2">
                          {(
                            (result.ht_cycle_performance
                              ?.refrigeration_effect_kj_kg || 0) +
                            (result.ht_cycle_performance
                              ?.work_of_compression_kj_kg || 0)
                          ).toFixed(1) || "N/A"}{" "}
                          kJ/kg
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="equipment">
          <Card className="bg-white shadow-lg border-purple-200">
            <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
              <CardTitle className="text-xl">
                Cascade Equipment Diagrams
              </CardTitle>
              <CardDescription className="text-purple-100">
                Interactive system components with refrigerant flow
                visualization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {result ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-cyan-600 mb-4">
                        Low Temperature Cycle
                      </h3>
                      {(() => {
                        const ltVisualizationData = getVisualizationData("lt");
                        return ltVisualizationData ? (
                          <EquipmentDiagrams cycleData={ltVisualizationData} />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Equipment data not available for LT cycle
                          </div>
                        );
                      })()}
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-orange-600 mb-4">
                        High Temperature Cycle
                      </h3>
                      {(() => {
                        const htVisualizationData = getVisualizationData("ht");
                        return htVisualizationData ? (
                          <EquipmentDiagrams cycleData={htVisualizationData} />
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Equipment data not available for HT cycle
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  Calculate a cascade cycle to view equipment diagrams
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Standalone page component with header for direct access
export function CascadeCycle() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApiServiceStatus />
        <CascadeCycleContent />
      </div>
    </div>
  );
}
