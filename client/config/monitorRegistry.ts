import { metrics } from "@/config/metrics";
import type { DashboardStats } from "@/hooks/useDashboardStats";
import type { PipelineStats, RevenueStats } from "@/hooks/useRevenueAnalytics";
import type { UserRole } from "@/hooks/useSupabaseAuth";
import type { Calculation } from "@/hooks/useSupabaseCalculations";
import type {
  MonitorDiagramItem,
  MonitorKpiItem,
  MonitorPageModel,
  MonitorPresentation,
  MonitorSeries,
  MonitorSeriesPoint,
  MonitorTone,
  MonitorAccent,
  MonitorIconKey,
  MonitorLayoutTemplate,
  MonitorPattern,
} from "@/types/monitor";
import type { MonitorOpsTelemetrySnapshot } from "@/types/monitorTelemetry";

export interface NavigationTimingSnapshot {
  ttfbMs: number | null;
  domInteractiveMs: number | null;
  loadEventMs: number | null;
}

export interface MonitorBuildContext {
  pathname: string;
  role: UserRole | null;
  isAuthenticated: boolean;
  companyId?: string | null;
  userId?: string | null;
  companyName?: string | null;
  now: Date;
  isLoading: boolean;
  dashboardStats?: DashboardStats | null;
  revenueStats?: RevenueStats | null;
  pipelineStats?: PipelineStats | null;
  calculations?: Calculation[];
  opsTelemetry?: MonitorOpsTelemetrySnapshot | null;
  navigation?: NavigationTimingSnapshot;
  routeRenderMs?: number | null;
}

export interface MonitorRouteEntry {
  id: string;
  label: string;
  pattern: RegExp;
  build: (context: MonitorBuildContext) => MonitorPageModel;
}

interface RouteStoryboardProfile {
  title: string;
  subtitle: string;
  chartTitle: string;
  chartDescription: string;
  diagramTitle: string;
  diagramDescription: string;
  sourceLabel?: string;
  emptyMessage?: string;
}

type RouteStoryboardMap = Record<string, RouteStoryboardProfile>;
type KpiLabelProfile = Record<string, string>;

function roundNumber(value: number | null | undefined): number | null {
  if (value == null || Number.isNaN(value)) return null;
  return Math.round(value);
}

function toTitleWords(value: string): string {
  return value
    .replace(/^:/, "")
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

function formatRouteName(pathname: string): string {
  if (pathname === "/") return "Landing";
  return toTitleWords(pathname.split("/").filter(Boolean).slice(-1)[0] || "Overview");
}

function normalizeMonitorPath(pathname: string): string {
  const lower = pathname.toLowerCase();

  if (/^\/blog\/[^/]+$/i.test(lower)) return "/blog/:slug";
  if (/^\/callback\/[^/]+$/i.test(lower)) return "/callback/:provider";
  if (/^\/invite\/[^/]+$/i.test(lower)) return "/invite/:slug";
  if (/^\/track-job\/[^/]+$/i.test(lower)) return "/track-job/:id";
  if (/^\/tech\/jobs\/[^/]+$/i.test(lower)) return "/tech/jobs/:id";
  if (/^\/dashboard\/jobs\/[^/]+$/i.test(lower)) return "/dashboard/jobs/:id";
  if (/^\/dashboard\/clients\/[^/]+$/i.test(lower)) {
    return "/dashboard/clients/:id";
  }

  return lower;
}

function resolveStoryboardProfile(
  pathname: string,
  map: RouteStoryboardMap,
  fallback: RouteStoryboardProfile,
): RouteStoryboardProfile {
  const normalized = normalizeMonitorPath(pathname);
  return map[normalized] || fallback;
}

function resolveRouteSurface(pathname: string): string {
  const normalized = normalizeMonitorPath(pathname);
  if (normalized === "/") return "Landing";

  const segments = normalized.split("/").filter(Boolean);
  if (!segments.length) return "Overview";

  let surface = segments[segments.length - 1];
  if (surface?.startsWith(":") && segments.length > 1) {
    surface = segments[segments.length - 2];
  }

  return toTitleWords(surface || "Overview");
}

function resolveRouteSurfaceWithOverrides(
  pathname: string,
  overrides: Record<string, string>,
): string {
  const normalized = normalizeMonitorPath(pathname);
  return overrides[normalized] || resolveRouteSurface(pathname);
}

function withKpiLabels(
  items: MonitorKpiItem[],
  labels: KpiLabelProfile,
): MonitorKpiItem[] {
  return items.map((item) => {
    const override = labels[item.id];
    if (!override) return item;
    return { ...item, label: override };
  });
}

const opsKpiSurfaceOverrides: Record<string, string> = {
  "/dashboard": "Executive",
  "/dashboard/dispatch": "Dispatch",
  "/dashboard/triage": "Triage",
  "/dashboard/fleet": "Fleet",
  "/dashboard/jobs": "Jobs",
  "/dashboard/jobs/:id": "Job Detail",
  "/dashboard/projects": "Projects",
  "/dashboard/clients": "Clients",
  "/dashboard/clients/:id": "Client Detail",
  "/portal": "Portal",
  "/track-job/:id": "Job Tracking",
  "/tech": "Field",
  "/tech/jobs/:id": "Field Job",
  "/history": "History",
  "/profile": "Profile",
  "/settings/company": "Company",
  "/settings/team": "Team",
};

const toolsKpiSurfaceOverrides: Record<string, string> = {
  "/advanced-reporting": "Reporting",
  "/troubleshooting": "Diagnostics",
  "/diy-calculators": "DIY",
  "/estimate-builder": "Estimate",
  "/ai/pattern-insights": "AI Insights",
};

const publicKpiSurfaceOverrides: Record<string, string> = {
  "/": "Landing",
  "/a2l-resources": "A2L",
  "/connect-provider": "Connect",
  "/help-center": "Help Center",
};

const authKpiSurfaceOverrides: Record<string, string> = {
  "/signin": "Sign-In",
  "/signup": "Sign-Up",
  "/select-company": "Company Select",
  "/join-company": "Company Join",
  "/invite/:slug": "Invite",
  "/create-company": "Company Create",
  "/invite-team": "Team Invite",
  "/callback/:provider": "Callback",
};

const debugKpiSurfaceOverrides: Record<string, string> = {
  "/stripe-debug": "Stripe",
  "/agent-sandbox": "Agent",
};

function buildOpsKpiLabels(pathname: string): KpiLabelProfile {
  const surface = resolveRouteSurfaceWithOverrides(pathname, opsKpiSurfaceOverrides);
  return {
    "monthly-runs": `${surface} Activity`,
    "remaining-limit": `${surface} Capacity`,
    "revenue-risk": `${surface} Exposure`,
    "lead-conversion": `${surface} Conversion`,
  };
}

function buildToolsKpiLabels(pathname: string): KpiLabelProfile {
  const surface = resolveRouteSurfaceWithOverrides(pathname, toolsKpiSurfaceOverrides);
  return {
    "tool-family": `${surface} Domain`,
    "tool-runs-total": `${surface} Runs`,
    "tool-latest": `Latest ${surface} Run`,
    "tool-role": `${surface} Operator`,
  };
}

function buildPublicKpiLabels(pathname: string): KpiLabelProfile {
  const surface = resolveRouteSurfaceWithOverrides(pathname, publicKpiSurfaceOverrides);
  return {
    users: `${surface} Audience`,
    ttfb: `${surface} TTFB`,
    "dom-ready": `${surface} DOM`,
    "load-event": `${surface} Load`,
  };
}

function buildAuthKpiLabels(pathname: string): KpiLabelProfile {
  const surface = resolveRouteSurfaceWithOverrides(pathname, authKpiSurfaceOverrides);
  return {
    session: `${surface} Session`,
    role: `${surface} Role`,
    "render-latency": `${surface} Render`,
    route: `${surface} Route`,
  };
}

function buildDebugKpiLabels(pathname: string): KpiLabelProfile {
  const surface = resolveRouteSurfaceWithOverrides(pathname, debugKpiSurfaceOverrides);
  return {
    route: `${surface} Route`,
    "render-latency": `${surface} Render`,
    session: `${surface} Session`,
    role: `${surface} Role`,
  };
}

function createOpsStory(
  title: string,
  subtitle: string,
  chartTitle: string,
  diagramTitle: string,
): RouteStoryboardProfile {
  return {
    title,
    subtitle,
    chartTitle,
    chartDescription:
      "Real activity trend derived from saved workflows and operational events.",
    diagramTitle,
    diagramDescription:
      "Live operating context showing workspace scope, actor, and reset cadence.",
    sourceLabel: "Supabase operations telemetry",
    emptyMessage:
      "No operational data yet. Run a workflow and this monitor will populate automatically.",
  };
}

function createToolsStory(
  title: string,
  subtitle: string,
  chartTitle: string,
  diagramTitle: string,
): RouteStoryboardProfile {
  return {
    title,
    subtitle,
    chartTitle,
    chartDescription:
      "Recent engineering activity from real saved runs in this workspace.",
    diagramTitle,
    diagramDescription:
      "Execution context and data lineage for this engineering surface.",
    sourceLabel: "Calculation history + runtime telemetry",
    emptyMessage:
      "No saved tool runs yet. Execute a tool and save the output to unlock trends.",
  };
}

function createPublicStory(
  title: string,
  subtitle: string,
  chartTitle: string,
  diagramTitle: string,
): RouteStoryboardProfile {
  return {
    title,
    subtitle,
    chartTitle,
    chartDescription:
      "Runtime loading profile from the active browser session for this page.",
    diagramTitle,
    diagramDescription: metrics.meta.asOfLabel,
    sourceLabel: metrics.meta.asOfLabel,
    emptyMessage:
      "Runtime timings are not available yet. Refresh and interact with the page to populate metrics.",
  };
}

function createAuthStory(
  title: string,
  subtitle: string,
  chartTitle: string,
  diagramTitle: string,
): RouteStoryboardProfile {
  return {
    title,
    subtitle,
    chartTitle,
    chartDescription: "Live route timing for the active access or onboarding flow.",
    diagramTitle,
    diagramDescription:
      "Role, company, and route context captured from authenticated runtime state.",
    sourceLabel: "Runtime UI telemetry",
  };
}

function createDebugStory(
  title: string,
  subtitle: string,
  chartTitle: string,
  diagramTitle: string,
): RouteStoryboardProfile {
  return {
    title,
    subtitle,
    chartTitle,
    chartDescription: "Diagnostic timing profile from active runtime instrumentation.",
    diagramTitle,
    diagramDescription:
      "Debug route execution context for operator and environment validation.",
    sourceLabel: "Runtime diagnostics telemetry",
  };
}

const defaultOpsStoryboardProfile = createOpsStory(
  "Operations Monitor",
  "Dispatch, revenue, and throughput visibility",
  "Operations Throughput Trend",
  "Live Operations Context",
);

const defaultToolsStoryboardProfile = createToolsStory(
  "Engineering Monitor",
  "Tool usage, recency, and execution context",
  "Engineering Run Trend",
  "Tool Execution Context",
);

const defaultPublicStoryboardProfile = createPublicStory(
  "Experience Monitor",
  "Public experience quality and trust signals",
  "Runtime Load Profile",
  "Trust and Standards",
);

const defaultAuthStoryboardProfile = createAuthStory(
  "Access Flow Monitor",
  "Authentication and onboarding health",
  "Access Runtime Profile",
  "Access Context Tile",
);

const defaultDebugStoryboardProfile = createDebugStory(
  "System Diagnostic Monitor",
  "Internal diagnostics and runtime instrumentation view",
  "Diagnostic Runtime Profile",
  "Diagnostic Context Tile",
);

const opsStoryboardProfiles: RouteStoryboardMap = {
  "/dashboard": createOpsStory(
    "Executive Operations Board",
    "Command view for throughput, exposure, and operating posture",
    "Executive Throughput Trend",
    "Executive Context",
  ),
  "/dashboard/dispatch": createOpsStory(
    "Dispatch Coordination Board",
    "Routing and dispatch cadence for active service operations",
    "Dispatch Activity Trend",
    "Dispatch Context Chain",
  ),
  "/dashboard/triage": createOpsStory(
    "Triage Intake Command",
    "Lead intake and triage progression visibility",
    "Triage Intake Trend",
    "Triage Flow Context",
  ),
  "/dashboard/fleet": createOpsStory(
    "Fleet Readiness Grid",
    "Readiness and field execution posture for fleet operations",
    "Fleet Activity Trend",
    "Fleet Operations Context",
  ),
  "/dashboard/jobs": createOpsStory(
    "Job Pipeline Console",
    "Workload and service lifecycle overview",
    "Job Pipeline Trend",
    "Job Workflow Context",
  ),
  "/dashboard/jobs/:id": createOpsStory(
    "Job Execution Storyboard",
    "Detailed execution telemetry for the active job",
    "Job Execution Trend",
    "Job Detail Context",
  ),
  "/dashboard/projects": createOpsStory(
    "Project Delivery Matrix",
    "Program-level delivery posture and execution rhythm",
    "Project Delivery Trend",
    "Project Delivery Context",
  ),
  "/dashboard/clients": createOpsStory(
    "Client Service Portfolio",
    "Service coverage and account health overview",
    "Client Portfolio Trend",
    "Client Service Context",
  ),
  "/dashboard/clients/:id": createOpsStory(
    "Client Account Storyboard",
    "Account-specific operating context and service continuity",
    "Account Activity Trend",
    "Account Context Tile",
  ),
  "/portal": createOpsStory(
    "Client Portal Brief",
    "Service transparency and lifecycle visibility for client users",
    "Portal Service Trend",
    "Portal Context Tile",
  ),
  "/track-job/:id": createOpsStory(
    "Job Tracking Journey",
    "Real-time progress narrative for the tracked service request",
    "Tracking Progress Trend",
    "Tracking Context Chain",
  ),
  "/tech": createOpsStory(
    "Technician Field Board",
    "Field execution pulse for active technician workload",
    "Field Activity Trend",
    "Field Context Tile",
  ),
  "/tech/jobs/:id": createOpsStory(
    "Field Job Runbook",
    "In-flight technician execution context for this job",
    "Field Job Trend",
    "Field Job Context",
  ),
  "/history": createOpsStory(
    "Service History Timeline",
    "Historical service signal and execution continuity",
    "History Activity Trend",
    "History Context Chain",
  ),
  "/profile": createOpsStory(
    "Operator Profile Snapshot",
    "Identity, role, and operating footprint overview",
    "Profile Activity Trend",
    "Profile Context Tile",
  ),
  "/settings/company": createOpsStory(
    "Company Configuration Brief",
    "Organization configuration posture and operational impact",
    "Configuration Activity Trend",
    "Company Configuration Context",
  ),
  "/settings/team": createOpsStory(
    "Team Operations Roster",
    "Team structure and role coverage visibility",
    "Team Activity Trend",
    "Team Context Tile",
  ),
};

const toolsStoryboardProfiles: RouteStoryboardMap = {
  "/advanced-reporting": createToolsStory(
    "Advanced Reporting Lab",
    "Narrative analytics for advanced operational reporting",
    "Reporting Run Trend",
    "Reporting Context Tile",
  ),
  "/troubleshooting": createToolsStory(
    "Troubleshooting Decision Map",
    "Guided diagnostic workflow with execution telemetry",
    "Troubleshooting Trend",
    "Troubleshooting Context",
  ),
  "/diy-calculators": createToolsStory(
    "DIY Calculator Toolkit",
    "Self-serve calculator workflow and adoption signal",
    "DIY Usage Trend",
    "DIY Context Tile",
  ),
  "/estimate-builder": createToolsStory(
    "Estimate Builder Blueprint",
    "Estimate generation pipeline and revision activity",
    "Estimate Build Trend",
    "Estimate Context Tile",
  ),
  "/tools/standard-cycle": createToolsStory(
    "Standard Cycle Analyzer",
    "Standard-cycle engineering workflow and output cadence",
    "Standard Cycle Trend",
    "Cycle Context Tile",
  ),
  "/tools/refrigerant-comparison": createToolsStory(
    "Refrigerant Comparison Studio",
    "Comparative refrigerant analysis activity and context",
    "Comparison Trend",
    "Comparison Context Tile",
  ),
  "/tools/cascade-cycle": createToolsStory(
    "Cascade Cycle Simulator",
    "Cascade-cycle run activity and engineering context",
    "Cascade Activity Trend",
    "Cascade Context Tile",
  ),
  "/tools/refrigerant-report": createToolsStory(
    "Refrigerant Reporting Desk",
    "Compliance report generation activity and readiness context",
    "Report Generation Trend",
    "Report Context Tile",
  ),
  "/tools/refrigerant-inventory": createToolsStory(
    "Refrigerant Inventory Ledger",
    "Inventory workflow activity and data quality context",
    "Inventory Activity Trend",
    "Inventory Context Tile",
  ),
  "/tools/leak-rate-calculator": createToolsStory(
    "Leak Rate Analysis Panel",
    "Leak-rate computation activity and compliance context",
    "Leak Rate Trend",
    "Leak Analysis Context",
  ),
  "/tools/warranty-scanner": createToolsStory(
    "Warranty Scanner Console",
    "Warranty scan throughput and confidence context",
    "Warranty Scan Trend",
    "Warranty Context Tile",
  ),
  "/tools/iaq-wizard": createToolsStory(
    "IAQ Wizard Briefing",
    "Indoor air quality workflow activity and decision context",
    "IAQ Workflow Trend",
    "IAQ Context Tile",
  ),
  "/ai/pattern-insights": createToolsStory(
    "AI Pattern Insight Studio",
    "Pattern analysis activity and interpretive context",
    "Pattern Insight Trend",
    "AI Insight Context",
  ),
};

const publicStoryboardProfiles: RouteStoryboardMap = {
  "/": createPublicStory(
    "Landing Experience Storyboard",
    "Top-of-funnel experience performance and trust signal",
    "Landing Runtime Profile",
    "Landing Trust Layer",
  ),
  "/triage": createPublicStory(
    "Public Triage Intake Snapshot",
    "Intake experience quality for unauthenticated triage flows",
    "Triage Runtime Profile",
    "Triage Trust Layer",
  ),
  "/a2l-resources": createPublicStory(
    "A2L Resource Brief",
    "Reference experience performance for A2L educational content",
    "A2L Runtime Profile",
    "A2L Trust Layer",
  ),
  "/features": createPublicStory(
    "Feature Value Narrative",
    "Feature discovery experience and clarity signal",
    "Feature Runtime Profile",
    "Feature Trust Layer",
  ),
  "/pricing": createPublicStory(
    "Pricing Clarity Dashboard",
    "Pricing comprehension performance and trust posture",
    "Pricing Runtime Profile",
    "Pricing Trust Layer",
  ),
  "/about": createPublicStory(
    "Company Story Overview",
    "Brand trust and company-story reading experience",
    "About Runtime Profile",
    "About Trust Layer",
  ),
  "/blog": createPublicStory(
    "Industry Insights Feed",
    "Editorial browsing experience and engagement-readiness signal",
    "Blog Runtime Profile",
    "Blog Trust Layer",
  ),
  "/blog/:slug": createPublicStory(
    "Article Experience Detail",
    "Single-article readability and load quality signal",
    "Article Runtime Profile",
    "Article Trust Layer",
  ),
  "/stories": createPublicStory(
    "Web Story Showcase",
    "Short-form story consumption performance signal",
    "Story Runtime Profile",
    "Story Trust Layer",
  ),
  "/podcasts": createPublicStory(
    "Podcast Program Monitor",
    "Podcast discovery and playback-readiness experience",
    "Podcast Runtime Profile",
    "Podcast Trust Layer",
  ),
  "/contact": createPublicStory(
    "Contact Funnel Snapshot",
    "Contact pathway performance and form readiness",
    "Contact Runtime Profile",
    "Contact Trust Layer",
  ),
  "/documentation": createPublicStory(
    "Documentation Usability Monitor",
    "Documentation discoverability and reading quality",
    "Documentation Runtime Profile",
    "Documentation Trust Layer",
  ),
  "/help": createPublicStory(
    "Support Experience Monitor",
    "Help content usability and support-entry performance",
    "Support Runtime Profile",
    "Support Trust Layer",
  ),
  "/help-center": createPublicStory(
    "Support Center Monitor",
    "Support center interaction quality and clarity signal",
    "Help Center Runtime Profile",
    "Help Center Trust Layer",
  ),
  "/privacy": createPublicStory(
    "Privacy Policy Readability",
    "Policy reading performance and legal trust signal",
    "Privacy Runtime Profile",
    "Privacy Trust Layer",
  ),
  "/terms": createPublicStory(
    "Terms Governance Brief",
    "Terms readability and governance communication quality",
    "Terms Runtime Profile",
    "Terms Trust Layer",
  ),
  "/connect-provider": createPublicStory(
    "Provider Connection Readiness",
    "Provider-connect onboarding performance and confidence signal",
    "Connection Runtime Profile",
    "Connection Trust Layer",
  ),
  "/career": createPublicStory(
    "Career Pathway Monitor",
    "Career page exploration quality and candidate confidence signal",
    "Career Runtime Profile",
    "Career Trust Layer",
  ),
};

const authStoryboardProfiles: RouteStoryboardMap = {
  "/signin": createAuthStory(
    "Sign-In Conversion Monitor",
    "Authentication entry reliability and latency signal",
    "Sign-In Runtime Profile",
    "Sign-In Context Tile",
  ),
  "/signup": createAuthStory(
    "Sign-Up Conversion Monitor",
    "Account creation reliability and onboarding timing",
    "Sign-Up Runtime Profile",
    "Sign-Up Context Tile",
  ),
  "/select-company": createAuthStory(
    "Company Selection Flow",
    "Company context assignment flow and runtime health",
    "Selection Runtime Profile",
    "Selection Context Tile",
  ),
  "/join-company": createAuthStory(
    "Company Join Flow",
    "Company join experience and route reliability",
    "Join Runtime Profile",
    "Join Context Tile",
  ),
  "/invite/:slug": createAuthStory(
    "Invitation Acceptance Flow",
    "Invite acceptance experience and onboarding continuity",
    "Invite Runtime Profile",
    "Invite Context Tile",
  ),
  "/create-company": createAuthStory(
    "Company Creation Flow",
    "Company creation reliability and progression timing",
    "Creation Runtime Profile",
    "Creation Context Tile",
  ),
  "/invite-team": createAuthStory(
    "Team Invite Flow",
    "Team invite delivery flow and runtime confidence",
    "Team Invite Runtime Profile",
    "Team Invite Context Tile",
  ),
  "/callback/:provider": createAuthStory(
    "Provider Callback Health",
    "OAuth callback reliability and access continuation",
    "Callback Runtime Profile",
    "Callback Context Tile",
  ),
};

const debugStoryboardProfiles: RouteStoryboardMap = {
  "/stripe-debug": createDebugStory(
    "Stripe Diagnostic Panel",
    "Billing integration diagnostics and callback visibility",
    "Stripe Diagnostic Trend",
    "Stripe Diagnostic Context",
  ),
  "/agent-sandbox": createDebugStory(
    "Agent Sandbox Telemetry",
    "Agent behavior testing and runtime instrumentation view",
    "Sandbox Runtime Trend",
    "Sandbox Diagnostic Context",
  ),
};

function buildRecentCalculationSeries(
  calculations: Calculation[] | undefined,
  days = 7,
  options: Partial<Pick<MonitorSeries, "title" | "description" | "unit">> = {},
): MonitorSeries {
  const byDay = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }

  for (const calc of calculations || []) {
    const key = String(calc.created_at || "").slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
  }

  const points: MonitorSeriesPoint[] = Array.from(byDay.entries()).map(
    ([key, value]) => ({
      label: key.slice(5),
      value,
    }),
  );

  return {
    id: "recent-calculations",
    title: options.title || "7-Day Activity",
    description: options.description || "Real saved calculations per day",
    unit: options.unit || "runs",
    points,
  };
}

function buildNavigationSeries(
  navigation: NavigationTimingSnapshot | undefined,
  options: Partial<Pick<MonitorSeries, "title" | "description" | "unit">> = {},
): MonitorSeries {
  const points: MonitorSeriesPoint[] = [
    { label: "TTFB", value: navigation?.ttfbMs || 0 },
    { label: "DOM", value: navigation?.domInteractiveMs || 0 },
    { label: "Load", value: navigation?.loadEventMs || 0 },
  ];

  return {
    id: "runtime-navigation",
    title: options.title || "Runtime Load Profile",
    description: options.description || "Measured in current browser session",
    unit: options.unit || "ms",
    points,
  };
}

function getToolFamily(pathname: string): string {
  if (pathname.startsWith("/tools/")) {
    return pathname.replace("/tools/", "").replace(/-/g, " ");
  }
  if (pathname.startsWith("/ai/")) return "ai insights";
  if (pathname.startsWith("/diy")) return "field calculators";
  if (pathname.startsWith("/estimate-builder")) return "estimate builder";
  return "operations tool";
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function resolveToolCalculationKey(pathname: string): string | null {
  const normalized = normalizeMonitorPath(pathname);
  if (normalized === "/tools/standard-cycle") return "standardcycle";
  if (normalized === "/tools/refrigerant-comparison") return "refrigerantcomparison";
  if (normalized === "/tools/cascade-cycle") return "cascadecycle";
  if (normalized === "/estimate-builder") return "estimate";
  if (normalized === "/troubleshooting") return "troubleshooting";
  if (normalized === "/ai/pattern-insights") return "pattern";
  return null;
}

function getCertDiagram(title: string, description: string): MonitorDiagramItem {
  const certs = Object.values(metrics.certifications);
  const activeCount = certs.filter((cert) => cert.status === "active").length;
  const progressCount = certs.filter(
    (cert) => cert.status === "in_progress",
  ).length;
  const plannedCount = certs.filter(
    (cert) => cert.status !== "active" && cert.status !== "in_progress",
  ).length;

  return {
    id: "trust-status",
    title,
    description,
    nodes: [
      {
        id: "active",
        label: "Active Controls",
        value: String(activeCount),
        tone: "success",
      },
      {
        id: "progress",
        label: "In Progress",
        value: String(progressCount),
        tone: "warning",
      },
      {
        id: "planned",
        label: "Planned",
        value: String(plannedCount),
        tone: "info",
      },
    ],
  };
}

function toneFromTrend(trend: number): MonitorTone {
  if (trend > 0) return "success";
  if (trend < 0) return "danger";
  return "default";
}

function formatCount(value: number | null | undefined): string {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value.toLocaleString();
}

function kpiCountValue(value: number | null | undefined): string | number {
  if (typeof value !== "number" || Number.isNaN(value)) return "--";
  return value;
}

function sumCounts(values: Array<number | null | undefined>): number | null {
  if (!values.length) return null;
  let sum = 0;
  for (const value of values) {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    sum += value;
  }
  return sum;
}

function buildRecentTimestampSeries(
  timestamps: string[] | undefined,
  days = 7,
  options: Partial<Pick<MonitorSeries, "title" | "description" | "unit">> = {},
): MonitorSeries {
  const byDay = new Map<string, number>();
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const key = day.toISOString().slice(0, 10);
    byDay.set(key, 0);
  }

  for (const ts of timestamps || []) {
    const key = String(ts || "").slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) || 0) + 1);
    }
  }

  const points: MonitorSeriesPoint[] = Array.from(byDay.entries()).map(
    ([key, value]) => ({
      label: key.slice(5),
      value,
    }),
  );

  return {
    id: "recent-events",
    title: options.title || "7-Day Activity",
    description: options.description || "Events captured per day",
    unit: options.unit || "events",
    points,
  };
}

function buildOpsModel(context: MonitorBuildContext): MonitorPageModel {
  const profile = resolveStoryboardProfile(
    context.pathname,
    opsStoryboardProfiles,
    defaultOpsStoryboardProfile,
  );
  const presentation = resolveMonitorPresentation(context.pathname);
  const stats = context.dashboardStats;
  const revenue = context.revenueStats;
  const pipeline = context.pipelineStats;
  const calculations = context.calculations || [];
  const normalized = normalizeMonitorPath(context.pathname);
  const opsTelemetry = context.opsTelemetry;
  const jobs = opsTelemetry?.jobs || null;
  const clients = opsTelemetry?.clients || null;
  const triage = opsTelemetry?.triage || null;
  const team = opsTelemetry?.team || null;

  const jobEvents = jobs?.createdAtLast7d || [];
  const clientEvents = clients?.createdAtLast7d || [];
  const triageEvents = triage?.createdAtLast7d || [];

  const hasJobsTelemetry =
    jobs &&
    (jobs.total != null ||
      jobs.pending != null ||
      jobs.enRoute != null ||
      jobs.onSite != null ||
      jobs.completed != null ||
      jobs.cancelled != null ||
      jobs.createdAtLast7d.length > 0);

  const hasClientTelemetry =
    clients &&
    (clients.total != null || clients.createdAtLast7d.length > 0);

  const hasTriageTelemetry =
    triage &&
    (triage.total != null ||
      triage.new != null ||
      triage.analyzed != null ||
      triage.converted != null ||
      triage.archived != null ||
      triage.createdAtLast7d.length > 0);

  const recentCalc = calculations[0]?.created_at || null;
  const updatedAt =
    jobEvents[jobEvents.length - 1] ||
    clientEvents[clientEvents.length - 1] ||
    triageEvents[triageEvents.length - 1] ||
    opsTelemetry?.updatedAt ||
    recentCalc ||
    context.now.toISOString();

  const state = context.isLoading ? "loading" : "ready";

  const runtimeFallbackSeries = buildNavigationSeries(context.navigation, {
    title: `${profile.chartTitle} (Runtime)`,
    description: "Fallback: browser timings until live telemetry is available",
    unit: "ms",
  });

  const chartSeriesForJobs = hasJobsTelemetry && jobs
    ? buildRecentTimestampSeries(jobs.createdAtLast7d, 7, {
        title: profile.chartTitle,
        description: "Jobs created per day (last 7 days)",
        unit: "jobs",
      })
    : runtimeFallbackSeries;

  const chartSeriesForClients = hasClientTelemetry && clients
    ? buildRecentTimestampSeries(clients.createdAtLast7d, 7, {
        title: profile.chartTitle,
        description: "Clients created per day (last 7 days)",
        unit: "clients",
      })
    : runtimeFallbackSeries;

  const chartSeriesForTriage = hasTriageTelemetry && triage
    ? buildRecentTimestampSeries(triage.createdAtLast7d, 7, {
        title: profile.chartTitle,
        description: "Leads captured per day (last 7 days)",
        unit: "leads",
      })
    : runtimeFallbackSeries;

  const openJobs =
    jobs != null
      ? sumCounts([jobs.pending, jobs.enRoute, jobs.onSite])
      : null;

  if (normalized === "/dashboard") {
    const hasOpsSignal = hasJobsTelemetry || hasClientTelemetry || hasTriageTelemetry;

    const inflightJobs =
      jobs != null ? sumCounts([jobs.enRoute, jobs.onSite]) : null;

    const heroOpenJobs = kpiCountValue(openJobs);
    const heroSublabel = hasOpsSignal
      ? jobs?.total != null
        ? `${formatCount(jobs.total)} total jobs across the workspace`
        : "Pending + in-flight workload"
      : profile.emptyMessage ||
        "No operational data yet. Run a workflow and this monitor will populate automatically.";

    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      // Prefer rendering the dashboard HUD immediately with live placeholders;
      // the values will hydrate as telemetry hooks resolve.
      state: "ready",
      sourceLabel: profile.sourceLabel || "Supabase operations telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "open-work",
          label: "Open Workload",
          value: heroOpenJobs,
          sublabel: heroSublabel,
          tone: openJobs == null ? "info" : openJobs > 0 ? "warning" : "success",
        },
        {
          id: "dispatch-queue",
          label: "Dispatch Queue",
          value: kpiCountValue(jobs?.pending),
          sublabel: "Awaiting dispatch",
          tone: (jobs?.pending || 0) > 0 ? "warning" : "default",
        },
        {
          id: "dispatch-unassigned",
          label: "Unassigned",
          value: kpiCountValue(jobs?.unassigned),
          sublabel: "Technician not set",
          tone: (jobs?.unassigned || 0) > 0 ? "warning" : "default",
        },
        {
          id: "inflight-jobs",
          label: "In Flight",
          value: kpiCountValue(inflightJobs),
          sublabel: "En route + on site",
          tone: (inflightJobs || 0) > 0 ? "info" : "default",
        },
        {
          id: "scheduled-today",
          label: "Scheduled Today",
          value: kpiCountValue(jobs?.scheduledToday),
          sublabel: "Start window",
          tone: (jobs?.scheduledToday || 0) > 6 ? "warning" : "default",
        },
        {
          id: "triage-new",
          label: "New Leads",
          value: kpiCountValue(triage?.new),
          sublabel: triage?.total != null ? `${formatCount(triage.total)} total submissions` : "Inbound intake",
          tone: (triage?.new || 0) > 0 ? "warning" : "default",
        },
        {
          id: "clients-total",
          label: "Clients",
          value: kpiCountValue(clients?.total),
          sublabel: context.companyName || "Service portfolio",
          tone: (clients?.total || 0) > 0 ? "info" : "default",
        },
        {
          id: "techs",
          label: "Technicians",
          value: kpiCountValue(team?.technicians),
          sublabel: team?.members != null ? `${formatCount(team.members)} total members` : "Team roster",
          tone: team?.technicians != null ? "info" : "default",
        },
      ],
      series: chartSeriesForJobs,
      diagram: {
        id: "exec-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "queued", label: "Queued", value: formatCount(jobs?.pending), tone: "warning" },
          { id: "en-route", label: "En Route", value: formatCount(jobs?.enRoute), tone: "info" },
          { id: "on-site", label: "On Site", value: formatCount(jobs?.onSite), tone: "info" },
          { id: "done", label: "Completed", value: formatCount(jobs?.completed), tone: "success" },
          { id: "leads", label: "New Leads", value: formatCount(triage?.new), tone: "info" },
          { id: "clients", label: "Clients", value: formatCount(clients?.total), tone: "info" },
        ],
      },
    };
  }

  if (normalized === "/dashboard/dispatch") {
    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: profile.sourceLabel || "Supabase job telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "dispatch-queue",
          label: "Dispatch Queue",
          value: kpiCountValue(jobs?.pending),
          sublabel:
            jobs?.total != null
              ? `${formatCount(jobs.total)} total jobs`
              : context.isAuthenticated
                ? "Jobs telemetry not available yet"
                : "Sign in to load dispatch telemetry",
          tone: (jobs?.pending || 0) > 0 ? "warning" : "success",
        },
        {
          id: "dispatch-unassigned",
          label: "Unassigned",
          value: kpiCountValue(jobs?.unassigned),
          sublabel: "Technician not set",
          tone: (jobs?.unassigned || 0) > 0 ? "warning" : "default",
        },
        {
          id: "scheduled-today",
          label: "Scheduled Today",
          value: kpiCountValue(jobs?.scheduledToday),
          sublabel: "Scheduled start window",
          tone: (jobs?.scheduledToday || 0) > 6 ? "warning" : "default",
        },
        {
          id: "techs",
          label: "Technicians",
          value: kpiCountValue(team?.technicians),
          sublabel: team?.members != null ? `${formatCount(team.members)} total members` : "Team roster",
          tone: team?.technicians != null ? "info" : "default",
        },
        {
          id: "jobs-open",
          label: "Open Jobs",
          value: kpiCountValue(openJobs),
          sublabel: "Pending + in flight",
          tone: (openJobs || 0) > 0 ? "warning" : "success",
        },
        {
          id: "triage-new",
          label: "New Leads",
          value: kpiCountValue(triage?.new),
          sublabel:
            triage?.total != null
              ? `${formatCount(triage.total)} total submissions`
              : "Inbound intake",
          tone: (triage?.new || 0) > 0 ? "warning" : "default",
        },
        {
          id: "clients-total",
          label: "Clients",
          value: kpiCountValue(clients?.total),
          sublabel: context.companyName || "Client portfolio",
          tone: (clients?.total || 0) > 0 ? "info" : "default",
        },
      ],
      series: chartSeriesForJobs,
      diagram: {
        id: "dispatch-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "queued", label: "Queued", value: formatCount(jobs?.pending), tone: "warning" },
          { id: "en-route", label: "En Route", value: formatCount(jobs?.enRoute), tone: "info" },
          { id: "on-site", label: "On Site", value: formatCount(jobs?.onSite), tone: "info" },
          { id: "done", label: "Completed", value: formatCount(jobs?.completed), tone: "success" },
        ],
      },
    };
  }

  if (normalized === "/dashboard/triage") {
    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: profile.sourceLabel || "Supabase triage telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "triage-new",
          label: "New Leads",
          value: kpiCountValue(triage?.new),
          sublabel:
            triage?.total != null
              ? `${formatCount(triage.total)} total submissions`
              : context.isAuthenticated
                ? "Triage telemetry not available yet"
                : "Sign in to load triage telemetry",
          tone: (triage?.new || 0) > 0 ? "warning" : "success",
        },
        {
          id: "triage-analyzed",
          label: "Analyzed",
          value: kpiCountValue(triage?.analyzed),
          sublabel: "AI assessment complete",
          tone: (triage?.analyzed || 0) > 0 ? "info" : "default",
        },
        {
          id: "triage-converted",
          label: "Converted",
          value: kpiCountValue(triage?.converted),
          sublabel: "Created jobs",
          tone: (triage?.converted || 0) > 0 ? "success" : "default",
        },
        {
          id: "triage-archived",
          label: "Archived",
          value: kpiCountValue(triage?.archived),
          sublabel: "Deferred leads",
          tone: (triage?.archived || 0) > 0 ? "default" : "default",
        },
      ],
      series: chartSeriesForTriage,
      diagram: {
        id: "triage-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "new", label: "New", value: formatCount(triage?.new), tone: "warning" },
          { id: "analyzed", label: "Analyzed", value: formatCount(triage?.analyzed), tone: "info" },
          { id: "converted", label: "Converted", value: formatCount(triage?.converted), tone: "success" },
          { id: "archived", label: "Archived", value: formatCount(triage?.archived), tone: "default" },
        ],
      },
    };
  }

  if (normalized === "/dashboard/fleet") {
    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: profile.sourceLabel || "Supabase fleet snapshot",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "fleet-techs",
          label: "Technicians",
          value: kpiCountValue(team?.technicians),
          sublabel: "Rostered technicians",
          tone: (team?.technicians || 0) > 0 ? "info" : "default",
        },
        {
          id: "fleet-open",
          label: "Open Jobs",
          value: kpiCountValue(openJobs),
          sublabel: "Pending + in-flight",
          tone: (openJobs || 0) > 0 ? "warning" : "success",
        },
        {
          id: "fleet-enroute",
          label: "En Route",
          value: kpiCountValue(jobs?.enRoute),
          sublabel: "Driving to site",
          tone: (jobs?.enRoute || 0) > 0 ? "info" : "default",
        },
        {
          id: "fleet-onsite",
          label: "On Site",
          value: kpiCountValue(jobs?.onSite),
          sublabel: "Working now",
          tone: (jobs?.onSite || 0) > 0 ? "info" : "default",
        },
      ],
      series: chartSeriesForJobs,
      diagram: {
        id: "fleet-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "unassigned", label: "Unassigned", value: formatCount(jobs?.unassigned), tone: "warning" },
          { id: "assigned", label: "Assigned", value: formatCount(jobs?.assigned), tone: "info" },
          { id: "inflight", label: "In Flight", value: formatCount(openJobs), tone: "info" },
          { id: "done", label: "Completed", value: formatCount(jobs?.completed), tone: "success" },
        ],
      },
    };
  }

  if (normalized === "/dashboard/jobs") {
    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: profile.sourceLabel || "Supabase job telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "jobs-open",
          label: "Open Jobs",
          value: kpiCountValue(openJobs),
          sublabel: jobs?.total != null ? `${formatCount(jobs.total)} total jobs` : "Jobs workspace",
          tone: (openJobs || 0) > 0 ? "warning" : "success",
        },
        {
          id: "jobs-pending",
          label: "Pending",
          value: kpiCountValue(jobs?.pending),
          sublabel: "Awaiting dispatch",
          tone: (jobs?.pending || 0) > 0 ? "warning" : "default",
        },
        {
          id: "jobs-today",
          label: "Scheduled Today",
          value: kpiCountValue(jobs?.scheduledToday),
          sublabel: "Scheduled start window",
          tone: (jobs?.scheduledToday || 0) > 6 ? "warning" : "default",
        },
        {
          id: "jobs-completed",
          label: "Completed",
          value: kpiCountValue(jobs?.completed),
          sublabel: "All-time completed",
          tone: (jobs?.completed || 0) > 0 ? "success" : "default",
        },
      ],
      series: chartSeriesForJobs,
      diagram: {
        id: "jobs-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "queued", label: "Queued", value: formatCount(jobs?.pending), tone: "warning" },
          { id: "en-route", label: "En Route", value: formatCount(jobs?.enRoute), tone: "info" },
          { id: "on-site", label: "On Site", value: formatCount(jobs?.onSite), tone: "info" },
          { id: "done", label: "Completed", value: formatCount(jobs?.completed), tone: "success" },
        ],
      },
    };
  }

  if (normalized === "/dashboard/clients") {
    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: profile.sourceLabel || "Supabase client telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "clients-total",
          label: "Clients",
          value: kpiCountValue(clients?.total),
          sublabel: context.companyName || "Client portfolio",
          tone: (clients?.total || 0) > 0 ? "info" : "default",
        },
        {
          id: "clients-open-jobs",
          label: "Open Jobs",
          value: kpiCountValue(openJobs),
          sublabel: "Service workload",
          tone: (openJobs || 0) > 0 ? "warning" : "success",
        },
        {
          id: "clients-triage",
          label: "New Leads",
          value: kpiCountValue(triage?.new),
          sublabel: "Inbound triage",
          tone: (triage?.new || 0) > 0 ? "warning" : "default",
        },
        {
          id: "clients-techs",
          label: "Technicians",
          value: kpiCountValue(team?.technicians),
          sublabel: "Available team",
          tone: (team?.technicians || 0) > 0 ? "info" : "default",
        },
      ],
      series: chartSeriesForClients,
      diagram: {
        id: "clients-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          { id: "clients", label: "Clients", value: formatCount(clients?.total), tone: "info" },
          { id: "jobs", label: "Open Jobs", value: formatCount(openJobs), tone: "warning" },
          { id: "triage", label: "New Leads", value: formatCount(triage?.new), tone: "info" },
          { id: "team", label: "Techs", value: formatCount(team?.technicians), tone: "info" },
        ],
      },
    };
  }

  // Default executive ops model keeps calculation-led KPIs for the main dashboard and
  // any operations route without a specialized telemetry storyboard yet.
  if (!context.isAuthenticated) {
    const renderMs = roundNumber(context.routeRenderMs || null);
    const nav = context.navigation;
    const ttfb = roundNumber(nav?.ttfbMs ?? null);
    const dom = roundNumber(nav?.domInteractiveMs ?? null);

    return {
      id: "ops-monitor",
      title: profile.title,
      subtitle: profile.subtitle,
      state,
      sourceLabel: "Runtime UI telemetry",
      updatedAt,
      presentation,
      kpis: [
        {
          id: "session",
          label: "Session",
          value: "Guest",
          sublabel: "Sign in to unlock operations telemetry",
          tone: "info",
        },
        {
          id: "render-latency",
          label: "Route Render",
          value: renderMs != null ? `${renderMs} ms` : "--",
          sublabel: "Measured in-session",
        },
        {
          id: "ttfb",
          label: "TTFB",
          value: ttfb != null ? `${ttfb} ms` : "--",
          sublabel: "Current browser measurement",
        },
        {
          id: "dom-ready",
          label: "DOM Interactive",
          value: dom != null ? `${dom} ms` : "--",
          sublabel: formatRouteName(context.pathname),
        },
      ],
      series: runtimeFallbackSeries,
      diagram: {
        id: "ops-context",
        title: profile.diagramTitle,
        description: profile.diagramDescription,
        nodes: [
          {
            id: "workspace",
            label: "Workspace",
            value: formatRouteName(context.pathname),
            tone: "info",
          },
          {
            id: "role",
            label: "Role",
            value: context.role || "guest",
          },
          {
            id: "path",
            label: "Path",
            value: context.pathname,
          },
          {
            id: "monitor",
            label: "Monitor",
            value: "Active",
            tone: "success",
          },
        ],
      },
    };
  }

  const series = buildRecentCalculationSeries(calculations, 7, {
    title: profile.chartTitle,
    description: profile.chartDescription,
  });
  const monthly = stats?.monthlyCalculations || 0;
  const total = stats?.totalCalculations || calculations.length;
  const remaining = stats?.isUnlimited ? "Unlimited" : stats?.remaining ?? "--";
  const kpiLabels = buildOpsKpiLabels(context.pathname);

  return {
    id: "ops-monitor",
    title: profile.title,
    subtitle: profile.subtitle,
    state,
    sourceLabel: profile.sourceLabel || "Supabase operations telemetry",
    updatedAt,
    presentation,
    kpis: withKpiLabels(
      [
        {
          id: "monthly-runs",
          label: "This Month",
          value: monthly,
          sublabel: `${total} total saved runs`,
        },
        {
          id: "remaining-limit",
          label: "Plan Capacity",
          value: remaining,
          sublabel: stats?.planDisplayName || "Plan unavailable",
        },
        {
          id: "revenue-risk",
          label: "Revenue At Risk",
          value: `$${Math.round(revenue?.revenueAtRisk || 0).toLocaleString()}`,
          sublabel: `${revenue?.unpaidCount || 0} unpaid invoices`,
          tone: revenue?.revenueAtRisk ? "warning" : "default",
        },
        {
          id: "lead-conversion",
          label: "Lead Conversion",
          value: `${pipeline?.conversionRate || 0}%`,
          sublabel: `${pipeline?.activeLeads || 0} active leads`,
          tone: toneFromTrend((pipeline?.conversionRate || 0) - 50),
        },
      ],
      kpiLabels,
    ),
    series,
    diagram: {
      id: "ops-context",
      title: profile.diagramTitle,
      description: profile.diagramDescription,
      nodes: [
        {
          id: "company",
          label: "Company",
          value: context.companyName || "Not selected",
          tone: context.companyName ? "success" : "warning",
        },
        {
          id: "role",
          label: "Role",
          value: context.role || "unknown",
        },
        {
          id: "workspace",
          label: "Workspace",
          value: formatRouteName(context.pathname),
        },
        {
          id: "cycle-reset",
          label: "Reset",
          value: stats?.billingCycleResetLabel || "n/a",
        },
      ],
    },
  };
}

function buildToolsModel(context: MonitorBuildContext): MonitorPageModel {
  const profile = resolveStoryboardProfile(
    context.pathname,
    toolsStoryboardProfiles,
    defaultToolsStoryboardProfile,
  );
  const presentation = resolveMonitorPresentation(context.pathname);
  const calculations = context.calculations || [];
  const toolFamily = getToolFamily(context.pathname);
  const toolCalcKey = resolveToolCalculationKey(context.pathname);
  const hasCalcTelemetry = context.isAuthenticated;
  const filteredCalculations = hasCalcTelemetry
    ? toolCalcKey
      ? calculations.filter((calc) =>
          normalizeKey(calc.calculation_type || "").includes(toolCalcKey),
        )
      : calculations
    : [];

  const runtimeFallbackSeries = buildNavigationSeries(context.navigation, {
    title: `${profile.chartTitle} (Runtime)`,
    description: "Fallback: browser timings until saved-run telemetry is available",
    unit: "ms",
  });

  const series = hasCalcTelemetry
    ? buildRecentCalculationSeries(filteredCalculations, 7, {
        title: profile.chartTitle,
        description: profile.chartDescription,
      })
    : runtimeFallbackSeries;

  const latest = filteredCalculations[0];
  const now = context.now;
  const monthly = hasCalcTelemetry
    ? filteredCalculations.filter((calc) => {
        const date = new Date(calc.created_at);
        return (
          date.getFullYear() === now.getFullYear() && date.getMonth() === now.getMonth()
        );
      }).length
    : null;
  const total = hasCalcTelemetry ? filteredCalculations.length : null;
  const state = context.isLoading ? "loading" : "ready";
  const kpiLabels = buildToolsKpiLabels(context.pathname);

  return {
    id: "tools-monitor",
    title: profile.title,
    subtitle: profile.subtitle,
    state,
    sourceLabel: profile.sourceLabel || (hasCalcTelemetry ? "Calculation history + runtime telemetry" : "Runtime UI telemetry"),
    updatedAt: latest?.created_at || context.now.toISOString(),
    presentation,
    emptyMessage:
      profile.emptyMessage ||
      "No saved tool runs yet. Execute a tool and save the output to unlock trends.",
    kpis: withKpiLabels(
      [
        {
          id: "tool-runs-total",
          label: "Saved Runs",
          value: total == null ? "--" : total,
          sublabel:
            monthly == null
              ? "Sign in to load saved runs"
              : `${monthly} this month`,
          tone: total != null && total > 0 ? "success" : "default",
        },
        {
          id: "tool-family",
          label: "Tool Family",
          value: toolFamily,
          sublabel: "Current route context",
        },
        {
          id: "tool-latest",
          label: "Latest Run",
          value: latest ? new Date(latest.created_at).toLocaleDateString() : "--",
          sublabel:
            latest?.calculation_type ||
            (hasCalcTelemetry ? "No saved run yet" : "Authentication required"),
          tone: latest ? "info" : "default",
        },
        {
          id: "tool-role",
          label: "Operator Role",
          value: context.role || "guest",
          sublabel: context.companyName || "No company context",
        },
      ],
      kpiLabels,
    ),
    series,
    diagram: {
      id: "tools-context",
      title: profile.diagramTitle,
      description: profile.diagramDescription,
      nodes: [
        {
          id: "data-policy",
          label: "Data Policy",
          value: "Real data only",
          tone: "success",
        },
        {
          id: "source",
          label: "Primary Source",
          value: "Supabase calculations",
        },
        {
          id: "path",
          label: "Path",
          value: context.pathname,
        },
      ],
    },
  };
}

function buildPublicModel(context: MonitorBuildContext): MonitorPageModel {
  const profile = resolveStoryboardProfile(
    context.pathname,
    publicStoryboardProfiles,
    defaultPublicStoryboardProfile,
  );
  const presentation = resolveMonitorPresentation(context.pathname);
  const nav = context.navigation;
  const series = buildNavigationSeries(nav, {
    title: profile.chartTitle,
    description: profile.chartDescription,
  });
  const ttfb = roundNumber(nav?.ttfbMs);
  const dom = roundNumber(nav?.domInteractiveMs);
  const load = roundNumber(nav?.loadEventMs);
  const hasPerfData = [ttfb, dom, load].some((value) => value != null && value > 0);
  const kpiLabels = buildPublicKpiLabels(context.pathname);

  return {
    id: "public-monitor",
    title: profile.title,
    subtitle: profile.subtitle,
    state: context.isLoading ? "loading" : hasPerfData ? "ready" : "empty",
    sourceLabel: profile.sourceLabel || metrics.meta.asOfLabel,
    updatedAt: context.now.toISOString(),
    presentation,
    emptyMessage:
      profile.emptyMessage ||
      "Runtime timings are not available yet. Refresh and interact with the page to populate metrics.",
    kpis: withKpiLabels(
      [
        {
          id: "users",
          label: "User Base",
          value: metrics.users.totalEngineers,
          sublabel: metrics.users.description,
        },
        {
          id: "ttfb",
          label: "TTFB",
          value: ttfb != null ? `${ttfb} ms` : "n/a",
          sublabel: "Current browser measurement",
        },
        {
          id: "dom-ready",
          label: "DOM Interactive",
          value: dom != null ? `${dom} ms` : "n/a",
          sublabel: "Current browser measurement",
        },
        {
          id: "load-event",
          label: "Load Complete",
          value: load != null ? `${load} ms` : "n/a",
          sublabel: formatRouteName(context.pathname),
        },
      ],
      kpiLabels,
    ),
    series,
    diagram: getCertDiagram(profile.diagramTitle, profile.diagramDescription),
  };
}

function buildAuthModel(context: MonitorBuildContext): MonitorPageModel {
  const profile = resolveStoryboardProfile(
    context.pathname,
    authStoryboardProfiles,
    defaultAuthStoryboardProfile,
  );
  const presentation = resolveMonitorPresentation(context.pathname);
  const series = buildNavigationSeries(context.navigation, {
    title: profile.chartTitle,
    description: profile.chartDescription,
  });
  const renderMs = roundNumber(context.routeRenderMs || null);
  const kpiLabels = buildAuthKpiLabels(context.pathname);

  return {
    id: "auth-monitor",
    title: profile.title,
    subtitle: profile.subtitle,
    state: context.isLoading ? "loading" : "ready",
    sourceLabel: profile.sourceLabel || "Runtime UI telemetry",
    updatedAt: context.now.toISOString(),
    presentation,
    kpis: withKpiLabels(
      [
        {
          id: "session",
          label: "Session",
          value: context.isAuthenticated ? "Active" : "Guest",
          sublabel: "Resolved from auth context",
          tone: context.isAuthenticated ? "success" : "info",
        },
        {
          id: "role",
          label: "Role",
          value: context.role || "not assigned",
          sublabel: "Current app role",
        },
        {
          id: "render-latency",
          label: "Route Render",
          value: renderMs != null ? `${renderMs} ms` : "n/a",
          sublabel: "Measured in-session",
        },
        {
          id: "route",
          label: "Route",
          value: context.pathname,
          sublabel: formatRouteName(context.pathname),
        },
      ],
      kpiLabels,
    ),
    series,
    diagram: {
      id: "auth-context",
      title: profile.diagramTitle,
      description: profile.diagramDescription,
      nodes: [
        {
          id: "company",
          label: "Company Context",
          value: context.companyName || "none",
          tone: context.companyName ? "success" : "warning",
        },
        {
          id: "role",
          label: "Role Context",
          value: context.role || "none",
        },
        {
          id: "source",
          label: "Source",
          value: "Auth + route runtime",
        },
      ],
    },
  };
}

function buildDebugModel(context: MonitorBuildContext): MonitorPageModel {
  const profile = resolveStoryboardProfile(
    context.pathname,
    debugStoryboardProfiles,
    defaultDebugStoryboardProfile,
  );
  const presentation = resolveMonitorPresentation(context.pathname);
  const series = buildNavigationSeries(context.navigation, {
    title: profile.chartTitle,
    description: profile.chartDescription,
  });
  const renderMs = roundNumber(context.routeRenderMs || null);
  const kpiLabels = buildDebugKpiLabels(context.pathname);

  return {
    id: "debug-monitor",
    title: profile.title,
    subtitle: profile.subtitle,
    state: context.isLoading ? "loading" : "ready",
    sourceLabel: profile.sourceLabel || "Runtime diagnostics telemetry",
    updatedAt: context.now.toISOString(),
    presentation,
    kpis: withKpiLabels(
      [
        {
          id: "route",
          label: "Debug Route",
          value: context.pathname,
          sublabel: formatRouteName(context.pathname),
        },
        {
          id: "render-latency",
          label: "Route Render",
          value: renderMs != null ? `${renderMs} ms` : "n/a",
          sublabel: "Measured in-session",
        },
        {
          id: "session",
          label: "Session",
          value: context.isAuthenticated ? "Authenticated" : "Guest",
          tone: context.isAuthenticated ? "success" : "warning",
        },
        {
          id: "role",
          label: "Role",
          value: context.role || "n/a",
        },
      ],
      kpiLabels,
    ),
    series,
    diagram: {
      id: "debug-context",
      title: profile.diagramTitle,
      description: profile.diagramDescription,
      nodes: [
        {
          id: "surface",
          label: "Surface",
          value: formatRouteName(context.pathname),
        },
        {
          id: "auth",
          label: "Auth State",
          value: context.isAuthenticated ? "Authenticated" : "Public",
        },
        {
          id: "captured",
          label: "Captured",
          value: context.now.toLocaleTimeString(),
        },
      ],
    },
  };
}

function buildFallbackModel(context: MonitorBuildContext): MonitorPageModel {
  const presentation = resolveMonitorPresentation(context.pathname);
  return {
    id: "fallback-monitor",
    title: "System Monitor",
    subtitle: "Route-level fallback instrumentation",
    state: context.isLoading ? "loading" : "ready",
    sourceLabel: "Runtime route observer",
    updatedAt: context.now.toISOString(),
    presentation,
    kpis: [
      {
        id: "route",
        label: "Route",
        value: context.pathname,
      },
      {
        id: "auth",
        label: "Auth State",
        value: context.isAuthenticated ? "Authenticated" : "Public",
      },
      {
        id: "role",
        label: "Role",
        value: context.role || "n/a",
      },
    ],
    series: buildNavigationSeries(context.navigation),
    diagram: {
      id: "fallback-context",
      title: "Fallback Context",
      nodes: [
        {
          id: "route-name",
          label: "Surface",
          value: formatRouteName(context.pathname),
        },
        {
          id: "time",
          label: "Captured",
          value: context.now.toLocaleTimeString(),
        },
      ],
    },
  };
}

export function getNavigationTimingSnapshot(): NavigationTimingSnapshot {
  if (typeof performance === "undefined") {
    return { ttfbMs: null, domInteractiveMs: null, loadEventMs: null };
  }

  const navigationEntry = performance
    .getEntriesByType("navigation")
    .find(Boolean) as PerformanceNavigationTiming | undefined;

  if (!navigationEntry) {
    return { ttfbMs: null, domInteractiveMs: null, loadEventMs: null };
  }

  return {
    ttfbMs: roundNumber(navigationEntry.responseStart),
    domInteractiveMs: roundNumber(navigationEntry.domInteractive),
    loadEventMs: roundNumber(navigationEntry.loadEventEnd),
  };
}

const routePresentationOverrides: Record<string, Partial<MonitorPresentation>> = {
  "/dashboard": {
    template: "executive",
    accent: "cyan",
    pattern: "grid",
    icon: "gauge",
    signatureLabel: "Executive Operations",
    modeLabel: "SYSTEM",
    defaultExpanded: false,
  },
  "/dashboard/dispatch": {
    template: "pipeline",
    accent: "amber",
    pattern: "pipeline",
    icon: "route",
    signatureLabel: "Dispatch Command",
    modeLabel: "WORK",
  },
  "/dashboard/triage": {
    template: "pipeline",
    accent: "violet",
    pattern: "pipeline",
    icon: "siren",
    signatureLabel: "Triage Command",
    modeLabel: "WORK",
  },
  "/dashboard/jobs": {
    template: "pipeline",
    accent: "blue",
    pattern: "pipeline",
    icon: "briefcase",
    signatureLabel: "Jobs Console",
    modeLabel: "WORK",
  },
  "/dashboard/clients": {
    template: "network",
    accent: "emerald",
    pattern: "circuit",
    icon: "users",
    signatureLabel: "Client Network",
    modeLabel: "WORK",
  },
  "/dashboard/fleet": {
    template: "network",
    accent: "cyan",
    pattern: "circuit",
    icon: "truck",
    signatureLabel: "Fleet Telemetry",
    modeLabel: "WORK",
  },
  "/dashboard/projects": {
    template: "network",
    accent: "orange",
    pattern: "circuit",
    icon: "layers",
    signatureLabel: "Projects Atlas",
    modeLabel: "WORK",
  },
  "/portal": {
    template: "network",
    accent: "emerald",
    pattern: "grid",
    icon: "shieldCheck",
    signatureLabel: "Client Portal",
    modeLabel: "WORK",
  },
  "/tech": {
    template: "pipeline",
    accent: "amber",
    pattern: "grid",
    icon: "hardHat",
    signatureLabel: "Field Command",
    modeLabel: "WORK",
  },
  "/track-job/:id": {
    template: "pipeline",
    accent: "cyan",
    pattern: "radar",
    icon: "mapPin",
    signatureLabel: "Job Tracker",
    modeLabel: "WORK",
  },
  "/settings/company": {
    template: "executive",
    accent: "slate",
    pattern: "grid",
    icon: "settings",
    signatureLabel: "Company Settings",
    modeLabel: "SYSTEM",
  },
  "/settings/team": {
    template: "executive",
    accent: "slate",
    pattern: "grid",
    icon: "settings",
    signatureLabel: "Team Settings",
    modeLabel: "SYSTEM",
  },
};

function resolvePresentationDefaults(
  pathname: string,
  entryId: MonitorRouteEntry["id"],
): MonitorPresentation {
  const normalized = normalizeMonitorPath(pathname);
  const fallbackSurface = resolveRouteSurface(pathname);

  let template: MonitorLayoutTemplate = "executive";
  let accent: MonitorAccent = "slate";
  let pattern: MonitorPattern = "grid";
  let icon: MonitorIconKey = "activity";
  let modeLabel = "SYSTEM";
  let signatureLabel = fallbackSurface;
  const defaultExpanded = false;

  if (entryId === "operations") {
    template = "pipeline";
    accent = "cyan";
    pattern = "grid";
    icon = "activity";
    modeLabel = "WORK";
    signatureLabel = `${resolveRouteSurfaceWithOverrides(pathname, opsKpiSurfaceOverrides)} Console`;
  } else if (entryId === "tools-engineering") {
    template = "tool";
    accent = "violet";
    pattern = "circuit";
    icon = "sparkles";
    modeLabel = "TOOLS";
    signatureLabel = `${resolveRouteSurfaceWithOverrides(pathname, toolsKpiSurfaceOverrides)} Module`;
  } else if (entryId === "public-content") {
    template = "public";
    accent = "blue";
    pattern = "constellation";
    icon = "sparkles";
    modeLabel = "PUBLIC";
    signatureLabel = `${resolveRouteSurfaceWithOverrides(pathname, publicKpiSurfaceOverrides)} Brief`;
  } else if (entryId === "auth-onboarding") {
    template = "auth";
    accent = "slate";
    pattern = "radar";
    icon = "shieldCheck";
    modeLabel = "AUTH";
    signatureLabel = `${resolveRouteSurfaceWithOverrides(pathname, authKpiSurfaceOverrides)} Access`;
  } else if (entryId === "debug-system") {
    template = "executive";
    accent = "orange";
    pattern = "grid";
    icon = "activity";
    modeLabel = "DEBUG";
    signatureLabel = `${resolveRouteSurfaceWithOverrides(pathname, debugKpiSurfaceOverrides)} Sandbox`;
  } else {
    signatureLabel = normalized === "/" ? "Landing Brief" : `${fallbackSurface} Monitor`;
  }

  return {
    template,
    accent,
    pattern,
    icon,
    modeLabel,
    signatureLabel,
    defaultExpanded,
  };
}

export function resolveMonitorPresentation(pathname: string): MonitorPresentation {
  const entry = resolveMonitorRouteEntry(pathname);
  const defaults = resolvePresentationDefaults(pathname, entry.id);
  const overrides = routePresentationOverrides[normalizeMonitorPath(pathname)];
  return {
    ...defaults,
    ...(overrides || {}),
    signatureLabel: overrides?.signatureLabel ?? defaults.signatureLabel,
    modeLabel: overrides?.modeLabel ?? defaults.modeLabel,
    template: (overrides?.template as MonitorLayoutTemplate) ?? defaults.template,
    accent: (overrides?.accent as MonitorAccent) ?? defaults.accent,
    pattern: (overrides?.pattern as MonitorPattern) ?? defaults.pattern,
    icon: (overrides?.icon as MonitorIconKey) ?? defaults.icon,
    defaultExpanded: overrides?.defaultExpanded ?? defaults.defaultExpanded,
  };
}

export const monitorRouteRegistry: MonitorRouteEntry[] = [
  {
    id: "auth-onboarding",
    label: "Auth and Onboarding",
    pattern:
      /^\/(signin|signup|select-company|join-company|create-company|invite-team|invite\/.*|callback\/.*)$/i,
    build: buildAuthModel,
  },
  {
    id: "operations",
    label: "Operations and Role Workspaces",
    pattern:
      /^\/(dashboard(?:\/.*)?|portal|tech(?:\/.*)?|track-job(?:\/.*)?|history|profile|settings(?:\/.*)?|career)$/i,
    build: buildOpsModel,
  },
  {
    id: "tools-engineering",
    label: "Tools and Engineering",
    pattern:
      /^\/(tools(?:\/.*)?|troubleshooting|diy-calculators|advanced-reporting|estimate-builder|ai\/pattern-insights)$/i,
    build: buildToolsModel,
  },
  {
    id: "public-content",
    label: "Public, Marketing, and Content",
    pattern:
      /^\/($|triage|a2l-resources|features|pricing|about|blog(?:\/.*)?|stories|podcasts|contact|documentation|help(?:-center)?|privacy|terms|connect-provider)$/i,
    build: buildPublicModel,
  },
  {
    id: "debug-system",
    label: "Debug and Sandbox",
    pattern: /^\/(stripe-debug|agent-sandbox)$/i,
    build: buildDebugModel,
  },
  {
    id: "fallback",
    label: "System Fallback",
    pattern: /.*/,
    build: buildFallbackModel,
  },
];

export function resolveMonitorRouteEntry(pathname: string): MonitorRouteEntry {
  const entry =
    monitorRouteRegistry.find((entry) => entry.pattern.test(pathname)) ||
    monitorRouteRegistry[monitorRouteRegistry.length - 1];
  if (!entry) {
    throw new Error("No monitor route entry found for pathname: " + pathname);
  }
  return entry;
}

export function buildMonitorModel(
  pathname: string,
  context: Omit<MonitorBuildContext, "pathname">,
): MonitorPageModel {
  const entry = resolveMonitorRouteEntry(pathname);
  return entry.build({ ...context, pathname });
}
