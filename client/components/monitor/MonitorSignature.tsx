import React, { useMemo } from "react";
import {
  Activity,
  Briefcase,
  Gauge,
  HardHat,
  Layers,
  MapPin,
  Route,
  Settings,
  ShieldCheck,
  Siren,
  Sparkles,
  Truck,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MonitorPresentation, MonitorIconKey } from "@/types/monitor";
import type { FutureMonitorSkin } from "@/lib/featureFlags";
import type { HudBadgeKey } from "@/components/hud/HudBadge";
import { HudBadge } from "@/components/hud/HudBadge";

const iconMap: Record<MonitorIconKey, React.ComponentType<{ className?: string }>> = {
  activity: Activity,
  gauge: Gauge,
  route: Route,
  siren: Siren,
  briefcase: Briefcase,
  users: Users,
  truck: Truck,
  layers: Layers,
  shieldCheck: ShieldCheck,
  hardHat: HardHat,
  mapPin: MapPin,
  settings: Settings,
  sparkles: Sparkles,
};

interface MonitorSignatureProps {
  presentation?: MonitorPresentation;
  fallbackLabel: string;
  className?: string;
  compact?: boolean;
  skin?: FutureMonitorSkin;
}

function resolveSignatureBadgeKey(
  presentation: MonitorPresentation | undefined,
): HudBadgeKey | null {
  if (!presentation) return null;

  if (presentation.modeLabel === "PUBLIC") return "public";
  if (presentation.modeLabel === "TOOLS") return "tools";
  if (presentation.modeLabel === "AUTH") return "auth";

  switch (presentation.icon) {
    case "gauge":
      return "dashboard";
    case "route":
      return "dispatch";
    case "siren":
      return "triage";
    case "briefcase":
      return "jobs";
    case "users":
      return "clients";
    case "truck":
      return "fleet";
    case "layers":
      return "projects";
    case "hardHat":
      return "tech";
    case "mapPin":
      return "track";
    case "settings":
      return "settings";
    case "shieldCheck":
      // Portal is a WORK surface in this app; auth is handled above.
      return "portal";
    case "sparkles":
      return "tools";
    default:
      return null;
  }
}

export function MonitorSignature({
  presentation,
  fallbackLabel,
  className,
  compact = false,
  skin = "classic",
}: MonitorSignatureProps) {
  const Icon = useMemo(() => {
    const key = presentation?.icon || "activity";
    return iconMap[key] || Activity;
  }, [presentation?.icon]);

  const label = presentation?.signatureLabel || fallbackLabel;
  const mode = presentation?.modeLabel || "SYSTEM";
  const hudBadgeKey = skin === "hud" ? resolveSignatureBadgeKey(presentation) : null;

  return (
    <div className={cn("monitor-signature flex items-center gap-3", className)}>
      {hudBadgeKey ? (
        <HudBadge badgeKey={hudBadgeKey} size={compact ? 44 : 48} priority decorative />
      ) : (
        <div
          className={cn(
            "monitor-signature-badge flex h-11 w-11 items-center justify-center rounded-2xl border border-border/70 bg-background/70",
            compact ? "h-10 w-10" : null,
          )}
          aria-hidden
        >
          <Icon className="h-5 w-5 text-primary" />
        </div>
      )}
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-tight text-foreground",
            compact ? "text-sm" : "text-base",
          )}
        >
          {label}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="monitor-signature-mode inline-flex items-center rounded-full border border-border/70 bg-background/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            {mode}
          </span>
          {presentation?.template ? (
            <span className="monitor-signature-template inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
              {presentation.template}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
