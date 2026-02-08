import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function listFunctions() {
  console.log('Listing all functions in public schema...');
  
  // Try to call the function and see the error
  console.log('\nTrying get_my_companies...');
  const { data, error } = await supabase.rpc('get_my_companies');
  console.log('Result:', data, error);
  
  // Try get_my_company_id
  console.log('\nTrying get_my_company_id...');
  const { data: companyId, error: companyIdError } = await supabase.rpc('get_my_company_id');
  console.log('Result:', companyId, companyIdError);
  
  // List all available RPC functions
  console.log('\nChecking which RPCs are available...');
  const rpcs = ['get_my_companies', 'get_my_company_id', 'get_my_role', 'switch_company_context', 'create_invite_code'];
  
  for (const rpc of rpcs) {
    try {
      const { data, error } = await (supabase as any).rpc(rpc);
      console.log(`${rpc}: ${error ? 'ERROR: ' + error.message : 'OK - ' + JSON.stringify(data)}`);
    } catch (e: any) {
      console.log(`${rpc}: Exception - ${e.message}`);
    }
  }
}

listFunctions().catch(console.error);
