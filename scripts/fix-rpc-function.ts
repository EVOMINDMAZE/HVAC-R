import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { 
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { 'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}` } }
  }
);

async function fixRPCFunction() {
  console.log('🔧 Fixing get_my_companies RPC function...');
  
  // Step 1: Drop existing function
  console.log('\n1. Dropping existing function...');
  const { error: dropError } = await supabase
    .from('_supabase_functions')
    ?.select?.('*') as any; // Can't directly query functions table
  
  // Use postgres function to execute
  const sql = `
    DROP FUNCTION IF EXISTS public.get_my_companies();
    
    CREATE OR REPLACE FUNCTION public.get_my_companies()
    RETURNS TABLE (company_id UUID, company_name TEXT, role TEXT)
    LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
    BEGIN
        RETURN QUERY
        SELECT c.id, c.name, ur.role::TEXT
        FROM public.companies c
        INNER JOIN public.user_roles ur ON c.id = ur.company_id
        WHERE ur.user_id = auth.uid()
        ORDER BY c.name ASC;
    END;
    $$;
    
    GRANT EXECUTE ON FUNCTION public.get_my_companies() TO authenticated, anon;
  `;
  
  console.log('2. Creating new function...');
  
  // Try using pg_catalog
  try {
    const { data, error } = await (supabase as any).rpc('execute_sql', { sql });
    console.log('RPC execute result:', data, error);
  } catch (e) {
    console.log('Direct RPC execute failed, trying alternative...');
  }
  
  // Alternative: Use REST API to execute SQL
  console.log('\n3. Using REST API to execute SQL...');
  const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1rpc/execute_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY!
    },
    body: JSON.stringify({ sql })
  });
  
  const result = await response.json();
  console.log('REST API result:', result);
  
  // Test the function
  console.log('\n4. Testing get_my_companies()...');
  const { data: companies, error } = await supabase.rpc('get_my_companies');
  console.log('Companies:', companies, 'Error:', error);
}

fixRPCFunction().catch(console.error);
