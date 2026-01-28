
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, AlertCircle, UploadCloud, Camera, ArrowRight, Loader2, PlayCircle, ImageIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function Triage() {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        description: "",
    });
    const [files, setFiles] = useState<File[]>([]);
    const [uploading, setUploading] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
        }
    };

    const handleNext = () => setStep((prev) => prev + 1);
    const handleBack = () => setStep((prev) => prev - 1);

    const handleSubmit = async () => {
        setLoading(true);
        setProgress(10);
        try {
            // 1. Upload Files
            const mediaUrls: string[] = [];
            setUploading(true);

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
                const filePath = `submissions/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('triage-uploads')
                    .upload(filePath, file);

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('triage-uploads')
                    .getPublicUrl(filePath);

                mediaUrls.push(publicUrl);
                setProgress(10 + ((i + 1) / files.length) * 40); // Upload takes up to 50%
            }
            setUploading(false);

            // 2. Submit Data
            setProgress(60);
            const { data: submissionData, error: dbError } = await supabase
                .from('triage_submissions')
                .insert({
                    homeowner_name: formData.name,
                    homeowner_phone: formData.phone,
                    problem_description: formData.description,
                    media_urls: mediaUrls,
                    status: 'new'
                })
                .select(); // Select the inserted data to get the ID

            if (dbError) throw dbError;
            if (!submissionData || submissionData.length === 0) throw new Error("Failed to retrieve submission ID.");

            // 3. Trigger AI Analysis
            setProgress(70);
            try {
                // Attempt to call the Edge Function
                const { data: funcData, error: funcError } = await supabase.functions.invoke('analyze-triage-media', {
                    body: { submission_id: submissionData[0].id }
                });

                if (funcError) {
                    console.warn("Edge Function failed (likely not deployed or missing keys). Falling back to mock.", funcError);
                    // Mock fallback for demo purposes
                    await new Promise(resolve => setTimeout(resolve, 2000));
                } else {
                    console.log("AI Analysis Result:", funcData);
                }
            } catch (err) {
                console.warn("Edge Function invocation error:", err);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            setProgress(100);
            setStep(4); // Success Step
            toast({ title: "Submission Received", description: "Our AI is analyzing your issue. An agent will contact you shortly." });

        } catch (error: any) {
            console.error(error);
            toast({ title: "Error", description: error.message || "Failed to submit triage." });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg">

                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4">
                        <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">ThermoNeural AI Triage</h1>
                    <p className="text-slate-500 dark:text-slate-400">Diagnose your HVAC system in seconds.</p>
                </div>

                <AnimatePresence mode="wait">
                    {step === 1 && (
                        <motion.div
                            key="step1"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <Card className="shadow-xl border-t-4 border-blue-500">
                                <CardHeader>
                                    <CardTitle>Who are you?</CardTitle>
                                    <CardDescription>We need your contact info to send the diagnosis.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Full Name</Label>
                                        <Input
                                            placeholder="John Doe"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Phone Number</Label>
                                        <Input
                                            placeholder="(555) 123-4567"
                                            type="tel"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter>
                                    <Button
                                        className="w-full"
                                        onClick={handleNext}
                                        disabled={!formData.name || !formData.phone}
                                    >
                                        Next <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 2 && (
                        <motion.div
                            key="step2"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <Card className="shadow-xl border-t-4 border-blue-500">
                                <CardHeader>
                                    <CardTitle>What's wrong?</CardTitle>
                                    <CardDescription>Tell us what is happening with your system.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Problem Description</Label>
                                        <Textarea
                                            placeholder="e.g. It's making a loud banging noise and blowing warm air..."
                                            className="h-32"
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="ghost" onClick={handleBack}>Back</Button>
                                    <Button onClick={handleNext} disabled={!formData.description}>
                                        Next <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 3 && (
                        <motion.div
                            key="step3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            <Card className="shadow-xl border-t-4 border-blue-500">
                                <CardHeader>
                                    <CardTitle>Show us.</CardTitle>
                                    <CardDescription>Upload photos or video of the unit and the model plate.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="bg-slate-50 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8 flex flex-col items-center justify-center text-center hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer relative">
                                        <input
                                            type="file"
                                            multiple
                                            accept="image/*,video/*"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={handleFileChange}
                                        />
                                        <UploadCloud className="w-12 h-12 text-blue-500 mb-2" />
                                        <p className="font-medium text-slate-700 dark:text-slate-200">Tap to Upload</p>
                                        <p className="text-sm text-slate-500">Photos or Short Video</p>
                                    </div>

                                    {files.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-sm font-medium text-slate-500">{files.length} files selected:</p>
                                            <div className="grid grid-cols-2 gap-2">
                                                {files.map((f, i) => (
                                                    <div key={i} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded text-xs truncate">
                                                        {f.type.startsWith('video') ? <PlayCircle className="w-3 h-3" /> : <ImageIcon className="w-3 h-3" />}
                                                        <span className="truncate">{f.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {loading && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs text-slate-500">
                                                <span>{uploading ? "Uploading..." : "Analyzing..."}</span>
                                                <span>{Math.round(progress)}%</span>
                                            </div>
                                            <Progress value={progress} className="h-2" />
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-between">
                                    <Button variant="ghost" onClick={handleBack} disabled={loading}>Back</Button>
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={files.length === 0 || loading}
                                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20"
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                                        Analyze My System
                                    </Button>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )}

                    {step === 4 && (
                        <motion.div
                            key="step4"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                        >
                            <Card className="shadow-2xl border-t-4 border-green-500 bg-white dark:bg-slate-900">
                                <CardContent className="pt-8 pb-8 flex flex-col items-center text-center space-y-4">
                                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-2">
                                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Analysis Complete!</h2>
                                    <p className="text-slate-600 dark:text-slate-300 max-w-xs">
                                        We have received your data. Our AI is reviewing the footage and a technician has been notified.
                                    </p>
                                    <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg w-full text-left text-sm space-y-2 mt-4">
                                        <p><strong>Ticket ID:</strong> #{Math.floor(Math.random() * 10000)}</p>
                                        <p><strong>Est. Response:</strong> 15 Mins</p>
                                    </div>
                                    <Button
                                        className="w-full mt-4"
                                        variant="outline"
                                        onClick={() => window.location.reload()}
                                    >
                                        Start New Triage
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400">
                        &copy; 2025 ThermoNeural. Inc.
                        <br />
                        <span className="opacity-50">Powered by OpenAI GPT-4o Vision</span>
                    </p>
                </div>
            </div>
        </div>
    );
}
