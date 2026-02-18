import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import {
  Plus,
  Map,
  LayoutGrid,
  Truck,
  Clock,
  Users,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Building2,
  MoreHorizontal,
  Eye,
  Edit,
} from "lucide-react";
import { format } from "date-fns";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import MapView from "@/components/dashboard/MapView";
import { PageContainer } from "@/components/PageContainer";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { PageHero } from "@/components/shared/PageHero";
import { StatsRow, type StatItem } from "@/components/shared/StatsRow";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  technician_id: string | null;
  client?: { name: string; contact_phone: string };
  asset?: { name: string };
  ticket_number?: string;
}

interface Technician {
  id: string;
  full_name: string;
  email: string;
  role: string;
}

export default function Dispatch() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [technicians, setTechnicians] = useState<Technician[]>([]);

  async function fetchJobs() {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select(
          `
          *,
          client:clients(name, contact_phone),
          asset:assets(name)
        `,
        )
        .order("scheduled_at", { ascending: true });

      if (error) throw error;
      if (data) setJobs(data);
    } catch (err) {
      console.error("[Dispatch] Error fetching jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchTechnicians() {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["technician", "tech"]);

      if (error) throw error;
      if (data && data.length > 0) {
        const techs = data.map((t) => ({
          id: t.user_id,
          full_name: `${t.role === "technician" ? "Technician" : "Tech"} (${t.user_id.slice(0, 8)})`,
          email: "technician@example.com",
          role: t.role,
        }));
        setTechnicians(techs);
      }
    } catch (err) {
      console.error("[Dispatch] Failed to fetch technicians:", err);
    }
  }

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();

    const channel = supabase
      .channel("dispatch-jobs")
      .on("postgres_changes", { event: "*", schema: "public", table: "jobs" }, () => {
        fetchJobs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  function getTechnicianInfo(techId: string | null) {
    if (!techId) return null;
    return technicians.find((t) => t.id === techId) || null;
  }

  async function handleAssignTechnician(jobId: string, techId: string) {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ technician_id: techId === "unassigned" ? null : techId })
        .eq("id", jobId);

      if (error) throw error;
      fetchJobs();
    } catch (error: any) {
      alert(`Assignment failed: ${error?.message || "Unknown error"}`);
    }
  }

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        job.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        job.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || job.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [jobs, searchTerm, statusFilter]);

  const stats: StatItem[] = useMemo(() => {
    const pending = jobs.filter((j) => j.status === "pending").length;
    const enRoute = jobs.filter((j) => j.status === "en_route").length;
    const onSite = jobs.filter((j) => j.status === "on_site").length;
    const unassigned = jobs.filter((j) => !j.technician_id).length;

    return [
      {
        id: "active",
        label: "Active Jobs",
        value: pending + enRoute + onSite,
        status: pending + enRoute + onSite > 0 ? "warning" : "success",
        trend: "up",
        trendValue: "Today",
        icon: <Truck className="w-4 h-4" />,
      },
      {
        id: "unassigned",
        label: "Unassigned",
        value: unassigned,
        status: unassigned > 0 ? "danger" : "success",
        icon: <AlertCircle className="w-4 h-4" />,
      },
      {
        id: "technicians",
        label: "Technicians",
        value: technicians.length,
        status: "neutral",
        icon: <Users className="w-4 h-4" />,
      },
      {
        id: "completed",
        label: "Completed Today",
        value: jobs.filter((j) => j.status === "completed").length,
        status: "success",
        icon: <CheckCircle2 className="w-4 h-4" />,
      },
    ];
  }, [jobs, technicians]);

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: "Pending", color: "bg-amber-100 text-amber-700 border-amber-200" },
    en_route: { label: "En Route", color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
    on_site: { label: "On Site", color: "bg-slate-100 text-slate-700 border-slate-200" },
    completed: { label: "Completed", color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  };

  return (
    <PageContainer variant="standard" className="dispatch-page">
      <PageHero
        title="Dispatch Board"
        subtitle="Schedule jobs, assign technicians, and monitor field status"
        icon={<Truck className="w-5 h-5" />}
        actions={
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Job
          </Button>
        }
      />

      <StatsRow stats={stats} columns={4} />

      <div className="dispatch-page__toolbar">
        <div className="dispatch-page__search">
          <input
            type="text"
            placeholder="Search tickets, clients, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="dispatch-page__search-input"
          />
        </div>

        <div className="dispatch-page__actions">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "dispatch-page__filter-btn",
                  statusFilter !== "all" && "dispatch-page__filter-btn--active"
                )}
              >
                <Clock className="w-4 h-4" />
                Filter
                {statusFilter !== "all" && (
                  <span className="dispatch-page__filter-badge">
                    {statusConfig[statusFilter]?.label || statusFilter}
                  </span>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuRadioGroup value={statusFilter} onValueChange={setStatusFilter}>
                <DropdownMenuRadioItem value="all">All Jobs</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="pending">Pending</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="en_route">En Route</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="on_site">On Site</DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="completed">Completed</DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            onClick={() => setShowMapView(!showMapView)}
            className={cn(
              "dispatch-page__view-btn",
              showMapView && "dispatch-page__view-btn--active"
            )}
          >
            {showMapView ? <LayoutGrid className="w-4 h-4" /> : <Map className="w-4 h-4" />}
            {showMapView ? "List" : "Map"}
          </button>
        </div>
      </div>

      {showMapView ? (
        <MapView jobs={filteredJobs} />
      ) : (
        <div className="dispatch-page__content">
          {loading ? (
            <div className="dispatch-page__loading">
              <div className="dispatch-page__loading-spinner" />
              <span>Loading dispatch board...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12" />}
              title="No active jobs"
              description="Create a new job to start dispatching technicians."
              action={{
                label: "Create Job",
                onClick: () => setShowCreateDialog(true),
              }}
            />
          ) : (
            <div className="dispatch-page__list">
              {filteredJobs.map((job) => {
                const tech = getTechnicianInfo(job.technician_id);
                const status = statusConfig[job.status] ?? statusConfig.pending!;

                return (
                  <div key={job.id} className="dispatch-card">
                    <div className="dispatch-card__main">
                      <div className="dispatch-card__icon">
                        <Building2 className="w-5 h-5" />
                      </div>

                      <div className="dispatch-card__info">
                        <div className="dispatch-card__client">{job.client?.name || "Unknown Client"}</div>
                        <div className="dispatch-card__title">{job.title || "Service Call"}</div>
                        <div className="dispatch-card__meta">
                          <span>{job.asset?.name || "General Service"}</span>
                          {job.scheduled_at && (
                            <>
                              <span className="dispatch-card__meta-sep">•</span>
                              <span>{format(new Date(job.scheduled_at), "MMM d, h:mm a")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="dispatch-card__aside">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="dispatch-card__tech">
                            {tech ? (
                              <>
                                <div className="dispatch-card__tech-avatar">
                                  {tech.full_name?.[0]?.toUpperCase() || "T"}
                                </div>
                                <span className="dispatch-card__tech-name">
                                  {tech.full_name}
                                </span>
                              </>
                            ) : (
                              <span className="dispatch-card__tech-unassigned">Unassigned</span>
                            )}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Assign Technician</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleAssignTechnician(job.id, "unassigned")}>
                            Unassigned
                          </DropdownMenuItem>
                          {technicians.map((t) => (
                            <DropdownMenuItem key={t.id} onClick={() => handleAssignTechnician(job.id, t.id)}>
                              {t.full_name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <span className={cn("dispatch-card__status", status.color)}>
                        <span className={cn(
                          "dispatch-card__status-dot",
                          job.status === "pending" && "bg-amber-500",
                          job.status === "en_route" && "bg-cyan-500",
                          job.status === "on_site" && "bg-slate-500",
                          job.status === "completed" && "bg-emerald-500"
                        )} />
                        {status.label}
                      </span>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="dispatch-card__menu">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}`)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => navigate(`/dashboard/jobs/${job.id}?edit=true`)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Job
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <CreateJobDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchJobs}
      />
    </PageContainer>
  );
}