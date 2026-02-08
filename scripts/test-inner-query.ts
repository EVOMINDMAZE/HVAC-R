import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function testQuery() {
  const adminUserId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Testing the query that get_my_companies should execute...');
  
  // Simulate the inner join query
  const { data: joinResult, error: joinError } = await supabase
    .from('user_roles')
    .select(`
      company_id,
      role,
      companies!inner (
        id,
        name
      )
    `)
    .eq('user_id', adminUserId);
    
  console.log('Join result:', JSON.stringify(joinResult, null, 2));
  console.log('Join error:', joinError);
  
  // Try raw query using foreign table
  console.log('\nTesting with companies relation...');
  const { data: companies, error: compError } = await supabase
    .from('companies')
    .select('id, name, user_roles!inner(*)')
    .eq('user_roles.user_id', adminUserId);
    
  console.log('Companies with roles:', companies, compError);
}

testQuery().catch(console.error);
