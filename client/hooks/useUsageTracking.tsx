import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';

interface UsageResult {
  success: boolean;
  limit_exceeded?: boolean;
  current_count?: number;
  limit?: number | null;
  period?: string;
  error?: string;
}

interface UsageTracking {
  incrementUsage: (
    feature: string,
    limit?: number | null
  ) => Promise<UsageResult>;
  getUsage: (feature: string) => Promise<UsageResult>;
  isLoading: boolean;
  error: string | null;
}

export function useUsageTracking(): UsageTracking {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, companies } = useSupabaseAuth();

  // Get current company ID (first company if available, otherwise null)
  const getCompanyId = useCallback((): string | null => {
    if (!companies || companies.length === 0) return null;
    // TODO: Support selected company if we implement company switching
    return companies[0]?.company_id || null;
  }, [companies]);

  const incrementUsage = useCallback(
    async (feature: string, limit?: number | null): Promise<UsageResult> => {
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const companyId = getCompanyId();
        const { data, error } = await supabase.rpc('increment_usage', {
          p_user_id: user.id,
          p_company_id: companyId,
          p_feature: feature,
          p_limit: limit,
        });

        if (error) {
          throw new Error(error.message);
        }

        // The RPC returns JSONB, which gets parsed as object
        const result = data as UsageResult;
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, getCompanyId]
  );

  const getUsage = useCallback(
    async (feature: string): Promise<UsageResult> => {
      if (!user) {
        return {
          success: false,
          error: 'User not authenticated',
        };
      }

      setIsLoading(true);
      setError(null);

      try {
        const companyId = getCompanyId();
        const { data, error } = await supabase.rpc('get_usage', {
          p_user_id: user.id,
          p_company_id: companyId,
          p_feature: feature,
        });

        if (error) {
          throw new Error(error.message);
        }

        const result = data as UsageResult;
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsLoading(false);
      }
    },
    [user, getCompanyId]
  );

  return {
    incrementUsage,
    getUsage,
    isLoading,
    error,
  };
}