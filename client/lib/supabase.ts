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

  if (!configured || !valid) {
    console.warn(
      "Supabase environment variables not configured or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
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
    };
  };
}
