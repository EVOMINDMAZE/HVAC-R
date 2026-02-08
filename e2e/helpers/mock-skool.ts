import { Page } from "@playwright/test";

/**
 * Mocks the verify_skool_subscription RPC call to return true (verified).
 * This enables company creation tests without requiring actual Skool subscriptions.
 *
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL; if not provided, tries to infer from env.
 */
export async function mockSkoolVerification(page: Page, supabaseUrl?: string) {
  // Default to the environment variable used by the app
  const baseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
  
  // Supabase RPC endpoint pattern
  const rpcUrl = `${baseUrl}/rest/v1/rpc/verify_skool_subscription`;
  
  console.log(`[Mock Skool] Intercepting RPC calls to: ${rpcUrl}`);
  
  await page.route(rpcUrl, async (route) => {
    console.log(`[Mock Skool] Mocking verify_skool_subscription request`);
    
    // Parse the request body to see if a specific community ID was provided
    const request = route.request();
    const postData = request.postData();
    let communityId: string | null = null;
    
    if (postData) {
      try {
        const params = JSON.parse(postData);
        communityId = params.p_skool_community_id || null;
      } catch (e) {
        // ignore
      }
    }
    
    // Always return true (verified)
    const mockResponse = true;
    
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockResponse),
    });
  });
  
  // Also mock the variant with query parameter? Supabase JS client uses POST with body.
  // Cover any other potential URL patterns
  await page.route(`${baseUrl}/rest/v1/rpc/verify_skool_subscription*`, async (route) => {
    console.log(`[Mock Skool] Wildcard match, returning true`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(true),
    });
  });
}

/**
 * Removes the mock for verify_skool_subscription RPC.
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 */
export async function unmockSkoolVerification(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";
  const rpcUrl = `${baseUrl}/rest/v1/rpc/verify_skool_subscription`;
  
  await page.unroute(rpcUrl);
  await page.unroute(`${baseUrl}/rest/v1/rpc/verify_skool_subscription*`);
  
  console.log(`[Mock Skool] Removed mock for ${rpcUrl}`);
}