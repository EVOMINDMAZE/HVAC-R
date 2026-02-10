import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import {
  Plus,
  Search,
  Filter,
  Map,
  Calendar,
  User,
  Building2,
  MapPin,
  LayoutGrid,
} from "lucide-react";
import { format } from "date-fns";
import { CreateJobDialog } from "@/components/jobs/CreateJobDialog";
import MapView from "@/components/dashboard/MapView";
import { PageContainer } from "@/components/PageContainer";

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

export default function Dispatch() {
  console.log("[Dispatch] Component mounted");
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showMapView, setShowMapView] = useState(false);
  const [technicians, setTechnicians] = useState<any[]>([]); // For reassignment dropdown

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
        .order("scheduled_at", { ascending: true }); // Show upcoming first

      if (error) throw error;
      if (data) {
        setJobs(data);
      }
    } catch (err) {
      console.error("[Dispatch] Error fetching jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
    fetchTechnicians();

    // Subscribe to realtime updates
    const channel = supabase
      .channel("dispatch-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        () => {
          fetchJobs();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function fetchTechnicians() {
    console.log("[Dispatch] fetchTechnicians() called");
    try {
      console.log("[Dispatch] Fetching from user_roles...");
      // profiles table doesn't exist, use user_roles directly
      const { data, error } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("role", ["technician", "tech"]);

      console.log("[Dispatch] Raw query result:", { data, error });

      if (error) {
        console.error("[Dispatch] Error fetching technicians:", error.message);
        return;
      }

      if (data && data.length > 0) {
        console.log("[Dispatch] Found", data.length, "technicians");
        const techs = data.map((t: any) => ({
          id: t.user_id,
          full_name: `${t.role === "technician" ? "Technician" : "Tech"} (${t.user_id.slice(0, 8)})`,
          email: "technician@example.com",
          role: t.role,
        }));
        setTechnicians(techs);
        console.log(`[Dispatch] Loaded ${techs.length} technicians`, techs);
      } else {
        console.log("[Dispatch] No technicians found in database!");
      }
    } catch (err) {
      console.error("[Dispatch] Failed to fetch technicians:", err);
    }
  }

  // Debug: log technicians state changes
  useEffect(() => {
    console.log(
      "[Dispatch] technicians state updated:",
      technicians.length,
      technicians,
    );
  }, [technicians]);

  // Helper to get technician name from technicians list
  function getTechnicianInfo(techId: string | null) {
    if (!techId) return null;
    return technicians.find((t) => t.id === techId) || null;
  }

  async function handleAssignTechnician(jobId: string, techId: string) {
    console.log("[Dispatch] handleAssignTechnician:", { jobId, techId });
    try {
      // Only update technician_id, don't change status
      // The 'jobs_status_check' constraint prevents 'assigned' status
      // Existing data shows jobs with technicians have 'pending' status
      const updatePayload = {
        technician_id: techId === "unassigned" ? null : techId,
      };
      console.log("[Dispatch] Update payload:", updatePayload);

      const { error } = await supabase
        .from("jobs")
        .update(updatePayload)
        .eq("id", jobId);

      if (error) {
        console.error("[Dispatch] Supabase error details:", {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        });
        throw error;
      }
      console.log("[Dispatch] Technician assignment successful");
      fetchJobs();
    } catch (error: any) {
      console.error("[Dispatch] Error assigning technician:", error);
      alert(
        `Assignment failed: ${error?.details || error?.message || "Check constraint violation"}`,
      );
    }
  }

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch =
      job.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.status?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.ticket_number?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <PageContainer variant="standard" className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-600 to-slate-500 bg-clip-text text-transparent">
            Dispatch Center 🚁
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Manage active service calls and technician assignments.
          </p>
        </div>
        <button
          onClick={() => setShowCreateDialog(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-lg shadow-cyan-200 transition-all hover:scale-105 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          New Job
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets, clients, or status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all text-slate-900 dark:text-white"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={`flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border rounded-xl shadow-sm font-medium transition-colors ${statusFilter !== "all" ? "border-cyan-200 text-cyan-700 bg-cyan-50" : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
            >
              <Filter className="w-5 h-5" />
              Filter
              {statusFilter !== "all" && (
                <span className="ml-1 text-xs bg-cyan-200 text-cyan-800 px-1.5 py-0.5 rounded-full capitalize">
                  {statusFilter.replace("_", " ")}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Filter by Status</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <DropdownMenuRadioItem value="all">
                All Jobs
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="pending">
                Pending
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="en_route">
                En Route
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="on_site">
                On Site
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="completed">
                Completed
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <button
          onClick={() => setShowMapView(!showMapView)}
          className={`flex items-center gap-2 px-4 py-3 border rounded-xl shadow-sm font-medium transition-colors ${showMapView ? "bg-cyan-50 border-cyan-200 text-cyan-700" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"}`}
        >
          {showMapView ? (
            <>
              <LayoutGrid className="w-5 h-5" />
              List View
            </>
          ) : (
            <>
              <Map className="w-5 h-5" />
              Map View
            </>
          )}
        </button>
      </div>

      {/* Jobs Table / Map View Switch */}
      {showMapView ? (
        <MapView jobs={filteredJobs} />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 bg-slate-50/50 dark:bg-slate-800/50 p-4 font-semibold text-slate-500 dark:text-slate-400 text-sm border-b border-slate-200 dark:border-slate-800">
            <div className="col-span-3">Client / Asset</div>
            <div className="col-span-2">Scheduled</div>
            <div className="col-span-3">Technician</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-400">
              Loading Dispatch Board...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-cyan-50 rounded-full flex items-center justify-center mx-auto text-cyan-500 mb-4">
                <Calendar className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                No active jobs
              </h3>
              <p className="text-slate-500">Create a new job to get started.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredJobs.map((job) => (
                <div key={job.id}>
                  {/* Desktop View */}
                  <div className="hidden md:grid grid-cols-12 p-4 items-center hover:bg-gray-50/50 dark:hover:bg-slate-800/50 transition-colors group">
                    <div className="col-span-3 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                            {job.client?.name}
                          </div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">
                            {job.title}
                          </div>
                          <div className="text-xs text-slate-500 line-clamp-1">
                            {job.asset?.name || "General Service"}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2 text-slate-600 dark:text-slate-400 font-medium text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      {job.scheduled_at
                        ? format(new Date(job.scheduled_at), "MMM d, h:mm a")
                        : "Unscheduled"}
                    </div>

                    <div className="col-span-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-700/50 p-1 rounded-lg transition-colors text-left group/tech">
                            {(() => {
                              const tech = getTechnicianInfo(job.technician_id);
                              return tech ? (
                                <>
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900/30 text-slate-600 dark:text-slate-400 flex items-center justify-center text-xs font-bold">
                                    {(
                                      tech.full_name?.[0] || tech.email[0]
                                    )?.toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                    {tech.full_name || tech.email.split("@")[0]}
                                  </span>
                                </>
                              ) : (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300 group-hover/tech:bg-gray-200">
                                  Unassigned
                                </span>
                              );
                            })()}
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>
                            Assign Technician
                          </DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() =>
                              handleAssignTechnician(job.id, "unassigned")
                            }
                          >
                            Unassigned
                          </DropdownMenuItem>
                          {technicians.map((tech) => (
                            <DropdownMenuItem
                              key={tech.id}
                              onClick={() =>
                                handleAssignTechnician(job.id, tech.id)
                              }
                            >
                              {tech.full_name || tech.email}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>

                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                          job.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : job.status === "en_route"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : job.status === "on_site"
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : job.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            job.status === "pending"
                              ? "bg-yellow-500"
                              : job.status === "en_route"
                                ? "bg-cyan-500"
                                : job.status === "on_site"
                                  ? "bg-slate-500"
                                  : job.status === "completed"
                                    ? "bg-green-500"
                                    : "bg-gray-500"
                          }`}
                        ></span>
                        {job.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <Link
                        to={`/dashboard/jobs/${job.id}`}
                        className="text-cyan-500 hover:text-cyan-700 font-medium text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Mobile View (Card) */}
                  <div className="md:hidden p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {job.client?.name}
                          </div>
                          <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {job.title}
                          </div>
                          <div className="text-xs text-slate-500">
                            {job.asset?.name || "General Service"}
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                          job.status === "pending"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                            : job.status === "en_route"
                              ? "bg-cyan-50 text-cyan-700 border-cyan-200"
                              : job.status === "on_site"
                                ? "bg-slate-50 text-slate-700 border-slate-200"
                                : job.status === "completed"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {job.status.replace("_", " ").toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span className="truncate">
                          {job.scheduled_at
                            ? format(
                                new Date(job.scheduled_at),
                                "MMM d, h:mm a",
                              )
                            : "Unscheduled"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 justify-end">
                        <User className="w-4 h-4 text-slate-400" />
                        {job.technician ? (
                          <span className="truncate">
                            {job.technician.email.split("@")[0]}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>

                    <Link
                      to={`/dashboard/jobs/${job.id}`}
                      className="flex items-center justify-center w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      View Job Details
                    </Link>
                  </div>
                </div>
              ))}
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
