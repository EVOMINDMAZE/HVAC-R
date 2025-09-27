import React, { useState, useCallback, useEffect, useMemo } from "react";
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
import { Alert, AlertDescription, AlertTitle } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Loader2,
  Calculator,
  Eye,
  FileText,
  Wrench,
  Info,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { EnhancedRefrigerantSelector } from "../components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "../components/CycleVisualization";
import { EquipmentDiagrams } from "../components/EquipmentDiagrams";
import { TechnicalTooltip, TechTerm } from "../components/TechnicalTooltip";
import { SaveCalculation } from "../components/SaveCalculation";
import { RenameCalculationDialog } from "../components/RenameCalculationDialog";
import { ProfessionalFeatures } from "../components/ProfessionalFeatures";
import { useSupabaseCalculations } from "../hooks/useSupabaseCalculations";
import { consumeCalculationPreset } from "@/lib/historyPresets";
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
  const [activeTab, setActiveTab] = useState("calculation");
  const [calculationComplete, setCalculationComplete] = useState(false);
  const { saveCalculation, findMatchingCalculation } = useSupabaseCalculations();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding for first-time users
    return !localStorage.getItem("hvac_platform_onboarding_completed");
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [pendingPresetInputs, setPendingPresetInputs] = useState<
    Partial<typeof formData> | null
  >(null);

  const defaultCalculationName = useMemo(
    () => `Standard Cycle - ${new Date().toLocaleDateString()}`,
    [],
  );

  const matchingCalculation = useMemo(() => {
    if (!results) {
      return null;
    }
    try {
      return findMatchingCalculation(formData, results) ?? null;
    } catch (calcError) {
      console.warn("Failed to match saved calculation", calcError);
      return null;
    }
  }, [findMatchingCalculation, formData, results]);

  useEffect(() => {
    if (calculationComplete && results) {
      setShowSuccessBanner(true);
      const timer = window.setTimeout(() => setShowSuccessBanner(false), 6000);
      return () => window.clearTimeout(timer);
    }
    if (!calculationComplete && showSuccessBanner) {
      setShowSuccessBanner(false);
    }
    return undefined;
  }, [calculationComplete, results, showSuccessBanner]);

  useEffect(() => {
    const preset = consumeCalculationPreset();
    if (preset?.type !== "Standard Cycle" || !preset.inputs) {
      return;
    }

    try {
      const inputs = preset.inputs as Partial<typeof formData>;
      let combinedInputs: typeof formData | null = null;

      setFormData((prev) => {
        combinedInputs = { ...prev, ...inputs };
        return combinedInputs;
      });

      if (combinedInputs) {
        const refProps = getRefrigerantById(combinedInputs.refrigerant);
        setSelectedRefrigerant(refProps ?? null);
        if (refProps) {
          setValidationWarnings(
            validateCycleConditions(refProps, {
              evaporatorTemp: combinedInputs.evap_temp_c,
              condenserTemp: combinedInputs.cond_temp_c,
              superheat: combinedInputs.superheat_c,
              subcooling: combinedInputs.subcooling_c,
            }),
          );
        }
      }

      setPendingPresetInputs(inputs);
      setActiveTab("calculation");
    } catch (error) {
      console.warn("Failed to apply preset for standard cycle", error);
    }
  }, []);

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

  const handleCalculate = async (
    overrideParams: Partial<typeof formData> | null = null,
    attempt: number = 0,
  ) => {
    setCalculationComplete(false);
    setShowSuccessBanner(false);

    if (!validateInputs()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    // Defensive: if overrideParams looks like a DOM/Event accidentally passed by React (onClick passes event), ignore it
    let safeOverride: Partial<typeof formData> | null = null;
    try {
      if (
        overrideParams &&
        (overrideParams instanceof Event ||
          (typeof overrideParams === "object" &&
            ("nativeEvent" in overrideParams ||
              "currentTarget" in overrideParams ||
              "target" in overrideParams)))
      ) {
        safeOverride = null;
      } else {
        safeOverride = overrideParams;
      }
    } catch (e) {
      safeOverride = null;
    }

    // Build request payload using possible overrides (used for auto-retry adjustments)
    const requestBody = safeOverride
      ? { ...formData, ...safeOverride }
      : formData;

    try {
      const response = await fetch(`${API_BASE_URL}/calculate-standard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();

      if (!response.ok || responseData.error) {
        throw new Error(
          responseData.error || `HTTP error! status: ${response.status}`,
        );
      }

      const calculationData =
        responseData.data ??
        responseData.result ??
        responseData.calculation ??
        responseData.output ??
        responseData;

      if (
        !calculationData ||
        (!calculationData.state_points && !calculationData.performance)
      ) {
        throw new Error(
          "Invalid response format - missing state_points or performance data. Available keys: " +
            Object.keys(responseData).join(", "),
        );
      }

      setResults(calculationData);
      setCalculationComplete(true);

      try {
        void saveCalculation(
          "Standard Cycle",
          formData,
          calculationData,
          `Standard Cycle - ${new Date().toLocaleString()}`,
          { silent: true },
        ).catch((e) => console.warn("Auto-save failed:", e));
      } catch (e) {
        console.warn("Auto-save invocation error:", e);
      }

      setTimeout(() => {
        setActiveTab("results");
      }, 500);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";

      setShowSuccessBanner(false);
      setCalculationComplete(false);

      // Handle specific CoolProp errors for blend refrigerants with an automated retry
      if (
        errorMessage.includes("Two-phase inputs not supported for pseudo-pure")
      ) {
        const refrigerantName = requestBody.refrigerant || formData.refrigerant;

        if (attempt === 0) {
          // Try a best-effort auto-adjust: increase superheat and reduce subcooling slightly
          const newSuperheat =
            (requestBody.superheat_c ?? formData.superheat_c) + 2;
          const newSubcooling = Math.max(
            0,
            (requestBody.subcooling_c ?? formData.subcooling_c) - 1,
          );

          setError(
            `CoolProp limitation detected for blend refrigerant ${refrigerantName}. Attempting automatic adjustment (superheat +2°C, subcooling -1°C) and retrying...`,
          );

          // Update visible form values so user sees the attempted adjustment
          setFormData((prev) => ({
            ...prev,
            superheat_c: newSuperheat,
            subcooling_c: newSubcooling,
          }));

          // Retry once with adjusted params
          setTimeout(() => {
            void handleCalculate(
              { superheat_c: newSuperheat, subcooling_c: newSubcooling },
              attempt + 1,
            );
          }, 250);
        } else {
          setError(
            `CoolProp limitation: ${refrigerantName} is a blend refrigerant and two-phase calculations are not supported. Automatic retry failed. Try using a pure refrigerant (e.g., R134a) or adjust operating conditions to avoid two-phase calculations.`,
          );
        }
      } else if (errorMessage.includes("PropsSI")) {
        setError(
          "CoolProp calculation error: The specified operating conditions may be outside the valid range for this refrigerant. Please check your temperature and pressure values.",
        );
      } else {
        setError(errorMessage);
      }

      console.error("Calculation error:", err);
    } finally {
      setLoading(false);
    }
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
      return undefined;
    }

    const toNumeric = (value: unknown): number | undefined => {
      if (value === undefined || value === null) {
        return undefined;
      }
      const numericValue = Number(value);
      return Number.isFinite(numericValue) ? numericValue : undefined;
    };

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
      // Note: do NOT include specific_volume variations under density here,
      // because density != specific volume. We'll compute 1/v elsewhere.
      density: [
        "density_kg_m3",
        "density",
        "rho",
        "rho_kg_m3",
        "D_kg_m3",
        "density_kg_per_m3",
        "density_kg_m^3",
        "rho_kg_per_m3",
        "Density",
        "DENSITY",
        "D",
        "d",
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

    for (const name of propertyNames) {
      const numericValue = toNumeric(obj[name]);
      if (numericValue !== undefined) {
        return numericValue;
      }
    }

    for (const primaryProperty of propertyNames) {
      for (const [propertyType, variations] of Object.entries(propertyMap)) {
        if (
          primaryProperty.toLowerCase().includes(propertyType.toLowerCase()) ||
          primaryProperty
            .toLowerCase()
            .includes(propertyType.substring(0, 4).toLowerCase())
        ) {
          for (const variation of variations) {
            const numericValue = toNumeric(obj[variation]);
            if (numericValue !== undefined) {
              return numericValue;
            }
          }
        }
      }
    }

    const lowerPrimaryNames = propertyNames.map((name) => name.toLowerCase());
    for (const key of Object.keys(obj)) {
      const lowerKey = key.toLowerCase();
      if (
        lowerPrimaryNames.some((primary) => {
          const base = primary.split("_")[0];
          return lowerKey === primary || (base && lowerKey.includes(base));
        })
      ) {
        const numericValue = toNumeric(obj[key]);
        if (numericValue !== undefined) {
          return numericValue;
        }
      }
    }

    return undefined;
  };

  // Helpers specific to density/specific volume extraction
  const getSpecificVolume = (point?: StatePoint): number | undefined => {
    return (
      getPropertyValue(point, [
        "specific_volume_m3_kg",
        "specific_volume",
        "specific_volume_m3_per_kg",
        "specific_volume_m3kg",
        "specific_volume_m3/kg",
        "v_m3_kg",
        "v",
        "V",
        "V_specific",
        "specific_vol",
        "vol_specific",
        "v_specific",
      ]) ?? undefined
    );
  };

  // Estimate specific gas constant R (J/kg·K) from any points that include P, T, and ρ
  const estimateSpecificGasConstant = (): number | undefined => {
    const sp = results?.state_points;
    if (!sp) return undefined;
    const keys = Object.keys(sp);
    const estimates: number[] = [];
    for (const k of keys) {
      const p_kpa = getPropertyValue(sp[k], ["pressure_kpa", "pressure"]);
      const t_c = getPropertyValue(sp[k], [
        "temperature_c",
        "temp_c",
        "temperature",
      ]);
      const rho =
        getPropertyValue(sp[k], [
          "density_kg_m3",
          "density",
          "rho",
          "rho_kg_m3",
          "density_kg_per_m3",
          "density_kg_m^3",
          "rho_kg_per_m3",
        ]) ??
        (() => {
          const svLoc = getSpecificVolume(sp[k]);
          return svLoc && svLoc !== 0 ? 1 / svLoc : undefined;
        })();
      if (
        p_kpa !== undefined &&
        t_c !== undefined &&
        rho !== undefined &&
        rho !== 0
      ) {
        const P = p_kpa * 1000; // Pa
        const T = t_c + 273.15; // K
        estimates.push(P / (rho * T));
      }
    }
    if (estimates.length === 0) return undefined;
    // Average to smooth numerical noise
    return estimates.reduce((a, b) => a + b, 0) / estimates.length;
  };

  const getDensity = (point?: StatePoint): number | undefined => {
    const direct = getPropertyValue(point, [
      "density_kg_m3",
      "density",
      "rho",
      "rho_kg_m3",
      "density_kg_per_m3",
      "density_kg_m^3",
      "rho_kg_per_m3",
    ]);
    if (direct !== undefined) return direct;

    const sv = getSpecificVolume(point);
    if (sv && sv !== 0) return 1 / sv;

    // Final fallback: estimate using ideal-gas relation with inferred R
    const p_kpa = getPropertyValue(point, ["pressure_kpa", "pressure"]);
    const t_c = getPropertyValue(point, [
      "temperature_c",
      "temp_c",
      "temperature",
    ]);
    const R = estimateSpecificGasConstant();
    if (R !== undefined && p_kpa !== undefined && t_c !== undefined) {
      const P = p_kpa * 1000; // Pa
      const T = t_c + 273.15; // K
      const rhoEst = P / (R * T);
      return isFinite(rhoEst) ? rhoEst : undefined;
    }

    return undefined;
  };

  const getPerformanceValue = (
    perf: any,
    variants: string[],
  ): number | undefined => {
    if (!perf) return undefined;

    const searchExact = (keys: string[]) => {
      for (const key of keys) {
        const val = perf[key];
        if (val !== undefined && val !== null && !isNaN(Number(val))) {
          return Number(val);
        }
      }
      return undefined;
    };

    // 1) Try exact variants
    const exact = searchExact(variants);
    if (exact !== undefined) return exact;

    // 2) Derived fallbacks for common aggregated metrics
    const massKeys = [
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
    ];

    const refrigerationEffectKeys = [
      "refrigeration_effect_kj_kg",
      "refrigeration_effect",
      "refrigeration_effect_kj/kg",
      "refrigeration_effect_kJ_per_kg",
      "refrigeration_capacity_per_kg",
      "q_evap_kj_kg",
    ];

    const workPerMassKeys = [
      "work_of_compression_kj_kg",
      "work_of_compression",
      "compression_work_kj_kg",
      "compression_work",
      "work_kj_kg",
      "w_comp_kj_kg",
    ];

    // get mass flow (kg/s)
    const mass = searchExact(massKeys);

    // If caller asked for cooling/capacity, try refrigeration_effect * mass_flow
    if (
      variants.some((v) => v.toLowerCase().includes("cool")) ||
      variants.some((v) => v.toLowerCase().includes("capacity"))
    ) {
      const refrigerEffect =
        searchExact(refrigerationEffectKeys) ||
        searchExact([
          "refrigeration_capacity_kw",
          "refrigeration_capacity",
          "capacity_per_kg",
        ]);
      if (refrigerEffect !== undefined && mass !== undefined) {
        // refrigerEffect is expected kJ/kg, mass kg/s => kJ/s == kW
        return Number(refrigerEffect) * Number(mass);
      }
    }

    // If caller asked for compressor work, try work_per_mass * mass_flow
    if (
      variants.some((v) => v.toLowerCase().includes("work")) ||
      variants.some((v) => v.toLowerCase().includes("power"))
    ) {
      const workPerMass = searchExact(workPerMassKeys);
      if (workPerMass !== undefined && mass !== undefined) {
        return Number(workPerMass) * Number(mass);
      }

      // also try direct power-like keys
      const powerKeys = [
        "input_power",
        "compressor_power_kw",
        "compressor_power",
        "power",
        "power_kw",
        "input_power_kw",
        "W_comp",
        "W_compressor",
      ];
      const p = searchExact(powerKeys);
      if (p !== undefined) return p;
    }

    // Heat rejection fallback: Q_cond = Q_evap + W_comp
    if (
      variants.some(
        (v) =>
          v.toLowerCase().includes("heat") ||
          v.toLowerCase().includes("rejection"),
      )
    ) {
      const qEvap = getPerformanceValue(perf, [
        "cooling_capacity_kw",
        "cooling_capacity",
        "refrigeration_capacity",
        "Q_evap",
        "refrigeration_effect_kw",
      ]);
      const wComp = getPerformanceValue(perf, [
        "compressor_work_kw",
        "compressor_work",
        "work",
        "power",
      ]);
      if (qEvap !== undefined && wComp !== undefined) return qEvap + wComp;
    }

    // Volumetric flow fallback: volumetric = mass_flow / density
    if (
      variants.some(
        (v) =>
          v.toLowerCase().includes("volumetric") ||
          v.toLowerCase().includes("volume"),
      )
    ) {
      const massFlow = searchExact(massKeys);
      const densityKeys = ["density_kg_m3", "density", "rho", "rho_kg_m3"];
      const density = searchExact(densityKeys);
      if (massFlow !== undefined && density !== undefined && density !== 0) {
        return massFlow / density; // kg/s / kg/m3 => m3/s
      }
    }

    // 3) Case-insensitive key search
    const objKeys = Object.keys(perf);
    for (const key of objKeys) {
      for (const primary of variants) {
        if (
          key.toLowerCase() === primary.toLowerCase() ||
          key.toLowerCase().includes(primary.split("_")[0].toLowerCase())
        ) {
          const val = perf[key];
          if (val !== undefined && val !== null && !isNaN(Number(val))) {
            return Number(val);
          }
        }
      }
    }

    return undefined;
  };

  // Derived flow values for display
  const massFlowRate = results?.performance
    ? getPerformanceValue(results.performance, [
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
      ])
    : undefined;

  const densityAtSuction = results
    ? getDensity(results.state_points?.["1"])
    : undefined;

  const volumetricFlowRate = results?.performance
    ? (getPerformanceValue(results.performance, [
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
      ]) ??
      (massFlowRate !== undefined &&
      densityAtSuction !== undefined &&
      densityAtSuction !== 0
        ? massFlowRate / densityAtSuction
        : undefined))
    : undefined;

  const cycleData = results
    ? {
        points: [
          {
            id: "1",
            name: "Evaporator Outlet",
            temperature:
              getPropertyValue(results.state_points?.["1"], [
                "temperature_c",
                "temp_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["1"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["1"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["1"], [
                "entropy_kj_kgk",
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            specificVolume: getSpecificVolume(results.state_points?.["1"]) || 0,
            density: getDensity(results.state_points?.["1"]),
            quality: getPropertyValue(results.state_points?.["1"], [
              "vapor_quality",
              "quality",
            ]),
            x: 0, // Will be calculated by CycleVisualization
            y: 0,
          },
          {
            id: "2",
            name: "Compressor Outlet",
            temperature:
              getPropertyValue(results.state_points?.["2"], [
                "temperature_c",
                "temp_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["2"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["2"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["2"], [
                "entropy_kj_kgk",
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            specificVolume: getSpecificVolume(results.state_points?.["2"]) || 0,
            density: getDensity(results.state_points?.["2"]),
            quality: getPropertyValue(results.state_points?.["2"], [
              "vapor_quality",
              "quality",
            ]),
            x: 0,
            y: 0,
          },
          {
            id: "3",
            name: "Condenser Outlet",
            temperature:
              getPropertyValue(results.state_points?.["3"], [
                "temperature_c",
                "temp_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["3"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["3"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["3"], [
                "entropy_kj_kgk",
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            specificVolume: getSpecificVolume(results.state_points?.["3"]) || 0,
            density: getDensity(results.state_points?.["3"]),
            quality: getPropertyValue(results.state_points?.["3"], [
              "vapor_quality",
              "quality",
            ]),
            x: 0,
            y: 0,
          },
          {
            id: "4",
            name: "Expansion Valve Outlet",
            temperature:
              getPropertyValue(results.state_points?.["4"], [
                "temperature_c",
                "temp_c",
                "temperature",
              ]) || 0,
            pressure:
              getPropertyValue(results.state_points?.["4"], [
                "pressure_kpa",
                "pressure",
              ]) || 0,
            enthalpy:
              getPropertyValue(results.state_points?.["4"], [
                "enthalpy_kj_kg",
                "enthalpy",
              ]) || 0,
            entropy:
              getPropertyValue(results.state_points?.["4"], [
                "entropy_kj_kgk",
                "entropy_kj_kg_k",
                "entropy",
              ]) || 0,
            specificVolume: getSpecificVolume(results.state_points?.["4"]) || 0,
            density: getDensity(results.state_points?.["4"]),
            quality: getPropertyValue(results.state_points?.["4"], [
              "vapor_quality",
              "quality",
            ]),
            x: 0,
            y: 0,
          },
        ],
        refrigerant: results.refrigerant || formData.refrigerant,
        cycleType: "standard" as const,
        saturationDome: results.saturation_dome,
      }
    : undefined;

  useEffect(() => {
    if (!pendingPresetInputs) {
      return;
    }

    void handleCalculate(pendingPresetInputs);
    setPendingPresetInputs(null);
  }, [handleCalculate, pendingPresetInputs]);

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
              <CardContent
                className="space-y-6"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleCalculate();
                  }
                }}
                aria-label="Cycle parameters form"
              >
                <div>
                  <Label htmlFor="refrigerant">
                    <TechTerm term="refrigerant">Refrigerant</TechTerm>
                  </Label>
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCalculate();
                        }
                      }}
                      className="mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCalculate();
                        }
                      }}
                      className="mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCalculate();
                        }
                      }}
                      className="mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          void handleCalculate();
                        }
                      }}
                      className="mt-1 focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                            <li>Try increasing superheat to 10��C or higher</li>
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
                  onClick={() => void handleCalculate()}
                  disabled={loading}
                  className="w-full focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  size="lg"
                  aria-label="Calculate cycle"
                  aria-busy={loading}
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

                <div className="mt-6">
                  {calculationComplete && (
                    <div
                      role="alert"
                      className="bg-green-50 border border-green-200 rounded-lg mt-4 p-4 w-full relative"
                    >
                      <div className="absolute left-5 top-5 text-foreground">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="text-green-800"
                        >
                          <path d="M21.8 10A10 10 0 1 1 17 3.335" />
                          <path d="m9 11 3 3L22 4" />
                        </svg>
                      </div>
                      <div className="pl-10 text-green-800">
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
                      </div>
                    </div>
                  )}

                  {/* Recommended Operating Range (left column) */}
                  <div
                    className="mt-4 rounded-lg border bg-sky-50 p-4 mb-4"
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 text-sky-700 font-medium">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className="h-4 w-4 text-green-600"
                        >
                          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
                          <polyline points="16 7 22 7 22 13" />
                        </svg>
                        Recommended Operating Range
                      </div>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            evap_temp_c: -46.1,
                            cond_temp_c: 13.9,
                          }))
                        }
                      >
                        Apply Range
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="font-medium">
                          Evaporator Temperature
                        </div>
                        <div className="text-sm">Recommended: -46.1 °C</div>
                        <div className="text-sm text-gray-600">
                          Range: -93.3 °C to -36.1 °C
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Condenser Temperature</div>
                        <div className="text-sm">Recommended: 13.9 °C</div>
                        <div className="text-sm text-gray-600">
                          Range: -16.1 °C to 91.1 °C
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mt-2">
                    {/* Refrigerant Selection Card */}

                    {/* Refrigerant Details and Validation Card */}
                    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
                      <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{
                              backgroundColor: selectedRefrigerant?.color,
                            }}
                          />
                          {selectedRefrigerant
                            ? `${selectedRefrigerant.name} - ${selectedRefrigerant.fullName}`
                            : "Refrigerant"}
                        </h3>
                      </div>

                      <div className="p-6 pt-0 space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-green-500"
                            >
                              <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
                              <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium">
                                <TechTerm term="gwp">GWP</TechTerm>
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedRefrigerant?.globalWarmingPotential ??
                                  selectedRefrigerant?.gwp ??
                                  "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-blue-500"
                            >
                              <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium">
                                <TechTerm term="safety_class">Safety</TechTerm>
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedRefrigerant?.safety ?? "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-red-500"
                            >
                              <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium">
                                <TechTerm term="critical_temperature">
                                  Critical Temperature
                                </TechTerm>
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedRefrigerant?.limits?.critical_temp_c
                                  ? selectedRefrigerant.limits.critical_temp_c.toFixed(
                                      1,
                                    ) + " °C"
                                  : selectedRefrigerant?.limits?.criticalTemp
                                    ? (
                                        selectedRefrigerant.limits
                                          .criticalTemp - 273.15
                                      ).toFixed(1) + " °C"
                                    : "N/A"}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4 text-purple-500"
                            >
                              <path d="m12 14 4-4" />
                              <path d="M3.34 19a10 10 0 1 1 17.32 0" />
                            </svg>
                            <div>
                              <div className="text-sm font-medium">
                                <TechTerm term="critical_pressure">
                                  Critical Pressure
                                </TechTerm>
                              </div>
                              <div className="text-sm text-gray-600">
                                {selectedRefrigerant?.limits
                                  ?.critical_pressure_kpa
                                  ? selectedRefrigerant.limits.critical_pressure_kpa.toFixed(
                                      0,
                                    ) + " kPa"
                                  : selectedRefrigerant?.limits
                                        ?.criticalPressure
                                    ? Math.round(
                                        selectedRefrigerant.limits
                                          .criticalPressure / 1000,
                                      ) + " kPa"
                                    : "N/A"}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-sm text-gray-700">
                            {selectedRefrigerant?.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                {/* Refrigerant Selection (moved here for improved layout) */}
                <EnhancedRefrigerantSelector
                  value={formData.refrigerant}
                  onChange={handleRefrigerantChange}
                  evaporatorTemp={formData.evap_temp_c}
                  condenserTemp={formData.cond_temp_c}
                  onSuggestedRangeApply={(evap, cond) =>
                    setFormData((prev) => ({
                      ...prev,
                      evap_temp_c: evap,
                      cond_temp_c: cond,
                    }))
                  }
                  showDetails={false}
                  className="mt-2"
                />

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
                  <CycleVisualization cycleData={cycleData} />
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
          {showSuccessBanner && results && (
            <Alert
              variant="success"
              className="mb-4 border-emerald-400/70 bg-emerald-50 shadow-sm"
            >
              <CheckCircle className="h-5 w-5" aria-hidden />
              <AlertTitle>Calculation complete</AlertTitle>
              <AlertDescription>
                Outcomes generated with {formData.refrigerant}. Review, rename, or save this scenario to your history.
              </AlertDescription>
            </Alert>
          )}

          <div className="mb-4 flex flex-wrap items-center justify-end gap-2">
            {results && (
              <>
                {matchingCalculation && (
                  <RenameCalculationDialog
                    calculationId={matchingCalculation.id}
                    initialName={matchingCalculation.name ?? undefined}
                    fallbackName={defaultCalculationName}
                    disabled={loading}
                  />
                )}
                <SaveCalculation
                  calculationType="Standard Cycle"
                  inputs={formData}
                  results={results}
                  disabled={loading}
                />
              </>
            )}
          </div>

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
                            getPerformanceValue(results.performance, [
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
                            ]),
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
                            ]),
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-emerald-700">
                          <TechTerm term="cooling_capacity">
                            Cooling Capacity
                          </TechTerm>
                        </div>
                      </div>
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <div className="text-2xl font-bold text-amber-600">
                          {formatValue(
                            getPerformanceValue(results.performance, [
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
                            ]),
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-amber-700">
                          <TechTerm term="compressor_work">
                            Compressor Work
                          </TechTerm>
                        </div>
                      </div>
                      <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg">
                        <div className="text-2xl font-bold text-rose-600">
                          {formatValue(
                            getPerformanceValue(results.performance, [
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
                            ]),
                            "kW",
                          )}
                        </div>
                        <div className="text-sm text-rose-700">
                          <TechTerm term="heat_rejection">
                            Heat Rejection
                          </TechTerm>
                        </div>
                      </div>
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>
                          <TechTerm term="mass_flow_rate">Mass Flow Rate</TechTerm>:
                        </span>
                        <span className="font-mono">
                          {formatValue(
                            getPerformanceValue(results.performance, [
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
                            ]),
                            "kg/s",
                            4,
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>
                          <TechTerm term="volumetric_flow_rate">
                            Volumetric Flow Rate
                          </TechTerm>:
                        </span>
                        <span className="font-mono">
                          {formatValue(volumetricFlowRate, "m³/s", 6)}
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
                        point: results.state_points?.["1"],
                        label: "Point 1 - Evaporator Outlet",
                        colorClass: "text-primary border-l-primary",
                      },
                      {
                        point: results.state_points?.["2"],
                        label: "Point 2 - Compressor Outlet",
                        colorClass: "text-rose-600 border-l-rose-600",
                      },
                      {
                        point: results.state_points?.["3"],
                        label: "Point 3 - Condenser Outlet",
                        colorClass: "text-emerald-600 border-l-emerald-600",
                      },
                      {
                        point: results.state_points?.["4"],
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
                            <TechTerm term="temperature">T</TechTerm>:{" "}
                            {formatValue(
                              getPropertyValue(point, [
                                "temperature_c",
                                "temp_c",
                                "temperature",
                              ]),
                              "��C",
                            )}
                          </div>
                          <div>
                            <TechTerm term="pressure">P</TechTerm>:{" "}
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
                                "entropy_kj_kgk",
                                "entropy_kj_kg_k",
                                "entropy",
                              ]),
                              "kJ/kg·K",
                              3,
                            )}
                          </div>
                          <div>
                            <TechTerm term="density">ρ</TechTerm>:{" "}
                            {formatValue(getDensity(point), "kg/m³")}
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
                <EquipmentDiagrams cycleData={cycleData} />
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
