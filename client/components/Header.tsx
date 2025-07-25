import { Button } from "@/components/ui/button";
import { Calculator, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/useToast";

interface HeaderProps {
  variant?: 'landing' | 'dashboard';
}

export function Header({ variant = 'landing' }: HeaderProps) {
  const { user, isAuthenticated, signOut } = useSupabaseAuth();
  const navigate = useNavigate();
  const { addToast } = useToast();

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
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-blue-900">Simulateon</h1>
              <p className="text-blue-600 mt-1">
                Welcome back, {user?.email?.split('@')[0] || "Engineer"}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.email}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/profile")}
              >
                <User className="h-4 w-4 mr-2" />
                Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-blue-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Calculator className="h-8 w-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-blue-900">Simulateon</h1>
        </div>
        <div className="flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <span className="text-sm text-gray-600">
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
              >
                Sign Out
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
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Get Started Free
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
