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
  Download,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { EnhancedRefrigerantSelector } from "../components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "../components/CycleVisualization";
import { EquipmentDiagrams } from "../components/EquipmentDiagrams";
import { TechnicalTooltip, TechTerm } from "../components/TechnicalTooltip";
import { SaveCalculation } from "../components/SaveCalculation";
import { RenameCalculationDialog } from "../components/RenameCalculationDialog";
import { ProfessionalFeatures } from "../components/ProfessionalFeatures";
import { useOllamaRecommendedRange } from "@/hooks/useOllamaRecommendedRange";
import { useSupabaseCalculations } from "../hooks/useSupabaseCalculations";
import { consumeCalculationPreset } from "@/lib/historyPresets";
import { PageContainer } from "../components/PageContainer";
import {
  RefrigerantProperties,
  validateCycleConditions,
  getRefrigerantById,
} from "../lib/refrigerants";
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

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
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("standard_cycle_inputs");
    return saved ? JSON.parse(saved) : {
      refrigerant: "",
      evap_temp_c: -10,
      cond_temp_c: 45,
      superheat_c: 5,
      subcooling_c: 2,
    };



  });

  useEffect(() => {
    localStorage.setItem("standard_cycle_inputs", JSON.stringify(formData));
  }, [formData]);

  const [results, setResults] = useState<CalculationResults | null>(null);
  const {
    data: aiRange,
    loading: aiLoading,
    error: aiError,
    refresh: refreshAi,
  } = useOllamaRecommendedRange(formData.refrigerant, { auto: true });
  const formattedAiNotes = useMemo(() => {
    // Produce a concise one-line summary with a short explanation
    if (!aiRange) return null;
    const parts: string[] = [];
    if (aiRange.evap_temp_c != null)
      parts.push(`Evap ${aiRange.evap_temp_c}°C`);
    if (aiRange.cond_temp_c != null)
      parts.push(`Cond ${aiRange.cond_temp_c}°C`);
    if (aiRange.superheat_c != null) parts.push(`SH ${aiRange.superheat_c}°C`);
    if (aiRange.subcooling_c != null)
      parts.push(`SC ${aiRange.subcooling_c}°C`);
    const suffix = "Good starting point — adjust for ambient and load.";
    if (parts.length > 0) return `${parts.join(" • ")} • ${suffix}`;

    const raw = aiRange.notes;
    if (!raw || typeof raw !== "string") return suffix;
    let s = raw.trim();
    // remove code fences and JSON fragments
    s = s
      .replace(/```+/g, "")
      .replace(/^`+|`+$/g, "")
      .trim();
    // take first sentence-ish up to 120 chars
    const cleaned = s.replace(/\s+/g, " ").trim();
    if (cleaned.length === 0) return suffix;
    const first = cleaned.length > 120 ? `${cleaned.slice(0, 120)}…` : cleaned;
    return `${first} — ${suffix}`;
  }, [aiRange]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  const [selectedRefrigerant, setSelectedRefrigerant] =
    useState<RefrigerantProperties | null>(null);
  const [activeTab, setActiveTab] = useState("calculation");
  const [calculationComplete, setCalculationComplete] = useState(false);
  const { saveCalculation, findMatchingCalculation } =
    useSupabaseCalculations();
  const [showOnboarding, setShowOnboarding] = useState(() => {
    // Show onboarding for first-time users
    return !localStorage.getItem("hvac_platform_onboarding_completed");
  });
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [showSuccessBanner, setShowSuccessBanner] = useState(false);
  const [pendingPresetInputs, setPendingPresetInputs] = useState<Partial<
    typeof formData
  > | null>(null);

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
      try {
        refreshAi();
      } catch (_) { }
    },
    [
      formData.evap_temp_c,
      formData.cond_temp_c,
      formData.superheat_c,
      formData.subcooling_c,
      refreshAi,
    ],
  );

  const validateInputs = useCallback(() => {
    // Basic logical checks
    if (!formData.refrigerant) {
      setError("Please select a refrigerant before calculating the cycle.");
      return false;
    }

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

    // Validate against refrigerant-specific limits when available
    if (selectedRefrigerant && selectedRefrigerant.limits) {
      const limits = selectedRefrigerant.limits;

      if (formData.evap_temp_c < limits.min_temp_c) {
        setError(
          `Evaporator temperature ${formData.evap_temp_c}°C is below the supported limit for ${selectedRefrigerant.name} (${limits.min_temp_c.toFixed(1)}°C). Please increase the evaporator temperature or choose a different refrigerant.`,
        );
        return false;
      }

      if (formData.cond_temp_c > limits.max_temp_c) {
        setError(
          `Condenser temperature ${formData.cond_temp_c}°C exceeds the supported maximum for ${selectedRefrigerant.name} (${limits.max_temp_c.toFixed(1)}°C). Please lower the condenser temperature or select a refrigerant rated for higher temperatures.`,
        );
        return false;
      }

      // Protect against two-phase queries above critical point (e.g., CO2/transcritical)
      if (formData.cond_temp_c > limits.critical_temp_c) {
        // For CO2 (R744) specifically, this means transcritical operation which requires different handling
        if (selectedRefrigerant.id === "R744") {
          setError(
            `Condenser temperature ${formData.cond_temp_c}°C is above the critical temperature for ${selectedRefrigerant.name} (${limits.critical_temp_c.toFixed(2)}°C). Transcritical operation is not supported by the current calculation mode. Consider using the Cascade or Transcritical analysis workflow, or lower the condenser temperature to below the critical temperature.`,
          );
          return false;
        }

        // Generic refrigerant — disallow two-phase lookups above critical temperature
        setError(
          `Condenser temperature ${formData.cond_temp_c}°C is above the critical temperature (${limits.critical_temp_c.toFixed(1)}°C) for ${selectedRefrigerant.name}. Two-phase property lookups will be invalid. Please adjust temperatures.`,
        );
        return false;
      }
    }

    // All checks passed
    setError(null);
    return true;
  }, [formData, selectedRefrigerant]);

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
      const responseData = await apiClient.calculateStandardCycle({
        refrigerant: requestBody.refrigerant,
        evaporatorTemp: requestBody.evap_temp_c,
        condenserTemp: requestBody.cond_temp_c,
        superheat: requestBody.superheat_c,
        subcooling: requestBody.subcooling_c,
      });

      if (!responseData.success && !responseData.data && responseData.error) {
        throw new Error(responseData.error);
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
      } else if (errorMessage.includes("PropsSI") || errorMessage.includes("QT_flash") || errorMessage.includes("Temperature to QT_flash")) {
        // Detect CoolProp QT_flash temperature-range errors and provide actionable guidance
        if (errorMessage.includes("Temperature to QT_flash") || errorMessage.includes("QT_flash")) {
          setError(
            "Thermodynamic property error: A two-phase property lookup was attempted outside the valid temperature range for the selected refrigerant (e.g., above critical temperature). Please review your evaporator/condenser temperatures, select a different refrigerant, or use a transcritical/cascade workflow if appropriate.",
          );
        } else {
          setError(
            "CoolProp calculation error: The specified operating conditions may be outside the valid range for this refrigerant. Please check your temperature and pressure values.",
          );
        }
      } else {
        setError(errorMessage);
      }

      console.error("Calculation error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!results) return;

    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { width, height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 50;
      const fontSize = 12;
      const lineHeight = 15;

      // Title
      page.drawText('Standard Cycle Calculation Report', {
        x: 50,
        y,
        size: 18,
        font: boldFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      // Date
      page.drawText(`Date: ${new Date().toLocaleString()}`, {
        x: 50,
        y,
        size: 10,
        font,
      });
      y -= 20;

      // Inputs
      page.drawText('Inputs:', { x: 50, y, size: 14, font: boldFont });
      y -= 20;
      page.drawText(`Refrigerant: ${formData.refrigerant}`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Evaporator Temp: ${formData.evap_temp_c}°C`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Condenser Temp: ${formData.cond_temp_c}°C`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Superheat: ${formData.superheat_c}°C`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Subcooling: ${formData.subcooling_c}°C`, { x: 50, y, size: fontSize, font });
      y -= 30;

      // Results
      page.drawText('Key Performance Indicators:', { x: 50, y, size: 14, font: boldFont });
      y -= 20;

      const cop = getPerformanceValue(results.performance, ['cop']);
      const capacity = getPerformanceValue(results.performance, ['cooling_capacity_kw', 'cooling_capacity']);
      const work = getPerformanceValue(results.performance, ['compressor_work_kw', 'compressor_power']);

      page.drawText(`COP: ${formatValue(cop, '')}`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Cooling Capacity: ${formatValue(capacity, 'kW')}`, { x: 50, y, size: fontSize, font });
      y -= lineHeight;
      page.drawText(`Compressor Work: ${formatValue(work, 'kW')}`, { x: 50, y, size: fontSize, font });

      // Save
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `calculation-report-${Date.now()}.pdf`;
      link.click();

    } catch (err) {
      console.error("Failed to generate PDF", err);
      setError("Failed to generate PDF report");
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

    // If caller asked for cooling/capacity
    if (
      variants.some((v) => v.toLowerCase().includes("cool")) ||
      variants.some((v) => v.toLowerCase().includes("capacity"))
    ) {
      // Direct derived: mass * ref_effect
      const refrigerEffect =
        searchExact(refrigerationEffectKeys) ||
        searchExact([
          "refrigeration_capacity_kw",
          "refrigeration_capacity",
          "capacity_per_kg",
        ]);
      if (refrigerEffect !== undefined && mass !== undefined) {
        return Number(refrigerEffect) * Number(mass);
      }

      // Fallback: Calculate from Heat Rejection & COP if available
      // Q_cool = Q_heat * COP / (COP + 1)
      const qHeat = searchExact([
        "heat_rejection_kw",
        "heat_rejection",
        "Q_cond",
      ]);
      const cop = searchExact(["cop", "coefficient_of_performance"]);

      if (qHeat !== undefined && cop !== undefined && cop !== 0) {
        // Prevent division by zero mathematically, though COP usually > 0
        return (qHeat * cop) / (cop + 1);
      }
    }

    // If caller asked for compressor work
    if (
      variants.some((v) => v.toLowerCase().includes("work")) ||
      variants.some((v) => v.toLowerCase().includes("power"))
    ) {
      // Direct derived: mass * work_per_mass
      const workPerMass = searchExact(workPerMassKeys);
      if (workPerMass !== undefined && mass !== undefined) {
        return Number(workPerMass) * Number(mass);
      }

      // check direct power keys
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

      // Fallback: Calculate from Heat Rejection & COP if available
      // W_comp = Q_heat / (COP + 1)
      const qHeat = searchExact([
        "heat_rejection_kw",
        "heat_rejection",
        "Q_cond",
      ]);
      const cop = searchExact(["cop", "coefficient_of_performance"]);

      if (qHeat !== undefined && cop !== undefined && cop !== -1) {
        return qHeat / (cop + 1);
      }
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
    <PageContainer variant="standard" className="animate-in fade-in duration-500 pb-20">

      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
            Enhanced Standard Cycle
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Advanced thermodynamic simulation & analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={!results}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Report
          </Button>
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
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: CONFIGURATION */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">
          <Card className="border-t-4 border-t-blue-500 shadow-lg dark:bg-slate-900/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-blue-500" />
                Configuration
              </CardTitle>
              <CardDescription>
                Define system parameters and refrigerant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 1. Refrigerant */}
              <div className="space-y-3">
                <Label>Refrigerant</Label>
                <div id="refrigerant-selector">
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
                    aiRange={aiRange}
                    aiLoading={aiLoading}
                    aiError={aiError}
                    showDetails={false}
                  />
                </div>
                {/* Selected Refrigerant Specs Mini-View */}
                {selectedRefrigerant && (
                  <div className="text-xs text-muted-foreground flex gap-3 mt-1 px-1">
                    <span title="Global Warming Potential">
                      GWP: {selectedRefrigerant.gwp}
                    </span>
                    <span title="Safety Class">
                      Safety: {selectedRefrigerant.safety_class}
                    </span>
                    <span title="Critical Temperature">
                      T_crit:{" "}
                      {selectedRefrigerant.limits.critical_temp_c.toFixed(1)}
                      °C
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* 2. Temperatures */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sky-600 dark:text-sky-400">
                    Evaporator (°C)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.evap_temp_c}
                      onChange={(e) =>
                        handleInputChange(
                          "evap_temp_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-background/50 border-sky-200 dark:border-sky-800 focus:border-sky-500"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-rose-600 dark:text-rose-400">
                    Condenser (°C)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      value={formData.cond_temp_c}
                      onChange={(e) =>
                        handleInputChange(
                          "cond_temp_c",
                          parseFloat(e.target.value),
                        )
                      }
                      className="bg-background/50 border-rose-200 dark:border-rose-800 focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* 3. SH / SC */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Superheat (K)</Label>
                  <Input
                    type="number"
                    value={formData.superheat_c}
                    onChange={(e) =>
                      handleInputChange(
                        "superheat_c",
                        parseFloat(e.target.value),
                      )
                    }
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Subcooling (K)</Label>
                  <Input
                    type="number"
                    value={formData.subcooling_c}
                    onChange={(e) =>
                      handleInputChange(
                        "subcooling_c",
                        parseFloat(e.target.value),
                      )
                    }
                    min={0}
                  />
                </div>
              </div>

              {/* AI / Validation Feedback */}
              {formattedAiNotes && !error && (
                <Alert className="bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <AlertDescription className="text-xs text-blue-800 dark:text-blue-300">
                    {formattedAiNotes}
                  </AlertDescription>
                </Alert>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Input Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {validationWarnings.length > 0 && (
                <div className="space-y-2">
                  {validationWarnings.map((warning, i) => (
                    <Alert key={i} className="border-amber-200 bg-amber-50">
                      <AlertTitle className="text-amber-800 text-xs font-semibold">
                        Warning
                      </AlertTitle>
                      <AlertDescription className="text-amber-700 text-xs">
                        {warning}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Main Action */}
              <Button
                className="w-full h-12 text-lg font-semibold shadow-xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                onClick={() => handleCalculate()}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-5 w-5" />
                    Run Simulation
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Quick Tips / Guide */}
          {!results && (
            <Card className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-900 dark:to-slate-800 border-none">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4 text-indigo-500" /> Pro Tips
                </h3>
                <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                  <li>Select a refrigerant first to get AI-suggested ranges.</li>
                  <li>
                    Ensure Superheat is sufficient (&gt;5K) to protect the
                    compressor.
                  </li>
                  <li>
                    Subcooling ensures liquid enters the expansion valve.
                  </li>
                </ul>
              </CardContent>
            </Card>
          )}
        </div>

        {/* RIGHT MAIN: RESULTS & VISUALIZATION */}
        <div className="xl:col-span-8 space-y-6">
          {!results && !loading ? (
            <div className="min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed rounded-xl bg-muted/20 text-muted-foreground">
              <div className="p-6 bg-background rounded-full shadow-lg mb-6">
                <Calculator className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to Simulate</h3>
              <p className="max-w-md text-center">
                Configure your cycle parameters on the left and click "Run
                Simulation" to generate comprehensive thermodynamic analysis.
              </p>
            </div>
          ) : results ? (
            <div className="animate-in slide-in-from-bottom-5 duration-700 space-y-6">
              {/* 1. Key Performance Indicators (Cards) */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPI
                  title="Cooling Capacity"
                  value={formatValue(
                    getPerformanceValue(results.performance, [
                      "cooling_capacity_kw",
                      "cooling_capacity",
                    ]),
                    "kW",
                  )}
                  icon={<div className="text-2xl">❄️</div>}
                  color="text-blue-600 dark:text-blue-400"
                  bg="bg-blue-50 dark:bg-blue-900/20"
                />
                <KPI
                  title="COP"
                  value={formatValue(
                    getPerformanceValue(results.performance, ["cop"]),
                    "",
                  )}
                  icon={<div className="text-2xl">📈</div>}
                  color="text-emerald-600 dark:text-emerald-400"
                  bg="bg-emerald-50 dark:bg-emerald-900/20"
                />
                <KPI
                  title="Compressor Work"
                  value={formatValue(
                    getPerformanceValue(results.performance, [
                      "compressor_work_kw",
                    ]),
                    "kW",
                  )}
                  icon={<div className="text-2xl">⚡</div>}
                  color="text-amber-600 dark:text-amber-400"
                  bg="bg-amber-50 dark:bg-amber-900/20"
                />
                <KPI
                  title="Heat Rejection"
                  value={formatValue(
                    getPerformanceValue(results.performance, [
                      "heat_rejection_kw",
                    ]),
                    "kW",
                  )}
                  icon={<div className="text-2xl">🔥</div>}
                  color="text-rose-600 dark:text-rose-400"
                  bg="bg-rose-50 dark:bg-rose-900/20"
                />
              </div>

              {/* 2. Main Content Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-transparent gap-6">
                  <TabTrigger value="visualization" label="Visualization" icon={<Eye className="w-4 h-4" />} />
                  <TabTrigger value="results" label="Detailed Data" icon={<FileText className="w-4 h-4" />} />
                  <TabTrigger value="equipment" label="Equipment" icon={<Wrench className="w-4 h-4" />} />
                  <TabTrigger value="professional" label="Professional" icon={<ArrowRight className="w-4 h-4" />} />
                </TabsList>

                <div className="mt-6 min-h-[500px]">
                  <TabsContent value="visualization" className="m-0">
                    <Card className="border-none shadow-none bg-transparent">
                      <CardContent className="p-0">
                        {cycleData && <CycleVisualization cycleData={cycleData} />}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="results" className="m-0">
                    <Card className="dark:bg-slate-900">
                      <CardHeader>
                        <CardTitle>Thermodynamic State Points</CardTitle>
                        <CardDescription>
                          Properties at each key point in the cycle
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[1, 2, 3, 4].map((pointId) => {
                            const pt = results.state_points?.[pointId.toString()];
                            if (!pt) return null;
                            const colors = {
                              1: "blue",
                              2: "red",
                              3: "green",
                              4: "amber"
                            }[pointId] || "gray";

                            return (
                              <div key={pointId} className={`border rounded-lg p-4 border-l-4 border-l-${colors}-500 bg-background/50`}>
                                <div className="font-semibold text-lg mb-2 flex justify-between">
                                  <span>Point {pointId}</span>
                                  <Badge variant="outline">{pointId === 1 ? 'Evap Out' : pointId === 2 ? 'Comp Out' : pointId === 3 ? 'Cond Out' : 'Exp Out'}</Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">Temperature</span>
                                    <span>{formatValue(getPropertyValue(pt, ["temp_c", "temperature"]), "°C")}</span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">Pressure</span>
                                    <span>{formatValue((getPropertyValue(pt, ["pressure", "pressure_kpa"]) || 0) / 1000, "MPa")}</span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">Enthalpy</span>
                                    <span>{formatValue(getPropertyValue(pt, ["enthalpy", "enthalpy_kj_kg"]), "kJ/kg")}</span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">Entropy</span>
                                    <span>{formatValue(getPropertyValue(pt, ["entropy", "entropy_kj_kgk"]), "kJ/kg·K", 3)}</span>
                                  </div>
                                  {pointId === 4 && (
                                    <div className="flex justify-between border-b pb-1 border-dashed">
                                      <span className="text-muted-foreground">Quality</span>
                                      <span>{formatValue((getPropertyValue(pt, ["quality", "vapor_quality"]) || 0) * 100, "%")}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        <Separator className="my-8" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="font-semibold mb-4 text-lg">Mass Flow Analysis</h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                              <div className="flex justify-between items-center">
                                <span>Mass Flow Rate</span>
                                <span className="font-mono font-bold text-lg">{formatValue(massFlowRate, "kg/s", 4)}</span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Volumetric Flow (Suction)</span>
                                <span className="font-mono font-bold text-lg">{formatValue(volumetricFlowRate, "m³/s", 5)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="equipment" className="m-0">
                    <EquipmentDiagrams cycleData={cycleData} />
                  </TabsContent>

                  <TabsContent value="professional" className="m-0">
                    <ProfessionalFeatures
                      cycleData={cycleData}
                      results={results}
                      refrigerant={formData.refrigerant}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-20 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
              <p className="text-lg text-muted-foreground">Simulating thermodynamic cycle...</p>
            </div>
          )}
        </div>
      </div>




      {
        showOnboarding && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <Card className="max-w-2xl w-full shadow-2xl">
              <CardHeader className="border-b bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  Welcome to HVAC-R Platform
                  <Badge variant="outline" className="ml-auto">Screen {onboardingStep + 1} / 4</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Reusing existing onboarding content logic here for simplicity, but wrapped nicely */}
                {onboardingStep === 0 && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-3xl">🚀</div>
                    <h3 className="text-xl font-bold">Your New Superpower</h3>
                    <p className="text-muted-foreground">Designed for Engineers, Technicians, and Managers. Simulate, Analyze, and Report in seconds.</p>
                  </div>
                )}
                {onboardingStep === 1 && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">⚙️</div>
                    <h3 className="text-xl font-bold">How it Works</h3>
                    <p className="text-muted-foreground">1. Select Refrigerant<br />2. Input Temps<br />3. Get Visualizations</p>
                  </div>
                )}
                {onboardingStep === 2 && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">📊</div>
                    <h3 className="text-xl font-bold">Professional Reports</h3>
                    <p className="text-muted-foreground">Export PDF reports for your clients or save calculations to your project history.</p>
                  </div>
                )}
                {onboardingStep === 3 && (
                  <div className="text-center space-y-4">
                    <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl">✨</div>
                    <h3 className="text-xl font-bold">Let's Get Started!</h3>
                    <Button onClick={() => {
                      localStorage.setItem("hvac_platform_onboarding_completed", "true");
                      setShowOnboarding(false);
                    }} className="w-full">Start Calculating</Button>
                  </div>
                )}
              </CardContent>
              {onboardingStep < 3 && (
                <div className="p-4 border-t bg-muted/20 flex justify-between">
                  <Button variant="ghost" onClick={() => setShowOnboarding(false)}>Skip</Button>
                  <Button onClick={() => setOnboardingStep(s => s + 1)}>Next</Button>
                </div>
              )}
            </Card>
          </div>
        )
      }
    </PageContainer >
  );
}



// Sub-components helpers
function KPI({ title, value, icon, color, bg }: { title: string; value: string; icon: React.ReactNode; color: string; bg: string }) {
  return (
    <div className={`p-4 rounded-xl border ${bg} transition-all hover:scale-105 duration-200`}>
      <div className={`flex items-start justify-between mb-2 ${color}`}>
        <span className="font-medium text-sm text-foreground/80">{title}</span>
        {icon}
      </div>
      <div className={`text-2xl font-bold tracking-tight ${color}`}>{value}</div>
    </div>
  )
}

function TabTrigger({ value, label, icon }: { value: string; label: string; icon: React.ReactNode }) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none px-4 py-2 bg-transparent text-muted-foreground hover:text-foreground transition-all"
    >
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
    </TabsTrigger>
  )
}
// Standalone page version with header and footer
export function EnhancedStandardCycle() {
  return <EnhancedStandardCycleContent />;
}
