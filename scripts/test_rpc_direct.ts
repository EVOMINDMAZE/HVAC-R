import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testRPC() {
  const adminUserId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Testing get_my_companies with anon key...');
  const { data, error } = await supabase.rpc('get_my_companies');
  console.log('Data:', data);
  console.log('Error:', error);
  
  console.log('\nTesting direct query with anon key...');
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', adminUserId);
  console.log('Roles:', roles);
  console.log('Error:', roleError);
}

testRPC().catch(console.error);
