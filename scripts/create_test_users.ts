import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
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

function isAlreadyRegistered(err: any): boolean {
  const msg = String(err?.message || "");
  return (
    msg.toLowerCase().includes("already registered") ||
    msg.toLowerCase().includes("already exists") ||
    err?.status === 422
  );
}

async function run() {
  console.log("🚀 Starting User Synchronization...");

  // 1. Ensure Users Exist First
  const userMap: Record<string, string> = {};

  for (const u of users) {
    console.log(`\nProcessing user: ${u.email} [${u.role}]`);
    let userId: string | undefined;

    // Create or Find User
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email: u.email,
        password: u.password,
        email_confirm: true,
        user_metadata: { name: u.role.toUpperCase() },
      });

    if (createData.user) {
      console.log(`Created new user: ${createData.user.id}`);
      userId = createData.user.id;
    } else if (createError && isAlreadyRegistered(createError)) {
      console.log("User already exists. Updating password...");
      // NOTE: Supabase local may error on listUsers; prefer RPC lookup by email.
      const { data: foundUserId, error: idLookupError } = await supabase.rpc(
        "get_user_id_by_email",
        { user_email: u.email },
      );
      if (idLookupError || !foundUserId) {
        throw new Error(
          `get_user_id_by_email failed for ${u.email}: ${idLookupError?.message || "no id returned"}`,
        );
      }

      userId = String(foundUserId);
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: u.password,
          email_confirm: true,
          user_metadata: { name: u.role.toUpperCase() },
        },
      );
      if (updateError) {
        throw new Error(
          `updateUserById failed for ${u.email}: ${updateError.message}`,
        );
      }
      console.log("Password updated.");
    } else if (createError) {
      throw new Error(`createUser failed for ${u.email}: ${createError.message}`);
    }
    
    if (userId) {
        userMap[u.email] = userId;
    }
  }

  // 2. Ensure Companies Exist
  const { data: existingCompanies, error: companiesReadErr } = await supabase
    .from("companies")
    .select("id, name, user_id");
  if (companiesReadErr) {
    throw new Error(`Failed to read companies: ${companiesReadErr.message}`);
  }
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
        const { error } = await supabase
          .from("companies")
          .update({ name: "ThermoTech HVAC" })
          .eq("id", adminOwned.id);
        if (error) throw new Error(`Failed to rename admin company: ${error.message}`);
        thermoTech = adminOwned;
    } else {
        const { data, error } = await supabase.from("companies").insert({
            name: "ThermoTech HVAC",
            subscription_tier: "pro",
            seat_limit: 10,
            user_id: adminId
        }).select().single();
        if (error) throw new Error(`Failed to create ThermoTech HVAC: ${error.message}`);
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
                const { error: renameErr } = await supabase
                  .from("companies")
                  .update({ name: "Demo Company" })
                  .eq("id", managerOwned.id);
                if (renameErr) throw new Error(`Failed to rename manager company: ${renameErr.message}`);
                demoCompany = managerOwned;
            }
        } else {
            demoCompany = data;
        }
    }
  } else {
      console.log(`Demo Company exists (${demoCompany.id})`);
  }

  if (!thermoTech?.id) throw new Error("ThermoTech HVAC company not available");
  if (!demoCompany?.id) throw new Error("Demo Company not available");

  // Ensure a clients row exists for the demo client portal user.
  const { data: existingClient, error: clientFindErr } = await supabase
    .from("clients")
    .select("id")
    .eq("company_id", demoCompany.id)
    .eq("contact_email", "client@test.com")
    .maybeSingle();
  if (clientFindErr) {
    throw new Error(`Failed to find demo client row: ${clientFindErr.message}`);
  }

  let demoClientId = existingClient?.id as string | undefined;
  if (!demoClientId) {
    const { data: createdClient, error: clientCreateErr } = await supabase
      .from("clients")
      .insert({
        company_id: demoCompany.id,
        name: "Demo Client",
        contact_email: "client@test.com",
      })
      .select("id")
      .single();
    if (clientCreateErr) {
      throw new Error(`Failed to create demo client row: ${clientCreateErr.message}`);
    }
    demoClientId = createdClient.id;
  }

  // 3. Assign Roles
  for (const u of users) {
      const userId = userMap[u.email];
      if (!userId) continue;

      // NOTE: The baseline schema's check constraint `check_multi_role_mapping`
      // does not permit `student` rows in user_roles. Students are treated as
      // non-company users and rely on auth metadata + app-side gating.
      if (u.role === "student") {
        const { error } = await supabase.auth.admin.updateUserById(userId, {
          user_metadata: { active_role: "student" },
        });
        if (error) {
          throw new Error(`Failed to set metadata for ${u.email}: ${error.message}`);
        }
        continue;
      }

      let targetCompanyId = null;
      if (u.email === "manager@demo.com" || u.email === "client@test.com") {
          targetCompanyId = demoCompany?.id;
      } else {
          targetCompanyId = thermoTech?.id;
      }

      if (targetCompanyId) {
          console.log(`Assigning ${u.email} to ${targetCompanyId} as ${u.role}`);
          const payload: any = {
            user_id: userId,
            company_id: targetCompanyId,
            role: u.role,
            client_id: null,
          };

          if (u.role === "client") {
            payload.client_id = demoClientId;
          }

          const { error: roleErr } = await supabase
            .from("user_roles")
            .upsert(payload, { onConflict: "user_id,company_id" });
          if (roleErr) {
            throw new Error(`Failed to upsert user_roles for ${u.email}: ${roleErr.message}`);
          }
          
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
              throw new Error(`Failed to add admin to Demo Company: ${error.message}`);
          }
      }
      
      // Update Metadata
      if (u.role !== "student") {
          const activeId = targetCompanyId || (u.email === "admin@admin.com" ? thermoTech?.id : null);
          if (activeId) {
            const { error } = await supabase.auth.admin.updateUserById(userId, {
              user_metadata: { active_company_id: activeId, active_role: u.role },
            });
            if (error) {
              throw new Error(`Failed to update metadata for ${u.email}: ${error.message}`);
            }
          }
      }
  }

  console.log("\n✅ Sync Complete.");
}

run().catch(console.error);
