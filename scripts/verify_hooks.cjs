
const https = require('https');
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

const supabaseUrl = process.env.SUPABASE_URL || envConfig.SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || envConfig.SUPABASE_ANON_KEY;

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const FUNCTION_URL = `${supabaseUrl}/functions/v1/webhook-dispatcher`;
console.log(`Testing Webhook Dispatcher at: ${FUNCTION_URL}`);

const TESTS = [
    {
        name: "Client Invite",
        payload: {
            record: {
                id: "test-invite-node-1",
                workflow_type: "client_invite",
                user_id: "test-user",
                input_payload: {
                    email: "delivered@resend.dev",
                    client_id: "client-123",
                    integration_id: "int-123"
                }
            }
        }
    },
    {
        name: "System Alert",
        payload: {
            record: {
                id: "test-alert-node-1",
                workflow_type: "system_alert",
                user_id: "test-owner-id",
                input_payload: {
                    message: "Test Alert Node",
                    reading_value: 105.5,
                    phone: "555-NODE"
                }
            }
        }
    },
    {
        name: "Job Scheduled",
        payload: {
            record: {
                id: "test-job-node-1",
                workflow_type: "job_scheduled",
                user_id: "test-user",
                input_payload: {
                    client_email: "delivered@resend.dev",
                    title: "NodeJS Test Job",
                    start_time: new Date().toISOString()
                }
            }
        }
    }
];

function runTest(test) {
    return new Promise((resolve, reject) => {
        const url = new URL(FUNCTION_URL);
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`\n=== Testing: ${test.name} ===`);
                console.log(`Status: ${res.statusCode}`);
                console.log('Response:', data);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    console.log("✅ PASS");
                } else {
                    console.log("❌ FAIL");
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve(); // Don't crash run
        });

        req.write(JSON.stringify(test.payload));
        req.end();
    });
}

async function runAll() {
    for (const test of TESTS) {
        await runTest(test);
    }
}

runAll();
