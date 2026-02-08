import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function testCompaniesRPC() {
  console.log('Testing get_user_companies_v2 RPC...');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  console.log('Signing in as admin...');
  const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.TEST_ADMIN_EMAIL!,
    password: process.env.TEST_ADMIN_PASSWORD!,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('Signed in as:', authData.user?.email);
  console.log('User ID:', authData.user?.id);

  // Now call get_user_companies_v2
  console.log('Calling get_user_companies_v2...');
  const startTime = Date.now();
  const { data, error } = await supabase.rpc('get_user_companies_v2');
  const elapsed = Date.now() - startTime;
  console.log(`RPC took ${elapsed}ms`);

  console.log('RPC result - data:', JSON.stringify(data, null, 2));
  console.log('RPC result - error:', error);

  if (error) {
    console.error('RPC error details:', error);
  } else {
    console.log('✅ RPC succeeded, returned', Array.isArray(data) ? data.length : 'non-array', 'items');
    if (Array.isArray(data) && data.length > 0) {
      console.log('First company:', data[0]);
    }
  }
}

testCompaniesRPC().catch(console.error);