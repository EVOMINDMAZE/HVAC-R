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
  const { user, isAuthenticated } = useAuth();
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load calculations from backend when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      refreshCalculations();
    } else {
      setCalculations([]);
    }
  }, [isAuthenticated, user]);

  const refreshCalculations = async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await apiClient.getCalculations();
      if (response.success && response.data) {
        const formattedCalculations = response.data.map(calc => ({
          ...calc,
          timestamp: calc.created_at || new Date().toISOString()
        }));
        setCalculations(formattedCalculations);
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addCalculation = async (calculation: Omit<CalculationResult, 'id' | 'timestamp'>): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await apiClient.saveCalculation({
        type: calculation.type,
        name: calculation.name,
        notes: calculation.notes,
        parameters: calculation.parameters,
        results: calculation.results
      });

      if (response.success && response.data) {
        const newCalculation = {
          ...response.data,
          timestamp: response.data.created_at || new Date().toISOString()
        };
        setCalculations(prev => [newCalculation, ...prev]);
        return true;
      } else if (response.upgradeRequired) {
        // Handle upgrade required scenario
        throw new Error(response.details || 'Upgrade required to continue');
      }

      return false;
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

    try {
      const response = await apiClient.deleteCalculation(id);
      if (response.success) {
        setCalculations(prev => prev.filter(calc => calc.id !== id));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting calculation:', error);
      return false;
    }
  };

  const updateCalculation = async (id: number, updates: { name?: string; notes?: string }): Promise<boolean> => {
    if (!isAuthenticated) return false;

    try {
      const response = await apiClient.updateCalculation(id, updates);
      if (response.success && response.data) {
        setCalculations(prev =>
          prev.map(calc =>
            calc.id === id
              ? {
                  ...calc,
                  name: response.data!.name,
                  notes: response.data!.notes,
                  timestamp: response.data!.updated_at || calc.timestamp
                }
              : calc
          )
        );
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating calculation:', error);
      return false;
    }
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
