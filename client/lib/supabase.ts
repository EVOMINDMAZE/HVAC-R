import { createClient } from '@supabase/supabase-js'

// These should be stored in environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'your-supabase-url'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-supabase-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
