import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { 
    auth: { autoRefreshToken: false, persistSession: false }
  }
);

async function executeSQL() {
  const sql = fs.readFileSync('/tmp/fix_rpc_final.sql', 'utf-8');
  
  console.log('Executing SQL fix...');
  
  // Split by semicolons to execute each statement
  const statements = sql.split(';').filter(s => s.trim().length > 10);
  
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i].trim();
    if (stmt.length < 20) continue;
    
    console.log(`\nExecuting statement ${i + 1}/${statements.length}:`, stmt.substring(0, 60) + '...');
    
    try {
      const { data, error } = await (supabase as any).rpc('execute_sql', { sql: stmt + ';' });
      console.log('Result:', error || 'OK');
    } catch (e: any) {
      // RPC execute might not exist, try alternative
      console.log('Note:', e.message);
    }
  }
  
  // Try calling the function directly to test
  console.log('\n\nTesting get_my_companies...');
  const { data, error } = await supabase.rpc('get_my_companies', { 
    p_user_id: 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65' 
  });
  console.log('Result:', data, error);
}

executeSQL().catch(console.error);
