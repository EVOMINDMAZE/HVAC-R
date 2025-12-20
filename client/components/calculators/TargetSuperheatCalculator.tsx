import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Thermometer, Save, Info, ArrowUpRight, Calculator, Gauge } from "lucide-react";
import { SaveCalculation } from "@/components/SaveCalculation";
import { Badge } from "@/components/ui/badge";
import { getRefrigerantsByPopularity, RefrigerantProperties } from "@/lib/refrigerants";
import { calculateSaturationTemperature, isRefrigerantSupported } from "@/lib/pt-chart";
import { Switch } from "@/components/ui/switch";

interface TargetSuperheatCalculatorProps {
    saveCalculation?: any;
}

export default function TargetSuperheatCalculator({ saveCalculation }: TargetSuperheatCalculatorProps) {
    const [refrigerants, setRefrigerants] = useState<RefrigerantProperties[]>([]);
    const [selectedRefrigerant, setSelectedRefrigerant] = useState<string>("R410A");

    const [units, setUnits] = useState<"imperial" | "metric">("imperial");
    const [inputs, setInputs] = useState({
        indoorWetBulb: "64",
        outdoorDryBulb: "85",
        // Base actual superheat (manual result)
        actualSuperheat: "",
        // Gauge mode inputs
        suctionPressure: "",
        suctionLineTemp: ""
    });

    const [useGaugeReadings, setUseGaugeReadings] = useState(false);

    const [result, setResult] = useState<{
        targetSuperheat: number;
        minSuperheat: number;
        maxSuperheat: number;
        actualSuperheat?: number;
        calculatedSaturationTemp?: number;
        recommendation: string;
        status: "Normal" | "Warning" | "Critical";
    } | null>(null);

    useEffect(() => {
        setRefrigerants(getRefrigerantsByPopularity());
    }, []);

    const calculate = () => {
        let wb = parseFloat(inputs.indoorWetBulb);
        let db = parseFloat(inputs.outdoorDryBulb);

        if (isNaN(wb) || isNaN(db)) return;

        // Convert to Imperial for calculation logic if currently Metric
        if (units === "metric") {
            wb = (wb * 9 / 5) + 32;
            db = (db * 9 / 5) + 32;
        }

        // Validation (Prevent nonsensical inputs in F)
        if (wb < 32 || wb > 100) return;
        if (db < 0 || db > 130) return;

        // Formula: ((3 * Indoor WB) - 80 - Outdoor DB) / 2
        const target = ((3 * wb) - 80 - db) / 2;
        const min = target - 5;
        const max = target + 5;

        let recommendation = "Check against actual superheat.";
        let status: "Normal" | "Warning" | "Critical" = "Normal";
        let actualSH: number | undefined = undefined;
        let satTemp: number | undefined = undefined;

        // Determine Actual Superheat
        if (useGaugeReadings && inputs.suctionPressure && inputs.suctionLineTemp) {
            // Calculate from Gauges
            const P = parseFloat(inputs.suctionPressure);
            const T_line = parseFloat(inputs.suctionLineTemp);

            if (!isNaN(P) && !isNaN(T_line)) {
                // Pressure input assumption: PSIG (Imperial) or kPa (Metric) implied?
                // Usually gauges are PSIG. If metric, usually kPa or Bar. 
                // For MVP simplicty in mixed mode:
                // If Imperial -> PSIG, Line Temp F.
                // If Metric -> kPa (gauge), Line Temp C.

                let P_calc = P;
                let T_line_calc = T_line;

                // Normalize to Imperial for PT Chart usage (since PT tool accepts PSIG)
                // If metric, convert kPa_g to PSIG first
                if (units === "metric") {
                    // kPa_g = kPa_abs - 101.3
                    // P_psig = P_kpag * 0.145
                    P_calc = P * 0.145038;
                    T_line_calc = (T_line * 9 / 5) + 32;
                }

                const T_sat = calculateSaturationTemperature(selectedRefrigerant, P_calc, "psig");

                if (T_sat !== null) {
                    satTemp = T_sat;
                    actualSH = T_line_calc - T_sat;
                }
            }

        } else if (!useGaugeReadings && inputs.actualSuperheat) {
            // Manual Input
            let val = parseFloat(inputs.actualSuperheat);
            if (!isNaN(val)) {
                // If metric manual input (K/C diff), convert to F diff
                if (units === "metric") val = val * 1.8;
                actualSH = val;
            }
        }

        // Evaluate
        if (actualSH !== undefined) {
            if (actualSH < min) {
                recommendation = "System is undercharged (or restriction). Add refrigerant.";
                status = "Warning";
            } else if (actualSH > max) {
                recommendation = "System is overcharged. Remove refrigerant.";
                status = "Warning";
            } else {
                recommendation = `Charge is correct within ±${units === "metric" ? "2.8°C" : "5°F"}.`;
                status = "Normal";
            }
        }

        setResult({
            targetSuperheat: target,
            minSuperheat: min,
            maxSuperheat: max,
            actualSuperheat: actualSH,
            calculatedSaturationTemp: satTemp,
            recommendation,
            status
        });
    };

    useEffect(() => {
        calculate();
    }, [inputs, units, selectedRefrigerant, useGaugeReadings]);

    // Helper for displaying result
    const formatTemp = (val: number | undefined) => {
        if (val === undefined) return "--";
        if (units === "metric") {
            return (val / 1.8).toFixed(1);
        }
        return val.toFixed(1);
    };

    // Helper for displaying absolute temps (not delta)
    const formatAbsTemp = (valF: number | undefined) => {
        if (valF === undefined) return "--";
        if (units === "metric") {
            return ((valF - 32) * 5 / 9).toFixed(1);
        }
        return valF.toFixed(1);
    }

    const isPtSupported = isRefrigerantSupported(selectedRefrigerant);

    return (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-blue-50/50 dark:bg-slate-800/50 border-b border-blue-100 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                <Thermometer className="w-5 h-5" />
                            </div>
                            Target Superheat
                        </CardTitle>
                        <CardDescription>
                            Fixed orifice system charging calculator.
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
                    {/* Input Section */}
                    <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
                        <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300">
                            <Info className="h-4 w-4" />
                            <AlertTitle>Prerequisites</AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                Ensure airflow is correct before charging. Only applies to fixed orifice (piston) systems.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-6">

                            {/* Refrigerant Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Refrigerant</Label>
                                <Select
                                    value={selectedRefrigerant}
                                    onValueChange={(v) => setSelectedRefrigerant(v)}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-blue-400 transition-colors">
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
                                <div className="flex justify-between items-center px-1">
                                    <p className="text-[10px] text-slate-400">Used for records & PT calculation.</p>
                                    {!isPtSupported && (
                                        <span className="text-[10px] text-amber-500 font-medium">Auto-PT not supported</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                                        Indoor WB ({units === "imperial" ? "°F" : "°C"})
                                    </Label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-2.5 text-slate-400">💧</span>
                                        <Input
                                            type="number"
                                            value={inputs.indoorWetBulb}
                                            onChange={(e) => setInputs({ ...inputs, indoorWetBulb: e.target.value })}
                                            className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition-colors"
                                            placeholder={units === "imperial" ? "60 - 70" : "15 - 21"}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                                        Outdoor DB ({units === "imperial" ? "°F" : "°C"})
                                    </Label>
                                    <div className="relative group">
                                        <span className="absolute left-3 top-2.5 text-slate-400">☀️</span>
                                        <Input
                                            type="number"
                                            value={inputs.outdoorDryBulb}
                                            onChange={(e) => setInputs({ ...inputs, outdoorDryBulb: e.target.value })}
                                            className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition-colors"
                                            placeholder={units === "imperial" ? "55+" : "13+"}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Actual Superheat Section */}
                            <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">
                                            Actual Superheat Source
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] uppercase font-bold ${!useGaugeReadings ? "text-blue-600" : "text-slate-400"}`}>Manual</span>
                                        <Switch
                                            checked={useGaugeReadings}
                                            onCheckedChange={setUseGaugeReadings}
                                            disabled={!isPtSupported} // Disable if refrigerant not supported
                                        />
                                        <span className={`text-[10px] uppercase font-bold ${useGaugeReadings ? "text-blue-600" : "text-slate-400"}`}>Gauges</span>
                                    </div>
                                </div>

                                {!useGaugeReadings ? (
                                    <div className="relative group animate-in slide-in-from-top-2 duration-300">
                                        <span className="absolute left-3 top-2.5 text-slate-400">Calculated</span>
                                        <Input
                                            type="number"
                                            value={inputs.actualSuperheat}
                                            onChange={(e) => setInputs({ ...inputs, actualSuperheat: e.target.value })}
                                            placeholder="Enter measured superheat..."
                                            className="pl-24 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-blue-400 transition-colors"
                                        />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500">Suction Press ({units === "imperial" ? "PSIG" : "kPa"})</Label>
                                            <div className="relative group">
                                                <span className="absolute left-2.5 top-2.5 text-slate-400"><Gauge className="w-4 h-4" /></span>
                                                <Input
                                                    type="number"
                                                    value={inputs.suctionPressure}
                                                    onChange={(e) => setInputs({ ...inputs, suctionPressure: e.target.value })}
                                                    className="pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-bold text-slate-500">Suction Line Temp</Label>
                                            <div className="relative group">
                                                <span className="absolute left-2.5 top-2.5 text-slate-400"><Thermometer className="w-4 h-4" /></span>
                                                <Input
                                                    type="number"
                                                    value={inputs.suctionLineTemp}
                                                    onChange={(e) => setInputs({ ...inputs, suctionLineTemp: e.target.value })}
                                                    className="pl-8 h-10 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Result Section */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
                        {result ? (
                            <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                                <div className="flex justify-center mb-6">
                                    <div className="bg-white dark:bg-slate-800 rounded-full p-4 shadow-sm border border-slate-100 dark:border-slate-700 relative">
                                        <Thermometer className="w-8 h-8 text-blue-500" />
                                        {result.status !== "Normal" && (
                                            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>
                                        )}
                                    </div>
                                </div>

                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-1">Target Superheat</h3>

                                <div className="flex items-baseline justify-center gap-1 mb-2">
                                    <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {formatTemp(result.targetSuperheat)}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium">{units === "imperial" ? "°F" : "K"}</span>
                                </div>

                                <div className="flex justify-center items-center gap-2 mb-6">
                                    <Badge variant="outline" className="text-slate-500 bg-white dark:bg-slate-900 px-3 py-1">
                                        Acceptable: {formatTemp(result.minSuperheat)} - {formatTemp(result.maxSuperheat)} {units === "imperial" ? "°F" : "K"}
                                    </Badge>
                                </div>

                                {/* Gauge Result Details */}
                                {useGaugeReadings && result.calculatedSaturationTemp !== undefined && (
                                    <div className="grid grid-cols-2 gap-2 mb-6 text-xs bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <div className="text-slate-500 text-right pr-2 border-r border-slate-100">
                                            <span className="block text-[10px] uppercase">Sat Temp (Dew)</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatAbsTemp(result.calculatedSaturationTemp)}°</span>
                                        </div>
                                        <div className="text-slate-500 text-left pl-2">
                                            <span className="block text-[10px] uppercase">Actual SH</span>
                                            <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatTemp(result.actualSuperheat)}°</span>
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
                                    calculationType="Target Superheat"
                                    inputs={{ ...inputs, units, refrigerant: selectedRefrigerant, mode: useGaugeReadings ? "gauges" : "manual" }}
                                    results={{ ...result, units_used: units }}
                                    trigger={
                                        <Button variant="ghost" className="w-full text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save to History
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-12">
                                <Calculator className="w-12 h-12 mx-auto mb-3 text-slate-200 dark:text-slate-800" />
                                <p className="max-w-[200px] mx-auto text-sm">Enter temperatures to calculate target.</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
