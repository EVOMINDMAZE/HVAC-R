/**
 * Playwright Authentication Setup Script
 *
 * This script sets up authentication states for E2E tests that require
 * authenticated users. It creates storage state files for each role.
 *
 * Setup assumptions:
 * - Frontend server running at BASE_URL (default: http://localhost:3001)
 * - Backend/Supabase accessible and configured
 * - Test users exist in the system with credentials from e2e/helpers/auth.ts
 *
 * Usage:
 *   npm run test:setup-auth
 *   # or directly:
 *   npx tsx scripts/setup-playwright-auth.ts
 *
 * Teardown: None required (stateless - just creates JSON files)
 *
 * CI Usage:
 *   This script is OPTIONAL for CI smoke tests (ci-reliability-smoke.spec.ts
 *   tests public pages only). For full E2E suites, run this before tests.
 */
import * as fs from "fs";
import * as path from "path";

import { chromium, Browser, BrowserContext, Page } from "@playwright/test";
import * as dotenv from "dotenv";

import { loginAs, USER_CREDENTIALS, UserRole } from "../e2e/helpers/auth";

dotenv.config();

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3001";
const AUTH_DIR = "playwright/.auth";
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 2000;

interface SetupResult {
  role: UserRole;
  success: boolean;
  error?: string;
  duration: number;
}

/**
 * Ensures the auth directory exists
 */
function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_DIR)) {
    fs.mkdirSync(AUTH_DIR, { recursive: true });
    console.log(`Created directory: ${AUTH_DIR}`);
  }
}

/**
 * Delays execution for specified milliseconds
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Sets up authentication for a single role with retry logic
 */
async function setupAuthForRole(
  role: UserRole,
  retryCount = 0,
): Promise<SetupResult> {
  const startTime = Date.now();
  console.log(`\n[${role}] Setting up auth (attempt ${retryCount + 1}/${MAX_RETRIES})...`);

  let browser: Browser | null = null;

  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--disable-gpu", "--no-sandbox", "--disable-dev-shm-usage"],
    });

    const context: BrowserContext = await browser.newContext({
      baseURL: BASE_URL,
      viewport: { width: 1400, height: 900 },
      ignoreHTTPSErrors: true,
    });

    const page = await context.newPage();

    // Set timeout for CI environments
    page.setDefaultTimeout(30000);

    // Use the loginAs helper which handles authentication
    await loginAs(role, page);

    // Verify we're logged in by checking URL
    const currentUrl = page.url();
    const isValidAuth =
      currentUrl.includes("/dashboard") ||
      currentUrl.includes("/select-company") ||
      currentUrl.includes("/tech") ||
      currentUrl.includes("/portal") ||
      currentUrl.includes("/learn");

    if (!isValidAuth) {
      throw new Error(`Unexpected post-login URL: ${currentUrl}`);
    }

    // Save storage state
    const authPath = path.join(AUTH_DIR, `${role}.json`);
    await context.storageState({ path: authPath });

    const duration = Date.now() - startTime;
    console.log(`[${role}] ✓ Auth state saved to ${authPath} (${duration}ms)`);

    return { role, success: true, duration };
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${role}] ✗ Failed: ${errorMessage}`);

    // Retry logic
    if (retryCount < MAX_RETRIES - 1) {
      console.log(`[${role}] Retrying in ${RETRY_DELAY_MS}ms...`);
      await delay(RETRY_DELAY_MS);

      // Close browser if open
      if (browser) {
        await browser.close().catch(() => { });
      }

      return setupAuthForRole(role, retryCount + 1);
    }

    return { role, success: false, error: errorMessage, duration };
  } finally {
    if (browser) {
      await browser.close().catch(() => { });
    }
  }
}

/**
 * Main entry point
 */
async function main(): Promise<void> {
  console.log("=".repeat(60));
  console.log("Playwright Authentication Setup");
  console.log("=".repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Auth directory: ${AUTH_DIR}`);
  console.log(`Max retries per role: ${MAX_RETRIES}`);
  console.log("=".repeat(60));

  // Ensure auth directory exists
  ensureAuthDir();

  // Setup auth for each role
  const roles = Object.keys(USER_CREDENTIALS) as UserRole[];
  const results: SetupResult[] = [];

  for (const role of roles) {
    const result = await setupAuthForRole(role);
    results.push(result);
  }

  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("Setup Summary");
  console.log("=".repeat(60));

  const successful = results.filter((r) => r.success);
  const failed = results.filter((r) => !r.success);

  for (const result of results) {
    const status = result.success ? "✓" : "✗";
    const duration = `${result.duration}ms`;
    console.log(`  ${status} ${result.role.padEnd(12)} ${duration.padStart(8)}`);
    if (result.error) {
      console.log(`    Error: ${result.error}`);
    }
  }

  console.log("=".repeat(60));
  console.log(`Total: ${successful.length}/${results.length} roles authenticated`);

  if (failed.length > 0) {
    console.log(`\n⚠ ${failed.length} role(s) failed to authenticate.`);
    console.log("This is acceptable for CI smoke tests (public pages only).");
    console.log("For full E2E suites, ensure test users exist and Supabase is running.");
    process.exit(0); // Exit gracefully - don't fail CI for auth setup
  }

  console.log("\n✓ All auth states saved successfully!");
  console.log("\nTo run tests with pre-authenticated state:");
  console.log("  npm run test:e2e -- --project=admin    # Run admin tests");
  console.log("  npm run test:e2e -- --project=client   # Run client tests");
  console.log("  npm run test:e2e -- --project=ci-smoke # Run CI smoke (no auth needed)");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
