import { User } from '@/lib/api';

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    role?: string;
    phone?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}
