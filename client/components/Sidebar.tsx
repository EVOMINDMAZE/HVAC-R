import { NavLink, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, UTIL_ITEMS } from "@/components/navigation";
import { Calculator } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useSupabaseAuth();

  const LANDING_ITEMS = [
    { to: '/features', label: 'Features' },
    { to: '/pricing', label: 'Pricing' },
    { to: '/api-docs', label: 'API Docs' },
    { to: '/about', label: 'About' },
  ];

  return (
    <nav className="w-full border-b border-sidebar-border bg-sidebar-background">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
        {/* Primary navigation - visible on medium+ screens */}
        <div className="hidden md:flex items-center gap-2">
          {isAuthenticated
            ? NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink key={item.to} to={item.to} className={({ isActive }) => `inline-block`}>
                    {({ isActive }) => (
                      <Button
                        asChild
                        variant={isActive ? 'default' : 'ghost'}
                        className={`rounded-md px-3 py-2 ${isActive ? 'bg-blue-50 text-blue-700' : 'text-sidebar-foreground'}`}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-blue-600" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </div>
                      </Button>
                    )}
                  </NavLink>
                );
              })
            : LANDING_ITEMS.map((item) => (
                <Link key={item.to} to={item.to} className="inline-block">
                  <Button asChild variant="ghost" className="rounded-md px-3 py-2 text-sidebar-foreground">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  </Button>
                </Link>
              ))}
        </div>

        {/* Utility and projects - always visible */}
        <div className="flex items-center gap-2">
          {UTIL_ITEMS.map((u) => {
            const UIcon = u.icon;
            return (
              <NavLink key={u.to} to={u.to} className={({ isActive }) => `inline-block`}>
                {({ isActive }) => (
                  <Button asChild variant={isActive ? 'default' : 'ghost'} className={`${isActive ? 'bg-blue-50 text-blue-700' : ''} px-2 py-1`}>
                    <div className="flex items-center gap-2">
                      {UIcon ? <UIcon className="h-4 w-4 text-muted-foreground" /> : null}
                      <span className="text-sm">{u.label}</span>
                    </div>
                  </Button>
                )}
              </NavLink>
            );
          })}

          <NavLink to="/projects">
            <Button variant="outline" className="ml-2">Projects</Button>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
