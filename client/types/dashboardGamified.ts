import type { HudBadgeKey } from "@/components/hud/HudBadge";

export type MissionStatus = "unknown" | "pending" | "complete";

export interface MissionItem {
  id: string;
  title: string;
  count: number | "--";
  status: MissionStatus;
  badgeKey: HudBadgeKey;
  ctaTo: string;
}

export interface DashboardModuleItem {
  id: string;
  title: string;
  description: string;
  badgeKey: HudBadgeKey;
  to: string;
}

