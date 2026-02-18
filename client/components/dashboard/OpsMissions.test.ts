import { describe, expect, it } from "vitest";
import { computeReadiness, deriveOpsMissions } from "@/components/dashboard/OpsMissions";
import type { MonitorOpsTelemetrySnapshot } from "@/types/monitorTelemetry";

function baseTelemetry(overrides: Partial<MonitorOpsTelemetrySnapshot> = {}): MonitorOpsTelemetrySnapshot {
  return {
    updatedAt: "2026-02-13T10:00:00.000Z",
    scope: { pathname: "/dashboard", companyId: "c1", userId: "u1" },
    jobs: {
      total: 10,
      pending: 0,
      enRoute: 0,
      onSite: 0,
      completed: 10,
      cancelled: 0,
      assigned: 10,
      unassigned: 0,
      scheduledToday: 0,
      assignedToMeOpen: 0,
      createdAtLast7d: [],
    },
    clients: { total: 4, createdAtLast7d: [] },
    triage: { total: 3, new: 0, analyzed: 0, converted: 0, archived: 0, createdAtLast7d: [] },
    team: { members: 4, technicians: 2 },
    errors: [],
    ...overrides,
  };
}

describe("deriveOpsMissions", () => {
  it("marks missions as unknown when telemetry is missing", () => {
    const missions = deriveOpsMissions(null);
    expect(missions.length).toBeGreaterThan(0);
    expect(missions.every((m) => m.status === "unknown")).toBe(true);

    const readiness = computeReadiness(missions);
    expect(readiness.known).toBe(0);
    expect(readiness.readinessPercent).toBeNull();
  });

  it("marks zero counts complete and positive counts pending", () => {
    const telemetry = baseTelemetry({
      jobs: {
        ...baseTelemetry().jobs!,
        pending: 2,
        scheduledToday: 0,
        unassigned: 1,
        enRoute: 1,
        onSite: 0,
      },
      triage: {
        ...baseTelemetry().triage!,
        new: 3,
      },
    });

    const missions = deriveOpsMissions(telemetry);
    const map = new Map(missions.map((m) => [m.id, m]));

    expect(map.get("dispatch-queue")?.status).toBe("pending");
    expect(map.get("scheduled-today")?.status).toBe("complete");
    expect(map.get("review-leads")?.status).toBe("pending");
    expect(map.get("inflight")?.status).toBe("pending");
  });

  it("readiness percent excludes unknown missions", () => {
    const telemetry = baseTelemetry({
      jobs: {
        ...baseTelemetry().jobs!,
        pending: null,
        unassigned: 0,
        scheduledToday: 0,
        enRoute: 0,
        onSite: 0,
      },
    });

    const missions = deriveOpsMissions(telemetry);
    const readiness = computeReadiness(missions);
    // pending is unknown; remaining 4 missions are known and complete.
    expect(readiness.known).toBe(4);
    expect(readiness.completed).toBe(4);
    expect(readiness.readinessPercent).toBe(100);
  });
});

