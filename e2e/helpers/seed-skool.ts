import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const TEST_ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@admin.com";

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set. Skool subscription seeding may fail.");
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
 * Ensure the admin user has an active Skool subscription.
 * If a subscription already exists, updates it to be active.
 * Returns the skool_community_id used.
 */
export async function seedSkoolSubscriptionForAdmin(
  skoolCommunityId = "test-community",
  skoolCommunityName = "Test Community"
): Promise<void> {
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const adminUserId = await getAdminUserId();

  // Check existing subscription
  const { data: existing, error: fetchError } = await client
    .from("skool_subscriptions")
    .select("id")
    .eq("user_id", adminUserId)
    .eq("skool_community_id", skoolCommunityId)
    .maybeSingle();

  if (fetchError) {
    console.warn(`Error checking existing subscription: ${fetchError.message}`);
  }

  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  if (existing) {
    // Update to active
    const { error: updateError } = await client
      .from("skool_subscriptions")
      .update({
        subscription_status: "active",
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (updateError) {
      throw new Error(`Failed to update Skool subscription: ${updateError.message}`);
    }
    console.log(`[Seed Skool] Updated existing subscription for admin ${TEST_ADMIN_EMAIL}`);
  } else {
    // Insert new subscription
    const { error: insertError } = await client
      .from("skool_subscriptions")
      .insert({
        user_id: adminUserId,
        skool_community_id: skoolCommunityId,
        skool_community_name: skoolCommunityName,
        subscription_status: "active",
        subscription_tier: "premium",
        expires_at: expiresAt,
      });

    if (insertError) {
      throw new Error(`Failed to insert Skool subscription: ${insertError.message}`);
    }
    console.log(`[Seed Skool] Created subscription for admin ${TEST_ADMIN_EMAIL} (community ${skoolCommunityId})`);
  }
}