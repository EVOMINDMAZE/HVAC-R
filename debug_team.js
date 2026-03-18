import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
});

async function main() {
    console.log('Checking user_roles table...');
    const { data: roles, error } = await supabase
        .from('user_roles')
        .select('*');
    if (error) {
        console.error('Error fetching user_roles:', error);
    } else {
        console.log(`Found ${roles.length} user_roles rows:`);
        roles.forEach(row => console.log(JSON.stringify(row)));
    }

    console.log('\nChecking companies table...');
    const { data: companies, error: err2 } = await supabase
        .from('companies')
        .select('*');
    if (err2) {
        console.error('Error fetching companies:', err2);
    } else {
        console.log(`Found ${companies.length} companies rows:`);
        companies.forEach(row => console.log(JSON.stringify(row)));
    }

    // Also check auth.users for admin user
    console.log('\nChecking auth.users for admin@admin.com...');
    const { data: users, error: err3 } = await supabase.auth.admin.listUsers();
    if (err3) {
        console.error('Error listing users:', err3);
    } else {
        const admin = users.users.find(u => u.email === 'admin@admin.com');
        console.log('Admin user:', admin ? admin.id : 'not found');
    }
}

main().catch(console.error);