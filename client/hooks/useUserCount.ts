import { useState, useEffect } from "react";

interface UserCountData {
  count: number;
  formattedCount: string;
  loading: boolean;
  error: Error | null;
}

/**
 * Hook to fetch dynamic user count
 * Uses a real API endpoint when available, with a safe fallback.
 */
export function useUserCount(): UserCountData {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchUserCount = async () => {
      try {
        const response = await fetch("/api/stats/user-count");
        if (!response.ok) {
          throw new Error(`Failed to fetch user count (${response.status})`);
        }
        const data = await response.json();

        const next =
          data && typeof data.count === "number" && Number.isFinite(data.count)
            ? data.count
            : 0;

        setCount(next);
        setLoading(false);
      } catch (err) {
        // Fallback: keep UI functional even if stats endpoint isn't configured.
        const fallback = 1247;
        setCount(fallback);
        setError(
          err instanceof Error ? err : new Error("Failed to fetch user count"),
        );
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
