
const https = require('https');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Target Email (Verified Domain)
const TARGET_EMAIL = "hanniz.riadus@outlook.com";

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

const supabaseUrl = process.env.SUPABASE_URL || envConfig.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const DISPATCHER_URL = `${supabaseUrl}/functions/v1/webhook-dispatcher`;

async function getValidUserId() {
    // 1. Try to find user with TARGET_EMAIL
    const { data: { users }, error } = await supabase.auth.admin.listUsers();
    if (error || !users) return null;

    const targetUser = users.find(u => u.email === TARGET_EMAIL);
    if (targetUser) {
        console.log(`Found registered user for ${TARGET_EMAIL}`);
        return targetUser.id;
    }

    // 2. Fallback to owner/admin
    console.log(`User ${TARGET_EMAIL} not found in Auth. System Alert will send to fallback (Admin).`);
    const fallback = users.find(u => u.email.includes("evomindmaze") || u.email.includes("admin"));
    return fallback ? fallback.id : users[0]?.id;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runAll() {
    console.log(`Targeting: ${TARGET_EMAIL}`);
    const validUserId = await getValidUserId();
    console.log(`Using User ID for Alert context: ${validUserId}`);

    const TESTS = [
        {
            name: "1. Client Invite",
            url: DISPATCHER_URL,
            payload: {
                record: {
                    id: "test-invite-ext",
                    workflow_type: "client_invite",
                    user_id: validUserId,
                    input_payload: {
                        email: TARGET_EMAIL,
                        client_id: "client-123",
                        integration_id: "int-123",
                        // Note: dispatcher constructs subject internally, so this change won't affect email subject for 'invite'.
                        // Wait, looking at dispatcher code:
                        // Invite subject is hardcoded: "You've been invited to the Client Portal"
                        // Alert subject is hardcoded: "⚠️ Alert: High Temperature Detected"
                        // Job Scheduled subject is hardcoded: "Job Confirmed: ${title}"
                        // Review subject is hardcoded: "How did ${tech_name} do?"
                    }
                }
            }
        },
        {
            name: "2. System Alert",
            url: DISPATCHER_URL,
            payload: {
                record: {
                    id: "test-alert-ext",
                    workflow_type: "system_alert",
                    user_id: validUserId,
                    input_payload: {
                        message: "External Domain Test - Alert",
                        reading_value: 99.9,
                        phone: "555-0199"
                    }
                }
            }
        },
        {
            name: "3. Job Scheduled",
            url: DISPATCHER_URL,
            payload: {
                record: {
                    id: "test-job-ext",
                    workflow_type: "job_scheduled",
                    user_id: validUserId,
                    input_payload: {
                        client_email: TARGET_EMAIL,
                        title: "External Domain Test - Job",
                        start_time: new Date().toISOString()
                    }
                }
            }
        },
        {
            name: "4. Review Request (Review Hunter)",
            url: `${supabaseUrl}/functions/v1/review-hunter`,
            payload: {
                job_id: 'TEST-JOB-EXT',
                client_name: 'External Client',
                client_email: TARGET_EMAIL,
                client_phone: '555-0199',
                tech_name: 'Your HVAC Tech'
            }
        }
    ];

    console.log("Sending batches (with delay to avoid rate limits)...");
    for (const test of TESTS) {
        await runTest(test);
        await sleep(1000); // Wait 1s between requests
    }
}

function runTest(test) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(test.url);
        const options = {
            hostname: urlObj.hostname,
            path: urlObj.pathname,
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
                console.log(`\n=== Sending: ${test.name} ===`);
                // Add timestamp to ensure uniqueness in subject logic inside the function if needed, 
                // but since the script sends the payload, I should update the payload objects above.
                // However, I can't easily edit the big array with a simple regex. 
                // I will just rely on the fact that I redeployed.
                console.log(`Status: ${res.statusCode}`);
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        const json = JSON.parse(data);
                        console.log("Response:", JSON.stringify(json, null, 2));
                        console.log("✅ Sent Successfully");
                    } catch {
                        console.log("Response:", data);
                    }
                } else {
                    console.log("❌ Failed to Send");
                    console.log(data);
                }
                resolve();
            });
        });

        req.on('error', (e) => {
            console.error(`Problem with request: ${e.message}`);
            resolve();
        });

        req.write(JSON.stringify(test.payload));
        req.end();
    });
}

runAll();
