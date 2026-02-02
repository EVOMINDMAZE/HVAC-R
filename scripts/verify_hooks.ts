
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/std@0.192.0/dotenv/load.ts";

// Setup
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://rxqflxmzsqhqrzffcsej.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY");

if (!supabaseKey) {
    console.error("Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY");
    Deno.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const FUNCTION_URL = `${supabaseUrl}/functions/v1/webhook-dispatcher`;

console.log(`Testing Webhook Dispatcher at: ${FUNCTION_URL}`);

const TESTS = [
    {
        name: "Client Invite",
        payload: {
            record: {
                id: "test-invite-1",
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
                id: "test-alert-1",
                workflow_type: "system_alert", // or whatsapp_alert
                user_id: "test-owner-id", // Needs valid owner ID for email lookup, might fail if ID not found
                input_payload: {
                    message: "Test Alert Message",
                    reading_value: 99.9,
                    phone: "555-0000"
                }
            }
        }
    },
    {
        name: "Job Scheduled",
        payload: {
            record: {
                id: "test-job-1",
                workflow_type: "job_scheduled",
                user_id: "test-user",
                input_payload: {
                    client_email: "delivered@resend.dev",
                    title: "Test HVAC Service",
                    start_time: new Date().toISOString()
                }
            }
        }
    }
];

async function runTests() {
    for (const test of TESTS) {
        console.log(`\n=== Testing: ${test.name} ===`);
        // We'll insert a mock user if needed for System Alert, but for now let's just try invoke
        // Note: System Alert looks up user by ID. If ID doesn't exist, it might fail.
        // We can skip user lookup in the test payload if we mocked it, but the function does the lookup.

        // For System Alert test, we expect "Owner Email Not Found" if we don't provide a valid ID.
        // That's acceptable for verification of the dispatcher logic flow.

        try {
            const res = await fetch(FUNCTION_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${supabaseKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(test.payload)
            });

            const data = await res.json();
            console.log(`Status: ${res.status}`);
            console.log("Response:", data);

            if (res.ok && (data.success || data.message)) {
                console.log("✅ PASS");
            } else {
                console.log("❌ FAIL");
            }

        } catch (e) {
            console.error("Exec Error:", e);
        }
    }
}

runTests();
