import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function verify() {
  const adminUserId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Query 1: All user_roles for admin user');
  const { data: roles1, error: err1 } = await supabase
    .from('user_roles')
    .select('*')
    .eq('user_id', adminUserId);
  console.log('Result:', roles1?.length, 'rows', err1);
  
  console.log('\nQuery 2: All companies');
  const { data: companies, error: compErr } = await supabase
    .from('companies')
    .select('*')
    .limit(5);
  console.log('Companies:', companies?.length, compErr);
  companies?.forEach(c => console.log(' -', c.id, c.name));
  
  console.log('\nQuery 3: Companies owned by admin');
  const { data: owned, error: ownedErr } = await supabase
    .from('companies')
    .select('*')
    .eq('user_id', adminUserId);
  console.log('Owned:', owned, ownedErr);
  
  console.log('\nQuery 4: Using inner join simulation');
  // Since we can't do raw SQL, let's try to understand the issue
  const { data: allRoles, error: allRolesErr } = await supabase
    .from('user_roles')
    .select('*, companies(*)');
  console.log('All roles with company data:', allRoles?.length, allRolesErr);
}

verify().catch(console.error);
