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
  const companyId = '742fea20-8aec-42fa-aefa-498bcb9cfb15';
  // Get current seat limit
  const { data: company, error } = await supabase
    .from('companies')
    .select('seat_limit')
    .eq('id', companyId)
    .single();
  console.log('Current seat limit:', company?.seat_limit, 'error:', error);
  
  // Update seat limit to 10
  const { data: updated, error: updateError } = await supabase
    .from('companies')
    .update({ seat_limit: 10 })
    .eq('id', companyId)
    .select('seat_limit')
    .single();
  console.log('Updated seat limit:', updated?.seat_limit, 'error:', updateError);
  
  // Count current team members (admin, manager, tech)
  const { count, error: countError } = await supabase
    .from('user_roles')
    .select('*', { count: 'exact', head: true })
    .eq('company_id', companyId)
    .in('role', ['admin', 'manager', 'tech']);
  console.log('Current seat count:', count, 'error:', countError);
}
main().catch(console.error);