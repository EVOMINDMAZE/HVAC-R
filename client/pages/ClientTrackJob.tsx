import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import LiveMap, { TechIcon } from "@/components/job/LiveMap";
import { Phone, MapPin, User, Clock } from "lucide-react";

export default function ClientTrackJob() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default to NYC or Users location if available
  const [position, setPosition] = useState<[number, number]>([
    40.7128, -74.006,
  ]);

  useEffect(() => {
    if (id) {
      fetchJob();
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
      supabase.removeAllChannels();
    };
  }, [id]);

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

  if (loading)
    return (
      <div className="p-10 text-center animate-pulse">
        Locating Technician...
      </div>
    );
  if (!job) return <div className="p-10">Job not found.</div>;

  const displayStatus = job.effectiveStatus || "pending";

  return (
    <div className="flex flex-col h-screen bg-white">
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
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-green-600 shadow-md z-[1000] flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          LIVE
        </div>
      </div>

      {/* Bottom Sheet Info */}
      <div className="bg-white rounded-t-3xl shadow-[0_-5px_30px_rgba(0,0,0,0.1)] p-6 z-10 -mt-6 relative">
        <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {displayStatus === "en_route"
                ? "Technician En Route"
                : displayStatus === "on_site"
                  ? "Technician On Site"
                  : displayStatus === "completed"
                    ? "Job Completed"
                    : "Service Scheduled"}
            </h2>
            <p className="text-gray-500">{job.ticket_number}</p>
          </div>
          <div className="text-right">
            {/* Company Logo or Name */}
            <div className="text-sm font-bold text-orange-600">
              {job.company?.name || "HVAC Service"}
            </div>
          </div>
        </div>

        {/* Tech Info */}
        <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">
            <User className="w-6 h-6" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-gray-900">Your Technician</div>
            <div className="text-sm text-gray-500">Expert HVAC Specialist</div>
          </div>
          <button className="p-3 bg-green-100 text-green-700 rounded-full">
            <Phone className="w-5 h-5" />
          </button>
        </div>

        {/* Timeline Steps */}
        <div className="flex justify-between items-center text-xs text-gray-400 mt-2 px-2">
          <div
            className={`flex flex-col items-center gap-1 ${["assigned", "en_route", "on_site", "completed"].includes(displayStatus) ? "text-orange-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            Confirmed
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${["en_route", "on_site", "completed"].includes(displayStatus) ? "bg-orange-600" : ""}`}
          ></div>
          <div
            className={`flex flex-col items-center gap-1 ${["en_route", "on_site", "completed"].includes(displayStatus) ? "text-orange-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            On the Way
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${["on_site", "completed"].includes(displayStatus) ? "bg-orange-600" : ""}`}
          ></div>
          <div
            className={`flex flex-col items-center gap-1 ${["on_site", "completed"].includes(displayStatus) ? "text-orange-600 font-bold" : ""}`}
          >
            <div className="w-2 h-2 rounded-full bg-current"></div>
            Working
          </div>
          <div
            className={`h-[1px] flex-1 bg-gray-200 mx-2 ${displayStatus === "completed" ? "bg-orange-600" : ""}`}
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
