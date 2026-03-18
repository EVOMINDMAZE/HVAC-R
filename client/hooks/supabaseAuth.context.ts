import { createContext, useContext } from "react";

import { MultiCompanyAuthContextType } from "./supabaseAuth.types";

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

export { MultiCompanyAuthContext };