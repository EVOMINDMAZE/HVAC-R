import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkFunction() {
  console.log('Checking get_my_companies function...');
  
  // Get function definition
  const { data: func, error: funcError } = await supabase
    .from('pg_proc')
    .select('proname, prosrc')
    .eq('proname', 'get_my_companies')
    .single();
    
  console.log('Function definition:', func, funcError);
  
  // Try direct query with service role (bypasses RLS)
  console.log('\nDirect query with service role...');
  const { data: direct, error: directError } = await supabase
    .from('user_roles')
    .select('c:id, c:name, role')
    .eq('user_id', 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65');
    
  console.log('Direct result:', direct, directError);
  
  // Check auth.uid() returns expected value
  console.log('\nTesting auth.uid()...');
  const { data: authTest, error: authError } = await supabase
    .rpc('test_auth_uid');
    
  console.log('Auth test:', authTest, authError);
}

checkFunction().catch(console.error);
