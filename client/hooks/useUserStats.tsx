import { useState, useEffect } from 'react';
import { useSupabaseAuth } from './useSupabaseAuth';
import { UserStats } from '@/lib/api';

export function useUserStats() {
  const { isAuthenticated } = useSupabaseAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStats();
    } else {
      setStats(null);
    }
  }, [isAuthenticated]);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Return mock stats since we're not using the old backend
      const mockStats: UserStats = {
        totalCalculations: 0,
        monthlyCalculations: 0,
        usageByType: [],
        subscription: {
          plan: 'Free',
          limit: 10,
          remaining: 10
        }
      };
      setStats(mockStats);
    } catch (err) {
      setError('Failed to fetch statistics');
      console.error('Error fetching user stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshStats = () => {
    if (isAuthenticated) {
      fetchStats();
    }
  };

  return {
    stats,
    isLoading,
    error,
    refreshStats
  };
}
