import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function checkFunction() {
  // Get the function definition
  const { data, error } = await supabase
    .from('pg_proc')
    .select('prosrc, procode')
    .eq('proname', 'get_my_companies')
    .single();
    
  console.log('Function definition:', data, error);
  
  // Run the actual query manually
  console.log('\nRunning query manually...');
  const { data: manualData, error: manualError } = await supabase
    .from('user_roles')
    .select('c.id, c.name, ur.role')
    .eq('ur.user_id', 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65');
    
  console.log('Manual query:', manualData, manualError);
}

checkFunction().catch(console.error);
