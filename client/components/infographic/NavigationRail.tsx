import { ArrowRight, Briefcase, Route, Siren, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface NavItem {
  id: string;
  label: string;
  description: string;
  count?: number | "--";
  to: string;
  badgeKey: string;
}

export interface NavigationRailProps {
  items: NavItem[];
  onNavigate?: (to: string) => void;
  className?: string;
}

const NAV_ICONS: Record<string, LucideIcon> = {
  dispatch: Route,
  triage: Siren,
  jobs: Briefcase,
  clients: Users,
};

function NavItemButton({ item, onNavigate }: { item: NavItem; onNavigate?: (to: string) => void }) {
  const Icon = NAV_ICONS[item.badgeKey] || Briefcase;

  return (
    <button
      type="button"
      className="nav-rail__item"
      onClick={() => onNavigate?.(item.to)}
      data-testid={`nav-item-${item.id}`}
    >
      <span className="nav-rail__badge">
        <Icon className="nav-rail__badge-icon" />
      </span>
      <div className="nav-rail__content">
        <span className="nav-rail__label">{item.label}</span>
        <span className="nav-rail__desc">{item.description}</span>
      </div>
      {item.count != null && (
        <span className="nav-rail__count">
          {item.count === "--" ? "--" : item.count}
        </span>
      )}
      <ArrowRight className="nav-rail__arrow w-4 h-4" />
    </button>
  );
}

export function NavigationRail({ items, onNavigate, className }: NavigationRailProps) {
  return (
    <nav className={cn("nav-rail", className)} data-testid="navigation-rail">
      <h3 className="nav-rail__header">Navigation</h3>
      <div className="nav-rail__list">
        {items.map((item) => (
          <NavItemButton key={item.id} item={item} onNavigate={onNavigate} />
        ))}
      </div>
    </nav>
  );
}

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