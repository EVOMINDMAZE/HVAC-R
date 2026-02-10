import { useState, useEffect } from "react";

interface UserCountData {
  count: number;
  formattedCount: string;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch dynamic user count
 * In production, this should connect to a real API endpoint
 * For now, it simulates a growing user base
 */
export function useUserCount(): UserCountData {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch('/api/stats/user-count');
        // const data = await response.json();
        
        // Simulated data for demonstration
        // In production, this should come from your analytics/database
        const simulatedCount = 1247; // Replace with actual count
        
        setCount(simulatedCount);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch user count"));
        setLoading(false);
      }
    };

    fetchUserCount();
    
    // Refresh every 5 minutes
    const interval = setInterval(fetchUserCount, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const formattedCount = count > 0 
    ? count.toLocaleString() + "+"
    : "Growing Community";

  return {
    count,
    formattedCount,
    loading,
    error,
  };
}

/**
 * Alternative: Static fallback for SSR or when API is unavailable
 */
export function useUserCountFallback(): UserCountData {
  return {
    count: 0,
    formattedCount: "Growing Community",
    loading: false,
    error: null,
  };
}
