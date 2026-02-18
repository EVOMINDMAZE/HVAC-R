import React from "react";
import { CheckCircle2, CircleDashed, Truck, Users, Wrench } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OpsStage {
  id: string;
  label: string;
  count: number | "--";
  status: "clear" | "attention" | "neutral";
  color: "queue" | "enroute" | "onsite" | "done" | "techs";
}

export interface OpsStatusBarProps {
  stages: OpsStage[];
  techs: { total: number | "--"; active: number | "--" };
  readiness?: number;
  className?: string;
}

const STAGE_CONFIG: Record<string, { icon: LucideIcon; color: string }> = {
  queue: { icon: CircleDashed, color: "var(--stage-queue)" },
  enroute: { icon: Truck, color: "var(--stage-enroute)" },
  onsite: { icon: Wrench, color: "var(--stage-onsite)" },
  done: { icon: CheckCircle2, color: "var(--stage-done)" },
  techs: { icon: Users, color: "var(--stage-techs)" },
};

function StagePill({ stage }: { stage: OpsStage }) {
  const config = STAGE_CONFIG[stage.color] ?? STAGE_CONFIG.queue!;
  const Icon = config.icon;
  const hasData = typeof stage.count === "number" && stage.count > 0;

  return (
    <div className={cn("stage-pill", hasData && "stage-pill--active")}>
      <div className="stage-pill__icon">
        <Icon className="w-4 h-4" style={{ color: `hsl(${config.color})` }} />
      </div>
      <div className="stage-pill__content">
        <span className="stage-pill__count">{stage.count}</span>
        <span className="stage-pill__label">{stage.label}</span>
      </div>
    </div>
  );
}

export function deriveOpsStages(telemetry: any): OpsStage[] {
  const jobs = telemetry?.jobs;

  return [
    {
      id: "queue",
      label: "Queue",
      count: jobs?.pending ?? "--",
      status: jobs?.pending > 0 ? "attention" : "neutral",
      color: "queue",
    },
    {
      id: "enroute",
      label: "En Route",
      count: jobs?.enRoute ?? "--",
      status: jobs?.enRoute > 0 ? "clear" : "neutral",
      color: "enroute",
    },
    {
      id: "onsite",
      label: "On Site",
      count: jobs?.onSite ?? "--",
      status: jobs?.onSite > 0 ? "clear" : "neutral",
      color: "onsite",
    },
    {
      id: "done",
      label: "Done",
      count: jobs?.completed ?? "--",
      status: "clear",
      color: "done",
    },
  ];
}

export function OpsStatusBar({
  stages,
  techs,
  readiness = 0,
  className,
}: OpsStatusBarProps) {
  return (
    <section className={cn("ops-bar", className)} data-testid="ops-status-bar">
      <div className="ops-bar__header">
        <h2 className="ops-bar__title">Operations</h2>
        <div className="ops-bar__readiness">
          <span className="ops-bar__readiness-value">{readiness}%</span>
          <span className="ops-bar__readiness-label">ready</span>
        </div>
      </div>

      <div className="ops-bar__stages">
        {stages.map((stage, index) => (
          <React.Fragment key={stage.id}>
            <StagePill stage={stage} />
            {index < stages.length - 1 && <div className="ops-bar__connector" />}
          </React.Fragment>
        ))}

        <div className="ops-bar__divider" />

        <div className="ops-bar__techs">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="ops-bar__techs-count">
            <strong>{techs.active}</strong>/{techs.total}
          </span>
          <span className="ops-bar__techs-label">techs</span>
        </div>
      </div>
    </section>
  );
}