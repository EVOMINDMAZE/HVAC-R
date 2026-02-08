import { Page } from "@playwright/test";
import * as dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://rxqflxmzsqhqrzffcsej.supabase.co";

/**
 * Mocks the create_company RPC call to return a fake company ID.
 * This bypasses Skool verification and seat limit checks.
 *
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 * @returns The fake company ID that will be returned by the mock
 */
export async function mockCreateCompanyRPC(page: Page, supabaseUrl?: string): Promise<string> {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/create_company`;
  
  // Generate a deterministic fake company ID (v4 UUID format)
  const fakeCompanyId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  
  console.log(`[Mock Create Company] Intercepting RPC calls to: ${rpcUrl}`);
  
  await page.route(rpcUrl, async (route) => {
    console.log(`[Mock Create Company] Mocking create_company request`);
    
    // Parse request body to capture company name (optional)
    const request = route.request();
    const postData = request.postData();
    let companyName = "Mock Company";
    if (postData) {
      try {
        const params = JSON.parse(postData);
        companyName = params.name || companyName;
      } catch (e) {
        // ignore
      }
    }
    
    // Return a successful response mimicking the real RPC
    const mockResponse = {
      id: fakeCompanyId,
      name: companyName,
      skool_community_id: null,
      skool_community_name: null,
      created_at: new Date().toISOString(),
    };
    
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockResponse),
    });
  });
  
  // Also match any query parameters
  await page.route(`${baseUrl}/rest/v1/rpc/create_company*`, async (route) => {
    console.log(`[Mock Create Company] Wildcard match, returning fake company`);
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ id: fakeCompanyId }),
    });
  });
  
  return fakeCompanyId;
}

/**
 * Removes the mock for create_company RPC.
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 */
export async function unmockCreateCompanyRPC(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const rpcUrl = `${baseUrl}/rest/v1/rpc/create_company`;
  
  await page.unroute(rpcUrl);
  await page.unroute(`${baseUrl}/rest/v1/rpc/create_company*`);
  
  console.log(`[Mock Create Company] Removed mock for ${rpcUrl}`);
}

/**
 * Mocks the direct INSERT into the companies table (POST /rest/v1/companies).
 * This bypasses the Skool verification trigger.
 *
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 * @returns The fake company ID that will be returned by the mock
 */
export async function mockCompaniesInsert(page: Page, supabaseUrl?: string): Promise<string> {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const companiesUrl = `${baseUrl}/rest/v1/companies`;
  
  // Generate a deterministic fake company ID (v4 UUID format)
  const fakeCompanyId = "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee";
  
  console.log(`[Mock Companies Insert] Intercepting POST to: ${companiesUrl}`);
  
  await page.route(companiesUrl, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      // Allow other methods to proceed
      return route.continue();
    }
    
    console.log(`[Mock Companies Insert] Mocking companies INSERT request`);
    
    // Parse request body to capture company data
    const postData = request.postData();
    let companyName = "Mock Company";
    let userId = "";
    if (postData) {
      try {
        const params = JSON.parse(postData);
        companyName = params.name || companyName;
        userId = params.user_id || "";
      } catch (e) {
        // ignore
      }
    }
    
    // Return a successful response mimicking the real insert
    const mockResponse = [{
      id: fakeCompanyId,
      name: companyName,
      user_id: userId,
      skool_community_id: null,
      skool_community_name: null,
      seat_limit: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }];
    
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(mockResponse),
    });
  });
  
  // Also match any query parameters (e.g., select=*)
  await page.route(`${baseUrl}/rest/v1/companies*`, async (route) => {
    const request = route.request();
    if (request.method() !== "POST") {
      return route.continue();
    }
    console.log(`[Mock Companies Insert] Wildcard match, returning fake company`);
    await route.fulfill({
      status: 201,
      contentType: "application/json",
      body: JSON.stringify([{ id: fakeCompanyId }]),
    });
  });
  
  return fakeCompanyId;
}

/**
 * Removes the mock for companies INSERT.
 * @param page Playwright page object
 * @param supabaseUrl Optional Supabase URL
 */
export async function unmockCompaniesInsert(page: Page, supabaseUrl?: string) {
  const baseUrl = supabaseUrl || SUPABASE_URL;
  const companiesUrl = `${baseUrl}/rest/v1/companies`;
  
  await page.unroute(companiesUrl);
  await page.unroute(`${baseUrl}/rest/v1/companies*`);
  
  console.log(`[Mock Companies Insert] Removed mock for ${companiesUrl}`);
}