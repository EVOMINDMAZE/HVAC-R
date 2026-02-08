
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

async function setup() {
    console.log("Setting up Admin Multi-Tenancy...");

    // 1. Get Admin User ID
    const { data: { users }, error: userError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

    if (userError) {
        console.error("List Users Error:", userError);
        return;
    }

    console.log(`Found ${users.length} users.`);
    // console.log("Emails:", users.map(u => u.email));

    const adminUser = users?.find(u => u.email === 'admin@admin.com');

    if (!adminUser) {
        console.error("Admin user not found! Available emails:", users.map(u => u.email));
        return;
    }
    console.log(`Found Admin: ${adminUser.id}`);

    // 2. Check Companies owned by Admin
    const { data: companies, error: compError } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', adminUser.id);

    console.log(`Admin owns ${companies?.length || 0} companies.`);

    // Check if Admin is a MEMBER of other companies (via user_roles)
    const { data: roles } = await supabase
        .from('user_roles')
        .select('company_id')
        .eq('user_id', adminUser.id);

    // Total companies accessible
    const totalCompanies = new Set([
        ...(companies?.map(c => c.id) || []),
        ...(roles?.map(r => r.company_id) || [])
    ]);

    console.log(`Admin has access to ${totalCompanies.size} companies.`);

    if (totalCompanies.size < 2) {
        console.log("Creating a second company for testing...");

        // Strategy: Find a user who does NOT own a company, or create one.
        // 1. Get all owners
        const { data: allCompanies } = await supabase.from('companies').select('user_id');
        const existingOwners = new Set(allCompanies?.map(c => c.user_id));

        // 2. Find available user
        let ownerId = users?.find(u => u.email !== 'admin@admin.com' && !existingOwners.has(u.id))?.id;

        if (!ownerId) {
            console.log("No non-owner user found. Creating a new dummy user...");
            const email = `test_owner_${Date.now()}@example.com`;
            const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
                email,
                password: 'password123',
                email_confirm: true
            });

            if (createUserError || !newUser.user) {
                console.error("Failed to create new user:", createUserError);
                return;
            }
            ownerId = newUser.user.id;
            console.log(`Created new owner: ${email} (${ownerId})`);
        } else {
            console.log(`Using existing non-owner user: ${ownerId}`);
        }

        // 3. Create Company
        const { data: newCompany, error: createError } = await supabase
            .from('companies')
            .insert({
                name: 'Alternative Test Company',
                user_id: ownerId
            })
            .select()
            .single();

        if (createError) {
            console.error("Error creating company:", createError);
        } else {
            console.log("Created Company:", newCompany);
            // 4. Add Admin as Member
            const { error: roleError } = await supabase.from('user_roles').insert({
                user_id: adminUser.id,
                company_id: newCompany.id,
                role: 'admin'
            });

            if (roleError) {
                console.error("Error adding role:", roleError);
            } else {
                console.log("Added admin role to new company.");
            }
        }
    } else {
        console.log("Admin already has sufficient companies for testing.");
    }
}

setup();
