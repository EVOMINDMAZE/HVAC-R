import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useToast } from './useToast';

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
      // Defensive logging to prevent further errors
      try {
        console.error('Error fetching calculations:', error);
        console.log('Error type:', typeof error);
        if (error && typeof error === 'object') {
          console.log('Error keys:', Object.keys(error));
          try {
            console.log('Error stringified:', JSON.stringify(error, null, 2));
          } catch (jsonError) {
            console.log('Error stringifying error object:', jsonError);
            console.log('Error toString:', error.toString());
          }
        }
      } catch (loggingError) {
        console.error('Error while logging original error:', loggingError);
      }

      // Better error message handling with defensive checks
      let errorMessage = 'Unknown error occurred';

      try {
        if (!supabase) {
          errorMessage = 'Database service not configured. Please set up your Supabase credentials.';
        } else if (error && typeof error === 'object') {
          // Check for specific error codes
          if (error.code === 'PGRST116' || error.code === '42P01') {
            errorMessage = 'The calculations table does not exist in your Supabase database. Please create it first.';
          } else if (error.message && typeof error.message === 'string') {
            errorMessage = error.message;
          } else if (error.error_description && typeof error.error_description === 'string') {
            errorMessage = error.error_description;
          } else if (error.details && typeof error.details === 'string') {
            errorMessage = error.details;
          } else if (error.hint && typeof error.hint === 'string') {
            errorMessage = error.hint;
          } else if (error.code) {
            errorMessage = `Database error (${error.code}). Please check your Supabase configuration.`;
          } else {
            // Try to convert the object to a readable string
            try {
              const errorStr = JSON.stringify(error);
              errorMessage = `Database error: ${errorStr.length > 100 ? errorStr.substring(0, 100) + '...' : errorStr}`;
            } catch {
              errorMessage = 'Database connection error. Please check your Supabase configuration.';
            }
          }
        } else if (typeof error === 'string') {
          errorMessage = error;
        } else {
          errorMessage = 'Database connection error. Please check your Supabase configuration.';
        }
      } catch (processingError) {
        console.error('Error processing error message:', processingError);
        errorMessage = 'Database connection error. Please check your Supabase configuration.';
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
      console.error('Error saving calculation:', error);
      console.log('Error type:', typeof error);
      console.log('Error keys:', Object.keys(error || {}));
      console.log('Error stringified:', JSON.stringify(error, null, 2));

      // Better error message handling
      let errorMessage = 'Unknown error occurred';
      if (!supabase) {
        errorMessage = 'Database service not configured. Please set up your Supabase credentials.';
      } else if (error?.code === 'PGRST116') {
        errorMessage = 'The calculations table does not exist in your Supabase database. Please create it first.';
      } else if (error?.code === '42P01') {
        errorMessage = 'The calculations table does not exist. Please create the table in your Supabase database.';
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.error_description) {
        errorMessage = error.error_description;
      } else if (error?.details) {
        errorMessage = error.details;
      } else if (error?.hint) {
        errorMessage = error.hint;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.toString && typeof error.toString === 'function') {
        errorMessage = error.toString();
      } else {
        // Last resort - try to extract any meaningful information
        errorMessage = `Database error: ${error?.code || 'Unknown'} - Please check your Supabase configuration`;
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
