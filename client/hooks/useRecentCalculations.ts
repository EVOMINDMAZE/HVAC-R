import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";

export type RecentCalculation = {
  id: string;
  created_at: string;
  calculation_type: string;
  name?: string | null;
};

function transformRow(row: any): RecentCalculation {
  return {
    id: String(row.id),
    created_at: String(row.created_at),
    calculation_type: String(row.type || row.calculation_type || "unknown"),
    name: typeof row.name === "string" ? row.name : null,
  };
}

export function useRecentCalculations(options?: { limit?: number; enabled?: boolean }) {
  const enabled = options?.enabled ?? true;
  const limit = Math.max(1, Math.min(20, options?.limit ?? 6));
  const { user } = useSupabaseAuth();

  const [calculations, setCalculations] = useState<RecentCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const lastFetchRef = useRef<number>(0);

  const queryKey = useMemo(() => `${user?.id || "anon"}::${limit}`, [user?.id, limit]);

  useEffect(() => {
    if (!enabled) {
      setCalculations([]);
      setIsLoading(false);
      return;
    }

    if (!user || !supabase) {
      setCalculations([]);
      setIsLoading(false);
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < 10_000) {
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const { data, error } = await supabase
        .from("calculations")
        .select("id, created_at, type, calculation_type, name")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (cancelled) return;
      if (error) throw error;

      const normalized = Array.isArray(data) ? data.map(transformRow) : [];
      setCalculations(normalized);
      lastFetchRef.current = now;
      setIsLoading(false);
    })().catch(() => {
      if (cancelled) return;
      setCalculations([]);
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, limit, queryKey, user]);

  return { calculations, isLoading };
}

