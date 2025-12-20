import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TargetSuperheatCalculator from "./TargetSuperheatCalculator";
import SubcoolingCalculator from "./SubcoolingCalculator";
import AirDensityCalculator from "./AirDensityCalculator";
import { Lock, Thermometer, Cloud } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PsychrometricCalculatorProps {
    saveCalculation?: any;
    userTier?: "free" | "solo" | "pro" | "business";
}

export default function PsychrometricCalculator({ saveCalculation, userTier = "pro" }: PsychrometricCalculatorProps) {
    const isLocked = userTier === "free";

    // Use a default state if not provided (mocking user tier for now)
    // In a real app, this would come from a context context or prop

    if (isLocked) {
        return (
            <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-slate-400" />
                    </div>
                    <div className="max-w-md space-y-2">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Pro Feature</h3>
                        <p className="text-slate-500 dark:text-slate-400">
                            Psychrometric calculations like Target Superheat and Air Density are available on the Solo plan and above.
                        </p>
                    </div>
                    <Button className="mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-indigo-700 transition-all border-0">
                        Upgrade to Unlock
                    </Button>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Tabs defaultValue="superheat" className="w-full">
                <TabsList className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg w-full sm:w-auto grid grid-cols-2 sm:flex">
                    <TabsTrigger value="superheat" className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4" />
                        Target Superheat
                    </TabsTrigger>
                    <TabsTrigger value="subcooling" className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-sky-500" />
                        Target Subcooling
                    </TabsTrigger>
                    <TabsTrigger value="density" className="flex items-center gap-2">
                        <Cloud className="w-4 h-4" />
                        Air Density
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    <TabsContent value="superheat" className="m-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-300">
                        <TargetSuperheatCalculator saveCalculation={saveCalculation} />
                    </TabsContent>

                    <TabsContent value="subcooling" className="m-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-300">
                        <SubcoolingCalculator saveCalculation={saveCalculation} />
                    </TabsContent>

                    <TabsContent value="density" className="m-0 focus-visible:outline-none animate-in fade-in zoom-in-95 duration-300">
                        <AirDensityCalculator saveCalculation={saveCalculation} />
                    </TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
