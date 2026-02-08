import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testDirectQuery() {
  const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Testing direct query approach...');
  
  const { data: roleData, error: roleError } = await supabase
    .from('user_roles')
    .select(`
      company_id,
      role,
      companies!inner (
        id,
        name,
        user_id
      )
    `)
    .eq('user_id', userId);

  console.log('Data:', JSON.stringify(roleData, null, 2));
  console.log('Error:', roleError);
  
  if (roleData && roleData.length > 0) {
    const companies = roleData.map((r: any) => ({
      company_id: r.companies?.id || r.company_id,
      company_name: r.companies?.name || 'Unknown Company',
      role: r.role,
      is_owner: r.companies?.user_id === userId,
    }));
    
    console.log('\n✅ SUCCESS! Direct query returns', companies.length, 'companies');
    console.log('Companies:', JSON.stringify(companies, null, 2));
  } else {
    console.log('\n❌ Direct query still returns empty');
  }
}

testDirectQuery().catch(console.error);
