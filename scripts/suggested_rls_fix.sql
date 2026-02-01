
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fix() {
  console.log('Applying RLS fixes...');

  // 1. Fix user_roles recursion
  // Drop the problematic policy if it exists and replace it with a simpler one for the current user
  const queries = [
    // Drop potentially recursive policy
    "DROP POLICY IF EXISTS \"Managers can view company user roles\" ON public.user_roles;",
    
    // Ensure basic "view own role" exists and is simple
    "DROP POLICY IF EXISTS \"Users can read own role\" ON public.user_roles;",
    "CREATE POLICY \"Users can read own role\" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);",
    
    // Add a SAFE version of the manager policy that doesn't call a function that queries the same table
    // Instead of get_my_role(), we check if the user HAS an admin/manager role in the same table directly
    // Wait, that's still recursive. The best way is to keep it simple for now or use the SECURITY DEFINER function correctly.
  ];

  for (const q of queries) {
    console.log(`Executing: ${q}`);
    const { error } = await supabase.rpc('exec_sql', { query_text: q }).catch(err => ({ error: err }));
    // If exec_sql doesn't exist, we might need another way.
    if (error) console.error('Error executing query:', error);
  }
}

// Note: Supabase doesn't have a default 'exec_sql' RPC for safety. 
// I'll try to use the migration logic or just assume the user can run this if they have access.
// Since I can't run raw SQL via the client easily without an RPC, I'll provide the SQL to the user 
// or try to find an RPC that can execute it.

console.log('Please run the following SQL in your Supabase SQL Editor:');
console.log(`
-- Fix recursion in user_roles
DROP POLICY IF EXISTS "Managers can view company user roles" ON public.user_roles;

-- Basic policy remains
DROP POLICY IF EXISTS "Users can read own role" ON public.user_roles;
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- Safer manager policy (using the SECURITY DEFINER function which SHOULD work if search_path is correct)
CREATE POLICY "Managers can view company user roles" ON public.user_roles
    FOR SELECT USING (
        company_id = public.get_my_company_id()
        AND
        public.get_my_role() IN ('admin', 'manager')
    );
`);
