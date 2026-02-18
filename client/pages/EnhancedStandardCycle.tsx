import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Loader2,
  Calculator,
  Eye,
  FileText,
  Wrench,
  Info,
  ArrowRight,
  Download,
} from "lucide-react";
import { apiClient } from "@/lib/api";
import { EnhancedRefrigerantSelector } from "../components/EnhancedRefrigerantSelector";
import { CycleVisualization } from "../components/CycleVisualization";
import { EquipmentDiagrams } from "../components/EquipmentDiagrams";
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
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// Animation Variants
const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};

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
    return saved
      ? JSON.parse(saved)
      : {
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

      setFormData((prev: typeof formData) => {
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
    setFormData((prev: typeof formData) => ({
      ...prev,
      [field]: value,
    }));
    setError(null);
  }, []);

  const handleRefrigerantChange = useCallback(
    (refrigerant: string) => {
      setFormData((prev: typeof formData) => ({ ...prev, refrigerant }));
      const refProps = getRefrigerantById(refrigerant);
      setSelectedRefrigerant(refProps ?? null);

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
      } catch (_) {}
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
    } catch (_e) {
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
          setFormData((prev: typeof formData) => ({
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
      } else if (
        errorMessage.includes("PropsSI") ||
        errorMessage.includes("QT_flash") ||
        errorMessage.includes("Temperature to QT_flash")
      ) {
        // Detect CoolProp QT_flash temperature-range errors and provide actionable guidance
        if (
          errorMessage.includes("Temperature to QT_flash") ||
          errorMessage.includes("QT_flash")
        ) {
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
      const { height } = page.getSize();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      let y = height - 50;
      const fontSize = 12;
      const lineHeight = 15;

      // Title
      page.drawText("Standard Cycle Calculation Report", {
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
      page.drawText("Inputs:", { x: 50, y, size: 14, font: boldFont });
      y -= 20;
      page.drawText(`Refrigerant: ${formData.refrigerant}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Evaporator Temp: ${formData.evap_temp_c}°C`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Condenser Temp: ${formData.cond_temp_c}°C`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Superheat: ${formData.superheat_c}°C`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Subcooling: ${formData.subcooling_c}°C`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= 30;

      // Results
      page.drawText("Key Performance Indicators:", {
        x: 50,
        y,
        size: 14,
        font: boldFont,
      });
      y -= 20;

      const cop = getPerformanceValue(results.performance, ["cop"]);
      const capacity = getPerformanceValue(results.performance, [
        "cooling_capacity_kw",
        "cooling_capacity",
      ]);
      const work = getPerformanceValue(results.performance, [
        "compressor_work_kw",
        "compressor_power",
      ]);

      page.drawText(`COP: ${formatValue(cop, "")}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Cooling Capacity: ${formatValue(capacity, "kW")}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });
      y -= lineHeight;
      page.drawText(`Compressor Work: ${formatValue(work, "kW")}`, {
        x: 50,
        y,
        size: fontSize,
        font,
      });

      // Save
      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes as any], { type: "application/pdf" });
      const link = document.createElement("a");
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
          key.toLowerCase().includes(primary.split("_")[0]?.toLowerCase() ?? "")
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
    <PageContainer
      variant="standard"
      className="animate-in fade-in duration-500 pb-20"
    >
      {/* Command Header */}
      <motion.div
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="glass-panel rounded-2xl p-6 border border-cyan-500/20 mb-8"
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex-1">
            <motion.div variants={fadeInUp} className="flex items-center gap-4 mb-4">
              <Badge
                variant="outline"
                className="px-4 py-1.5 rounded-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px] sm:text-xs"
              >
                <Calculator className="w-3 h-3 mr-2" />
                THERMAL ANALYSIS COMMAND
              </Badge>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <div className="text-xs text-slate-400 font-mono">SYSTEM ONLINE</div>
              </div>
            </motion.div>
            
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight font-mono">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-cyan-300 to-cyan-500">
                ENHANCED STANDARD CYCLE
              </span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg sm:text-xl text-slate-300 mt-4 max-w-2xl leading-relaxed font-light">
              Advanced thermodynamic simulation & analysis with AI‑powered optimization and real‑time visualization.
            </motion.p>
          </div>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3">
            <Button
              variant="neon"
              size="lg"
              onClick={handleExportPDF}
              disabled={!results}
              className="font-mono tracking-wider h-12 px-6"
            >
              <Download className="w-4 h-4 mr-3" />
              EXPORT REPORT
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
          </motion.div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* LEFT SIDEBAR: CONFIGURATION */}
        <div className="xl:col-span-4 space-y-6 xl:sticky xl:top-24">
          <GlassCard variant="command" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
            <div className="p-6 border-b border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
                  >
                    <Calculator className="w-3 h-3 mr-2" />
                    SYSTEM CONFIGURATION
                  </Badge>
                  <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                </div>
                <div className="text-xs text-slate-400 font-mono">PARAMETERS</div>
              </div>
              <p className="text-slate-300 text-sm mt-2">
                Define system parameters and refrigerant selection for thermal analysis.
              </p>
            </div>
            <motion.div variants={fadeInUp} className="p-6 space-y-8">
              {/* 1. Refrigerant */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-sm text-cyan-300 uppercase tracking-wider">REFRIGERANT</Label>
                  <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                </div>
                <div id="refrigerant-selector">
                  <EnhancedRefrigerantSelector
                    value={formData.refrigerant}
                    onChange={handleRefrigerantChange}
                    evaporatorTemp={formData.evap_temp_c}
                    condenserTemp={formData.cond_temp_c}
                    onSuggestedRangeApply={(evap, cond) =>
                      setFormData((prev: typeof formData) => ({
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
                  <div className="text-xs font-mono text-slate-400 flex gap-4 mt-2 px-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-cyan-500" />
                      <span title="Global Warming Potential">
                        GWP: <span className="text-cyan-300">{selectedRefrigerant.gwp}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      <span title="Safety Class">
                        SAFETY: <span className="text-emerald-300">{selectedRefrigerant.safety_class}</span>
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-purple-500" />
                      <span title="Critical Temperature">
                        T_CRIT: <span className="text-purple-300">{selectedRefrigerant.limits.critical_temp_c.toFixed(1)}°C</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Divider */}
              <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent" />

              {/* 2. Temperatures */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-sm text-cyan-300 uppercase tracking-wider">TEMPERATURE PARAMETERS</Label>
                  <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-mono text-xs text-slate-400 uppercase tracking-wider">EVAPORATOR (°C)</Label>
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
                        className="font-mono bg-slate-900/50 border border-cyan-500/30 focus:border-cyan-500 focus:ring-cyan-500/20 text-cyan-300 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-mono text-xs text-slate-400 uppercase tracking-wider">CONDENSER (°C)</Label>
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
                        className="font-mono bg-slate-900/50 border border-purple-500/30 focus:border-purple-500 focus:ring-purple-500/20 text-purple-300 placeholder:text-slate-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. SH / SC */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-mono text-sm text-cyan-300 uppercase tracking-wider">CYCLE REFINEMENT</Label>
                  <div className="w-2 h-2 rounded-full bg-cyan-500/50" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-mono text-xs text-slate-400 uppercase tracking-wider">SUPERHEAT (K)</Label>
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
                      className="font-mono bg-slate-900/50 border border-emerald-500/30 focus:border-emerald-500 focus:ring-emerald-500/20 text-emerald-300 placeholder:text-slate-500"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label className="font-mono text-xs text-slate-400 uppercase tracking-wider">SUBCOOLING (K)</Label>
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
                      className="font-mono bg-slate-900/50 border border-amber-500/30 focus:border-amber-500 focus:ring-amber-500/20 text-amber-300 placeholder:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* AI / Validation Feedback */}
              {formattedAiNotes && !error && (
                <GlassCard variant="default" className="rounded-xl p-1 border border-amber-500/30" glow={true}>
                  <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                      <Info className="h-4 w-4 text-amber-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-mono text-amber-300 uppercase tracking-wider mb-1">AI RECOMMENDATION</p>
                      <p className="text-sm text-slate-300">{formattedAiNotes}</p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {error && (
                <GlassCard variant="default" className="rounded-xl p-1 border border-red-500/30" glow={true}>
                  <div className="p-4 flex items-start gap-3">
                    <div className="p-2 rounded-full bg-red-500/20 border border-red-500/30">
                      <Info className="h-4 w-4 text-red-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-mono text-red-300 uppercase tracking-wider mb-1">INPUT ERROR</p>
                      <p className="text-sm text-slate-300">{error}</p>
                    </div>
                  </div>
                </GlassCard>
              )}

              {validationWarnings.length > 0 && (
                <div className="space-y-3">
                  {validationWarnings.map((warning, i) => (
                    <GlassCard key={i} variant="default" className="rounded-xl p-1 border border-amber-500/30" glow={true}>
                      <div className="p-3 flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-mono text-amber-300 uppercase tracking-wider mb-1">WARNING</p>
                          <p className="text-xs text-slate-300">{warning}</p>
                        </div>
                      </div>
                    </GlassCard>
                  ))}
                </div>
              )}

              {/* Main Action */}
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  variant="neon"
                  size="lg"
                  className="w-full h-14 text-lg font-mono tracking-wider glow-primary hover:glow-primary"
                  onClick={() => handleCalculate()}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      SIMULATING...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-3 h-5 w-5" />
                      EXECUTE SIMULATION
                    </>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </GlassCard>

          {/* Quick Tips / Guide */}
          {!results && (
            <GlassCard variant="data" className="rounded-2xl p-1 border border-purple-500/20" glow={true}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge
                    variant="outline"
                    className="px-3 py-1 rounded-full border-purple-500/50 bg-purple-500/10 text-purple-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
                  >
                    <Info className="w-3 h-3 mr-2" />
                    OPERATIONAL GUIDANCE
                  </Badge>
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-purple-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-purple-300 uppercase tracking-wider mb-1">SELECT REFRIGERANT FIRST</p>
                      <p className="text-xs text-slate-300">AI‑suggested temperature ranges will appear after selection.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-cyan-300 uppercase tracking-wider mb-1">MAINTAIN SUPERHEAT &gt;5K</p>
                      <p className="text-xs text-slate-300">Protects compressor from liquid slugging and ensures efficiency.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-mono text-emerald-300 uppercase tracking-wider mb-1">OPTIMIZE SUBCOOLING</p>
                      <p className="text-xs text-slate-300">Ensures liquid enters expansion valve for stable cycle operation.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </GlassCard>
          )}
        </div>

        {/* RIGHT MAIN: RESULTS & VISUALIZATION */}
        <div className="xl:col-span-8 space-y-6">
          {!results && !loading ? (
            <GlassCard variant="command" className="rounded-2xl p-1 border border-cyan-500/20 min-h-[500px] flex flex-col items-center justify-center" glow={true}>
              <div className="relative p-12 text-center">
                {/* Animated Grid Background */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] opacity-30" />
                
                {/* Central Icon */}
                <div className="relative z-10">
                  <div className="w-32 h-32 rounded-full border-2 border-cyan-500/30 flex items-center justify-center mb-8 mx-auto">
                    <div className="w-24 h-24 rounded-full border border-cyan-500/20 flex items-center justify-center">
                      <Calculator className="h-16 w-16 text-cyan-400" />
                    </div>
                  </div>
                  
                  {/* Status Indicators */}
                  <div className="flex justify-center gap-6 mb-8">
                    {[
                      { label: "SYSTEM READY", color: "bg-emerald-500" },
                      { label: "PARAMETERS VALID", color: "bg-cyan-500" },
                      { label: "AI OPTIMIZED", color: "bg-purple-500" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${item.color} animate-pulse`} />
                        <div className="text-xs text-slate-400 font-mono">{item.label}</div>
                      </div>
                    ))}
                  </div>
                  
                  <h3 className="text-3xl sm:text-4xl font-bold text-cyan-300 mb-4 font-mono tracking-tight">
                    AWAITING SIMULATION COMMAND
                  </h3>
                  <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
                    Configure thermal parameters on the left and execute simulation to generate comprehensive thermodynamic analysis with AI‑powered optimization.
                  </p>
                  
                  {/* Animated Pulse */}
                  <motion.div
                    className="mt-8 w-64 h-1 mx-auto bg-gradient-to-r from-transparent via-cyan-500 to-transparent rounded-full"
                    animate={{ opacity: [0.3, 1, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>
              </div>
            </GlassCard>
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
                  color="text-cyan-600 dark:text-cyan-400"
                  bg="bg-cyan-50 dark:bg-cyan-900/20"
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
              <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="w-full justify-start border-b border-cyan-500/20 rounded-none h-auto p-0 bg-transparent gap-8">
                  <TabTrigger
                    value="visualization"
                    label="Visualization"
                    icon={<Eye className="w-4 h-4" />}
                  />
                  <TabTrigger
                    value="results"
                    label="Detailed Data"
                    icon={<FileText className="w-4 h-4" />}
                  />
                  <TabTrigger
                    value="equipment"
                    label="Equipment"
                    icon={<Wrench className="w-4 h-4" />}
                  />
                  <TabTrigger
                    value="professional"
                    label="Professional"
                    icon={<ArrowRight className="w-4 h-4" />}
                  />
                </TabsList>

                <div className="mt-6 min-h-[500px]">
                  <TabsContent value="visualization" className="m-0">
                    <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
                      <div className="p-0 rounded-xl overflow-hidden">
                        {cycleData && (
                          <CycleVisualization cycleData={cycleData} />
                        )}
                      </div>
                    </GlassCard>
                  </TabsContent>

                  <TabsContent value="results" className="m-0">
                    <GlassCard variant="data" className="rounded-2xl p-1 border border-cyan-500/20" glow={true}>
                      <div className="p-6 border-b border-cyan-500/20">
                        <div className="flex items-center justify-between mb-4">
                          <Badge
                            variant="outline"
                            className="px-3 py-1 rounded-full border-cyan-500/50 bg-cyan-500/10 text-cyan-400 backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px]"
                          >
                            <FileText className="w-3 h-3 mr-2" />
                            STATE POINT ANALYSIS
                          </Badge>
                          <div className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                        </div>
                        <h3 className="text-2xl font-bold text-cyan-300 font-mono">
                          THERMODYNAMIC STATE POINTS
                        </h3>
                        <p className="text-slate-300 text-sm mt-2">
                          Properties at each key point in the refrigeration cycle.
                        </p>
                      </div>
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {[1, 2, 3, 4].map((pointId) => {
                            const pt =
                              results.state_points?.[pointId.toString()];
                            if (!pt) return null;

                            return (
                              <div
                                key={pointId}
                                className={`rounded-xl p-4 border border-cyan-500/20 bg-slate-900/30 backdrop-blur-sm`}>
                                <div className="font-semibold text-lg mb-2 flex justify-between">
                                  <span>Point {pointId}</span>
                                  <Badge variant="outline">
                                    {pointId === 1
                                      ? "Evap Out"
                                      : pointId === 2
                                        ? "Comp Out"
                                        : pointId === 3
                                          ? "Cond Out"
                                          : "Exp Out"}
                                  </Badge>
                                </div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">
                                      Temperature
                                    </span>
                                    <span>
                                      {formatValue(
                                        getPropertyValue(pt, [
                                          "temp_c",
                                          "temperature",
                                        ]),
                                        "°C",
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">
                                      Pressure
                                    </span>
                                    <span>
                                      {formatValue(
                                        (getPropertyValue(pt, [
                                          "pressure",
                                          "pressure_kpa",
                                        ]) || 0) / 1000,
                                        "MPa",
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">
                                      Enthalpy
                                    </span>
                                    <span>
                                      {formatValue(
                                        getPropertyValue(pt, [
                                          "enthalpy",
                                          "enthalpy_kj_kg",
                                        ]),
                                        "kJ/kg",
                                      )}
                                    </span>
                                  </div>
                                  <div className="flex justify-between border-b pb-1 border-dashed">
                                    <span className="text-muted-foreground">
                                      Entropy
                                    </span>
                                    <span>
                                      {formatValue(
                                        getPropertyValue(pt, [
                                          "entropy",
                                          "entropy_kj_kgk",
                                        ]),
                                        "kJ/kg·K",
                                        3,
                                      )}
                                    </span>
                                  </div>
                                  {pointId === 4 && (
                                    <div className="flex justify-between border-b pb-1 border-dashed">
                                      <span className="text-muted-foreground">
                                        Quality
                                      </span>
                                      <span>
                                        {formatValue(
                                          (getPropertyValue(pt, [
                                            "quality",
                                            "vapor_quality",
                                          ]) || 0) * 100,
                                          "%",
                                        )}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <Separator className="my-8" />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div>
                            <h3 className="font-semibold mb-4 text-lg">
                              Mass Flow Analysis
                            </h3>
                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg space-y-3">
                              <div className="flex justify-between items-center">
                                <span>Mass Flow Rate</span>
                                <span className="font-mono font-bold text-lg">
                                  {formatValue(massFlowRate, "kg/s", 4)}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span>Volumetric Flow (Suction)</span>
                                <span className="font-mono font-bold text-lg">
                                  {formatValue(volumetricFlowRate, "m³/s", 5)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </GlassCard>
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
              <Loader2 className="w-12 h-12 animate-spin text-cyan-500" />
              <p className="text-lg text-muted-foreground">
                Simulating thermodynamic cycle...
              </p>
            </div>
          )}
        </div>
      </div>

      {showOnboarding && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-2xl w-full shadow-2xl">
            <CardHeader className="border-b bg-muted/20">
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-cyan-600" />
                Welcome to HVAC-R Platform
                <Badge variant="outline" className="ml-auto">
                  Screen {onboardingStep + 1} / 4
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {/* Reusing existing onboarding content logic here for simplicity, but wrapped nicely */}
              {onboardingStep === 0 && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-3xl">
                    🚀
                  </div>
                  <h3 className="text-xl font-bold">Your New Superpower</h3>
                  <p className="text-muted-foreground">
                    Designed for Engineers, Technicians, and Managers. Simulate,
                    Analyze, and Report in seconds.
                  </p>
                </div>
              )}
              {onboardingStep === 1 && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-3xl">
                    ⚙️
                  </div>
                  <h3 className="text-xl font-bold">How it Works</h3>
                  <p className="text-muted-foreground">
                    1. Select Refrigerant
                    <br />
                    2. Input Temps
                    <br />
                    3. Get Visualizations
                  </p>
                </div>
              )}
              {onboardingStep === 2 && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center text-3xl">
                    📊
                  </div>
                  <h3 className="text-xl font-bold">Professional Reports</h3>
                  <p className="text-muted-foreground">
                    Export PDF reports for your clients or save calculations to
                    your project history.
                  </p>
                </div>
              )}
              {onboardingStep === 3 && (
                <div className="text-center space-y-4">
                  <div className="mx-auto w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center text-3xl">
                    ✨
                  </div>
                  <h3 className="text-xl font-bold">Let's Get Started!</h3>
                  <Button
                    onClick={() => {
                      localStorage.setItem(
                        "hvac_platform_onboarding_completed",
                        "true",
                      );
                      setShowOnboarding(false);
                    }}
                    className="w-full"
                  >
                    Start Calculating
                  </Button>
                </div>
              )}
            </CardContent>
            {onboardingStep < 3 && (
              <div className="p-4 border-t bg-muted/20 flex justify-between">
                <Button
                  variant="ghost"
                  onClick={() => setShowOnboarding(false)}
                >
                  Skip
                </Button>
                <Button onClick={() => setOnboardingStep((s) => s + 1)}>
                  Next
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
    </PageContainer>
  );
}

// Sub-components helpers
function KPI({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}) {
  // Map color to variant
  const variant = color.includes('cyan') ? 'warning' : 
                  color.includes('emerald') ? 'success' : 
                  color.includes('cyan') ? 'highlight' : 
                  color.includes('red') ? 'destructive' : 'info';
  
  return (
    <GlassCard variant="data" className="rounded-xl p-1 border border-cyan-500/20" glow={true}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">{title}</span>
          <div className="p-2 rounded-lg bg-slate-900/50 border border-cyan-500/20">
            {icon}
          </div>
        </div>
        <div className={`text-3xl font-bold tracking-tight font-mono ${
          variant === 'warning' ? 'text-amber-300' :
          variant === 'success' ? 'text-emerald-300' :
          variant === 'highlight' ? 'text-cyan-300' :
          variant === 'destructive' ? 'text-red-300' :
          'text-slate-300'
        }`}>
          {value}
        </div>
        <div className="mt-2 h-1 w-12 rounded-full bg-gradient-to-r from-cyan-500 to-transparent" />
      </div>
    </GlassCard>
  );
}

function TabTrigger({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:border-b-2 data-[state=active]:border-cyan-500 data-[state=active]:text-cyan-300 data-[state=active]:font-bold rounded-none px-6 py-3 bg-transparent text-slate-400 hover:text-cyan-300 transition-all font-mono tracking-wider uppercase text-sm border-b-2 border-transparent"
    >
      <div className="flex items-center gap-3">
        <div className="data-[state=active]:text-cyan-400 text-slate-500">
          {icon}
        </div>
        {label}
      </div>
    </TabsTrigger>
  );
}
// Standalone page version with header and footer
export function EnhancedStandardCycle() {
  return <EnhancedStandardCycleContent />;
}
