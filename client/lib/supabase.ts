import { createClient } from '@supabase/supabase-js'

// These should be stored in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Only create client if environment variables are properly set
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your-supabase') || supabaseAnonKey.includes('your-supabase')) {
    console.warn('Supabase environment variables not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    return null;
  }

  try {
    return createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    return null;
  }
};

export const supabase = createSupabaseClient()

// Types
export interface Database {
  public: {
    Tables: {
      calculations: {
        Row: {
          id: string
          user_id: string
          created_at: string
          calculation_type: string
          inputs: any
          results: any
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
          calculation_type: string
          inputs: any
          results: any
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
          calculation_type?: string
          inputs?: any
          results?: any
        }
      }
    }
  }
}
