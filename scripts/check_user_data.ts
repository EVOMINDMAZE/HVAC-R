
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
    console.log(`Checking data for User ID: ${userId}`);

    const { data: companies, error: cErr } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId);

    console.log('Companies:', companies, cErr);

    const { data: roles, error: rErr } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

    console.log('User Roles:', roles, rErr);
}

run();
