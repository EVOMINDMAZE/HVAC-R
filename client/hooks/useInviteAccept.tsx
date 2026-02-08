import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { isTokenError } from "@/utils/authErrorHandler";

type InviteType = "code" | "link";

interface ValidationResult {
  valid: boolean;
  company_id?: string;
  company_name?: string;
  role?: string;
  expires_at?: string;
  error?: string;
}

interface UseInviteAcceptProps {
  inviteType: InviteType;
  prefilledValue?: string;
}

export function useInviteAccept({ inviteType, prefilledValue }: UseInviteAcceptProps) {
  const { user, refreshCompanies, companies, signOut } = useSupabaseAuth();
  const navigate = useNavigate();

  const [inviteValue, setInviteValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const validationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Set prefilled value
  useEffect(() => {
    if (prefilledValue) {
      setInviteValue(prefilledValue);
      validateInvite(prefilledValue);
    }
  }, [prefilledValue]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
    };
  }, []);

  const validateInvite = useCallback(async (value: string) => {
    if (!value || value.length < 6) {
      setValidationResult(null);
      setIsValidating(false);
      return;
    }

    try {
      setError(null);
      setIsValidating(true);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Validation timeout after 8 seconds")), 8000)
      );
      
      const rpcName = inviteType === "code" ? "validate_invite_code" : "validate_invitation_link";
      const paramName = inviteType === "code" ? "p_code" : "p_slug";
      
      const rpcPromise = supabase.rpc(rpcName, {
        [paramName]: value,
      });
      
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Validation error:", error);
        setError("Network error. Please check your connection and try again.");
        setValidationResult(null);
        return;
      }

      console.log("Validation result:", data);
      
      let result: ValidationResult;
      if (inviteType === "link" && data?.valid === true && data.invite) {
        // Flatten invite object for backward compatibility
        result = {
          ...data.invite,
          valid: true
        };
      } else {
        result = data;
      }
      
      setValidationResult(result);
      
      // Check for backend validation errors
      if (data?.valid === false) {
        const errorMsg = data.error || `Invalid or expired ${inviteType === "code" ? "invite code" : "invitation link"}`;
        let userMessage = errorMsg;
        
        // Map backend errors to user-friendly messages
        if (errorMsg.includes("expired")) {
          userMessage = `This ${inviteType === "code" ? "invite code" : "invitation link"} has expired. Please request a new one.`;
        } else if (errorMsg.includes("Max uses reached")) {
          userMessage = `This ${inviteType === "code" ? "invite code" : "invitation link"} has reached its maximum usage limit.`;
        } else if (errorMsg.includes("Invalid or expired")) {
          userMessage = `Invalid or expired ${inviteType === "code" ? "invite code" : "invitation link"}. Please check and try again.`;
        }
        
        setError(userMessage);
      }
    } catch (err: any) {
      console.error("Exception validating:", err);
      setError(err.message?.includes("timeout") 
        ? "Validation timed out. Please check your connection and try again."
        : `Failed to validate ${inviteType === "code" ? "invite code" : "invitation link"}. Please try again.`
      );
      setValidationResult(null);
    } finally {
      setIsValidating(false);
    }
  }, [inviteType]);

  const handleValueChange = useCallback((value: string) => {
    const upperValue = value.toUpperCase();
    setInviteValue(upperValue);
    
    // Clear any pending validation timeout
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
      validationTimeoutRef.current = null;
    }
    
    // Reset validation states when value changes
    if (upperValue.length !== 8) {
      setValidationResult(null);
      setError(null);
      setIsValidating(false);
      return;
    }
    
    // Only validate when we have exactly 8 characters
    if (upperValue.length === 8) {
      // Debounce validation to avoid rapid API calls
      validationTimeoutRef.current = setTimeout(() => {
        validateInvite(upperValue);
      }, 500); // 500ms debounce
    }
  }, [validateInvite]);

  const handleJoin = useCallback(async () => {
    if (!user) {
      // If not authenticated, redirect to signup with the value
      navigate(`/signup?code=${inviteValue}`);
      return;
    }

    if (!validationResult || validationResult?.valid !== true) {
      setError(`Please enter a valid ${inviteType === "code" ? "invite code" : "invitation link"}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. Local Check (Optimization)
      // If we already have companies loaded, check if we're a member of this one.
      if (companies.length > 0 && validationResult?.company_id) {
         const existingCompany = companies.find(c => c.company_id === validationResult.company_id);
         if (existingCompany) {
            console.log("User is already a member (local check). Redirecting to appropriate workspace...");
            // Force refresh to ensure global state is in sync
            await refreshCompanies();
            // Redirect based on role
            if (existingCompany.role === "tech" || existingCompany.role === "technician") {
               navigate("/tech");
            } else if (existingCompany.role === "client") {
               navigate("/portal");
            } else {
               navigate("/dashboard");
            }
            return;
         }
      }

      // 2. RPC Call with timeout
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Join timeout after 10 seconds")), 10000)
      );
      const rpcName = inviteType === "code" ? "use_invite_code" : "use_invitation_link";
      const paramName = inviteType === "code" ? "p_code" : "p_slug";
      
      const rpcPromise = supabase.rpc(rpcName, {
        [paramName]: inviteValue,
      });
      const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

      if (error) {
        console.error("Join error:", error);
        
        if (isTokenError(error)) {
          console.error("Token error detected. Signing out and redirecting to login.");
          setError("Your session has expired. Please sign in again.");
          await signOut();
          setTimeout(() => navigate("/signin"), 1500);
          return;
        }
        
        if (error.message?.includes("user_roles_user_id_fkey")) {
           console.error("Critical Auth Error: User ID missing from database. Signing out.");
           setError("Session expired. Please sign in again.");
           await signOut();
           setTimeout(() => navigate("/signin"), 1500);
           return;
        } else if (error.message?.includes("Already a member")) {
           // Force refresh to ensure global state is in sync
           await refreshCompanies();
           // Redirect based on the role from the invite
           if (validationResult?.role === "tech" || validationResult?.role === "technician") {
              navigate("/tech");
           } else if (validationResult?.role === "client") {
              navigate("/portal");
           } else {
              navigate("/dashboard");
           }
        } else {
           setError(error.message || `Failed to join company`);
        }
        return;
      }

      console.log("Join result:", data);

      const successFlag = inviteType === "code" ? data?.valid : data?.success;
      if (successFlag) {
        setSuccess(true);
        // Refresh companies and redirect
        await refreshCompanies();
        setTimeout(() => {
          navigate("/select-company");
        }, 2000);
      } else {
        setError(data?.error || `Failed to join company`);
      }
    } catch (err: any) {
      console.error("Exception joining:", err);
      
      if (isTokenError(err)) {
        console.error("Token error detected in catch block. Signing out and redirecting to login.");
        setError("Your session has expired. Please sign in again.");
        await signOut();
        setTimeout(() => navigate("/signin"), 1500);
        return;
      }
      
      setError(err.message || `Failed to join company`);
    } finally {
      setIsLoading(false);
    }
  }, [
    user,
    inviteValue,
    validationResult,
    inviteType,
    companies,
    refreshCompanies,
    navigate,
    signOut,
  ]);

  return {
    inviteValue,
    setInviteValue: handleValueChange,
    isLoading,
    isValidating,
    validationResult,
    error,
    success,
    handleJoin,
    inviteType,
  };
}