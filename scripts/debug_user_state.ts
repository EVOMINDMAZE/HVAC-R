
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function checkUser() {
    const userId = 'e74f92ab-9c58-45d7-9a0c-4adbe6460f65';
    console.log(`Checking User: ${userId}`);

    // 1. Check Auth (Does user exist?)
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);
    if (userError) console.error('Auth Error:', userError);
    console.log('Auth User Exists:', !!user);

    // 2. Check User Roles
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

    if (rolesError) console.error('User Roles Error:', rolesError);
    console.log('User Roles Rows:', roles);

    // 3. Check Companies (Owner)
    const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', userId);

    if (companiesError) console.error('Companies Error:', companiesError);
    console.log('Companies Check (user_id):', companies);

}

checkUser();
