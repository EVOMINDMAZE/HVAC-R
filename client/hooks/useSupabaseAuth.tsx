import {
  useEffect,
  useState,
  createContext,
  useContext,
  useCallback,
  useRef,
  useDebugValue,
} from "react";
import { supabase } from "../lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import { isTokenError, AuthErrorHandler } from "../utils/authErrorHandler";

const COMPANIES_CACHE_TTL = 60 * 1000; // 1 minute

export type UserRole =
  | "admin"
  | "client"
  | "tech"
  | "manager"
  | "student"
  | "technician"
  | "owner";

export interface UserCompany {
  company_id: string;
  company_name: string;
  role: UserRole;
  is_owner: boolean;
}

export interface ActiveCompanyContext {
  company_id: string;
  company_name: string;
  role: UserRole;
}

interface MultiCompanyAuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  isRefreshing: boolean;
  isAuthenticated: boolean;
  role: UserRole | null;
  companyId: string | null;
  companies: UserCompany[];
  activeCompany: ActiveCompanyContext | null;
  needsCompanySelection: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: any; role: UserRole | null }>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ user: User | null; error: any }>;
  signOut: () => Promise<{ error: any }>;
  signInWithGoogle: () => Promise<{ error: any }>;
  updateUser: (
    attributes: any,
  ) => Promise<{ data: { user: User | null }; error: any }>;
  switchCompany: (
    companyId: string,
  ) => Promise<{ success: boolean; error?: string }>;
  getAllCompanies: () => Promise<UserCompany[]>;
  refreshCompanies: () => Promise<void>;
}

const MultiCompanyAuthContext = createContext<
  MultiCompanyAuthContextType | undefined
>(undefined);

export const useMultiCompanyAuth = () => {
  const context = useContext(MultiCompanyAuthContext);
  if (context === undefined) {
    throw new Error(
      "useMultiCompanyAuth must be used within a SupabaseAuthProvider",
    );
  }
  return context;
};

export const useAuth = () => {
  const context = useContext(MultiCompanyAuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within a SupabaseAuthProvider");
  }
  return {
    session: context.session,
    user: context.user,
    role: context.role,
    companyId: context.companyId,
    isLoading: context.isLoading,
    isRefreshing: context.isRefreshing,
    isAuthenticated: context.isAuthenticated,
    needsCompanySelection: context.needsCompanySelection,
    companies: context.companies,
    activeCompany: context.activeCompany,
    signIn: context.signIn,
    signUp: context.signUp,
    signOut: context.signOut,
    signInWithGoogle: context.signInWithGoogle,
    updateUser: context.updateUser,
  };
};

export const useSupabaseAuth = () => {
  return useContext(MultiCompanyAuthContext) as MultiCompanyAuthContextType;
};

export const SupabaseAuthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [companies, setCompanies] = useState<UserCompany[]>([]);
  const [activeCompany, setActiveCompanyState] =
    useState<ActiveCompanyContext | null>(null);
  const [needsCompanySelection, setNeedsCompanySelection] = useState(false);
  const [hasManuallySelected, setHasManuallySelected] = useState(false);

  // Mutex to prevent concurrent refreshCompanies calls
  const refreshLock = useRef(false);

  const fetchCompanies = useCallback(async (currentUser?: User | null): Promise<UserCompany[]> => {
    const u = currentUser || user;
    if (!u) {
      console.log("[useSupabaseAuth] No user for fetchCompanies, returning empty");
      return [];
    }
    
    // Check cache first
    const cacheKey = `companies_cache_${u.id}`;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        const now = Date.now();
        if (now - timestamp < COMPANIES_CACHE_TTL) {
          console.log("[useSupabaseAuth] Returning cached companies for user:", u.id);
          return data;
        }
        console.log("[useSupabaseAuth] Cache expired for user:", u.id);
      }
    } catch (e) {
      // Ignore cache errors
      console.log("[useSupabaseAuth] Cache read error:", e);
    }

    try {
      console.log("[useSupabaseAuth] Fetching companies via RPC v2 for user:", u.id);

      // Add timeout to prevent infinite loading
      const rpcPromise = supabase.rpc("get_user_companies_v2");
      const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
        setTimeout(() => reject(new Error("RPC timeout")), 10000)
      );

      const { data: companies, error } = await Promise.race([
        rpcPromise,
        timeoutPromise,
      ]) as any;

      if (error) {
        console.error(
          "[useSupabaseAuth] Error fetching companies via RPC v2:",
          JSON.stringify(error),
        );
        
        if (isTokenError(error)) {
          console.error("[useSupabaseAuth] Token error detected in fetchCompanies. Triggering auth error handler.");
          await AuthErrorHandler.handleAuthError(error);
        }
        
        return [];
      }

      console.log("[useSupabaseAuth] Companies fetched via RPC v2 result:", companies);
      
      // Map the results from get_user_companies_v2
      const mapped = (companies || []).map((c: any) => ({
        company_id: c.company_id,
        company_name: c.company_name,
        role: c.role,
        is_owner: c.is_owner
      })) as UserCompany[];

      // Store in cache
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          data: mapped,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.log("[useSupabaseAuth] Cache write error:", e);
      }

      return mapped;
    } catch (err: any) {
      console.error("[useSupabaseAuth] Fetch exception:", err);
      
      if (isTokenError(err)) {
        console.error("[useSupabaseAuth] Token error detected in catch block. Triggering auth error handler.");
        await AuthErrorHandler.handleAuthError(err);
      }
      
      return [];
    }
  }, [user]);

  const updateActiveCompany = useCallback(
    async (
      companyList: UserCompany[],
      metadataCompanyId?: string | null,
      manuallySelected = false,
    ) => {
      console.log("[useSupabaseAuth] updateActiveCompany", { 
        count: companyList.length, 
        metadataId: metadataCompanyId 
      });

      if (companyList.length === 0) {
        setActiveCompanyState(null);
        setRole(null);
        setCompanyId(null);
        setNeedsCompanySelection(true);
        return;
      }

      // Explicitly prioritize:
      // 1. Manually selected ID (metadata)
      // 2. The first company in the list
      const activeId = metadataCompanyId || companyList[0]?.company_id;
      const active = companyList.find((c) => c.company_id === activeId) || companyList[0];

      console.log("[useSupabaseAuth] Setting active company:", active.company_name, "role:", active.role);
      
      setActiveCompanyState({
        company_id: active.company_id,
        company_name: active.company_name,
        role: active.role,
      });
      setRole(active.role);
      setCompanyId(active.company_id);
      
      // Only require selection if there are MULTIPLE companies AND we haven't manually selected one yet
      setNeedsCompanySelection(companyList.length > 1 && !manuallySelected);
    },
    [],
  );

  const refreshCompanies = useCallback(
    async (manuallySelected = false, currentUser?: User | null) => {
      const u = currentUser || user;
      if (!u) {
        console.log("[useSupabaseAuth] refreshCompanies: no user, skipping");
        return;
      }

      // Prevent concurrent refresh calls
      if (refreshLock.current) {
        console.log("[useSupabaseAuth] refreshCompanies: already in progress, skipping");
        return;
      }

      const startTime = Date.now();
      console.group(`[useSupabaseAuth] refreshCompanies starting at ${new Date(startTime).toISOString()}`);
      console.log("[useSupabaseAuth] refreshCompanies args:", { manuallySelected, userId: u.id });
      
      refreshLock.current = true;
      setIsRefreshing(true);
      
      try {
        const companyList = await fetchCompanies(u);
        console.log("[useSupabaseAuth] refreshCompanies fetched:", companyList.length, "companies");
        
        setCompanies(companyList);
        
        await updateActiveCompany(
          companyList,
          u.user_metadata?.active_company_id,
          manuallySelected,
        );
        
        const endTime = Date.now();
        console.log(`[useSupabaseAuth] refreshCompanies completed in ${endTime - startTime}ms`);
      } catch (error) {
        console.error("[useSupabaseAuth] refreshCompanies error:", error);
        // Don't rethrow - component should handle gracefully
      } finally {
        refreshLock.current = false;
        setIsRefreshing(false);
        console.groupEnd();
      }
    },
    [user, fetchCompanies, updateActiveCompany],
  );

  const switchCompany = useCallback(
    async (
      companyId: string,
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: "Not authenticated" };
      }

      try {
        const { data, error } = await supabase.rpc("switch_company_context", {
          p_company_id: companyId,
        });

        if (error) {
          console.error("[MultiCompany] Switch error:", error);
          return { success: false, error: error.message };
        }

        setHasManuallySelected(true);
        await refreshCompanies(true);
        return { success: true };
      } catch (err: any) {
        console.error("[MultiCompany] Switch exception:", err);
        return { success: false, error: err.message };
      }
    },
    [user, refreshCompanies],
  );

  const getAllCompanies = useCallback(async (): Promise<UserCompany[]> => {
    return fetchCompanies();
  }, [fetchCompanies]);

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error, role: null };
      }

      if (data.user) {
        // We can't immediately get the role because we need to fetch companies.
        // We'll let the session listener handle state updates, but we'll try to return the role if possible.
        // For now, return null role and let navigation happen via useEffect or default.
        return { user: data.user, error: null, role: null };
      }

      return { user: null, error: new Error("User not found"), role: null };
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
    console.log("[useSupabaseAuth] signOut called");
    const maxRetries = 2;
    const baseDelay = 1000;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[useSupabaseAuth] Sign out attempt ${attempt + 1}/${maxRetries + 1}`);
        const { error } = await supabase.auth.signOut();
        
        if (error) {
          throw error;
        }
        
        console.log("[useSupabaseAuth] Sign out successful");
        // Always clear local state regardless of API success/failure
        setCompanies([]);
        setActiveCompanyState(null);
        setRole(null);
        setCompanyId(null);
        setNeedsCompanySelection(false);
        setSession(null);
        setUser(null);
        
        return { error: null };
      } catch (err: any) {
        console.error(`[useSupabaseAuth] Sign out attempt ${attempt + 1} failed:`, err);
        
        if (attempt === maxRetries) {
          // Final attempt failed, still clear local state for security
          console.log("[useSupabaseAuth] All sign out attempts failed, clearing local state anyway");
          setCompanies([]);
          setActiveCompanyState(null);
          setRole(null);
          setCompanyId(null);
          setNeedsCompanySelection(false);
          setSession(null);
          setUser(null);
          
          return { error: err };
        }
        
        // Wait with exponential backoff before retrying
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[useSupabaseAuth] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    // Should never reach here due to loop returns
    return { error: new Error("Sign out failed after all retries") };
  };

  const signInWithGoogle = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
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

  useEffect(() => {
    const checkSession = async () => {
      const startTime = Date.now();
      console.group(`[useSupabaseAuth] useEffect triggered - checkSession starting at ${new Date(startTime).toISOString()}`);
      
      // Set a safety timeout to ensure isLoading never stays true forever
      const loadingTimeoutId = setTimeout(() => {
        console.warn("[useSupabaseAuth] Loading timeout reached after 15 seconds, forcing isLoading to false");
        setIsLoading(false);
      }, 15000);

      try {
        const {
          data: { session },
          error: sessionError
        } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error("[useSupabaseAuth] getSession error:", sessionError);
        }
        
        console.log("[useSupabaseAuth] session found:", !!session, "user ID:", session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log("[useSupabaseAuth] fetching roles and companies...");
          // Use refreshCompanies instead of direct query
          await refreshCompanies(false, session.user);
          console.log("[useSupabaseAuth] roles and companies fetched.");
        }
      } catch (err) {
        console.error("[useSupabaseAuth] checkSession exception:", err);
      } finally {
        // Clear the safety timeout since we're done
        clearTimeout(loadingTimeoutId);
        
        // Use setTimeout to ensure React batch updates don't block UI thread
        setTimeout(() => {
          console.log("[useSupabaseAuth] setIsLoading(false) via setTimeout");
          setIsLoading(false);
          console.log("[useSupabaseAuth] isLoading after set:", false);
        }, 0);
        
        const endTime = Date.now();
        console.log(`[useSupabaseAuth] checkSession completed in ${endTime - startTime}ms`);
        console.groupEnd();
      }
    };

    checkSession();

    if (!supabase) {
      return;
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const eventTime = Date.now();
      console.group(`[useSupabaseAuth] Auth state change at ${new Date(eventTime).toISOString()}:`, event, session?.user?.id);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          console.log("[useSupabaseAuth] Fetching companies after sign in...");
          await refreshCompanies(false, session.user);
          console.log("[useSupabaseAuth] Companies refreshed after sign in.");
        }
      } else {
        console.log("[useSupabaseAuth] No session, clearing state");
        setRole(null);
        setCompanyId(null);
        setCompanies([]);
        setActiveCompanyState(null);
        setNeedsCompanySelection(false);
      }
      
      console.groupEnd();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value: MultiCompanyAuthContextType = {
    session,
    user,
    role,
    companyId,
    isLoading,
    isRefreshing,
    isAuthenticated: !!session,
    companies,
    activeCompany,
    needsCompanySelection,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    updateUser,
    switchCompany,
    getAllCompanies,
    refreshCompanies,
  };

  // Debug value for React DevTools
  useDebugValue({ 
    isLoading, 
    isAuthenticated: !!session, 
    user: user?.email, 
    role, 
    companyId,
    companiesCount: companies.length,
    needsCompanySelection 
  });

  return (
    <MultiCompanyAuthContext.Provider value={value}>
      {children}
    </MultiCompanyAuthContext.Provider>
  );
};
