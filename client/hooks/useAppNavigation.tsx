import {
  LayoutGrid,
  Radio,
  Zap,
  Briefcase,
  Users,
  Wrench,
  Archive,
  Scan,
  Hammer,
  History,
  Cpu,
  FileText,
  Newspaper,
  PlayCircle,
  Headphones,
  BookOpen,
  ExternalLink,
  Info,
  Wind,
  Building2,
  Brain,
  User,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useSupabaseAuth";

export interface NavItem {
  to: string;
  label: string;
  icon: any;
  desc?: string;
}

export interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
  visible: boolean;
}

export const CALCULATOR_DETAILS: Record<string, { desc: string }> = {
  "/tools/standard-cycle": { desc: "Model baseline HVAC&R performance" },
  "/tools/refrigerant-comparison": {
    desc: "Compare GWP, efficiency, and cost",
  },
  "/tools/cascade-cycle": { desc: "Optimize low-temperature systems" },
};

export function useAppNavigation() {
  const { role, isLoading, isAuthenticated } = useAuth();

  const effectiveRole = role || "admin";
  const isAdmin = effectiveRole === "admin" || effectiveRole === "owner";
  const isManager = effectiveRole === "manager";
  const isTech = effectiveRole === "tech" || effectiveRole === "technician";
  const isClient = effectiveRole === "client";

  const landingLinks: NavItem[] = [
    { to: "/features", label: "Features", icon: LayoutGrid },
    { to: "/pricing", label: "Pricing", icon: FileText },
    { to: "/about", label: "About", icon: Info },
    { to: "/help", label: "Help", icon: BookOpen },
    { to: "/contact", label: "Support", icon: ExternalLink },
  ];

  if (isLoading) {
    return {
      isAdmin: false,
      isManager: false,
      isTech: false,
      isClient: false,
      landingLinks,
      mainLinks: [{ to: "/dashboard", label: "Dashboard", icon: LayoutGrid }],
      groups: [] as NavGroup[],
      resources: {
        visible: true,
        groups: [],
      },
    };
  }

  const workItems: NavItem[] = isClient
    ? [
        { to: "/portal", label: "Client Home", icon: LayoutGrid },
        { to: "/dashboard/jobs", label: "My Jobs", icon: Briefcase },
        { to: "/triage", label: "Request Service", icon: Wrench },
      ]
    : [
        { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
        { to: "/dashboard/dispatch", label: "Dispatch", icon: Radio },
        { to: "/dashboard/triage", label: "Triage", icon: Zap },
        { to: "/dashboard/jobs", label: "Jobs", icon: Briefcase },
        { to: "/dashboard/clients", label: "Clients", icon: Users },
      ];

  const fieldItems: NavItem[] = [{ to: "/tech", label: "Field Jobs", icon: Briefcase }];

  const toolsItems: NavItem[] = [
    { to: "/troubleshooting", label: "Diagnostics", icon: Zap },
    { to: "/ai/pattern-insights", label: "Pattern Insights", icon: Brain },
    { to: "/tools/iaq-wizard", label: "IAQ Wizard", icon: Wind },
    { to: "/tools/warranty-scanner", label: "Warranty Scanner", icon: Scan },
    { to: "/diy-calculators", label: "DIY Calculators", icon: Hammer },
  ];

  const engineeringItems: NavItem[] = [
    {
      to: "/tools/standard-cycle",
      label: "Standard Cycle",
      icon: FileText,
      desc: CALCULATOR_DETAILS["/tools/standard-cycle"].desc,
    },
    {
      to: "/tools/refrigerant-comparison",
      label: "Refrigerant Comparison",
      icon: Zap,
      desc: CALCULATOR_DETAILS["/tools/refrigerant-comparison"].desc,
    },
    {
      to: "/tools/cascade-cycle",
      label: "Cascade Cycle",
      icon: Cpu,
      desc: CALCULATOR_DETAILS["/tools/cascade-cycle"].desc,
    },
  ];

  const complianceItems: NavItem[] = [
    { to: "/tools/refrigerant-inventory", label: "Refrigerant Inventory", icon: Archive },
    { to: "/tools/leak-rate-calculator", label: "Leak Rate Calculator", icon: ShieldCheck },
    { to: "/tools/refrigerant-report", label: "Compliance Report", icon: FileText },
  ];

  const accountItems: NavItem[] = [
    { to: "/history", label: "History", icon: History },
    { to: "/profile", label: "Profile", icon: User },
    ...(isAdmin || isManager
      ? [
          { to: "/settings/company", label: "Company Settings", icon: Building2 },
          { to: "/settings/team", label: "Team", icon: Users },
        ]
      : []),
  ];

  const groups: NavGroup[] = [
    {
      id: "work",
      label: "Work",
      items: workItems,
      visible: isAuthenticated,
    },
    {
      id: "field",
      label: "Field",
      items: fieldItems,
      visible: !isClient && (isAdmin || isManager || isTech),
    },
    {
      id: "tools",
      label: "Tools",
      items: toolsItems,
      visible: !isClient,
    },
    {
      id: "engineering",
      label: "Engineering",
      items: engineeringItems,
      visible: !isClient,
    },
    {
      id: "compliance",
      label: "Compliance",
      items: complianceItems,
      visible: !isClient,
    },
    {
      id: "account",
      label: "Account",
      items: accountItems,
      visible: isAuthenticated,
    },
  ];

  const resources = {
    visible: true,
    groups: [
      {
        label: "Content",
        items: [
          { to: "/blog", label: "Blog", icon: Newspaper, desc: "Industry news" },
          { to: "/stories", label: "Web Stories", icon: PlayCircle, desc: "Quick updates" },
          { to: "/podcasts", label: "Podcasts", icon: Headphones, desc: "Audio sessions" },
        ],
      },
      {
        label: "Support",
        items: [
          {
            to: "https://www.skool.com/hvac-r-business-owner-1296",
            label: "Community",
            icon: Users,
            desc: "Join business owners",
          },
          {
            to: "/documentation",
            label: "Documentation",
            icon: BookOpen,
            desc: "Guides and references",
          },
          { to: "/help", label: "Help Center", icon: ExternalLink, desc: "FAQs and support" },
          { to: "/about", label: "About", icon: Info, desc: "About ThermoNeural" },
        ],
      },
    ],
  };

  const mainLinks = groups
    .find((g) => g.id === "work")
    ?.items.slice(0, 3)
    .concat(groups.find((g) => g.id === "field")?.items ?? []) ?? [];

  return {
    isAdmin,
    isManager,
    isTech,
    isClient,
    landingLinks,
    mainLinks,
    groups,
    resources,
  };
}
