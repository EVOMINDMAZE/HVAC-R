import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testRPC() {
  console.log('Testing get_my_companies RPC with anon key...');
  const { data, error } = await supabase.rpc('get_my_companies');
  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
  
  if (data && data.length > 0) {
    console.log('\n✅ SUCCESS! RPC returns', data.length, 'companies');
    console.log('Company:', data[0]);
  } else {
    console.log('\n❌ RPC still returns empty');
  }
}

testRPC().catch(console.error);
