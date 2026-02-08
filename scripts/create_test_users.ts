import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const users = [
  { email: "student@test.com", role: "student", password: "Password123!" },
  { email: "tech@test.com", role: "technician", password: "Password123!" },
  { email: "client@test.com", role: "client", password: "Password123!" },
  { email: "manager@demo.com", role: "manager", password: "DemoManager123!" },
  { email: "admin@admin.com", role: "admin", password: "ThermoAdmin$2026!" },
];

async function run() {
  console.log("🚀 Starting User Synchronization...");

  // 1. Ensure Users Exist First
  const userMap: Record<string, string> = {};

  for (const u of users) {
    console.log(`\nProcessing user: ${u.email} [${u.role}]`);
    let userId;

    // Create or Find User
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.role.toUpperCase() },
    });

    if (createData.user) {
      console.log(`Created new user: ${createData.user.id}`);
      userId = createData.user.id;
    } else if (createError?.message?.includes("already registered") || createError?.status === 422) {
      console.log("User already exists. Updating password...");
      const { data: { users: allUsers } } = await supabase.auth.admin.listUsers({ perPage: 1000 });
      const found = allUsers.find((x) => x.email?.toLowerCase() === u.email.toLowerCase());
      if (found) {
        userId = found.id;
        await supabase.auth.admin.updateUserById(userId, { password: u.password });
        console.log("Password updated.");
      }
    }
    
    if (userId) {
        userMap[u.email] = userId;
    }
  }

  // 2. Ensure Companies Exist
  const { data: existingCompanies } = await supabase.from("companies").select("id, name, user_id");
  let thermoTech = existingCompanies?.find(c => c.name === "ThermoTech HVAC");
  let demoCompany = existingCompanies?.find(c => c.name === "Demo Company");

  // Create ThermoTech (Owned by Admin if possible, or use existing)
  if (!thermoTech) {
    console.log("Creating ThermoTech HVAC...");
    // Try to assign to admin, but catch error if admin already owns one
    const adminId = userMap["admin@admin.com"];
    
    // Check if admin already owns a company
    const adminOwned = existingCompanies?.find(c => c.user_id === adminId);
    
    if (adminOwned) {
        console.log(`Admin already owns '${adminOwned.name}'. Renaming it to ThermoTech HVAC if needed...`);
        // Optional: Rename it
        await supabase.from("companies").update({ name: "ThermoTech HVAC" }).eq("id", adminOwned.id);
        thermoTech = adminOwned;
    } else {
        const { data } = await supabase.from("companies").insert({
            name: "ThermoTech HVAC",
            subscription_tier: "pro",
            seat_limit: 10,
            user_id: adminId
        }).select().single();
        thermoTech = data;
    }
  } else {
      console.log(`ThermoTech HVAC exists (${thermoTech.id})`);
  }

  // Create Demo Company (Owned by Manager)
  if (!demoCompany) {
    console.log("Creating Demo Company...");
    const managerId = userMap["manager@demo.com"];
    
    if (managerId) {
        const { data, error } = await supabase.from("companies").insert({
            name: "Demo Company",
            subscription_tier: "free",
            seat_limit: 5,
            user_id: managerId
        }).select().single();
        
        if (error) {
            console.error("Failed to create Demo Company:", error);
            // Fallback: If manager already owns a company, use it
            const managerOwned = existingCompanies?.find(c => c.user_id === managerId);
            if (managerOwned) {
                console.log(`Manager already owns '${managerOwned.name}'. Using it as Demo Company.`);
                await supabase.from("companies").update({ name: "Demo Company" }).eq("id", managerOwned.id);
                demoCompany = managerOwned;
            }
        } else {
            demoCompany = data;
        }
    }
  } else {
      console.log(`Demo Company exists (${demoCompany.id})`);
  }

  // 3. Assign Roles
  for (const u of users) {
      const userId = userMap[u.email];
      if (!userId) continue;

      let targetCompanyId = null;
      if (u.email === "manager@demo.com" || u.email === "client@test.com") {
          targetCompanyId = demoCompany?.id;
      } else {
          targetCompanyId = thermoTech?.id;
      }

      if (targetCompanyId) {
          console.log(`Assigning ${u.email} to ${targetCompanyId} as ${u.role}`);
          await supabase.from("user_roles").upsert({
              user_id: userId,
              company_id: targetCompanyId,
              role: u.role
          }, { onConflict: "user_id,company_id" }); // Assuming composite PK exists or we catch error
          
          // Fallback if upsert fails (e.g. if PK is user_id only)
          // We can't fix the PK here easily, but we can try to insert if not exists
      }

      // Special: Admin gets Demo Company access too
      if (u.email === "admin@admin.com" && demoCompany) {
          console.log("Assigning Admin to Demo Company...");
          const { error } = await supabase.from("user_roles").insert({
              user_id: userId,
              company_id: demoCompany.id,
              role: "admin"
          });
          if (error && !error.message.includes("duplicate")) {
              console.error("Failed to add admin to Demo Company:", error);
          }
      }
      
      // Update Metadata
      if (u.role !== "student") {
          const activeId = targetCompanyId || (u.email === "admin@admin.com" ? thermoTech?.id : null);
          if (activeId) {
            await supabase.auth.admin.updateUserById(userId, {
                user_metadata: { active_company_id: activeId, active_role: u.role }
            });
          }
      }
  }

  console.log("\n✅ Sync Complete.");
}

run().catch(console.error);
