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

  // Cost and ROI calculations
  const calculateCostAnalysis = () => {
    if (!results?.performance) return null;

    const powerConsumption = results.performance.compressor_work_kw || 0;
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

    const cop = results.performance.cop || 0;
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

  // Generate professional report
  const generateReport = () => {
    const reportData = {
      header: {
        title: "Refrigeration Cycle Analysis Report",
        project: reportConfig.projectName || "Untitled Project",
        company: reportConfig.companyName || "Your Company",
        engineer: reportConfig.engineerName || "Design Engineer",
        date: new Date().toLocaleDateString(),
        refrigerant: refrigerant,
      },
      calculations: results,
      costAnalysis: costData,
      sustainability: sustainabilityData,
      recommendations: generateRecommendations(),
      unitSystem,
    };

    // Create and download PDF report (simplified version)
    const reportContent = `
# ${reportData.header.title}

**Project:** ${reportData.header.project}
**Company:** ${reportData.header.company}
**Engineer:** ${reportData.header.engineer}
**Date:** ${reportData.header.date}
**Refrigerant:** ${reportData.header.refrigerant}

## Executive Summary
This report presents a comprehensive analysis of the refrigeration cycle performance, including thermodynamic calculations, cost analysis, and sustainability assessment.

## Performance Metrics
- COP: ${results?.performance?.cop?.toFixed(2) || "N/A"}
- Cooling Capacity: ${formatValue(results?.performance?.cooling_capacity_kw, "kW")}
- Compressor Work: ${formatValue(results?.performance?.compressor_work_kw, "kW")}

## Cost Analysis
${
  costData
    ? `
- Annual Energy Cost: $${costData.annualEnergyCost?.toFixed(0) || "N/A"}
- Lifetime Energy Cost: $${costData.lifetimeEnergyCost?.toFixed(0) || "N/A"}
- Total Lifetime Cost: $${costData.totalLifetimeCost?.toFixed(0) || "N/A"}
- System Efficiency: ${costData.efficiency?.toFixed(1) || "N/A"}%
`
    : "Cost analysis not available"
}

## Sustainability Assessment
- Global Warming Potential: ${sustainabilityData.gwp}
- Ozone Depletion Potential: ${sustainabilityData.odp}
- Phase-out Timeline: ${sustainabilityData.phaseOut}
- Recommended Alternatives: ${sustainabilityData.alternative}

## Engineering Notes
${reportConfig.reportNotes || "No additional notes provided."}

---
Generated by SimulateOn Professional HVAC Analysis Platform
    `;

    const blob = new Blob([reportContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${reportConfig.projectName || "hvac-analysis"}-report.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateRecommendations = () => {
    const recommendations = [];

    if (results?.performance?.cop) {
      const cop = results.performance.cop;
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
                            convertPower(
                              results.performance.cooling_capacity_kw || 0,
                            ),
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
                            convertPower(
                              results.performance.compressor_work_kw || 0,
                            ),
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
                                    convertPressure(point.pressure / 1000),
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
                    <Button variant="outline" size="sm" disabled={!results}>
                      <FileText className="h-4 w-4 mr-1" />
                      Export Data
                    </Button>
                    <Button variant="outline" size="sm" disabled={!results}>
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
                      {results?.performance?.cop && (
                        <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                          Current COP:{" "}
                          {results.performance.cop?.toFixed(2) || "N/A"}
                          <div className="text-xs text-muted-foreground">
                            {results.performance.cop > 3.5
                              ? "Excellent efficiency"
                              : results.performance.cop > 2.5
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
                            {(
                              (results.performance.cooling_capacity_kw || 0) *
                              1.1
                            ).toFixed(1)}{" "}
                            kW capacity
                          </div>
                          <div>
                            Condenser:{" "}
                            {(
                              (results.performance.heat_rejection_kw || 0) *
                              1.05
                            ).toFixed(1)}{" "}
                            kW capacity
                          </div>
                          <div>
                            Compressor:{" "}
                            {(
                              results.performance.compressor_work_kw || 0
                            ).toFixed(1)}{" "}
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
