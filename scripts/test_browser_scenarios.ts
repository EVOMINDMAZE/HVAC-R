
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

// Admin client for setup/cleanup
const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to create a user client
const createUserClient = async (email: string, password: string = "Password123!") => {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return { client, user: data.user, session: data.session };
};

const runTest = async (name: string, fn: () => Promise<void>) => {
  process.stdout.write(`Testing ${name}... `);
  try {
    await fn();
    console.log("✅ PASS");
    return true;
  } catch (error: any) {
    console.log("❌ FAIL");
    console.error("  Error:", error.message || error);
    return false;
  }
};

async function main() {
  console.log("🚀 Starting Browser Scenario Simulation...\n");

  const results: Record<string, string> = {};

  // --- SCENARIO 1: Multi-Company Selection Flow ---
  console.log("## SCENARIO 1: Multi-Company Selection Flow");
  
  await runTest("Login as Admin (Multiple Companies)", async () => {
    const { client, user } = await createUserClient("admin@admin.com");
    if (!user) throw new Error("Login failed");
    
    // Check if user has companies
    const { data: companies } = await client.from("companies").select("id, name");
    
    if (!companies || companies.length < 2) {
        console.log("  Creating a second company for testing...");
        // Create a second company
        const { data: newCompany, error } = await client.from("companies").insert({
            name: "Demo Company",
            user_id: user.id, // Owner
            subscription_tier: "free"
        }).select().single();
        
        if (error) {
             console.warn("  Failed to create second company:", error.message);
        } else {
             console.log(`  Created company: ${newCompany.name}`);
        }
    }
  });

  await runTest("Select & Switch Company", async () => {
    const { client, user } = await createUserClient("admin@admin.com");
    
    // 1. Get Companies
    const { data: companies } = await client.from("companies").select("*");
    if (!companies || companies.length === 0) throw new Error("No companies found");
    
    const firstCompany = companies[0];
    // Refresh companies list if we just added one
    const { data: allCompanies } = await client.from("companies").select("*");
    const secondCompany = allCompanies && allCompanies.length > 1 ? allCompanies[1] : firstCompany;
    
    // 2. Switch to First Company
    const { data: switch1, error: err1 } = await client.rpc("switch_company", {
        target_company_id: firstCompany.id
    });
    if (err1) throw new Error(`Switch to ${firstCompany.name} failed: ${err1.message}`);
    
    // Verify metadata
    const { data: user1 } = await client.auth.getUser();
    if (user1.user?.user_metadata.active_company_id !== firstCompany.id) {
        throw new Error("Active company ID did not update");
    }

    // 3. Switch to Second Company (if exists and different)
    if (firstCompany.id !== secondCompany.id) {
        const { error: err2 } = await client.rpc("switch_company", {
            target_company_id: secondCompany.id
        });
        if (err2) throw new Error(`Switch to ${secondCompany.name} failed: ${err2.message}`);
        
        const { data: user2 } = await client.auth.getUser();
        if (user2.user?.user_metadata.active_company_id !== secondCompany.id) {
            throw new Error("Active company ID did not update on second switch");
        }
    }
  });


  // --- SCENARIO 2: Invite Code System ---
  console.log("\n## SCENARIO 2: Invite Code System");
  
  let inviteCode: string = "";

  await runTest("Generate Invite Code (Admin)", async () => {
    const { client, user } = await createUserClient("admin@admin.com");
    
    // Ensure we are in a valid company context
    const { data: companies } = await client.from("companies").select("id").limit(1);
    await client.rpc("switch_company", { target_company_id: companies![0].id });

    const { data, error } = await client.rpc("create_invite_code", {
        p_company_id: companies![0].id,
        p_role: "technician",
        p_max_uses: 5
    });
    
    if (error) throw error;
    if (!data) throw new Error("No code returned");
    
    // Based on RPC definition, it returns: { success: true, code: "...", ... }
    if (data.success && data.code) {
        inviteCode = data.code;
    } else {
        throw new Error(`Unexpected response: ${JSON.stringify(data)}`);
    }
    
    console.log(`  Generated Code: ${inviteCode}`);
  });

  await runTest("Join with Invite Code (New User)", async () => {
    // Create a temp user
    const tempEmail = `temp_${Date.now()}@test.com`;
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email: tempEmail,
        password: "Password123!",
        email_confirm: true
    });
    if (authError) throw authError;

    // Login as new user
    const { client } = await createUserClient(tempEmail);
    
    // Use code
    const { data, error } = await client.rpc("use_invite_code", {
        p_code: inviteCode
    });
    
    if (error) throw error;
    
    // Verify access
    const { data: roles } = await client.from("user_roles").select("*");
    if (!roles || roles.length === 0) throw new Error("User has no roles after joining");
  });


  // --- SCENARIO 3: RBAC ---
  console.log("\n## SCENARIO 3: Role-Based Access Control");
  
  await runTest("Technician Restrictions", async () => {
    const { client } = await createUserClient("tech@test.com");
    
    // Try to update company settings (Should Fail)
    // We need a valid company ID for the tech
    const { data: user } = await client.auth.getUser();
    const companyId = user.user?.user_metadata?.active_company_id;
    
    if (companyId) {
        const { error } = await client.rpc("update_company_settings", {
            p_company_id: companyId,
            p_settings: { tax_rate: 99 }
        });
        
        if (!error) throw new Error("Technician was able to update settings (Should be forbidden)");
        // We expect a 403 or permission denied error
    } else {
        console.warn("  Skipping settings check (Tech has no active company)");
    }
  });

  await runTest("Manager/Admin Access", async () => {
    const { client } = await createUserClient("admin@admin.com");
    const { data: companies } = await client.from("companies").select("id").limit(1);
    const companyId = companies![0].id;

    // Should succeed
    const { error } = await client.rpc("update_company_settings", {
        p_company_id: companyId,
        p_settings: { tax_rate: 10 }
    });
    
    if (error) throw error;
  });


  // --- SCENARIO 4: Company Settings ---
  console.log("\n## SCENARIO 4: Company Settings");
  
  await runTest("Update Branding & Regional", async () => {
    const { client } = await createUserClient("admin@admin.com");
    const { data: companies } = await client.from("companies").select("id").limit(1);
    const companyId = companies![0].id;

    const newSettings = {
        primary_color: "#FF0000",
        timezone: "America/New_York",
        currency: "USD"
    };

    const { error } = await client.rpc("update_company_settings", {
        p_company_id: companyId,
        p_settings: newSettings
    });
    
    if (error) throw error;

    // Verify
    const { data: settings } = await client.from("company_settings").select("*").eq("company_id", companyId).single();
    if (settings.primary_color !== "#FF0000") throw new Error("Settings not persisted");
  });

  // --- SCENARIO 6: Security ---
  console.log("\n## SCENARIO 6: Security Edge Cases");
  
  await runTest("Invalid Invite Code", async () => {
     const { client } = await createUserClient("admin@admin.com"); // User doesn't matter much for invalid code check
     const { error } = await client.rpc("use_invite_code", {
         invite_code: "INVALID-CODE-123"
     });
     if (!error) throw new Error("Invalid code was accepted");
  });

  console.log("\n-------------------------------------------");
  console.log("✅ Simulation Complete");
}

main().catch(console.error);
