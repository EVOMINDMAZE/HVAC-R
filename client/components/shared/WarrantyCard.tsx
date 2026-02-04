import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface WarrantyInfo {
    manufacturer: string;
    status: "Active" | "Expired" | "Unknown";
    expiryDate?: string;
    modelNumber?: string;
    notes?: string;
}

export function WarrantyCard() {
    const [serialNumber, setSerialNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [warrantyInfo, setWarrantyInfo] = useState<WarrantyInfo | null>(null);
    const { toast } = useToast();

    const handleLookup = async () => {
        if (!serialNumber.trim()) {
            toast({
                title: "Serial Number Required",
                description: "Please enter a valid serial number.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setWarrantyInfo(null);

        try {
            const { data, error } = await supabase.functions.invoke("warranty-lookup", {
                body: { serial_number: serialNumber },
            });

            if (error) throw error;

            if (data?.success) {
                setWarrantyInfo(data.data);
                toast({
                    title: "Warranty Found",
                    description: `Found coverage for ${data.data.manufacturer}.`,
                });
            } else {
                setWarrantyInfo({
                    manufacturer: "Unknown",
                    status: "Unknown",
                    notes: "Could not verify warranty with provided serial.",
                });
            }
        } catch (error: any) {
            console.error("Warranty lookup failed:", error);
            toast({
                title: "Lookup Failed",
                description: "Could not connect to warranty service.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className="border-l-4 border-l-purple-500 shadow-sm">
            <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-purple-600" />
                    <CardTitle className="text-lg">Warranty Auto-Pilot</CardTitle>
                </div>
                <CardDescription>
                    Instantly check manufacturer warranty status.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex gap-2">
                    <Input
                        placeholder="Scan or enter Serial Number..."
                        value={serialNumber}
                        onChange={(e) => setSerialNumber(e.target.value)}
                        className="font-mono uppercase"
                    />
                    <Button
                        onClick={handleLookup}
                        disabled={loading}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                    </Button>
                </div>

                {warrantyInfo && (
                    <div className="rounded-md bg-muted/50 p-3 space-y-2 border animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Manufacturer</p>
                                <p className="font-bold flex items-center gap-1">
                                    {warrantyInfo.manufacturer}
                                </p>
                            </div>
                            <Badge variant={warrantyInfo.status === "Active" ? "default" : "destructive"}>
                                {warrantyInfo.status}
                            </Badge>
                        </div>

                        {warrantyInfo.modelNumber && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Model Number</p>
                                <p className="font-mono text-sm">{warrantyInfo.modelNumber}</p>
                            </div>
                        )}

                        {warrantyInfo.expiryDate && (
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">Coverage Ends</p>
                                <p className="font-semibold">{warrantyInfo.expiryDate}</p>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
