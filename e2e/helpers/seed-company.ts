import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@admin.com";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set. Company seeding may fail.");
}

/**
 * Get admin user's UUID by email using service role client.
 */
async function getAdminUserId(): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await client.auth.admin.listUsers();
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const adminUser = data.users.find(u => u.email === TEST_ADMIN_EMAIL);
  if (!adminUser) {
    throw new Error(`Admin user with email ${TEST_ADMIN_EMAIL} not found`);
  }

  return adminUser.id;
}

/**
 * Ensure the admin user has at least one company.
 * If no companies exist, creates a default company and assigns admin as owner.
 * Returns the company ID.
 */
export async function ensureAdminCompany(): Promise<string> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminUserId = await getAdminUserId();

  // Check existing companies owned by admin
  const { data: existingCompanies, error: fetchError } = await client
    .from("companies")
    .select("id, name")
    .eq("user_id", adminUserId)
    .limit(1);

  if (fetchError) {
    console.warn(`Error checking existing companies: ${fetchError.message}`);
  }

  if (existingCompanies && existingCompanies.length > 0) {
    console.log(`[Seed Company] Admin already has company: ${existingCompanies[0].name} (${existingCompanies[0].id})`);
    return existingCompanies[0].id;
  }

  // No company found, create one
  const companyName = `Test Company ${Date.now()}`;
  console.log(`[Seed Company] Creating company for admin: ${companyName}`);

  // Insert company (bypassing Skool trigger using service role)
  const { data: newCompany, error: insertError } = await client
    .from("companies")
    .insert({
      name: companyName,
      user_id: adminUserId,
      skool_community_id: null,
      skool_community_name: null,
      seat_limit: 10,
    })
    .select("id")
    .single();

  if (insertError) {
    throw new Error(`Failed to insert company: ${insertError.message}`);
  }

  const companyId = newCompany.id;
  console.log(`[Seed Company] Company created with ID: ${companyId}`);

  // Create user_roles entry for admin as owner
  const { error: roleError } = await client
    .from("user_roles")
    .insert({
      user_id: adminUserId,
      company_id: companyId,
      role: "admin",
      is_owner: true,
    });

  if (roleError) {
    // If role insertion fails, we still have a company; log warning
    console.warn(`[Seed Company] Failed to create user_roles entry: ${roleError.message}`);
  } else {
    console.log(`[Seed Company] Admin assigned as owner of company ${companyId}`);
  }

  return companyId;
}

/**
 * Ensure all test users have at least one company (optional).
 * This is a more comprehensive seeding function for test environment.
 */
export async function seedTestCompanies(): Promise<void> {
  console.log("[Seed Company] Seeding test companies...");
  
  const adminCompanyId = await ensureAdminCompany();
  console.log(`[Seed Company] Admin company ID: ${adminCompanyId}`);
  
  // Optionally create companies for other test users (manager, technician, client, student)
  // For now, just ensure admin has a company.
}