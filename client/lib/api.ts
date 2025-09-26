// Base URL for external calculation service. Prefer env override VITE_API_BASE_URL
import { supabase } from "./supabase";

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://simulateon-backend.onrender.com";

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  upgradeRequired?: boolean;
}

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

interface AuthResponse {
  user: User;
  token: string;
  expiresAt: string;
}

interface CalculationData {
  id?: number;
  type: "Standard Cycle" | "Refrigerant Comparison" | "Cascade Cycle";
  name?: string;
  notes?: string;
  parameters: any;
  results: any;
  created_at?: string;
  updated_at?: string;
}

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

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem("simulateon_token");
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    // Return mock failure when no backend server is configured
    if (!API_BASE_URL) {
      console.warn("No backend API server configured - returning mock failure");
      return {
        success: false,
        error: "Backend API not configured",
        details:
          "No internal API server is currently configured. Using fallback data where available.",
      };
    }

    try {
      const requestOptions = {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...(options.headers || {}),
        },
      };

      const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        requestOptions,
      );

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = {
            error: `HTTP ${response.status}: ${response.statusText}`,
          };
        }

        return {
          success: false,
          error: errorData.error || "Request failed",
          details: errorData.details,
          upgradeRequired: errorData.upgradeRequired,
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error("API request failed:", error);
      return {
        success: false,
        error: "Network error",
        details: "Failed to connect to server",
      };
    }
  }

  // Authentication
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

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>("/api/auth/signin", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.request<void>("/api/auth/signout", {
      method: "POST",
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>("/api/auth/me");
  }

  // Calculations
  async saveCalculation(
    calculation: Omit<CalculationData, "id" | "created_at" | "updated_at">,
  ): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>("/api/calculations", {
      method: "POST",
      body: JSON.stringify(calculation),
    });
  }

  async getCalculations(): Promise<ApiResponse<CalculationData[]>> {
    return this.request<CalculationData[]>("/api/calculations");
  }

  async getCalculation(id: number): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`);
  }

  async updateCalculation(
    id: number,
    updates: { name?: string; notes?: string },
  ): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteCalculation(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/calculations/${id}`, {
      method: "DELETE",
    });
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>("/api/user/stats");
  }

  // Subscriptions
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
        .select("id, name, display_name, price_monthly, price_yearly, calculations_limit, features, is_active, savings")
        .eq("is_active", true)
        .order("price_monthly", { ascending: true });

      if (error || !data) {
        return {
          success: false,
          error: error?.message || "Failed to load subscription plans",
        };
      }

      const normalizedPlans: SubscriptionPlan[] = data.map((plan) => ({
        id: plan.id,
        name: plan.name,
        display_name: plan.display_name,
        price_monthly: Number(plan.price_monthly ?? 0),
        price_yearly: Number(plan.price_yearly ?? 0),
        calculations_limit: plan.calculations_limit ?? 0,
        features: Array.isArray(plan.features) ? plan.features : [],
        is_active: plan.is_active ?? true,
        savings: plan.savings != null ? Number(plan.savings) : undefined,
      }));

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

  async getCurrentSubscription(): Promise<
    ApiResponse<SubscriptionPlan & { status: string; trialEndsAt?: string }>
  > {
    return this.request<
      SubscriptionPlan & { status: string; trialEndsAt?: string }
    >("/api/subscriptions/current");
  }

  async updateSubscription(
    planName: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/subscriptions/update", {
      method: "POST",
      body: JSON.stringify({ planName, billingCycle }),
    });
  }

  async cancelSubscription(): Promise<ApiResponse<void>> {
    return this.request<void>("/api/subscriptions/cancel", {
      method: "POST",
    });
  }

  async createPaymentIntent(
    planName: string,
    billingCycle: "monthly" | "yearly",
  ): Promise<ApiResponse<any>> {
    return this.request<any>("/api/subscriptions/payment-intent", {
      method: "POST",
      body: JSON.stringify({ planName, billingCycle }),
    });
  }

  // External API proxy for calculations (if needed)
  async calculateStandardCycle(parameters: any): Promise<any> {
    // Direct call to external calculation API
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-standard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          refrigerant: parameters.refrigerant,
          evap_temp_c: Number(parameters.evaporatorTemp) || 0,
          cond_temp_c: Number(parameters.condenserTemp) || 0,
          superheat_c: Number(parameters.superheat) || 0,
          subcooling_c: Number(parameters.subcooling) || 0,
        }),
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error (${response.status}): ${response.statusText}. ${errorText.includes("<!doctype") || errorText.includes("<html") ? "API server may be down or misconfigured." : errorText}`,
        );
      }

      // Get response text once and check both content type and content
      const responseText = await response.text();
      const contentType = response.headers.get("content-type");

      console.log("API Response received:", {
        url: response.url,
        status: response.status,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
      });

      // Check if response looks like HTML
      if (
        responseText.trim().startsWith("<") ||
        responseText.includes("<!doctype") ||
        responseText.includes("<html")
      ) {
        console.error("HTML response received instead of JSON:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          "API server returned HTML instead of JSON. The calculation service may be temporarily unavailable.",
        );
      }

      // Check content type
      if (
        contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/plain")
      ) {
        console.error("Unexpected content type:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          `API returned unexpected content type: ${contentType}. Expected JSON but got: ${responseText.substring(0, 100)}...`,
        );
      }

      // Try to parse as JSON
      try {
        if (!responseText) {
          throw new Error("Empty response received from API");
        }

        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(
          `Failed to parse API response as JSON. Error: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Response: ${responseText.substring(0, 200)}...`,
        );
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to calculation service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  async compareRefrigerants(parameters: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/compare-refrigerants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error (${response.status}): ${response.statusText}. ${errorText.includes("<!doctype") || errorText.includes("<html") ? "API server may be down or misconfigured." : errorText}`,
        );
      }

      // Get response text once and check both content type and content
      const responseText = await response.text();
      const contentType = response.headers.get("content-type");

      console.log("API Response received:", {
        url: response.url,
        status: response.status,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
      });

      // Check if response looks like HTML
      if (
        responseText.trim().startsWith("<") ||
        responseText.includes("<!doctype") ||
        responseText.includes("<html")
      ) {
        console.error("HTML response received instead of JSON:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          "API server returned HTML instead of JSON. The comparison service may be temporarily unavailable.",
        );
      }

      // Check content type
      if (
        contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/plain")
      ) {
        console.error("Unexpected content type:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          `API returned unexpected content type: ${contentType}. Expected JSON but got: ${responseText.substring(0, 100)}...`,
        );
      }

      // Try to parse as JSON
      try {
        if (!responseText) {
          throw new Error("Empty response received from API");
        }

        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(
          `Failed to parse API response as JSON. Error: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Response: ${responseText.substring(0, 200)}...`,
        );
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to comparison service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }

  async calculateCascadeCycle(parameters: any): Promise<any> {
    try {
      const response = await fetch(`${API_BASE_URL}/calculate-cascade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
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
      });

      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API Error (${response.status}): ${response.statusText}. ${errorText.includes("<!doctype") || errorText.includes("<html") ? "API server may be down or misconfigured." : errorText}`,
        );
      }

      // Get response text once and check both content type and content
      const responseText = await response.text();
      const contentType = response.headers.get("content-type");

      console.log("API Response received:", {
        url: response.url,
        status: response.status,
        contentType,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
      });

      // Check if response looks like HTML
      if (
        responseText.trim().startsWith("<") ||
        responseText.includes("<!doctype") ||
        responseText.includes("<html")
      ) {
        console.error("HTML response received instead of JSON:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          "API server returned HTML instead of JSON. The cascade calculation service may be temporarily unavailable.",
        );
      }

      // Check content type
      if (
        contentType &&
        !contentType.includes("application/json") &&
        !contentType.includes("text/plain")
      ) {
        console.error("Unexpected content type:", {
          url: response.url,
          status: response.status,
          contentType,
          responseText: responseText.substring(0, 500),
        });
        throw new Error(
          `API returned unexpected content type: ${contentType}. Expected JSON but got: ${responseText.substring(0, 100)}...`,
        );
      }

      // Try to parse as JSON
      try {
        if (!responseText) {
          throw new Error("Empty response received from API");
        }

        return JSON.parse(responseText);
      } catch (parseError) {
        console.error("JSON Parse Error:", parseError);
        throw new Error(
          `Failed to parse API response as JSON. Error: ${parseError instanceof Error ? parseError.message : "Unknown parse error"}. Response: ${responseText.substring(0, 200)}...`,
        );
      }
    } catch (error) {
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new Error(
          "Unable to connect to cascade calculation service. Please check your internet connection.",
        );
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export type { User, CalculationData, UserStats, SubscriptionPlan, ApiResponse };
