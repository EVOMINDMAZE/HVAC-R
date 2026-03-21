import { ChevronDown } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import type { ComponentType } from "react";

import { CompanySwitcher } from "@/components/CompanySwitcher";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAppNavigation, NavItem } from "@/hooks/useAppNavigation";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { navLinkBaseClasses, navLinkIconClasses } from "@/lib/navigation";
import { cn } from "@/lib/utils";

type ResourceItem = {
  to: string;
  label: string;
  desc?: string;
  icon: ComponentType<{ className?: string }>;
};

function isActivePath(currentPath: string, targetPath: string) {
  if (targetPath === "/dashboard") return currentPath === "/dashboard";
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function isLandingItemActive(pathname: string, hash: string, item: { to: string; hash?: string }) {
  if (item.hash) {
    return pathname === item.to && hash === item.hash;
  }
  if (item.to === "/features") {
    return pathname === item.to && hash !== "#use-cases";
  }
  return isActivePath(pathname, item.to);
}

function GroupMenu({
  label,
  items,
  pathname,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
}) {
  const active = items.some((item) => isActivePath(pathname, item.to));

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            navLinkIconClasses,
            "transition-all duration-200 rounded-lg hover:bg-muted/50",
            active
              ? "text-foreground bg-muted/30"
              : "text-muted-foreground/80 hover:text-foreground",
          )}
          aria-current={active ? "page" : undefined}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-1.5 shadow-xl shadow-black/10 border-border/60 rounded-xl">
        <DropdownMenuLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={`${item.to}:${item.label}`} asChild>
            <Link to={item.to} className="flex items-start gap-2 rounded-md p-2">
              <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                {item.desc ? <p className="text-xs text-muted-foreground">{item.desc}</p> : null}
              </div>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Sidebar() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const { groups, resources, landingLinks } = useAppNavigation();

  if (!isAuthenticated) {
    return (
      <nav className="hidden md:block w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] items-center gap-1 px-4 py-2 sm:px-6 lg:px-8">
          {landingLinks.map((item) => (
            <Link
              key={`${item.to}${item.hash ?? ""}:${item.label}`}
              to={item.hash ? `${item.to}${item.hash}` : item.to}
              className={cn(
                `${navLinkBaseClasses} text-muted-foreground/80 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-muted/50`,
                isLandingItemActive(location.pathname, location.hash, item) &&
                  "text-foreground bg-muted/30",
              )}
              aria-current={
                isLandingItemActive(location.pathname, location.hash, item) ? "page" : undefined
              }
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    );
  }

  const visibleGroups = groups.filter((group) => group.visible && group.items.length > 0);
  const workGroup = visibleGroups.find((group) => group.id === "work");
  const otherGroups = visibleGroups.filter((group) => group.id !== "work");

  return (
    <nav className="hidden md:block w-full border-b border-border/40 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {workGroup?.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  navLinkIconClasses,
                  "transition-all duration-200 rounded-lg hover:bg-muted/50",
                  isActive
                    ? "text-foreground bg-muted/30"
                    : "text-muted-foreground/80 hover:text-foreground",
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}

          {otherGroups.map((group) => (
            <GroupMenu
              key={group.id}
              label={group.label}
              items={group.items}
              pathname={location.pathname}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <CompanySwitcher />
          {resources.visible ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground/80 hover:text-foreground transition-all duration-200 rounded-lg hover:bg-muted/50">
                  Resources
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-1.5 shadow-xl shadow-black/10 border-border/60 rounded-xl">
                {resources.groups.map((group, idx) => (
                  <div key={group.label}>
                    {idx > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel className="text-xs uppercase tracking-[0.08em] text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.items.map((item: ResourceItem) => (
                      <DropdownMenuItem key={`${item.to}:${item.label}`} asChild>
                        {item.to.startsWith("http") ? (
                          <a
                            href={item.to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 rounded-md p-2 transition-all duration-200 hover:bg-muted/50"
                          >
                            <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </a>
                        ) : (
                          <Link to={item.to} className="flex items-start gap-2 rounded-md p-2 transition-all duration-200 hover:bg-muted/50">
                            <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </Link>
                        )}
                      </DropdownMenuItem>
                    ))}
                  </div>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
