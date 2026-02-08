import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testRPCFunction() {
  console.log('Checking if get_my_companies function exists...');
  
  const { data, error } = await supabase
    .rpc('get_my_companies');
    
  console.log('RPC Result:', data, error);
  
  // Check function definition
  console.log('\nChecking function definition...');
  const { data: funcDefs, error: funcError } = await supabase
    .from('information_schema.routines')
    .select('routine_name, routine_type')
    .eq('routine_schema', 'public')
    .eq('routine_name', 'get_my_companies');
    
  console.log('Function exists:', funcDefs, funcError);
}

testRPCFunction().catch(console.error);
