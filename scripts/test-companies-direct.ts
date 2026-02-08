import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
);

async function testCompanies() {
  const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
  
  console.log('Testing RPC function...');
  const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_companies', {
    p_user_id: userId,
  });
  console.log('RPC Result:', rpcData?.length, 'companies');
  console.log('Data:', JSON.stringify(rpcData, null, 2));
  
  if (rpcData && rpcData.length > 0) {
    console.log('\n✅ SUCCESS! RPC returns companies');
    console.log('Company:', rpcData[0]);
  } else {
    console.log('\n❌ RPC returns empty');
  }
}

testCompanies().catch(console.error);
