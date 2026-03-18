import { NavItem } from "./navigationRail.types";

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    id: "dispatch",
    label: "Dispatch Board",
    description: "Route active work",
    to: "/dashboard/dispatch",
    badgeKey: "dispatch",
  },
  {
    id: "triage",
    label: "Triage Board",
    description: "Convert requests",
    to: "/dashboard/triage",
    badgeKey: "triage",
  },
  {
    id: "jobs",
    label: "Jobs",
    description: "Track work",
    to: "/dashboard/jobs",
    badgeKey: "jobs",
  },
  {
    id: "clients",
    label: "Clients",
    description: "Manage accounts",
    to: "/dashboard/clients",
    badgeKey: "clients",
  },
];