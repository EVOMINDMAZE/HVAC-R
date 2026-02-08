import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testRPC() {
  const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Testing get_my_companies RPC with user_id parameter...');
  const { data, error } = await supabase.rpc('get_my_companies', {
    p_user_id: userId,
  });

  console.log('Data:', JSON.stringify(data, null, 2));
  console.log('Error:', error);
  
  if (data && data.length > 0) {
    console.log('\n✅ SUCCESS! RPC returns', data.length, 'companies');
  } else {
    console.log('\n❌ RPC still returns empty');
  }
}

testRPC().catch(console.error);
