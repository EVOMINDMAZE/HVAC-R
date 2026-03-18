import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, anonKey);

async function main() {
    console.log('Signing in as admin@admin.com...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'admin@admin.com',
        password: 'ThermoAdmin$2026!'
    });
    if (signInError) {
        console.error('Sign in error:', signInError);
        return;
    }
    const token = signInData.session.access_token;
    console.log('Token obtained:', token.substring(0, 20) + '...');
    
    // Make request to /api/team
    const response = await fetch('http://localhost:3001/api/team', {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
    console.log('Response status:', response.status, response.statusText);
    const text = await response.text();
    console.log('Response body:', text);
    
    // Also test getUserCompanyId logic by logging the result
    console.log('\n--- Testing getUserCompanyId logic ---');
    // We'll simulate the server-side query using service role key
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (serviceRoleKey) {
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
        const userId = signInData.session.user.id;
        const { data: roleData, error: roleError } = await supabaseAdmin
            .from('user_roles')
            .select('company_id, role')
            .eq('user_id', userId)
            .maybeSingle();
        console.log('roleError:', roleError ? roleError.message : 'none');
        console.log('roleData:', roleData);
        
        const { data: companyData, error: companyError } = await supabaseAdmin
            .from('companies')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();
        console.log('companyError:', companyError ? companyError.message : 'none');
        console.log('companyData:', companyData);
    }
}

main().catch(console.error);