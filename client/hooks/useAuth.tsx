import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from './useToast';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  company?: string;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check localStorage for auth token or user data
        const savedUser = localStorage.getItem('simulateon_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: '1',
        firstName: 'John',
        lastName: 'Doe',
        email: email,
        company: 'HVAC Solutions Inc.',
        role: 'Senior HVAC Engineer'
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUser(mockUser);
      localStorage.setItem('simulateon_user', JSON.stringify(mockUser));
      localStorage.setItem('simulateon_token', 'mock-jwt-token');
    } catch (error) {
      throw new Error('Login failed');
    }
  };

  const signup = async (userData: any) => {
    try {
      // TODO: Replace with actual API call
      const newUser: User = {
        id: Date.now().toString(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        company: userData.company,
        role: userData.role
      };

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      setUser(newUser);
      localStorage.setItem('simulateon_user', JSON.stringify(newUser));
      localStorage.setItem('simulateon_token', 'mock-jwt-token');
    } catch (error) {
      throw new Error('Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('simulateon_user');
    localStorage.removeItem('simulateon_token');
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
