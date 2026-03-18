import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
const createSupabaseClient = (): SupabaseClient => {
  const { supabaseUrl, configured, isValidUrl: valid } = getSupabaseConfig();

  console.log("Supabase client initialization:", {
    supabaseUrl,
    configured,
    valid,
    hasAnonKey: !!supabaseAnonKey && supabaseAnonKey.length > 0,
    envLoaded: !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    nodeEnv: import.meta.env.MODE,
  });

  if (!configured || !valid) {
    console.warn(
      "Supabase environment variables not configured or invalid. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY",
    );
    throw new Error('Supabase environment variables not configured or invalid');
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        detectSessionInUrl: false,
        persistSession: true,
        autoRefreshToken: true,
        storage: window.localStorage,
      },
    });
  } catch (error) {
    console.error("Failed to create Supabase client:", error);
    throw new Error('Failed to create Supabase client', { cause: error });
  }
};

export const supabase = createSupabaseClient();

// Types
import type { Database } from "../../shared/types/database";

export type { Database };
