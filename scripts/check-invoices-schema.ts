import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkInvoices() {
  console.log('Checking invoices table schema...');
  
  // Get invoices table info
  const { data: columns, error: colError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'invoices')
    .eq('table_schema', 'public');
    
  console.log('Columns:', JSON.stringify(columns, null, 2));
  console.log('Error:', colError);
  
  // Check current data
  const { data: invoices, error: invError } = await supabase
    .from('invoices')
    .select('*')
    .limit(3);
    
  console.log('\nSample invoices:', JSON.stringify(invoices, null, 2));
  console.log('Error:', invError);
}

checkInvoices().catch(console.error);
