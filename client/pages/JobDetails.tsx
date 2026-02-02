import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useJob } from "@/context/JobContext";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { ArrowLeft, MapPin, Calendar, User, FileText, CheckCircle, Activity, Clock, Mic, MicOff, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { InvoiceList } from "@/components/invoices/InvoiceList";
import { WarrantyList } from "@/components/warranty/WarrantyList";
import { PageContainer } from "@/components/PageContainer";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { Textarea } from "@/components/ui/textarea";

interface Job {
    id: string;
    created_at: string;
    client_name: string;
    company_id: string;
    client_id: string;
    user_id: string;
    job_name: string;
    status: 'active' | 'completed' | 'pending';
    address: string | null;
    notes: string | null;
    photos: string[] | null;
}

export default function JobDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { selectJob, currentJob } = useJob();
    const { companyId: authCompanyId } = useAuth();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    // Voice Input State
    const { isRecording, isTranscribing, transcript, startRecording, stopRecording, error: voiceError } = useVoiceInput();
    const [localNotes, setLocalNotes] = useState("");
    const [extractedInvoiceData, setExtractedInvoiceData] = useState<any>(null);
    const [extractedWarrantyData, setExtractedWarrantyData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("photos");

    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleSmartAnalysis = async () => {
        if (!localNotes) return;
        setIsAnalyzing(true);
        try {
            const { data, error } = await supabase.functions.invoke('ai-gateway', {
                body: {
                    mode: 'fast-reasoning',
                    messages: [
                        { role: 'system', content: 'You are an expert HVAC assistant. Analyze the technician notes to extract TWO things:\n1. Invoice Line Items: quantities, descriptions, and costs.\n2. Warranty Claim Details: Equipment Brand, Model #, Serial #, Symptom, and Diagnosis.\n\nReturn ONLY valid JSON in this format:\n{ \n  "items": [{ "description": "...", "quantity": 1, "price": 0 }],\n  "warranty": { "brand": "...", "model": "...", "serial": "...", "symptom": "...", "diagnosis": "..." }\n}\nIf specific fields are missing, leave them as empty strings or null.' },
                        { role: 'user', content: localNotes }
                    ]
                }
            });

            if (error) throw error;

            console.log("AI Gateway Raw Response:", data);

            // Access the content from the completion
            const content = data.choices?.[0]?.message?.content;

            if (!content) throw new Error("No content received from AI");

            // Clean up markdown
            const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
            const extraction = JSON.parse(jsonString);

            console.log("AI Extraction Parsed:", extraction);

            const totalAmount = extraction.items?.reduce((acc: number, item: any) => acc + ((item.price || 0) * (item.quantity || 1)), 0) || 0;

            setExtractedInvoiceData({
                description: `Voice Note Extraction:\n${localNotes}`,
                items: extraction.items || [],
                amount: totalAmount
            });

            if (extraction.warranty && (extraction.warranty.brand || extraction.warranty.serial || extraction.warranty.symptom)) {
                setExtractedWarrantyData(extraction.warranty);
                toast({
                    title: "Warranty Info Detected",
                    description: "Warranty claim details extracted from voice note.",
                });
            }

            // Heuristic: If warranty info is strong, maybe switch to warranty tab? For now, default to invoices as originally requested, or let user choose.
            // We'll stick to 'invoices' as primary for now, or check which has more data.
            setActiveTab("invoices");

            toast({
                title: "Smart Analysis Complete",
                description: `Found ${extraction.items?.length || 0} items.`,
            });

        } catch (err: any) {
            console.error("Smart Analysis failed:", err);
            toast({
                title: "Analysis Failed",
                description: err.message || "Could not extract data.",
                variant: "destructive",
            });
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Update local notes when transcript arrives
    useEffect(() => {
        if (transcript) {
            setLocalNotes(prev => prev ? `${prev}\n\n[Voice Note]: ${transcript}` : `[Voice Note]: ${transcript}`);
            toast({
                title: "Voice Note Added",
                description: "Your voice note has been transcribed.",
            });
        }
    }, [transcript]);

    useEffect(() => {
        if (id) {
            fetchJob(id);
        }
    }, [id]);

    const fetchJob = async (jobId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .eq('id', jobId)
                .single();

            if (error) throw error;
            setJob(data);
            if (data.notes) setLocalNotes(data.notes);
        } catch (error: any) {
            console.error('Error fetching job:', error);
            toast({
                title: "Error",
                description: "Failed to load job details.",
                variant: "destructive",
            });
            navigate('/dashboard/jobs');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveNotes = async () => {
        if (!job) return;
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ notes: localNotes })
                .eq('id', job.id);

            if (error) throw error;

            toast({
                title: "Saved",
                description: "Job notes updated successfully.",
            });

            // Update local job state
            setJob(prev => prev ? ({ ...prev, notes: localNotes }) : null);

        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to save notes.",
                variant: "destructive",
            });
        }
    };

    const handleSetActive = () => {
        if (job) {
            selectJob({
                id: job.id,
                name: job.job_name,
                address: job.address || undefined,
                status: job.status
            });
            toast({
                title: "Context Updated",
                description: `${job.job_name} is now the active job.`,
            });
            navigate('/dashboard');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!job) return null;

    const isActive = currentJob?.id === job.id;

    return (
        <PageContainer variant="standard">
            <div className="space-y-6">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard/jobs')}>
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{job.job_name}</h1>
                            <div className="flex items-center text-muted-foreground mt-1">
                                <User className="w-4 h-4 mr-1" />
                                <span>{job.client_name}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="text-sm px-3 py-1 capitalize">
                            {job.status}
                        </Badge>
                        <Button
                            variant={isActive ? "secondary" : "default"}
                            onClick={handleSetActive}
                            disabled={isActive}
                        >
                            {isActive ? (
                                <>
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Active Context
                                </>
                            ) : (
                                <>
                                    <Activity className="w-4 h-4 mr-2" />
                                    Set as Active Job
                                </>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Voice Dictation Alert */}
                {voiceError && (
                    <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm border border-destructive/20">
                        {voiceError}
                    </div>
                )}

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left Column: Details */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg">Job Notes & Dictation</CardTitle>
                                {isRecording ? (
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="animate-pulse"
                                        onClick={stopRecording}
                                    >
                                        <MicOff className="w-4 h-4 mr-2" />
                                        Stop Recording
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={startRecording}
                                        disabled={isTranscribing}
                                        className="border-blue-200 hover:bg-blue-50 dark:border-blue-800 dark:hover:bg-blue-950"
                                    >
                                        {isTranscribing ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Transcribing...
                                            </>
                                        ) : (
                                            <>
                                                <Mic className="w-4 h-4 mr-2 text-blue-500" />
                                                Add Voice Note
                                            </>
                                        )}
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-4 pt-4">
                                <div className="space-y-1">
                                    <Textarea
                                        value={localNotes}
                                        onChange={(e) => setLocalNotes(e.target.value)}
                                        placeholder="Type notes or use the microphone button to dictate..."
                                        className="min-h-[150px] font-mono text-sm"
                                    />
                                    <div className="flex justify-between pt-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={handleSmartAnalysis}
                                            disabled={isAnalyzing || !localNotes}
                                            className="border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40"
                                        >
                                            {isAnalyzing ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                    Analyzing...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2 text-purple-600 dark:text-purple-400" />
                                                    Smart Fill
                                                </>
                                            )}
                                        </Button>
                                        <Button size="sm" onClick={handleSaveNotes}>Save Notes</Button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Address</label>
                                        <div className="flex items-start">
                                            <MapPin className="w-4 h-4 mr-2 mt-1 text-primary" />
                                            <span>{job.address || "No address provided"}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-muted-foreground">Created Date</label>
                                        <div className="flex items-center">
                                            <Calendar className="w-4 h-4 mr-2 text-primary" />
                                            <span>{new Date(job.created_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                <TabsTrigger value="photos">Photos</TabsTrigger>
                                <TabsTrigger value="invoices">Invoices</TabsTrigger>
                                <TabsTrigger value="warranty">Warranty</TabsTrigger>
                                <TabsTrigger value="docs">Documents</TabsTrigger>
                                <TabsTrigger value="history">History</TabsTrigger>
                            </TabsList>
                            <TabsContent value="photos" className="mt-4">
                                <Card>
                                    <CardContent className="p-6">
                                        {job.photos && job.photos.length > 0 ? (
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                {job.photos.map((photo, index) => (
                                                    <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden relative group">
                                                        <img src={photo} alt={`Job photo ${index + 1}`} className="w-full h-full object-cover" />
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 text-muted-foreground">
                                                <div className="bg-muted/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <FileText className="w-8 h-8 opacity-50" />
                                                </div>
                                                <p>No photos uploaded yet.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="invoices" className="mt-4">
                                <InvoiceList
                                    jobId={job.id}
                                    clientId={job.client_id}
                                    companyId={job.company_id}
                                    suggestedInvoiceData={extractedInvoiceData}
                                />
                            </TabsContent>
                            <TabsContent value="warranty" className="mt-4">
                                <WarrantyList
                                    jobId={job.id}
                                    userId={job.user_id}
                                    suggestedClaimData={extractedWarrantyData}
                                />
                            </TabsContent>
                            <TabsContent value="docs" className="mt-4">
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Document management coming soon.</p>
                                </div>
                            </TabsContent>
                            <TabsContent value="history" className="mt-4">
                                <div className="text-center py-12 text-muted-foreground">
                                    <p>Job history tracking coming soon.</p>
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Right Column: Actions / Status */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Quick Actions</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/estimate-builder')}>
                                    <FileText className="w-4 h-4 mr-2" />
                                    Create Estimate
                                </Button>
                                <Button variant="outline" className="w-full justify-start" disabled>
                                    <Clock className="w-4 h-4 mr-2" />
                                    Log Hours (Soon)
                                </Button>
                            </CardContent>
                        </Card>
                    </div>

                </div>
            </div>
        </PageContainer>
    );
}
