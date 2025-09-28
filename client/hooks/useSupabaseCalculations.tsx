import { useState, useEffect } from 'react';
import { supabase, getSupabaseConfig } from '@/lib/supabase';
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
  const { user, session } = useSupabaseAuth();
  const { addToast } = useToast();

  // Fetch user's calculations
  const fetchCalculations = async () => {
    if (!user) {
      console.log('Skipping fetch - user not available:', { user: !!user });
      return;
    }

    console.log('Supabase client present:', !!supabase);

    setIsLoading(true);
    try {
      console.log('Attempting to fetch calculations for user:', user.id);

      // Skipping direct Supabase preflight here. We will first try the server-side /api proxy
      // to avoid browser-to-Supabase CORS/network issues. If the server proxy is unavailable
      // we'll run a targeted preflight just before attempting the Supabase client.

      // First attempt: call internal server-side API to avoid browser->Supabase CORS/network issues
      try {
        // Quick health check for server proxy to avoid throwing 'Failed to fetch' when server missing
        let serverAvailable = false;
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 1000);
          try {
            const h = await fetch('/api/health', { method: 'GET', signal: controller.signal });
            serverAvailable = h.ok;
          } finally {
            clearTimeout(timeout);
          }
        } catch (healthErr) {
          console.debug('Server health check failed, skipping server proxy:', healthErr);
          serverAvailable = false;
        }

        if (serverAvailable) {
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          // If we have a Supabase session token, forward it so server can authenticate via Supabase JWT
          if (session && (session as any).access_token) {
            headers.Authorization = `Bearer ${(session as any).access_token}`;
          } else if (typeof window !== 'undefined') {
            // Fallback to legacy token storage used by some flows
            const token = localStorage.getItem('simulateon_token');
            if (token) headers.Authorization = `Bearer ${token}`;
          }

          const resp = await fetch('/api/calculations', { method: 'GET', headers });
          if (resp.ok) {
            const payload = await resp.json();
            if (payload && payload.success && Array.isArray(payload.data)) {
              const normalized = payload.data.map((d: any) => ({
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
              try { localStorage.setItem('simulateon:calculations', JSON.stringify(normalized)); } catch (e) { console.warn('Failed to cache calculations locally', e); }
              return;
            }

            // If server returned non-success payload, log and fall through to Supabase client
            console.warn('Server /api/calculations returned unexpected payload', payload);
          } else {
            console.warn('/api/calculations responded with non-OK status', resp.status);
          }
        }
      } catch (serverErr) {
        console.warn('Internal API fetch attempt failed, will fallback to Supabase client:', serverErr);
      }

      // Fallback: Query Supabase for calculations (legacy path)
      // If server proxy failed and we have a supabase client, perform a targeted preflight to avoid
      // surfacing ambiguous network errors. This preflight is done only when we must talk to Supabase from the browser.
      if (supabase) {
        try {
          const { supabaseUrl, configured, isValidUrl } = getSupabaseConfig();
          if (!configured) {
            throw new Error('Supabase is not configured for browser use. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
          }
          if (!isValidUrl) {
            throw new Error(`VITE_SUPABASE_URL appears invalid: ${supabaseUrl}`);
          }

          const url = supabaseUrl.endsWith('/') ? supabaseUrl : `${supabaseUrl}/`;
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          try {
            // Try a HEAD to keep payload minimal; some providers block HEAD so we fall back to GET
            let res = await fetch(url, { method: 'HEAD', mode: 'cors', signal: controller.signal });
            if (!res.ok) res = await fetch(url, { method: 'GET', mode: 'cors', signal: controller.signal });
            // connectivity ok if we reach here
            clearTimeout(timeout);
          } finally {
            clearTimeout(timeout);
          }
        } catch (connErr) {
          logError('fetchCalculations.preflight', connErr);
          // Do not throw here; continue to attempt Supabase client which will report detailed error
          console.warn('Supabase preflight failed, attempting Supabase client fetch which may surface detailed errors', connErr);
        }
      }
      let data: any = null;
      try {
        const res = await supabase
          .from('calculations')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        // supabase-js returns { data, error }
        if (Array.isArray((res as any).data) || (res as any).error) {
          data = (res as any).data;
          if ((res as any).error) {
            logError('fetchCalculations.supabase', (res as any).error);
            console.warn('Supabase client returned error, falling back to cache:', (res as any).error);
          }
        } else {
          // Unexpected shape
          console.warn('Unexpected Supabase response shape, falling back to cache', res);
        }
      } catch (err) {
        logError('fetchCalculations.supabase.fetch', err);
        console.warn('Supabase client fetch threw an error, likely network/CORS issue, falling back to cache:', err);
      }

      if (data && Array.isArray(data)) {
        console.log('Successfully fetched calculations via Supabase client:', data.length, 'items');
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

        // Cache to local storage for offline fallback
        try {
          localStorage.setItem('simulateon:calculations', JSON.stringify(normalized));
        } catch (e) {
          console.warn('Failed to cache calculations locally', e);
        }
      } else {
        // Supabase client unavailable or failed; fallback to cached calculations
        try {
          const cached = localStorage.getItem('simulateon:calculations');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setCalculations(parsed as Calculation[]);
              addToast({ type: 'info', title: 'Offline mode', description: 'Loaded cached calculations from local storage.' });
            }
          } else {
            console.warn('No cached calculations found to fallback to');
          }
        } catch (e) {
          console.warn('Failed to load cached calculations', e);
        }
      }
    } catch (error: any) {
      // Use robust error logging
      logError('fetchCalculations', error);

      // Extract readable error message
      let errorMessage = 'Unknown error occurred';

      if (!supabase) {
        errorMessage = 'Database service not configured. Please set up your Supabase credentials.';
      } else if (error instanceof Error && error.message && error.message.includes('Cannot reach Supabase host')) {
        errorMessage = error.message;
      } else if (error instanceof TypeError && String(error.message).toLowerCase().includes('failed to fetch')) {
        errorMessage = 'Network request failed while contacting Supabase. This can be caused by CORS, network connectivity, or an invalid Supabase URL.';
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
        description: errorMessage,
      });

      // When network errors occur, fallback to local storage if present
      try {
        const cached = localStorage.getItem('simulateon:calculations');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            setCalculations(parsed as Calculation[]);
            addToast({ type: 'info', title: 'Offline mode', description: 'Loaded cached calculations from local storage.' });
          }
        }
      } catch (e) {
        console.warn('Failed to load cached calculations', e);
      }
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

      if (error) {
        logError('saveCalculation.supabase.insert', error);
        throw new Error(extractErrorMessage(error));
      }

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

      if (error) {
        logError('deleteCalculation.supabase.delete', error);
        throw new Error(extractErrorMessage(error));
      }

      // Remove from local state
      setCalculations(prev => prev.filter(calc => calc.id !== id));

      addToast({
        type: 'success',
        title: 'Calculation Deleted',
        description: 'The calculation has been removed'
      });

      return true;
    } catch (error: any) {
      logError('deleteCalculation', error);

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

      if (error) {
        logError('updateCalculation.supabase.update', error);
        throw new Error(extractErrorMessage(error));
      }

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
      logError('updateCalculation', error);

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
    if (user) {
      console.log('User authenticated, fetching calculations...');
      fetchCalculations();
    } else {
      console.log('User not authenticated, clearing calculations');
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
