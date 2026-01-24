import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import type { User, Session, AuthError } from '@supabase/supabase-js';

type UserRole = 'admin' | 'client' | null;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  signUp: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null; role: UserRole }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  updateUser: (updates: { data: any }) => Promise<{ error: AuthError | null }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to fetch role with fallback
  const fetchUserRole = async (userId: string): Promise<UserRole> => {
    console.log('[fetchUserRole] Starting role fetch for user:', userId);
    try {
      // 1. Try fetching from user_roles
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      console.log('[fetchUserRole] user_roles query result:', { roleData, roleError });

      // If we got data, use it regardless of any error
      if (roleData && roleData.role) {
        console.log('[fetchUserRole] Found role in user_roles:', roleData.role);
        return roleData.role as UserRole;
      }

      // Only proceed to fallback if there's no role data (not just an error)
      if (roleError) {
        console.log('[fetchUserRole] user_roles query error, trying fallback:', roleError.message);
      }

      // 2. Fallback for Legacy Admins (Check companies table)
      // If user_roles doesn't exist or user not found, check if they own a company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', userId)
        .single();

      console.log('[fetchUserRole] companies fallback result:', { companyData, companyError });

      if (companyData) {
        console.log('[fetchUserRole] User owns a company, assigning admin role');
        return 'admin';
      }

      // 3. Last Result: Hardcoded check for main admin to prevent lockout
      // TODO: Remove this once RLS/Query reliability is confirmed
      if (userId === 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65') {
        console.log('[fetchUserRole] Recovery: Detected Admin ID, forcing admin role');
        return 'admin';
      }

      // 4. Default to null (Not client)
      // defaulting to client causes admins to be redirected to portal if query fails
      console.log('[fetchUserRole] No role found, returning null');
      return null;

    } catch (error) {
      console.error('[fetchUserRole] Critical error:', error);
      // Recovery for admin
      if (userId === 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65') return 'admin';
      return null;
    }
  };

  useEffect(() => {
    if (!supabase) {
      console.warn('Supabase client not available - auth functionality disabled');
      setIsLoading(false);
      return;
    }

    const getInitialSession = async () => {
      try {
        // Create a timeout promise that rejects after 5 seconds
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Session fetch timeout')), 5000)
        );

        // Race between getSession and timeout
        const { data: { session }, error } = await Promise.race([
          supabase.auth.getSession(),
          timeoutPromise.then(() => { throw new Error('Session fetch timeout') })
        ]) as any;

        if (error && error.message.includes('Invalid Refresh Token')) {
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          const r = await fetchUserRole(session.user.id);
          setRole(r);
        } else {
          setRole(null);
        }

      } catch (err: any) {
        console.warn('Error getting session or timeout:', err);
        // Don't clear session if it was just a timeout, maybe onAuthStateChange will catch it
        // But safe to assume no session if timeout
        if (err.message === 'Session fetch timeout') {
          // Proceed as logged out
          setSession(null);
          setUser(null);
          setRole(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    let subscription: any = { unsubscribe: () => { } };
    try {
      const sub = supabase.auth.onAuthStateChange(
        async (event, session) => {
          if (event === 'TOKEN_REFRESHED' && !session) {
            console.warn('Token refresh failed');
          }

          if (event === 'SIGNED_OUT' || !session) {
            setSession(null);
            setUser(null);
            setRole(null);
          } else {
            setSession(session);
            setUser(session.user);
            // Fetch role if user changed or just signed in
            if (session.user) {
              const r = await fetchUserRole(session.user.id);
              setRole(r);
            }
          }
          setIsLoading(false);
        }
      );
      subscription = (sub as any).data?.subscription ?? (sub as any);
    } catch (err) {
      console.warn('Failed to subscribe:', err);
    }

    return () => (subscription && subscription.unsubscribe ? subscription.unsubscribe() : undefined);
  }, []);

  const signUp = async (email: string, password: string) => {
    if (!supabase) return { user: null, error: { message: 'No Supabase' } as any };
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { user: data.user, error };
  };

  const signIn = async (email: string, password: string) => {
    if (!supabase) return { user: null, error: { message: 'No Supabase' } as any, role: null as UserRole };
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    let fetchedRole: UserRole = null;
    if (data.user) {
      fetchedRole = await fetchUserRole(data.user.id);
      setRole(fetchedRole);
    }
    return { user: data.user, error, role: fetchedRole };
  };

  const signInWithGoogle = async () => {
    if (!supabase) return { error: { message: 'No Supabase' } as any };
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    });
    return { error };
  };

  const signOut = async () => {
    if (!supabase) return { error: { message: 'No Supabase' } as any };
    const { error } = await supabase.auth.signOut();
    setRole(null);
    return { error };
  };

  const updateUser = async (updates: { data: any }) => {
    if (!supabase) return { error: { message: 'No Supabase' } as any };
    try {
      const { error } = await supabase.auth.updateUser(updates);
      if (error && error.message.includes('Invalid Refresh Token')) {
        await supabase.auth.signOut();
        return { error: { message: 'Session expired' } as any };
      }
      return { error };
    } catch (err: any) {
      return { error: err };
    }
  };

  const refreshSession = async () => {
    if (!supabase) return;
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      if (error) {
        await supabase.auth.signOut();
      } else {
        setSession(session);
        setUser(session?.user ?? null);
      }
    } catch (err) {
      await supabase.auth.signOut();
    }
  };

  const value = {
    user,
    session,
    role,
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
