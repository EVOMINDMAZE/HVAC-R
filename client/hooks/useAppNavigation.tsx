import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useSupabaseAuth";
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
} from "lucide-react";

// Types
export interface NavItem {
  to: string;
  label: string;
  icon: any;
  badge?: number;
  desc?: string;
  roleTag?: string; // 'O', 'T', 'C', 'O/T' for Admin visibility
}

export interface NavGroup {
  label: string;
  items: NavItem[];
  visible: boolean;
}

export const CALCULATOR_DETAILS: Record<string, { desc: string }> = {
  "/tools/standard-cycle": { desc: "Analyze thermodynamic cycles" },
  "/tools/refrigerant-comparison": { desc: "Compare GWP & performance" },
  "/tools/cascade-cycle": { desc: "Optimize low-temp systems" },
};

export function useAppNavigation() {
  const navigate = useNavigate();
  const { role } = useAuth();

  // Role-Based Operational Modes
  const isAdmin = role === "admin";
  const isOwner = isAdmin; // Clean up legacy student role
  const isManager = role === "manager";
  const isTech = role === "technician" || role === "tech"; // Handle both variations just in case
  const isClient = role === "client";

  // Visibility Flags
  const showDispatch = isOwner || isManager; // Managers can dispatch
  const showOffice = isOwner || isManager; // Managers need Office access (Clients/Jobs)
  const showToolbox = isOwner || isManager || isTech || isAdmin;
  const showCalculators = isOwner || isManager || isTech || isAdmin;
  const showTechWork = isTech || isAdmin || isManager; // Managers might need to see tech view? Or just Admin. keeping generic.
  const showClientMenu = isClient || isAdmin; // Admin sees Client view too

  // Mock Notification State
  const newJobsCount = 3;

  // 1. MAIN LINKS (Horizontal on Desktop, Top of List on Mobile)
  const mainLinks: NavItem[] = [];

  if (!isClient && !isTech) {
    // Techs have their own "My Jobs" board, they don't need the executive dashboard
    mainLinks.push({ to: "/dashboard", label: "Dashboard", icon: LayoutGrid });
  }

  if (showDispatch) {
    mainLinks.push({
      to: "/dashboard/dispatch",
      label: "Dispatch",
      icon: Radio,
      roleTag: isAdmin ? "O" : undefined,
    });
    mainLinks.push({
      to: "/dashboard/triage",
      label: "Triage",
      icon: Zap,
      roleTag: isAdmin ? "O" : undefined,
    });
  }

  if (showTechWork) {
    mainLinks.push({
      to: "/tech",
      label: "My Jobs",
      icon: Briefcase,
      badge: newJobsCount,
      roleTag: isAdmin ? "T" : undefined,
    });
  }

  if (showClientMenu && !isAdmin) {
    mainLinks.push({
      to: "/triage",
      label: "Request Service",
      icon: Wrench,
      roleTag: isAdmin ? "C" : undefined,
    });
    mainLinks.push({
      to: "/dashboard/jobs",
      label: "My Jobs",
      icon: Briefcase,
      roleTag: isAdmin ? "C" : undefined,
    });
  }

  // 2. TOOLBOX
  const toolboxItems = [
    { to: "/troubleshooting", label: "AI Troubleshooter", icon: Zap },
    {
      to: "/ai/pattern-insights",
      label: "Pattern Insights",
      icon: Brain,
      badge: "AI",
    },
    { to: "/tools/iaq-wizard", label: "Indoor Health", icon: Wind },
    { to: "/tools/refrigerant-inventory", label: "EPA Bank", icon: Archive },
    { to: "/tools/warranty-scanner", label: "Warranty Scanner", icon: Scan },
    { to: "/diy-calculators", label: "Builder Tools", icon: Hammer },
  ];

  // 3. CALCULATORS
  // Just the list items, structure handled by components
  const calculatorItems: NavItem[] = [
    {
      to: "/tools/standard-cycle",
      label: "Standard",
      icon: FileText,
      desc: CALCULATOR_DETAILS["/tools/standard-cycle"].desc,
    },
    {
      to: "/tools/refrigerant-comparison",
      label: "Comparison",
      icon: Zap,
      desc: CALCULATOR_DETAILS["/tools/refrigerant-comparison"].desc,
    },
    {
      to: "/tools/cascade-cycle",
      label: "Cascade",
      icon: FileText,
      desc: CALCULATOR_DETAILS["/tools/cascade-cycle"].desc,
    },
    {
      to: "/diy-calculators",
      label: "DIY Tools",
      icon: Cpu,
      desc: "Simple field calculators",
    },
  ];

  // 4. OFFICE
  const officeItems: NavItem[] = [
    { to: "/dashboard/clients", label: "Clients", icon: Users },
    {
      to: "/dashboard/jobs",
      label: "Jobs",
      icon: Briefcase,
      badge: newJobsCount,
    },
    { to: "/history", label: "History", icon: History },
  ];

  if (isAdmin) {
    officeItems.push({
      to: "/settings/company",
      label: "Company Settings",
      icon: Building2,
    });
  }

  // Team Management (Admins & Managers)
  if (isAdmin || isManager) {
    officeItems.push({ to: "/settings/team", label: "Team", icon: Users });
  }

  // 5. RESOURCES
  const resourcesGroups = [
    {
      label: "Content",
      items: [
        {
          to: "/blog",
          label: "Blog",
          icon: Newspaper,
          desc: "Industry news & insights",
        },
        {
          to: "/stories",
          label: "Web Stories",
          icon: PlayCircle,
          desc: "Visual bite-sized updates",
        },
        {
          to: "/podcasts",
          label: "Podcasts",
          icon: Headphones,
          desc: "Audio discussions",
        },
      ],
    },
    {
      label: "Support",
      items: [
        {
          to: "https://www.skool.com/hvac-r-business-owner-1296",
          label: "Community",
          icon: Users,
          desc: "Join other business owners",
        },
        {
          to: "/documentation",
          label: "Documentation",
          icon: BookOpen,
          desc: "Guides & references",
        },
        {
          to: "/help",
          label: "Help Center",
          icon: ExternalLink,
          desc: "FAQs & support",
        },
        {
          to: "/about",
          label: "About",
          icon: Info,
          desc: "About ThermoNeural",
        },
      ],
    },
  ];

  return {
    isAdmin, // Useful for conditional rendering of badges/tags
    mainLinks,
    toolbox: { items: toolboxItems, visible: showToolbox },
    calculators: { items: calculatorItems, visible: showCalculators },
    office: { items: officeItems, visible: showOffice },
    resources: { groups: resourcesGroups, visible: true },
  };
}
