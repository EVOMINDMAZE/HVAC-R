import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calculator, History as HistoryIcon, Wrench, FileText, Zap } from "lucide-react";

const links = [
  { to: "/dashboard", label: "Dashboard", icon: <Calculator className="h-4 w-4" /> },
  { to: "/standard-cycle", label: "Standard", icon: <FileText className="h-4 w-4" /> },
  { to: "/refrigerant-comparison", label: "Comparison", icon: <Zap className="h-4 w-4" /> },
  { to: "/troubleshooting", label: "Troubleshoot", icon: <Wrench className="h-4 w-4" /> },
  { to: "/history", label: "History", icon: <HistoryIcon className="h-4 w-4" /> },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:shrink-0 lg:pt-6 lg:pb-6 lg:pl-4 lg:pr-4 border-r border-sidebar-border bg-sidebar-background">
      <div className="flex items-center gap-3 px-3 mb-6">
        <div className="rounded-md bg-gradient-to-br from-blue-600 to-sky-500 p-2 shadow-sm">
          <Calculator className="h-5 w-5 text-white" />
        </div>
        <div>
          <div className="text-sm font-semibold text-sidebar-primary">Simulateon</div>
          <div className="text-xs text-sidebar-accent">Workspace & analysis hub</div>
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-2">
        {links.map((l) => {
          const active = location.pathname === l.to;
          return (
            <Link key={l.to} to={l.to} className="block">
              <Button
                asChild
                className={`w-full justify-start rounded-md ${active ? 'bg-blue-50 text-blue-700' : 'text-sidebar-foreground'} `}
                variant={active ? "default" : "ghost"}
              >
                <div className="flex items-center gap-3 px-3 py-2">
                  <span className="text-blue-600">{l.icon}</span>
                  <span className="text-sm font-medium truncate">{l.label}</span>
                </div>
              </Button>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 mt-6">
        <Link to="/projects">
          <Button className="w-full" variant="outline">Projects</Button>
        </Link>
      </div>
    </aside>
  );
}
