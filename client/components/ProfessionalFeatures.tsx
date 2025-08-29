import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Calculator,
  DollarSign,
  Leaf,
  TrendingUp,
  FileText,
  Download,
  Settings,
  Globe,
  BarChart3,
  Zap,
  Shield,
  AlertTriangle,
  Info,
  CheckCircle,
  Users,
  Building,
  Briefcase,
  Target,
} from "lucide-react";

interface ProfessionalFeaturesProps {
  cycleData?: any;
  results?: any;
  refrigerant?: string;
}

interface UnitSystem {
  temperature: string;
  pressure: string;
  enthalpy: string;
  power: string;
  flow: string;
}

const UNIT_SYSTEMS: Record<string, UnitSystem> = {
  SI: {
    temperature: "°C",
    pressure: "kPa",
    enthalpy: "kJ/kg",
    power: "kW",
    flow: "kg/s",
  },
  Imperial: {
    temperature: "°F",
    pressure: "psi",
    enthalpy: "BTU/lb",
    power: "hp",
    flow: "lb/hr",
  },
};

export function ProfessionalFeatures({
  cycleData,
  results,
  refrigerant = "R134a",
}: ProfessionalFeaturesProps) {
  // Safety wrapper to prevent crashes from undefined values
  const safeToFixed = (value: any, decimals: number = 2): string => {
    if (value === undefined || value === null || isNaN(Number(value))) {
      return "N/A";
    }
    return Number(value).toFixed(decimals);
  };
  const [unitSystem, setUnitSystem] = useState<"SI" | "Imperial">("SI");
  const [reportConfig, setReportConfig] = useState({
    includeCalculations: true,
    includeDiagrams: true,
    includeEquipment: true,
    includeCostAnalysis: true,
    companyName: "",
    projectName: "",
    engineerName: "",
    reportNotes: "",
  });
  const [costAnalysis, setCostAnalysis] = useState({
    electricityRate: 0.12, // $/kWh
    operatingHours: 8760, // hours/year
    equipmentLife: 15, // years
    maintenanceCostPercent: 3, // % of initial cost
    initialCost: 50000, // $
  });

  // Unit conversion functions
  const convertTemperature = (temp: number, fromSI: boolean = true): number => {
    if (unitSystem === "SI") return temp;
    return fromSI ? (temp * 9) / 5 + 32 : ((temp - 32) * 5) / 9;
  };

  const convertPressure = (
    pressure: number,
    fromSI: boolean = true,
  ): number => {
    if (unitSystem === "SI") return pressure;
    return fromSI ? pressure * 0.145038 : pressure / 0.145038; // kPa to psi
  };

  const convertEnthalpy = (
    enthalpy: number,
    fromSI: boolean = true,
  ): number => {
    if (unitSystem === "SI") return enthalpy;
    return fromSI ? enthalpy * 0.429923 : enthalpy / 0.429923; // kJ/kg to BTU/lb
  };

  const convertPower = (power: number, fromSI: boolean = true): number => {
    if (unitSystem === "SI") return power;
    return fromSI ? power * 1.34102 : power / 1.34102; // kW to hp
  };

  const formatValue = (
    value: number | undefined,
    unit: string,
    decimals: number = 2,
  ): string => {
    if (value === undefined || value === null || isNaN(value))
      return `N/A ${unit}`;
    return `${value.toFixed(decimals)} ${unit}`;
  };

  // Enhanced refrigerant sustainability analysis
  const getRefrigerantSustainability = (refrigerant: string) => {
    const sustainabilityData: Record<string, any> = {
      R134a: {
        gwp: 1430,
        odp: 0,
        phaseOut: "2024-2030",
        alternative: "R1234yf, R513A",
      },
      R410A: {
        gwp: 2088,
        odp: 0,
        phaseOut: "2025-2030",
        alternative: "R32, R454B",
      },
      R22: {
        gwp: 1810,
        odp: 0.055,
        phaseOut: "2020 (banned)",
        alternative: "R410A, R32",
      },
      R32: {
        gwp: 675,
        odp: 0,
        phaseOut: "None",
        alternative: "Current best practice",
      },
      R290: {
        gwp: 3,
        odp: 0,
        phaseOut: "None",
        alternative: "Natural refrigerant",
      },
      R744: {
        gwp: 1,
        odp: 0,
        phaseOut: "None",
        alternative: "Natural refrigerant",
      },
      R1234yf: {
        gwp: 4,
        odp: 0,
        phaseOut: "None",
        alternative: "HFO refrigerant",
      },
      R513A: { gwp: 631, odp: 0, phaseOut: "None", alternative: "HFO blend" },
    };

    return (
      sustainabilityData[refrigerant] || {
        gwp: "Unknown",
        odp: "Unknown",
        phaseOut: "Check regulations",
        alternative: "Consult manufacturer",
      }
    );
  };

  const getPerfVal = (perf: any, variants: string[]): number | undefined => {
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

    // 1) exact
    const exact = searchExact(variants);
    if (exact !== undefined) return exact;

    // 2) derived fallbacks
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
      "q_evap_kj_kg",
      "refrigeration_capacity_per_kg",
    ];

    const workPerMassKeys = [
      "work_of_compression_kj_kg",
      "work_of_compression",
      "compression_work_kj_kg",
      "compression_work",
      "work_kj_kg",
      "w_comp_kj_kg",
    ];

    const powerKeys = [
      "compressor_power_kw",
      "compressor_power",
      "power",
      "power_kw",
      "input_power",
      "input_power_kw",
      "W_comp",
      "W_compressor",
    ];

    const mass = searchExact(massKeys);

    // cooling -> refrigeration_effect * mass
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
        return refrigerEffect * mass; // kJ/kg * kg/s = kW
      }
    }

    // compressor work -> work_per_mass * mass or power keys
    if (
      variants.some((v) => v.toLowerCase().includes("work")) ||
      variants.some((v) => v.toLowerCase().includes("power"))
    ) {
      const workPerMass = searchExact(workPerMassKeys);
      if (workPerMass !== undefined && mass !== undefined)
        return workPerMass * mass;
      const p = searchExact(powerKeys);
      if (p !== undefined) return p;
    }

    // heat rejection -> q_evap + w_comp
    if (
      variants.some(
        (v) =>
          v.toLowerCase().includes("heat") ||
          v.toLowerCase().includes("rejection"),
      )
    ) {
      const qEvap = getPerfVal(perf, [
        "cooling_capacity_kw",
        "cooling_capacity",
        "refrigeration_capacity",
        "Q_evap",
        "refrigeration_effect_kw",
      ]);
      const wComp = getPerfVal(perf, [
        "compressor_work_kw",
        "compressor_work",
        "work",
        "power",
      ]);
      if (qEvap !== undefined && wComp !== undefined) return qEvap + wComp;
    }

    // 3) case-insensitive search
    const objKeys = Object.keys(perf || {});
    for (const key of objKeys) {
      for (const primary of variants) {
        if (
          key.toLowerCase() === primary.toLowerCase() ||
          key.toLowerCase().includes(primary.split("_")[0].toLowerCase())
        ) {
          const val = perf[key];
          if (val !== undefined && val !== null && !isNaN(Number(val)))
            return Number(val);
        }
      }
    }

    return undefined;
  };

  const coolingCapacityKwNum = getPerfVal(results?.performance, [
    "cooling_capacity_kw",
    "cooling_capacity",
    "capacity",
    "capacity_kw",
    "Q_evap",
    "Q_evaporator",
    "refrigeration_effect_kw",
    "refrigeration_capacity",
    "cooling_load",
    "evap_capacity",
    "q_evap_kw",
    "cooling_power",
    "evaporator_capacity",
  ]);

  const compressorWorkKwNum = getPerfVal(results?.performance, [
    "compressor_work_kw",
    "compressor_work",
    "work",
    "work_kw",
    "power",
    "W_comp",
    "compressor_power_kw",
    "input_power",
    "mechanical_power",
  ]);

  const cop =
    getPerfVal(results?.performance, [
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
    ]) || 0;

  // Cost and ROI calculations
  const calculateCostAnalysis = () => {
    if (!results?.performance) return null;

    const powerConsumption = compressorWorkKwNum || 0;
    const annualEnergyConsumption =
      powerConsumption * costAnalysis.operatingHours; // kWh/year
    const annualEnergyCost =
      annualEnergyConsumption * costAnalysis.electricityRate; // $/year
    const lifetimeEnergyCost = annualEnergyCost * costAnalysis.equipmentLife;
    const annualMaintenanceCost =
      costAnalysis.initialCost * (costAnalysis.maintenanceCostPercent / 100);
    const totalLifetimeCost =
      costAnalysis.initialCost +
      lifetimeEnergyCost +
      annualMaintenanceCost * costAnalysis.equipmentLife;

    const efficiency = cop > 0 ? (cop / 6) * 100 : 0; // Relative to theoretical max

    return {
      annualEnergyConsumption,
      annualEnergyCost,
      lifetimeEnergyCost,
      annualMaintenanceCost,
      totalLifetimeCost,
      efficiency,
      paybackPeriod:
        powerConsumption > 0 ? costAnalysis.initialCost / annualEnergyCost : 0,
    };
  };

  const costData = calculateCostAnalysis();
  const sustainabilityData = getRefrigerantSustainability(refrigerant);

  // Generate fully server-side PDF report
  const generateReport = async () => {
    try {
      // Capture the main diagram canvas image (high resolution)
      let diagramDataUrl: string | null = null;
      try {
        // Choose the most likely candidate canvas: visible canvas with the largest pixel area
        const canvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
        const valid = canvases.filter((c) => c && c.width > 0 && c.height > 0);
        let srcCanvas: HTMLCanvasElement | null = null;
        if (valid.length === 1) {
          srcCanvas = valid[0];
        } else if (valid.length > 1) {
          srcCanvas = valid.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b));
        } else if (canvases.length > 0) {
          srcCanvas = canvases[0] as HTMLCanvasElement;
        }

        if (srcCanvas) {
          // Ensure the browser has a chance to finish any pending rendering
          await new Promise(requestAnimationFrame);

          const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
          const off = document.createElement('canvas');
          off.width = Math.max(1, Math.floor(srcCanvas.width * scale));
          off.height = Math.max(1, Math.floor(srcCanvas.height * scale));

          // Use willReadFrequently where available to improve readback
          const ctx = off.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
          if (ctx) {
            ctx.scale(scale, scale);
            // Keep smoothing on for nicer output when scaling
            (ctx as any).imageSmoothingEnabled = true;
            ctx.drawImage(srcCanvas, 0, 0);
            try {
              diagramDataUrl = off.toDataURL('image/png');
            } catch (e) {
              console.warn('offscreen toDataURL failed, falling back to source canvas toDataURL', e);
              try {
                diagramDataUrl = srcCanvas.toDataURL('image/png');
              } catch (e2) {
                console.warn('source canvas toDataURL also failed', e2);
                diagramDataUrl = null;
              }
            }
          } else {
            try {
              diagramDataUrl = srcCanvas.toDataURL('image/png');
            } catch (e) {
              console.warn('source canvas toDataURL failed', e);
              diagramDataUrl = null;
            }
          }
        }
      } catch (e) {
        console.warn('Error capturing diagram canvas', e);
        diagramDataUrl = null;
      }

      const payload = {
        reportConfig,
        results,
        cycleData,
        costAnalysis: costData,
        sustainability: sustainabilityData,
        diagramDataUrl,
        refrigerant,
        unitSystem,
        recommendations: generateRecommendations(),
      };

      const token = localStorage.getItem('simulateon_token');
      // Debug logging
      console.log('[client] POST /api/reports/generate', { payload: {...payload, diagramDataUrl: diagramDataUrl ? '[IMAGE]' : null}, tokenPresent: !!token });

      const resp = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        let txt = '';
        try {
          txt = await resp.clone().text();
        } catch (e) {
          try {
            const j = await resp.clone().json();
            txt = JSON.stringify(j);
          } catch (e2) {
            txt = resp.statusText || String(resp.status);
          }
        }
        console.error('Server PDF generation failed', resp.status, txt);

        // If endpoint is missing (404) fallback to client-side printable HTML PDF
        if (resp.status === 404) {
          console.warn('Server PDF endpoint missing, falling back to client-side printable report');

          // Build printable HTML (same as previous client-side generator)
          const headerTitle = reportConfig.projectName || 'Refrigeration Cycle Analysis Report';
          const now = new Date();
          const diagramHtml = (reportConfig.includeDiagrams && diagramDataUrl) ? `<div class='section'><h2 style='font-size:16px;margin:0 0 8px;color:#0f172a'>Cycle Diagram</h2><div class='diagram'><img src='${diagramDataUrl}' style='max-width:100%;height:auto;border:1px solid #e6eefc;border-radius:6px' /></div></div>` : '';

          const html = `<!doctype html><html><head><meta charset='utf-8'><title>${headerTitle}</title>
          <meta name='viewport' content='width=device-width,initial-scale=1' />
          <style>
            body{font-family:Inter, Arial, Helvetica, sans-serif;color:#0f172a;margin:0;padding:20px;background:#f8fafc}
            .page{max-width:900px;margin:0 auto;background:#fff;padding:28px;border-radius:8px;box-shadow:0 8px 30px rgba(13,38,59,0.08)}
            h1{font-size:22px;margin:0 0 6px;color:#0b5fff}
            .meta{color:#475569;font-size:13px;margin-bottom:12px}
            .section{margin-top:18px}
            .metrics{display:flex;gap:12px;flex-wrap:wrap}
            .metric{background:#f1f5f9;padding:10px;border-radius:8px;flex:1;min-width:140px}
            .metric h3{margin:0;font-size:12px;color:#334155}
            .metric p{margin:6px 0 0;font-weight:700;font-size:18px;color:#0f172a}
            .diagram{margin-top:12px;text-align:center}
            .notes{background:#f8fafc;padding:12px;border-radius:8px;margin-top:12px}
            table{width:100%;border-collapse:collapse;margin-top:8px}
            th,td{padding:8px;border-bottom:1px solid #e2e8f0;text-align:left}
            footer{font-size:12px;color:#64748b;margin-top:18px}
            @media print{body{background:white} .page{box-shadow:none;border-radius:0}}
          </style>
          </head><body>
          <div class='page'>
            <h1>${headerTitle}</h1>
            <div class='meta'>Project: ${reportConfig.projectName || '-'} &nbsp;|&nbsp; Company: ${reportConfig.companyName || '-'} &nbsp;|&nbsp; Engineer: ${reportConfig.engineerName || '-'} &nbsp;|&nbsp; Date: ${now.toLocaleString()}</div>

            <div class='section'>
              <h2 style='font-size:16px;margin:0 0 8px;color:#0f172a'>Executive Summary</h2>
              <div class='notes'>${reportConfig.reportNotes ? reportConfig.reportNotes.replace(/\n/g,'<br/>') : 'No additional notes provided.'}</div>
            </div>

            <div class='section'>
              <h2 style='font-size:16px;margin:0 0 8px;color:#0f172a'>Key Performance Metrics</h2>
              <div class='metrics'>
                <div class='metric'><h3>COP</h3><p>${cop?.toFixed(2) || 'N/A'}</p></div>
                <div class='metric'><h3>Cooling Capacity (kW)</h3><p>${formatValue(coolingCapacityKwNum, 'kW')}</p></div>
                <div class='metric'><h3>Compressor Work (kW)</h3><p>${formatValue(compressorWorkKwNum, 'kW')}</p></div>
              </div>
            </div>

            ${diagramHtml}

            <div class='section'>
              <h2 style='font-size:16px;margin:0 0 8px;color:#0f172a'>Cost Analysis</h2>
              <table>
                <tbody>
                  <tr><th>Annual Energy Cost</th><td>$${costData?.annualEnergyCost?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><th>Total Lifetime Cost</th><td>$${costData?.totalLifetimeCost?.toFixed(2) || 'N/A'}</td></tr>
                  <tr><th>Payback Period (years)</th><td>${costData?.paybackPeriod?.toFixed(1) || 'N/A'}</td></tr>
                </tbody>
              </table>
            </div>

            <div class='section'>
              <h2 style='font-size:16px;margin:0 0 8px;color:#0f172a'>Sustainability & Recommendations</h2>
              <table>
                <tbody>
                  <tr><th>GWP</th><td>${sustainabilityData.gwp}</td></tr>
                  <tr><th>ODP</th><td>${sustainabilityData.odp}</td></tr>
                  <tr><th>Recommended Alternatives</th><td>${sustainabilityData.alternative}</td></tr>
                </tbody>
              </table>
              <div style='margin-top:12px'><strong>Recommendations:</strong><ul>${generateRecommendations().map(r=>`<li>${r}</li>`).join('')}</ul></div>
            </div>

            <footer>Generated by SimulateOn Professional HVAC Analysis Platform • ${now.toLocaleString()}</footer>
          </div>
          <script>window.onload = function(){ setTimeout(function(){ window.print(); }, 250); };</script>
          </body></html>`;

          const w = window.open('', '_blank');
          if (!w) {
            window.alert('Popup blocked. Please allow popups to generate PDF.');
            return;
          }
          w.document.open();
          w.document.write(html);
          w.document.close();

          return;
        }

        window.alert('Failed to generate PDF: ' + (txt || resp.statusText));
        return;
      }

      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportConfig.projectName || 'hvac-report'}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate server PDF', e);
      window.alert('Failed to generate server PDF: ' + (e as any).message);
    }
  };

  // Export data as a human-friendly CSV (instead of raw JSON)
  const exportData = () => {
    try {
      const rows: string[] = [];
      const pushKV = (k: string, v: any) => rows.push(`"${k.replace(/"/g,'""')}","${String(v ?? '').replace(/"/g,'""')}"`);

      pushKV('Project', reportConfig.projectName || '');
      pushKV('Company', reportConfig.companyName || '');
      pushKV('Engineer', reportConfig.engineerName || '');
      pushKV('Generated At', new Date().toISOString());
      pushKV('Unit System', unitSystem);

      // Summary metrics
      pushKV('COP', cop ?? '');
      pushKV('Cooling Capacity (kW)', coolingCapacityKwNum ?? '');
      pushKV('Compressor Work (kW)', compressorWorkKwNum ?? '');

      // Cost
      if (costData) {
        pushKV('Annual Energy Cost', costData.annualEnergyCost ?? '');
        pushKV('Total Lifetime Cost', costData.totalLifetimeCost ?? '');
        pushKV('Payback Period (years)', costData.paybackPeriod ?? '');
      }

      // Sustainability
      pushKV('GWP', sustainabilityData.gwp ?? '');
      pushKV('ODP', sustainabilityData.odp ?? '');
      pushKV('Recommended Alternatives', sustainabilityData.alternative ?? '');

      // Cycle points
      if (cycleData?.points && Array.isArray(cycleData.points)) {
        rows.push('"--- Cycle Points ---",""');
        cycleData.points.forEach((p: any, idx: number) => {
          pushKV(`Point ${idx + 1} - Temperature (${UNIT_SYSTEMS[unitSystem].temperature})`, convertTemperature(p.temperature));
          pushKV(`Point ${idx + 1} - Pressure (${UNIT_SYSTEMS[unitSystem].pressure})`, convertPressure(p.pressure));
          pushKV(`Point ${idx + 1} - Enthalpy (${UNIT_SYSTEMS[unitSystem].enthalpy})`, convertEnthalpy(p.enthalpy));
        });
      }

      // Recommendations
      rows.push('"--- Recommendations ---",""');
      generateRecommendations().forEach((r) => pushKV('Recommendation', r));

      const csv = 'Key,Value\n' + rows.join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${reportConfig.projectName || 'hvac-data'}-export.csv`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Export Data: CSV download started');
    } catch (e) {
      console.error('Export Data (CSV) failed', e);
      window.alert('Export failed: ' + (e as any).message);
    }
  };

  // Chart package: create an HTML package with embedded SVG summary charts, data tables and diagram image (if present)
  const downloadChartPackage = async () => {
    const project = reportConfig.projectName || 'hvac-project';

    // Capture diagram canvas (best-effort)
    let diagramDataUrl: string | null = null;
    try {
      const canvases = Array.from(document.querySelectorAll('canvas')) as HTMLCanvasElement[];
      const valid = canvases.filter((c) => c && c.width > 0 && c.height > 0);
      let srcCanvas: HTMLCanvasElement | null = null;
      if (valid.length === 1) srcCanvas = valid[0];
      else if (valid.length > 1) srcCanvas = valid.reduce((a, b) => (a.width * a.height > b.width * b.height ? a : b));
      else if (canvases.length > 0) srcCanvas = canvases[0];

      if (srcCanvas) {
        await new Promise(requestAnimationFrame);
        const scale = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
        const off = document.createElement('canvas');
        off.width = Math.max(1, Math.floor(srcCanvas.width * scale));
        off.height = Math.max(1, Math.floor(srcCanvas.height * scale));
        const ctx = off.getContext('2d', { willReadFrequently: true } as any) as CanvasRenderingContext2D | null;
        if (ctx) {
          ctx.scale(scale, scale);
          (ctx as any).imageSmoothingEnabled = true;
          ctx.drawImage(srcCanvas, 0, 0);
          try {
            diagramDataUrl = off.toDataURL('image/png');
          } catch (e) {
            try {
              diagramDataUrl = srcCanvas.toDataURL('image/png');
            } catch (e2) {
              diagramDataUrl = null;
            }
          }
        } else {
          try {
            diagramDataUrl = srcCanvas.toDataURL('image/png');
          } catch (e) {
            diagramDataUrl = null;
          }
        }
      }
    } catch (e) {
      console.warn('Chart package: failed to capture diagram canvas', e);
      diagramDataUrl = null;
    }

    // Simple SVG generator for a metric bar chart
    const makeBarSVG = (label: string, value: number | undefined, max: number) => {
      const val = value ?? 0;
      const w = Math.max(1, Math.round((val / max) * 300));
      const svg = `<?xml version="1.0"?><svg xmlns='http://www.w3.org/2000/svg' width='380' height='80'>
        <rect x='10' y='10' width='360' height='60' rx='6' fill='#fff'/>
        <text x='20' y='30' font-size='12' fill='#111' font-family='Inter, Arial'>${label}</text>
        <rect x='20' y='40' width='340' height='18' rx='4' fill='#e6eefc'/>
        <rect x='20' y='40' width='${w}' height='18' rx='4' fill='#2563eb'/>
        <text x='360' y='52' font-size='11' fill='#111' text-anchor='end'>${(val ?? 0).toFixed(2)}</text>
      </svg>`;
      return svg;
    };

    const maxMetric = Math.max(1, (coolingCapacityKwNum || 1), (compressorWorkKwNum || 1), cop || 1);

    const svg1 = makeBarSVG('Cooling Capacity (kW)', coolingCapacityKwNum, maxMetric);
    const svg2 = makeBarSVG('Compressor Work (kW)', compressorWorkKwNum, maxMetric);
    const svg3 = makeBarSVG('COP', cop, maxMetric);

    const diagramSection = diagramDataUrl ? `<div class='card'><h3>Diagram</h3><div><img src='${diagramDataUrl}' style='max-width:100%;height:auto;border-radius:6px;border:1px solid #e6eefc' /></div></div>` : '';

    const html = `<!doctype html><html><head><meta charset='utf-8'><title>${project} - Chart Package</title>
    <style>body{font-family:Inter,Arial,Helvetica,sans-serif;padding:20px;background:#f8fafc} .card{background:#fff;padding:16px;border-radius:8px;box-shadow:0 6px 20px rgba(13,38,59,0.06);margin-bottom:16px}</style>
    </head><body>
    <h1>${project} - Chart Package</h1>
    <div class='card'><h3>Summary Metrics</h3>
      <div>${svg1}</div>
      <div style='margin-top:8px'>${svg2}</div>
      <div style='margin-top:8px'>${svg3}</div>
    </div>
    ${diagramSection}
    <div class='card'><h3>Key Data</h3>
      <pre>${JSON.stringify({ header: { project: reportConfig.projectName, company: reportConfig.companyName, engineer: reportConfig.engineerName }, performance: results?.performance || {}, costAnalysis: costData, sustainability: sustainabilityData }, null, 2)}</pre>
    </div>
    <div class='card'><h3>Recommendations</h3><ul>${generateRecommendations().map(r=>`<li>${r}</li>`).join('')}</ul></div>
    <footer style='font-size:12px;color:#6b7280;margin-top:20px'>Generated: ${new Date().toLocaleString()}</footer>
    </body></html>`;

    try {
      const blob = new Blob([html], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project}-chart-package.html`;
      a.click();
      URL.revokeObjectURL(url);
      console.log('Chart package download started');
    } catch (e) {
      console.error('Chart package generation failed', e);
      window.alert('Chart package generation failed: ' + (e as any).message);
    }
  };

  const generateRecommendations = () => {
    const recommendations = [];

    if (cop) {
      if (cop < 2.5) {
        recommendations.push(
          "Consider system optimization - COP is below industry average",
        );
      } else if (cop > 4.0) {
        recommendations.push(
          "Excellent system efficiency - consider this design for similar applications",
        );
      }
    }

    if (sustainabilityData.gwp > 1000) {
      recommendations.push(
        `High GWP refrigerant - consider alternatives: ${sustainabilityData.alternative}`,
      );
    }

    if (costData && costData.efficiency < 70) {
      recommendations.push(
        "System efficiency below optimal - review component sizing and selection",
      );
    }

    return recommendations.length > 0
      ? recommendations
      : ["System performance within acceptable parameters"];
  };

  const getApplicationRecommendations = () => {
    const applications = {
      R134a:
        "Commercial refrigeration, automotive AC, medium temperature applications",
      R410A:
        "Residential/commercial AC, heat pumps, medium pressure applications",
      R22: "Legacy systems only - phase-out complete in most regions",
      R32: "Split AC systems, heat pumps, residential applications",
      R290: "Domestic refrigeration, small commercial units, natural alternative",
      R744: "Commercial refrigeration, heat pumps, transcritical systems",
      R1234yf: "Automotive AC, low GWP alternative to R134a",
      R513A: "Centrifugal chillers, medium pressure applications",
    };

    return (
      applications[refrigerant] ||
      "Consult manufacturer for specific applications"
    );
  };

  return (
    <div className="space-y-6">
      {/* Professional Dashboard Header */}
      <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-3 text-xl">
            <Building className="h-6 w-6 text-blue-600" />
            Professional HVAC Analysis Platform
            <Badge variant="outline" className="ml-auto">
              Enterprise Grade
            </Badge>
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center p-3 bg-white rounded-lg border">
              <Users className="h-5 w-5 mx-auto text-blue-600 mb-1" />
              <div className="text-sm font-semibold">For Technicians</div>
              <div className="text-xs text-muted-foreground">
                Field Analysis
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Calculator className="h-5 w-5 mx-auto text-green-600 mb-1" />
              <div className="text-sm font-semibold">For Engineers</div>
              <div className="text-xs text-muted-foreground">
                Design & Analysis
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Briefcase className="h-5 w-5 mx-auto text-purple-600 mb-1" />
              <div className="text-sm font-semibold">For Directors</div>
              <div className="text-xs text-muted-foreground">
                Strategic Planning
              </div>
            </div>
            <div className="text-center p-3 bg-white rounded-lg border">
              <Target className="h-5 w-5 mx-auto text-orange-600 mb-1" />
              <div className="text-sm font-semibold">For Entrepreneurs</div>
              <div className="text-xs text-muted-foreground">
                Business Intelligence
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="units" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="units" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Units
          </TabsTrigger>
          <TabsTrigger
            value="sustainability"
            className="flex items-center gap-2"
          >
            <Leaf className="h-4 w-4" />
            Sustainability
          </TabsTrigger>
          <TabsTrigger value="cost" className="flex items-center gap-2">
            <DollarSign className="h-4 w-4" />
            Cost Analysis
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Dynamic Unit Conversion */}
        <TabsContent value="units">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Unit System Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Unit System</Label>
                  <Select
                    value={unitSystem}
                    onValueChange={(value: "SI" | "Imperial") =>
                      setUnitSystem(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SI">SI (Metric) Units</SelectItem>
                      <SelectItem value="Imperial">
                        Imperial (US) Units
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold">Current Unit System:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      Temperature: {UNIT_SYSTEMS[unitSystem].temperature}
                    </div>
                    <div>Pressure: {UNIT_SYSTEMS[unitSystem].pressure}</div>
                    <div>Enthalpy: {UNIT_SYSTEMS[unitSystem].enthalpy}</div>
                    <div>Power: {UNIT_SYSTEMS[unitSystem].power}</div>
                    <div>Flow Rate: {UNIT_SYSTEMS[unitSystem].flow}</div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    <span className="font-semibold text-blue-800">
                      Real-time Conversion
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    All values throughout the application automatically convert
                    to your selected unit system. Changes apply instantly to
                    calculations, visualizations, and reports.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Current Results (Converted)</CardTitle>
              </CardHeader>
              <CardContent>
                {results?.performance ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Cooling Capacity
                        </span>
                        <div className="font-semibold">
                          {formatValue(
                            coolingCapacityKwNum !== undefined
                              ? convertPower(coolingCapacityKwNum)
                              : (undefined as any),
                            UNIT_SYSTEMS[unitSystem].power,
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-sm text-muted-foreground">
                          Compressor Work
                        </span>
                        <div className="font-semibold">
                          {formatValue(
                            compressorWorkKwNum !== undefined
                              ? convertPower(compressorWorkKwNum)
                              : (undefined as any),
                            UNIT_SYSTEMS[unitSystem].power,
                          )}
                        </div>
                      </div>
                    </div>

                    {cycleData?.points && (
                      <div className="mt-4">
                        <h4 className="font-semibold mb-2">State Points</h4>
                        <div className="space-y-2">
                          {cycleData.points
                            .slice(0, 2)
                            .map((point: any, index: number) => (
                              <div
                                key={index}
                                className="text-sm flex justify-between"
                              >
                                <span>Point {index + 1}:</span>
                                <span>
                                  {formatValue(
                                    convertTemperature(point.temperature),
                                    UNIT_SYSTEMS[unitSystem].temperature,
                                  )}
                                  ,
                                  {formatValue(
                                    convertPressure(point.pressure),
                                    UNIT_SYSTEMS[unitSystem].pressure,
                                  )}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run a calculation to see converted values
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sustainability Analysis */}
        <TabsContent value="sustainability">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Leaf className="h-5 w-5" />
                  Environmental Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {sustainabilityData.gwp}
                    </div>
                    <div className="text-sm text-red-700">
                      Global Warming Potential
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {sustainabilityData.gwp > 1000
                        ? "High Impact"
                        : sustainabilityData.gwp > 500
                          ? "Medium Impact"
                          : "Low Impact"}
                    </div>
                  </div>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {sustainabilityData.odp}
                    </div>
                    <div className="text-sm text-blue-700">
                      Ozone Depletion Potential
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {sustainabilityData.odp > 0
                        ? "Ozone Depleting"
                        : "Ozone Safe"}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <span className="font-semibold">Regulatory Status:</span>
                    <div className="text-sm text-muted-foreground">
                      {sustainabilityData.phaseOut}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">
                      Recommended Alternatives:
                    </span>
                    <div className="text-sm text-muted-foreground">
                      {sustainabilityData.alternative}
                    </div>
                  </div>
                  <div>
                    <span className="font-semibold">Typical Applications:</span>
                    <div className="text-sm text-muted-foreground">
                      {getApplicationRecommendations()}
                    </div>
                  </div>
                </div>

                {sustainabilityData.gwp > 1000 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <span className="font-semibold text-yellow-800">
                        Regulatory Alert
                      </span>
                    </div>
                    <p className="text-sm text-yellow-700 mt-1">
                      This refrigerant has a high GWP and may be subject to
                      phase-out regulations. Consider transitioning to lower-GWP
                      alternatives for future-proofing.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sustainability Recommendations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {generateRecommendations().map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}

                <Separator className="my-4" />

                <div className="space-y-2">
                  <h4 className="font-semibold">Energy Efficiency Tips:</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Optimize superheat and subcooling settings</li>
                    <li>• Regular maintenance reduces energy consumption</li>
                    <li>• Consider variable speed drives for compressors</li>
                    <li>• Implement heat recovery systems where applicable</li>
                    <li>• Monitor and adjust operating pressures seasonally</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cost Analysis */}
        <TabsContent value="cost">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Cost Analysis Parameters
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="electricity-rate">
                      Electricity Rate ($/kWh)
                    </Label>
                    <Input
                      id="electricity-rate"
                      type="number"
                      step="0.01"
                      value={costAnalysis.electricityRate}
                      onChange={(e) =>
                        setCostAnalysis((prev) => ({
                          ...prev,
                          electricityRate: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="operating-hours">
                      Operating Hours/Year
                    </Label>
                    <Input
                      id="operating-hours"
                      type="number"
                      value={costAnalysis.operatingHours}
                      onChange={(e) =>
                        setCostAnalysis((prev) => ({
                          ...prev,
                          operatingHours: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipment-life">
                      Equipment Life (years)
                    </Label>
                    <Input
                      id="equipment-life"
                      type="number"
                      value={costAnalysis.equipmentLife}
                      onChange={(e) =>
                        setCostAnalysis((prev) => ({
                          ...prev,
                          equipmentLife: parseInt(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="initial-cost">Initial Cost ($)</Label>
                    <Input
                      id="initial-cost"
                      type="number"
                      value={costAnalysis.initialCost}
                      onChange={(e) =>
                        setCostAnalysis((prev) => ({
                          ...prev,
                          initialCost: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="maintenance-percent">
                    Annual Maintenance (% of initial cost)
                  </Label>
                  <Input
                    id="maintenance-percent"
                    type="number"
                    step="0.1"
                    value={costAnalysis.maintenanceCostPercent}
                    onChange={(e) =>
                      setCostAnalysis((prev) => ({
                        ...prev,
                        maintenanceCostPercent: parseFloat(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>ROI Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                {costData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${costData?.annualEnergyCost?.toFixed(0) || "N/A"}
                        </div>
                        <div className="text-sm text-green-700">
                          Annual Energy Cost
                        </div>
                      </div>
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          {costData?.efficiency?.toFixed(1) || "N/A"}%
                        </div>
                        <div className="text-sm text-blue-700">
                          System Efficiency
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Lifetime Energy Cost:</span>
                        <span className="font-semibold">
                          ${costData?.lifetimeEnergyCost?.toFixed(0) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Annual Maintenance:</span>
                        <span className="font-semibold">
                          $
                          {costData?.annualMaintenanceCost?.toFixed(0) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Lifetime Cost:</span>
                        <span className="font-semibold">
                          ${costData?.totalLifetimeCost?.toFixed(0) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Energy Consumption:</span>
                        <span className="font-semibold">
                          {costData?.annualEnergyConsumption?.toFixed(0) ||
                            "N/A"}{" "}
                          kWh/year
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="font-semibold text-purple-800">
                        Business Impact
                      </div>
                      <div className="text-sm text-purple-700 mt-1">
                        Operating cost represents{" "}
                        {costData?.annualEnergyCost && costAnalysis.initialCost
                          ? (
                              (costData.annualEnergyCost /
                                costAnalysis.initialCost) *
                              100
                            ).toFixed(1)
                          : "N/A"}
                        % of initial investment annually
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Run a calculation to generate cost analysis
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Reports */}
        <TabsContent value="reports">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Report Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input
                      id="company-name"
                      value={reportConfig.companyName}
                      onChange={(e) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          companyName: e.target.value,
                        }))
                      }
                      placeholder="Your Company"
                    />
                  </div>
                  <div>
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={reportConfig.projectName}
                      onChange={(e) =>
                        setReportConfig((prev) => ({
                          ...prev,
                          projectName: e.target.value,
                        }))
                      }
                      placeholder="Project Name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="engineer-name">Engineer Name</Label>
                  <Input
                    id="engineer-name"
                    value={reportConfig.engineerName}
                    onChange={(e) =>
                      setReportConfig((prev) => ({
                        ...prev,
                        engineerName: e.target.value,
                      }))
                    }
                    placeholder="Design Engineer"
                  />
                </div>

                <div>
                  <Label htmlFor="report-notes">Report Notes</Label>
                  <Textarea
                    id="report-notes"
                    value={reportConfig.reportNotes}
                    onChange={(e) =>
                      setReportConfig((prev) => ({
                        ...prev,
                        reportNotes: e.target.value,
                      }))
                    }
                    placeholder="Additional notes for the report..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Include Sections:</Label>
                  <div className="space-y-1">
                    {Object.entries({
                      includeCalculations: "Thermodynamic Calculations",
                      includeDiagrams: "P-h Diagrams & Visualizations",
                      includeEquipment: "Equipment Specifications",
                      includeCostAnalysis: "Cost & ROI Analysis",
                    }).map(([key, label]) => (
                      <label key={key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={
                            reportConfig[
                              key as keyof typeof reportConfig
                            ] as boolean
                          }
                          onChange={(e) =>
                            setReportConfig((prev) => ({
                              ...prev,
                              [key]: e.target.checked,
                            }))
                          }
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Generate Professional Report</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">
                    Professional Report Features
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>✓ Executive summary with key findings</li>
                    <li>✓ Detailed thermodynamic analysis</li>
                    <li>✓ High-resolution P-h diagrams</li>
                    <li>✓ Cost analysis and ROI calculations</li>
                    <li>✓ Sustainability assessment</li>
                    <li>✓ Engineering recommendations</li>
                    <li>✓ Professional formatting</li>
                    <li>✓ Company branding integration</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <Button
                    onClick={generateReport}
                    className="w-full"
                    disabled={!results}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate Professional Report
                  </Button>

                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" disabled={!results} onClick={exportData}>
                      <FileText className="h-4 w-4 mr-1" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm" disabled={!results} onClick={downloadChartPackage}>
                      <BarChart3 className="h-4 w-4 mr-1" />
                      Chart Package
                    </Button>
                  </div>
                </div>

                {!results && (
                  <div className="text-center text-sm text-muted-foreground">
                    Complete a calculation to enable report generation
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Professional Insights */}
        <TabsContent value="recommendations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Professional Engineering Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Performance Insights */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Zap className="h-4 w-4 text-yellow-600" />
                      Performance Optimization
                    </h4>
                    <div className="space-y-2 text-sm">
                      {cop && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          Current COP: {cop?.toFixed(2) || "N/A"}
                          <div className="text-xs text-muted-foreground">
                            {cop > 3.5
                              ? "Excellent efficiency"
                              : cop > 2.5
                                ? "Good efficiency"
                                : "Consider optimization"}
                          </div>
                        </div>
                      )}
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Monitor suction and discharge pressures</li>
                        <li>• Optimize superheat settings (5-15°C)</li>
                        <li>• Ensure proper subcooling (3-7°C)</li>
                        <li>• Regular filter and coil maintenance</li>
                      </ul>
                    </div>
                  </div>

                  {/* Safety Insights */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Shield className="h-4 w-4 text-green-600" />
                      Safety Considerations
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="p-2 bg-green-50 border border-green-200 rounded">
                        Refrigerant: {refrigerant}
                        <div className="text-xs text-muted-foreground">
                          Safety Class:{" "}
                          {sustainabilityData.gwp < 150
                            ? "A1 (Low toxicity)"
                            : "Check ASHRAE classification"}
                        </div>
                      </div>
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Install leak detection systems</li>
                        <li>• Ensure proper ventilation</li>
                        <li>• Regular pressure relief valve testing</li>
                        <li>• Technician safety training required</li>
                      </ul>
                    </div>
                  </div>

                  {/* Business Insights */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Business Intelligence
                    </h4>
                    <div className="space-y-2 text-sm">
                      {costData && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                          Annual Operating Cost: $
                          {costData.annualEnergyCost?.toFixed(0) || "N/A"}
                          <div className="text-xs text-muted-foreground">
                            {(costData.efficiency || 0) > 75
                              ? "Cost-effective operation"
                              : "Consider efficiency upgrades"}
                          </div>
                        </div>
                      )}
                      <ul className="space-y-1 text-muted-foreground">
                        <li>• Plan for refrigerant transitions</li>
                        <li>• Budget for preventive maintenance</li>
                        <li>• Consider energy efficiency incentives</li>
                        <li>• Monitor regulatory changes</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">
                      Component Sizing Recommendations
                    </h4>
                    <div className="space-y-2 text-sm">
                      {results?.performance && (
                        <div className="space-y-1">
                          <div>
                            Evaporator:{" "}
                            {((coolingCapacityKwNum || 0) * 1.1).toFixed(1)} kW
                            capacity
                          </div>
                          <div>
                            Condenser:{" "}
                            {(
                              (getPerfVal(results?.performance, [
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
                              ]) || 0) * 1.05
                            ).toFixed(1)}{" "}
                            kW capacity
                          </div>
                          <div>
                            Compressor: {(compressorWorkKwNum || 0).toFixed(1)}{" "}
                            kW minimum power
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-3">
                      Future-Proofing Strategy
                    </h4>
                    <div className="space-y-2 text-sm text-muted-foreground">
                      <div>• Prepare for low-GWP refrigerant transition</div>
                      <div>• Invest in monitoring and control systems</div>
                      <div>• Consider modular design for upgrades</div>
                      <div>• Plan maintenance schedules proactively</div>
                      <div>• Stay updated on energy codes and standards</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
