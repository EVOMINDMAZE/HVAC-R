
import React, { useState, useRef, useEffect } from "react";
import { Calculator, User, Menu, X, Flame, ArrowLeft } from "lucide-react"; // Changed Calculator to Flame for Thermo vibe? Or keep Calculator. Let's keep Calculator but maybe add Flame if it's "Thermo".
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/mode-toggle";
import { NAV_ITEMS } from "@/components/navigation";

interface HeaderProps {
  variant?: "landing" | "dashboard";
  onOpenSearch?: () => void;
}

export function Header({ variant = "landing", onOpenSearch }: HeaderProps) {
  const { user, isAuthenticated, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Show back button on any page that is not Landing or Dashboard
  const showBackButton = location.pathname !== "/" && location.pathname !== "/dashboard";

  const handleSignOut = async () => {
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
    const [isAvatarOpen, setIsAvatarOpen] = useState(false);
    const avatarRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
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
    }, []);

    return (
      <div className="bg-white/90 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
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

              <Link to="/dashboard" className="flex items-center gap-3 hover:opacity-90 transition-opacity py-1">
                <img
                  src="/logo-landscape.png"
                  alt="ThermoNeural"
                  className="h-10 md:h-12 w-auto object-contain mix-blend-multiply scale-[1.25] origin-left"
                />
              </Link>

              {/* Desktop search */}
              <div className="hidden md:block ml-6">
                <div className="relative">
                  <input
                    placeholder="Search calculations, projects or tools..."
                    className="w-48 md:w-96 rounded-md border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                    ⌘K
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden">
                {/* Header horizontal nav intentionally hidden for dashboard to avoid duplication with Sidebar */}
              </nav>

              <div className="mr-2">
                <ModeToggle />
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
                  <div className="relative" ref={avatarRef}>
                    <button
                      type="button"
                      aria-haspopup="menu"
                      aria-expanded={isAvatarOpen}
                      onClick={() => setIsAvatarOpen((s) => !s)}
                      className="h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 font-semibold overflow-hidden focus:outline-none focus:ring-2 focus:ring-slate-200"
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

                    {isAvatarOpen && (
                      <div
                        role="menu"
                        className="absolute right-0 mt-2 w-40 bg-white border rounded-md shadow-lg z-[9999]"
                      >
                        <nav className="flex flex-col p-2">
                          <Link
                            to="/profile"
                            onClick={() => setIsAvatarOpen(false)}
                            role="menuitem"
                            tabIndex={0}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                          >
                            Profile
                          </Link>
                          <Link
                            to="/profile"
                            onClick={() => setIsAvatarOpen(false)}
                            role="menuitem"
                            tabIndex={0}
                            className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded"
                          >
                            Settings
                          </Link>
                          <button
                            onClick={() => {
                              setIsAvatarOpen(false);
                              handleSignOut();
                            }}
                            role="menuitem"
                            className="text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50 rounded"
                          >
                            Sign Out
                          </button>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-3">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
                <div className="pt-3 border-t border-gray-100">
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
    <header className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
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
              <img
                src="/logo-landscape.png"
                alt="ThermoNeural Logo"
                className="h-12 md:h-14 w-auto object-contain mix-blend-multiply scale-[1.25] origin-left"
              />
            </Link>
          </div>

          {!isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-8">
              <Link
                to="/features"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white font-medium transition-colors font-display"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white font-medium transition-colors font-display"
              >
                Pricing
              </Link>
              <Link
                to="/about"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white font-medium transition-colors font-display"
              >
                About
              </Link>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-800"></div>
              <Link
                to="/help-center"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white font-medium text-sm transition-colors font-display"
              >
                Help
              </Link>
              <Link
                to="/contact"
                className="text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white font-medium text-sm transition-colors font-display"
              >
                Support
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
            <ModeToggle />
            {isAuthenticated ? (
              <>
                <span className="text-sm text-gray-600 hidden md:block">
                  {user?.email}
                </span>
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    className="text-blue-600 hover:text-blue-700 lg:hidden"
                  >
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="hidden md:flex"
                >
                  Sign Out
                </Button>

                {/* Mobile menu for authenticated users */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button
                    variant="ghost"
                    className="text-slate-700 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 shadow-md shadow-blue-500/20 transition-all hover:scale-105">
                    Start Free Trial
                  </Button>
                </Link>

                {/* Mobile menu for non-authenticated users */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu for non-authenticated users */}
        {isMobileMenuOpen && !isAuthenticated && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              <Link
                to="/features"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>

              <Link
                to="/about"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <div className="h-px bg-gray-200"></div>
              <Link
                to="/help-center"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Help Center
              </Link>
              <Link
                to="/contact"
                className="text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-sm"
              >
                Contact Support
              </Link>
              <div className="pt-4 border-t border-gray-200 dark:border-slate-800">
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </nav>
          </div>
        )}

        {/* Mobile menu for authenticated users - existing functionality */}
        {isMobileMenuOpen && isAuthenticated && (
          <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
            <nav className="flex flex-col space-y-4">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <div className="flex items-center space-x-2 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">{user?.email}</span>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/profile");
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1"
                >
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSignOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex-1"
                >
                  Sign Out
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
