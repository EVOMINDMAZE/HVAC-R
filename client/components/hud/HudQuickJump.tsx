import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { withPersistedUiFlags } from "@/lib/featureFlags";
import { HudBadge } from "@/components/hud/HudBadge";

type JumpItem = {
  key: "dispatch" | "triage" | "jobs" | "clients";
  label: string;
  to: string;
};

export type HudQuickJumpCounts = Partial<
  Record<JumpItem["key"], { value: string; tone?: "default" | "success" | "warning" | "danger" | "info" }>
>;

const ITEMS: JumpItem[] = [
  { key: "dispatch", label: "Dispatch", to: "/dashboard/dispatch" },
  { key: "triage", label: "Triage", to: "/dashboard/triage" },
  { key: "jobs", label: "Jobs", to: "/dashboard/jobs" },
  { key: "clients", label: "Clients", to: "/dashboard/clients" },
];

export function HudQuickJump({
  className,
  counts,
}: {
  className?: string;
  counts?: HudQuickJumpCounts;
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const hasCounts = Boolean(counts && Object.keys(counts).length);

  return (
    <div
      className={cn("hud-quickjump", className)}
      data-testid="hud-quickjump"
      data-variant="label"
      data-has-counts={hasCounts ? "true" : "false"}
    >
      {ITEMS.map((item) => (
        (() => {
          const count = counts?.[item.key];
          const tone = count?.tone || "default";
          return (
        <button
          key={item.key}
          type="button"
          className="hud-quickjump__btn"
          aria-label={item.label}
          title={item.label}
          onClick={() =>
            navigate(withPersistedUiFlags(item.to, { search: location.search }))
          }
        >
          <span className="hud-quickjump__left">
            <HudBadge badgeKey={item.key} size={32} priority decorative />
            <span className="hud-quickjump__label">{item.label}</span>
          </span>
          {count ? (
            <span className="hud-quickjump__count" data-tone={tone} aria-hidden="true">
              {count.value}
            </span>
          ) : null}
        </button>
          );
        })()
      ))}
    </div>
  );
}
