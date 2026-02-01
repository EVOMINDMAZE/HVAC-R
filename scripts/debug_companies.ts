
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY!;

console.log('Initializing Supabase client...');
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const email = 'admin@admin.com';
    const password = 'ThermoAdmin$2026!';

    console.log(`Signing in as ${email}...`);
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (authError) {
        console.error('Auth error:', authError);
        return;
    }

    const user = authData.user;
    console.log('Signed in successfully.');
    console.log('User ID:', user?.id);

    console.log('Querying companies table...');
    const start = Date.now();

    // Replicate the exact query from useSupabaseAuth
    const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .eq('user_id', user!.id)
        .maybeSingle();

    const end = Date.now();
    console.log(`Query finished in ${end - start}ms`);

    if (companyError) {
        console.error('Company Query Error:', companyError);
    } else {
        console.log('Company Query Data:', companyData);
    }
}

run();
