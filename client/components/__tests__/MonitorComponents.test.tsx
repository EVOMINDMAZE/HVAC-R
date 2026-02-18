import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MonitorChartPanel } from "@/components/monitor/MonitorChartPanel";
import { MonitorDiagramPanel } from "@/components/monitor/MonitorDiagramPanel";
import { MonitorKpiStrip } from "@/components/monitor/MonitorKpiStrip";
import { MonitorShell } from "@/components/monitor/MonitorShell";
import type { MonitorPageModel } from "@/types/monitor";

const readyModel: MonitorPageModel = {
  id: "ops-monitor",
  title: "Operations Monitor",
  subtitle: "Dispatch, revenue, and throughput visibility",
  state: "ready",
  sourceLabel: "Supabase operations telemetry",
  updatedAt: "2026-02-12T10:00:00.000Z",
  kpis: [
    { id: "monthly", label: "This Month", value: 4, sublabel: "10 total" },
    { id: "risk", label: "Revenue At Risk", value: "$1200", trend: -4 },
  ],
  series: {
    id: "recent-calculations",
    title: "7-Day Activity",
    points: [
      { label: "02-10", value: 1 },
      { label: "02-11", value: 3 },
    ],
    unit: "runs",
  },
  diagram: {
    id: "context",
    title: "Context Tile",
    nodes: [
      { id: "role", label: "Role", value: "admin" },
      { id: "company", label: "Company", value: "Northwind HVAC", tone: "success" },
    ],
  },
};

const originalMatchMedia = window.matchMedia;
const originalResizeObserver = globalThis.ResizeObserver;

describe("monitor components", () => {
  beforeEach(() => {
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }

    // Recharts uses ResizeObserver in ResponsiveContainer.
    // jsdom does not provide it by default.
    globalThis.ResizeObserver = ResizeObserverMock;
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    globalThis.ResizeObserver = originalResizeObserver;
  });

  it("renders KPI strip with trend badges", () => {
    render(
      <MonitorKpiStrip
        items={[
          { id: "a", label: "One", value: 1 },
          { id: "b", label: "Two", value: 2, trend: 5 },
        ]}
      />,
    );

    expect(screen.getByTestId("monitor-kpi-strip")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-kpi-b")).toHaveTextContent("+5%");
  });

  it("renders chart panel and totals when data exists", () => {
    render(<MonitorChartPanel series={readyModel.series} />);
    expect(screen.getByTestId("monitor-chart-panel")).toHaveTextContent(
      "7-Day Activity",
    );
    expect(screen.getByText("4 runs")).toBeInTheDocument();
  });

  it("renders empty chart message when data is missing", () => {
    render(<MonitorChartPanel />);
    expect(screen.getByText("No live chart data available yet.")).toBeInTheDocument();
  });

  it("renders diagram nodes", () => {
    render(<MonitorDiagramPanel diagram={readyModel.diagram} />);
    expect(screen.getByText("Northwind HVAC")).toBeInTheDocument();
  });

  it("renders loading and empty monitor shell states", () => {
    render(<MonitorShell model={{ ...readyModel, state: "loading" }} />);
    expect(screen.getByTestId("monitor-skeleton")).toBeInTheDocument();

    render(
      <MonitorShell
        model={{
          ...readyModel,
          state: "empty",
          emptyMessage: "No data yet",
        }}
      />,
    );
    expect(screen.getByTestId("monitor-empty-state")).toBeInTheDocument();
  });

  it("honors reduced motion preference", () => {
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    render(<MonitorShell model={readyModel} />);
    expect(screen.getByTestId("monitor-shell")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("renders monitor shell in dark theme context", () => {
    document.documentElement.classList.add("dark");
    render(<MonitorShell model={readyModel} />);
    expect(screen.getByTestId("monitor-shell")).toBeInTheDocument();
    document.documentElement.classList.remove("dark");
  });

  it("renders HUD hero reading + metric chips when hud skin is enabled", () => {
    const hudModel: MonitorPageModel = {
      ...readyModel,
      kpis: [
        { id: "ttfb", label: "TTFB", value: "150 ms", tone: "info", sublabel: "p95 target" },
        { id: "users", label: "Users", value: 1200, tone: "success" },
        { id: "risk", label: "Risk", value: "4%", tone: "warning" },
        { id: "revenue", label: "Revenue", value: "$1200", tone: "danger" },
      ],
    };

    render(<MonitorShell model={hudModel} skin="hud" />);
    expect(screen.getByTestId("monitor-hero")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-metric-row")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-metric-users")).toBeInTheDocument();
    expect(screen.getByText("150")).toBeInTheDocument();
    expect(screen.getByText("ms")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-chart-panel")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-diagram-panel")).toBeInTheDocument();
  });

  it("renders compact HUD orbit chips and hides panels in compact mode", () => {
    const hudModel: MonitorPageModel = {
      ...readyModel,
      kpis: [
        { id: "ttfb", label: "TTFB", value: "150 ms", tone: "info" },
        { id: "users", label: "Users", value: 1200, tone: "success" },
        { id: "risk", label: "Risk", value: "4%", tone: "warning" },
        { id: "revenue", label: "Revenue", value: "$1200", tone: "danger" },
      ],
    };

    render(<MonitorShell model={hudModel} skin="hud" density="compact" />);
    expect(screen.getByTestId("monitor-hero")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-orbit")).toBeInTheDocument();
    expect(screen.getByTestId("monitor-orbit-users")).toBeInTheDocument();
    expect(screen.queryByTestId("monitor-metric-row")).not.toBeInTheDocument();
    expect(screen.queryByTestId("monitor-chart-panel")).not.toBeInTheDocument();
    expect(screen.queryByTestId("monitor-diagram-panel")).not.toBeInTheDocument();
  });
});
