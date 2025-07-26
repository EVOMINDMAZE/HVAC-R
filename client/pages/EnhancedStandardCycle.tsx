import React, { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Loader2,
  Calculator,
  Eye,
  FileText,
  Wrench,
  Play,
  Pause,
  RotateCcw,
  Info,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { EnhancedRefrigerantSelector } from "../components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "../components/CycleVisualization";
import { EquipmentDiagrams } from "../components/EquipmentDiagrams";
import { TechnicalTooltip, TechTerm } from "../components/TechnicalTooltip";
import {
  RefrigerantProperties,
  validateCycleConditions,
  getRefrigerantById,
} from "../lib/refrigerants";

interface StatePoint {
  temp_c?: number;
  temperature_c?: number;
  pressure_kpa?: number;
  pressure?: number;
  enthalpy_kj_kg?: number;
  enthalpy?: number;
  entropy_kj_kg_k?: number;
  entropy?: number;
  density_kg_m3?: number;
  density?: number;
  vapor_quality?: number;
  quality?: number;
  [key: string]: any; // Allow for additional properties
}

interface CalculationResults {
  state_points: {
    "1_compressor_inlet": StatePoint;
    "2_compressor_outlet": StatePoint;
    "3_expansion_valve_inlet": StatePoint;
    "4_evaporator_inlet": StatePoint;
    [key: string]: StatePoint; // Allow for additional points
  };
  performance: {
    cop?: number;
    cooling_capacity_kw?: number;
    compressor_work_kw?: number;
    heat_rejection_kw?: number;
    mass_flow_rate_kg_s?: number;
    volumetric_flow_rate_m3_s?: number;
    work_of_compression_kj_kg?: number;
    refrigeration_effect_kj_kg?: number;
    [key: string]: any; // Allow for additional performance metrics
  };
  refrigerant?: string;
  cycle_type?: "standard";
  [key: string]: any; // Allow for additional top-level properties
}

interface CycleAnimationState {
  isAnimating: boolean;
  currentPoint: number;
  animationSpeed: number;
}

// Content-only version for embedding in other pages
export function EnhancedStandardCycleContent() {
  const [formData, setFormData] = useState({
    refrigerant: "R134a",
    evap_temp_c: -10,
    cond_temp_c: 45,
    superheat_c: 5,
    subcooling_c: 2,
  });

  const [results, setResults] = useState<CalculationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [selectedRefrigerant, setSelectedRefrigerant] =
    useState<RefrigerantProperties | null>(null);
  const [animationState, setAnimationState] = useState<CycleAnimationState>({
    isAnimating: false,
    currentPoint: 1,
    animationSpeed: 1000,
  });
  const [activeTab, setActiveTab] = useState("calculation");
  const [calculationComplete, setCalculationComplete] = useState(false);

  const handleInputChange = useCallback((field: string, value: number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  }, []);

  const handleRefrigerantChange = useCallback(
    (refrigerant: string) => {
      setFormData((prev) => ({ ...prev, refrigerant }));
      const refProps = getRefrigerantById(refrigerant);
      setSelectedRefrigerant(refProps);

      if (refProps) {
        const warnings = validateCycleConditions(refProps, {
          evaporatorTemp: formData.evap_temp_c,
          condenserTemp: formData.cond_temp_c,
          superheat: formData.superheat_c,
          subcooling: formData.subcooling_c,
        });
        setValidationWarnings(warnings);
      }
      setError(null);
    },
    [
      formData.evap_temp_c,
      formData.cond_temp_c,
      formData.superheat_c,
      formData.subcooling_c,
    ],
  );

  const validateInputs = useCallback(() => {
    if (formData.evap_temp_c >= formData.cond_temp_c) {
      setError(
        "Evaporator temperature must be lower than condenser temperature",
      );
      return false;
    }
    if (formData.superheat_c < 0 || formData.subcooling_c < 0) {
      setError("Superheat and subcooling must be positive values");
      return false;
    }
    return true;
  }, [formData]);

  const handleCalculate = async () => {
    if (!validateInputs()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        "https://simulateon-backend.onrender.com/calculate-standard",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
        },
      );

      const responseData = await response.json();

      console.log("API Response received:", responseData);

      if (!response.ok || responseData.error) {
        throw new Error(
          responseData.error || `HTTP error! status: ${response.status}`,
        );
      }

      // Handle response format - could be direct data or wrapped in data property
      const calculationData = responseData.data || responseData;

      // Log detailed structure for debugging
      if (calculationData.state_points) {
        console.log("State points structure:", calculationData.state_points);
        Object.keys(calculationData.state_points).forEach(key => {
          console.log(`${key} properties:`, Object.keys(calculationData.state_points[key]));
        });
      }
      if (calculationData.performance) {
        console.log("Performance structure:", Object.keys(calculationData.performance));
      }

      if (calculationData.state_points || calculationData.performance) {
        setResults(calculationData);
        setAnimationState((prev) => ({ ...prev, currentPoint: 1 }));
        setCalculationComplete(true);
        // Auto-switch to results tab to show user the results
        setTimeout(() => setActiveTab("results"), 500);
      } else {
        console.log("Unexpected response format:", responseData);
        throw new Error(
          "Invalid response format - missing state_points or performance data",
        );
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";

      // Handle specific CoolProp errors for blend refrigerants
      if (
        errorMessage.includes("Two-phase inputs not supported for pseudo-pure")
      ) {
        const refrigerantName = formData.refrigerant;
        setError(
          `CoolProp limitation: ${refrigerantName} is a blend refrigerant and two-phase calculations are not supported. ` +
            "Try adjusting the superheat or subcooling values to avoid two-phase conditions, or use a pure refrigerant like R134a or R32.",
        );
      } else if (errorMessage.includes("PropsSI")) {
        setError(
          "CoolProp calculation error: The specified operating conditions may be outside the valid range for this refrigerant. " +
            "Please check your temperature and pressure values.",
        );
      } else {
        setError(errorMessage);
      }

      console.error("Calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAnimation = () => {
    setAnimationState((prev) => ({
      ...prev,
      isAnimating: !prev.isAnimating,
    }));
  };

  const resetAnimation = () => {
    setAnimationState((prev) => ({
      ...prev,
      isAnimating: false,
      currentPoint: 1,
    }));
  };

  const adjustAnimationSpeed = (speed: number) => {
    setAnimationState((prev) => ({
      ...prev,
      animationSpeed: speed,
    }));
  };

  const formatValue = (
    value: number | undefined,
    unit: string,
    decimals: number = 2,
  ) => {
    if (value === undefined || value === null || isNaN(value)) {
      return `N/A ${unit}`;
    }
    return `${value.toFixed(decimals)} ${unit}`;
  };

  // Helper function to safely extract property values with multiple possible names
  const getPropertyValue = (obj: StatePoint | undefined, propertyNames: string[]): number | undefined => {
    if (!obj) return undefined;

    for (const name of propertyNames) {
      const value = obj[name];
      if (value !== undefined && value !== null && !isNaN(value)) {
        return value;
      }
    }
    return undefined;
  };

  const cycleData = results
    ? {
        points: [
          {
            id: "1",
            name: "Evaporator Outlet",
            temperature:
              results.state_points?.["1_compressor_inlet"]?.temp_c || 0,
            pressure:
              results.state_points?.["1_compressor_inlet"]?.pressure_kpa || 0,
            enthalpy:
              results.state_points?.["1_compressor_inlet"]?.enthalpy_kj_kg || 0,
            entropy:
              results.state_points?.["1_compressor_inlet"]?.entropy_kj_kg_k ||
              0,
            quality:
              results.state_points?.["1_compressor_inlet"]?.vapor_quality,
            x: 0, // Will be calculated by CycleVisualization
            y: 0,
          },
          {
            id: "2",
            name: "Compressor Outlet",
            temperature:
              results.state_points?.["2_compressor_outlet"]?.temp_c || 0,
            pressure:
              results.state_points?.["2_compressor_outlet"]?.pressure_kpa || 0,
            enthalpy:
              results.state_points?.["2_compressor_outlet"]?.enthalpy_kj_kg ||
              0,
            entropy:
              results.state_points?.["2_compressor_outlet"]?.entropy_kj_kg_k ||
              0,
            quality:
              results.state_points?.["2_compressor_outlet"]?.vapor_quality,
            x: 0,
            y: 0,
          },
          {
            id: "3",
            name: "Condenser Outlet",
            temperature:
              results.state_points?.["3_expansion_valve_inlet"]?.temp_c || 0,
            pressure:
              results.state_points?.["3_expansion_valve_inlet"]?.pressure_kpa ||
              0,
            enthalpy:
              results.state_points?.["3_expansion_valve_inlet"]
                ?.enthalpy_kj_kg || 0,
            entropy:
              results.state_points?.["3_expansion_valve_inlet"]
                ?.entropy_kj_kg_k || 0,
            quality:
              results.state_points?.["3_expansion_valve_inlet"]?.vapor_quality,
            x: 0,
            y: 0,
          },
          {
            id: "4",
            name: "Expansion Valve Outlet",
            temperature:
              results.state_points?.["4_evaporator_inlet"]?.temp_c || 0,
            pressure:
              results.state_points?.["4_evaporator_inlet"]?.pressure_kpa || 0,
            enthalpy:
              results.state_points?.["4_evaporator_inlet"]?.enthalpy_kj_kg || 0,
            entropy:
              results.state_points?.["4_evaporator_inlet"]?.entropy_kj_kg_k ||
              0,
            quality:
              results.state_points?.["4_evaporator_inlet"]?.vapor_quality,
            x: 0,
            y: 0,
          },
        ],
        refrigerant: results.refrigerant || formData.refrigerant,
        cycleType: "standard" as const,
      }
    : undefined;

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Enhanced Standard Refrigeration Cycle
        </h1>
        <p className="text-muted-foreground">
          Advanced cycle analysis with real-time visualization and equipment
          simulation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calculation" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Calculation
          </TabsTrigger>
          <TabsTrigger
            value="visualization"
            className="flex items-center gap-2"
            disabled={!results}
          >
            <Eye className="h-4 w-4" />
            Visualization
            {calculationComplete && <Badge variant="outline" className="ml-1">New</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="flex items-center gap-2"
            disabled={!results}
          >
            <FileText className="h-4 w-4" />
            Results
            {calculationComplete && <Badge variant="default" className="ml-1">View</Badge>}
          </TabsTrigger>
          <TabsTrigger
            value="equipment"
            className="flex items-center gap-2"
            disabled={!results}
          >
            <Wrench className="h-4 w-4" />
            Equipment
            {calculationComplete && <Badge variant="outline" className="ml-1">New</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculation">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Parameters</CardTitle>
                <CardDescription>
                  Configure refrigerant and operating conditions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="refrigerant">Refrigerant</Label>
                  <EnhancedRefrigerantSelector
                    value={formData.refrigerant}
                    onChange={handleRefrigerantChange}
                    className="mt-2"
                  />
                  {selectedRefrigerant && (
                    <div className="mt-2 text-sm text-muted-foreground space-y-1">
                      <div>
                        <TechTerm term="safety_class">
                          <Badge variant="outline" className="mr-2">
                            {selectedRefrigerant.safety_class}
                          </Badge>
                        </TechTerm>
                        <TechTerm term="gwp">GWP: {selectedRefrigerant.gwp}</TechTerm> |
                        <TechTerm term="odp"> ODP: {selectedRefrigerant.odp}</TechTerm>
                      </div>
                    </div>
                  )}

                  {selectedRefrigerant &&
                    ["R407C", "R404A", "R448A", "R507A", "R410A"].includes(
                      selectedRefrigerant.id,
                    ) && (
                      <Alert className="mt-3">
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Pro Tip:</strong> {selectedRefrigerant.name}{" "}
                          is a blend refrigerant. For best results with CoolProp
                          calculations:
                          <ul className="mt-1 ml-4 list-disc text-sm">
                            <li>Use superheat ≥ 10°C</li>
                            <li>Use subcooling ≥ 5°C</li>
                            <li>Avoid operating conditions near saturation</li>
                          </ul>
                        </AlertDescription>
                      </Alert>
                    )}
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="evap_temp">
                      <TechTerm term="evaporator">Evaporator Temperature (°C)</TechTerm>
                    </Label>
                    <Input
                      id="evap_temp"
                      type="number"
                      value={formData.evap_temp_c}
                      onChange={(e) =>
                        handleInputChange(
                          "evap_temp_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="mt-1"
                      placeholder="e.g., -10"
                    />
                  </div>
                  <div>
                    <Label htmlFor="cond_temp">
                      <TechTerm term="condenser">Condenser Temperature (°C)</TechTerm>
                    </Label>
                    <Input
                      id="cond_temp"
                      type="number"
                      value={formData.cond_temp_c}
                      onChange={(e) =>
                        handleInputChange(
                          "cond_temp_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="mt-1"
                      placeholder="e.g., 45"
                    />
                  </div>
                  <div>
                    <Label htmlFor="superheat">
                      <TechTerm term="superheat">Superheat (°C)</TechTerm>
                    </Label>
                    <Input
                      id="superheat"
                      type="number"
                      value={formData.superheat_c}
                      onChange={(e) =>
                        handleInputChange(
                          "superheat_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="mt-1"
                      placeholder="e.g., 5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="subcooling">
                      <TechTerm term="subcooling">Subcooling (°C)</TechTerm>
                    </Label>
                    <Input
                      id="subcooling"
                      type="number"
                      value={formData.subcooling_c}
                      onChange={(e) =>
                        handleInputChange(
                          "subcooling_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="mt-1"
                      placeholder="e.g., 2"
                    />
                  </div>
                </div>

                {validationWarnings.length > 0 && (
                  <Alert>
                    <AlertDescription>
                      <strong>Operating Condition Warnings:</strong>
                      <ul className="mt-1 ml-4 list-disc">
                        {validationWarnings.map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {error}
                      {error.includes("blend refrigerant") && (
                        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                          <strong className="text-blue-800">
                            Suggestions:
                          </strong>
                          <ul className="mt-1 ml-4 list-disc text-sm text-blue-700">
                            <li>Try increasing superheat to 10°C or higher</li>
                            <li>Try increasing subcooling to 5°C or higher</li>
                            <li>
                              Consider using pure refrigerants like R134a, R32,
                              R290, or R744
                            </li>
                            <li>
                              Adjust evaporator/condenser temperatures to avoid
                              two-phase conditions
                            </li>
                          </ul>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <Button
                  onClick={handleCalculate}
                  disabled={loading}
                  className="w-full"
                  size="lg"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Calculating...
                    </>
                  ) : (
                    <>
                      <Calculator className="h-4 w-4 mr-2" />
                      Calculate Cycle
                    </>
                  )}
                </Button>

                {calculationComplete && (
                  <Alert className="mt-4 border-green-200 bg-green-50">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <AlertDescription className="text-green-800">
                      <div className="flex items-center justify-between">
                        <span><strong>Calculation Complete!</strong> View your results in the tabs above.</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveTab("results")}
                          className="border-green-300 text-green-700 hover:bg-green-100"
                        >
                          View Results <ArrowRight className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>
                  <TechTerm term="coolprop_support">Real-time Validation</TechTerm>
                </CardTitle>
                <CardDescription>
                  Thermodynamic property verification and operating condition checks
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedRefrigerant ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">
                          Critical Temperature:
                        </span>
                        <div>
                          {selectedRefrigerant.limits.critical_temp_c.toFixed(
                            1,
                          )}
                          °C
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Critical Pressure:</span>
                        <div>
                          {(
                            selectedRefrigerant.limits.critical_pressure_kpa /
                            1000
                          ).toFixed(1)}{" "}
                          MPa
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Min Temperature:</span>
                        <div>
                          {selectedRefrigerant.limits.min_temp_c.toFixed(1)}°C
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">Max Temperature:</span>
                        <div>
                          {selectedRefrigerant.limits.max_temp_c.toFixed(1)}°C
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <span className="font-medium">CoolProp Support:</span>
                      <Badge
                        variant={
                          selectedRefrigerant.coolpropSupport === "full"
                            ? "default"
                            : "secondary"
                        }
                        className="ml-2"
                      >
                        {selectedRefrigerant.coolpropSupport}
                      </Badge>
                    </div>

                    {selectedRefrigerant.applications && (
                      <div>
                        <span className="font-medium">Applications:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                          {selectedRefrigerant.applications.map(
                            (app, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs"
                              >
                                {app}
                              </Badge>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-muted-foreground text-center py-8">
                    Select a refrigerant to view properties
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="visualization">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                P-h Diagram Visualization
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleAnimation}
                    disabled={!results}
                  >
                    {animationState.isAnimating ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetAnimation}
                    disabled={!results}
                  >
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                Interactive pressure-enthalpy diagram with cycle animation
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results && cycleData ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 mb-4">
                    <Label>Animation Speed:</Label>
                    <div className="flex gap-2">
                      {[500, 1000, 2000].map((speed) => (
                        <Button
                          key={speed}
                          variant={
                            animationState.animationSpeed === speed
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() => adjustAnimationSpeed(speed)}
                        >
                          {speed === 500
                            ? "Fast"
                            : speed === 1000
                              ? "Normal"
                              : "Slow"}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <CycleVisualization
                    cycleData={cycleData}
                    isAnimating={animationState.isAnimating}
                    animationSpeed={animationState.animationSpeed}
                    currentPoint={animationState.currentPoint}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Calculate a cycle to view the P-h diagram visualization
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cycle Performance</CardTitle>
                <CardDescription>
                  Overall system performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results && results.performance ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="text-2xl font-bold text-primary">
                          {results.performance?.cop?.toFixed(2) || "N/A"}
                        </div>
                        <div className="text-sm text-primary/80">
                          <TechTerm term="cop">Coefficient of Performance</TechTerm>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatValue(
                            results.performance?.cooling_capacity_kw,
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-emerald-700">
                          Cooling Capacity
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {formatValue(
                            results.performance?.compressor_work_kw,
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-amber-700">
                          Compressor Work
                        </div>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                        <div className="text-2xl font-bold text-rose-600">
                          {formatValue(
                            results.performance?.heat_rejection_kw,
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-rose-700">
                          Heat Rejection
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Mass Flow Rate:</span>
                        <span className="font-mono">
                          {formatValue(
                            results.performance?.mass_flow_rate_kg_s,
                            "kg/s",
                            4,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volumetric Flow Rate:</span>
                        <span className="font-mono">
                          {formatValue(
                            results.performance?.volumetric_flow_rate_m3_s,
                            "m³/s",
                            6,
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No results available. Calculate a cycle first.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>State Points</CardTitle>
                <CardDescription>
                  Thermodynamic properties at each cycle point
                </CardDescription>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    {[
                      {
                        point: results.state_points?.["1_compressor_inlet"],
                        label: "Point 1 - Evaporator Outlet",
                        colorClass: "text-primary border-l-primary",
                      },
                      {
                        point: results.state_points?.["2_compressor_outlet"],
                        label: "Point 2 - Compressor Outlet",
                        colorClass: "text-rose-600 border-l-rose-600",
                      },
                      {
                        point:
                          results.state_points?.["3_expansion_valve_inlet"],
                        label: "Point 3 - Condenser Outlet",
                        colorClass: "text-emerald-600 border-l-emerald-600",
                      },
                      {
                        point: results.state_points?.["4_evaporator_inlet"],
                        label: "Point 4 - Expansion Outlet",
                        colorClass: "text-amber-600 border-l-amber-600",
                      },
                    ].map(({ point, label, colorClass }, index) => (
                      <div key={index} className={`border rounded-lg p-3 border-l-4 ${colorClass.includes('border-l-') ? '' : 'border-l-gray-200'}`}>
                        <div className={`font-medium mb-2 ${colorClass.split(' ')[0]}`}>
                          {label}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>T: {formatValue(point?.temp_c, "°C")}</div>
                          <div>
                            P: {formatValue(point?.pressure_kpa, "kPa", 0)}
                          </div>
                          <div>
                            <TechTerm term="enthalpy">h</TechTerm>: {formatValue(point?.enthalpy_kj_kg, "kJ/kg")}
                          </div>
                          <div>
                            <TechTerm term="entropy">s</TechTerm>:{" "}
                            {formatValue(point?.entropy_kj_kg_k, "kJ/kg·K", 3)}
                          </div>
                          <div>
                            ρ: {formatValue(point?.density_kg_m3, "kg/m³")}
                          </div>
                          {point?.vapor_quality !== undefined && (
                            <div>
                              <TechTerm term="quality">x</TechTerm>: {formatValue(point.vapor_quality * 100, "%")}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No results available. Calculate a cycle first.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader>
              <CardTitle>Equipment Diagrams</CardTitle>
              <CardDescription>
                Interactive system components with refrigerant flow
                visualization
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <EquipmentDiagrams
                  cycleData={cycleData}
                  isAnimating={animationState.isAnimating}
                  animationSpeed={animationState.animationSpeed}
                />
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  Calculate a cycle to view equipment diagrams
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Standalone page version with header and footer
export function EnhancedStandardCycle() {
  return <EnhancedStandardCycleContent />;
}
