import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fs from 'fs';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function runMigration() {
  const migration = fs.readFileSync(
    'supabase/migrations/20260205000001_fix_get_my_companies_rpc.sql',
    'utf-8'
  );
  
  console.log('Running migration to fix get_my_companies RPC...');
  
  // Split by semicolons and execute each statement
  const statements = migration.split(';').filter(s => s.trim());
  
  for (const statement of statements) {
    if (statement.trim()) {
      console.log('Executing:', statement.substring(0, 80) + '...');
      const { error } = await supabase.rpc('execute_sql', { sql: statement + ';' }).catch(() => ({ error: 'RPC not available' }));
      if (error) {
        console.log('Note:', error);
      }
    }
  }
  
  // Try direct execution
  console.log('\nTesting get_my_companies...');
  const { data, error } = await supabase.rpc('get_my_companies');
  console.log('Result:', data, error);
}

runMigration().catch(console.error);
