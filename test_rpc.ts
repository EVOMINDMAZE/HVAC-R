import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testRPC() {
  const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65'; // admin@admin.com
  
  console.log('Testing as user:', userId);
  
  const { data: userRoles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', userId);
    
  console.log('User roles:', userRoles, 'Error:', roleError);
  
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', userId);
    
  console.log('Owner of companies:', companies, 'Error:', companyError);
  
  console.log('\nTesting get_my_companies RPC...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_companies');
  console.log('RPC Data:', rpcData);
  console.log('RPC Error:', rpcError);
}

testRPC().catch(console.error);
