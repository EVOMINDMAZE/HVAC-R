const API_BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://your-api-domain.com'
  : '';

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
  type: 'Standard Cycle' | 'Refrigerant Comparison' | 'Cascade Cycle';
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
  id: number;
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
    const token = localStorage.getItem('simulateon_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const requestOptions = {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...(options.headers || {})
        }
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, requestOptions);

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        return {
          success: false,
          error: errorData.error || 'Request failed',
          details: errorData.details,
          upgradeRequired: errorData.upgradeRequired
        };
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error',
        details: 'Failed to connect to server'
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
    return this.request<AuthResponse>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async signIn(credentials: {
    email: string;
    password: string;
  }): Promise<ApiResponse<AuthResponse>> {
    return this.request<AuthResponse>('/api/auth/signin', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async signOut(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/auth/signout', {
      method: 'POST'
    });
  }

  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    return this.request<{ user: User }>('/api/auth/me');
  }

  // Calculations
  async saveCalculation(calculation: Omit<CalculationData, 'id' | 'created_at' | 'updated_at'>): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>('/api/calculations', {
      method: 'POST',
      body: JSON.stringify(calculation)
    });
  }

  async getCalculations(): Promise<ApiResponse<CalculationData[]>> {
    return this.request<CalculationData[]>('/api/calculations');
  }

  async getCalculation(id: number): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`);
  }

  async updateCalculation(id: number, updates: { name?: string; notes?: string }): Promise<ApiResponse<CalculationData>> {
    return this.request<CalculationData>(`/api/calculations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCalculation(id: number): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/calculations/${id}`, {
      method: 'DELETE'
    });
  }

  async getUserStats(): Promise<ApiResponse<UserStats>> {
    return this.request<UserStats>('/api/user/stats');
  }

  // Subscriptions
  async getSubscriptionPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
    return this.request<SubscriptionPlan[]>('/api/subscriptions/plans');
  }

  async getCurrentSubscription(): Promise<ApiResponse<SubscriptionPlan & { status: string; trialEndsAt?: string }>> {
    return this.request<SubscriptionPlan & { status: string; trialEndsAt?: string }>('/api/subscriptions/current');
  }

  async updateSubscription(planName: string, billingCycle: 'monthly' | 'yearly'): Promise<ApiResponse<any>> {
    return this.request<any>('/api/subscriptions/update', {
      method: 'POST',
      body: JSON.stringify({ planName, billingCycle })
    });
  }

  async cancelSubscription(): Promise<ApiResponse<void>> {
    return this.request<void>('/api/subscriptions/cancel', {
      method: 'POST'
    });
  }

  async createPaymentIntent(planName: string, billingCycle: 'monthly' | 'yearly'): Promise<ApiResponse<any>> {
    return this.request<any>('/api/subscriptions/payment-intent', {
      method: 'POST',
      body: JSON.stringify({ planName, billingCycle })
    });
  }

  // External API proxy for calculations (if needed)
  async calculateStandardCycle(parameters: any): Promise<any> {
    // Direct call to external calculation API
    try {
      const response = await fetch("https://simulateon-backend.onrender.com/calculate-standard", {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async compareRefrigerants(parameters: any): Promise<any> {
    try {
      const response = await fetch("https://simulateon-backend.onrender.com/compare-refrigerants", {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async calculateCascadeCycle(parameters: any): Promise<any> {
    try {
      const response = await fetch("https://simulateon-backend.onrender.com/calculate-cascade", {
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
export type { User, CalculationData, UserStats, SubscriptionPlan, ApiResponse };
