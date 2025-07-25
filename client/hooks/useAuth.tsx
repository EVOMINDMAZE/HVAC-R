import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, User } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // This auth hook is deprecated - using Supabase auth instead
  // Disabled automatic auth check to prevent API calls to non-existent backend
  useEffect(() => {
    console.warn('Old useAuth hook is deprecated. Use useSupabaseAuth instead.');
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await apiClient.signIn({ email, password });

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Login failed');
    }

    const { user: userData, token } = response.data;

    setUser(userData);
    localStorage.setItem('simulateon_token', token);
    localStorage.setItem('simulateon_user', JSON.stringify(userData));
  };

  const signup = async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    role?: string;
    phone?: string;
  }) => {
    const response = await apiClient.signUp(userData);

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Signup failed');
    }

    const { user: newUser, token } = response.data;

    setUser(newUser);
    localStorage.setItem('simulateon_token', token);
    localStorage.setItem('simulateon_user', JSON.stringify(newUser));
  };

  const logout = async () => {
    try {
      await apiClient.signOut();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('simulateon_token');
      localStorage.removeItem('simulateon_user');
    }
  };

  const refreshUser = async () => {
    try {
      const response = await apiClient.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data.user);
        localStorage.setItem('simulateon_user', JSON.stringify(response.data.user));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    signup,
    logout,
    refreshUser
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
