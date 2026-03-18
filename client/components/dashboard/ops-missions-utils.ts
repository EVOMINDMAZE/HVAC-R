import type { MissionItem, MissionStatus } from "@/types/dashboardGamified";
import type { MonitorOpsTelemetrySnapshot } from "@/types/monitorTelemetry";

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