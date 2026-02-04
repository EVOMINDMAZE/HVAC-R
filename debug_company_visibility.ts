
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";

// Simple .env parser
function loadEnv() {
    try {
        const envPath = path.resolve(process.cwd(), '.env');
        const envFile = fs.readFileSync(envPath, 'utf8');
        const envLines = envFile.split('\n');
        for (const line of envLines) {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        }
    } catch (e) {
        console.warn("Could not load .env file", e);
    }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TARGET_EMAIL = "hanniz.riadus@outlook.com";

async function debugUser() {
    console.log(`--- Debugging User: ${TARGET_EMAIL} ---`);

    // 1. Get User ID - Fetch all pages if needed (simplified to 1000 here)
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (userError) {
        console.error("Error listing users:", userError);
        return;
    }

    console.log(`Total users found: ${users.length}`);
    // Log all emails to manual check (first 20 to avoid spam, plus target search)
    // console.log("Emails found:", users.map(u => u.email).join(", ")); 

    const user = users.find(u => u.email?.toLowerCase().trim() === TARGET_EMAIL.toLowerCase().trim());

    if (!user) {
        console.log(`User ${TARGET_EMAIL} NOT FOUND in Auth list.`);
        console.log("Closest matches:", users.filter(u => u.email?.includes("hanniz")).map(u => u.email));
        return;
    }

    console.log(`User ID: ${user.id}`);

    // 2. Check User Roles
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*, companies(name)')
        .eq('user_id', user.id);

    if (rolesError) {
        console.error("Error fetching user_roles:", rolesError);
    } else {
        console.log("\nUser Roles found:");
        console.table(roles.map(r => ({
            company_id: r.company_id,
            company_name: r.companies?.name,
            role: r.role,
            client_id: r.client_id
        })));
    }

    // 3. Check Owned Companies
    const { data: owned, error: ownedError } = await supabase
        .from('companies')
        .select('id, name')
        .eq('user_id', user.id);

    if (ownedError) {
        console.error("Error fetching owned companies:", ownedError);
    } else {
        console.log("\nCompanies Owned by User:");
        console.table(owned);
    }

    console.log("\n--- End Debug ---");
}

debugUser();
