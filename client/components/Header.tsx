import {
  ArrowLeft,
  Menu,
  Search,
  User,
  LogOut,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from "react-router-dom";

import type { ComponentType } from "react";

import { CompanySwitcher } from "@/components/CompanySwitcher";
import { JobSelector } from "@/components/JobSelector";
import { ModeToggle } from "@/components/mode-toggle";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { navLinkBaseClasses } from "@/lib/navigation";
import { cn } from "@/lib/utils";

interface HeaderProps {
  variant?: "landing" | "dashboard";
  onOpenSearch?: () => void;
}

function MobileGroup({
  label,
  items,
  pathname,
  onNavigate,
}: {
  label: string;
  items: Array<{ to: string; label: string; icon: ComponentType<{ className?: string }> }>;
  pathname: string;
  onNavigate: () => void;
}) {
  if (!items.length) return null;

  return (
    <div className="app-stack-8">
      <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <div className="grid gap-1">
        {items.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "flex min-h-12 items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              pathname === item.to || pathname.startsWith(`${item.to}/`)
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-current={pathname === item.to || pathname.startsWith(`${item.to}/`) ? "page" : undefined}
          >
            <item.icon className="h-4 w-4 text-current" />
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function isRouteActive(currentPath: string, targetPath: string) {
  if (targetPath === "/") return currentPath === "/";
  return currentPath === targetPath || currentPath.startsWith(`${targetPath}/`);
}

function isNavItemActive(pathname: string, hash: string, item: { to: string; hash?: string }) {
  if (item.hash) {
    return pathname === item.to && hash === item.hash;
  }

  if (item.to === "/features") {
    return pathname === item.to && hash !== "#use-cases";
  }

  return isRouteActive(pathname, item.to);
}

function HeaderMobileBackdrop({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm md:hidden"
      aria-label="Dismiss menu"
      onClick={onDismiss}
    />
  );
}

function HeaderMobilePanel({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div
      id={id}
      role="dialog"
      aria-modal="true"
      className="relative z-50 border-t border-border/60 bg-background/98 backdrop-blur-xl px-4 py-4 shadow-2xl shadow-black/5 md:hidden"
    >
      {children}
    </div>
  );
}

function LandingMobileLink({
  label,
  to,
  isActive,
  onClick,
}: {
  label: string;
  to: string;
  isActive: boolean;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "min-h-12 rounded-lg px-4 py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isActive
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground",
      )}
      aria-current={isActive ? "page" : undefined}
    >
      {label}
    </Link>
  );
}

function MobileMenuSection({ children }: { children: React.ReactNode }) {
  return <div className="app-stack-16">{children}</div>;
}

export function Header({ variant = "landing", onOpenSearch }: HeaderProps) {
  const { user, isAuthenticated, signOut, companies, isRefreshing } = useSupabaseAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { landingLinks, groups, mainLinks } = useAppNavigation();
  const mobileMenuId = variant === "dashboard" ? "dashboard-mobile-menu" : "landing-mobile-menu";
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains("dark"));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [mobileOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const initials = useMemo(() => {
    if (!user?.email) return "U";
    return user.email.slice(0, 2).toUpperCase();
  }, [user?.email]);

  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  const getLandingLinkTarget = (item: (typeof landingLinks)[number]) =>
    item.hash ? `${item.to}${item.hash}` : item.to;

  const isLandingLinkActive = (item: (typeof landingLinks)[number]) =>
    isNavItemActive(location.pathname, location.hash, item);

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
      <header className="sticky top-0 z-50 border-b border-border/50 bg-background/95 backdrop-blur-xl shadow-sm shadow-black/5">
        <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
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

            <Link to="/dashboard" className="flex items-center" aria-label="Go to dashboard home">
              <img
                src={isDark ? "/logo-landscape-dark.png?v=3" : "/logo-landscape.png?v=3"}
                alt="ThermoNeural"
                className="h-9 w-auto object-contain sm:h-10 transition-transform duration-200 hover:scale-[1.02]"
              />
            </Link>
          </div>

          <div className="hidden lg:flex items-center gap-2">
            <JobSelector />
            <CompanySwitcher />
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onOpenSearch}
              className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:shadow-md hover:shadow-black/5"
            >
              <Search className="h-4 w-4" />
              <span className="hidden lg:inline">Quick Search</span>
              <span className="hidden xl:inline ml-1 text-xs text-muted-foreground/70">Ctrl/K</span>
            </Button>
            <ModeToggle />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-secondary to-secondary/80 text-sm font-semibold shadow-sm ring-1 ring-border/50 transition-all duration-200 hover:shadow-md hover:shadow-black/5 hover:ring-border/80">
                  {initials}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 shadow-xl shadow-black/10 border-border/60 rounded-xl">
                <DropdownMenuItem asChild>
                  <Link to="/profile" className="flex items-center gap-2 transition-colors duration-200">
                    <User className="h-4 w-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings/team">Team Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-destructive transition-colors duration-200"
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
              aria-expanded={mobileOpen}
              aria-controls={mobileMenuId}
              className="text-muted-foreground/80 hover:text-foreground transition-all duration-200"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? <HeaderMobileBackdrop onDismiss={() => setMobileOpen(false)} /> : null}
        {mobileOpen ? (
          <HeaderMobilePanel id={mobileMenuId}>
            <MobileMenuSection>
              <div className="grid grid-cols-1 gap-2">
                <JobSelector />
                <CompanySwitcher />
              </div>

              <div className="grid gap-4">
                <MobileGroup
                  label="Quick Access"
                  items={mainLinks}
                  pathname={location.pathname}
                  onNavigate={() => setMobileOpen(false)}
                />
                {mobileGroups
                  .filter((group) => group.id !== "work")
                  .map((group) => (
                    <MobileGroup
                      key={group.id}
                      label={group.label}
                      items={group.items}
                      pathname={location.pathname}
                      onNavigate={() => setMobileOpen(false)}
                    />
                  ))}
              </div>

              <div className="grid gap-2 border-t border-border pt-3">
                <Link
                  to="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="min-h-12 rounded-lg border border-border px-4 py-3 text-sm font-medium"
                >
                  Account
                </Link>
                <Button variant="destructive" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </MobileMenuSection>
          </HeaderMobilePanel>
        ) : null}
      </header>
    );
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 border-b transition-all duration-300",
      variant === "landing" 
          ? "border-border/30 bg-background backdrop-blur-2xl" 
          : "border-border/50 bg-background dark:bg-background backdrop-blur-xl shadow-sm shadow-black/5"
    )}>
      <div className="mx-auto flex w-full max-w-[1600px] items-center justify-between gap-3 px-4 py-2.5 sm:px-6 lg:px-8">
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
          <Link to="/" className="flex items-center" aria-label="Go to home">
            <img
              src={isDark ? "/logo-landscape-dark.png?v=3" : "/logo-landscape.png?v=3"}
              alt="ThermoNeural"
              className="h-9 w-auto object-contain sm:h-10 transition-transform duration-200 hover:scale-[1.02]"
            />
          </Link>
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          <Link to="/features" className="landing-nav-link">Features</Link>
          <Link to="/use-cases" className="landing-nav-link">Use Cases</Link>
          <Link to="/pricing" className="landing-nav-link">Pricing</Link>
          <Link to="/about" className="landing-nav-link">About</Link>
          <Link to="/help" className="landing-nav-link">Help</Link>
          <Link to="/support" className="landing-nav-link">Support</Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <ModeToggle />
          <Link to="/signin" className="landing-nav-link font-bold">
            Sign In
          </Link>
          <Link to="/signup">
            <Button 
              disabled={isRefreshing}
              className={cn(
                "landing-btn-primary px-6 py-2 shadow-primary/10",
                variant === "landing" && !isAuthenticated && "bg-primary hover:bg-primary/90 text-primary-foreground border-none"
              )}
            >
              {isAuthenticated && companies.length ? "Go to Dashboard" : "Start Free"}
            </Button>
          </Link>
        </div>

        <div className="flex items-center gap-2 md:hidden">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle menu"
            aria-expanded={mobileOpen}
            aria-controls={mobileMenuId}
            className="text-muted-foreground/80 hover:text-foreground transition-all duration-200"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {mobileOpen ? <HeaderMobileBackdrop onDismiss={() => setMobileOpen(false)} /> : null}
      {mobileOpen ? (
        <HeaderMobilePanel id={mobileMenuId}>
          <div className="grid gap-2">
            {landingLinks.map((item) => (
              <LandingMobileLink
                key={`${item.to}${item.hash ?? ""}`}
                label={item.label}
                to={getLandingLinkTarget(item)}
                isActive={isLandingLinkActive(item)}
                onClick={(event) => {
                  handleLandingLinkClick(item, event);
                  setMobileOpen(false);
                }}
              />
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
        </HeaderMobilePanel>
      ) : null}
    </header>
  );
}
