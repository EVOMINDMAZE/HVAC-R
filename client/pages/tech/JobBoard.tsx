import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  MapPin,
  Calendar,
  Clock,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { PageContainer } from "@/components/PageContainer";

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
      console.error("Error fetching jobs:", err);
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
    <PageContainer variant="standard" className="pb-24">
      <div className="flex flex-col gap-1 mb-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
          <Briefcase className="h-8 w-8 text-cyan-600" />
          My Jobs
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          {format(new Date(), "EEEE, MMMM d")} • {sortedJobs.length} active
          tasks
        </p>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-cyan-600 mb-4"></div>
            <p className="text-sm font-medium">Loading your schedule...</p>
          </div>
        ) : sortedJobs.length === 0 ? (
          <div className="text-center py-20 px-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <Briefcase className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No active jobs
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 mb-6">
              You're all caught up for now.
            </p>
            <p className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 inline-block px-3 py-1 rounded-full">
              Go grab a coffee ☕
            </p>
          </div>
        ) : (
          sortedJobs.map((job) => (
            <div
              key={job.id}
              onClick={() => navigate(`/tech/jobs/${job.id}`)}
              className="group bg-white dark:bg-slate-950 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-800 hover:shadow-md hover:border-cyan-500/30 active:scale-[0.99] transition-all cursor-pointer relative overflow-hidden"
            >
              {/* Status Stripe */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 
                                ${job.status === "en_route" ? "bg-cyan-500" : ""}
                                ${job.status === "on_site" ? "bg-amber-500" : ""}
                                ${job.status === "pending" || job.status === "assigned" ? "bg-slate-300 dark:bg-slate-700" : ""}
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
                                    ${job.status === "en_route" ? "bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/50 dark:text-cyan-300" : ""}
                                    ${job.status === "on_site" ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/50 dark:text-amber-300" : ""}
                                    capitalize
                                `}
                >
                  {job.status.replace("_", " ")}
                </Badge>
                <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded-md">
                  {job.ticket_number || "No Ticket #"}
                </span>
              </div>

              <div className="pl-2">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1 leading-tight">
                  {job.client?.name || job.client_name || "Unknown Client"}
                </h3>
                {job.title && (
                  <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400 mb-3">
                    {job.title}
                  </p>
                )}

                <div className="space-y-2.5 text-sm text-slate-500 dark:text-slate-400">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                    <span className="leading-snug">
                      {job.client?.address || "No Address"}
                    </span>
                  </div>
                  {job.asset && (
                    <div className="flex items-center gap-2.5">
                      <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        {job.asset.name}{" "}
                        <span className="text-xs opacity-70">
                          ({job.asset.type})
                        </span>
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <span
                      className={`font-medium ${job.scheduled_at ? "text-slate-700 dark:text-slate-300" : "text-red-500"}`}
                    >
                      {job.scheduled_at
                        ? format(new Date(job.scheduled_at), "h:mm a")
                        : "ASAP / Unscheduled"}
                    </span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-cyan-600 dark:text-cyan-400 font-bold text-sm group-hover:translate-x-1 transition-transform origin-left">
                  <span>View Details</span>
                  <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </PageContainer>
  );
}
