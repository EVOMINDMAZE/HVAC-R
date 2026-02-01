import { useState, useEffect } from "react";
import { supabase, getSupabaseConfig } from "@/lib/supabase";
import { useSupabaseAuth } from "./useSupabaseAuth";
import { useToast } from "./useToast";
import { extractErrorMessage, logError } from "@/lib/errorUtils";
import { API_BASE_URL } from "@/lib/api";

export interface Calculation {
  id: string;
  user_id: string;
  created_at: string;
  calculation_type: string;
  inputs: any;
  results: any;
  name?: string;
}

// Cache server availability to avoid repeated failed fetch attempts
let serverHealthCache: { available: boolean; timestamp: number; failureCount: number } | null = null;
let externalApiHealthCache: { available: boolean; timestamp: number; failureCount: number } | null = null;
const SERVER_HEALTH_CACHE_TTL = 60000; // 60 seconds
const MAX_FAILURES_BEFORE_DISABLE = 2; // Stop checking after 2 failures

export function useSupabaseCalculations() {
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, session } = useSupabaseAuth();
  const { addToast } = useToast();

  // Fetch user's calculations
  const fetchCalculations = async () => {
    if (!user) {
      console.log("Skipping fetch - user not available:", { user: !!user });
      return;
    }

    console.log("Supabase client present:", !!supabase);

    setIsLoading(true);
    try {
      console.log("Attempting to fetch calculations for user:", user.id);

      const safeFetch = async (
        input: RequestInfo | URL,
        init?: RequestInit,
      ): Promise<Response | null> => {
        return new Promise((resolve) => {
          fetch(input, init)
            .then(resolve)
            .catch(() => resolve(null));
        });
      };

      // Skipping direct Supabase preflight here. We will first try the server-side /api proxy
      // to avoid browser-to-Supabase CORS/network issues. If the server proxy is unavailable
      // we'll run a targeted preflight just before attempting the Supabase client.

      // Detect Capacitor or mobile environment where relative /api paths won't work
      const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

      // Skip server proxy on mobile/Capacitor to avoid "Offline" false positives
      if (!isCapacitor) {
        // First attempt: call internal server-side API to avoid browser->Supabase CORS/network issues
        try {
          // Quick health check for server proxy to avoid throwing 'Failed to fetch' when server missing
          let serverAvailable = false;

          // Check cache first to avoid repeated failed requests
          const now = Date.now();

          // Skip check if we've failed too many times
          if (serverHealthCache && serverHealthCache.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
            serverAvailable = false;
            console.debug("Server health checks disabled after repeated failures");
          } else if (serverHealthCache && (now - serverHealthCache.timestamp) < SERVER_HEALTH_CACHE_TTL) {
            serverAvailable = serverHealthCache.available;
            console.debug("Using cached server health status:", serverAvailable);
          } else {
            try {
              const healthPromise = Promise.race([
                safeFetch("/api/health", {
                  method: "GET",
                }),
                // Simpler timeout
                new Promise<null>((resolve) => setTimeout(() => resolve(null), 500))
              ]);

              const h = await healthPromise;
              serverAvailable = Boolean(h?.ok);
              const prevFailures = serverHealthCache?.failureCount || 0;
              serverHealthCache = {
                available: serverAvailable,
                timestamp: now,
                failureCount: serverAvailable ? 0 : prevFailures + 1
              };
            } catch (healthErr) {
              serverAvailable = false;
              const prevFailures = serverHealthCache?.failureCount || 0;
              serverHealthCache = {
                available: false,
                timestamp: now,
                failureCount: prevFailures + 1
              };
            }
          }

          // Determine which proxy (local or external) to use for /api calls
          let usedProxyUrl: string | null = null;
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (session && (session as any).access_token) {
            headers.Authorization = `Bearer ${(session as any).access_token}`;
          } else if (typeof window !== "undefined") {
            const token = localStorage.getItem("simulateon_token");
            if (token) headers.Authorization = `Bearer ${token}`;
          }

          if (serverAvailable) {
            usedProxyUrl = "/api/calculations";
          } else {
            // Try external API_BASE_URL as fallback (production proxy)
            // Skip check if we've failed too many times
            if (externalApiHealthCache && externalApiHealthCache.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
              console.debug("External API health checks disabled after repeated failures");
            } else if (externalApiHealthCache && (now - externalApiHealthCache.timestamp) < SERVER_HEALTH_CACHE_TTL) {
              if (externalApiHealthCache.available) {
                usedProxyUrl = `${API_BASE_URL}/api/calculations`;
              }
              console.debug("Using cached external API health status:", externalApiHealthCache.available);
            } else {
              try {
                const healthPromise = Promise.race([
                  safeFetch(`${API_BASE_URL}/api/health`, {
                    method: "GET",
                  }),
                  new Promise<null>((resolve) => setTimeout(() => resolve(null), 500))
                ]);

                const extHealth = await healthPromise;
                const available = Boolean(extHealth?.ok);
                const prevFailures = externalApiHealthCache?.failureCount || 0;
                externalApiHealthCache = {
                  available,
                  timestamp: now,
                  failureCount: available ? 0 : prevFailures + 1
                };
                if (available) {
                  usedProxyUrl = `${API_BASE_URL}/api/calculations`;
                }
              } catch (e) {
                const prevFailures = externalApiHealthCache?.failureCount || 0;
                externalApiHealthCache = {
                  available: false,
                  timestamp: now,
                  failureCount: prevFailures + 1
                };
              }
            }
          }

          if (usedProxyUrl) {
            try {
              const sameOrigin = (() => {
                if (typeof window === "undefined") return true;
                try {
                  const resolved = new URL(usedProxyUrl, window.location.origin);
                  return resolved.origin === window.location.origin;
                } catch (_err) {
                  return true;
                }
              })();

              const resp = await safeFetch(usedProxyUrl, {
                method: "GET",
                headers,
                mode: sameOrigin ? "same-origin" : "cors",
              });
              if (resp?.ok) {
                const payload = await resp.json();
                if (payload && payload.success && Array.isArray(payload.data)) {
                  const normalized = payload.data.map((d: any) => ({
                    ...d,
                    created_at: (() => {
                      try {
                        const dt = new Date(d?.created_at);
                        if (!isNaN(dt.getTime())) return dt.toISOString();
                        return String(d?.created_at ?? new Date().toISOString());
                      } catch (e) {
                        return new Date().toISOString();
                      }
                    })(),
                  }));

                  setCalculations(normalized);
                  try {
                    localStorage.setItem(
                      "simulateon:calculations",
                      JSON.stringify(normalized),
                    );
                  } catch (e) {
                    console.warn("Failed to cache calculations locally", e);
                  }
                  return;
                }

                console.warn(
                  `${usedProxyUrl} returned unexpected payload`,
                  payload,
                );
              } else if (resp) {
                console.warn(
                  `${usedProxyUrl} responded with non-OK status`,
                  resp.status,
                );
              } else {
                console.warn(
                  `${usedProxyUrl} request returned no response (network failure)`,
                );
              }
            } catch (proxyError) {
              const message =
                proxyError instanceof Error
                  ? proxyError.message
                  : String(proxyError);
              console.warn(
                "Proxy calculation fetch failed, will fallback to Supabase client:",
                message,
              );
            }
          }
        } catch (serverErr) {
          const message =
            serverErr instanceof Error ? serverErr.message : String(serverErr);
          console.warn(
            "Internal API fetch attempt failed, will fallback to Supabase client:",
            message,
          );
        }
      } else {
        console.debug("Skipping server proxy check in Capacitor environment");
      }

      // Fallback: Query Supabase for calculations directly
      // Skip preflight checks - Supabase client handles connectivity internally
      let data: any = null;
      try {
        const res = await supabase
          .from("calculations")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });
        // supabase-js returns { data, error }
        if (Array.isArray((res as any).data) || (res as any).error) {
          data = (res as any).data;
          if ((res as any).error) {
            logError("fetchCalculations.supabase", (res as any).error);
            console.warn(
              "Supabase client returned error, falling back to cache:",
              (res as any).error,
            );
          }
        } else {
          // Unexpected shape
          console.warn(
            "Unexpected Supabase response shape, falling back to cache",
            res,
          );
        }
      } catch (err) {
        logError("fetchCalculations.supabase.fetch", err);
        console.warn(
          "Supabase client fetch threw an error, likely network/CORS issue, falling back to cache:",
          err,
        );
      }

      if (data && Array.isArray(data)) {
        console.log(
          "Successfully fetched calculations via Supabase client:",
          data.length,
          "items",
        );
        const normalized = (data || []).map((d: any) => ({
          ...d,
          created_at: (() => {
            try {
              const dt = new Date(d?.created_at);
              if (!isNaN(dt.getTime())) return dt.toISOString();
              return String(d?.created_at ?? new Date().toISOString());
            } catch (e) {
              return new Date().toISOString();
            }
          })(),
        }));

        setCalculations(normalized);

        // Cache to local storage for offline fallback
        try {
          localStorage.setItem(
            "simulateon:calculations",
            JSON.stringify(normalized),
          );
        } catch (e) {
          console.warn("Failed to cache calculations locally", e);
        }
      } else {
        // Supabase client unavailable or failed; fallback to cached calculations
        try {
          const cached = localStorage.getItem("simulateon:calculations");
          if (cached) {
            const parsed = JSON.parse(cached);
            if (Array.isArray(parsed)) {
              setCalculations(parsed as Calculation[]);
              addToast({
                type: "info",
                title: "Offline mode",
                description: "Loaded cached calculations from local storage.",
              });
            }
          } else {
            console.warn("No cached calculations found to fallback to");
          }
        } catch (e) {
          console.warn("Failed to load cached calculations", e);
        }
      }
    } catch (error: any) {
      // Skip logging for expected errors (AbortError, network timeouts, fetch failures)
      const isExpectedError =
        error?.name === 'AbortError' ||
        error?.message?.includes('Failed to fetch') ||
        error?.message?.includes('signal is aborted') ||
        error?.code === 'ECONNABORTED';

      if (!isExpectedError) {
        logError("fetchCalculations", error);
      }


      // When network errors occur, fallback to local storage if present
      // We do this BEFORE returning/suppressing expected errors
      try {
        const cached = localStorage.getItem("simulateon:calculations");
        if (cached) {
          // Only use cache if we have no data yet (or if we want to overwrite? usually fallback is when we failed)
          // But we might have stale data. 
          // In this hook, setCalculations overwrites.
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed)) {
            console.log("Falling back to local cache due to error");
            setCalculations(parsed as Calculation[]);
            console.log("Offline mode: calculations loaded from cache");
            // Only show toast if it's the first time/offline mode transition, maybe?
            // For now, always show it to be safe and match test expectation.
            addToast({
              type: "info",
              title: "Offline mode",
              description: "Loaded cached calculations from local storage.",
            });
          }
        }
      } catch (e) {
        console.warn("Failed to load cached calculations", e);
      }

      // Skip toast notifications for expected network errors
      if (isExpectedError) {
        console.debug("Suppressed expected network error:", error?.message);
        return;
      }

      // Extract readable error message
      let errorMessage = "Unknown error occurred";

      if (!supabase) {
        errorMessage =
          "Database service not configured. Please set up your Supabase credentials.";
      } else if (
        error instanceof Error &&
        error.message &&
        error.message.includes("Cannot reach Supabase host")
      ) {
        errorMessage = error.message;
      } else if (
        error instanceof TypeError &&
        String(error.message).toLowerCase().includes("failed to fetch")
      ) {
        errorMessage =
          "Network request failed while contacting Supabase. This can be caused by CORS, network connectivity, or an invalid Supabase URL.";
      } else {
        errorMessage = extractErrorMessage(error);

        // Add context for common issues
        if (error?.code === "PGRST116" || error?.code === "42P01") {
          errorMessage =
            "The calculations table does not exist in your Supabase database. Please create it first.";
        } else if (
          errorMessage.includes("Invalid API key") ||
          errorMessage.includes("unauthorized")
        ) {
          errorMessage =
            "Invalid Supabase credentials. Please check your API key and URL.";
        } else if (
          errorMessage.includes("relation") &&
          errorMessage.includes("does not exist")
        ) {
          errorMessage =
            "The calculations table does not exist. Please create it in your Supabase database.";
        }
      }


      // (Fallback logic moved up)

      addToast({
        type: "error",
        title: "Failed to Load Calculations",
        description: errorMessage,
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
    name?: string,
    options?: {
      silent?: boolean;
      project_id?: string;
      location_lat?: number;
      location_lng?: number;
      weather_data?: any;
      evidence_urls?: string[];
    },
  ): Promise<Calculation | null> => {
    const silent = options?.silent === true;

    if (!user || !supabase) {
      if (!silent) {
        addToast({
          type: "error",
          title: "Service Unavailable",
          description: !user
            ? "Please sign in to save calculations"
            : "Database service not configured",
        });
      } else {
        console.debug("Auto-save skipped: no user or supabase configured");
      }
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("calculations")
        .insert({
          user_id: user.id,
          calculation_type: calculationType,
          inputs: inputs,
          results: results,
          name: name,
          project_id: options?.project_id,
          location_lat: options?.location_lat,
          location_lng: options?.location_lng,
          weather_data: options?.weather_data,
          evidence_urls: options?.evidence_urls,
        })
        .select()
        .single();

      if (error) {
        logError("saveCalculation.supabase.insert", error);
        throw new Error(extractErrorMessage(error));
      }

      // Add to local state
      // Ensure created_at is normalized for immediate local state updates
      const saved = {
        ...data,
        created_at: (() => {
          try {
            const dt = new Date((data as any)?.created_at);
            if (!isNaN(dt.getTime())) return dt.toISOString();
            return new Date().toISOString();
          } catch (e) {
            return new Date().toISOString();
          }
        })(),
      };

      setCalculations((prev) => [saved, ...prev]);

      if (!silent) {
        addToast({
          type: "success",
          title: "Calculation Saved",
          description: "Your calculation has been saved successfully",
        });
      } else {
        console.debug("Auto-save succeeded");
      }

      // Notify other hook instances to refetch so dashboard counts update
      try {
        if (typeof window !== "undefined" && window.dispatchEvent) {
          window.dispatchEvent(new Event("calculations:updated"));
        }
      } catch (e) {
        console.warn("Failed to dispatch calculations:updated event", e);
      }

      return data;
    } catch (error: any) {
      // Use robust error logging
      logError("saveCalculation", error);

      // Extract readable error message
      let errorMessage = "Unknown error occurred";

      if (!supabase) {
        errorMessage =
          "Database service not configured. Please set up your Supabase credentials.";
      } else {
        errorMessage = extractErrorMessage(error);

        // Add context for common issues
        if (error?.code === "PGRST116" || error?.code === "42P01") {
          errorMessage =
            "The calculations table does not exist in your Supabase database. Please create it first.";
        } else if (
          errorMessage.includes("Invalid API key") ||
          errorMessage.includes("unauthorized")
        ) {
          errorMessage =
            "Invalid Supabase credentials. Please check your API key and URL.";
        } else if (
          errorMessage.includes("relation") &&
          errorMessage.includes("does not exist")
        ) {
          errorMessage =
            "The calculations table does not exist. Please create it in your Supabase database.";
        }
      }

      if (!silent) {
        addToast({
          type: "error",
          title: "Failed to Save Calculation",
          description: errorMessage,
        });
      } else {
        console.warn("Auto-save failed:", errorMessage);
      }
      return null;
    }
  };

  // Find a matching calculation by deep-compare of inputs and results
  const findMatchingCalculation = (
    inputs: any,
    results: any,
  ): Calculation | undefined => {
    try {
      const normalize = (v: any) =>
        JSON.stringify(v, Object.keys(v || {}).sort());
      const iStr = normalize(inputs);
      const rStr = normalize(results);
      return calculations.find((calc) => {
        try {
          const ci = normalize(calc.inputs);
          const cr = normalize(calc.results);
          return ci === iStr && cr === rStr;
        } catch (e) {
          return false;
        }
      });
    } catch (e) {
      return undefined;
    }
  };

  // Delete a calculation
  const deleteCalculation = async (id: string): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from("calculations")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        logError("deleteCalculation.supabase.delete", error);
        throw new Error(extractErrorMessage(error));
      }

      // Remove from local state
      setCalculations((prev) => prev.filter((calc) => calc.id !== id));

      addToast({
        type: "success",
        title: "Calculation Deleted",
        description: "The calculation has been removed",
      });

      return true;
    } catch (error: any) {
      logError("deleteCalculation", error);

      // Better error message handling
      let errorMessage = "Unknown error occurred";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (!supabase) {
        errorMessage = "Database service not configured";
      }

      addToast({
        type: "error",
        title: "Failed to Delete Calculation",
        description: errorMessage,
      });
      return false;
    }
  };

  // Update calculation name/notes
  const updateCalculation = async (
    id: string,
    updates: { name?: string },
  ): Promise<boolean> => {
    if (!user || !supabase) return false;

    try {
      const { error } = await supabase
        .from("calculations")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) {
        logError("updateCalculation.supabase.update", error);
        throw new Error(extractErrorMessage(error));
      }

      // Update local state
      setCalculations((prev) =>
        prev.map((calc) => (calc.id === id ? { ...calc, ...updates } : calc)),
      );

      addToast({
        type: "success",
        title: "Calculation Updated",
        description: "Changes have been saved",
      });

      return true;
    } catch (error: any) {
      logError("updateCalculation", error);

      // Better error message handling
      let errorMessage = "Unknown error occurred";
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else if (!supabase) {
        errorMessage = "Database service not configured";
      }

      addToast({
        type: "error",
        title: "Failed to Update Calculation",
        description: errorMessage,
      });
      return false;
    }
  };

  // Fetch calculations when user changes
  useEffect(() => {
    console.log("useEffect triggered - user:", !!user, "supabase:", !!supabase);
    if (user) {
      console.log("User authenticated, fetching calculations...");
      fetchCalculations();
    } else {
      console.log("User not authenticated, clearing calculations");
      setCalculations([]);
    }
  }, [user]);

  // Listen for global calculation updates so multiple hook instances stay in sync
  useEffect(() => {
    const handler = () => {
      console.log("Received calculations:updated event, refetching");
      fetchCalculations();
    };

    try {
      if (typeof window !== "undefined" && window.addEventListener) {
        window.addEventListener("calculations:updated", handler);
      }
    } catch (e) {
      console.warn("Failed to subscribe to calculations:updated", e);
    }

    return () => {
      try {
        if (typeof window !== "undefined" && window.removeEventListener) {
          window.removeEventListener("calculations:updated", handler);
        }
      } catch (e) {
        /* ignore */
      }
    };
  }, [user]);

  return {
    calculations,
    isLoading,
    saveCalculation,
    deleteCalculation,
    updateCalculation,
    findMatchingCalculation,
    refetch: fetchCalculations,
  };
}
