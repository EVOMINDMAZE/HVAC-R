import React, { useState, useRef, useEffect } from "react";
import { Calculator, User, Menu, X, Flame, ArrowLeft, Loader2, LogOut } from "lucide-react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { JobSelector } from "@/components/JobSelector";
import { CompanySwitcher } from "@/components/CompanySwitcher";
import { useAppNavigation } from "@/hooks/useAppNavigation";

interface HeaderProps {
  variant?: "landing" | "dashboard";
  onOpenSearch?: () => void;
}

export function Header({ variant = "landing", onOpenSearch }: HeaderProps) {
  const { user, isAuthenticated, signOut, companies, isRefreshing } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { mainLinks, toolbox, office, resources } = useAppNavigation();

  const [isAvatarOpen, setIsAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (variant !== "dashboard") return;

    function handleDocClick(e: MouseEvent) {
      if (!avatarRef.current) return;
      if (e.target instanceof Node && !avatarRef.current.contains(e.target)) {
        setIsAvatarOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsAvatarOpen(false);
    }
    document.addEventListener("click", handleDocClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("click", handleDocClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [variant]);

  // Show back button on any page that is not Landing or Dashboard
  const showBackButton =
    location.pathname !== "/" && location.pathname !== "/dashboard";
  const isNative = Capacitor.isNativePlatform();

  const handleSignOut = async () => {
    console.log("[Header] Sign out triggered");
    try {
      await signOut();
      // Always treat as success for UX - clear state and redirect
      addToast({
        type: "success",
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    } catch (err: any) {
      // Even if API fails, we redirect user
      console.error("Sign out error:", err);
      navigate("/");
    }
  };

  if (variant === "dashboard") {
    const initials = user?.email
      ? user.email.split("@")[0].slice(0, 2).toUpperCase()
      : "U";
    const avatarUrl =
      (user as any)?.user_metadata?.avatar_url ||
      (user as any)?.user_metadata?.avatar ||
      null;

    return (
      <div
        className={`bg-background/80 backdrop-blur-md shadow-lg border-b border-border transition-colors z-50 relative ${isNative ? "pt-safe-hard" : ""}`}
        style={{
          paddingTop: isNative ? "60px" : undefined,
        }}
      >
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div
            className={`${isNative ? "flex flex-col gap-4" : "flex items-center justify-between gap-4"}`}
          >
            <div
              className={`${isNative ? "w-full flex justify-center border-b border-cyan-500/10 pb-4" : "flex items-center gap-4 min-w-0"}`}
            >
              {!isNative && showBackButton && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="mr-2 mt-2"
                  title="Go Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}

              <Link
                to="/dashboard"
                className="flex items-center gap-3 hover:opacity-90 transition-opacity py-1 shrink-0"
              >
                <picture>
                  <source srcSet="/logo-landscape.webp" type="image/webp" />
                  <img
                    src="/logo-landscape.png"
                    alt="ThermoNeural"
                    className={`${isNative ? "h-10 sm:h-12" : "h-9 sm:h-10 md:h-12 lg:h-14"} w-auto object-contain mix-blend-multiply dark:mix-blend-screen dark:invert transition-all`}
                  />
                </picture>
              </Link>

              <div className="hidden md:flex items-center gap-2 ml-4">
                <JobSelector />
                <CompanySwitcher />
              </div>

              {/* Desktop search */}
              <div className="hidden md:block ml-6">
                <div className="relative">
                  <input
                    placeholder="Search calculations, projects or tools..."
                    className="w-48 md:w-96 rounded-md border border-primary/30 bg-secondary/50 px-4 py-2 text-sm focus:ring-2 focus:ring-primary/50 transition-colors font-mono placeholder:text-muted-foreground"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ⌘K
                  </div>
                </div>
              </div>
            </div>

            <div
              className={`${isNative ? "w-full flex items-center justify-between px-2" : "flex items-center gap-3"}`}
            >
              {/* Native Mobile: Back Button on the left of the bottom row */}
              {isNative && (
                <div className="flex-1">
                  {showBackButton ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(-1)}
                      className="flex items-center gap-1 -ml-2 text-muted-foreground hover:text-primary"
                    >
                      <ArrowLeft className="h-5 w-5" />
                      Back
                    </Button>
                  ) : (
                    <div />
                  )}
                </div>
              )}

              <nav className="hidden">
                {/* Header horizontal nav intentionally hidden for dashboard to avoid duplication with Sidebar */}
              </nav>

              <div
                className={`${isNative ? "flex items-center gap-4" : "flex items-center mr-2"}`}
              >
                <div className={isNative ? "" : "hidden md:block mr-2"}>
                  <ModeToggle />
                </div>

                {/* Menu Button - Always visible on mobile */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden">
                  {/* NAV_ITEMS hidden in header on dashboard - use Sidebar for navigation */}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm text-muted-foreground truncate max-w-[12rem]">
                      {user?.email}
                    </span>
                    <span className="text-xs text-gray-400">
                      {user?.user_metadata?.full_name ?? ""}
                    </span>
                  </div>
                  <div className="hidden md:block relative overflow-visible" ref={avatarRef}>
                    {/* ... Avatar Code ... */}
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isAvatarOpen}
                      onClick={() => setIsAvatarOpen((s) => !s)}
                      className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold overflow-hidden focus:outline-none focus:ring-2 focus:ring-primary/50 transition-colors"
                      aria-label="Account menu"
                    >
                      {avatarUrl ? (
                        <img
                          src={avatarUrl}
                          alt="User avatar"
                          className="h-9 w-9 object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-semibold">
                          {initials}
                        </span>
                      )}
                    </button>
                    {/* ... Dropdown (omitted in replacement for brevity, sticking to existing structure) ... */}
                    {isAvatarOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-40 bg-popover/95 backdrop-blur-xl border border-primary/20 rounded-md shadow-lg z-[9999] transition-colors"
                      >
                        <nav className="flex flex-col p-2">
                          <Link
                            to="/profile"
                            onClick={() => setIsAvatarOpen(false)}
                            role="menuitem"
                            tabIndex={0}
                            className="px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded transition-colors"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsAvatarOpen(false)}
                            role="menuitem"
                            tabIndex={0}
                            className="px-3 py-2 text-sm text-foreground hover:bg-primary/10 hover:text-primary rounded transition-colors"
                          >
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              setIsAvatarOpen(false);
                              handleSignOut();
                            }}
                            role="menuitem"
                            className="flex items-center gap-2 text-left px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded transition-colors w-full"
                          >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                          </button>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>

                {/* Remove old duplicate Button */}
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
              <nav className="flex flex-col space-y-1">
                {/* 0. Mobile Only Controls */}
                <div className="flex flex-col gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-full">
                    <JobSelector />
                  </div>
                  <div className="w-full">
                    <CompanySwitcher />
                  </div>
                </div>

                {/* 1. Main Links */}
                {mainLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 text-foreground hover:text-primary font-medium px-2 py-2 rounded-md hover:bg-secondary transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}

                <div className="my-2 border-t border-border" />

                {/* 2. Toolbox */}
                {toolbox.visible && (
                  <div className="px-2 py-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Toolbox
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {toolbox.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-secondary/50 hover:bg-secondary border border-border hover:border-primary/50 transition-all text-center"
                        >
                          <div className="p-1 rounded-full bg-primary/10 text-primary">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-foreground">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Office */}
                {office.visible && (
                  <div className="px-2 py-2">
                    <div className="space-y-1">
                      {office.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-muted-foreground hover:text-primary hover:bg-secondary rounded-md"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-primary/10 text-primary text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-3 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mb-2"
                    onClick={() => {
                      navigate("/profile");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Profile
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <header
      className={`bg-background/80 backdrop-blur-md border-b border-border sticky top-0 z-50 shadow-sm transition-all duration-200 ${isNative ? "pt-safe-hard" : ""}`}
      style={{
        // FORCE padding to clear Dynamic Island (approx 54px + buffer)
        // We use a hard 60px because env() can be unreliable in some webviews
        paddingTop: isNative ? "50px" : undefined,
        height: isNative ? "auto" : undefined,
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pb-2">
        {/* Top Row: Logo, Dark Mode, Menu */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-1 sm:space-x-2">
            {showBackButton && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="mr-2 mt-2"
                title="Go Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
            )}

            <Link to="/" className="flex items-center space-x-2 py-1">
              <picture>
                <source srcSet="/logo-landscape.webp" type="image/webp" />
                <img
                  src="/logo-landscape.png"
                  alt="ThermoNeural Logo"
                  className={`${isNative ? "h-9 sm:h-10" : "h-10 sm:h-12 md:h-14 lg:h-16"} w-auto object-contain mix-blend-multiply dark:mix-blend-screen dark:invert origin-left transition-all`}
                />
              </picture>
            </Link>
          </div>

          {/* Web Desktop Nav - Hidden on Native Mobile */}
          {!isNative && !isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-4 lg:space-x-8">
              <Link
                to="/features"
                className="text-muted-foreground hover:text-primary font-medium transition-colors font-display"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-muted-foreground hover:text-primary font-medium transition-colors font-display"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-muted-foreground hover:text-primary font-medium transition-colors font-display"
              >
                About
              </Link>
              <div className="w-px h-6 bg-border"></div>
              <Link
                to="/help-center"
                className="text-muted-foreground hover:text-primary font-medium text-sm transition-colors font-display"
              >
                Help
              </Link>
              <Link
                to="/contact"
                className="text-muted-foreground hover:text-primary font-medium text-sm transition-colors font-display"
              >
                Support
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="flex items-center h-10">
              <ModeToggle />
            </div>

            {/* Authenticated State */}
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden md:block">
                  {user?.email}
                </span>
                <Link
                  to={companies.length > 0 ? "/dashboard" : "/join-company"}
                  className={isNative ? "hidden" : "hidden md:block"}
                >
                  <Button 
                    variant="neonHighlight"
                    size="lg"
                    className="font-mono tracking-wider"
                    disabled={isRefreshing}
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {companies.length > 0 ? "Go to Dashboard" : "Join Organization"}
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="hidden md:flex"
                >
                  Sign Out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </>
            ) : (
              // Unauthenticated State
              <>
                <div
                  className={isNative ? "hidden" : "flex items-center gap-4 md:gap-4"}
                >
                  <Link to="/signin">
                    <Button
                      variant="ghost"
                      className="text-muted-foreground hover:text-foreground px-3"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button variant="neonHighlight" size="lg" className="font-mono tracking-wider text-foreground">
                    Start Free Trial
                  </Button>
                  </Link>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-7 w-7" />
                  ) : (
                    <Menu className="h-7 w-7" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Native Mobile ONLY: Second Row for Auth Actions */}
        {isNative && !isAuthenticated && !isMobileMenuOpen && (
          <div className="mt-4 flex gap-3 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link to="/signin" className="flex-1">
              <Button
                variant="outline"
                className="w-full h-10 text-sm font-semibold border-border"
              >
                Sign In
              </Button>
            </Link>
            <Link to="/signup" className="flex-1">
              <Button variant="neonHighlight" className="w-full h-10 text-sm font-semibold shadow-sm font-mono tracking-wider text-foreground">
                Start Free Trial
              </Button>
            </Link>
          </div>
        )}

        {/* Native Mobile ONLY: Authenticated Dashboard Link */}
        {isNative && isAuthenticated && !isMobileMenuOpen && (
          <div className="mt-4 px-1 animate-in fade-in slide-in-from-top-2 duration-200">
            <Link to={companies.length > 0 ? "/dashboard" : "/join-company"}>
              <Button variant="neonHighlight" className="w-full h-10 font-semibold shadow-sm font-mono tracking-wider">
                {companies.length > 0 ? "Go to Dashboard" : "Join Organization"}
              </Button>
            </Link>
          </div>
        )}

        {/* Mobile Menu Dropdown (Shared Logic) */}
        {isMobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-border animate-in fade-in slide-in-from-top-2 duration-200">
            {isAuthenticated ? (
              <nav className="flex flex-col space-y-1">
                {/* 1. Main Links */}
                {mainLinks.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex items-center gap-2 text-slate-700 hover:text-orange-600 dark:text-slate-300 dark:hover:text-orange-400 font-medium px-2 py-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                ))}

                <div className="my-2 border-t border-slate-100 dark:border-slate-800" />

                {/* 2. Toolbox */}
                {toolbox.visible && (
                  <div className="px-2 py-2">
                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Toolbox
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {toolbox.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 hover:border-orange-200 dark:hover:border-orange-800 transition-all text-center"
                        >
                          <div className="p-1 rounded-full bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                            {item.label}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Office */}
                {office.visible && (
                  <div className="px-2 py-2">
                    <div className="space-y-1">
                      {office.items.map((item) => (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-3 px-2 py-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-md"
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                          {item.badge && (
                            <span className="ml-auto bg-orange-100 text-orange-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
              </nav>
            ) : (
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/features"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2 py-1 font-medium hover:bg-secondary rounded-md text-foreground"
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2 py-1 font-medium hover:bg-secondary rounded-md text-foreground"
                >
                  Pricing
                </Link>
                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2 py-1 font-medium hover:bg-secondary rounded-md text-foreground"
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2 py-1 font-medium hover:bg-secondary rounded-md text-foreground"
                >
                  Contact
                </Link>
              </nav>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
