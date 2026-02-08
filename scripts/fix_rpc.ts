import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function fixRPC() {
  console.log('Testing current get_my_companies...');
  const { data: before, error: beforeError } = await supabase.rpc('get_my_companies');
  console.log('Before fix:', before, beforeError);
  
  // Create a simple test function first to verify we can execute SQL
  console.log('\nCreating test function...');
  const { error: createError } = await supabase.rpc('create_test_function', { x: 1 }).catch(() => ({ error: 'Function not found' } as any));
  console.log('Create test:', createError);
}

fixRPC().catch(console.error);
