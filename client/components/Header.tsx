import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Menu,
  Search,
  User,
  LogOut,
  X,
  ChevronDown,
} from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { JobSelector } from "@/components/JobSelector";
import { HudBadge } from "@/components/hud/HudBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "landing" | "dashboard";
  onOpenSearch?: () => void;
}

function MobileGroup({
  label,
  items,
  onNavigate,
}: {
  label: string;
  items: Array<{ to: string; label: string; icon: any; badgeKey?: any }>;
  onNavigate: () => void;
}) {
  if (!items.length) return null;

  return (
    <div className="app-stack-8">
      <p className="px-2 text-xs font-semibold text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className="flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {item.badgeKey ? (
              <HudBadge badgeKey={item.badgeKey} size={20} decorative />
            ) : (
              <item.icon className="h-4 w-4 text-muted-foreground" />
            )}
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function Header({ variant = "landing", onOpenSearch }: HeaderProps) {
  const { user, isAuthenticated, signOut, companies } = useSupabaseAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { landingLinks, groups, mainLinks } = useAppNavigation();

  const initials = useMemo(() => {
    if (!user?.email) return "U";
    return user.email.slice(0, 2).toUpperCase();
  }, [user?.email]);

  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  const getLandingLinkTarget = (item: (typeof landingLinks)[number]) =>
    item.hash ? `${item.to}${item.hash}` : item.to;

  const desktopLandingLinks = useMemo(
    () =>
      landingLinks.filter((item) =>
        ["Features", "Use Cases", "Pricing", "Support"].includes(item.label),
      ),
    [landingLinks],
  );
  const overflowLandingLinks = useMemo(
    () =>
      landingLinks.filter(
        (item) => !["Features", "Use Cases", "Pricing", "Support"].includes(item.label),
      ),
    [landingLinks],
  );

  const isLandingLinkActive = (item: (typeof landingLinks)[number]) => {
    if (item.hash) {
      return location.pathname === item.to && location.hash === item.hash;
    }

    return location.pathname === item.to;
  };

  const handleLandingLinkClick = (
    item: (typeof landingLinks)[number],
    event: React.MouseEvent<HTMLAnchorElement>,
  ) => {
    if (!item.hash || location.pathname !== item.to) return;

    event.preventDefault();
    const targetId = item.hash.replace("#", "");
    const target = document.getElementById(targetId);

    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      window.history.replaceState(null, "", `${item.to}${item.hash}`);
      return;
    }

    navigate(`${item.to}${item.hash}`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      addToast({
        type: "success",
        title: "Signed out",
        description: "You have been signed out successfully.",
      });
    } catch {
      addToast({
        type: "info",
        title: "Session ended",
        description: "You were redirected to the home page.",
      });
    } finally {
      navigate("/");
    }
  };

  if (variant === "dashboard") {
    const mobileGroups = groups.filter((group) => group.visible);

    return (
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            {showBackButton ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                aria-label="Go back"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            ) : null}

            <Link to="/dashboard" className="flex items-center" aria-label="Go to dashboard">
              <img
                src="/logo-landscape.png"
                alt="ThermoNeural"
                className="h-9 w-auto object-contain sm:h-10"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <JobSelector />
            <CompanySwitcher />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onOpenSearch}>
              <Search className="h-4 w-4" />
              Quick Search
              <span className="ml-1 text-xs text-muted-foreground">Ctrl/Cmd+K</span>
            </Button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-sm font-semibold">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings/team">Team Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <ModeToggle />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <div className="border-t border-border bg-background px-4 py-4 md:hidden">
            <div className="app-stack-16">
              <div className="grid grid-cols-1 gap-2">
                <JobSelector />
                <CompanySwitcher />
              </div>

              <div className="grid gap-4">
                <MobileGroup label="Quick Access" items={mainLinks} onNavigate={() => setMobileOpen(false)} />
                {mobileGroups
                  .filter((group) => group.id !== "work")
                  .map((group) => (
                    <MobileGroup
                      key={group.id}
                      label={group.label}
                      items={group.items}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
              </div>

              <div className="grid gap-2 border-t border-border pt-3">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-border px-3 py-2 text-sm font-medium"
                >
                  Account
                </Link>
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          </div>
        ) : null}
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          {showBackButton ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              aria-label="Go back"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <Link to="/" className="flex items-center" aria-label="Go to homepage">
            <img
              src="/logo-landscape.png"
              alt="ThermoNeural"
              className="h-9 w-auto object-contain sm:h-10"
            />
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-1">
          {desktopLandingLinks.map((item) => (
            <Link
              key={`${item.to}${item.hash ?? ""}`}
              to={getLandingLinkTarget(item)}
              onClick={(event) => handleLandingLinkClick(item, event)}
              className={cn(
                "rounded-full px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/80 hover:text-foreground",
                isLandingLinkActive(item) && "bg-secondary text-foreground",
              )}
            >
              {item.label}
            </Link>
          ))}
          {overflowLandingLinks.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full px-3 py-1.5 text-sm font-medium">
                  More
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {overflowLandingLinks.map((item) => (
                  <DropdownMenuItem key={`${item.to}${item.hash ?? ""}`} asChild>
                    <Link
                      to={getLandingLinkTarget(item)}
                      onClick={(event) => handleLandingLinkClick(item, event)}
                    >
                      {item.label}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <ModeToggle />
          <Button asChild variant="ghost">
            <Link to="/signin">Sign In</Link>
          </Button>
          <Button asChild>
            <Link to="/signup">
              {isAuthenticated && companies.length ? "Go to Dashboard" : "Start Free"}
            </Link>
          </Button>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? (
        <div className="border-t border-border bg-background px-4 py-4 md:hidden">
          <div className="grid gap-2">
            {landingLinks.map((item) => (
              <Link
                key={`${item.to}${item.hash ?? ""}`}
                to={getLandingLinkTarget(item)}
                onClick={(event) => {
                  handleLandingLinkClick(item, event);
                  setMobileOpen(false);
                }}
                className="rounded-xl px-3 py-2 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Link to="/signin" onClick={() => setMobileOpen(false)}>
                <Button variant="outline" className="w-full">Sign In</Button>
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Start Free</Button>
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  );
}
