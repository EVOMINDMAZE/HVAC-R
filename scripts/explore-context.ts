
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const colors = {
    reset: "\x1b[0m",
    blue: "\x1b[34m",
    green: "\x1b[32m",
    yellow: "\x1b[33m",
    cyan: "\x1b[36m",
};

const supabase = createClient(
    process.env.VITE_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function explore() {
    const email = process.argv[2] || 'admin@admin.com';
    console.log(`${colors.cyan}=== 🕵️ CONTEXT EXPLORER ===${colors.reset}`);
    console.log(`${colors.blue}Analyzing state for user: ${email}${colors.reset}\n`);

    // 1. Get User ID
    const { data: users, error: userError } = await supabase
        .from('profiles')
        .select('id, role, company_id')
        .eq('email', email)
        .single();

    if (userError) {
        console.error(`❌ User not found: ${userError.message}`);
        return;
    }

    console.log(`${colors.green}User Profile:${colors.reset}`);
    console.table(users);

    // 2. Get Company Info
    if (users.company_id) {
        const { data: company } = await supabase
            .from('companies')
            .select('*')
            .eq('id', users.company_id)
            .single();

        console.log(`\n${colors.green}Company Info:${colors.reset}`);
        console.table(company);
    } else {
        console.log(`\n${colors.yellow}⚠️ User has no company_id (Common cause for UI failures)${colors.reset}`);
    }

    // 3. Get Recent Jobs for this company
    if (users.company_id) {
        const { data: jobs } = await supabase
            .from('jobs')
            .select('id, ticket_number, status, technician_id')
            .eq('company_id', users.company_id)
            .limit(5);

        console.log(`\n${colors.green}Recent Jobs (Internal State):${colors.reset}`);
        console.table(jobs);
    }

    console.log(`\n${colors.blue}💡 Use this to verify RLS: If data appears here but not in the UI, it's an RLS policy issue.${colors.reset}`);
}

explore();
