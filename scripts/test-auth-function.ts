import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testAuth() {
  console.log('Testing test_auth() RPC...');
  const { data, error } = await supabase.rpc('test_auth');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
}

testAuth().catch(console.error);
