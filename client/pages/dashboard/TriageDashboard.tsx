import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle, AlertTriangle, ArrowRight, UserPlus, FileText, Phone, MessageSquare } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";

interface TriageSubmission {
    id: string;
    homeowner_name: string;
    homeowner_phone: string;
    problem_description: string;
    media_urls: string[] | null;
    ai_analysis: any;
    status: 'new' | 'analyzed' | 'converted';
    created_at: string;
}

export default function TriageDashboard() {
    const { user } = useSupabaseAuth();
    const { toast } = useToast();
    const [submissions, setSubmissions] = useState<TriageSubmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [converting, setConverting] = useState<string | null>(null);
    const [companyId, setCompanyId] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            fetchSubmissions();
            fetchCompanyId();
        }
    }, [user]);

    const fetchCompanyId = async () => {
        if (!user) return;
        // Find company where this user is the owner
        const { data, error } = await supabase
            .from('companies')
            .select('id')
            .eq('user_id', user.id)
            .single();

        if (data) {
            setCompanyId(data.id);
        } else {
            console.log("No company found for user, creating generic one if needed or relying on manual setup");
            // For dev/test MVP, if no company exists, we might need one.
            // But existing setup scripts typically create one.
        }
    };

    const fetchSubmissions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('triage_submissions')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSubmissions(data || []);
        } catch (error: any) {
            console.error('Error fetching triage:', error);
            toast({ title: "Error", description: "Failed to load submissions.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleConvert = async (submission: TriageSubmission) => {
        if (!user || !companyId) {
            toast({ title: "Configuration Error", description: "No Company ID found for Admin. Cannot create client.", variant: "destructive" });
            return;
        }

        setConverting(submission.id);
        try {
            // 1. Create Client
            const { data: client, error: clientError } = await supabase
                .from('clients')
                .insert({
                    company_id: companyId,
                    name: submission.homeowner_name,
                    contact_name: submission.homeowner_name,
                    contact_phone: submission.homeowner_phone,
                    address: "TBD - From Triage"
                })
                .select()
                .single();

            if (clientError) throw clientError;

            // 2. Create Job
            const { error: jobError } = await supabase
                .from('jobs')
                .insert({
                    user_id: user.id,
                    client_name: client.name,
                    client_id: client.id,
                    job_name: "Triage Request: " + submission.problem_description.substring(0, 30) + "...",
                    description: `Problem: ${submission.problem_description}\n\nPhone: ${submission.homeowner_phone}\n\nAI Analysis: ${JSON.stringify(submission.ai_analysis, null, 2)}`,
                    status: 'pending'
                });

            if (jobError) throw jobError;

            // 3. Update Submission Status
            await supabase
                .from('triage_submissions')
                .update({ status: 'converted' })
                .eq('id', submission.id);

            toast({ title: "Success", description: "Lead converted to Client and Job!" });
            fetchSubmissions(); // Refresh list

        } catch (err: any) {
            console.error(err);
            toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
        } finally {
            setConverting(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-8">
            <div className="max-w-7xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Triage Command Center</h1>
                    <p className="text-slate-500 dark:text-slate-400">Manage, analyze, and convert incoming homeowner service requests.</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin w-10 h-10 text-blue-600" /></div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {submissions.map((sub) => (
                            <Card key={sub.id} className={`overflow-hidden transition-all ${sub.status === 'converted' ? 'opacity-60 grayscale-[0.5]' : 'hover:shadow-lg'}`}>
                                <CardHeader className="bg-white dark:bg-slate-950 pb-3">
                                    <div className="flex justify-between items-start">
                                        <Badge variant={sub.status === 'new' ? 'destructive' : sub.status === 'converted' ? 'default' : 'secondary'}>
                                            {sub.status.toUpperCase()}
                                        </Badge>
                                        <span className="text-xs text-slate-400">
                                            {new Date(sub.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <CardTitle className="mt-2 text-lg">{sub.homeowner_name}</CardTitle>
                                    <CardDescription className="flex items-center gap-1">
                                        <Phone className="w-3 h-3" /> {sub.homeowner_phone}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="pt-4 space-y-4 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="text-sm text-slate-700 dark:text-slate-300">
                                        <div className="font-semibold mb-1 flex items-center gap-2">
                                            <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> Issue:
                                        </div>
                                        {sub.problem_description}
                                    </div>

                                    {/* AI Analysis Section */}
                                    {sub.ai_analysis && Object.keys(sub.ai_analysis).length > 0 && (
                                        <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-md border border-blue-100 dark:border-blue-900/50 text-xs text-blue-800 dark:text-blue-300">
                                            <span className="font-bold block mb-1">🤖 AI Insight:</span>
                                            {sub.ai_analysis.summary || "Analysis processing..."}
                                            {sub.ai_analysis.urgency && (
                                                <div className="mt-1 font-semibold">Urgency: {sub.ai_analysis.urgency}</div>
                                            )}
                                        </div>
                                    )}

                                    {/* Media */}
                                    {sub.media_urls && sub.media_urls.length > 0 && (
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {sub.media_urls.map((url, idx) => (
                                                <img key={idx} src={url} className="w-16 h-16 object-cover rounded-md border border-slate-200" />
                                            ))}
                                        </div>
                                    )}

                                    {/* Action Button */}
                                    {sub.status !== 'converted' && (
                                        <Button
                                            onClick={() => handleConvert(sub)}
                                            disabled={converting === sub.id}
                                            className="w-full bg-emerald-600 hover:bg-emerald-700"
                                        >
                                            {converting === sub.id ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />}
                                            Convert to Job
                                        </Button>
                                    )}
                                    {sub.status === 'converted' && (
                                        <div className="text-center text-sm font-medium text-emerald-600 flex items-center justify-center gap-2">
                                            <CheckCircle className="w-4 h-4" /> Converted to Job
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}

                        {submissions.length === 0 && (
                            <div className="col-span-full text-center py-20 text-slate-400">
                                No triage submissions found.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
