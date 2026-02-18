import { describe, expect, it } from "vitest";
import {
  buildMonitorModel,
  resolveMonitorRouteEntry,
  resolveMonitorPresentation,
  type MonitorBuildContext,
} from "@/config/monitorRegistry";

function baseContext(overrides: Partial<Omit<MonitorBuildContext, "pathname">> = {}) {
  return {
    role: "admin" as const,
    isAuthenticated: true,
    companyId: "company-1",
    userId: "user-1",
    companyName: "Northwind HVAC",
    now: new Date("2026-02-12T10:00:00.000Z"),
    isLoading: false,
    dashboardStats: {
      totalCalculations: 5,
      monthlyCalculations: 3,
      plan: "pro",
      planDisplayName: "Pro",
      isUnlimited: true,
      remaining: -1,
      remainingText: "Unlimited",
      monthlyLimit: 3,
      usagePercentage: 0,
      isNearLimit: false,
      isAtLimit: false,
      remainingValue: -1,
      billingCycleResetLabel: "March 1",
    },
    revenueStats: {
      unpaidCount: 2,
      unpaidAmount: 1200,
      revenueAtRisk: 1200,
    },
    pipelineStats: {
      activeLeads: 6,
      convertedLeads: 4,
      conversionRate: 40,
    },
    calculations: [
      {
        id: "calc-1",
        user_id: "user-1",
        created_at: "2026-02-11T09:00:00.000Z",
        calculation_type: "standard-cycle",
        inputs: {},
        results: {},
      },
    ],
    opsTelemetry: {
      updatedAt: "2026-02-12T10:00:00.000Z",
      scope: {
        pathname: "/dashboard",
        companyId: "company-1",
        userId: "user-1",
      },
      jobs: {
        total: 12,
        pending: 5,
        enRoute: 2,
        onSite: 1,
        completed: 4,
        cancelled: 0,
        assigned: 7,
        unassigned: 3,
        scheduledToday: 2,
        assignedToMeOpen: 1,
        createdAtLast7d: [
          "2026-02-10T09:00:00.000Z",
          "2026-02-11T09:00:00.000Z",
          "2026-02-12T09:00:00.000Z",
        ],
      },
      clients: {
        total: 4,
        createdAtLast7d: ["2026-02-12T09:00:00.000Z"],
      },
      triage: {
        total: 6,
        new: 2,
        analyzed: 3,
        converted: 1,
        archived: 0,
        createdAtLast7d: ["2026-02-12T09:00:00.000Z"],
      },
      team: {
        members: 6,
        technicians: 2,
      },
      errors: [],
    },
    navigation: {
      ttfbMs: 150,
      domInteractiveMs: 640,
      loadEventMs: 880,
    },
    routeRenderMs: 44,
    ...overrides,
  };
}

describe("monitorRegistry route resolution", () => {
  it("matches auth and onboarding routes", () => {
    expect(resolveMonitorRouteEntry("/signin").id).toBe("auth-onboarding");
    expect(resolveMonitorRouteEntry("/invite/abc123").id).toBe(
      "auth-onboarding",
    );
  });

  it("matches operations routes", () => {
    expect(resolveMonitorRouteEntry("/dashboard").id).toBe("operations");
    expect(resolveMonitorRouteEntry("/dashboard/jobs/123").id).toBe(
      "operations",
    );
    expect(resolveMonitorRouteEntry("/portal").id).toBe("operations");
  });

  it("matches tools and engineering routes", () => {
    expect(resolveMonitorRouteEntry("/tools/standard-cycle").id).toBe(
      "tools-engineering",
    );
    expect(resolveMonitorRouteEntry("/advanced-reporting").id).toBe(
      "tools-engineering",
    );
    expect(resolveMonitorRouteEntry("/estimate-builder").id).toBe(
      "tools-engineering",
    );
  });

  it("matches public routes", () => {
    expect(resolveMonitorRouteEntry("/").id).toBe("public-content");
    expect(resolveMonitorRouteEntry("/pricing").id).toBe("public-content");
    expect(resolveMonitorRouteEntry("/blog/my-post").id).toBe("public-content");
  });
});

describe("monitorRegistry presentation resolver", () => {
  it("returns per-route overrides for high-visibility surfaces", () => {
    const triage = resolveMonitorPresentation("/dashboard/triage");
    expect(triage.template).toBe("pipeline");
    expect(triage.accent).toBe("violet");
    expect(triage.pattern).toBe("pipeline");
    expect(triage.icon).toBe("siren");
    expect(triage.signatureLabel).toBe("Triage Command");
  });

  it("falls back to sane defaults for unknown routes", () => {
    const fallback = resolveMonitorPresentation("/__unknown_surface__");
    expect(fallback.template).toBe("executive");
    expect(fallback.accent).toBe("slate");
    expect(fallback.pattern).toBe("grid");
    expect(fallback.signatureLabel).toContain("Monitor");
  });
});

describe("monitorRegistry model builders", () => {
  it("builds dashboard operations model from ops telemetry (compact by default)", () => {
    const model = buildMonitorModel("/dashboard", baseContext());

    expect(model.id).toBe("ops-monitor");
    expect(model.state).toBe("ready");
    expect(model.kpis[0]?.id).toBe("open-work");
    expect(model.kpis[0]?.value).toBe(8);
    expect(model.series?.id).toBe("recent-events");
  });

  it("renders dashboard model with placeholders when ops telemetry is unavailable", () => {
    const model = buildMonitorModel(
      "/dashboard",
      baseContext({
        opsTelemetry: null,
      }),
    );

    expect(model.kpis[0]?.id).toBe("open-work");
    expect(model.kpis[0]?.value).toBe("--");
    expect(model.kpis[0]?.tone).toBe("info");
  });

  it("builds tools model from live calculation context", () => {
    const model = buildMonitorModel(
      "/tools/refrigerant-comparison",
      baseContext(),
    );

    expect(model.id).toBe("tools-monitor");
    expect(model.kpis.length).toBeGreaterThanOrEqual(3);
    expect(model.series?.id).toBe("recent-calculations");
  });

  it("builds public model from runtime navigation metrics", () => {
    const model = buildMonitorModel(
      "/pricing",
      baseContext({
        isAuthenticated: false,
        role: null,
        calculations: [],
      }),
    );

    expect(model.id).toBe("public-monitor");
    expect(model.kpis.find((k) => k.id === "ttfb")?.value).toContain("ms");
    expect(model.series?.id).toBe("runtime-navigation");
  });

  it("applies route-specific storyboard copy", () => {
    const model = buildMonitorModel("/dashboard/dispatch", baseContext());

    expect(model.id).toBe("ops-monitor");
    expect(model.title).toBe("Dispatch Coordination Board");
    expect(model.series?.title).toBe("Dispatch Activity Trend");
    expect(model.kpis[0]?.label).toBe("Dispatch Queue");
  });

  it("applies route-specific public and tools KPI semantics", () => {
    const pricing = buildMonitorModel(
      "/pricing",
      baseContext({
        isAuthenticated: false,
        role: null,
        calculations: [],
      }),
    );
    expect(pricing.kpis.find((k) => k.id === "users")?.label).toBe(
      "Pricing Audience",
    );

    const estimate = buildMonitorModel("/estimate-builder", baseContext());
    expect(estimate.kpis.find((k) => k.id === "tool-family")?.label).toBe(
      "Estimate Domain",
    );
  });
});
