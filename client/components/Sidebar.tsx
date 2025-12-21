import { NavLink, Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS, UTIL_ITEMS, NAV_GROUPS } from "@/components/navigation";
import { Calculator, ChevronDown } from 'lucide-react';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            ? NAV_GROUPS.map((group, index) => {
              if (group.type === 'link' && group.item) {
                const Icon = group.item.icon;
                return (
                  <NavLink key={group.item.to} to={group.item.to} className={({ isActive }) => `inline-block`}>
                    {({ isActive }) => (
                      <Button
                        asChild
                        variant={isActive ? 'default' : 'ghost'}
                        className={`rounded-md px-3 py-2 ${isActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-sidebar-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}>
                        <div className="flex items-center gap-2">
                          <Icon className={`h-4 w-4 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span className="text-sm font-medium">{group.item.label}</span>
                        </div>
                      </Button>
                    )}
                  </NavLink>
                );
              } else if (group.type === 'dropdown' && group.items) {
                const GroupIcon = group.icon;
                // Check if any child item is active to highlight the dropdown trigger
                const isGroupActive = group.items.some(item => location.pathname === item.to);

                return (
                  <DropdownMenu key={index}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant={isGroupActive ? 'default' : 'ghost'}
                        className={`rounded-md px-3 py-2 ${isGroupActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-sidebar-foreground hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
                      >
                        <div className="flex items-center gap-2">
                          <GroupIcon className={`h-4 w-4 ${isGroupActive ? 'text-orange-600 dark:text-orange-400' : 'text-slate-500 dark:text-slate-400'}`} />
                          <span className="text-sm font-medium">{group.label}</span>
                          <ChevronDown className="h-3 w-3 ml-1 opacity-50" />
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      {group.items.map((subItem) => {
                        const SubIcon = subItem.icon;
                        const isSubActive = location.pathname === subItem.to;
                        return (
                          <DropdownMenuItem key={subItem.to} asChild className="cursor-pointer">
                            <Link to={subItem.to} className={`flex items-center gap-2 w-full ${isSubActive ? 'bg-slate-50 dark:bg-slate-800/50 text-blue-600 dark:text-blue-400' : ''}`}>
                              <SubIcon className="h-4 w-4" />
                              <span>{subItem.label}</span>
                            </Link>
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return null;
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
                  <Button asChild variant={isActive ? 'default' : 'ghost'} className={`${isActive ? 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white' : 'text-slate-600 dark:text-slate-400'} px-2 py-1`}>
                    <div className="flex items-center gap-2">
                      {UIcon ? <UIcon className="h-4 w-4 text-muted-foreground" /> : null}
                      <span className="text-sm">{u.label}</span>
                    </div>
                  </Button>
                )}
              </NavLink>
            );
          })}

          <NavLink to="/jobs">
            <Button variant="outline" className="ml-2">Jobs</Button>
          </NavLink>
        </div>
      </div>
    </nav>
  );
}
