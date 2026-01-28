
import React, { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import Tesseract from "tesseract.js";
import { Camera, RefreshCw, Search, CheckCircle, AlertTriangle, Scan, Copy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function WarrantyScanner() {
    const webcamRef = useRef<Webcam>(null);
    const [image, setImage] = useState<string | null>(null);
    const [scanning, setScanning] = useState(false);
    const [ocrText, setOcrText] = useState("");
    const [extractedData, setExtractedData] = useState({
        serialNumber: "",
        modelNumber: "",
        manufacturer: ""
    });

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
            const result = await Tesseract.recognize(
                imageSrc,
                'eng',
                {
                    logger: m => console.log(m) // Optional: log progress
                }
            );

            const text = result.data.text;
            setOcrText(text);
            extractInfo(text);
            toast.success("Text scanned successfully!");
        } catch (err) {
            console.error(err);
            toast.error("Failed to scan text.");
        } finally {
            setScanning(false);
        }
    };

    const extractInfo = (text: string) => {
        // Simple regex heuristics for HVAC plates
        // Serials often: S/N:, Serial:, Serial No.
        // Models often: M/N:, Model:, Model No.

        const serialRegex = /(?:serial|s\/n|sn)[:.\-\s]+([a-zA-Z0-9]+)/i;
        const modelRegex = /(?:model|m\/n|mn)[:.\-\s]+([a-zA-Z0-9-]+)/i;
        // Manufacturers (Common ones)
        const brands = ["Carrier", "Trane", "Lennox", "Goodman", "Rheem", "York", "Daikin", "Mitsubishi", "Bryant", "American Standard"];

        const foundSerial = text.match(serialRegex)?.[1] || "";
        const foundModel = text.match(modelRegex)?.[1] || "";
        const foundBrand = brands.find(b => text.toLowerCase().includes(b.toLowerCase())) || "";

        setExtractedData({
            serialNumber: foundSerial,
            modelNumber: foundModel,
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
        toast.success(`${field} copied!`);
    };

    const lookupWarranty = () => {
        const query = `${extractedData.manufacturer} warranty lookup ${extractedData.serialNumber}`;
        const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
        window.open(url, "_blank");
    };

    return (
        <div className="container mx-auto p-4 max-w-4xl space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                        <Scan className="w-8 h-8 text-blue-600" />
                        Warranty Auto-Pilot
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-1">
                        Scan equipment data plates to instantly find warranty status.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Camera / Image Section */}
                <Card className="overflow-hidden bg-black/5 dark:bg-white/5 border-slate-200 dark:border-slate-800">
                    <CardContent className="p-0 relative min-h-[400px] flex items-center justify-center">
                        {!image ? (
                            <div className="relative w-full h-full flex items-center justify-center bg-black">
                                <Webcam
                                    audio={false}
                                    ref={webcamRef}
                                    screenshotFormat="image/jpeg"
                                    videoConstraints={{ facingMode: "environment" }}
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-x-0 bottom-8 flex justify-center">
                                    <Button onClick={capture} size="lg" className="rounded-full w-16 h-16 bg-white text-black hover:bg-slate-200 shadow-xl border-4 border-slate-300/30">
                                        <Camera className="w-8 h-8" />
                                    </Button>
                                </div>
                                <div className="absolute top-4 right-4">
                                    <Badge variant="secondary" className="bg-black/50 text-white backdrop-blur-md">Live Camera</Badge>
                                </div>
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <img src={image} alt="Captured" className="w-full h-full object-contain bg-black" />
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
                                    {scanning ? (
                                        <div className="text-center space-y-4">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto"></div>
                                            </div>
                                            <p className="text-white font-medium animate-pulse">Running OCR Analysis...</p>
                                        </div>
                                    ) : (
                                        <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                                            <Button onClick={reset} variant="secondary">
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Retake
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Data Extraction Section */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Search className="w-5 h-5 text-blue-500" />
                            Detected Information
                        </CardTitle>
                        <CardDescription>
                            Review the scanned text and extracted serials.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 flex-1">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Manufacturer</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={extractedData.manufacturer}
                                        onChange={(e) => setExtractedData({ ...extractedData, manufacturer: e.target.value })}
                                        placeholder="Or detecting brand..."
                                    />
                                    {extractedData.manufacturer && (
                                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                            <CheckCircle className="w-3 h-3 mr-1" /> Found
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Serial Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={extractedData.serialNumber}
                                        onChange={(e) => setExtractedData({ ...extractedData, serialNumber: e.target.value })}
                                        placeholder="Scanning for S/N..."
                                        className="font-mono"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(extractedData.serialNumber, "Serial Number")}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Model Number</Label>
                                <div className="flex gap-2">
                                    <Input
                                        value={extractedData.modelNumber}
                                        onChange={(e) => setExtractedData({ ...extractedData, modelNumber: e.target.value })}
                                        placeholder="Scanning for M/N..."
                                        className="font-mono"
                                    />
                                    <Button size="icon" variant="ghost" onClick={() => copyToClipboard(extractedData.modelNumber, "Model Number")}>
                                        <Copy className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="pt-4">
                                <Button
                                    onClick={lookupWarranty}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                                    disabled={!extractedData.serialNumber && !extractedData.manufacturer}
                                >
                                    <Search className="w-4 h-4 mr-2" />
                                    Find Warranty (Google Search)
                                </Button>
                                <p className="text-xs text-center mt-2 text-slate-400">
                                    Redirects to manufacturer site or smart search.
                                </p>
                            </div>
                        </div>

                        {/* Raw OCR Debug (Collapsible or small) */}
                        <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <Label className="text-xs text-slate-400 mb-2 block">RAW OCR TEXT</Label>
                            <div className="bg-slate-50 dark:bg-slate-900 p-2 rounded text-[10px] text-slate-500 font-mono h-24 overflow-y-auto whitespace-pre-wrap">
                                {ocrText || "Ready to scan..."}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
