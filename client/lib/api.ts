// Base URL for external calculation service. Prefer env override VITE_API_BASE_URL
import { supabase } from "./supabase";

/**
 * Base URL for the API server
 * @defaultValue "http://localhost:8080"
 * @remarks Can be overridden with VITE_API_BASE_URL environment variable
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  (typeof window !== "undefined" ? window.location.origin : "");

/**
 * URL for the calculation service (external physics engine)
 * @defaultValue "https://simulateon-backend.onrender.com"
 * @remarks Can be overridden with VITE_CALCULATION_SERVICE_URL environment variable
 */
export const CALCULATION_SERVICE_URL = import.meta.env.VITE_CALCULATION_SERVICE_URL || "https://simulateon-backend.onrender.com";

/**
 * API response wrapper for all API calls
 * @template T - The type of data returned on success
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  upgradeRequired?: boolean;
}

/**
 * User profile information
 */
interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  company?: string;
  role?: string;
  phone?: string;
  location?: string;
  avatar_url?: string;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Authentication response containing user and token
 */
interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

/**
 * Calculation data model for saved calculations
 */
interface CalculationData {
  id?: number;
  type: "Standard Cycle" | "Refrigerant Comparison" | "Cascade Cycle" | "A2L Safety";
  name?: string;
  notes?: string;
  parameters: any;
  results: any;
  created_at?: string;
  updated_at?: string;
}

/**
 * User statistics and usage metrics
 */
interface UserStats {
  totalCalculations: number;
  monthlyCalculations: number;
  usageByType: Array<{ calculation_type: string; count: number }>;
  subscription: {
    plan: string;
    limit: number;
    remaining: number;
  };
}

/**
 * Subscription plan details
 */
interface SubscriptionPlan {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number;
  price_yearly: number;
  calculations_limit: number;
  features: string[];
  is_active: boolean;
  savings?: number;
}

/**
 * Supabase subscription plan database row type
 */
type SupabaseSubscriptionPlanRow = {
  id: string;
  name: string;
  display_name: string;
  price_monthly: number | string | null;
  price_yearly: number | string | null;
  calculations_limit: number | null;
  features: string[] | null;
  is_active: boolean | null;
  savings: number | string | null;
};

/**
 * API client for all backend communication
 * Handles authentication, calculations, subscriptions, and external service proxy
 */
class ApiClient {
  /**
   * Make authenticated API request with automatic token handling
   * @template T - Expected response data type
   * @param endpoint - API endpoint path (e.g., "/api/auth/signin")
   * @param options - Fetch request options
   * @param baseUrl - Base URL override (defaults to API_BASE_URL)
   * @returns API response wrapper with success status and data/error
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    baseUrl: string = API_BASE_URL,
  ): Promise<ApiResponse<T>> {
    try {
      let token: string | null = null;
      try {
        const { data } = await supabase.auth.getSession();
        token = data?.session?.access_token ?? null;
      } catch (e) {
        console.warn("Failed to get Supabase session", e);
      }

      // Fallback to manually stored token if Supabase session is missing
      if (!token) {
        token = localStorage.getItem("simulateon_token");
      }

      const requestOptions = {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
          ...(options.headers || {}),
        },
      };

      const requestUrl = baseUrl ? `${baseUrl}${endpoint}` : endpoint;
      const response = await fetch(requestUrl, requestOptions);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        const payload = {
          success: false,
          error: errorData.error || "Request failed",
          details: errorData.details,
          upgradeRequired: errorData.upgradeRequired,
        };

        // Emit global error event for centralized UI handling
        try {
          window.dispatchEvent(
            new CustomEvent("app:error", {
              detail: {
                title: "Request failed",
                message: payload.error || "Request failed",
                upgradeRequired: !!payload.upgradeRequired,
                details: payload.details,
              },
            }),
          );
        } catch (_e) {
          // ignore when running in non-browser environments
        }

        return payload;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      try {
        window.dispatchEvent(
          new CustomEvent("app:error", {
            detail: {
              title: "Network error",
              message:
                error instanceof Error && error.message
                  ? error.message
                  : "Failed to connect to server",
            },
          }),
        );
      } catch (_e) {
        // ignore in non-browser contexts
      }

      return {
        success: false,
        error: "Network error",
        details: "Failed to connect to server",
      };
    }
  }

  // ==================== Authentication Methods ====================

  /**
   * Register a new user account
   * @param userData - User registration data including email, password, and profile info
   * @returns AuthResponse with user and token on success
   */
  async signUp(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    company?: string;
    role?: string;
    phone?: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>("/api/auth/signup", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  /**
   * Authenticate user and obtain access token
   * @param credentials - Email and password for authentication
   * @returns AuthResponse with user and token on success
   */
  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  /**
   * Sign out current user and invalidate session
   * @returns Empty response on success
   */
  async signOut(): Promise<ApiResponse<void>> {
    return this.request<void>("/api/auth/signout", {
      method: "POST",
    });
  }

  /**
   * Get current authenticated user profile
   * @returns User profile data
   */
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>("/api/auth/me");
  }

  // ==================== Calculation Methods ====================

  /**
   * Save a new calculation to the database
   * @param calculation - Calculation data without ID and timestamps
   * @returns Saved calculation with generated ID
   */
  async saveCalculation(
    calculation: Omit<CalculationData, "id" | "created_at" | "updated_at">,
  ): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>("/api/calculations", {
      method: "POST",
      body: JSON.stringify(calculation),
    });
  }

  /**
   * Submit troubleshooting request to AI diagnostics
   * @param payload - Troubleshooting data including symptoms and equipment info
   * @returns AI-generated analysis and suggested solutions
   */
  async aiTroubleshoot(payload: {
    payload: any;
    userRole?: string;
  }): Promise<ApiResponse<any>> {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase not configured",
        details: "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing",
      };
    }

    try {
      // Attempt to obtain an authenticated session token
      let token: string | null = null;
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        token = session?.access_token ?? null;
      } catch (_e) {
        // Fallback to stored token if present
        token = localStorage.getItem("simulateon_token") ?? null;
      }

      if (!token) {
        return {
          success: false,
          error: "Not authenticated",
          details:
            "You must be signed in to use AI troubleshooting. Please sign in and try again.",
        };
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Include anon key (apikey) header to satisfy Supabase functions auth checks
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      if (anonKey) {
        headers.apikey = String(anonKey);
      }

      try {
        const preview =
          typeof payload === "string"
            ? payload
            : JSON.stringify(payload, null, 2);
        console.log("[api.aiTroubleshoot] payload preview:", preview);
      } catch (_e) { /* ignore */ }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      if (!supabaseUrl) {
        return {
          success: false,
          error: "Supabase URL missing",
          details: "VITE_SUPABASE_URL is not defined.",
        };
      }

      const endpoint = `${supabaseUrl.replace(/\/?$/, "")}/functions/v1/ai-troubleshoot`;

      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const responseClone = response.clone();
      let text = "";
      let parsed: any = null;
      try {
        text = await responseClone.text();
        if (text) {
          parsed = JSON.parse(text);
        }
      } catch (parseError) {
        if (text) {
          console.warn(
            "Failed to parse AI troubleshoot response",
            parseError,
            text,
          );
        }
      }

      if (!response.ok) {
        const message =
          parsed?.error || parsed?.message || `HTTP ${response.status}`;
        return {
          success: false,
          error: message,
          details: parsed?.details || text || null,
        };
      }

      if (parsed) {
        return parsed as ApiResponse<any>;
      }

      const fallback = await response.json().catch(() => null);
      if (fallback) {
        return fallback as ApiResponse<any>;
      }

      return {
        success: false,
        error: "Empty response from AI troubleshoot",
        details: undefined,
      };
    } catch (err: any) {
      console.error("Supabase AI function call failed", err);

      if (err?.context) {
        try {
          const response: Response = err.context;
          const clone = response.clone();
          const text = await clone.text();
          let parsed: any = null;
          if (text) {
            try {
              parsed = JSON.parse(text);
            } catch (_) {
              parsed = null;
            }
          }

          const message =
            parsed?.error ||
            parsed?.message ||
            err?.message ||
            "AI request failed";

          return {
            success: false,
            error: message,
            details: parsed?.details || text || err?.message,
          };
        } catch (parseError) {
          console.warn(
            "Failed to parse error response from edge function",
            parseError,
          );
        }
      }

      return {
        success: false,
        error: err?.message || "AI request failed",
        details: err?.message,
      };
    }
  }

  /**
   * Retrieve all calculations for the current user
   * @returns Array of calculation records
   */
  async getCalculations(): Promise<ApiResponse<CalculationData[]>> {
    return this.request<CalculationData[]>("/api/calculations");
  }

  /**
   * Get a specific calculation by ID
   * @param id - Calculation ID
   * @returns Calculation record
   */
  async getCalculation(id: number): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`);
  }

  /**
   * Update an existing calculation
   * @param id - Calculation ID to update
   * @param updates - Fields to update (name, notes)
   * @returns Updated calculation record
   */
  async updateCalculation(
    id: number,
    updates: { name?: string; notes?: string },
  ): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  /**
   * Delete a calculation permanently
   * @param id - Calculation ID to delete
   * @returns Empty response on success
   */
  async deleteCalculation(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/calculations/${id}`, {
      method: "DELETE",
    });
  }

  /**
   * Get user statistics and usage metrics
   * @returns UserStats object with calculation counts and subscription info
   */
  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>("/api/user/stats");
  }

  // ==================== Subscription Methods ====================

  /**
   * Fetch subscription plans from Supabase database
   * @returns Array of subscription plans
   */
  private async fetchSubscriptionPlansFromSupabase(): Promise<
    ApiResponse<SubscriptionPlan[]>
  > {
    if (!supabase) {
      return {
        success: false,
        error: "Supabase not configured",
        details:
          "VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing or invalid",
      };
    }

    try {
      const { data, error } = await supabase
        .from("subscription_plans")
        .select(
          "id, name, display_name, price_monthly, price_yearly, calculations_limit, features, is_active, savings",
        )
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error || !data) {
        return {
          success: false,
          error: error?.message || "Failed to load subscription plans",
        };
      }

      const parseNumber = (
        value: number | string | null | undefined,
        defaultValue = 0,
      ) => {
        if (value === null || value === undefined) {
          return defaultValue;
        }
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : defaultValue;
      };

      console.warn("Using Supabase subscription plan data fallback");

      const rows = (data ?? []) as SupabaseSubscriptionPlanRow[];

      const normalizedPlans: SubscriptionPlan[] = rows.map((plan) => {
        const calculationsLimit =
          typeof plan.calculations_limit === "number"
            ? plan.calculations_limit
            : parseNumber(plan.calculations_limit, 0);

        const savingsValue =
          plan.savings !== null && plan.savings !== undefined
            ? parseNumber(plan.savings, 0)
            : undefined;

        return {
          id: plan.id,
          name: plan.name,
          display_name: plan.display_name,
          price_monthly: parseNumber(plan.price_monthly, 0),
          price_yearly: parseNumber(plan.price_yearly, 0),
          calculations_limit: calculationsLimit,
          features: Array.isArray(plan.features) ? plan.features : [],
          is_active: plan.is_active ?? true,
          savings: savingsValue && savingsValue > 0 ? savingsValue : undefined,
        };
      });

      return {
        success: true,
        data: normalizedPlans,
      };
    } catch (error) {
      console.error("Supabase subscription plans fetch failed:", error);
      return {
        success: false,
        error: "Failed to load subscription plans",
        details: error instanceof Error ? error.message : undefined,
      };
    }
  }

  /**
   * Get available subscription plans
   * @returns Array of subscription plans with pricing and features
   */
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    const apiResponse = await this.request<SubscriptionPlan[]>(
      "/api/subscriptions/plans",
    );

    if (apiResponse.success && apiResponse.data?.length) {
      return apiResponse;
    }

    const supabaseResponse = await this.fetchSubscriptionPlansFromSupabase();
    if (supabaseResponse.success && supabaseResponse.data?.length) {
      return supabaseResponse;
    }

    return {
      success: false,
      error:
        apiResponse.error ||
        supabaseResponse.error ||
        "Unable to retrieve subscription plans",
      details: apiResponse.details || supabaseResponse.details,
    };
  }

  /**
   * Get current user's subscription details
   * @returns Current subscription with status and trial info
   */
  async getCurrentSubscription(): Promise<
    ApiResponse<SubscriptionPlan & { status: string; trialEndsAt?: string }>
  > {
    return this.request<
      SubscriptionPlan & { status: string; trialEndsAt?: string }
    >("/api/subscriptions/current");
  }

  /**
   * Update subscription to a different plan
   * @param planName - New plan ID to upgrade/downgrade to
   * @param billingCycle - Monthly or yearly billing
   * @returns Updated subscription with Stripe client secret for payment
   */
  async updateSubscription(
    planName: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/subscriptions/update", {
      method: "POST",
      body: JSON.stringify({ planName, billingCycle }),
    });
  }

  /**
   * Cancel current subscription
   * @returns Cancellation confirmation with end date
   */
  async cancelSubscription(): Promise<ApiResponse<void>> {
    return this.request<void>("/api/subscriptions/cancel", {
      method: "POST",
    });
  }

  /**
   * Create Stripe payment intent for subscription
   * @param planName - Plan ID to subscribe to
   * @param billingCycle - Monthly or yearly billing
   * @returns Payment intent with client secret for payment confirmation
   */
  async createPaymentIntent(
    planName: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/subscriptions/payment-intent", {
      method: "POST",
      body: JSON.stringify({ planName, billingCycle }),
    });
  }

  // ==================== External Service Proxy Methods ====================

  /**
   * Calculate standard vapor compression cycle
   * @param parameters - Refrigerant, temperatures, superheat, subcooling
   * @returns Cycle calculation results including efficiency metrics
   */
  async calculateStandardCycle(parameters: any): Promise<any> {
    return this.request("/calculate-standard", {
      method: "POST",
      body: JSON.stringify({
        refrigerant: parameters.refrigerant,
        evap_temp_c: Number(parameters.evaporatorTemp) || 0,
        cond_temp_c: Number(parameters.condenserTemp) || 0,
        superheat_c: Number(parameters.superheat) || 0,
        subcooling_c: Number(parameters.subcooling) || 0,
      }),
    }, CALCULATION_SERVICE_URL);
  }

  /**
   * Compare multiple refrigerants side-by-side
   * @param parameters - Array of refrigerants and cycle parameters
   * @returns Comparison results with capacity, efficiency, and pressure ratios
   */
  async compareRefrigerants(parameters: any): Promise<any> {
    return this.request("/compare-refrigerants", {
      method: "POST",
      body: JSON.stringify({
        refrigerants: parameters.refrigerants,
        cycle_params: {
          refrigerant: "placeholder",
          evap_temp_c: Number(parameters.evaporatorTemp) || 0,
          cond_temp_c: Number(parameters.condenserTemp) || 0,
          superheat_c: Number(parameters.superheat) || 0,
          subcooling_c: Number(parameters.subcooling) || 0,
        },
      }),
    }, CALCULATION_SERVICE_URL);
  }

  /**
   * Calculate cascade refrigeration cycle (ultra-low temperature)
   * @param parameters - Low and high stage refrigerant and temperature data
   * @returns Cascade efficiency, intermediate temperature, and total power
   */
  async calculateCascadeCycle(parameters: any): Promise<any> {
    return this.request("/calculate-cascade", {
      method: "POST",
      body: JSON.stringify({
        lt_cycle: {
          refrigerant: parameters.ltCycle.refrigerant,
          evap_temp_c: Number(parameters.ltCycle.evaporatorTemp) || 0,
          cond_temp_c: Number(parameters.ltCycle.condenserTemp) || 0,
          superheat_c: Number(parameters.ltCycle.superheat) || 0,
          subcooling_c: Number(parameters.ltCycle.subcooling) || 0,
        },
        ht_cycle: {
          refrigerant: parameters.htCycle.refrigerant,
          evap_temp_c: Number(parameters.htCycle.evaporatorTemp) || 0,
          cond_temp_c: Number(parameters.htCycle.condenserTemp) || 0,
          superheat_c: Number(parameters.htCycle.superheat) || 0,
          subcooling_c: Number(parameters.htCycle.subcooling) || 0,
        },
        cascade_hx_delta_t_c: Number(parameters.cascadeHeatExchangerDT) || 0,
      }),
    }, CALCULATION_SERVICE_URL);
  }

  /**
   * Calculate airflow requirements (CFM)
   * @param sensible_heat_btuh - Sensible heat load in BTU/h
   * @param delta_t_f - Temperature difference in °F
   * @returns Airflow in CFM and recommended duct size
   */
  async calculateAirflow(sensible_heat_btuh: number, delta_t_f: number): Promise<any> {
    return this.request("/api/calculate-airflow", {
      method: "POST",
      body: JSON.stringify({ sensible_heat_btuh, delta_t_f }),
    });
  }

  /**
   * Calculate temperature differential (Delta T)
   * @param return_temp_f - Return air temperature in °F
   * @param supply_temp_f - Supply air temperature in °F
   * @returns Delta T value and status (normal/high/low)
   */
  async calculateDeltaT(return_temp_f: number, supply_temp_f: number): Promise<any> {
    return this.request("/api/calculate-deltat", {
      method: "POST",
      body: JSON.stringify({ return_temp_f, supply_temp_f }),
    });
  }

  /**
   * Get fleet vehicle status
   * @returns Array of vehicles with status, location, and technician assignment
   */
  async getFleetStatus(): Promise<ApiResponse<any>> {
    return this.request("/api/fleet/status");
  }
}

/**
 * Singleton API client instance for application-wide use
 */
export const apiClient = new ApiClient();

// Export types for external use
export type { User, CalculationData, UserStats, SubscriptionPlan, ApiResponse };
