import { Session, User } from "@supabase/supabase-js";

export const COMPANIES_CACHE_TTL = 60 * 1000; // 1 minute

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

export interface MultiCompanyAuthContextType {
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