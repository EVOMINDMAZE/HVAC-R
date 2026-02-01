
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing Supabase URL or Service Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function fixTechRole() {
    console.log('Starting role fix...');

    // 1. Find Admin User (to get company)
    const { data: { users: adminUsers }, error: adminError } = await supabase.auth.admin.listUsers();

    if (adminError) {
        console.error('Error fetching users:', adminError);
        return;
    }

    const adminEmail = 'admin@admin.com';
    const techEmail = 'tech@test.com';

    const adminUser = adminUsers.find(u => u.email === adminEmail);
    const techUser = adminUsers.find(u => u.email === techEmail);

    if (!adminUser) {
        console.error(`Admin user ${adminEmail} not found`);
        return;
    }

    if (!techUser) {
        console.error(`Tech user ${techEmail} not found`);
        return;
    }

    console.log(`Found Admin ID: ${adminUser.id}`);
    console.log(`Found Tech ID: ${techUser.id}`);

    // 2. Find Admin's Company
    const { data: companies, error: companyError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', adminUser.id);

    if (companyError) {
        console.error('Error fetching company:', companyError);
        return;
    }

    if (!companies || companies.length === 0) {
        console.error('No company found for admin user');
        // Create a dummy company if needed, but safer to fail
        return;
    }

    const companyId = companies[0].id;
    console.log(`Found Company: ${companies[0].name} (${companyId})`);

    // 3. Update/Insert Tech Role
    const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
            user_id: techUser.id,
            role: 'tech',
            company_id: companyId
        });

    if (roleError) {
        console.error('Error updating tech role:', roleError);
    } else {
        console.log(`Successfully assigned 'tech' role to user ${techEmail} linked to company ${companies[0].name}`);
    }
}

fixTechRole();
