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
      setCalculations(data || []);
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
    name?: string
  ): Promise<Calculation | null> => {
    if (!user || !supabase) {
      addToast({
        type: 'error',
        title: 'Service Unavailable',
        description: !user ? 'Please sign in to save calculations' : 'Database service not configured'
      });
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
      setCalculations(prev => [data, ...prev]);

      addToast({
        type: 'success',
        title: 'Calculation Saved',
        description: 'Your calculation has been saved successfully'
      });

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

      addToast({
        type: 'error',
        title: 'Failed to Save Calculation',
        description: errorMessage
      });
      return null;
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

  return {
    calculations,
    isLoading,
    saveCalculation,
    deleteCalculation,
    updateCalculation,
    refetch: fetchCalculations
  };
}
