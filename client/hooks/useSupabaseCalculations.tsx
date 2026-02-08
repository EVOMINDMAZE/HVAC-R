import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useToast } from "./useToast";
import { useSubscription } from "./useStripe";
import { extractErrorMessage, logError } from "@/lib/errorUtils";

export interface Calculation {
  id: string;
  user_id: string;
  created_at: string;
  calculation_type: string;
  inputs: any;
  results: any;
  name?: string;
}

export function useSupabaseCalculations() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasShownOfflineToast, setHasShownOfflineToast] = useState(false);
  const { user, companies } = useSupabaseAuth();
  const { addToast } = useToast();
  const { subscription } = useSubscription();
  const lastFetchRef = useRef<number>(0);
  const FETCH_COOLDOWN = 30000; // 30 second cooldown

  function transformFromDb(row: any): Calculation {
    return {
      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,
      calculation_type: row.type || row.calculation_type || "unknown",
      inputs: row.parameters || row.inputs || {},
      results: row.results || {},
      name: row.name,
    };
  }

  // Determine calculation limit based on subscription plan
  const getCalculationLimit = (): number | null => {
    const plan = subscription?.plan?.toLowerCase() || 'free';
    if (plan === 'free') return 10;
    // Pro, Business, solo, enterprise, professional are unlimited
    return null; // null means unlimited
  };

  const getCompanyId = (): string | null => {
    if (!companies || companies.length === 0) return null;
    return companies[0]?.company_id || null;
  };

  const fetchCalculations = async () => {
    if (!user) return;

    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_COOLDOWN) {
      return; // Skip if recently fetched
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("calculations")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (data && Array.isArray(data)) {
        const normalized = data.map(transformFromDb);
        setCalculations(normalized);
        lastFetchRef.current = now;

        try {
          localStorage.setItem(
            "simulateon:calculations",
            JSON.stringify(normalized),
          );
        } catch (e) {
          // ignore cache errors
        }
      } else if (error) {
        throw error;
      }
    } catch (error: any) {
      console.warn("Fetch error, using cache:", error);

      try {
        const cached = localStorage.getItem("simulateon:calculations");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setCalculations(parsed);
            if (!hasShownOfflineToast) {
              addToast({
                type: "info",
                title: "Offline mode",
                description: "Loaded cached calculations.",
              });
              setHasShownOfflineToast(true);
            }
          }
        }
      } catch (e) {
        // ignore
      }
    } finally {
      setIsLoading(false);
    }
  };

  const saveCalculation = async (
    calculationType: string,
    inputs: any,
    results: any,
    name?: string,
    metadata?: any,
  ): Promise<Calculation | null> => {
    if (!user || !supabase) {
      addToast({
        type: "error",
        title: "Error",
        description: "Please sign in",
      });
      return null;
    }

    try {
      // Track calculation usage
      const limit = getCalculationLimit();
      const companyId = getCompanyId();
      const { data: usageData, error: usageError } = await supabase
        .rpc('increment_usage', {
          p_user_id: user.id,
          p_company_id: companyId,
          p_feature: 'calculation',
          p_limit: limit,
        });

      if (usageError) throw usageError;

      // Check if limit exceeded
      if (usageData?.limit_exceeded) {
        addToast({
          type: "error",
          title: "Calculation Limit Exceeded",
          description: `Free plan limited to 10 calculations per month. Upgrade to Pro for unlimited calculations.`,
        });
        return null;
      }

      const { data, error } = await supabase
        .from("calculations")
        .insert({
          user_id: user.id,
          type: calculationType,
          parameters: inputs,
          results: results,
          name: name,
          ...(metadata || {}),
        })
        .select()
        .single();

      if (error) throw error;

      const saved = transformFromDb(data);
      setCalculations((prev) => [saved, ...prev]);
      lastFetchRef.current = 0; // Force refresh

      addToast({
        type: "success",
        title: "Saved",
        description: "Calculation saved",
      });
      return data;
    } catch (error: any) {
      logError("saveCalculation", error);
      addToast({
        type: "error",
        title: "Error",
        description: extractErrorMessage(error),
      });
      return null;
    }
  };

  const deleteCalculation = async (id: string): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCalculations((prev) => prev.filter((calc) => calc.id !== id));
      addToast({
        type: "success",
        title: "Deleted",
        description: "Calculation removed",
      });
      return true;
    } catch (error: any) {
      logError("deleteCalculation", error);
      addToast({ type: "error", title: "Error", description: error.message });
      return false;
    }
  };

  const updateCalculation = async (
    id: string,
    updates: { name?: string },
  ): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from("calculations")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setCalculations((prev) =>
        prev.map((calc) => (calc.id === id ? { ...calc, ...updates } : calc)),
      );
      addToast({
        type: "success",
        title: "Updated",
        description: "Changes saved",
      });
      return true;
    } catch (error: any) {
      logError("updateCalculation", error);
      addToast({ type: "error", title: "Error", description: error.message });
      return false;
    }
  };

  useEffect(() => {
    if (user) {
      fetchCalculations();
    } else {
      setCalculations([]);
    }
  }, [user]);

  const findMatchingCalculation = (inputs: any, results: any): Calculation | null => {
    if (!calculations.length) return null;
    const inputStr = JSON.stringify(inputs);
    const resultStr = JSON.stringify(results);
    const match = calculations.find(calc =>
        JSON.stringify(calc.inputs) === inputStr && JSON.stringify(calc.results) === resultStr
    );
    return match || null;
  };

  return {
    calculations,
    isLoading,
    saveCalculation,
    deleteCalculation,
    updateCalculation,
    findMatchingCalculation,
    refetch: fetchCalculations,
  };
}
