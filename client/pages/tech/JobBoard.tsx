import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import {
  MapPin,
  Clock,
  ArrowRight,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { PageContainer } from "@/components/PageContainer";
import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";

export default function JobBoard() {
  const { user, session } = useAuth();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchJobs();
    }

    // Safety Timeout
    const timer = setTimeout(() => {
      if (loading) {
        console.warn("[JobBoard] Safety timeout reached.");
        setLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [user, session]);

  async function fetchJobs() {
    if (!user) return;

    try {
      // RLS filters this automatically to assigned jobs
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("technician_id", user.id)
        .neq("status", "completed")
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      setJobs(data || []);
    } catch (err: any) {
      if (!String(err?.message || "").toLowerCase().includes("failed to fetch")) {
        console.warn("JobBoard: jobs unavailable:", err?.message || err);
      }
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  // Sort jobs: En Route -> On Site -> Assigned -> Pending
  const sortJobs = (jobs: any[]) => {
    const priority = { en_route: 0, on_site: 1, assigned: 2, pending: 3 };
    return [...jobs].sort((a, b) => {
      const pA = priority[a.status as keyof typeof priority] ?? 99;
      const pB = priority[b.status as keyof typeof priority] ?? 99;
      return pA - pB;
    });
  };

  const sortedJobs = sortJobs(jobs);

  return (
    <PageContainer variant="standard" className="app-stack-24 pb-24">
      <AppPageHeader
        kicker="Field"
        title="Field Jobs"
        subtitle={`${format(new Date(), "EEEE, MMMM d")} • ${sortedJobs.length} active task${sortedJobs.length === 1 ? "" : "s"}`}
      />

      <AppSectionCard className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
            <p className="text-sm font-medium">Loading your schedule...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-secondary/40 rounded-3xl border-2 border-dashed border-border">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold">
              No active jobs
            </h3>
            <p className="text-muted-foreground text-sm mt-1 mb-6">
              You're all caught up for now.
            </p>
            <p className="inline-block rounded-full bg-secondary px-3 py-1 text-xs text-muted-foreground">
              New assignments will appear automatically
            </p>
          </div>
        ) : (
          sortedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/tech/jobs/${job.id}`)}
              className="group app-surface app-elev-1 rounded-2xl p-5 hover:border-primary/40 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Status Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 
                                ${job.status === "en_route" ? "bg-primary" : ""}
                                ${job.status === "on_site" ? "bg-amber-500" : ""}
                                ${job.status === "pending" || job.status === "assigned" ? "bg-border" : ""}
                            `}
              />

              <div className="flex justify-between items-start mb-3 pl-2">
                <Badge
                  variant={
                    job.status === "en_route" || job.status === "on_site"
                      ? "default"
                      : "secondary"
                  }
                  className={`
                                    ${job.status === "en_route" ? "bg-primary/10 text-primary hover:bg-primary/20" : ""}
                                    ${job.status === "on_site" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300" : ""}
                                    capitalize
                                `}
                >
                  {job.status.replace("_", " ")}
                </Badge>
                <span className="text-[10px] font-medium text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                  {job.ticket_number || "No Ticket #"}
                </span>
              </div>

              <div className="pl-2">
                <h3 className="font-bold text-lg mb-1 leading-tight">
                  {job.client?.name || job.client_name || "Unknown Client"}
                </h3>
                {job.title && (
                  <p className="text-sm font-medium text-primary mb-3">
                    {job.title}
                  </p>
                )}

                <div className="space-y-2.5 text-sm text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <span className="leading-snug">
                      {job.client?.address || "No Address"}
                    </span>
                  </div>
                  {job.asset && (
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-primary shrink-0" />
                      <span>
                        {job.asset.name}{" "}
                        <span className="text-xs opacity-70">
                          ({job.asset.type})
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                    <span
                      className={`font-medium ${job.scheduled_at ? "text-foreground" : "text-destructive"}`}
                    >
                      {job.scheduled_at
                        ? format(new Date(job.scheduled_at), "h:mm a")
                        : "ASAP / Unscheduled"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-border flex justify-between items-center text-primary font-bold text-sm group-hover:translate-x-1 transition-transform origin-left">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))
        )}
      </AppSectionCard>
    </PageContainer>
  );
}
