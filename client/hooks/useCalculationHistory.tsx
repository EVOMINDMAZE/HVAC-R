import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { useSupabaseCalculations } from './useSupabaseCalculations';

export interface CalculationResult {
  id: number;
  type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle';
  timestamp: string;
  parameters: any;
  results: any;
  name?: string;
  notes?: string;
}

interface CalculationHistory {
  calculations: CalculationResult[];
  isLoading: boolean;
  addCalculation: (calculation: Omit<CalculationResult, 'id' | 'timestamp'>) => Promise<boolean>;
  getCalculations: () => CalculationResult[];
  getCalculationById: (id: number) => CalculationResult | undefined;
  deleteCalculation: (id: number) => Promise<boolean>;
  updateCalculation: (id: number, updates: { name?: string; notes?: string }) => Promise<boolean>;
  refreshCalculations: () => Promise<void>;
}

export function useCalculationHistory(): CalculationHistory {
  const { isAuthenticated } = useSupabaseAuth();
  const {
    calculations: supabaseCalculations,
    isLoading,
    saveCalculation,
    deleteCalculation: deleteSupabaseCalculation,
    updateCalculation: updateSupabaseCalculation,
    refetch
  } = useSupabaseCalculations();

  // Convert Supabase calculations to the expected format
  const calculations: CalculationResult[] = supabaseCalculations.map(calc => ({
    id: parseInt(calc.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number for compatibility
    type: calc.calculation_type as 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle',
    timestamp: calc.created_at,
    parameters: calc.inputs,
    results: calc.results,
    name: calc.name
  }));

  const addCalculation = async (calculation: Omit<CalculationResult, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const result = await saveCalculation(
        calculation.type,
        calculation.parameters,
        calculation.results,
        calculation.name
      );
      return !!result;
    } catch (error) {
      console.error('Error saving calculation:', error);
      throw error;
    }
  };

  const getCalculations = () => {
    return calculations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getCalculationById = (id: number) => {
    return calculations.find(calc => calc.id === id);
  };

  const deleteCalculation = async (id: number): Promise<boolean> => {
    if (!isAuthenticated) return false;

    // Find the original UUID from the converted ID
    const calculation = supabaseCalculations.find(calc =>
      parseInt(calc.id.replace(/-/g, '').substring(0, 8), 16) === id
    );

    if (!calculation) return false;

    return await deleteSupabaseCalculation(calculation.id);
  };

  const updateCalculation = async (id: number, updates: { name?: string; notes?: string }): Promise<boolean> => {
    if (!isAuthenticated) return false;

    // Find the original UUID from the converted ID
    const calculation = supabaseCalculations.find(calc =>
      parseInt(calc.id.replace(/-/g, '').substring(0, 8), 16) === id
    );

    if (!calculation) return false;

    return await updateSupabaseCalculation(calculation.id, { name: updates.name });
  };

  const refreshCalculations = async () => {
    await refetch();
  };

  return {
    calculations: getCalculations(),
    isLoading,
    addCalculation,
    getCalculations,
    getCalculationById,
    deleteCalculation,
    updateCalculation,
    refreshCalculations
  };
}
