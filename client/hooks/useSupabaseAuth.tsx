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
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateUser: (updates: { data: any }) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
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

    // Get initial session with error handling, but first verify Supabase host is reachable
    const getInitialSession = async () => {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;

      // Quick connectivity check to avoid unhandled fetch failures from supabase-js
      if (supabaseUrl) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3000);
          await fetch(supabaseUrl, { method: 'GET', mode: 'cors', signal: controller.signal });
          clearTimeout(timeoutId);
        } catch (err: any) {
          console.warn('Supabase host unreachable, disabling auth: ', err?.message || err);
          // Clear any existing stored session tokens to prevent supabase-js from attempting refresh
          try {
            localStorage.removeItem('supabase.auth.token');
            sessionStorage.removeItem('supabase.auth.token');
          } catch (e) {
            // ignore
          }
          setIsLoading(false);
          setSession(null);
          setUser(null);
          return;
        }
      }

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        // Handle invalid refresh token error
        if (error && error.message.includes('Invalid Refresh Token')) {
          console.warn('Invalid refresh token detected, clearing session');
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
      } catch (err: any) {
        console.error('Error getting session:', err);
        // Clear session on any auth error
        setSession(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    await getInitialSession();

    // Listen for auth changes with error handling
    let subscription: any = { unsubscribe: () => {} };
    try {
      const sub = supabase.auth.onAuthStateChange(
        async (event, session) => {
          // Handle token refresh errors
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('Token refresh failed, user will be signed out');
          }

          // Handle sign out event or invalid sessions
          if (event === 'SIGNED_OUT' || !session) {
            setSession(null);
            setUser(null);
          } else {
            setSession(session);
            setUser(session.user);
          }

          setIsLoading(false);
        }
      );
      subscription = sub.data?.subscription ?? sub;
    } catch (err) {
      console.warn('Failed to subscribe to auth state changes:', err);
    }

    return () => subscription.unsubscribe ? subscription.unsubscribe() : undefined;
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

  const signInWithGoogle = async () => {
    if (!supabase) {
      return { error: { message: 'Supabase not configured' } as any };
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    return { error };
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

    try {
      const { error } = await supabase.auth.updateUser(updates);

      // Handle refresh token errors
      if (error && error.message.includes('Invalid Refresh Token')) {
        console.warn('Invalid refresh token during user update, signing out');
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
        return { error: { message: 'Session expired, please sign in again' } as any };
      }

      return { error };
    } catch (err: any) {
      console.error('Error updating user:', err);
      return { error: err };
    }
  };

  const refreshSession = async () => {
    if (!supabase) return;

    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();

      if (error) {
        console.warn('Session refresh failed:', error.message);
        // If refresh fails, sign out
        await supabase.auth.signOut();
        setSession(null);
        setUser(null);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
      await supabase.auth.signOut();
      setSession(null);
      setUser(null);
    }
  };

  const value = {
    user,
    session,
    isAuthenticated: !!user,
    isLoading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateUser,
    refreshSession,
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
