
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase URL or Service Role Key');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
    console.log('Starting seed...');

    // 1. Get a client
    const { data: clients, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .limit(1);

    if (clientError || !clients.length) {
        console.error('Error fetching clients or no clients found:', clientError);
        return;
    }

    const clientId = clients[0].id;
    console.log(`Using Client ID: ${clientId}`);

    // 2. Insert integration
    const { data: integration, error: insertError } = await supabase
        .from('integrations')
        .insert({
            client_id: clientId,
            provider: 'google_nest',
            status: 'pending_invite',
            invited_email: 'test_invite@example.com',
            metadata: { reply_to: 'Service Manager' }
        })
        .select()
        .single();

    if (insertError) {
        console.error('Error inserting integration:', insertError);
    } else {
        console.log('Successfully created integration invite.');
        console.log('ID:', integration.id);
        console.log('Test Link:', `http://localhost:8080/connect-provider?integration_id=${integration.id}`);
    }
}

seed();
