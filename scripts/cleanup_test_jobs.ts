
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function cleanup() {
    console.log('Cleaning up E2E Test Jobs...');

    const { error } = await supabase
        .from('jobs')
        .delete()
        .ilike('title', 'E2E Dispatch Test%');

    if (error) {
        console.error('Error cleaning up:', error);
    } else {
        console.log('Cleanup successful.');
    }
}

cleanup();
