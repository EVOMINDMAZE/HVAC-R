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
import { ProfessionalFeatures } from "../components/ProfessionalFeatures";
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
    "1": StatePoint;
    "2": StatePoint;
    "3": StatePoint;
    "4": StatePoint;
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
  saturation_dome?: {
    ph_diagram: {
      enthalpy_kj_kg: number[];
      pressure_kpa: number[];
    };
    ts_diagram: {
      entropy_kj_kgk: number[];
      temperature_c: number[];
    };
    tv_diagram: {
      specific_volume_m3_kg: number[];
      temperature_c: number[];
    };
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
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding for first-time users
    return !localStorage.getItem("hvac_platform_onboarding_completed");
  });
  const [onboardingStep, setOnboardingStep] = useState(0);

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

      console.log("\n✨ === ENHANCED API RESPONSE ANALYSIS ===");
      console.log("�� Response Status:", response.status, response.statusText);
      console.log("📎 Content-Type:", response.headers.get("content-type"));
      console.log("📦 Full Response Structure:");
      console.log(JSON.stringify(responseData, null, 2));

      if (!response.ok || responseData.error) {
        throw new Error(
          responseData.error || `HTTP error! status: ${response.status}`,
        );
      }

      // Enhanced response format handling
      const calculationData = responseData.data || responseData;

      console.log("\n⚙️ === PROCESSING CALCULATION DATA ===");
      console.log("🔍 Data Structure Type:", typeof calculationData);
      console.log("📝 Top-level Keys:", Object.keys(calculationData || {}));
      console.log("🔄 Processed Data:");
      console.log(JSON.stringify(calculationData, null, 2));

      // Enhanced state points analysis
      if (calculationData.state_points) {
        console.log("\n🔥 === DETAILED STATE POINTS ANALYSIS (NEW STRUCTURE) ===");
        console.log(
          "📊 Total State Points:",
          Object.keys(calculationData.state_points).length,
        );

        Object.keys(calculationData.state_points).forEach((key) => {
          const point = calculationData.state_points[key];
          console.log(`\n🔸 STATE POINT ${key}:`);
          console.log(
            `  🔑 Available Properties (${Object.keys(point).length}):`,
            Object.keys(point),
          );
          console.log(`  🌡️ Temperature:`, point.temperature_c);
          console.log(`  📊 Pressure:`, point.pressure_kpa);
          console.log(`  ⚡ Enthalpy:`, point.enthalpy_kj_kg);
          console.log(`  🌀 Entropy:`, point.entropy_kj_kgk);
          console.log(`  📐 Specific Volume:`, point.specific_volume_m3_kg);
          console.log(`  🔍 All Point Data:`, point);
        });
      } else {
        console.log("\n⚠️ No state_points found in response!");
      }

      // Log saturation dome data
      if (calculationData.saturation_dome) {
        console.log("\n🏔️ === SATURATION DOME DATA ===");
        console.log("📈 P-h Diagram Data:", {
          enthalpy_points: calculationData.saturation_dome.ph_diagram?.enthalpy_kj_kg?.length || 0,
          pressure_points: calculationData.saturation_dome.ph_diagram?.pressure_kpa?.length || 0
        });
        console.log("📈 T-s Diagram Data:", {
          entropy_points: calculationData.saturation_dome.ts_diagram?.entropy_kj_kgk?.length || 0,
          temperature_points: calculationData.saturation_dome.ts_diagram?.temperature_c?.length || 0
        });
        console.log("📈 T-v Diagram Data:", {
          volume_points: calculationData.saturation_dome.tv_diagram?.specific_volume_m3_kg?.length || 0,
          temperature_points: calculationData.saturation_dome.tv_diagram?.temperature_c?.length || 0
        });
      } else {
        console.log("\n⚠️ No saturation_dome found in response!");
      }

      // Enhanced performance analysis
      if (calculationData.performance) {
        console.log("\n🚀 === DETAILED PERFORMANCE ANALYSIS ===");
        console.log(
          "📊 Available Performance Metrics:",
          Object.keys(calculationData.performance).length,
        );
        console.log(
          "🔑 Performance Properties:",
          Object.keys(calculationData.performance),
        );

        const perf = calculationData.performance;
        console.log("🎢 COP variants:", {
          cop: perf.cop,
          COP: perf.COP,
          coefficient_of_performance: perf.coefficient_of_performance,
        });
        console.log("❄️ Cooling Capacity variants:", {
          cooling_capacity_kw: perf.cooling_capacity_kw,
          cooling_capacity: perf.cooling_capacity,
          capacity: perf.capacity,
          Q_evap: perf.Q_evap,
        });
        console.log("⚙️ Compressor Work variants:", {
          compressor_work_kw: perf.compressor_work_kw,
          compressor_work: perf.compressor_work,
          work: perf.work,
          W_comp: perf.W_comp,
        });
        console.log("🔍 Full Performance Object:", perf);
      } else {
        console.log("\n⚠️ No performance data found in response!");
      }

      // Additional validation
      console.log("\n✅ === RESPONSE VALIDATION ===");
      console.log("📊 State Points Valid:", !!calculationData.state_points);
      console.log("🚀 Performance Valid:", !!calculationData.performance);
      console.log(
        "❄️ Refrigerant:",
        calculationData.refrigerant || "Not specified",
      );
      console.log(
        "🔄 Cycle Type:",
        calculationData.cycle_type || "Not specified",
      );

      // Enhanced validation and result setting
      if (calculationData.state_points || calculationData.performance) {
        console.log("\n✅ === SETTING RESULTS ===");
        console.log("💾 Storing calculation data...");

        setResults(calculationData);
        setAnimationState((prev) => ({ ...prev, currentPoint: 1 }));
        setCalculationComplete(true);

        console.log("✨ Results set successfully!");
        console.log("📦 Final stored data structure:", {
          hasStatePoints: !!calculationData.state_points,
          statePointKeys: calculationData.state_points
            ? Object.keys(calculationData.state_points)
            : [],
          hasPerformance: !!calculationData.performance,
          performanceKeys: calculationData.performance
            ? Object.keys(calculationData.performance)
            : [],
          refrigerant: calculationData.refrigerant,
        });

        // Auto-switch to results tab with visual feedback
        setTimeout(() => {
          setActiveTab("results");
          console.log("🔄 Switched to results tab");
        }, 500);
      } else {
        console.log("\n❌ === RESPONSE VALIDATION FAILED ===");
        console.log("⚠️ Unexpected response format:", responseData);
        console.log("🔍 Available top-level keys:", Object.keys(responseData));

        // Try to find data in alternative locations
        const alternativeData =
          responseData.result ||
          responseData.calculation ||
          responseData.output;
        if (alternativeData) {
          console.log("🔄 Found alternative data location:", alternativeData);
          setResults(alternativeData);
          setCalculationComplete(true);
          setTimeout(() => setActiveTab("results"), 500);
        } else {
          throw new Error(
            "Invalid response format - missing state_points or performance data. Available keys: " +
              Object.keys(responseData).join(", "),
          );
        }
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

  // Comprehensive property extraction with enhanced CoolProp compatibility
  const getPropertyValue = (
    obj: StatePoint | undefined,
    propertyNames: string[],
  ): number | undefined => {
    if (!obj) {
      console.log("getPropertyValue: No object provided");
      return undefined;
    }

    console.log(
      `getPropertyValue: Searching for [${propertyNames.join(", ")}] in:`,
      Object.keys(obj),
    );

    // Comprehensive CoolProp property mapping with all known variations
    const propertyMap: Record<string, string[]> = {
      temperature: [
        "temp_c",
        "temperature_c",
        "temperature",
        "temp",
        "temp_celsius",
        "T",
        "T_K",
        "T_C",
        "Temp",
        "Temperature",
        "TEMP",
        "t",
        "t_c",
        "temp_k",
        "temperature_k",
      ],
      pressure: [
        "pressure_kpa",
        "pressure",
        "pressure_pa",
        "pressure_bar",
        "press",
        "P",
        "P_Pa",
        "P_kPa",
        "P_bar",
        "Pressure",
        "PRESSURE",
        "p",
        "p_pa",
        "p_kpa",
        "p_bar",
        "pressure_mpa",
        "P_MPa",
      ],
      enthalpy: [
        "enthalpy_kj_kg",
        "enthalpy",
        "specific_enthalpy",
        "enthalpy_specific",
        "H",
        "h",
        "Enthalpy",
        "ENTHALPY",
        "h_kj_kg",
        "H_kJ_kg",
        "enthalpy_j_kg",
        "H_J_kg",
        "specific_h",
        "h_specific",
      ],
      entropy: [
        "entropy_kj_kg_k",
        "entropy",
        "specific_entropy",
        "entropy_specific",
        "S",
        "s",
        "Entropy",
        "ENTROPY",
        "s_kj_kg_k",
        "S_kJ_kg_K",
        "entropy_j_kg_k",
        "S_J_kg_K",
        "specific_s",
        "s_specific",
      ],
      density: [
        "density_kg_m3",
        "density",
        "rho",
        "specific_volume",
        "volume_specific",
        "D",
        "d",
        "Density",
        "DENSITY",
        "rho_kg_m3",
        "D_kg_m3",
        "density_g_l",
        "rho_g_L",
        "vol_specific",
        "v_specific",
      ],
      quality: [
        "vapor_quality",
        "quality",
        "dryness_fraction",
        "vapor_fraction",
        "Q",
        "x",
        "X",
        "Quality",
        "QUALITY",
        "q",
        "dryness",
        "vapor_frac",
        "vap_quality",
        "steam_quality",
        "x_vapor",
      ],
    };

    // Step 1: Try exact matches first
    for (const name of propertyNames) {
      const value = obj[name];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        const numValue = Number(value);
        console.log(`✓ Found exact match ${name}:`, numValue);
        return numValue;
      }
    }

    // Step 2: Try property map variations
    for (const primaryProperty of propertyNames) {
      // Find property type by checking against map keys
      for (const [propertyType, variations] of Object.entries(propertyMap)) {
        if (
          primaryProperty.toLowerCase().includes(propertyType.toLowerCase()) ||
          primaryProperty
            .toLowerCase()
            .includes(propertyType.substring(0, 4).toLowerCase())
        ) {
          console.log(
            `Searching ${propertyType} variations for ${primaryProperty}:`,
            variations,
          );

          for (const variation of variations) {
            const value = obj[variation];
            if (
              value !== undefined &&
              value !== null &&
              !isNaN(Number(value))
            ) {
              const numValue = Number(value);
              console.log(
                `✓ Found fallback ${variation} for ${primaryProperty}:`,
                numValue,
              );
              return numValue;
            }
          }
        }
      }
    }

    // Step 3: Case-insensitive fallback
    const objKeys = Object.keys(obj);
    for (const primaryProperty of propertyNames) {
      const lowerPrimary = primaryProperty.toLowerCase();
      for (const key of objKeys) {
        if (
          key.toLowerCase() === lowerPrimary ||
          key.toLowerCase().includes(lowerPrimary.split("_")[0])
        ) {
          const value = obj[key];
          if (value !== undefined && value !== null && !isNaN(Number(value))) {
            const numValue = Number(value);
            console.log(
              `✓ Found case-insensitive match ${key} for ${primaryProperty}:`,
              numValue,
            );
            return numValue;
          }
        }
      }
    }

    console.log(
      `❌ No value found for any variation of [${propertyNames.join(", ")}]`,
    );
    console.log("Available keys:", objKeys);
    console.log("Object values:", obj);
    return undefined;
  };

  // Enhanced performance metrics extraction with comprehensive CoolProp mapping
  const getPerformanceValue = (
    performanceObj: any,
    propertyNames: string[],
  ): number | undefined => {
    if (!performanceObj) {
      console.log("getPerformanceValue: No performance object provided");
      return undefined;
    }

    console.log(
      `getPerformanceValue: Searching for [${propertyNames.join(", ")}] in:`,
      Object.keys(performanceObj),
    );

    // Comprehensive performance metric mapping for CoolProp and various backends
    const performanceMap: Record<string, string[]> = {
      cop: [
        "cop",
        "COP",
        "Cop",
        "coefficient_of_performance",
        "performance_coefficient",
        "coeff_of_performance",
        "coefficient_performance",
        "cop_cooling",
        "COP_cooling",
        "cooling_cop",
        "refrigeration_cop",
        "efficiency_cooling",
      ],
      cooling_capacity: [
        "cooling_capacity_kw",
        "cooling_capacity",
        "capacity",
        "capacity_kw",
        "Q_evap",
        "Q_evaporator",
        "evaporator_load",
        "refrigeration_effect_kw",
        "refrigeration_capacity",
        "cooling_load",
        "evap_capacity",
        "q_evap_kw",
        "cooling_power",
        "refrigeration_effect",
        "evaporator_capacity",
      ],
      compressor_work: [
        "compressor_work_kw",
        "compressor_work",
        "work",
        "work_kw",
        "power",
        "W_comp",
        "W_compressor",
        "work_input",
        "power_input",
        "compressor_power",
        "work_of_compression_kj_kg",
        "compression_work",
        "work_compression",
        "compressor_power_kw",
        "input_power",
        "mechanical_power",
      ],
      heat_rejection: [
        "heat_rejection_kw",
        "heat_rejection",
        "Q_cond",
        "Q_condenser",
        "condenser_load",
        "heat_rejected",
        "condensing_capacity",
        "rejection_heat",
        "condenser_capacity",
        "q_cond_kw",
        "heat_rejected_kw",
        "condensation_heat",
      ],
      mass_flow_rate: [
        "mass_flow_rate_kg_s",
        "mass_flow_rate",
        "mdot",
        "m_dot",
        "mass_flow",
        "flow_rate",
        "mass_flow_kg_s",
        "refrigerant_flow_rate",
        "flow_rate_mass",
        "mass_rate",
        "kg_per_s",
        "mass_flux",
        "circulation_rate",
      ],
      volumetric_flow_rate: [
        "volumetric_flow_rate_m3_s",
        "volumetric_flow_rate",
        "volume_flow",
        "V_dot",
        "v_dot",
        "volumetric_flow",
        "volume_flow_rate",
        "vol_flow_rate",
        "suction_volume_flow",
        "displacement",
        "volume_rate",
        "m3_per_s",
      ],
      refrigeration_effect: [
        "refrigeration_effect_kj_kg",
        "refrigeration_effect",
        "specific_cooling",
        "cooling_effect",
        "evap_effect",
        "specific_refrigeration_effect",
        "cooling_per_kg",
        "refrigerant_effect",
        "evaporator_effect",
      ],
    };

    // Step 1: Direct property name matches
    for (const name of propertyNames) {
      const value = performanceObj[name];
      if (value !== undefined && value !== null && !isNaN(Number(value))) {
        const numValue = Number(value);
        console.log(`✓ Found exact performance match ${name}:`, numValue);
        return numValue;
      }
    }

    // Step 2: Property map variations with better matching
    for (const primaryProperty of propertyNames) {
      for (const [propertyType, variations] of Object.entries(performanceMap)) {
        // More flexible matching logic
        const lowerPrimary = primaryProperty.toLowerCase();
        if (
          lowerPrimary.includes(propertyType.toLowerCase()) ||
          propertyType.toLowerCase().includes(lowerPrimary.split("_")[0]) ||
          lowerPrimary.includes(propertyType.split("_")[0])
        ) {
          console.log(
            `Searching ${propertyType} variations for ${primaryProperty}:`,
            variations,
          );

          for (const variation of variations) {
            const value = performanceObj[variation];
            if (
              value !== undefined &&
              value !== null &&
              !isNaN(Number(value))
            ) {
              const numValue = Number(value);
              console.log(
                `✓ Found performance fallback ${variation} for ${primaryProperty}:`,
                numValue,
              );
              return numValue;
            }
          }
        }
      }
    }

    // Step 3: Case-insensitive and partial matching
    const perfKeys = Object.keys(performanceObj);
    for (const primaryProperty of propertyNames) {
      const lowerPrimary = primaryProperty.toLowerCase();
      for (const key of perfKeys) {
        const lowerKey = key.toLowerCase();
        if (
          lowerKey === lowerPrimary ||
          lowerKey.includes(lowerPrimary.split("_")[0]) ||
          lowerPrimary.includes(lowerKey.split("_")[0])
        ) {
          const value = performanceObj[key];
          if (value !== undefined && value !== null && !isNaN(Number(value))) {
            const numValue = Number(value);
            console.log(
              `✓ Found case-insensitive performance match ${key} for ${primaryProperty}:`,
              numValue,
            );
            return numValue;
          }
        }
      }
    }

    console.log(
      `❌ No performance value found for any variation of [${propertyNames.join(", ")}]`,
    );
    console.log("Available performance keys:", perfKeys);
    console.log("Performance object:", performanceObj);
    return undefined;
  };

  const cycleData = results
    ? {
        points: [
          {
            id: "1",
            name: "Evaporator Outlet",
            temperature:
              getPropertyValue(results.state_points?.["1_compressor_inlet"], [
                "temp_c",
                "temperature_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["1_compressor_inlet"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["1_compressor_inlet"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["1_compressor_inlet"], [
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            quality: getPropertyValue(
              results.state_points?.["1_compressor_inlet"],
              ["vapor_quality", "quality"],
            ),
            x: 0, // Will be calculated by CycleVisualization
            y: 0,
          },
          {
            id: "2",
            name: "Compressor Outlet",
            temperature:
              getPropertyValue(results.state_points?.["2_compressor_outlet"], [
                "temp_c",
                "temperature_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["2_compressor_outlet"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["2_compressor_outlet"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["2_compressor_outlet"], [
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            quality: getPropertyValue(
              results.state_points?.["2_compressor_outlet"],
              ["vapor_quality", "quality"],
            ),
            x: 0,
            y: 0,
          },
          {
            id: "3",
            name: "Condenser Outlet",
            temperature:
              getPropertyValue(
                results.state_points?.["3_expansion_valve_inlet"],
                ["temp_c", "temperature_c", "temperature"],
              ) || 0,
            pressure:
              getPropertyValue(
                results.state_points?.["3_expansion_valve_inlet"],
                ["pressure_kpa", "pressure"],
              ) || 0,
            enthalpy:
              getPropertyValue(
                results.state_points?.["3_expansion_valve_inlet"],
                ["enthalpy_kj_kg", "enthalpy"],
              ) || 0,
            entropy:
              getPropertyValue(
                results.state_points?.["3_expansion_valve_inlet"],
                ["entropy_kj_kg_k", "entropy"],
              ) || 0,
            quality: getPropertyValue(
              results.state_points?.["3_expansion_valve_inlet"],
              ["vapor_quality", "quality"],
            ),
            x: 0,
            y: 0,
          },
          {
            id: "4",
            name: "Expansion Valve Outlet",
            temperature:
              getPropertyValue(results.state_points?.["4_evaporator_inlet"], [
                "temp_c",
                "temperature_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["4_evaporator_inlet"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["4_evaporator_inlet"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["4_evaporator_inlet"], [
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            quality: getPropertyValue(
              results.state_points?.["4_evaporator_inlet"],
              ["vapor_quality", "quality"],
            ),
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

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-5">
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
            {calculationComplete && (
              <Badge variant="outline" className="ml-1">
                New
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="results"
            className="flex items-center gap-2"
            disabled={!results}
          >
            <FileText className="h-4 w-4" />
            Results
            {calculationComplete && (
              <Badge variant="default" className="ml-1">
                View
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="equipment"
            className="flex items-center gap-2"
            disabled={!results}
          >
            <Wrench className="h-4 w-4" />
            Equipment
            {calculationComplete && (
              <Badge variant="outline" className="ml-1">
                New
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="professional" className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4" />
            Professional
            <Badge variant="secondary" className="ml-1">
              Pro
            </Badge>
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
                        <TechTerm term="gwp">
                          GWP: {selectedRefrigerant.gwp}
                        </TechTerm>{" "}
                        |
                        <TechTerm term="odp">
                          {" "}
                          ODP: {selectedRefrigerant.odp}
                        </TechTerm>
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
                      <TechTerm term="evaporator">
                        Evaporator Temperature (°C)
                      </TechTerm>
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
                      <TechTerm term="condenser">
                        Condenser Temperature (°C)
                      </TechTerm>
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
                        <span>
                          <strong>Calculation Complete!</strong> View your
                          results in the tabs above.
                        </span>
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
                  <TechTerm term="coolprop_support">
                    Real-time Validation
                  </TechTerm>
                </CardTitle>
                <CardDescription>
                  Thermodynamic property verification and operating condition
                  checks
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
              <CardTitle>Thermodynamic Cycle Visualization</CardTitle>
              <CardDescription>
                Interactive diagrams with multiple view types and animation
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
                    onAnimationToggle={toggleAnimation}
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
                          {formatValue(
                            getPerformanceValue(results.performance, ["cop"]),
                            "",
                          )}
                        </div>
                        <div className="text-sm text-primary/80">
                          <TechTerm term="cop">
                            Coefficient of Performance
                          </TechTerm>
                        </div>
                      </div>
                      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatValue(
                            getPerformanceValue(results.performance, [
                              "cooling_capacity_kw",
                              "cooling_capacity",
                            ]),
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
                            getPerformanceValue(results.performance, [
                              "compressor_work_kw",
                              "work_of_compression_kj_kg",
                            ]),
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
                            getPerformanceValue(results.performance, [
                              "heat_rejection_kw",
                              "heat_rejection",
                            ]),
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
                            getPerformanceValue(results.performance, [
                              "mass_flow_rate_kg_s",
                              "mass_flow_rate",
                            ]),
                            "kg/s",
                            4,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Volumetric Flow Rate:</span>
                        <span className="font-mono">
                          {formatValue(
                            getPerformanceValue(results.performance, [
                              "volumetric_flow_rate_m3_s",
                              "volumetric_flow_rate",
                            ]),
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
                      <div
                        key={index}
                        className={`border rounded-lg p-3 border-l-4 ${colorClass.includes("border-l-") ? "" : "border-l-gray-200"}`}
                      >
                        <div
                          className={`font-medium mb-2 ${colorClass.split(" ")[0]}`}
                        >
                          {label}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            T:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "temp_c",
                                "temperature_c",
                                "temperature",
                              ]),
                              "°C",
                            )}
                          </div>
                          <div>
                            P:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "pressure_kpa",
                                "pressure",
                              ]),
                              "kPa",
                              0,
                            )}
                          </div>
                          <div>
                            <TechTerm term="enthalpy">h</TechTerm>:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "enthalpy_kj_kg",
                                "enthalpy",
                              ]),
                              "kJ/kg",
                            )}
                          </div>
                          <div>
                            <TechTerm term="entropy">s</TechTerm>:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "entropy_kj_kg_k",
                                "entropy",
                              ]),
                              "kJ/kg·K",
                              3,
                            )}
                          </div>
                          <div>
                            ρ:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "density_kg_m3",
                                "density",
                              ]),
                              "kg/m³",
                            )}
                          </div>
                          {getPropertyValue(point, [
                            "vapor_quality",
                            "quality",
                          ]) !== undefined && (
                            <div>
                              <TechTerm term="quality">x</TechTerm>:{" "}
                              {formatValue(
                                (getPropertyValue(point, [
                                  "vapor_quality",
                                  "quality",
                                ]) || 0) * 100,
                                "%",
                              )}
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

        <TabsContent value="professional">
          <ProfessionalFeatures
            cycleData={cycleData}
            results={results}
            refrigerant={formData.refrigerant}
          />
        </TabsContent>
      </Tabs>

      {/* Interactive Onboarding */}
      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-blue-600" />
                Welcome to the World-Class HVAC Platform
                <Badge variant="outline" className="ml-auto">
                  Step {onboardingStep + 1} of 4
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {onboardingStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    🎯 Built for Every Professional
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg border">
                      <div className="font-semibold text-blue-800">
                        Technicians & Field Engineers
                      </div>
                      <div className="text-sm text-blue-600 mt-1">
                        Quick calculations, troubleshooting tools, real-time
                        analysis
                      </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-lg border">
                      <div className="font-semibold text-green-800">
                        Design Engineers
                      </div>
                      <div className="text-sm text-green-600 mt-1">
                        Advanced simulations, professional reports, detailed
                        analysis
                      </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded-lg border">
                      <div className="font-semibold text-purple-800">
                        Department Heads
                      </div>
                      <div className="text-sm text-purple-600 mt-1">
                        Strategic insights, cost analysis, sustainability
                        planning
                      </div>
                    </div>
                    <div className="p-4 bg-orange-50 rounded-lg border">
                      <div className="font-semibold text-orange-800">
                        Entrepreneurs
                      </div>
                      <div className="text-sm text-orange-600 mt-1">
                        Business intelligence, ROI analysis, market insights
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 1 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    🚀 Core Calculation Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calculator className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Calculation Tab</div>
                        <div className="text-sm text-muted-foreground">
                          Configure refrigerant and operating conditions with
                          real-time validation
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Eye className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-semibold">Visualization Tab</div>
                        <div className="text-sm text-muted-foreground">
                          Interactive P-h diagrams with multiple view types and
                          animation
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-semibold">Results Tab</div>
                        <div className="text-sm text-muted-foreground">
                          Comprehensive performance metrics and state point
                          analysis
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    ⚡ Professional Features
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <ArrowRight className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-semibold">Professional Tab</div>
                        <div className="text-sm text-muted-foreground">
                          Advanced tools for unit conversion, sustainability
                          analysis, and cost optimization
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="text-sm font-semibold">
                          🌍 Dynamic Units
                        </div>
                        <div className="text-xs text-muted-foreground">
                          SI ↔ Imperial conversion
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="text-sm font-semibold">
                          🍃 Sustainability
                        </div>
                        <div className="text-xs text-muted-foreground">
                          GWP, ODP, regulations
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="text-sm font-semibold">
                          💰 Cost Analysis
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ROI, lifecycle costs
                        </div>
                      </div>
                      <div className="p-3 bg-gray-50 rounded border">
                        <div className="text-sm font-semibold">📊 Reports</div>
                        <div className="text-xs text-muted-foreground">
                          Professional PDFs
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {onboardingStep === 3 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">🎯 Getting Started</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="font-semibold text-green-800 mb-2">
                        Quick Start Guide:
                      </div>
                      <ol className="text-sm text-green-700 space-y-1">
                        <li>1. Select your refrigerant from the dropdown</li>
                        <li>
                          2. Enter operating conditions (temperatures,
                          superheat, subcooling)
                        </li>
                        <li>
                          3. Click "Calculate Cycle" to run thermodynamic
                          analysis
                        </li>
                        <li>
                          4. Explore results in Visualization, Results, and
                          Professional tabs
                        </li>
                        <li>
                          5. Generate professional reports for your projects
                        </li>
                      </ol>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-muted-foreground">
                        Ready to revolutionize your HVAC analysis workflow?
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="outline"
                  onClick={() =>
                    setOnboardingStep(Math.max(0, onboardingStep - 1))
                  }
                  disabled={onboardingStep === 0}
                >
                  Previous
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      localStorage.setItem(
                        "hvac_platform_onboarding_completed",
                        "true",
                      );
                      setShowOnboarding(false);
                    }}
                  >
                    Skip Tour
                  </Button>
                  {onboardingStep < 3 ? (
                    <Button
                      onClick={() => setOnboardingStep(onboardingStep + 1)}
                    >
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={() => {
                        localStorage.setItem(
                          "hvac_platform_onboarding_completed",
                          "true",
                        );
                        setShowOnboarding(false);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Start Using Platform
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Standalone page version with header and footer
export function EnhancedStandardCycle() {
  return <EnhancedStandardCycleContent />;
}
