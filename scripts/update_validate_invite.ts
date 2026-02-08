import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function updateFunction() {
  console.log('Updating validate_invite_code function...');
  
  // Read SQL file
  const sql = fs.readFileSync('scripts/update_validate_invite.sql', 'utf-8');
  
  // Split by semicolons and execute each statement
  const statements = sql.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      try {
        const { error } = await supabase.rpc('execute_sql', { sql: statement + ';' });
        if (error) {
          console.log('Error:', error);
        } else {
          console.log('Statement executed successfully');
        }
      } catch (err) {
        console.log('RPC not available or failed:', err);
      }
    }
  }
  
  // Test the updated function
  console.log('\nTesting validate_invite_code with a dummy code...');
  const { data, error } = await supabase.rpc('validate_invite_code', { p_code: 'TESTCODE' });
  console.log('Test result:', { data, error });
}

updateFunction().catch(console.error);