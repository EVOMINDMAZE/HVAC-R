import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface RecommendedRangeData {
  evap_temp_c: number | null | undefined;
  cond_temp_c: number | null | undefined;
  superheat_c: number | null | undefined;
  subcooling_c: number | null | undefined;
  notes?: string | null;
}

interface Options {
  context?: Record<string, unknown> | null;
  model?: string | null;
  auto?: boolean; // auto-fetch on key change (default true)
}

export function useOllamaRecommendedRange(
  refrigerant: string | null | undefined,
  opts: Options = {},
) {
  const { context = null, model = null, auto = true } = opts;
  const [data, setData] = useState<RecommendedRangeData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastKey = useRef<string | null>(null);

  const fetchRange = useCallback(async () => {
    setError(null);
    if (!refrigerant) {
      setData(null);
      return;
    }
    if (!supabase) {
      setError("Supabase not configured");
      return;
    }
    setLoading(true);
    try {
      const { data: resp, error: fnError } = await supabase.functions.invoke(
        "recommended-range",
        {
          body: {
            refrigerant,
            context,
            model,
          },
        },
      );

      if (fnError) {
        throw fnError;
      }

      const payload = (resp?.data ?? resp) as any;
      const parsed: RecommendedRangeData = {
        evap_temp_c: payload?.evap_temp_c ?? null,
        cond_temp_c: payload?.cond_temp_c ?? null,
        superheat_c: payload?.superheat_c ?? null,
        subcooling_c: payload?.subcooling_c ?? null,
        notes: payload?.notes ?? null,
      };
      setData(parsed);
    } catch (e: any) {
      const msg = e?.message || String(e);
      setError(msg);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [refrigerant, context, model]);

  useEffect(() => {
    if (!auto) return;
    const key = refrigerant || "";
    if (lastKey.current === key) return;
    lastKey.current = key;
    void fetchRange();
  }, [refrigerant, auto, fetchRange]);

  return { data, loading, error, refresh: fetchRange };
}
