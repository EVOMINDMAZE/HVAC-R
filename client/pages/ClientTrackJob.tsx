import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Phone, User } from "lucide-react";
import { supabase } from "@/lib/supabase";
import LiveMap, { TechIcon } from "@/components/job/LiveMap";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { Badge } from "@/components/ui/badge";

export default function ClientTrackJob() {
  const { id } = useParams();
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [position, setPosition] = useState<[number, number]>([40.7128, -74.006]);
  const isValidUuid = (value: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );

  async function fetchJob() {
    if (!id || !isValidUuid(id)) {
      setJob(null);
      setLoading(false);
      return;
    }

    const { data } = await supabase
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
      const effectiveStatus = getEffectiveStatus(data);
      setJob({ ...data, effectiveStatus });
      if (data.geo_lat && data.geo_lng) {
        setPosition([data.geo_lat, data.geo_lng]);
      }
    }
    setLoading(false);
  }

  function getEffectiveStatus(jobData: any) {
    if (!jobData) return "pending";
    if (jobData.status === "completed") return "completed";
    if (jobData.job_timeline && jobData.job_timeline.length > 0) {
      return jobData.job_timeline[0].status;
    }
    return jobData.status;
  }

  function subscribeToJob() {
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
        () => fetchJob(),
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

    if (id && isValidUuid(id)) {
      initialFetchTimer = setTimeout(() => {
        void fetchJob();
      }, 0);
      subscribeToJob();
    } else {
      setLoading(false);
      setJob(null);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => undefined,
      );
    }

    return () => {
      if (initialFetchTimer) clearTimeout(initialFetchTimer);
      supabase.removeAllChannels();
    };
  }, [id]);

  const displayStatus = job?.effectiveStatus || "pending";

  const statusLabel = useMemo(() => {
    if (displayStatus === "en_route") return "Technician En Route";
    if (displayStatus === "on_site") return "Technician On Site";
    if (displayStatus === "completed") return "Job Completed";
    return "Service Scheduled";
  }, [displayStatus]);

  if (loading) {
    return <div className="app-bg p-8 text-center text-muted-foreground">Locating technician...</div>;
  }

  if (!job) {
    return <div className="app-bg p-8 text-center text-muted-foreground">Job not found.</div>;
  }

  return (
    <div className="app-bg min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-6">
        <AppSectionCard padded={false} className="overflow-hidden">
          <div className="relative h-[52vh] min-h-[360px]">
            <LiveMap
              markers={[
                {
                  id: job.id,
                  position,
                  icon: TechIcon,
                  title: "Technician Location",
                  popupContent: (
                    <div>
                      <strong>Technician location</strong>
                      <br />
                      Status: {displayStatus.replace("_", " ")}
                    </div>
                  ),
                },
              ]}
              center={position}
            />
            <div className="absolute right-4 top-4 z-[1000] rounded-full bg-card/95 px-3 py-1 text-xs font-semibold text-success shadow-sm">
              LIVE
            </div>
          </div>
        </AppSectionCard>

        <AppSectionCard className="app-stack-16">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="app-stack-8">
              <h1 className="text-2xl font-semibold tracking-tight">{statusLabel}</h1>
              <p className="text-sm text-muted-foreground">{job.ticket_number || "Service Ticket"}</p>
            </div>
            <Badge variant="outline" className="capitalize">
              {displayStatus.replace("_", " ")}
            </Badge>
          </div>

          <div className="app-surface-muted flex items-center gap-4 p-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <User className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Your Technician</p>
              <p className="text-xs text-muted-foreground">HVAC Field Specialist</p>
            </div>
            <button
              type="button"
              aria-label="Call technician"
              className="rounded-full border border-border p-2 text-success"
            >
              <Phone className="h-5 w-5" />
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { key: "assigned", label: "Confirmed" },
              { key: "en_route", label: "On the Way" },
              { key: "on_site", label: "Working" },
              { key: "completed", label: "Done" },
            ].map((step, index) => {
              const activeIndex = ["assigned", "en_route", "on_site", "completed"].indexOf(
                displayStatus,
              );
              const isActive = index <= Math.max(activeIndex, 0);
              return (
                <div key={step.key} className="app-surface-muted flex items-center gap-2 p-3">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${isActive ? "bg-primary" : "bg-border"}`}
                  />
                  <span className={`text-xs font-medium ${isActive ? "text-foreground" : "text-muted-foreground"}`}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="text-xs text-muted-foreground">
            Service provider: {job.company?.name || "HVAC Service"}
          </p>
        </AppSectionCard>
      </div>
    </div>
  );
}
