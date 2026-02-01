import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer, Save, Info, Gauge, Snowflake } from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { Badge } from "@/components/ui/badge";
import { getRefrigerantsByPopularity, RefrigerantProperties } from "@/lib/refrigerants";
import { calculateSaturationTemperature, isRefrigerantSupported } from "@/lib/pt-chart";
import { Switch } from "@/components/ui/switch";

interface SubcoolingCalculatorProps {
    saveCalculation?: any;
}

export default function SubcoolingCalculator({ saveCalculation }: SubcoolingCalculatorProps) {
    const [refrigerants, setRefrigerants] = useState<RefrigerantProperties[]>([]);
    const [selectedRefrigerant, setSelectedRefrigerant] = useState<string>("R410A");

    const [units, setUnits] = useState<"imperial" | "metric">("imperial");
    const [inputs, setInputs] = useState({
        targetSubcooling: "10",
        // Gauge readings
        liquidPressure: "",
        liquidLineTemp: "",
        // Manual override
        actualSubcooling: ""
    });

    const [useGaugeReadings, setUseGaugeReadings] = useState(true);

    const [result, setResult] = useState<{
        actualSubcooling?: number;
        calculatedSaturationTemp?: number;
        deviation?: number;
        recommendation: string;
        status: "Normal" | "Warning" | "Critical";
    } | null>(null);

    useEffect(() => {
        setRefrigerants(getRefrigerantsByPopularity());
    }, []);

    const calculate = () => {
        const target = parseFloat(inputs.targetSubcooling);
        if (isNaN(target)) return;

        let actualSC: number | undefined = undefined;
        let satTemp: number | undefined = undefined;

        if (useGaugeReadings && inputs.liquidPressure && inputs.liquidLineTemp) {
            const P = parseFloat(inputs.liquidPressure);
            const T_line = parseFloat(inputs.liquidLineTemp);

            if (!isNaN(P) && !isNaN(T_line)) {
                let P_calc = P;
                let T_line_calc = T_line; // This will be in F for calc

                // Normalize inputs to Imperial for PT Chart
                if (units === "metric") {
                    // kPa -> PSIG conversion for PT Chart tool
                    // kPa_g = kPa_abs - 101.3
                    // P_psig = P_kpag * 0.145
                    P_calc = P * 0.145038;
                    // C -> F
                    T_line_calc = (T_line * 9 / 5) + 32;
                }

                // Get Saturation Temp (Bubble Point usually for subcooling, but PT chart tool usually finds Dew Point for some updates, 
                // for single component R410A/R22 Dew=Bubble. For high glide, technically need Bubble point.
                // Our PT chart tool is currently basic. R410A is near-azeotropic (glide < 0.3F).
                // R407C has high glide.
                // Assuming PT Chart returns appropriate Sat Temp for the refrigerant config.

                const T_sat = calculateSaturationTemperature(selectedRefrigerant, P_calc, "psig");

                if (T_sat !== null) {
                    satTemp = T_sat;
                    // Subcooling = Saturation Temp - Liquid Line Temp
                    actualSC = T_sat - T_line_calc;
                }
            }
        } else if (!useGaugeReadings && inputs.actualSubcooling) {
            let val = parseFloat(inputs.actualSubcooling);
            if (!isNaN(val)) {
                if (units === "metric") val = val * 1.8; // Convert delta C to delta F
                actualSC = val;
            }
        }

        if (actualSC !== undefined) {
            // Logic:
            // Target say 10.
            // Act 10 -> Perfect.
            // Act 2 -> Low Subcooling (System Undercharged, need more liquid to stack up).
            // Act 20 -> High Subcooling (System Overcharged, too much liquid).

            // Allow +/- 3F
            const diff = actualSC - target;
            let status: "Normal" | "Warning" | "Critical" = "Normal";
            let recommendation = "System charge is correct.";

            // Thresholds
            if (actualSC < target - 3) {
                status = "Warning";
                recommendation = "Low Subcooling: System is likely UNDERCHARGED. Add refrigerant.";
            } else if (actualSC > target + 3) {
                status = "Warning";
                recommendation = "High Subcooling: System is likely OVERCHARGED. Recover refrigerant.";
            } else {
                status = "Normal";
                recommendation = `Charge is correct within ±${units === "metric" ? "1.7°C" : "3°F"}.`;
            }

            setResult({
                actualSubcooling: actualSC,
                calculatedSaturationTemp: satTemp,
                deviation: diff,
                recommendation,
                status
            });
        } else {
            setResult(null);
        }
    };

    useEffect(() => {
        calculate();
    }, [inputs, units, selectedRefrigerant, useGaugeReadings]);

    // Helpers
    const formatTemp = (val: number | undefined) => {
        if (val === undefined) return "--";
        if (units === "metric") return (val / 1.8).toFixed(1);
        return val.toFixed(1);
    };

    const formatAbsTemp = (valF: number | undefined) => {
        if (valF === undefined) return "--";
        if (units === "metric") return ((valF - 32) * 5 / 9).toFixed(1);
        return valF.toFixed(1);
    };

    const isPtSupported = isRefrigerantSupported(selectedRefrigerant);

    return (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-sky-50/50 dark:bg-slate-800/50 border-b border-sky-100 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="bg-sky-100 dark:bg-sky-900/30 p-2 rounded-lg text-sky-600 dark:text-sky-400">
                                <Snowflake className="w-5 h-5" />
                            </div>
                            Target Subcooling
                        </CardTitle>
                        <CardDescription>
                            TXV system charging calculator.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={units} onValueChange={(v: "imperial" | "metric") => setUnits(v)}>
                            <SelectTrigger className="w-[100px] h-8 text-xs bg-white dark:bg-slate-900">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="imperial">Imperial (°F)</SelectItem>
                                <SelectItem value="metric">Metric (°C)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Inputs */}
                    <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
                        <Alert className="bg-sky-50 border-sky-200 text-sky-800 dark:bg-sky-900/20 dark:border-sky-800 dark:text-sky-300">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Prerequisites</AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                Ensure proper airflow. Only applies to TXV (Expansion Valve) systems.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-6">
                            {/* Refrigerant */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Refrigerant</Label>
                                <Select
                                    value={selectedRefrigerant}
                                    onValueChange={setSelectedRefrigerant}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-sky-400 transition-colors">
                                        <SelectValue placeholder="Select Refrigerant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {refrigerants.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color }}></span>
                                                    {r.name}
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Target Subcooling Input */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Target Subcooling</Label>
                                <div className="relative group">
                                    <span className="absolute left-3 top-2.5 text-slate-400">🎯</span>
                                    <Input
                                        type="number"
                                        value={inputs.targetSubcooling}
                                        onChange={(e) => setInputs({ ...inputs, targetSubcooling: e.target.value })}
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-sky-400 transition-colors"
                                        placeholder="Nameplate value (e.g. 10)"
                                    />
                                </div>
                            </div>

                            {/* Actual Subcooling Section */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex items-center justify-between">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                                        Actual Subcooling
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold ${!useGaugeReadings ? "text-sky-600" : "text-slate-400"}`}>Manual</span>
                                        <Switch
                                            checked={useGaugeReadings}
                                            onCheckedChange={setUseGaugeReadings}
                                            disabled={!isPtSupported}
                                        />
                                        <span className={`text-[10px] uppercase font-bold ${useGaugeReadings ? "text-sky-600" : "text-slate-400"}`}>Gauges</span>
                                    </div>
                                </div>

                                {useGaugeReadings ? (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500">Liquid Line Pressure</Label>
                                            <span className="text-[10px] text-slate-400 block -mt-1 mb-1">({units === "imperial" ? "PSIG" : "kPa"})</span>
                                            <div className="relative group">
                                                <span className="absolute left-2.5 top-2.5 text-slate-400"><Gauge className="w-4 h-4" /></span>
                                                <Input
                                                    type="number"
                                                    value={inputs.liquidPressure}
                                                    onChange={(e) => setInputs({ ...inputs, liquidPressure: e.target.value })}
                                                    className="pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500">Liquid Line Temperature</Label>
                                            <div className="relative group">
                                                <span className="absolute left-2.5 top-2.5 text-slate-400"><Thermometer className="w-4 h-4" /></span>
                                                <Input
                                                    type="number"
                                                    value={inputs.liquidLineTemp}
                                                    onChange={(e) => setInputs({ ...inputs, liquidLineTemp: e.target.value })}
                                                    className="pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="relative group animate-in slide-in-from-top-2 duration-300">
                                        <span className="absolute left-3 top-2.5 text-slate-400">Calculated</span>
                                        <Input
                                            type="number"
                                            value={inputs.actualSubcooling}
                                            onChange={(e) => setInputs({ ...inputs, actualSubcooling: e.target.value })}
                                            placeholder="Enter measured subcooling..."
                                            className="pl-24 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-sky-400 transition-colors"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
                        {result ? (
                            <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-full p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative">
                                        <Snowflake className="w-8 h-8 text-sky-500" />
                                        {result.status !== "Normal" && (
                                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Actual Subcooling</h3>

                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                    <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {formatTemp(result.actualSubcooling)}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium">{units === "imperial" ? "°F" : "K"}</span>
                                </div>

                                <div className="flex justify-center items-center gap-2 mb-6">
                                    <Badge variant="outline" className="text-slate-500 bg-white dark:bg-slate-900 px-3 py-1">
                                        Target: {inputs.targetSubcooling} {units === "imperial" ? "°F" : "K"}
                                    </Badge>
                                </div>

                                {useGaugeReadings && result.calculatedSaturationTemp !== undefined && (
                                    <div className="grid grid-cols-2 gap-2 mb-6 text-xs bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="text-slate-500 text-right pr-2 border-r border-slate-100">
                                            <span className="block text-[10px] uppercase">Sat Temp</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatAbsTemp(result.calculatedSaturationTemp)}°</span>
                                        </div>
                                        <div className="text-slate-500 text-left pl-2">
                                            <span className="block text-[10px] uppercase">Deviation</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                                                {result.deviation && result.deviation > 0 ? "+" : ""}{formatTemp(result.deviation)}°
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div className={`p-4 rounded-lg mb-6 text-sm text-center border ${result.status === "Normal"
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900"
                                    : result.status === "Warning"
                                        ? "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900"
                                        : "bg-slate-100 border-slate-200 text-slate-800 dark:bg-slate-800 dark:border-slate-700"
                                    }`}>
                                    <strong className="block mb-1 font-bold tracking-tight">{result.status === "Normal" ? "SYSTEM CHARGED CORRECTLY" : "ATTENTION REQUIRED"}</strong>
                                    {result.recommendation}
                                </div>

                                <SaveCalculation
                                    calculationType="Subcooling"
                                    inputs={{ ...inputs, units, refrigerant: selectedRefrigerant }}
                                    results={{ ...result, units_used: units }}
                                    trigger={
                                        <Button variant="ghost" className="w-full text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save to History
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-12">
                                <Snowflake className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-800" />
                                <p className="max-w-[200px] mx-auto text-sm">Enter readings to calculate subcooling.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
