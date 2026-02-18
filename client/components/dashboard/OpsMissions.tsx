import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, CheckCircle2, CircleDashed, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { withPersistedUiFlags } from "@/lib/featureFlags";
import { Button } from "@/components/ui/button";
import { HudBadge } from "@/components/hud/HudBadge";
import type { MonitorOpsTelemetrySnapshot } from "@/types/monitorTelemetry";
import type { MissionItem, MissionStatus } from "@/types/dashboardGamified";

function toCount(value: number | null | undefined): number | "--" {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value;
}

function toStatus(count: number | "--"): MissionStatus {
  if (count === "--") return "unknown";
  if (count === 0) return "complete";
  return "pending";
}

export function deriveOpsMissions(
  telemetry: MonitorOpsTelemetrySnapshot | null | undefined,
): MissionItem[] {
  const jobs = telemetry?.jobs || null;
  const triage = telemetry?.triage || null;

  const inflight =
    typeof jobs?.enRoute === "number" && typeof jobs?.onSite === "number"
      ? jobs.enRoute + jobs.onSite
      : null;

  const items: Array<Omit<MissionItem, "status"> & { status?: MissionStatus }> = [
    {
      id: "dispatch-queue",
      title: "Dispatch Queue",
      count: toCount(jobs?.pending),
      badgeKey: "dispatch",
      ctaTo: "/dashboard/dispatch",
    },
    {
      id: "unassigned-jobs",
      title: "Unassigned Jobs",
      count: toCount(jobs?.unassigned),
      badgeKey: "dispatch",
      ctaTo: "/dashboard/dispatch",
    },
    {
      id: "review-leads",
      title: "Review New Leads",
      count: toCount(triage?.new),
      badgeKey: "triage",
      ctaTo: "/dashboard/triage",
    },
    {
      id: "scheduled-today",
      title: "Scheduled Today",
      count: toCount(jobs?.scheduledToday),
      badgeKey: "jobs",
      ctaTo: "/dashboard/jobs",
    },
    {
      id: "inflight",
      title: "In Flight",
      count: toCount(inflight),
      badgeKey: "jobs",
      ctaTo: "/dashboard/jobs",
    },
  ];

  return items.map((item) => ({
    ...item,
    status: item.status ?? toStatus(item.count),
  }));
}

export function computeReadiness(missions: MissionItem[]) {
  const known = missions.filter((m) => m.count !== "--").length;
  const completed = missions.filter((m) => m.count === 0).length;
  const readinessPercent = known > 0 ? Math.round((completed / known) * 100) : null;
  return { known, completed, readinessPercent };
}

function statusBadge(status: MissionStatus) {
  if (status === "complete") return { label: "Clear", tone: "success" as const, Icon: CheckCircle2 };
  if (status === "pending") return { label: "Pending", tone: "warning" as const, Icon: TriangleAlert };
  return { label: "Unknown", tone: "info" as const, Icon: CircleDashed };
}

export function OpsMissions({
  telemetry,
  className,
}: {
  telemetry: MonitorOpsTelemetrySnapshot | null | undefined;
  className?: string;
}) {
  const navigate = useNavigate();
  const location = useLocation();

  const missions = useMemo(() => deriveOpsMissions(telemetry), [telemetry]);
  const readiness = useMemo(() => computeReadiness(missions), [missions]);

  const segments = 10;
  const filledSegments =
    readiness.readinessPercent == null
      ? 0
      : Math.round((readiness.readinessPercent / 100) * segments);

  return (
    <section className={cn("hud-missions", className)} data-testid="hud-missions">
      <header className="hud-missions__header">
        <div className="hud-missions__titleRow">
          <h2 className="hud-missions__title">Missions</h2>
          <span className="hud-missions__meta">
            {readiness.readinessPercent == null ? "--" : `${readiness.readinessPercent}%`} ready
          </span>
        </div>
        <div className="hud-missions__bar" aria-hidden>
          {Array.from({ length: segments }).map((_, idx) => (
            <span key={idx} className="hud-missions__seg" data-filled={idx < filledSegments ? "true" : "false"} />
          ))}
        </div>
      </header>

      <div className="hud-missions__list">
        {missions.map((mission) => {
          const badge = statusBadge(mission.status);
          return (
            <article
              key={mission.id}
              className="hud-mission"
              data-status={mission.status}
              data-tone={badge.tone}
            >
              <HudBadge badgeKey={mission.badgeKey} size={52} decorative priority tone={badge.tone} />
              <div className="hud-mission__body">
                <div className="hud-mission__top">
                  <p className="hud-mission__title">{mission.title}</p>
                  <span className="hud-mission__status" data-tone={badge.tone}>
                    <badge.Icon className="h-3.5 w-3.5" />
                    {badge.label}
                  </span>
                </div>
                <div className="hud-mission__bottom">
                  <p className="hud-mission__count">
                    {mission.count === "--" ? "--" : mission.count.toLocaleString()}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="hud-mission__cta"
                    onClick={() =>
                      navigate(withPersistedUiFlags(mission.ctaTo, { search: location.search }))
                    }
                  >
                    Open <ArrowRight className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
