import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldAlert, Info, Save, Flame } from "lucide-react";
import { getRefrigerantsByPopularity, RefrigerantProperties } from "@/lib/refrigerants";
import { SaveCalculation } from "@/components/SaveCalculation";
import { calculateA2LChargeLimit } from "@/lib/calculators/a2l";

interface A2LCalculatorProps {
    saveCalculation: any;
}

export default function A2LCalculator({ saveCalculation }: A2LCalculatorProps) {
    const [refrigerants, setRefrigerants] = useState<RefrigerantProperties[]>([]);
    const [inputs, setInputs] = useState({
        refrigerantId: "R32",
        area: "20",
        height: "1.8", // Wall mounted default
    });
    const [units, setUnits] = useState({
        area: "m2",
    });
    const [result, setResult] = useState<{ maxCharge: number; lfl: number } | null>(null);

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

        setResult({
            maxCharge: m_max,
            lfl: LFL,
        });
    };

    // Auto-calculate when inputs change
    useEffect(() => {
        handleCalculate();
    }, [inputs, units, refrigerants]);

    return (
        <Card className="glass-card border-0 overflow-hidden">
            <CardHeader className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
                <CardTitle className="text-xl font-semibold text-primary flex items-center gap-2">
                    <Flame className="w-5 h-5 text-orange-500" />
                    A2L Charge Limit Calculator
                </CardTitle>
                <CardDescription>
                    Calculate maximum allowable charge for mildly flammable refrigerants (IEC 60335-2-40)
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <Alert className="mb-6 bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-300">
                    <ShieldAlert className="h-4 w-4" />
                    <AlertTitle>Safety Disclaimer</AlertTitle>
                    <AlertDescription>
                        This calculator provides estimates based on standard formulas. Always verify with specific equipment manufacturer data and local safety codes.
                    </AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Refrigerant</Label>
                                <Select
                                    value={inputs.refrigerantId}
                                    onValueChange={(v) => setInputs({ ...inputs, refrigerantId: v })}
                                >
                                    <SelectTrigger>
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

                            <div className="space-y-2">
                                <Label>Room Area</Label>
                                <div className="flex gap-2">
                                    <Input
                                        type="number"
                                        value={inputs.area}
                                        onChange={(e) =>
                                            setInputs({ ...inputs, area: e.target.value })
                                        }
                                        className="flex-1"
                                    />
                                    <Select
                                        value={units.area}
                                        onValueChange={(v) => setUnits({ ...units, area: v })}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="m2">m²</SelectItem>
                                            <SelectItem value="ft2">ft²</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Installation Height</Label>
                                <Select
                                    value={inputs.height}
                                    onValueChange={(v) => setInputs({ ...inputs, height: v })}
                                >
                                    <SelectTrigger>
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
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-6 border border-slate-100 dark:border-slate-700 flex flex-col justify-center relative">
                        {result ? (
                            <div className="text-center space-y-4">
                                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400 mb-2">
                                    <Flame className="w-8 h-8" />
                                </div>
                                <div>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                                        Max Allowable Charge
                                    </p>
                                    <p className="text-4xl font-bold text-slate-900 dark:text-white mt-1">
                                        {result.maxCharge.toFixed(2)} <span className="text-xl text-slate-400 font-normal">kg</span>
                                    </p>
                                    <p className="text-sm text-slate-500 mt-1">
                                        {(result.maxCharge * 2.20462).toFixed(2)} lbs
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-slate-500">Refrigerant LFL:</span>
                                        <span className="font-medium">{result.lfl} kg/m³</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="text-slate-500">Installation Height:</span>
                                        <span className="font-medium">{inputs.height} m</span>
                                    </div>
                                </div>

                                <SaveCalculation
                                    calculationType="A2L Safety"
                                    inputs={{ ...inputs, ...units }}
                                    results={result}
                                />
                            </div>
                        ) : (
                            <div className="text-center text-slate-400">
                                <Info className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>Enter parameters to calculate limit</p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
