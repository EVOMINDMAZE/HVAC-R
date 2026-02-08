import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkRLS() {
  console.log('Checking RLS policies with service role...');
  
  // Check user_roles table RLS
  const { data: policies, error: policyError } = await supabase
    .from('pg_policies')
    .select('tablename, policyname, roles, cmd, qual')
    .eq('schemaname', 'public');
    
  console.log('RLS Policies:', JSON.stringify(policies, null, 2));
  console.log('Error:', policyError);
  
  // Check if user_roles has RLS enabled
  console.log('\nChecking table definitions...');
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name, row_security_active')
    .eq('table_schema', 'public');
    
  console.log('Tables with RLS:', JSON.stringify(tables, null, 2));
  console.log('Error:', tablesError);
  
  // Try query with service role (should bypass RLS)
  console.log('\nQuerying with service role...');
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(5);
    
  console.log('Service role query result:', roles?.length, 'rows');
  console.log('Error:', rolesError);
}

checkRLS().catch(console.error);
