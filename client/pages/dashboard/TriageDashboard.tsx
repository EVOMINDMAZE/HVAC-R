import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Zap,
  Phone,
  Clock,
  UserPlus,
  Archive,
  FileText,
  AlertTriangle,
  CheckCircle,
  Filter,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface AIAnalysis {
  equipment_details?: string;
  suspected_issue?: string;
  severity?: "low" | "medium" | "high";
  technician_notes?: string;
  summary?: string;
  urgency?: string;
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
  const [selectedSubmission, setSelectedSubmission] = useState<TriageSubmission | null>(null);
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
    const timeoutId = setTimeout(() => {
      if (loading) setLoading(false);
    }, 5000);

    if (user) {
      fetchSubmissions();
      fetchCompanyId();

      const channel = supabase
        .channel("triage_changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "triage_submissions" },
          (payload) => {
            fetchSubmissions();
            if (payload.eventType === "INSERT") {
              toast({
                title: "New Triage Lead!",
                description: `New request from ${payload.new.homeowner_name}`,
              });
            }
          }
        )
        .subscribe();

      return () => {
        clearTimeout(timeoutId);
        supabase.removeChannel(channel);
      };
    } else {
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
      toast({ title: "Configuration Error", description: "No Company ID found.", variant: "destructive" });
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
        title: "Triage: " + submission.problem_description.substring(0, 40) + "...",
        description: `Problem: ${submission.problem_description}\n\nAI Diagnostic: ${submission.ai_analysis?.suspected_issue || "No analysis"}\n\nTech Notes: ${submission.ai_analysis?.technician_notes || ""}`,
        status: "pending",
      });

      if (jobError) throw jobError;

      await supabase
        .from("triage_submissions")
        .update({ status: "converted" })
        .eq("id", submission.id);

      toast({ title: "Lead Converted!", description: "A new client and job have been created." });
      setSelectedSubmission(null);
    } catch (err: any) {
      toast({ title: "Conversion Failed", description: err.message, variant: "destructive" });
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
      toast({ title: "Lead Archived", description: "Submission moved to archives." });
      setSelectedSubmission(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (filter === "active") return s.status !== "archived" && s.status !== "converted";
      if (filter === "converted") return s.status === "converted";
      if (filter === "archived") return s.status === "archived";
      return true;
    });
  }, [submissions, filter]);

  const stats: StatItem[] = useMemo(() => {
    const active = submissions.filter((s) => s.status !== "archived" && s.status !== "converted").length;
    const converted = submissions.filter((s) => s.status === "converted").length;
    const highPriority = submissions.filter((s) => s.ai_analysis?.severity === "high").length;

    return [
      {
        id: "active",
        label: "Active Leads",
        value: active,
        status: active > 0 ? "warning" : "success",
        icon: <Zap className="w-4 h-4" />,
      },
      {
        id: "converted",
        label: "Converted",
        value: converted,
        status: "success",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      {
        id: "urgent",
        label: "High Priority",
        value: highPriority,
        status: highPriority > 0 ? "danger" : "neutral",
        icon: <AlertTriangle className="w-4 h-4" />,
      },
    ];
  }, [submissions]);

  const getSeverityConfig = (severity?: string) => {
    switch (severity) {
      case "high":
        return { label: "Emergency", color: "bg-red-100 text-red-700 border-red-200" };
      case "medium":
        return { label: "Urgent", color: "bg-amber-100 text-amber-700 border-amber-200" };
      default:
        return { label: "Routine", color: "bg-slate-100 text-slate-700 border-slate-200" };
    }
  };

  return (
    <PageContainer variant="standard" className="triage-page">
      <PageHero
        title="Triage Leads"
        subtitle="Review incoming homeowner requests, validate AI diagnosis, and convert qualified leads to jobs"
        icon={<Zap className="w-5 h-5" />}
      />

      <StatsRow stats={stats} columns={3} />

      <div className="triage-page__toolbar">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="triage-page__filter w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filter" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active ({submissions.filter((s) => s.status !== "archived" && s.status !== "converted").length})</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="triage-page__content">
        {loading ? (
          <div className="triage-page__loading">
            <div className="triage-page__loading-spinner" />
            <span>Loading triage leads...</span>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-12 h-12" />}
            title={`No ${filter} leads`}
            description="When new triage requests arrive, they'll appear here instantly."
          />
        ) : (
          <div className="triage-page__grid">
            {filteredSubmissions.map((sub) => {
              const severity = getSeverityConfig(sub.ai_analysis?.severity);
              return (
                <div
                  key={sub.id}
                  className={cn("triage-card", sub.status === "converted" && "triage-card--converted")}
                  onClick={() => setSelectedSubmission(sub)}
                >
                  <div className="triage-card__header">
                    <span className={cn("triage-card__severity", severity.color)}>
                      {severity.label}
                    </span>
                    <span className="triage-card__time">
                      {new Date(sub.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>

                  <div className="triage-card__body">
                    <h3 className="triage-card__name">{sub.homeowner_name}</h3>
                    <p className="triage-card__phone">
                      <Phone className="w-3 h-3" />
                      {sub.homeowner_phone}
                    </p>
                  </div>

                  <p className="triage-card__description">{sub.problem_description}</p>

                  {sub.ai_analysis?.suspected_issue && (
                    <div className="triage-card__diagnosis">
                      <div className="triage-card__diagnosis-header">
                        <Zap className="w-3 h-3" />
                        <span>AI Diagnosis</span>
                      </div>
                      <p className="triage-card__diagnosis-text">{sub.ai_analysis.suspected_issue}</p>
                    </div>
                  )}

                  <div className="triage-card__footer">
                    <div className="triage-card__media">
                      {sub.media_urls?.slice(0, 3).map((url, i) => (
                        <img key={i} src={url} alt="" className="triage-card__media-item" />
                      ))}
                      {(sub.media_urls?.length || 0) > 3 && (
                        <div className="triage-card__media-more">
                          +{(sub.media_urls?.length || 0) - 3}
                        </div>
                      )}
                    </div>
                    <span className="triage-card__view">Review →</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!selectedSubmission} onOpenChange={(open) => !open && setSelectedSubmission(null)}>
        {selectedSubmission && (
          <DialogContent className="triage-modal">
            <DialogHeader>
              <div className="triage-modal__header">
                <div className="triage-modal__title-row">
                  <div>
                    <DialogTitle className="triage-modal__title">
                      {selectedSubmission.homeowner_name}
                    </DialogTitle>
                    <div className="triage-modal__meta">
                      <span><Phone className="w-3.5 h-3.5" /> {selectedSubmission.homeowner_phone}</span>
                      <span><Clock className="w-3.5 h-3.5" /> {new Date(selectedSubmission.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <Badge>{selectedSubmission.status.toUpperCase()}</Badge>
                </div>
              </div>
            </DialogHeader>

            <div className="triage-modal__content">
              <div className="triage-modal__section">
                <h4 className="triage-modal__section-title">Problem Description</h4>
                <p className="triage-modal__section-text">{selectedSubmission.problem_description}</p>
              </div>

              {selectedSubmission.ai_analysis?.suspected_issue && (
                <div className="triage-modal__section triage-modal__section--highlight">
                  <h4 className="triage-modal__section-title">
                    <Zap className="w-4 h-4" /> AI Diagnosis
                  </h4>
                  <p className="triage-modal__section-text">{selectedSubmission.ai_analysis.suspected_issue}</p>
                </div>
              )}

              {selectedSubmission.ai_analysis?.technician_notes && (
                <div className="triage-modal__section">
                  <h4 className="triage-modal__section-title">Technician Notes</h4>
                  <p className="triage-modal__section-text">{selectedSubmission.ai_analysis.technician_notes}</p>
                </div>
              )}
            </div>

            {selectedSubmission.status !== "converted" && selectedSubmission.status !== "archived" && (
              <div className="triage-modal__actions">
                <Button variant="outline" onClick={() => handleArchive(selectedSubmission.id)}>
                  <Archive className="w-4 h-4 mr-2" /> Archive
                </Button>
                <Button onClick={() => handleConvert(selectedSubmission)} disabled={converting === selectedSubmission.id}>
                  <UserPlus className="w-4 h-4 mr-2" />
                  {converting === selectedSubmission.id ? "Converting..." : "Convert to Job"}
                </Button>
              </div>
            )}
          </DialogContent>
        )}
      </Dialog>
    </PageContainer>
  );
}