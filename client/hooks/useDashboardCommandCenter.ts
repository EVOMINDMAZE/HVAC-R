import { useMemo } from "react";
import { deriveOpsMissions, computeReadiness } from "@/components/dashboard/OpsMissions";
import { useMonitorOpsTelemetry } from "@/hooks/useMonitorOpsTelemetry";
import { useRecentCalculations } from "@/hooks/useRecentCalculations";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import type { DashboardModuleItem, MissionItem } from "@/types/dashboardGamified";

const MODULES: DashboardModuleItem[] = [
  {
    id: "dispatch",
    title: "Dispatch Board",
    description: "Assign and route active service work.",
    badgeKey: "dispatch",
    to: "/dashboard/dispatch",
  },
  {
    id: "triage",
    title: "Triage Board",
    description: "Review incoming requests and convert to jobs.",
    badgeKey: "triage",
    to: "/dashboard/triage",
  },
  {
    id: "jobs",
    title: "Jobs",
    description: "Track work from intake to closeout.",
    badgeKey: "jobs",
    to: "/dashboard/jobs",
  },
  {
    id: "clients",
    title: "Clients",
    description: "Manage accounts, sites, and history.",
    badgeKey: "clients",
    to: "/dashboard/clients",
  },
  {
    id: "estimate",
    title: "Estimate Builder",
    description: "Build and save scoped estimates quickly.",
    badgeKey: "estimate",
    to: "/estimate-builder",
  },
  {
    id: "compliance",
    title: "Compliance Report",
    description: "Generate refrigerant and leak-rate reporting.",
    badgeKey: "compliance",
    to: "/tools/refrigerant-report",
  },
];

export function useDashboardCommandCenter() {
  const auth = useSupabaseAuth();
  const { telemetry, isLoading: telemetryLoading } = useMonitorOpsTelemetry();
  const { calculations: recentCalculations, isLoading: recentLoading } = useRecentCalculations({
    limit: 6,
    enabled: Boolean(auth.user),
  });

  const missions: MissionItem[] = useMemo(() => deriveOpsMissions(telemetry), [telemetry]);
  const readiness = useMemo(() => computeReadiness(missions), [missions]);

  return {
    auth,
    telemetry,
    telemetryLoading,
    missions,
    readiness,
    modules: MODULES,
    recentCalculations,
    recentLoading,
  };
}

