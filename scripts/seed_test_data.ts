import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seedTestData() {
  const adminUserId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65'; // admin@admin.com
  
  console.log('Checking existing data...');
  
  // Check companies
  const { data: companies, error: companyError } = await supabase
    .from('companies')
    .select('*');
    
  console.log('All companies:', companies?.length, companyError);
  companies?.forEach(c => console.log('  -', c.id, c.name, c.user_id));
  
  // Check user_roles
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('*');
    
  console.log('All user_roles:', roles?.length, roleError);
  roles?.forEach(r => console.log('  -', r.user_id, r.company_id, r.role));
  
  // Get admin user's metadata
  const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
  console.log('\nAuth users:', authError, authUsers?.users?.length);
  
  const adminUser = authUsers?.users.find(u => u.email === 'admin@admin.com');
  if (adminUser) {
    console.log('Admin user metadata:', adminUser.raw_user_meta_data);
  }
}

seedTestData().catch(console.error);
