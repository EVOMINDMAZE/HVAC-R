
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
    const { error } = await supabase
        .from('integrations')
        .delete()
        .eq('id', 'a20bf1c0-55fe-4ae1-854d-b2d668dc8201');

    if (error) console.error('Error deleting:', error);
    else console.log('Cleanup successful.');
}

cleanup();
