import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, UTIL_ITEMS } from "@/components/navigation";
import { Calculator } from 'lucide-react';


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
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} className={({ isActive }) => `block` }>
              {({ isActive }) => (
                <Button
                  asChild
                  className={`w-full justify-start rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'text-sidebar-foreground'}`}
                  variant={isActive ? "default" : "ghost"}
                >
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Icon className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium truncate">{item.label}</span>
                  </div>
                </Button>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="px-3 mt-6">
        <div className="space-y-2">
          {UTIL_ITEMS.map((u) => {
            const UIcon = u.icon;
            return (
            <NavLink key={u.to} to={u.to} className={({ isActive }) => `block` }>
              {({ isActive }) => (
                <Button asChild variant={isActive ? 'default' : 'ghost'} className={`w-full justify-start ${isActive ? 'bg-blue-50 text-blue-700' : ''}`}>
                  <div className="flex items-center gap-3 px-3 py-2">
                    {UIcon ? <UIcon className="h-4 w-4 text-muted-foreground" /> : null}
                    <span className="text-sm font-medium truncate">{u.label}</span>
                  </div>
                </Button>
              )}
            </NavLink>
            );
          })}
          <NavLink to="/projects">
            <Button className="w-full" variant="outline">Projects</Button>
          </NavLink>
        </div>
      </div>
    </aside>
  );
}
