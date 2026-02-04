import { useEffect, useState, createContext, useContext } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'client' | 'tech' | 'manager' | 'student' | 'technician';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  companyId: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<{ user: User | null, error: any, role: UserRole | null }>;
  signUp: (email: string, password: string) => Promise<{ user: User | null, error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  updateUser: (attributes: any) => Promise<{ data: { user: User | null }, error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const SupabaseAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const auth = useSupabaseAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseAuthProvider');
  }
  return context;
};

// Maintain useSupabaseAuth as the primary hook for backward compatibility and internal use
export const useSupabaseAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AuthDebug] SignIn Error:', error);
        return { user: null, error, role: null };
      }

      if (data.user) {
        const { role } = await fetchUserRoleData(data.user);
        return { user: data.user, error: null, role };
      }

      return { user: null, error: new Error('User not found'), role: null };
    } catch (err) {
      return { user: null, error: err, role: null };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      return { user: data.user, error };
    } catch (err) {
      return { user: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });
      return { error };
    } catch (err) {
      return { error: err };
    }
  };

  const updateUser = async (attributes: any) => {
    try {
      const { data, error } = await supabase.auth.updateUser(attributes);
      return { data, error };
    } catch (err) {
      return { data: { user: null }, error: err };
    }
  };

  const fetchUserRoleData = async (currentUser: User) => {
    console.log('[fetchUserRoleData] Starting for user:', currentUser.id);
    if (!currentUser) return { role: null, companyId: null };

    // Helper for timeout
    const withTimeout = (promise: Promise<any>, timeoutMs: number = 10000) => {
      return Promise.race([
        promise,
        new Error('Timeout after ' + timeoutMs + 'ms')
      ]);
    };

    try {
      console.log('[fetchUserRoleData] Querying user_roles...');
      const rolePromise = supabase
        .from('user_roles')
        .select('role, company_id')
        .eq('user_id', currentUser.id)
        .limit(1);

      const result = await Promise.race([
        rolePromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 10000))
      ]) as any;

      const { data: roleData, error: tableError } = result;

      if (tableError) console.log('[fetchUserRoleData] user_roles error:', tableError.message);

      if (roleData && roleData.length > 0) {
        console.log('[fetchUserRoleData] Found role in user_roles:', roleData[0].role);
        return { role: roleData[0].role as UserRole, companyId: roleData[0].company_id };
      }

      console.log('[fetchUserRoleData] Falling back to companies...');
      const companyPromise = supabase
        .from('companies')
        .select('id')
        .eq('user_id', currentUser.id)
        .limit(1);

      const compResult = await Promise.race([
        companyPromise,
        new Promise((_, reject) => setTimeout(() => reject(new Error('DB Timeout')), 10000))
      ]) as any;

      const { data: companyData, error: companyError } = compResult;

      if (companyError) console.log('[fetchUserRoleData] companies error:', companyError.message);

      if (companyData && companyData.length > 0) {
        console.log('[fetchUserRoleData] Found ownership in companies:', companyData[0].id);
        return { role: 'admin' as UserRole, companyId: companyData[0].id };
      }
    } catch (err) {
      console.error('[fetchUserRoleData] Table fetch catch error:', err);
    }

    console.log('[fetchUserRoleData] No role found, returning null');
    return { role: null, companyId: null };
  };

  useEffect(() => {
    const initializeSession = async () => {

      try {

        const { data: { session }, error } = await supabase.auth.getSession();


        if (error) throw error;

        if (session) {
          setSession(session);
          setUser(session.user);
          const { role, companyId } = await fetchUserRoleData(session.user);
          setRole(role);
          setCompanyId(companyId);
        } else {

        }
        /* else if (process.env.NODE_ENV === 'test' || window.location.hostname === 'localhost') {
          // This block was for local testing/development to bypass Supabase auth
          // when running in test environments or on localhost without a real session.
          // It would set a fake session and user for 'admin@admin.com'.
          // This has been commented out to ensure real authentication is always used.
          // console.log('[useSupabaseAuth] Faking session for local/test environment');
          // const fakeUser: User = {
          //   id: 'fake-admin-id',
          //   aud: 'authenticated',
          //   role: 'authenticated',
          //   email: 'admin@admin.com',
          //   email_confirmed_at: new Date().toISOString(),
          //   phone: '',
          //   confirmed_at: new Date().toISOString(),
          //   last_sign_in_at: new Date().toISOString(),
          //   app_metadata: { provider: 'email', providers: ['email'] },
          //   user_metadata: {},
          //   created_at: new Date().toISOString(),
          //   updated_at: new Date().toISOString(),
          // };
          // const fakeSession: Session = {
          //   access_token: 'fake-access-token',
          //   token_type: 'Bearer',
          //   expires_in: 3600,
          //   expires_at: Math.floor(Date.now() / 1000) + 3600,
          //   refresh_token: 'fake-refresh-token',
          //   user: fakeUser,
          // };
          // setSession(fakeSession);
          // setUser(fakeUser);
          // setRole('admin');
          // setCompanyId('087da65b-4ea6-4d93-ba07-03ba6f88a7de');
        } */
      } catch (err) {
        console.error('[useSupabaseAuth] Initialization error:', err);
      } finally {

        setIsLoading(false);
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('[AuthDebug] Auth State Change:', event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRoleData(session.user).then(({ role, companyId }) => {
          setRole(role);
          setCompanyId(companyId);
          setIsLoading(false);
        });
      } else {
        setRole(null);
        setCompanyId(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    user,
    role,
    companyId,
    isLoading,
    isAuthenticated: !!session,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateUser
  };
};
