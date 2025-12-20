import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Info, Save, Flame } from "lucide-react";
import { getRefrigerantsByPopularity, RefrigerantProperties } from "@/lib/refrigerants";
import { SaveCalculation } from "@/components/SaveCalculation";
import { calculateA2LChargeLimit, calculateMinAreaForA2L } from "@/lib/calculators/a2l";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface A2LCalculatorProps {
    saveCalculation: any;
}

export default function A2LCalculator({ saveCalculation }: A2LCalculatorProps) {
    const [refrigerants, setRefrigerants] = useState<RefrigerantProperties[]>([]);
    const [inputs, setInputs] = useState({
        refrigerantId: "R32",
        area: "20",
        height: "1.8", // Wall mounted default
        charge: "",
    });
    const [units, setUnits] = useState({
        area: "m2",
        charge: "kg",
    });
    const [result, setResult] = useState<{
        maxCharge: number;
        lfl: number;
        minArea?: number;
        isSafe?: boolean;
        chargeAmount?: number;
    } | null>(null);

    useEffect(() => {
        // Filter for A2L and A3 refrigerants that have LFL defined
        const allRefs = getRefrigerantsByPopularity();
        const flammableRefs = allRefs.filter(
            (r) => (r.safety === "A2L" || r.safety === "A3") && r.LFL !== undefined
        );
        setRefrigerants(flammableRefs);
    }, []);

    const handleCalculate = () => {
        const ref = refrigerants.find((r) => r.id === inputs.refrigerantId);
        if (!ref || !ref.LFL) return;

        const areaVal = parseFloat(inputs.area);
        if (isNaN(areaVal)) return;

        let areaM2 = areaVal;
        if (units.area === "ft2") {
            areaM2 = areaVal * 0.092903;
        }

        const h_inst = parseFloat(inputs.height);
        const LFL = ref.LFL;

        const m_max = calculateA2LChargeLimit({
            lfl: LFL,
            height: h_inst,
            area: areaM2
        });

        let minArea = undefined;
        let isSafe = undefined;
        let chargeKg = undefined;

        // Calculate Safety Status if Charge is provided
        if (inputs.charge) {
            let c = parseFloat(inputs.charge);
            if (!isNaN(c)) {
                if (units.charge === "lbs") {
                    c = c * 0.453592;
                }
                chargeKg = c;
                isSafe = c <= m_max;

                // Calculate Min Area for this charge
                minArea = calculateMinAreaForA2L(c, LFL, h_inst);
            }
        }

        setResult({
            maxCharge: m_max,
            lfl: LFL,
            minArea,
            isSafe,
            chargeAmount: chargeKg
        });
    };

    // Auto-calculate when inputs change
    useEffect(() => {
        handleCalculate();
    }, [inputs, units, refrigerants]);

    return (
        <Card className="border-0 shadow-lg bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-orange-50/50 dark:bg-slate-800/50 border-b border-orange-100 dark:border-slate-700 pb-4">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <CardTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                                <Flame className="w-5 h-5" />
                            </div>
                            A2L Charge Limit Calculator
                        </CardTitle>
                        <CardDescription>
                            Calculate maximum allowable charge for mildly flammable refrigerants (IEC 60335-2-40).
                        </CardDescription>
                    </div>
                    <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 hidden sm:flex">IEC 60335-2-40</Badge>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="grid grid-cols-1 lg:grid-cols-2">
                    {/* Input Section */}
                    <div className="p-6 md:p-8 space-y-8 border-r border-slate-100 dark:border-slate-800">
                        <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                            <ShieldAlert className="h-4 w-4" />
                            <AlertTitle>Safety Disclaimer</AlertTitle>
                            <AlertDescription className="text-xs mt-1">
                                This calculator provides estimates based on standard formulas. Always verify with specific equipment manufacturer data and local safety codes.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Refrigerant</Label>
                                <Select
                                    value={inputs.refrigerantId}
                                    onValueChange={(v) => setInputs({ ...inputs, refrigerantId: v })}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-orange-400 transition-colors">
                                        <SelectValue placeholder="Select Refrigerant" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {refrigerants.map((r) => (
                                            <SelectItem key={r.id} value={r.id}>
                                                {r.name} ({r.safety}) - LFL: {r.LFL} kg/m³
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Room Area</Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 group">
                                        <span className="absolute left-3 top-2.5 text-slate-400">📐</span>
                                        <Input
                                            type="number"
                                            value={inputs.area}
                                            onChange={(e) =>
                                                setInputs({ ...inputs, area: e.target.value })
                                            }
                                            className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-orange-400 transition-colors"
                                        />
                                    </div>
                                    <Select
                                        value={units.area}
                                        onValueChange={(v) => setUnits({ ...units, area: v })}
                                    >
                                        <SelectTrigger className="w-[100px] h-11 bg-slate-50 dark:bg-slate-900">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="m2">m²</SelectItem>
                                            <SelectItem value="ft2">ft²</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">Installation Height</Label>
                                <Select
                                    value={inputs.height}
                                    onValueChange={(v) => setInputs({ ...inputs, height: v })}
                                >
                                    <SelectTrigger className="h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-orange-400 transition-colors">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0.6">Floor (0.6m)</SelectItem>
                                        <SelectItem value="1.0">Window (1.0m)</SelectItem>
                                        <SelectItem value="1.8">Wall (1.8m)</SelectItem>
                                        <SelectItem value="2.2">Ceiling (2.2m)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-xs">System Charge (Optional)</Label>
                            <div className="flex items-center gap-3">
                                <div className="relative flex-1 group">
                                    <span className="absolute left-3 top-2.5 text-slate-400">⚖️</span>
                                    <Input
                                        type="number"
                                        value={inputs.charge}
                                        onChange={(e) =>
                                            setInputs({ ...inputs, charge: e.target.value })
                                        }
                                        placeholder="Enter system charge..."
                                        className="pl-9 h-11 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 group-hover:border-orange-400 transition-colors"
                                    />
                                </div>
                                <Select
                                    value={units.charge}
                                    onValueChange={(v) => setUnits({ ...units, charge: v })}
                                >
                                    <SelectTrigger className="w-[100px] h-11 bg-slate-50 dark:bg-slate-900">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="lbs">lbs</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>

                    {/* Result Section */}
                    <div className="bg-slate-50/80 dark:bg-slate-900/50 p-6 md:p-8 flex flex-col justify-center items-center relative min-h-[300px]">
                        {result ? (
                            <div className="text-center w-full max-w-sm animate-in zoom-in-95 duration-300">
                                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 mb-6 shadow-inner">
                                    <Flame className="w-10 h-10" />
                                </div>
                                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-2">Max Allowable Charge</h3>

                                <div className="flex items-baseline justify-center gap-1 mb-8">
                                    <span className="text-6xl font-black text-slate-900 dark:text-white tracking-tighter">
                                        {result.maxCharge.toFixed(2)}
                                    </span>
                                    <span className="text-lg text-slate-400 font-medium">kg</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t border-slate-200 dark:border-slate-700 pt-6 mb-8">
                                    <div>
                                        <span className="block mb-1">Refrigerant LFL</span>
                                        <strong className="text-slate-700 dark:text-slate-300">{result.lfl} kg/m³</strong>
                                    </div>
                                    <div>
                                        <span className="block mb-1">Install Height</span>
                                        <strong className="text-slate-700 dark:text-slate-300">{inputs.height} m</strong>
                                    </div>
                                    <div className="col-span-2 text-center border-t border-slate-100 dark:border-slate-800 pt-2 mt-2">
                                        <span className="text-slate-400">Equivalent: </span>
                                        <strong className="text-slate-600 dark:text-slate-400">{(result.maxCharge * 2.20462).toFixed(2)} lbs</strong>
                                    </div>
                                </div>

                                {result.isSafe !== undefined && (
                                    <div className={`p-4 rounded-lg mb-8 text-sm text-center border ${result.isSafe
                                        ? "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900"
                                        : "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-900"
                                        }`}>
                                        <strong className="block mb-1 font-bold tracking-tight uppercase">
                                            {result.isSafe ? "Safe Installation" : "Limit Exceeded"}
                                        </strong>
                                        {result.isSafe
                                            ? `Charge provided (${result.chargeAmount?.toFixed(2)} kg) is within limit.`
                                            : `Charge (${result.chargeAmount?.toFixed(2)} kg) exceeds max allowable amount.`
                                        }

                                        {!result.isSafe && result.minArea && (
                                            <div className="mt-2 pt-2 border-t border-red-200/50 dark:border-red-800/50">
                                                <span>Min. Required Area: </span>
                                                <strong>
                                                    {units.area === "ft2"
                                                        ? `${(result.minArea * 10.764).toFixed(1)} ft²`
                                                        : `${result.minArea.toFixed(1)} m²`
                                                    }
                                                </strong>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <SaveCalculation
                                    calculationType="A2L Safety"
                                    inputs={{ ...inputs, ...units }}
                                    results={result}
                                    trigger={
                                        <Button variant="outline" className="w-full border-dashed border-slate-300 hover:border-orange-500 hover:text-orange-600 transition-all">
                                            <Save className="w-4 h-4 mr-2" />
                                            Save Result
                                        </Button>
                                    }
                                />
                            </div>
                        ) : (
                            <div className="text-center text-slate-400 py-12">
                                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                    <Info className="w-10 h-10 opacity-30" />
                                </div>
                                <p className="max-w-[200px] mx-auto text-sm">Enter room dimensions and refrigerant to calculate safety limits</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card >
    );
}
