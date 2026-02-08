import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testRPC() {
  console.log('All companies:');
  const { data: companies, error } = await supabase
    .from('companies')
    .select('*')
    .limit(10);
  console.log('Companies:', companies?.length, error);
  console.log(companies);
  
  console.log('\nAll user_roles:');
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*')
    .limit(10);
  console.log('User roles:', roles?.length, roleError);
  console.log(roles);
}

testRPC().catch(console.error);
