import { Button } from "@/components/ui/button";
import { Calculator, User, Menu, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";
import { useState } from "react";

interface HeaderProps {
  variant?: 'landing' | 'dashboard';
}

export function Header({ variant = 'landing' }: HeaderProps) {
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
        type: 'success',
        title: 'Signed Out',
        description: 'You have been signed out successfully'
      });
      navigate("/");
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Sign Out Failed',
        description: err.message || 'Failed to sign out'
      });
    }
  };

  if (variant === 'dashboard') {
    return (
      <div className="bg-white shadow-sm border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 py-6 overflow-hidden">
          <div className="flex justify-between items-center min-w-0">
            <div className="flex items-center space-x-8 min-w-0">
              <div className="min-w-0">
                <Link to="/dashboard">
                  <h1 className="text-3xl font-bold text-blue-900 cursor-pointer hover:text-blue-700">
                    Simulateon
                  </h1>
                </Link>
                <p className="text-blue-600 mt-1 truncate max-w-[14rem] sm:max-w-xs md:max-w-sm lg:max-w-md">
                  Welcome back, {user?.email?.split('@')[0] || "Engineer"}
                </p>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-6 flex-shrink-0">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/standard-cycle"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Standard Cycle
                </Link>
                <Link
                  to="/refrigerant-comparison"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Comparison
                </Link>
                <Link
                  to="/cascade-cycle"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  Cascade
                </Link>
                <Link
                  to="/history"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                >
                  History
                </Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4 min-w-0">
              <span className="text-sm text-gray-600 hidden md:block truncate max-w-[12rem]">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile")}
                className="hidden md:flex whitespace-nowrap"
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="hidden md:flex"
              >
                Sign Out
              </Button>

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 pt-4 border-t border-gray-200">
              <nav className="flex flex-col space-y-4">
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <Link
                  to="/standard-cycle"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Standard Cycle
                </Link>
                <Link
                  to="/refrigerant-comparison"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Comparison
                </Link>
                <Link
                  to="/cascade-cycle"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Cascade
                </Link>
                <Link
                  to="/history"
                  className="text-gray-600 hover:text-blue-600 font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  History
                </Link>
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
                <p className="text-xs text-blue-600 font-medium">Professional Refrigeration Analysis</p>
              )}
            </div>
          </div>

          {/* Navigation for non-authenticated users */}
          {!isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-6">
              <Link to="/features" className="text-gray-700 hover:text-blue-600 font-medium">
                Features
              </Link>
              <Link to="/pricing" className="text-gray-700 hover:text-blue-600 font-medium">
                Pricing
              </Link>
              <Link to="/api-docs" className="text-gray-700 hover:text-blue-600 font-medium">
                API Docs
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-blue-600 font-medium">
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
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
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
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </Button>
              </>
            ) : (
              <>
                <Link to="/signin">
                  <Button variant="ghost" className="text-blue-600 hover:text-blue-700">
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
                  {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link
                to="/standard-cycle"
                className="text-gray-600 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Standard Cycle
              </Link>
              <Link
                to="/refrigerant-comparison"
                className="text-gray-600 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Comparison
              </Link>
              <Link
                to="/cascade-cycle"
                className="text-gray-600 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Cascade
              </Link>
              <Link
                to="/history"
                className="text-gray-600 hover:text-blue-600 font-medium"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                History
              </Link>
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
