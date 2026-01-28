import { createClient } from "@supabase/supabase-js";

// These should be stored in environment variables
const supabaseUrlRaw = import.meta.env.VITE_SUPABASE_URL ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

const isValidUrl = (u: string) => {
  try {
    if (!u) return false;
    // allow env var pointing to full supabase URL
    new URL(u);
    return true;
  } catch (e) {
    return false;
  }
};

// Helper to expose config details for diagnostics
export const getSupabaseConfig = () => {
  const supabaseUrl = String(supabaseUrlRaw || "").trim();
  const configured =
    Boolean(supabaseUrl && supabaseAnonKey) &&
    !supabaseUrl.includes("your-supabase") &&
    !supabaseAnonKey.includes("your-supabase");
  return {
    supabaseUrl,
    supabaseAnonKey,
    configured,
    isValidUrl: isValidUrl(supabaseUrl),
  };
};

// Only create client if environment variables are properly set
const createSupabaseClient = () => {
  const { supabaseUrl, configured, isValidUrl: valid } = getSupabaseConfig();

  console.log("Initializing Supabase Client...", {
    url: supabaseUrl,
    configured,
    valid,
    isLocalhost: supabaseUrl.includes('localhost')
  });

  if (!configured || !valid) {
    console.warn(
      "Supabase environment variables not configured or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: false,
        autoRefreshToken: true,
      },
      global: {
        fetch: (...args) => {
          // console.log("Supabase Fetch:", args[0]); // Reduced spam
          return fetch(...(args as [RequestInfo | URL, RequestInit | undefined]));
        }
      }
    });
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    return null;
  }
};

export const supabase = createSupabaseClient();

// Types
export interface Database {
  public: {
    Tables: {
      calculations: {
        Row: {
          id: string;
          user_id: string;
          created_at: string;
          calculation_type: string;
          inputs: any;
          results: any;
        };
        Insert: {
          id?: string;
          user_id: string;
          created_at?: string;
          calculation_type: string;
          inputs: any;
          results: any;
        };
        Update: {
          id?: string;
          user_id?: string;
          created_at?: string;
          calculation_type?: string;
          inputs?: any;
          results?: any;
        };
      };
      jobs: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          client_name: string;
          job_name: string;
          status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          address: string | null;
          notes: string | null;
          photos: string[] | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string;
          client_name: string;
          job_name: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          address?: string | null;
          notes?: string | null;
          photos?: string[] | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          client_name?: string;
          job_name?: string;
          status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
          address?: string | null;
          notes?: string | null;
          photos?: string[] | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          status: 'active' | 'past_due' | 'canceled' | 'inactive';
          price_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'past_due' | 'canceled' | 'inactive';
          price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          status?: 'active' | 'past_due' | 'canceled' | 'inactive';
          price_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      companies: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          logo_url: string | null;
          primary_color: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          logo_url?: string | null;
          primary_color?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          key: string;
          user_id: string;
          status: 'active' | 'past_due' | 'canceled' | 'inactive';
          plan_tier: string | null;
          expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          key?: string;
          user_id: string;
          status?: 'active' | 'past_due' | 'canceled' | 'inactive';
          plan_tier?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          key?: string;
          user_id?: string;
          status?: 'active' | 'past_due' | 'canceled' | 'inactive';
          plan_tier?: string | null;
          expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      workflow_requests: {
        Row: {
          id: string;
          user_id: string;
          workflow_type: string;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          input_payload: any;
          result_payload: any;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          workflow_type: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_payload?: any;
          result_payload?: any;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          workflow_type?: string;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          input_payload?: any;
          result_payload?: any;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      refrigerant_cylinders: {
        Row: {
          id: string;
          user_id: string;
          cylinder_code: string;
          refrigerant_type: string;
          initial_weight_lbs: number;
          current_weight_lbs: number;
          status: 'active' | 'empty' | 'returned';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cylinder_code: string;
          refrigerant_type: string;
          initial_weight_lbs: number;
          current_weight_lbs: number;
          status?: 'active' | 'empty' | 'returned';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cylinder_code?: string;
          refrigerant_type?: string;
          initial_weight_lbs?: number;
          current_weight_lbs?: number;
          status?: 'active' | 'empty' | 'returned';
          created_at?: string;
          updated_at?: string;
        };
      };
      refrigerant_logs: {
        Row: {
          id: string;
          user_id: string;
          cylinder_id: string | null;
          job_id: string | null;
          transaction_type: 'charge' | 'recover' | 'disposal' | 'addition';
          amount_lbs: number;
          notes: string | null;
          technician_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          cylinder_id?: string | null;
          job_id?: string | null;
          transaction_type: 'charge' | 'recover' | 'disposal' | 'addition';
          amount_lbs: number;
          notes?: string | null;
          technician_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          cylinder_id?: string | null;
          job_id?: string | null;
          transaction_type?: 'charge' | 'recover' | 'disposal' | 'addition';
          amount_lbs?: number;
          notes?: string | null;
          technician_name?: string | null;
          created_at?: string;
        };
      };
    };
  };
}
