import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import LiveMap, { TechIcon } from "@/components/job/LiveMap";
import { Phone, User } from "lucide-react";

export default function ClientTrackJob() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default to NYC or Users location if available
  const [position, setPosition] = useState<[number, number]>([
    40.7128, -74.006,
  ]);

  async function fetchJob() {
    const { data, error } = await supabase
      .from("jobs")
      .select(
        `
        *,
        technician:technician_id(email), 
        company:companies(name),
        job_timeline(status, created_at)
      `,
      )
      .eq("id", id)
      .order("created_at", { foreignTable: "job_timeline", ascending: false })
      .limit(1, { foreignTable: "job_timeline" })
      .single();

    if (data) {
      // Augment with effective status
      const effectiveStatus = getEffectiveStatus(data);
      updateJobState({ ...data, effectiveStatus });
    }
    setLoading(false);
  }

  function getEffectiveStatus(jobData: any) {
    if (!jobData) return "pending";
    // If job is completed in main table, it's done.
    if (jobData.status === "completed") return "completed";

    // Otherwise, look at latest timeline entry
    if (jobData.job_timeline && jobData.job_timeline.length > 0) {
      return jobData.job_timeline[0].status;
    }

    return jobData.status; // likely 'pending'
  }

  function updateJobState(data: any) {
    setJob(data);
    if (data.geo_lat && data.geo_lng) {
      setPosition([data.geo_lat, data.geo_lng]);
    }
  }

  function subscribeToJob() {
    // We subscribe to both tables to ensure we catch status changes (timeline) and loc changes (jobs)
    const channel = supabase.channel(`job-tracking-${id}`);

    channel
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "jobs",
          filter: `id=eq.${id}`,
        },
        () => fetchJob(), // Re-fetch to get everything including timeline
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "job_timeline",
          filter: `job_id=eq.${id}`,
        },
        () => fetchJob(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "job_timeline",
          filter: `job_id=eq.${id}`,
        },
        () => fetchJob(),
      )
      .subscribe();
  }

  useEffect(() => {
    let initialFetchTimer: ReturnType<typeof setTimeout> | undefined;
    if (id) {
      initialFetchTimer = setTimeout(() => {
        void fetchJob();
      }, 0);
      subscribeToJob();
    }

    // Get User's Location as fallback/start
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        (err) => console.log("User location denied/error", err),
      );
    }

    return () => {
      if (initialFetchTimer) clearTimeout(initialFetchTimer);
      supabase.removeAllChannels();
    };
  }, [id]);

  if (loading)
    return (
      <div className="app-bg p-10 text-center animate-pulse">
        Locating technician...
      </div>
    );
  if (!job) return <div className="app-bg p-10">Job not found.</div>;

  const displayStatus = job.effectiveStatus || "pending";

  return (
    <div className="app-bg flex h-screen flex-col">
      {/* Map Area */}
      <div className="flex-1 relative z-0">
        <LiveMap
          markers={[
            {
              id: job.id,
              position: position,
              icon: TechIcon,
              title: "Technician Location",
              popupContent: (
                <div>
                  <strong>Technician is here.</strong>
                  <br />
                  Status: {displayStatus.replace("_", " ")}
                </div>
              ),
            },
          ]}
          center={position}
        />

        {/* Connection Status Overlay */}
        <div className="absolute right-4 top-4 z-[1000] flex items-center gap-2 rounded-full bg-card/90 px-3 py-1 text-xs font-bold text-success shadow-md backdrop-blur">
          <span className="h-2 w-2 animate-pulse rounded-full bg-success"></span>
          LIVE
        </div>
      </div>

      {/* Bottom Sheet Info */}
      <div className="relative z-10 -mt-6 rounded-t-3xl border border-border bg-card p-6 shadow-[0_-5px_30px_rgba(0,0,0,0.1)]">
        <div className="mx-auto mb-6 h-1 w-12 rounded-full bg-border"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="mb-1 text-2xl font-bold text-foreground">
              {displayStatus === "en_route"
                ? "Technician En Route"
                : displayStatus === "on_site"
                  ? "Technician On Site"
                  : displayStatus === "completed"
                    ? "Job Completed"
                    : "Service Scheduled"}
            </h2>
            <p className="text-muted-foreground">{job.ticket_number}</p>
          </div>
          <div className="text-right">
            {/* Company Logo or Name */}
            <div className="text-sm font-bold text-primary">
              {job.company?.name || "HVAC Service"}
            </div>
          </div>
        </div>

        {/* Tech Info */}
        <div className="mb-4 flex items-center gap-4 rounded-xl bg-secondary p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-foreground">Your Technician</div>
            <div className="text-sm text-muted-foreground">HVAC Field Specialist</div>
          </div>
          <button className="rounded-full bg-success/10 p-3 text-success">
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Steps */}
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 px-2">
          <div
            className={`flex flex-col items-center gap-1 ${["assigned", "en_route", "on_site", "completed"].includes(displayStatus) ? "text-cyan-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            Confirmed
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${["en_route", "on_site", "completed"].includes(displayStatus) ? "bg-cyan-600" : ""}`}
          ></div>
          <div
            className={`flex flex-col items-center gap-1 ${["en_route", "on_site", "completed"].includes(displayStatus) ? "text-cyan-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            On the Way
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${["on_site", "completed"].includes(displayStatus) ? "bg-cyan-600" : ""}`}
          ></div>
          <div
            className={`flex flex-col items-center gap-1 ${["on_site", "completed"].includes(displayStatus) ? "text-cyan-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            Working
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${displayStatus === "completed" ? "bg-cyan-600" : ""}`}
          ></div>
          <div
            className={`flex flex-col items-center gap-1 ${displayStatus === "completed" ? "text-green-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            Done
          </div>
        </div>
      </div>
    </div>
  );
}
