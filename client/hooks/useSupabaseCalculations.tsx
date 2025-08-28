import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from './useToast';
import { extractErrorMessage, logError } from '@/lib/errorUtils';

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
  const { user } = useSupabaseAuth();
  const { addToast } = useToast();

  // Fetch user's calculations
  const fetchCalculations = async () => {
    if (!user || !supabase) {
      console.log('Skipping fetch - user or supabase not available:', { user: !!user, supabase: !!supabase });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to fetch calculations for user:', user.id);

      // Test basic Supabase connection first
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      console.log('Supabase response:', { data, error });

      if (error) {
        console.error('Supabase error object:', error);
        throw error;
      }

      console.log('Successfully fetched calculations:', data?.length || 0, 'items');
      // Normalize created_at to ISO strings to avoid date parsing inconsistencies
      const normalized = (data || []).map((d: any) => ({
        ...d,
        created_at: (() => {
          try {
            const dt = new Date(d?.created_at);
            if (!isNaN(dt.getTime())) return dt.toISOString();
            return String(d?.created_at ?? new Date().toISOString());
          } catch (e) {
            return new Date().toISOString();
          }
        })(),
      }));

      setCalculations(normalized);
    } catch (error: any) {
      // Use robust error logging
      logError('fetchCalculations', error);

      // Extract readable error message
      let errorMessage = 'Unknown error occurred';

      if (!supabase) {
        errorMessage = 'Database service not configured. Please set up your Supabase credentials.';
      } else {
        errorMessage = extractErrorMessage(error);

        // Add context for common issues
        if (error?.code === 'PGRST116' || error?.code === '42P01') {
          errorMessage = 'The calculations table does not exist in your Supabase database. Please create it first.';
        } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('unauthorized')) {
          errorMessage = 'Invalid Supabase credentials. Please check your API key and URL.';
        } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          errorMessage = 'The calculations table does not exist. Please create it in your Supabase database.';
        }
      }

      addToast({
        type: 'error',
        title: 'Failed to Load Calculations',
        description: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Save a new calculation
  const saveCalculation = async (
    calculationType: string,
    inputs: any,
    results: any,
    name?: string,
    options?: { silent?: boolean }
  ): Promise<Calculation | null> => {
    const silent = options?.silent === true;

    if (!user || !supabase) {
      if (!silent) {
        addToast({
          type: 'error',
          title: 'Service Unavailable',
          description: !user ? 'Please sign in to save calculations' : 'Database service not configured'
        });
      } else {
        console.debug('Auto-save skipped: no user or supabase configured');
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('calculations')
        .insert({
          user_id: user.id,
          calculation_type: calculationType,
          inputs: inputs,
          results: results,
          name: name
        })
        .select()
        .single();

      if (error) throw error;

      // Add to local state
      // Ensure created_at is normalized for immediate local state updates
      const saved = {
        ...data,
        created_at: (() => {
          try {
            const dt = new Date((data as any)?.created_at);
            if (!isNaN(dt.getTime())) return dt.toISOString();
            return new Date().toISOString();
          } catch (e) {
            return new Date().toISOString();
          }
        })(),
      };

      setCalculations(prev => [saved, ...prev]);

      if (!silent) {
        addToast({
          type: 'success',
          title: 'Calculation Saved',
          description: 'Your calculation has been saved successfully'
        });
      } else {
        console.debug('Auto-save succeeded');
      }

      // Notify other hook instances to refetch so dashboard counts update
      try {
        if (typeof window !== 'undefined' && window.dispatchEvent) {
          window.dispatchEvent(new Event('calculations:updated'));
        }
      } catch (e) {
        console.warn('Failed to dispatch calculations:updated event', e);
      }

      return data;
    } catch (error: any) {
      // Use robust error logging
      logError('saveCalculation', error);

      // Extract readable error message
      let errorMessage = 'Unknown error occurred';

      if (!supabase) {
        errorMessage = 'Database service not configured. Please set up your Supabase credentials.';
      } else {
        errorMessage = extractErrorMessage(error);

        // Add context for common issues
        if (error?.code === 'PGRST116' || error?.code === '42P01') {
          errorMessage = 'The calculations table does not exist in your Supabase database. Please create it first.';
        } else if (errorMessage.includes('Invalid API key') || errorMessage.includes('unauthorized')) {
          errorMessage = 'Invalid Supabase credentials. Please check your API key and URL.';
        } else if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
          errorMessage = 'The calculations table does not exist. Please create it in your Supabase database.';
        }
      }

      if (!silent) {
        addToast({
          type: 'error',
          title: 'Failed to Save Calculation',
          description: errorMessage
        });
      } else {
        console.warn('Auto-save failed:', errorMessage);
      }
      return null;
    }
  };

  // Find a matching calculation by deep-compare of inputs and results
  const findMatchingCalculation = (inputs: any, results: any): Calculation | undefined => {
    try {
      const normalize = (v: any) => JSON.stringify(v, Object.keys(v || {}).sort());
      const iStr = normalize(inputs);
      const rStr = normalize(results);
      return calculations.find(calc => {
        try {
          const ci = normalize(calc.inputs);
          const cr = normalize(calc.results);
          return ci === iStr && cr === rStr;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      return undefined;
    }
  };

  // Delete a calculation
  const deleteCalculation = async (id: string): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from('calculations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove from local state
      setCalculations(prev => prev.filter(calc => calc.id !== id));

      addToast({
        type: 'success',
        title: 'Calculation Deleted',
        description: 'The calculation has been removed'
      });

      return true;
    } catch (error: any) {
      console.error('Error deleting calculation:', error);

      // Better error message handling
      let errorMessage = 'Unknown error occurred';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (!supabase) {
        errorMessage = 'Database service not configured';
      }

      addToast({
        type: 'error',
        title: 'Failed to Delete Calculation',
        description: errorMessage
      });
      return false;
    }
  };

  // Update calculation name/notes
  const updateCalculation = async (id: string, updates: { name?: string }): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from('calculations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setCalculations(prev =>
        prev.map(calc =>
          calc.id === id ? { ...calc, ...updates } : calc
        )
      );

      addToast({
        type: 'success',
        title: 'Calculation Updated',
        description: 'Changes have been saved'
      });

      return true;
    } catch (error: any) {
      console.error('Error updating calculation:', error);

      // Better error message handling
      let errorMessage = 'Unknown error occurred';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (!supabase) {
        errorMessage = 'Database service not configured';
      }

      addToast({
        type: 'error',
        title: 'Failed to Update Calculation',
        description: errorMessage
      });
      return false;
    }
  };

  // Fetch calculations when user changes
  useEffect(() => {
    console.log('useEffect triggered - user:', !!user, 'supabase:', !!supabase);
    if (user && supabase) {
      console.log('User authenticated, fetching calculations...');
      fetchCalculations();
    } else {
      console.log('User not authenticated or Supabase not configured, clearing calculations');
      setCalculations([]);
    }
  }, [user]);

  // Listen for global calculation updates so multiple hook instances stay in sync
  useEffect(() => {
    const handler = () => {
      console.log('Received calculations:updated event, refetching');
      fetchCalculations();
    };

    try {
      if (typeof window !== 'undefined' && window.addEventListener) {
        window.addEventListener('calculations:updated', handler);
      }
    } catch (e) {
      console.warn('Failed to subscribe to calculations:updated', e);
    }

    return () => {
      try {
        if (typeof window !== 'undefined' && window.removeEventListener) {
          window.removeEventListener('calculations:updated', handler);
        }
      } catch (e) {
        /* ignore */
      }
    };
  }, [user]);

  return {
    calculations,
    isLoading,
    saveCalculation,
    deleteCalculation,
    updateCalculation,
    findMatchingCalculation,
    refetch: fetchCalculations
  };
}
