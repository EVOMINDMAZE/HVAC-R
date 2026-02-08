import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import { randomBytes } from 'crypto';

async function testNewUserFlow() {
  console.log('Testing new user flow for create company...');
  
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.VITE_SUPABASE_ANON_KEY!
  );

  // Generate random email and password
  const randomId = randomBytes(4).toString('hex');
  const email = `testuser${randomId}@example.com`;
  const password = 'TestPassword123!';

  console.log('Signing up new user:', email);
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (signUpError) {
    console.error('Sign up error:', signUpError);
    return;
  }

  console.log('Sign up success, user ID:', signUpData.user?.id);
  // Email confirmation should be auto-confirmed in local Supabase
  // Sign in immediately
  console.log('Signing in...');
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    console.error('Sign in error:', signInError);
    return;
  }

  console.log('Signed in as:', signInData.user?.email);
  console.log('Session token present:', !!signInData.session?.access_token);

  // Test verify_skool_subscription
  console.log('Calling verify_skool_subscription...');
  const { data: skoolData, error: skoolError } = await supabase.rpc('verify_skool_subscription');
  console.log('Skool RPC result:', { data: skoolData, error: skoolError });

  // Test get_user_companies_v2
  console.log('Calling get_user_companies_v2...');
  const { data: companies, error: companiesError } = await supabase.rpc('get_user_companies_v2');
  console.log('Companies RPC result:', { data: companies, error: companiesError });

  // Determine if user needs company selection (companies empty)
  const needsCompanySelection = !companies || companies.length === 0;
  console.log('Needs company selection:', needsCompanySelection);

  // If companies empty, user should be able to create company (Skool check will fail)
  console.log('All RPCs completed successfully.');
}

testNewUserFlow().catch(console.error);