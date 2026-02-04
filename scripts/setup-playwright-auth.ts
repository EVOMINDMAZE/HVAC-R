import { chromium } from "@playwright/test";
import * as dotenv from "dotenv";
import { loginAs, USER_CREDENTIALS } from "../e2e/helpers/auth";

dotenv.config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const AUTH_DIR = "playwright/.auth";

async function setupAuthForRole(role: keyof typeof USER_CREDENTIALS) {
  console.log(`Setting up auth for ${role}...`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    baseURL: BASE_URL,
    viewport: { width: 1400, height: 900 },
  });
  const page = await context.newPage();

  try {
    // Use the loginAs helper which handles authentication
    await loginAs(role, page);

    // Verify we're logged in by checking dashboard URL
    const currentUrl = page.url();
    if (currentUrl.includes("/dashboard")) {
      console.log(`✓ ${role} logged in successfully, URL: ${currentUrl}`);
    } else {
      console.log(`⚠ ${role} on unexpected page: ${currentUrl}`);
      // Still try to save state - might still have valid cookies
    }

    // Save storage state
    await context.storageState({ path: `${AUTH_DIR}/${role}.json` });
    console.log(`✓ Auth state saved for ${role} at ${AUTH_DIR}/${role}.json`);
  } catch (error) {
    console.error(`Failed to setup auth for ${role}:`, error);
    throw error;
  } finally {
    await browser.close();
  }
}

async function main() {
  console.log("Setting up Playwright authentication states...");
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth directory: ${AUTH_DIR}`);

  // Ensure auth directory exists
  const fs = await import("fs");
  const path = await import("path");
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log(`Created directory: ${AUTH_DIR}`);
  }

  // Setup auth for each role
  const roles = Object.keys(USER_CREDENTIALS) as Array<
    keyof typeof USER_CREDENTIALS
  >;

  for (const role of roles) {
    try {
      await setupAuthForRole(role);
    } catch (error) {
      console.error(`Failed to setup ${role}, skipping...`);
      // Continue with other roles
    }
  }

  console.log("\nAuth setup complete!");
  console.log("\nTo run tests with pre-authenticated state:");
  console.log("  npm run test:e2e -- --project=admin    # Run admin tests");
  console.log("  npm run test:e2e -- --project=client   # Run client tests");
  console.log("  etc...");
}

main().catch(console.error);
