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