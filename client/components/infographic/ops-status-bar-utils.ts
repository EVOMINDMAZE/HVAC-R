import type { OpsStage } from "./OpsStatusBar";

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