import { Link, NavLink, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/useSupabaseAuth";
import { useAppNavigation, NavItem } from "@/hooks/useAppNavigation";
import { cn } from "@/lib/utils";
import { HudBadge } from "@/components/hud/HudBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

function isActivePath(currentPath: string, targetPath: string) {
  if (targetPath === "/dashboard") return currentPath === "/dashboard";
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
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
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors",
            active
              ? "bg-background text-foreground shadow-sm ring-1 ring-border"
              : "text-muted-foreground hover:bg-background hover:text-foreground",
          )}
        >
          {label}
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-1">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
          {label}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {items.map((item) => (
          <DropdownMenuItem key={item.to} asChild>
            <Link to={item.to} className="flex items-start gap-2 rounded-md p-2">
              {item.badgeKey ? (
                <HudBadge badgeKey={item.badgeKey} size={20} decorative />
              ) : (
                <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
              )}
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
      <nav className="hidden md:block w-full border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-4 py-2 sm:px-6 lg:px-8">
          {landingLinks.map((item) => {
            const target = item.hash ? `${item.to}${item.hash}` : item.to;
            return (
            <Link
              key={target}
              to={target}
              className="rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground"
            >
              {item.label}
            </Link>
          )})}
        </div>
      </nav>
    );
  }

  const visibleGroups = groups.filter((group) => group.visible && group.items.length > 0);
  const workGroup = visibleGroups.find((group) => group.id === "work");
  const otherGroups = visibleGroups.filter((group) => group.id !== "work");

  return (
    <nav className="hidden md:block w-full border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide lg:flex-wrap">
          <div className="flex shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-muted/35 p-1.5 shadow-sm">
            {workGroup?.items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? "bg-background text-foreground shadow-sm ring-1 ring-border"
                      : "text-muted-foreground hover:bg-background/80 hover:text-foreground",
                  )
                }
              >
                {item.badgeKey ? (
                  <HudBadge badgeKey={item.badgeKey} size={20} decorative />
                ) : (
                  <item.icon className="h-4 w-4" />
                )}
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
        </div>

        <div className="flex items-center gap-2">
          {resources.visible ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Resources
                  <ChevronDown className="ml-1 h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-1">
                {resources.groups.map((group, idx) => (
                  <div key={group.label}>
                    {idx > 0 ? <DropdownMenuSeparator /> : null}
                    <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                      {group.label}
                    </DropdownMenuLabel>
                    {group.items.map((item: any) => (
                      <DropdownMenuItem key={item.to} asChild>
                        {item.to.startsWith("http") ? (
                          <a
                            href={item.to}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-start gap-2 rounded-md p-2"
                          >
                            <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="text-sm font-medium">{item.label}</p>
                              <p className="text-xs text-muted-foreground">{item.desc}</p>
                            </div>
                          </a>
                        ) : (
                          <Link to={item.to} className="flex items-start gap-2 rounded-md p-2">
                            {item.badgeKey ? (
                              <HudBadge badgeKey={item.badgeKey} size={20} decorative />
                            ) : (
                              <item.icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                            )}
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
