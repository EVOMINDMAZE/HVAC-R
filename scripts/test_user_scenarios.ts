import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";

config();

const API_URL = "http://localhost:8081/api";
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing environment variables");
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);

async function createTestUser(email: string, role: string, companyId?: string) {
  // 1. Create user in Supabase Auth
  const { data: user, error: userError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: "Password123!",
    email_confirm: true,
    user_metadata: { first_name: role, last_name: "Test" }
  });

  if (userError || !user.user) {
    console.error(`Failed to create ${role} user:`, userError?.message);
    return null;
  }

  // 2. Assign role
  if (companyId) {
    await supabaseAdmin.from("user_roles").insert({
      user_id: user.user.id,
      role,
      company_id: companyId
    });
  } else if (role === 'admin') {
    // Admin creates a company
    const { data: company } = await supabaseAdmin.from("companies").insert({
      name: `${email}'s Company`,
      user_id: user.user.id
    }).select().single();
    
    if (company) {
        // Assign admin role for this company
        await supabaseAdmin.from("user_roles").insert({
            user_id: user.user.id,
            role: 'admin',
            company_id: company.id
        });
        return { user: user.user, companyId: company.id };
    }
  }

  return { user: user.user, companyId };
}

async function getAuthToken(email: string) {
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({
    email,
    password: "Password123!"
  });
  if (error) throw error;
  return data.session?.access_token;
}

async function testEndpoint(endpoint: string, method: string, token: string, body?: any) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });
  return { status: response.status, data: await response.json().catch(() => ({})) };
}

async function runTests() {
  console.log("🚀 Starting User Scenario Tests...");
  const timestamp = Date.now();

  // 1. Setup Admin
  console.log("\n👤 Setting up Admin...");
  const adminEmail = `admin_${timestamp}@test.com`;
  const adminSetup = await createTestUser(adminEmail, "admin");
  if (!adminSetup) return;
  const adminToken = await getAuthToken(adminEmail);
  const companyId = adminSetup.companyId;

  // 2. Setup Manager
  console.log("👤 Setting up Manager...");
  const managerEmail = `manager_${timestamp}@test.com`;
  await createTestUser(managerEmail, "manager", companyId);
  const managerToken = await getAuthToken(managerEmail);

  // 3. Setup Tech
  console.log("👤 Setting up Technician...");
  const techEmail = `tech_${timestamp}@test.com`;
  await createTestUser(techEmail, "tech", companyId);
  const techToken = await getAuthToken(techEmail);

  // 4. Setup Client
  console.log("👤 Setting up Client...");
  // Clients might not be in a company the same way, but let's assume they are linked via client_id or similar
  // For this test, we'll just check if they can access fleet data (should fail)
  const clientEmail = `client_${timestamp}@test.com`;
  await createTestUser(clientEmail, "client", null); // Client might not have company_id in user_roles directly in this model?
  const clientToken = await getAuthToken(clientEmail);


  console.log("\n🧪 Executing Tests...");

  // Scenario 1: Admin Actions
  console.log("\n[Admin] Testing permissions:");
  
  // Admin: View Fleet
  const adminFleet = await testEndpoint("/fleet/status", "GET", adminToken);
  console.log(`  - View Fleet Status: ${adminFleet.status === 200 ? "✅ PASS" : "❌ FAIL"} (${adminFleet.status})`);

  // Admin: Invite User
  const adminInvite = await testEndpoint("/team/invite", "POST", adminToken, {
    email: `new_tech_${timestamp}@test.com`,
    role: "tech",
    full_name: "New Tech"
  });
  console.log(`  - Invite Technician: ${adminInvite.status === 200 ? "✅ PASS" : "❌ FAIL"} (${adminInvite.status})`);


  // Scenario 2: Manager Actions
  console.log("\n[Manager] Testing permissions:");
  
  // Manager: View Fleet
  const managerFleet = await testEndpoint("/fleet/status", "GET", managerToken);
  console.log(`  - View Fleet Status: ${managerFleet.status === 200 ? "✅ PASS" : "❌ FAIL"} (${managerFleet.status})`);

  // Manager: Invite Tech (Allowed)
  const managerInviteTech = await testEndpoint("/team/invite", "POST", managerToken, {
    email: `manager_invited_tech_${timestamp}@test.com`,
    role: "tech",
    full_name: "Manager Invited Tech"
  });
  console.log(`  - Invite Technician: ${managerInviteTech.status === 200 ? "✅ PASS" : "❌ FAIL"} (${managerInviteTech.status})`);

  // Manager: Invite Admin (Forbidden)
  const managerInviteAdmin = await testEndpoint("/team/invite", "POST", managerToken, {
    email: `manager_invited_admin_${timestamp}@test.com`,
    role: "admin",
    full_name: "Manager Invited Admin"
  });
  console.log(`  - Invite Admin (Should Fail): ${managerInviteAdmin.status === 403 ? "✅ PASS" : "❌ FAIL"} (${managerInviteAdmin.status})`);


  // Scenario 3: Technician Actions
  console.log("\n[Technician] Testing permissions:");

  // Tech: View Fleet (Allowed?) - Depends on implementation. Fleet dashboard is usually for dispatchers.
  // Let's check logic. `getFleetStatus` requires companyId. Tech has companyId.
  // Code doesn't restrict by role, only company association.
  const techFleet = await testEndpoint("/fleet/status", "GET", techToken);
  console.log(`  - View Fleet Status: ${techFleet.status === 200 ? "✅ PASS" : "❌ FAIL"} (${techFleet.status})`);

  // Tech: Invite User (Forbidden)
  const techInvite = await testEndpoint("/team/invite", "POST", techToken, {
    email: `tech_invited_${timestamp}@test.com`,
    role: "tech",
    full_name: "Tech Invited"
  });
  console.log(`  - Invite User (Should Fail): ${techInvite.status === 403 ? "✅ PASS" : "❌ FAIL"} (${techInvite.status})`);


  // Scenario 4: Client Actions
  console.log("\n[Client] Testing permissions:");

  // Client: View Fleet (Forbidden - Client has no companyId usually, or restricted)
  // Our getFleetStatus checks `getUserCompanyId`. If client is not in company or role logic prevents it.
  const clientFleet = await testEndpoint("/fleet/status", "GET", clientToken);
  console.log(`  - View Fleet Status (Should Fail): ${clientFleet.status === 400 || clientFleet.status === 403 ? "✅ PASS" : "❌ FAIL"} (${clientFleet.status})`);

  console.log("\n🏁 Tests Completed.");
  
  // Cleanup (Optional - Supabase makes it hard to hard-delete auth users without admin API loop)
}

runTests().catch(console.error);
