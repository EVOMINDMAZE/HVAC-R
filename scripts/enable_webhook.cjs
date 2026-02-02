
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
const envConfig = {};
try {
    const envFile = fs.readFileSync(envPath, 'utf8');
    envFile.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) envConfig[key.trim()] = value.trim();
    });
} catch (e) {
    console.error("Could not read .env file");
}

const supabaseUrl = process.env.SUPABASE_URL || envConfig.VITE_SUPABASE_URL; // VITE_SUPABASE_URL in env
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials in .env");
    console.log("URL:", supabaseUrl ? "Found" : "Missing");
    console.log("Key:", supabaseKey ? "Found" : "Missing");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function enableWebhook() {
    console.log("Enabling Email Automation Webhook...");

    // The Edge Function URL
    const functionUrl = `${supabaseUrl}/functions/v1/webhook-dispatcher`;

    // Call the RPC
    const { data, error } = await supabase.rpc('setup_email_automation_webhook', {
        service_key: supabaseKey,
        endpoint_url: functionUrl
    });

    if (error) {
        console.error("❌ RPC Error:", error);
    } else {
        console.log("✅ Webhook Configured Successfully!");
        console.log("Response:", data);
    }
}

enableWebhook();
