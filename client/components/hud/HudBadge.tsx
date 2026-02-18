import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Briefcase,
  Calculator,
  Gauge,
  HardHat,
  Layers,
  MapPin,
  Route,
  Settings,
  ShieldCheck,
  Siren,
  Activity,
  Users,
  Truck,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type HudBadgeKey =
  | "dashboard"
  | "dispatch"
  | "triage"
  | "jobs"
  | "clients"
  | "estimate"
  | "compliance"
  | "fleet"
  | "projects"
  | "portal"
  | "tech"
  | "track"
  | "settings"
  | "tools"
  | "public"
  | "auth";

const FALLBACK_ICONS: Record<HudBadgeKey, LucideIcon> = {
  dashboard: Gauge,
  dispatch: Route,
  triage: Siren,
  jobs: Briefcase,
  clients: Users,
  estimate: Calculator,
  compliance: ShieldCheck,
  fleet: Truck,
  projects: Layers,
  portal: ShieldCheck,
  tech: HardHat,
  track: MapPin,
  settings: Settings,
  tools: Sparkles,
  public: Sparkles,
  auth: ShieldCheck,
};

let badgeImagesAvailable: boolean | null = null;
let badgeImagesProbe: Promise<boolean> | null = null;

async function probeBadgeImages(): Promise<boolean> {
  if (badgeImagesAvailable != null) return badgeImagesAvailable;
  if (badgeImagesProbe) return badgeImagesProbe;

  badgeImagesProbe = (async () => {
    try {
      const res = await fetch("/hud/badges/badge-dashboard.webp", {
        method: "HEAD",
        cache: "no-cache",
      });

      if (res.ok) {
        badgeImagesAvailable = true;
        return true;
      }

      // Some servers may not support HEAD for static assets, so fall back to GET.
      if (res.status === 405) {
        const getRes = await fetch("/hud/badges/badge-dashboard.webp", {
          cache: "no-cache",
        });
        badgeImagesAvailable = getRes.ok;
        return badgeImagesAvailable;
      }

      badgeImagesAvailable = false;
      return false;
    } catch {
      badgeImagesAvailable = false;
      return false;
    } finally {
      badgeImagesProbe = null;
    }
  })();

  return badgeImagesProbe;
}

export interface HudBadgeProps {
  badgeKey: HudBadgeKey;
  size?: number;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
  alt?: string;
  tone?: "default" | "success" | "warning" | "danger" | "info";
}

export function HudBadge({
  badgeKey,
  size = 44,
  className,
  priority = false,
  decorative = true,
  alt,
  tone = "default",
}: HudBadgeProps) {
  const [failed, setFailed] = useState(false);
  const [useImages, setUseImages] = useState(() => badgeImagesAvailable === true);

  const src = useMemo(() => `/hud/badges/badge-${badgeKey}.webp`, [badgeKey]);
  const Icon = FALLBACK_ICONS[badgeKey] ?? Activity;
  const resolvedAlt = decorative ? "" : alt ?? `${badgeKey} badge`;

  useEffect(() => {
    let cancelled = false;

    if (badgeImagesAvailable == null) {
      probeBadgeImages().then((available) => {
        if (!cancelled) setUseImages(available);
      });
    }

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <span
      className={cn("hud-badge", className)}
      style={{ width: size, height: size }}
      data-badge-key={badgeKey}
      data-tone={tone}
      aria-hidden={decorative ? "true" : "false"}
    >
      {useImages && !failed ? (
        <img
          src={src}
          width={size}
          height={size}
          className="hud-badge__img"
          alt={resolvedAlt}
          loading={priority ? "eager" : "lazy"}
          decoding={priority ? "sync" : "async"}
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="hud-badge__fallback" aria-hidden="true">
          <Icon className="hud-badge__fallbackIcon" />
        </span>
      )}
    </span>
  );
}
