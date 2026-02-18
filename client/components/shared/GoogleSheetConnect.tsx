import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../ui/card";
import { useToast } from "../ui/use-toast";
import { Loader2, FileSpreadsheet, Check, Copy, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface SyncResult {
    success: boolean;
    count?: number;
    message?: string;
    isMock?: boolean;
    data?: any[];
}

export function GoogleSheetConnect() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [sheetUrl, setSheetUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<SyncResult | null>(null);

    // Mock Service Account Email
    const SERVICE_EMAIL = "thermoneural-bot@appspot.gserviceaccount.com";

    const handleCopyEmail = () => {
        navigator.clipboard.writeText(SERVICE_EMAIL);
        toast({ title: "Copied!", description: "Service email copied to clipboard." });
    };

    const handleSync = async () => {
        if (!sheetUrl.includes("docs.google.com/spreadsheets")) {
            toast({
                title: "Invalid URL",
                description: "Please paste a valid Google Sheets URL.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const { data, error } = await supabase.functions.invoke("sync-spreadsheets", {
                body: { sheetUrl }
            });

            if (error) throw error;

            setResult(data);

            if (data.success) {
                toast({
                    title: "Sync Successful",
                    description: data.message || `Synced ${data.count} rows found.`,
                });
                setStep(3); // Result view
            }
        } catch (error: any) {
            console.error("Sync Error:", error);
            toast({
                title: "Sync Failed",
                description: error.message || "Could not connect to the spreadsheet.",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setResult(null);
        setStep(1);
        setSheetUrl("");
    };

    return (
        <Card className="border-green-200 bg-green-50/10 dark:bg-green-900/10">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-lg text-green-700">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle>Google Sheets Sync</CardTitle>
                        <CardDescription>Connect a live spreadsheet to auto-import clients or inventory.</CardDescription>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {step === 1 && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                            <p className="font-medium text-slate-900 dark:text-slate-200">Step 1: Share Access</p>
                            <p>To let us read your sheet securely, share it with our Service Bot:</p>
                            <div className="flex items-center gap-2 mt-2">
                                <code className="bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded text-xs font-mono border flex-1 truncate">
                                    {SERVICE_EMAIL}
                                </code>
                                <Button size="sm" variant="outline" onClick={handleCopyEmail} title="Copy Email">
                                    <Copy className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>

                        <div className="pt-2">
                            <p className="font-medium text-slate-900 dark:text-slate-200 text-sm mb-2">Step 2: Paste URL</p>
                            <Input
                                placeholder="https://docs.google.com/spreadsheets/d/..."
                                value={sheetUrl}
                                onChange={(e) => setSheetUrl(e.target.value)}
                            />
                        </div>
                    </div>
                )}

                {step === 3 && result && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <div className="bg-white dark:bg-slate-900 border rounded-lg p-4">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                <Check className="w-4 h-4" />
                                <span className="font-semibold">Sync Complete</span>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">
                                Found <strong>{result.count}</strong> records.
                                {result.isMock && " (Demo Mode)"}
                            </p>

                            {/* Simple Preview Table */}
                            <div className="max-h-40 overflow-y-auto border rounded bg-slate-50 text-xs">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-100 sticky top-0">
                                        <tr>
                                            {result.data && result.data.length > 0 && Object.keys(result.data[0]).map(key => (
                                                <th key={key} className="p-2 border-b capitalize">{key}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {result.data?.map((row, i) => (
                                            <tr key={i} className="border-b last:border-0 hover:bg-slate-100">
                                                {Object.values(row).map((val: any, j) => (
                                                    <td key={j} className="p-2 truncate max-w-[150px]">{val}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>

            <CardFooter className="justify-between border-t pt-4">
                {step === 1 ? (
                    <>
                        <p className="text-xs text-slate-400">Read-only access required.</p>
                        <Button onClick={handleSync} disabled={loading || !sheetUrl}>
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                            {loading ? "Syncing..." : "Sync Now"}
                        </Button>
                    </>
                ) : (
                    <Button variant="outline" onClick={handleReset} className="w-full">
                        Sync Another Sheet
                    </Button>
                )}
            </CardFooter>
        </Card>
    );
}
