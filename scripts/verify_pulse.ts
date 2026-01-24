
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyPulse() {
    console.log('💓 Pulse Verification Started...');

    // 1. Get or Create a Test Client
    console.log('Checking for Test Client...');
    let { data: client } = await supabase.from('clients').select('id, company_id').eq('name', 'PULSE_TEST_CLIENT').single();

    if (!client) {
        // Need a company first? Assuming one exists or we pick the first one.
        const { data: companies } = await supabase.from('companies').select('id').limit(1);
        if (!companies?.length) throw new Error('No companies found');
        const companyId = companies[0].id;

        const { data: newClient, error } = await supabase.from('clients').insert({
            company_id: companyId,
            name: 'PULSE_TEST_CLIENT',
            contact_email: 'test@pulse.com'
        }).select().single();
        if (error) throw error;
        client = newClient;
        console.log('Created Test Client:', client.id);
    } else {
        console.log('Found Test Client:', client.id);
    }

    // Ensure client is not null for TS
    if (!client) throw new Error('Client is null');

    // 2. Get or Create Test Asset
    console.log('Checking for Test Asset...');
    let { data: asset } = await supabase.from('assets').select('id').eq('name', 'PULSE_TEST_FREEZER').single();

    if (!asset) {
        const { data: newAsset, error } = await supabase.from('assets').insert({
            client_id: client.id,
            name: 'PULSE_TEST_FREEZER',
            type: 'Freezer',
            serial_number: 'PULSE-1000'
        }).select().single();
        if (error) throw error;
        asset = newAsset;
        console.log('Created Test Asset:', asset.id);
    } else {
        console.log('Found Test Asset:', asset.id);
    }

    if (!asset) throw new Error('Asset is null');

    // 3. Create Automation Rule (Critical Alert if > 40)
    console.log('Ensuring Automation Rule...');
    const companyIdForRule = client.company_id;

    // Delete first to ensure clean slate
    await supabase.from('automation_rules').delete().eq('asset_id', asset.id);

    const { error: ruleError } = await supabase.from('automation_rules').insert({
        asset_id: asset.id,
        company_id: companyIdForRule,
        trigger_type: 'Temperature_High',
        threshold_value: 40.0,
        action_type: 'SMS',
        action_config: { phone: '+15550000000' },
        is_active: true
    });

    if (ruleError) throw ruleError;
    console.log('Rule Configured: > 40.0 = Critical Alert');

    // 4. Inject Telemetry (Simulate "Heartbeat" - High Temp)
    console.log('🔥 Injecting High Temp Reading (45.5°F)...');

    // NOTE: Column is 'value', not 'reading_value'
    const { error: readingError } = await supabase.from('telemetry_readings').insert({
        asset_id: asset.id,
        value: 45.5,
        reading_type: 'temperature'
    });
    if (readingError) throw readingError;

    // 5. Wait for Trigger
    console.log('Waiting 3s for Database Trigger...');
    await new Promise(r => setTimeout(r, 3000));

    // 6. Verify Job Creation
    console.log('Verifying Job Creation...');
    const { data: jobs, error: jobError } = await supabase
        .from('jobs')
        .select('*')
        .eq('asset_id', asset.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1);

    if (jobError) throw jobError;

    if (jobs && jobs.length > 0) {
        console.log('✅ SUCCESS! Job Created:', jobs[0].job_name);
        console.log('Job Notes:', jobs[0].notes);
    } else {
        console.error('❌ FAILURE: No Job found.');

        // Debug: Did Alert get created?
        const { data: alerts } = await supabase.from('rules_alerts').select('*').eq('asset_id', asset.id).order('created_at', { ascending: false }).limit(1);
        console.log('Debug - Latest Alert:', alerts?.[0]);
    }
}

verifyPulse().catch(console.error);
