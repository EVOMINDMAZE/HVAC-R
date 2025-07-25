import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface CalculationResult {
  id: string;
  type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle';
  timestamp: string;
  parameters: any;
  results: any;
  name?: string;
  notes?: string;
}

interface CalculationHistory {
  calculations: CalculationResult[];
  addCalculation: (calculation: Omit<CalculationResult, 'id' | 'timestamp'>) => void;
  getCalculations: () => CalculationResult[];
  getCalculationById: (id: string) => CalculationResult | undefined;
  deleteCalculation: (id: string) => void;
  updateCalculation: (id: string, updates: Partial<CalculationResult>) => void;
  clearHistory: () => void;
}

export function useCalculationHistory(): CalculationHistory {
  const { user } = useAuth();
  const [calculations, setCalculations] = useState<CalculationResult[]>([]);

  // Load calculations from localStorage on mount
  useEffect(() => {
    if (user?.id) {
      const stored = localStorage.getItem(`simulateon_calculations_${user.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setCalculations(parsed);
        } catch (error) {
          console.error('Error loading calculation history:', error);
        }
      }
    }
  }, [user?.id]);

  // Save calculations to localStorage whenever they change
  useEffect(() => {
    if (user?.id && calculations.length > 0) {
      localStorage.setItem(
        `simulateon_calculations_${user.id}`,
        JSON.stringify(calculations)
      );
    }
  }, [calculations, user?.id]);

  const addCalculation = (calculation: Omit<CalculationResult, 'id' | 'timestamp'>) => {
    const newCalculation: CalculationResult = {
      ...calculation,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    setCalculations(prev => [newCalculation, ...prev]);
  };

  const getCalculations = () => {
    return calculations.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  const getCalculationById = (id: string) => {
    return calculations.find(calc => calc.id === id);
  };

  const deleteCalculation = (id: string) => {
    setCalculations(prev => prev.filter(calc => calc.id !== id));
  };

  const updateCalculation = (id: string, updates: Partial<CalculationResult>) => {
    setCalculations(prev => 
      prev.map(calc => 
        calc.id === id 
          ? { ...calc, ...updates }
          : calc
      )
    );
  };

  const clearHistory = () => {
    setCalculations([]);
    if (user?.id) {
      localStorage.removeItem(`simulateon_calculations_${user.id}`);
    }
  };

  return {
    calculations: getCalculations(),
    addCalculation,
    getCalculations,
    getCalculationById,
    deleteCalculation,
    updateCalculation,
    clearHistory
  };
}
