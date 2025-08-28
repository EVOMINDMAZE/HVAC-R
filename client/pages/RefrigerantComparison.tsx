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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, BarChart3, Eye, FileText, AlertTriangle } from "lucide-react";
import { useSupabaseCalculations } from "@/hooks/useSupabaseCalculations";
import { SaveCalculation } from "@/components/SaveCalculation";
import { EnhancedRefrigerantSelector } from "@/components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "@/components/CycleVisualization";
import {
  validateCycleConditions,
  getRefrigerantById,
  REFRIGERANT_DATABASE,
} from "@/lib/refrigerants";

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
    refrigerants: [],
    evaporatorTemp: -10,
    condenserTemp: 40,
    superheat: 5,
    subcooling: 5,
  });

  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [calculationData, setCalculationData] = useState<{
    inputs: any;
    results: any;
  } | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<{
    [key: string]: string[];
  }>({});
  const [
    selectedRefrigerantForVisualization,
    setSelectedRefrigerantForVisualization,
  ] = useState<string | null>(null);
  const { addToast } = useToast();

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

  const getValueForMetric = (result: RefrigerantResult, metricKey: string) => {
    // Handle different API response structures
    let value = (result as any)[metricKey];

    // If not found directly, try performance nested object
    if (value === undefined && (result as any).performance) {
      const perf = (result as any).performance;
      switch (metricKey) {
        case "cop":
          value = perf.cop;
          break;
        case "refrigerationEffect":
          value = perf.refrigeration_effect_kj_kg || perf.refrigeration_effect;
          break;
        case "workInput":
          value = perf.work_of_compression_kj_kg || perf.work_input;
          break;
        case "heatRejection":
          const refEffect =
            perf.refrigeration_effect_kj_kg || perf.refrigeration_effect || 0;
          const workInput =
            perf.work_of_compression_kj_kg || perf.work_input || 0;
          value = refEffect + workInput;
          break;
        case "volumetricCapacity":
          value = perf.volumetric_capacity || perf.volumetricCapacity;
          break;
        case "dischargePressure":
          value = perf.discharge_pressure || perf.dischargePressure;
          break;
        case "suctionPressure":
          value = perf.suction_pressure || perf.suctionPressure;
          break;
      }
    }

    return typeof value === "number"
      ? value.toFixed(metricKey === "cop" ? 3 : 1)
      : "N/A";
  };

  const getBestValueIndex = (metricKey: string) => {
    if (!result?.results?.length) return -1;

    const metric = performanceMetrics.find((m) => m.key === metricKey);
    if (!metric) return -1;

    const values = result.results
      .map((r) => {
        // Handle different API response structures
        const value =
          (r as any)[metricKey] || (r as any).performance?.[metricKey];
        return typeof value === "number" ? value : null;
      })
      .filter((v) => v !== null);

    if (values.length === 0) return -1;

    const bestValue = metric.higherIsBetter
      ? Math.max(...values)
      : Math.min(...values);

    return result.results.findIndex((r) => {
      const value =
        (r as any)[metricKey] || (r as any).performance?.[metricKey];
      return value === bestValue;
    });
  };

  const getVisualizationData = (refrigerantResult: RefrigerantResult) => {
    if (
      !refrigerantResult.point_1 ||
      !refrigerantResult.point_2 ||
      !refrigerantResult.point_3 ||
      !refrigerantResult.point_4
    ) {
      return null;
    }

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
  };

  const getTotalWarnings = () => {
    return Object.values(validationWarnings).reduce(
      (total, warnings) => total + warnings.length,
      0,
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-white shadow-lg border-blue-200">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <CardTitle className="text-xl">
            Enhanced Refrigerant Comparison
          </CardTitle>
          <CardDescription className="text-blue-100">
            Compare multiple refrigerants with advanced visualization and
            CoolProp validation
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-6">
            <div>
              <Label className="text-base font-semibold mb-4 block">
                Select Refrigerants to Compare
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {REFRIGERANT_DATABASE.map((refrigerant) => {
                  const hasWarnings =
                    validationWarnings[refrigerant.id]?.length > 0;
                  return (
                    <div
                      key={refrigerant.id}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={refrigerant.id}
                        checked={formData.refrigerants.includes(refrigerant.id)}
                        onCheckedChange={(checked) =>
                          handleRefrigerantToggle(
                            refrigerant.id,
                            checked as boolean,
                          )
                        }
                      />
                      <Label
                        htmlFor={refrigerant.id}
                        className="text-sm cursor-pointer flex items-center gap-2"
                      >
                        {refrigerant.name}
                        {hasWarnings && (
                          <AlertTriangle className="h-3 w-3 text-amber-500" />
                        )}
                        <Badge
                          variant="outline"
                          className={`text-xs ${
                            refrigerant.coolpropSupport === "full"
                              ? "bg-green-50 text-green-700"
                              : refrigerant.coolpropSupport === "limited"
                                ? "bg-yellow-50 text-yellow-700"
                                : "bg-red-50 text-red-700"
                          }`}
                        >
                          {refrigerant.coolpropSupport}
                        </Badge>
                      </Label>
                    </div>
                  );
                })}
              </div>
            </div>

            {getTotalWarnings() > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>
                    Operating Condition Warnings for selected refrigerants:
                  </strong>
                  {Object.entries(validationWarnings).map(
                    ([refId, warnings]) => (
                      <div key={refId} className="mt-2">
                        <strong>{getRefrigerantById(refId)?.name}:</strong>
                        <ul className="ml-4 list-disc">
                          {warnings.map((warning, index) => (
                            <li key={index}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    ),
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label htmlFor="evaporatorTemp">
                  Evaporator Temperature (°C)
                </Label>
                <Input
                  id="evaporatorTemp"
                  type="number"
                  value={formData.evaporatorTemp}
                  onChange={(e) =>
                    handleInputChange(
                      "evaporatorTemp",
                      parseFloat(e.target.value),
                    )
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="condenserTemp">
                  Condenser Temperature (°C)
                </Label>
                <Input
                  id="condenserTemp"
                  type="number"
                  value={formData.condenserTemp}
                  onChange={(e) =>
                    handleInputChange(
                      "condenserTemp",
                      parseFloat(e.target.value),
                    )
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="superheat">Superheat (°C)</Label>
                <Input
                  id="superheat"
                  type="number"
                  value={formData.superheat}
                  onChange={(e) =>
                    handleInputChange("superheat", parseFloat(e.target.value))
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subcooling">Subcooling (°C)</Label>
                <Input
                  id="subcooling"
                  type="number"
                  value={formData.subcooling}
                  onChange={(e) =>
                    handleInputChange("subcooling", parseFloat(e.target.value))
                  }
                  className="border-blue-200 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <Button
                onClick={handleCompare}
                disabled={loading || formData.refrigerants.length === 0}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Comparing...
                  </>
                ) : (
                  <>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Compare
                  </>
                )}
              </Button>

              {calculationData && (
                <SaveCalculation
                  calculationType="Refrigerant Comparison"
                  inputs={calculationData.inputs}
                  results={calculationData.results}
                  disabled={loading}
                />
              )}
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {result &&
        result.results &&
        Array.isArray(result.results) &&
        result.results.length > 0 && (
          <Tabs defaultValue="comparison" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="comparison"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                Comparison Table
              </TabsTrigger>
              <TabsTrigger
                value="visualization"
                className="flex items-center gap-2"
              >
                <Eye className="h-4 w-4" />
                Cycle Visualization
              </TabsTrigger>
              <TabsTrigger value="details" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Detailed Results
              </TabsTrigger>
            </TabsList>

            <TabsContent value="comparison">
              <Card className="bg-white shadow-lg border-green-200">
                <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                  <CardTitle className="text-xl">
                    Performance Comparison
                  </CardTitle>
                  <CardDescription className="text-green-100">
                    Side-by-side comparison of key performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b-2 border-gray-200">
                          <th className="text-left p-3 font-semibold text-gray-700 bg-gray-50">
                            Performance Metric
                          </th>
                          {result.results.map((refrigerantResult, index) => (
                            <th
                              key={refrigerantResult.refrigerant || index}
                              className="text-center p-3 font-semibold text-blue-600 bg-blue-50"
                            >
                              {refrigerantResult.refrigerant ||
                                `Refrigerant ${index + 1}`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {performanceMetrics.map((metric) => {
                          const bestIndex = getBestValueIndex(metric.key);
                          return (
                            <tr
                              key={metric.key}
                              className="border-b border-gray-100 hover:bg-gray-50"
                            >
                              <td className="p-3 font-medium text-gray-700 bg-gray-50">
                                {metric.label}
                                {metric.unit && (
                                  <span className="text-sm text-gray-500 ml-1">
                                    ({metric.unit})
                                  </span>
                                )}
                              </td>
                              {result.results.map(
                                (refrigerantResult, index) => (
                                  <td
                                    key={refrigerantResult.refrigerant || index}
                                    className={`p-3 text-center ${
                                      index === bestIndex
                                        ? "bg-green-100 text-green-800 font-semibold"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {getValueForMetric(
                                      refrigerantResult,
                                      metric.key,
                                    )}
                                  </td>
                                ),
                              )}
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
            </TabsContent>

            <TabsContent value="visualization">
              <Card className="bg-white shadow-lg border-purple-200">
                <CardHeader className="bg-gradient-to-r from-purple-600 to-violet-600 text-white">
                  <CardTitle className="text-xl">Cycle Visualization</CardTitle>
                  <CardDescription className="text-purple-100">
                    P-h diagrams for each refrigerant comparison
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <Label>Select Refrigerant for Visualization:</Label>
                      <div className="flex gap-2">
                        {result.results.map((refrigerantResult) => (
                          <Button
                            key={refrigerantResult.refrigerant}
                            variant={
                              selectedRefrigerantForVisualization ===
                              refrigerantResult.refrigerant
                                ? "default"
                                : "outline"
                            }
                            size="sm"
                            onClick={() =>
                              setSelectedRefrigerantForVisualization(
                                refrigerantResult.refrigerant,
                              )
                            }
                          >
                            {refrigerantResult.refrigerant}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {selectedRefrigerantForVisualization && (
                      <div>
                        {(() => {
                          const selectedResult = result.results.find(
                            (r) =>
                              r.refrigerant ===
                              selectedRefrigerantForVisualization,
                          );
                          const visualizationData = selectedResult
                            ? getVisualizationData(selectedResult)
                            : null;

                          return visualizationData ? (
                            <CycleVisualization cycleData={visualizationData} />
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              Cycle visualization data not available for{" "}
                              {selectedRefrigerantForVisualization}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {result.results.map((refrigerantResult, index) => {
                  const refProps = getRefrigerantById(
                    refrigerantResult.refrigerant,
                  );
                  return (
                    <Card
                      key={refrigerantResult.refrigerant || index}
                      className="bg-white shadow-lg"
                    >
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          {refrigerantResult.refrigerant ||
                            `Refrigerant ${index + 1}`}
                          {refProps && (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">
                                {refProps.safety_class}
                              </Badge>
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
                          )}
                        </CardTitle>
                        {refProps && (
                          <CardDescription>
                            GWP: {refProps.gwp} | ODP: {refProps.odp}
                          </CardDescription>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="p-3 bg-blue-50 rounded-lg text-center">
                              <div className="text-lg font-bold text-blue-600">
                                {getValueForMetric(refrigerantResult, "cop")}
                              </div>
                              <div className="text-sm text-blue-800">COP</div>
                            </div>
                            <div className="p-3 bg-green-50 rounded-lg text-center">
                              <div className="text-lg font-bold text-green-600">
                                {getValueForMetric(
                                  refrigerantResult,
                                  "refrigerationEffect",
                                )}
                              </div>
                              <div className="text-sm text-green-800">
                                Ref. Effect (kJ/kg)
                              </div>
                            </div>
                          </div>

                          {refProps && refProps.applications && (
                            <div>
                              <span className="font-medium text-sm">
                                Applications:
                              </span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {refProps.applications.map((app, appIndex) => (
                                  <Badge
                                    key={appIndex}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {app}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </TabsContent>
          </Tabs>
        )}
    </div>
  );
}

// Standalone page component with header for direct access
export function RefrigerantComparison() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header variant="dashboard" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <ApiServiceStatus />
        <RefrigerantComparisonContent />
      </div>
    </div>
  );
}
