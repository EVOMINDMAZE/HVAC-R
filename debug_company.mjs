import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
  const userId = '51f55e9c-aa1c-4763-a65c-7a12fd152b24';
  // Check user_roles
  const { data: userRoles, error: err1 } = await supabase
    .from('user_roles')
    .select('company_id, role')
    .eq('user_id', userId)
    .maybeSingle();
  console.log('user_roles:', userRoles, 'error:', err1);
  // Check companies
  const { data: companies, error: err2 } = await supabase
    .from('companies')
    .select('id, user_id')
    .eq('user_id', userId)
    .maybeSingle();
  console.log('companies:', companies, 'error:', err2);
  // Check auth.users metadata
  const { data: authUser, error: err3 } = await supabase.auth.admin.getUserById(userId);
  console.log('auth user:', authUser?.user?.user_metadata, 'error:', err3);
}
main().catch(console.error);