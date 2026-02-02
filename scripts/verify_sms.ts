
// Scripts to verify SMS functionality via Supabase Functions
// Run with: npx tsx scripts/verify_sms.ts

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Error: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TEST_PHONE = "+15550001234"; // Replace with real number to test actual delivery if key exists
const TEST_EMAIL = "test_sms@example.com";

async function verifySms() {
    console.log("🚀 Starting SMS Verification...");

    // Get admin user ID
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError || !users || users.length === 0) {
        console.error("❌ Error fetching users:", usersError);
        process.exit(1);
    }

    const adminUser = users.find(u => u.email === 'admin@admin.com');

    if (!adminUser) {
        console.error("❌ Admin user not found");
        process.exit(1);
    }

    const ADMIN_USER_ID = adminUser.id;
    console.log("✓ Using admin user ID:", ADMIN_USER_ID);

    // 1. Test Webhook Dispatcher (System Alert)
    console.log("\n1. Testing 'system_alert' SMS via webhook-dispatcher...");
    const { data: alertData, error: alertError } = await supabase.functions.invoke('webhook-dispatcher', {
        body: {
            record: {
                workflow_type: 'system_alert', // or 'whatsapp_alert'
                id: '00000000-0000-0000-0000-000000000000',
                user_id: ADMIN_USER_ID,
                input_payload: {
                    message: "Test Alert Message",
                    reading_value: "99F",
                    phone: TEST_PHONE
                }
            }
        }
    });

    if (alertError) {
        console.error("❌ System Alert Failed:", alertError);
    } else {
        console.log("✅ System Alert Result:", alertData);
    }

    // 2. Test Review Hunter SMS
    console.log("\n2. Testing 'review_hunter' SMS via webhook-dispatcher (routing)...");
    const { data: reviewData, error: reviewError } = await supabase.functions.invoke('webhook-dispatcher', {
        body: {
            record: {
                workflow_type: 'review_hunter',
                id: '00000000-0000-0000-0000-000000000001',
                user_id: ADMIN_USER_ID,
                input_payload: {
                    client_name: "Test Client",
                    client_phone: TEST_PHONE,
                    tech_name: "Test Tech",
                    job_id: "test-job-id"
                }
            }
        }
    });

    if (reviewError) {
        console.error("❌ Review Hunter Failed:", reviewError);
    } else {
        console.log("✅ Review Hunter Result:", reviewData);
    }

    // 3. Test Client Invite SMS
    console.log("\n3. Testing 'client_invite' SMS via webhook-dispatcher...");
    const { data: inviteData, error: inviteError } = await supabase.functions.invoke('webhook-dispatcher', {
        body: {
            record: {
                workflow_type: 'client_invite',
                id: '00000000-0000-0000-0000-000000000002',
                user_id: ADMIN_USER_ID,
                input_payload: {
                    email: TEST_EMAIL,
                    client_id: 'test-client-id',
                    integration_id: 'test-integration-id',
                    phone: TEST_PHONE
                }
            }
        }
    });

    if (inviteError) {
        console.error("❌ Client Invite Failed:", inviteError);
    } else {
        console.log("✅ Client Invite Result:", inviteData);
    }

}

verifySms();
