import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

async function testSkoolRPC() {
  console.log('Testing verify_skool_subscription RPC...');
  
  // Create supabase client with anon key (no auth yet)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Sign in as admin user
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
  console.log('Session token present:', !!authData.session?.access_token);

  // Now call verify_skool_subscription
  console.log('Calling verify_skool_subscription...');
  const { data, error } = await supabase.rpc('verify_skool_subscription');

  console.log('RPC result - data:', data);
  console.log('RPC result - error:', error);

  if (error) {
    console.error('RPC error details:', error);
  } else {
    console.log('✅ RPC succeeded, returned:', data);
  }

  // Also test with a specific community ID (optional)
  console.log('\nTesting with a dummy community ID...');
  const { data: data2, error: error2 } = await supabase.rpc('verify_skool_subscription', {
    p_skool_community_id: 'test-community'
  });
  console.log('Result with community ID:', data2, error2);
}

testSkoolRPC().catch(console.error);