import { Button } from "@/components/ui/button";
import { Calculator, User, Menu, X } from "lucide-react";
import { NavLink, Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";
import { NAV_ITEMS } from "@/components/navigation";

interface HeaderProps {
  variant?: "landing" | "dashboard";
  onOpenSearch?: () => void;
}

export function Header({ variant = "landing", onOpenSearch }: HeaderProps) {
  const { user, isAuthenticated, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      addToast({
        type: "success",
        title: "Signed Out",
        description: "You have been signed out successfully",
      });
      navigate("/");
    } catch (err: any) {
      addToast({
        type: "error",
        title: "Sign Out Failed",
        description: err.message || "Failed to sign out",
      });
    }
  };

  if (variant === "dashboard") {
    const initials = user?.email ? user.email.split("@")[0].slice(0, 2).toUpperCase() : "U";

    return (
      <div className="bg-white/90 backdrop-blur-sm border-b border-blue-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="rounded-md bg-gradient-to-br from-blue-600 to-sky-500 p-2 shadow-md">
                  <Calculator className="h-6 w-6 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-lg font-bold text-blue-900 truncate">
                    Simulateon
                  </div>
                  <p className="text-xs text-muted-foreground truncate max-w-xs">Your workspace & analysis hub</p>
                </div>
              </div>

              {/* Desktop search */}
              <div className="hidden md:block ml-6">
                <div className="relative">
                  <input
                    placeholder="Search calculations, projects or tools..."
                    className="w-48 md:w-96 rounded-md border border-input bg-background px-4 py-2 text-sm focus:ring-2 focus:ring-blue-200"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">⌘K</div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <nav className="hidden">
                {/* Header horizontal nav intentionally hidden for dashboard to avoid duplication with Sidebar */}
              </nav>

              <div className="flex items-center gap-3">
                <div className="hidden">
                  {/* NAV_ITEMS hidden in header on dashboard - use Sidebar for navigation */}
                </div>

                <div className="flex items-center space-x-3">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm text-muted-foreground truncate max-w-[12rem]">{user?.email}</span>
                    <span className="text-xs text-gray-400">{user?.user_metadata?.full_name ?? ''}</span>
                  </div>
                  <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">{initials}</div>
                </div>

                <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-100">
              <nav className="flex flex-col space-y-3">
                {NAV_ITEMS.map((item) => (
                  <Link key={item.to} to={item.to} className="text-gray-700 hover:text-blue-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>{item.label}</Link>
                ))}
                <div className="pt-3 border-t border-gray-100">
                  <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }}>Profile</Button>
                  <Button variant="destructive" size="sm" className="w-full" onClick={() => { handleSignOut(); setIsMobileMenuOpen(false); }}>Sign Out</Button>
                </div>
              </nav>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <h1 className="text-2xl font-bold text-blue-900">Simulateon</h1>
              {!isAuthenticated && (
                <p className="text-xs text-blue-600 font-medium">
                  Professional Refrigeration Analysis
                </p>
              )}
            </div>
          </div>

          {/* Navigation for non-authenticated users */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link
                to="/features"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                Pricing
              </Link>
              <Link
                to="/api-docs"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                API Docs
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-blue-600 font-medium"
              >
                About
              </Link>
            </nav>
          )}

          <div className="flex items-center space-x-4">
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
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Sign In
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button className="bg-blue-600 hover:bg-blue-700 font-semibold px-6">
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
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                to="/pricing"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                to="/api-docs"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                API Docs
              </Link>
              <Link
                to="/about"
                className="text-gray-700 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                About
              </Link>
              <div className="pt-4 border-t border-gray-200">
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 font-semibold">
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
                <Link key={item.to} to={item.to} className="text-gray-600 hover:text-blue-600 font-medium" onClick={() => setIsMobileMenuOpen(false)}>
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
