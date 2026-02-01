
import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Camera, RefreshCw, Search, CheckCircle, AlertTriangle, Scan, Copy, ExternalLink, ShieldCheck, ClipboardCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save } from "lucide-react";

// Manufacturer Portal Database
const MANUFACTURER_PORTALS: Record<string, { url: string; note: string; color: string }> = {
    "Carrier": { url: "https://www.carrier.com/residential/en/us/warranty/", note: "Standard Carrier Portal", color: "bg-blue-600" },
    "Bryant": { url: "https://www.bryant.com/en/us/warranty/", note: "Uses Carrier Serial Engine", color: "bg-red-600" },
    "Payne": { url: "https://www.payne.com/en/us/technical-support/warranty-registration/", note: "Uses Carrier Serial Engine", color: "bg-blue-800" },
    "Trane": { url: "https://www.trane.com/residential/en/for-owners/warranty-registration/", note: "Official Trane Warranty", color: "bg-orange-600" },
    "American Standard": { url: "https://www.americanstandardair.com/owner-support/warranty-registration/", note: "Uses Trane Serial Engine", color: "bg-blue-900" },
    "Goodman": { url: "https://www.goodmanmfg.com/product-registration", note: "Goodman Serial Lookup", color: "bg-slate-800" },
    "Lennox": { url: "https://www.lennox.com/registration", note: "Lennox Product Check", color: "bg-red-700" },
    "Rheem": { url: "https://www.rheem.com/warranty/product-warranty-lookup/", note: "Rheem/Ruud Integration", color: "bg-red-500" },
    "Ruud": { url: "https://www.ruud.com/warranty/product-warranty-lookup/", note: "Rheem/Ruud Integration", color: "bg-red-500" },
    "Daikin": { url: "https://daikincomfort.com/support/warranty", note: "Daikin Professional Lookup", color: "bg-blue-400" },
    "York": { url: "https://www.york.com/commercial/technical-support/product-registration-and-warranty-status", note: "York/Johnson Controls", color: "bg-yellow-600" }
};

export default function WarrantyScanner() {
    const webcamRef = useRef<Webcam>(null);
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [ocrText, setOcrText] = useState("");
    const { user } = useSupabaseAuth();
    const [clients, setClients] = useState<any[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [saving, setSaving] = useState(false);

    const [extractedData, setExtractedData] = useState({
        serialNumber: "",
        modelNumber: "",
        manufacturer: ""
    });

    React.useEffect(() => {
        if (user) {
            fetchClients();
        }
    }, [user]);

    const fetchClients = async () => {
        const { data } = await supabase.from('clients').select('id, name');
        if (data) setClients(data);
    };

    const capture = useCallback(() => {
        const imageSrc = webcamRef.current?.getScreenshot();
        if (imageSrc) {
            setImage(imageSrc);
            processImage(imageSrc);
        }
    }, [webcamRef]);

    const processImage = async (imageSrc: string) => {
        setScanning(true);
        setOcrText("");
        try {
            const result = await Tesseract.recognize(imageSrc, 'eng');
            const text = result.data.text;
            setOcrText(text);
            extractInfo(text);
            toast.success("AI extraction complete.");
        } catch (err) {
            console.error(err);
            toast.error("Vision engine failure.");
        } finally {
            setScanning(false);
        }
    };

    const extractInfo = (text: string) => {
        const lines = text.split('\n');

        // Smart Heuristics
        let foundSerial = "";
        let foundModel = "";

        const serialKeywords = ["serial", "s/n", "serials", "sn#", "ser no"];
        const modelKeywords = ["model", "m/n", "mn#", "mod no"];

        lines.forEach(line => {
            const cleanLine = line.toLowerCase().trim();

            // Look for patterns like S/N: XXXXXXXX
            serialKeywords.forEach(k => {
                if (cleanLine.includes(k)) {
                    const match = line.match(/[:.\-\s]+([a-zA-Z0-9]{5,})/i);
                    if (match && !foundSerial) foundSerial = match[1].trim();
                }
            });

            modelKeywords.forEach(k => {
                if (cleanLine.includes(k)) {
                    const match = line.match(/[:.\-\s]+([a-zA-Z0-9\-]{5,})/i);
                    if (match && !foundModel) foundModel = match[1].trim();
                }
            });
        });

        // Backup regex if keywords failed
        if (!foundSerial) foundSerial = text.match(/[A-Z0-9]{7,12}/)?.[0] || "";

        const foundBrand = Object.keys(MANUFACTURER_PORTALS).find(brand =>
            text.toLowerCase().includes(brand.toLowerCase())
        ) || "";

        setExtractedData({
            serialNumber: foundSerial.toUpperCase(),
            modelNumber: foundModel.toUpperCase(),
            manufacturer: foundBrand
        });
    };

    const reset = () => {
        setImage(null);
        setOcrText("");
        setExtractedData({ serialNumber: "", modelNumber: "", manufacturer: "" });
    };

    const copyToClipboard = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${field} copied for portal pasting!`);
    };

    const openManufacturerPortal = () => {
        const portal = MANUFACTURER_PORTALS[extractedData.manufacturer];
        if (portal) {
            window.open(portal.url, "_blank");
        } else {
            const query = `${extractedData.manufacturer} warranty serial lookup ${extractedData.serialNumber}`;
            window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
        }
    };

    const handleSaveAsset = async () => {
        if (!selectedClientId) {
            toast.error("Select a client.");
            return;
        }
        setSaving(true);
        try {
            const { error } = await supabase.from('assets').insert({
                client_id: selectedClientId,
                name: `${extractedData.manufacturer || 'Unknown'} Unit`,
                serial_number: extractedData.serialNumber,
                model_number: extractedData.modelNumber,
                manufacturer: extractedData.manufacturer,
                status: 'active'
            });
            if (error) throw error;
            toast.success("Asset recorded successfully.");
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const portalInfo = MANUFACTURER_PORTALS[extractedData.manufacturer];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800">
            <div className="container mx-auto p-4 max-w-5xl">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white flex items-center gap-3">
                            <ShieldCheck className="w-10 h-10 text-blue-600" />
                            Warranty Auto-Pilot
                        </h1>
                        <p className="text-slate-500 font-medium">Smart OCR & Manufacturer Lifecycle Portal</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left: Vision Center */}
                    <div className="lg:col-span-7 space-y-6">
                        <Card className="overflow-hidden border-none shadow-2xl bg-black rounded-3xl relative aspect-video flex items-center justify-center group">
                            {!image ? (
                                <>
                                    <Webcam
                                        audio={false}
                                        ref={webcamRef}
                                        screenshotFormat="image/jpeg"
                                        videoConstraints={{ facingMode: "environment" }}
                                        className="w-full h-full object-cover opacity-80"
                                    />
                                    <div className="absolute inset-0 border-[30px] border-black/20 pointer-events-none" />
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                        <div className="w-64 h-32 border-2 border-white/40 rounded-xl relative">
                                            <div className="absolute -top-1 -left-1 w-4 h-4 border-t-4 border-l-4 border-blue-500" />
                                            <div className="absolute -top-1 -right-1 w-4 h-4 border-t-4 border-r-4 border-blue-500" />
                                            <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-4 border-l-4 border-blue-500" />
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-4 border-r-4 border-blue-500" />
                                        </div>
                                    </div>
                                    <div className="absolute bottom-8 flex justify-center w-full">
                                        <Button
                                            onClick={capture}
                                            className="w-20 h-20 rounded-full bg-white text-black hover:bg-white/90 shadow-2xl ring-8 ring-white/20 transition-all hover:scale-110 active:scale-95"
                                        >
                                            <Scan className="w-10 h-10" />
                                        </Button>
                                    </div>
                                </>
                            ) : (
                                <div className="relative w-full h-full">
                                    <img src={image} className="w-full h-full object-contain" alt="Scan" />
                                    <AnimatePresence>
                                        {scanning && (
                                            <motion.div
                                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                className="absolute inset-0 bg-blue-600/40 backdrop-blur-sm flex flex-col items-center justify-center text-white"
                                            >
                                                <RefreshCw className="w-12 h-12 animate-spin mb-4" />
                                                <p className="text-xl font-black uppercase tracking-widest">AI Vision Running</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    {!scanning && (
                                        <Button onClick={reset} variant="secondary" className="absolute top-4 right-4 rounded-full px-6 bg-black/50 text-white backdrop-blur-xl border-white/20">
                                            <RefreshCw className="mr-2 h-4 w-4" /> Reset Vision
                                        </Button>
                                    )}
                                </div>
                            )}
                        </Card>

                        <Card className="bg-white dark:bg-slate-950 border-none shadow-xl rounded-2xl overflow-hidden">
                            <CardHeader className="bg-slate-50 dark:bg-slate-900/50">
                                <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Raw OCR Stream</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                                <div className="h-24 overflow-y-auto font-mono text-[10px] text-slate-500 bg-slate-50 dark:bg-slate-900 p-3 rounded-lg border">
                                    {ocrText || "Awaiting scan input..."}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right: Automation Console */}
                    <div className="lg:col-span-5 space-y-6">
                        <Card className="border-none shadow-2xl rounded-3xl overflow-hidden ring-1 ring-slate-200 dark:ring-slate-800">
                            <CardHeader className="pb-2">
                                <div className="flex justify-between items-center mb-2">
                                    <Badge className="bg-blue-600 text-white font-bold p-1 px-3">Lifecycle Phase</Badge>
                                    {extractedData.manufacturer && <Badge className={`${portalInfo?.color || 'bg-slate-600'} text-white`}>{extractedData.manufacturer}</Badge>}
                                </div>
                                <CardTitle className="text-2xl font-black">Asset Identification</CardTitle>
                                <CardDescription>Data extracted via Tesseract Neural Engine.</CardDescription>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-6">
                                <div className="grid gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase">Manufacturer Entity</Label>
                                        <Input
                                            value={extractedData.manufacturer}
                                            onChange={e => setExtractedData({ ...extractedData, manufacturer: e.target.value })}
                                            className="h-12 text-lg font-bold bg-slate-50 dark:bg-slate-900 border-none"
                                            placeholder="Brand Name"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase">Serial Number (S/N)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={extractedData.serialNumber}
                                                onChange={e => setExtractedData({ ...extractedData, serialNumber: e.target.value.toUpperCase() })}
                                                className="h-12 text-2xl font-black bg-slate-50 dark:bg-slate-900 border-none tracking-widest text-blue-600"
                                                placeholder="XXXXXXXX"
                                            />
                                            <Button size="icon" variant="secondary" className="h-12 w-12" onClick={() => copyToClipboard(extractedData.serialNumber, "S/N")}>
                                                <ClipboardCheck className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs font-black text-slate-400 uppercase">Model Number (M/N)</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                value={extractedData.modelNumber}
                                                onChange={e => setExtractedData({ ...extractedData, modelNumber: e.target.value.toUpperCase() })}
                                                className="h-12 text-lg font-bold bg-slate-50 dark:bg-slate-900 border-none"
                                                placeholder="MODEL-ID-2024"
                                            />
                                            <Button size="icon" variant="secondary" className="h-12 w-12" onClick={() => copyToClipboard(extractedData.modelNumber, "M/N")}>
                                                <Copy className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-900 rounded-2xl space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-white">
                                            <ExternalLink className="w-4 h-4 text-blue-400" />
                                            <span className="text-xs font-bold uppercase tracking-tight">Direct Lookup Portal</span>
                                        </div>
                                        {portalInfo ? (
                                            <Badge variant="outline" className="border-blue-500/50 text-blue-400">Mapped: {portalInfo.note}</Badge>
                                        ) : (
                                            <Badge variant="outline" className="text-slate-500">Manual Lookup</Badge>
                                        )}
                                    </div>

                                    <Button
                                        onClick={openManufacturerPortal}
                                        className={`w-full h-14 text-xl font-black shadow-xl transition-all hover:scale-[1.02] ${portalInfo ? portalInfo.color : 'bg-slate-700'}`}
                                        disabled={!extractedData.serialNumber}
                                    >
                                        {portalInfo ? `Open ${extractedData.manufacturer} Portal` : "Global Warranty Search"}
                                    </Button>
                                    <p className="text-[10px] text-slate-400 text-center uppercase font-bold tracking-widest">
                                        Portal will open in new tab. Use copy buttons above for form entry.
                                    </p>
                                </div>

                                <div className="space-y-4 pt-4">
                                    <Label className="text-xs font-black text-slate-400 uppercase">Finalize Record</Label>
                                    <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                                        <SelectTrigger className="h-12 bg-white dark:bg-slate-950 border-slate-200">
                                            <SelectValue placeholder="Assign to Homeowner Profile" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <Button
                                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-lg font-bold rounded-2xl shadow-lg"
                                        onClick={handleSaveAsset}
                                        disabled={saving || !selectedClientId}
                                    >
                                        {saving ? <RefreshCw className="animate-spin mr-2" /> : <Save className="mr-2" />}
                                        Save Asset to Tech Profile
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
