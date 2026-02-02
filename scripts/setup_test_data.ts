
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const ADMIN_EMAIL = 'admin@admin.com';

async function main() {
    const action = process.argv[2];

    // Get admin user ID
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();

    if (usersError) {
        console.error("Error fetching users:", usersError);
        process.exit(1);
    }

    const adminUser = users?.find(u => u.email === ADMIN_EMAIL);

    if (!adminUser) {
        console.error(`Admin user ${ADMIN_EMAIL} not found`);
        process.exit(1);
    }

    const userId = adminUser.id;
    console.log("Found admin user:", userId);

    if (action === 'disable') {
        console.log("Disabling all SMS/Email automation for admin company...");
        const { error } = await supabase
            .from('companies')
            .update({
                alert_config: {
                    sms_enabled: false,
                    email_enabled: false,
                    workflows: {
                        review_request: { sms: false, email: false },
                        client_invite: { sms: false, email: false },
                        system_alert: { sms: false, email: false },
                        job_scheduled: { sms: false, email: false }
                    }
                }
            })
            .eq('user_id', userId);

        if (error) {
            console.error("Error updating company:", error);
            process.exit(1);
        }

        console.log("✅ Success: All automation disabled for admin company");
        console.log("Now run: npx tsx scripts/verify_sms.ts");
        console.log("Expected: All notifications should be skipped");

    } else if (action === 'enable') {
        console.log("Enabling all SMS/Email automation for admin company...");
        const { error } = await supabase
            .from('companies')
            .update({
                alert_config: {
                    sms_enabled: true,
                    email_enabled: true,
                    workflows: {
                        review_request: { sms: true, email: true },
                        client_invite: { sms: true, email: true },
                        system_alert: { sms: true, email: true },
                        job_scheduled: { sms: true, email: true }
                    }
                }
            })
            .eq('user_id', userId);

        if (error) {
            console.error("Error updating company:", error);
            process.exit(1);
        }

        console.log("✅ Success: All automation enabled for admin company");
        console.log("Now run: npx tsx scripts/verify_sms.ts");
        console.log("Expected: All notifications should be sent");

    } else {
        console.log("Usage: npx tsx scripts/setup_test_data.ts [enable|disable]");
        console.log("  enable  - Turn ON all automation (positive test)");
        console.log("  disable - Turn OFF all automation (negative test)");
    }
}

main();
