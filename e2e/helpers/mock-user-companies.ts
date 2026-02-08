import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";

/**
 * Mock the get_user_companies_v2 RPC call to return test companies.
 * This eliminates network dependencies and ensures consistent test data.
 *
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 * @param companies Array of companies to return (default: one company with admin role)
 */
export async function mockUserCompaniesRPC(
  page: Page,
  supabaseUrl?: string,
  companies?: Array<{
    company_id: string;
    company_name: string;
    role: string;
    is_owner: boolean;
  }>
) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/get_user_companies_v2`;
  
  // Default company for testing
  const defaultCompanies = companies || [{
    company_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    company_name: "Test Company",
    role: "admin",
    is_owner: true,
  }];
  
  console.log(`[Mock User Companies] Intercepting RPC calls to: ${rpcUrl}`);
  console.log(`[Mock User Companies] Will return ${defaultCompanies.length} company(s)`);
  
  await page.route(rpcUrl, async (route) => {
    console.log(`[Mock User Companies] Mocking get_user_companies_v2 request`);
    
    // Note: The real RPC uses auth.uid() to determine user; our mock returns same for all users.
    // For more sophisticated tests, we could parse the Authorization header and return user-specific companies.
    
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(defaultCompanies),
    });
  });
  
  // Also match any query parameters
  await page.route(`${baseUrl}/rest/v1/rpc/get_user_companies_v2*`, async (route) => {
    console.log(`[Mock User Companies] Wildcard match, returning default companies`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(defaultCompanies),
    });
  });
}

/**
 * Removes the mock for get_user_companies_v2 RPC.
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 */
export async function unmockUserCompaniesRPC(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/get_user_companies_v2`;
  
  await page.unroute(rpcUrl);
  await page.unroute(`${baseUrl}/rest/v1/rpc/get_user_companies_v2*`);
  
  console.log(`[Mock User Companies] Removed mock for ${rpcUrl}`);
}

/**
 * Mock switch_company RPC to return success.
 * This is used when the app switches active company.
 */
export async function mockSwitchCompanyRPC(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/switch_company`;
  
  console.log(`[Mock Switch Company] Intercepting RPC calls to: ${rpcUrl}`);
  
  await page.route(rpcUrl, async (route) => {
    console.log(`[Mock Switch Company] Mocking switch_company request`);
    
    // Parse request body to see target company
    const request = route.request();
    const postData = request.postData();
    let targetCompanyId = "";
    if (postData) {
      try {
        const params = JSON.parse(postData);
        targetCompanyId = params.target_company_id || "";
      } catch (e) {
        // ignore
      }
    }
    
    // Always return success
    const mockResponse = { success: true };
    
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockResponse),
    });
  });
  
  // Wildcard
  await page.route(`${baseUrl}/rest/v1/rpc/switch_company*`, async (route) => {
    console.log(`[Mock Switch Company] Wildcard match, returning success`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ success: true }),
    });
  });
}

/**
 * Removes the mock for switch_company RPC.
 */
export async function unmockSwitchCompanyRPC(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/switch_company`;
  
  await page.unroute(rpcUrl);
  await page.unroute(`${baseUrl}/rest/v1/rpc/switch_company*`);
  
  console.log(`[Mock Switch Company] Removed mock for ${rpcUrl}`);
}