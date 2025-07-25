import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiClient, UserStats } from '@/lib/api';

export function useUserStats() {
  const { isAuthenticated } = useAuth();
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
      const response = await apiClient.getUserStats();
      if (response.success && response.data) {
        setStats(response.data);
      } else {
        setError(response.error || 'Failed to fetch statistics');
      }
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
