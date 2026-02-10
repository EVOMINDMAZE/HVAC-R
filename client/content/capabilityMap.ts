export type AudienceSegment =
  | "owner_manager"
  | "contractor_lead_tech"
  | "entrepreneur";

export type ToolCategoryId =
  | "work_operations"
  | "field_diagnostics"
  | "engineering"
  | "compliance"
  | "client_experience";

export interface ToolCategory {
  id: ToolCategoryId;
  title: string;
  outcomeLine: string;
  previewCount: number;
  heroTools: readonly string[];
}

export interface ToolCapability {
  name: string;
  shortName: string;
  route: string;
  category: ToolCategoryId;
  audience: readonly AudienceSegment[];
  outcomeTag: string;
}

export interface PersonaFocus {
  id: AudienceSegment;
  label: string;
  focus: string;
  highlightedCategories: readonly ToolCategoryId[];
  highlightedTools: readonly string[];
}

export interface ToolCategoryWithTools extends ToolCategory {
  tools: readonly ToolCapability[];
  heroToolsMeta: readonly ToolCapability[];
}

export const toolCategories: readonly ToolCategory[] = [
  {
    id: "work_operations",
    title: "Work Operations",
    outcomeLine:
      "Schedule, assign, execute, and close jobs with full client context.",
    previewCount: 5,
    heroTools: ["/dashboard/dispatch", "/dashboard/jobs", "/dashboard/clients"],
  },
  {
    id: "field_diagnostics",
    title: "Field + Diagnostics",
    outcomeLine:
      "Guide technicians from symptom capture to documented resolution.",
    previewCount: 4,
    heroTools: ["/tech", "/troubleshooting", "/ai/pattern-insights"],
  },
  {
    id: "engineering",
    title: "Engineering",
    outcomeLine:
      "Model cycle performance and compare refrigerant decisions confidently.",
    previewCount: 3,
    heroTools: [
      "/tools/standard-cycle",
      "/tools/refrigerant-comparison",
      "/tools/cascade-cycle",
    ],
  },
  {
    id: "compliance",
    title: "Compliance",
    outcomeLine:
      "Track refrigerant activity and generate audit-ready reporting artifacts.",
    previewCount: 3,
    heroTools: [
      "/tools/refrigerant-inventory",
      "/tools/leak-rate-calculator",
      "/tools/refrigerant-report",
    ],
  },
  {
    id: "client_experience",
    title: "Client Experience",
    outcomeLine:
      "Give customers transparent intake, tracking, and status visibility.",
    previewCount: 3,
    heroTools: ["/portal", "/track-job/:id", "/triage"],
  },
] as const;

export const toolCapabilities: readonly ToolCapability[] = [
  {
    name: "Operations Dashboard",
    shortName: "Dashboard",
    route: "/dashboard",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "operations_visibility",
  },
  {
    name: "Dispatch Board",
    shortName: "Dispatch",
    route: "/dashboard/dispatch",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "job_routing",
  },
  {
    name: "Triage Dashboard",
    shortName: "Triage",
    route: "/dashboard/triage",
    category: "work_operations",
    audience: ["owner_manager"],
    outcomeTag: "lead_qualification",
  },
  {
    name: "Jobs Board",
    shortName: "Jobs",
    route: "/dashboard/jobs",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "execution_tracking",
  },
  {
    name: "Job Detail Workspace",
    shortName: "Job Detail",
    route: "/dashboard/jobs/:id",
    category: "work_operations",
    audience: ["owner_manager", "contractor_lead_tech"],
    outcomeTag: "job_control",
  },
  {
    name: "Client Records",
    shortName: "Clients",
    route: "/dashboard/clients",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "client_management",
  },
  {
    name: "Projects Workspace",
    shortName: "Projects",
    route: "/dashboard/projects",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "project_planning",
  },
  {
    name: "Fleet Dashboard",
    shortName: "Fleet",
    route: "/dashboard/fleet",
    category: "work_operations",
    audience: ["owner_manager"],
    outcomeTag: "fleet_visibility",
  },
  {
    name: "Calculation History",
    shortName: "History",
    route: "/history",
    category: "work_operations",
    audience: ["owner_manager", "contractor_lead_tech", "entrepreneur"],
    outcomeTag: "records_reuse",
  },
  {
    name: "Estimate Builder",
    shortName: "Estimate",
    route: "/estimate-builder",
    category: "work_operations",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "quote_speed",
  },
  {
    name: "Field Jobs Board",
    shortName: "Field Jobs",
    route: "/tech",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "field_queue",
  },
  {
    name: "Active Job Workspace",
    shortName: "Active Job",
    route: "/tech/jobs/:id",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "field_execution",
  },
  {
    name: "Troubleshooting Assistant",
    shortName: "Troubleshoot",
    route: "/troubleshooting",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "diagnostic_guidance",
  },
  {
    name: "Pattern Insights",
    shortName: "Pattern AI",
    route: "/ai/pattern-insights",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "recurring_failures",
  },
  {
    name: "IAQ Wizard",
    shortName: "IAQ Wizard",
    route: "/tools/iaq-wizard",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "iaq_assessment",
  },
  {
    name: "Warranty Scanner",
    shortName: "Warranty",
    route: "/tools/warranty-scanner",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "owner_manager"],
    outcomeTag: "warranty_lookup",
  },
  {
    name: "DIY Calculator Suite",
    shortName: "DIY Calcs",
    route: "/diy-calculators",
    category: "field_diagnostics",
    audience: ["contractor_lead_tech", "entrepreneur"],
    outcomeTag: "quick_field_math",
  },
  {
    name: "Standard Cycle Analysis",
    shortName: "Standard Cycle",
    route: "/tools/standard-cycle",
    category: "engineering",
    audience: ["contractor_lead_tech", "entrepreneur", "owner_manager"],
    outcomeTag: "cycle_modeling",
  },
  {
    name: "Refrigerant Comparison",
    shortName: "Ref Compare",
    route: "/tools/refrigerant-comparison",
    category: "engineering",
    audience: ["contractor_lead_tech", "entrepreneur", "owner_manager"],
    outcomeTag: "refrigerant_tradeoffs",
  },
  {
    name: "Cascade Cycle Analysis",
    shortName: "Cascade Cycle",
    route: "/tools/cascade-cycle",
    category: "engineering",
    audience: ["contractor_lead_tech", "entrepreneur", "owner_manager"],
    outcomeTag: "low_temp_design",
  },
  {
    name: "Refrigerant Inventory",
    shortName: "Ref Inventory",
    route: "/tools/refrigerant-inventory",
    category: "compliance",
    audience: ["owner_manager", "contractor_lead_tech"],
    outcomeTag: "cylinder_tracking",
  },
  {
    name: "Leak Rate Calculator",
    shortName: "Leak Rate Calc",
    route: "/tools/leak-rate-calculator",
    category: "compliance",
    audience: ["owner_manager", "contractor_lead_tech"],
    outcomeTag: "leak_exposure",
  },
  {
    name: "Compliance Report",
    shortName: "Compliance Log",
    route: "/tools/refrigerant-report",
    category: "compliance",
    audience: ["owner_manager", "contractor_lead_tech"],
    outcomeTag: "audit_export",
  },
  {
    name: "Advanced Reporting",
    shortName: "Adv Reports",
    route: "/advanced-reporting",
    category: "compliance",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "pdf_csv_reporting",
  },
  {
    name: "Client Portal",
    shortName: "Client Portal",
    route: "/portal",
    category: "client_experience",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "client_visibility",
  },
  {
    name: "Track Job",
    shortName: "Track Job",
    route: "/track-job/:id",
    category: "client_experience",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "live_tracking",
  },
  {
    name: "Public Triage Intake",
    shortName: "Public Triage",
    route: "/triage",
    category: "client_experience",
    audience: ["owner_manager", "entrepreneur"],
    outcomeTag: "service_intake",
  },
] as const;

export const personaFocus: readonly PersonaFocus[] = [
  {
    id: "owner_manager",
    label: "Owner / Manager",
    focus: "Work Operations + Compliance",
    highlightedCategories: ["work_operations", "compliance"],
    highlightedTools: [
      "/dashboard/dispatch",
      "/dashboard/triage",
      "/dashboard/jobs",
      "/dashboard/clients",
      "/tools/refrigerant-inventory",
      "/tools/leak-rate-calculator",
      "/tools/refrigerant-report",
    ],
  },
  {
    id: "contractor_lead_tech",
    label: "Contractor / Lead Tech",
    focus: "Field + Diagnostics + Engineering",
    highlightedCategories: ["field_diagnostics", "engineering"],
    highlightedTools: [
      "/tech",
      "/tech/jobs/:id",
      "/troubleshooting",
      "/ai/pattern-insights",
      "/tools/iaq-wizard",
      "/tools/warranty-scanner",
      "/diy-calculators",
      "/tools/standard-cycle",
    ],
  },
  {
    id: "entrepreneur",
    label: "Entrepreneur / New Shop",
    focus: "Engineering + Work Operations",
    highlightedCategories: ["engineering", "work_operations"],
    highlightedTools: [
      "/tools/standard-cycle",
      "/tools/refrigerant-comparison",
      "/tools/cascade-cycle",
      "/estimate-builder",
      "/dashboard/dispatch",
    ],
  },
] as const;

export const capabilityInventory: readonly ToolCategoryWithTools[] =
  toolCategories.map((category) => ({
    ...category,
    tools: toolCapabilities.filter((tool) => tool.category === category.id),
    heroToolsMeta: category.heroTools
      .map((route) => toolCapabilities.find((tool) => tool.route === route))
      .filter((tool): tool is ToolCapability => Boolean(tool)),
  }));

export const totalCapabilityCount = toolCapabilities.length;
