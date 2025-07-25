import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateUser: (updates: { data: any }) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if Supabase client is available
    if (!supabase) {
      console.warn('Supabase client not available - auth functionality disabled');
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) {
      return { user: null, error: { message: 'Supabase not configured' } as any };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { user: data.user, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) {
      return { user: null, error: { message: 'Supabase not configured' } as any };
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { user: data.user, error };
  };

  const signOut = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as any };
    }
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const updateUser = async (updates: { data: any }) => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as any };
    }
    const { error } = await supabase.auth.updateUser(updates);
    return { error };
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSupabaseAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useSupabaseAuth must be used within a SupabaseAuthProvider');
  }
  return context;
}
