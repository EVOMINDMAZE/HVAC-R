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
    if (!user || !supabase) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('calculations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCalculations(data || []);
    } catch (error: any) {
      console.error('Error fetching calculations:', error);
      addToast({
        type: 'error',
        title: 'Failed to Load Calculations',
        description: error.message
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
      addToast({
        type: 'error',
        title: 'Failed to Save Calculation',
        description: error.message
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
      addToast({
        type: 'error',
        title: 'Failed to Delete Calculation',
        description: error.message
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
      addToast({
        type: 'error',
        title: 'Failed to Update Calculation',
        description: error.message
      });
      return false;
    }
  };

  // Fetch calculations when user changes
  useEffect(() => {
    if (user) {
      fetchCalculations();
    } else {
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
