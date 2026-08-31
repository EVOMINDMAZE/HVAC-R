import {
  AlertTriangle,
  Calendar,
  Map,
  MapPin,
  Route,
  Truck,
  Users,
  Wrench,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { AppPageHeader } from "@/components/app/AppPageHeader";
import { AppSectionCard } from "@/components/app/AppSectionCard";
import { AppStatCard } from "@/components/app/AppStatCard";
import { PageContainer } from "@/components/PageContainer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/lib/supabase";

interface TechLocation {
  id: string;
  name: string;
  status: "idle" | "working" | "offline";
  current_job?: string;
}

interface ActiveJob {
  id: string;
  title: string;
  client: string;
  status: string;
  tech_assigned?: string;
}

function statusTone(status: TechLocation["status"]) {
  if (status === "working") return "success" as const;
  if (status === "offline") return "danger" as const;
  return "default" as const;
}

export default function FleetDashboard() {
  const { user } = useSupabaseAuth();
  const navigate = useNavigate();
  const [techs, setTechs] = useState<TechLocation[]>([]);
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFleetData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.access_token) {
          setTechs([]);
          setJobs([]);
          return;
        }

        const response = await fetch("/api/fleet/status", {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          console.error("Failed to fetch fleet data:", response.status);
          setTechs([]);
          setJobs([]);
          return;
        }

        const result = await response.json();
        if (result?.success && result?.data) {
          setTechs(result.data.techs || []);
          setJobs(result.data.jobs || []);
        }
      } catch (e) {
        console.error("Error fetching fleet data", e);
        setTechs([]);
        setJobs([]);
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchFleetData();
  }, [user]);

  if (loading) {
    return (
      <PageContainer variant="standard" className="app-stack-24">
        <AppSectionCard className="p-8 text-sm text-muted-foreground">
          Loading fleet status...
        </AppSectionCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer variant="standard" className="app-stack-24">
      <AppPageHeader
        kicker="Work"
        title="Fleet Dashboard"
        subtitle="Track technician availability, active jobs, and dispatch load in one board."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline">
              <Calendar className="mr-2 h-4 w-4" />
              Schedule
            </Button>
            <Button onClick={() => navigate("/dashboard/dispatch")}>
              <Truck className="mr-2 h-4 w-4" />
              Open Dispatch
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <AppStatCard
          label="Active Technicians"
          value={`${techs.filter((t) => t.status !== "offline").length}/${techs.length}`}
          meta="Available right now"
          icon={<Users className="h-5 w-5" />}
        />
        <AppStatCard
          label="Open Jobs"
          value={jobs.length}
          meta="Queued and in-progress work"
          icon={<Wrench className="h-5 w-5" />}
        />
        <AppStatCard
          label="Critical Alerts"
          value={1}
          meta="Freezer temp high (sample)"
          icon={<AlertTriangle className="h-5 w-5" />}
          tone="warning"
        />
        <AppStatCard
          label="Fleet Efficiency"
          value="92%"
          meta="On-time arrival rate"
          icon={<Map className="h-5 w-5" />}
          tone="success"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-7">
        <AppSectionCard className="lg:col-span-4 app-stack-12">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Live Map</h2>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              Technician positions not broadcast
            </Badge>
          </div>

          <div className="flex h-[360px] items-center justify-center rounded-xl border border-border bg-secondary/40 p-6 text-center">
            <div className="max-w-md">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-background/80">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground">Technician positions not broadcast</p>
              <p className="mt-2 text-sm text-muted-foreground">
                ThermoNeural does not track technician GPS locations. Live positions appear here only when location tracking is enabled in a future update.
              </p>
              <p className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Route className="h-3.5 w-3.5 text-primary" />
                Technician statuses and assignments below are live from your account.
              </p>
            </div>
          </div>
        </AppSectionCard>

        <AppSectionCard className="lg:col-span-3 app-stack-12">
          <h2 className="text-lg font-semibold">Technician Status</h2>
          {techs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No technician activity available.</p>
          ) : (
            <div className="space-y-3">
              {techs.map((tech) => (
                <article key={tech.id} className="app-surface-muted p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold">{tech.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {tech.current_job || "No active assignment"}
                      </p>
                    </div>
                    <Badge variant="outline" className="capitalize" data-tone={statusTone(tech.status)}>
                      {tech.status.replace("-", " ")}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </AppSectionCard>
      </div>
    </PageContainer>
  );
}
