import React, { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  UserPlus,
  FileText,
  Phone,
  MessageSquare,
  Eye,
  Archive,
  Clock,
  ShieldCheck,
  Zap,
  ImageIcon,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageContainer } from "@/components/PageContainer";

interface AIAnalysis {
  equipment_details?: string;
  suspected_issue?: string;
  severity?: "low" | "medium" | "high";
  technician_notes?: string;
  summary?: string; // Legacy/Fallback
  urgency?: string; // Legacy/Fallback
}

interface TriageSubmission {
  id: string;
  homeowner_name: string;
  homeowner_phone: string;
  problem_description: string;
  media_urls: string[] | null;
  ai_analysis: AIAnalysis;
  status: "new" | "analyzed" | "converted" | "archived";
  created_at: string;
}

export default function TriageDashboard() {
  const { user } = useSupabaseAuth();
  const { toast } = useToast();
  const [submissions, setSubmissions] = useState<TriageSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] =
    useState<TriageSubmission | null>(null);
  const [filter, setFilter] = useState<string>("active");

  const fetchSubmissions = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("triage_submissions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error: any) {
      console.error("Error fetching triage:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Safety timeout - ensure loading stops even if queries hang
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.warn(
          "[TriageDashboard] Query timeout - forcing loading to false",
        );
        setLoading(false);
      }
    }, 5000); // 5 second timeout

    if (user) {
      fetchSubmissions();
      fetchCompanyId();

      // Real-time subscription
      const channel = supabase
        .channel("triage_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "triage_submissions",
          },
          (payload) => {
            console.log("Real-time update:", payload);
            fetchSubmissions();
            if (payload.eventType === "INSERT") {
              toast({
                title: "New Triage Lead! 🚨",
                description: `New request from ${payload.new.homeowner_name}`,
              });
            }
          },
        )
        .subscribe();

      return () => {
        clearTimeout(timeoutId);
        supabase.removeChannel(channel);
      };
    } else {
      // If no user, stop loading immediately
      setLoading(false);
      clearTimeout(timeoutId);
    }

    return () => clearTimeout(timeoutId);
  }, [user, fetchSubmissions, toast]);

  const fetchCompanyId = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("companies")
      .select("id")
      .eq("user_id", user.id)
      .single();
    if (data) setCompanyId(data.id);
  };

  const handleConvert = async (submission: TriageSubmission) => {
    if (!user || !companyId) {
      toast({
        title: "Configuration Error",
        description: "No Company ID found.",
        variant: "destructive",
      });
      return;
    }

    setConverting(submission.id);
    try {
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          company_id: companyId,
          name: submission.homeowner_name,
          contact_name: submission.homeowner_name,
          contact_phone: submission.homeowner_phone,
          address: "TBD - From Triage Lead",
        })
        .select()
        .single();

      if (clientError) throw clientError;

      const { error: jobError } = await supabase.from("jobs").insert({
        company_id: companyId,
        client_id: client.id,
        title:
          "Triage: " + submission.problem_description.substring(0, 40) + "...",
        description: `Problem: ${submission.problem_description}\n\nAI Diagnostic: ${submission.ai_analysis?.suspected_issue || "No analysis"}\n\nTech Notes: ${submission.ai_analysis?.technician_notes || ""}`,
        status: "pending",
      });

      if (jobError) throw jobError;

      await supabase
        .from("triage_submissions")
        .update({ status: "converted" })
        .eq("id", submission.id);

      toast({
        title: "Lead Converted!",
        description: "A new client and job have been created.",
      });
      setSelectedSubmission(null);
    } catch (err: any) {
      toast({
        title: "Conversion Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setConverting(null);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      const { error } = await supabase
        .from("triage_submissions")
        .update({ status: "archived" })
        .eq("id", id);

      if (error) throw error;
      toast({
        title: "Lead Archived",
        description: "Submissions moved to archives.",
      });
      setSelectedSubmission(null);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    }
  };

  const filteredSubmissions = submissions.filter((s) => {
    if (filter === "active")
      return s.status !== "archived" && s.status !== "converted";
    if (filter === "converted") return s.status === "converted";
    if (filter === "archived") return s.status === "archived";
    return true;
  });

  const getSeverityBadge = (severity?: string) => {
    if (severity === "high")
      return (
        <Badge variant="destructive" className="animate-pulse">
          Emergency
        </Badge>
      );
    if (severity === "medium")
      return <Badge className="bg-cyan-500">Urgent</Badge>;
    return <Badge variant="secondary">Routine</Badge>;
  };

  return (
    <PageContainer variant="standard" className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="h-8 w-8 text-cyan-600" />
            Triage Command Center
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            AI-powered pre-dispatch diagnostics & lead conversion.
          </p>
        </div>
      </div>

      <Tabs value={filter} onValueChange={setFilter} className="w-full">
        <TabsList className="bg-white dark:bg-slate-950 border">
          <TabsTrigger value="active">
            Active Leads (
            {
              submissions.filter(
                (s) => s.status !== "archived" && s.status !== "converted",
              ).length
            }
            )
          </TabsTrigger>
          <TabsTrigger value="converted">Jobs Created</TabsTrigger>
          <TabsTrigger value="archived">Archived</TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin w-10 h-10 text-cyan-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredSubmissions.map((sub) => (
                <Card
                  key={sub.id}
                  className={`overflow-hidden cursor-pointer transition-all hover:ring-2 hover:ring-cyan-500/50 ${sub.status === "converted" ? "bg-slate-100/50 dark:bg-slate-900/50" : "bg-white dark:bg-slate-950"}`}
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-start mb-2">
                      {getSeverityBadge(sub.ai_analysis?.severity)}
                      <span className="text-[10px] font-mono text-slate-400 uppercase">
                        {new Date(sub.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <CardTitle className="text-lg font-bold truncate">
                      {sub.homeowner_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-1 font-medium text-cyan-600 dark:text-cyan-400">
                      <Phone className="w-3 h-3" /> {sub.homeowner_phone}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="text-sm line-clamp-3">
                      <span className="font-bold text-xs uppercase text-slate-400 block mb-1">
                        Issue Description
                      </span>
                      {sub.problem_description}
                    </div>

                    {sub.ai_analysis?.suspected_issue && (
                      <div className="bg-cyan-50 dark:bg-cyan-900/20 p-3 rounded-lg border border-cyan-100 dark:border-cyan-800">
                        <div className="flex items-center gap-2 mb-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-cyan-600" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                            AI Diagnosis
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-cyan-900 dark:text-cyan-200 line-clamp-2">
                          {sub.ai_analysis.suspected_issue}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex -space-x-2">
                        {sub.media_urls?.slice(0, 3).map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-950 object-cover"
                          />
                        ))}
                        {(sub.media_urls?.length || 0) > 3 && (
                          <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border-2 border-white dark:border-slate-950 flex items-center justify-center text-[10px] font-bold">
                            +{(sub.media_urls?.length || 0) - 3}
                          </div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-cyan-600 text-xs font-bold gap-1 px-0 h-auto hover:bg-transparent"
                      >
                        Review Details <ArrowRight className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {filteredSubmissions.length === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center py-20 bg-white/50 dark:bg-slate-950/50 rounded-3xl border-2 border-dashed">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
                    <FileText className="h-8 w-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                    No {filter} leads
                  </h3>
                  <p className="text-slate-500 text-sm">
                    When new triage requests arrive, they'll appear here
                    instantly.
                  </p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Detailed Review Modal */}
      <Dialog
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col border-none shadow-2xl">
          {selectedSubmission && (
            <>
              <div className="bg-gradient-to-r from-cyan-700 to-slate-800 p-6 text-white pb-12">
                <DialogHeader>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 fill-white text-white" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] opacity-80">
                        AI Diagnostic Report
                      </span>
                    </div>
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-white/40">
                      {selectedSubmission.status.toUpperCase()}
                    </Badge>
                  </div>
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <DialogTitle className="text-3xl font-black">
                        {selectedSubmission.homeowner_name}
                      </DialogTitle>
                      <div className="flex items-center gap-4 mt-2 opacity-80 text-sm font-medium">
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5 fill-white" />{" "}
                          {selectedSubmission.homeowner_phone}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" /> Received{" "}
                          {new Date(
                            selectedSubmission.created_at,
                          ).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {selectedSubmission.status !== "converted" &&
                      selectedSubmission.status !== "archived" && (
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-100 border-red-500/20"
                            onClick={() => handleArchive(selectedSubmission.id)}
                          >
                            <Archive className="h-4 w-4 mr-2" /> Archive
                          </Button>
                          <Button
                            className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-xl shadow-emerald-950/20 px-8"
                            disabled={converting === selectedSubmission.id}
                            onClick={() => handleConvert(selectedSubmission)}
                          >
                            {converting === selectedSubmission.id ? (
                              <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            ) : (
                              <UserPlus className="h-4 w-4 mr-2" />
                            )}
                            Convert to Full Job
                          </Button>
                        </div>
                      )}
                  </div>
                </DialogHeader>
              </div>

              <ScrollArea className="flex-1 p-6 relative -mt-6 bg-slate-50 dark:bg-slate-900 rounded-t-3xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="md:col-span-2 space-y-8">
                    {/* Diagnosis Section */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Eye className="h-4 w-4" /> AI Visual Diagnostics
                      </h3>
                      <div className="grid grid-cols-1 gap-4">
                        <Card className="bg-cyan-600 text-white border-none shadow-lg">
                          <CardContent className="p-6">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="p-1.5 bg-white/20 rounded-md">
                                <ShieldCheck className="h-5 w-5" />
                              </div>
                              <span className="font-bold">SUSPECTED ISSUE</span>
                            </div>
                            <p className="text-xl font-bold leading-tight">
                              {selectedSubmission.ai_analysis
                                ?.suspected_issue || "AI analysis pending..."}
                            </p>
                          </CardContent>
                        </Card>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                              Severity Status
                            </span>
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(
                                selectedSubmission.ai_analysis?.severity,
                              )}
                              <span className="text-sm font-bold opacity-60 capitalize">
                                {selectedSubmission.ai_analysis?.severity} Risk
                              </span>
                            </div>
                          </div>
                          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border">
                            <span className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">
                              Equipment Identified
                            </span>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                              {selectedSubmission.ai_analysis
                                ?.equipment_details || "General HVAC Unit"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* Description */}
                    <section className="space-y-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" /> Homeowner
                        Description
                      </h3>
                      <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border shadow-sm italic text-slate-600 dark:text-slate-300">
                        "{selectedSubmission.problem_description}"
                      </div>
                    </section>

                    {/* Evidence Grid */}
                    {selectedSubmission.media_urls &&
                      selectedSubmission.media_urls.length > 0 && (
                        <section className="space-y-4 pb-8">
                          <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ImageIcon className="h-4 w-4" /> Photographic
                            Evidence
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {selectedSubmission.media_urls.map((url, i) => (
                              <div
                                key={i}
                                className="group relative rounded-xl overflow-hidden aspect-square border-2 border-transparent hover:border-cyan-500 transition-all cursor-zoom-in"
                              >
                                <img
                                  src={url}
                                  className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Eye className="text-white h-6 w-6" />
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>
                      )}
                  </div>

                  {/* Sidebar inside modal */}
                  <div className="space-y-6">
                    <div className="bg-slate-200/50 dark:bg-slate-800/50 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700">
                      <h4 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-tighter flex items-center gap-2">
                        <ShieldCheck className="h-3 w-3" /> Tech Dispatch Recs
                      </h4>
                      <div className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 space-y-4">
                        {selectedSubmission.ai_analysis?.technician_notes ? (
                          <div className="space-y-3">
                            {selectedSubmission.ai_analysis.technician_notes
                              .split("\n")
                              .map((note, idx) => (
                                <div key={idx} className="flex gap-2">
                                  <div className="min-w-[4px] h-[4px] bg-cyan-500 rounded-full mt-2" />
                                  <span>{note}</span>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <p className="italic opacity-60 text-xs">
                            AI notes being finalized...
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-950 p-5 rounded-xl border border-cyan-100 dark:border-cyan-900 shadow-sm">
                      <h4 className="text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 mb-2">
                        Dispatcher Action
                      </h4>
                      <p className="text-xs text-slate-500 mb-4 font-medium italic">
                        Convert this lead to a Job to assign to a tech and
                        schedule site visit.
                      </p>
                      <Button
                        className="w-full bg-cyan-600 hover:bg-cyan-700 shadow-lg shadow-cyan-500/20 h-10 font-bold text-xs"
                        onClick={() => handleConvert(selectedSubmission)}
                        disabled={
                          converting === selectedSubmission.id ||
                          selectedSubmission.status === "converted"
                        }
                      >
                        Convert to Full Job
                      </Button>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
