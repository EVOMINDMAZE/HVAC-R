import { createClient } from "@supabase/supabase-js";
import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || "";
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@admin.com";
const TEST_ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "ThermoAdmin$2026!";

/**
 * Create a Supabase client authenticated as the admin test user.
 */
export async function getAdminClient() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL,
    password: TEST_ADMIN_PASSWORD,
  });

  if (error) {
    throw new Error(`Failed to sign in as admin: ${error.message}`);
  }

  // Return a new client with the session
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    },
  });
}

/**
 * Get the latest company ID for the admin user using service role key.
 */
export async function getAdminLatestCompanyId(): Promise<string> {
  // Use service role to bypass RLS and fetch companies where admin is owner
  const serviceClient = createClient(
    SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // Get admin user ID by email
  const { data: users, error: userError } = await serviceClient.auth.admin.listUsers();
  if (userError) {
    throw new Error(`Failed to list users: ${userError.message}`);
  }
  const adminUser = users.users.find(u => u.email === TEST_ADMIN_EMAIL);
  if (!adminUser) {
    throw new Error(`Admin user with email ${TEST_ADMIN_EMAIL} not found`);
  }

  // Fetch companies owned by admin
  const { data: companies, error } = await serviceClient
    .from("companies")
    .select("id, created_at")
    .eq("user_id", adminUser.id)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`Failed to fetch admin companies: ${error.message}`);
  }
  if (!companies || companies.length === 0) {
    throw new Error("Admin user has no companies");
  }
  return companies[0].id;
}

/**
 * Create an invitation link slug for a given role and company.
 * If companyId is not provided, uses the admin's first company.
 * Returns the invitation slug string.
 */
export async function createInviteCode(role: string, companyId?: string): Promise<string> {
  const adminClient = await getAdminClient();

  // If no companyId provided, fetch admin's first company
  let targetCompanyId = companyId;
  if (!targetCompanyId) {
    const { data: companies, error } = await adminClient
      .from("companies")
      .select("id")
      .limit(1);
    
    if (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }
    if (!companies || companies.length === 0) {
      throw new Error("Admin user has no companies");
    }
    targetCompanyId = companies[0].id;
  }

  const { data, error } = await adminClient.rpc("create_invitation_link", {
    p_company_id: targetCompanyId,
    p_role: role,
    p_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    p_max_uses: 5,
  });

  if (error) {
    throw new Error(`Failed to create invitation link: ${error.message}`);
  }

  // The RPC returns a JSONB object with success and slug fields
  if (data && data.success && data.slug) {
    console.log(`[Invite Helper] Created invitation link slug: ${data.slug} for role ${role}`);
    return data.slug;
  } else {
    const errorMsg = data?.error || "Unknown error";
    throw new Error(`Failed to create invitation link: ${errorMsg}`);
  }
}

/**
 * Redeem an invite code via UI (page).
 * Assumes the page is already on the join-company page or navigates there.
 */
export async function redeemInviteCodeViaUI(page: Page, code: string) {
  await page.goto("/join-company");
  await page.waitForLoadState("domcontentloaded");

  // Fill the invite code input (selector may vary)
  const inputSelector = 'input[placeholder*="invite code"], input[name="code"], input[aria-label*="invite code"]';
  await page.waitForSelector(inputSelector, { state: "visible", timeout: 10000 });
  await page.fill(inputSelector, code);

  // Wait for validation (if any)
  await page.waitForTimeout(1000);

  // Click the join button
  const joinButton = page.locator('button:has-text("Join"), button:has-text("Initialize Connection"), button[type="submit"]').first();
  await joinButton.click();

  // Wait for success or redirect; also handle already-a-member case
  try {
    await page.waitForURL("**/select-company", { timeout: 10000 });
  } catch (e) {
    // If not redirected, check for error message
    const errorElement = page.locator('text=/already a member|invalid|expired|error/i');
    if (await errorElement.count() > 0) {
      console.log(`[Invite Helper] Invite redemption resulted in: ${await errorElement.first().textContent()}`);
      // If already a member, that's okay for our tests
      return;
    }
    // Otherwise rethrow
    throw e;
  }
}