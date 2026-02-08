import * as dotenv from "dotenv";

dotenv.config();

export type UserRole = "admin" | "technician" | "client" | "student";

export interface UserCredentials {
  email: string;
  password: string;
  role: UserRole;
}

export const USER_CREDENTIALS: Record<UserRole, UserCredentials> = {
  admin: {
    email: "admin@admin.com",
    password: "ThermoAdmin$2026!",
    role: "admin",
  },
  technician: {
    email: "tech@test.com",
    password: "Password123!",
    role: "technician",
  },
  client: {
    email: "client@test.com",
    password: "Password123!",
    role: "client",
  },
  student: {
    email: "student@test.com",
    password: "Password123!",
    role: "student",
  },
};

/**
 * Log in as a specific role using UI flow
 */
export async function loginAs(
  role: UserRole,
  page: any,
  forceLogin = false,
): Promise<void> {
  const credentials = USER_CREDENTIALS[role];

  // Role-specific dashboard paths
  const ROLE_DASHBOARD_PATHS: Record<UserRole, string[]> = {
    admin: ["/dashboard"],
    technician: ["/tech", "/dashboard"],
    client: ["/client", "/dashboard"],
    student: ["/learn", "/dashboard"],
  };

  // Check if already logged in (only skip if already on appropriate dashboard)
  const currentUrl = page.url();
  const allowedPaths = ROLE_DASHBOARD_PATHS[role];
  const isAlreadyOnDashboard = allowedPaths.some((path) =>
    currentUrl.includes(path),
  );
  if (!forceLogin && isAlreadyOnDashboard) {
    console.log(
      `[Auth Helper] Already on dashboard (${currentUrl}) for role ${role}, skipping login`,
    );
    return;
  }

  console.log(`[Auth Helper] Logging in as ${role}: ${credentials.email}`);
  console.log(`[Auth Helper] Current URL before goto: ${page.url()}`);

  await page.goto("/signin");
  await page.waitForLoadState("domcontentloaded");

  // Check if we're still on signin page (might have been redirected)
  const urlAfterNavigation = page.url();
  console.log(`[Auth Helper] URL after navigation: ${urlAfterNavigation}`);

  // Debug page content
  try {
    const pageTitle = await page.title();
    console.log(`[Auth Helper] Page title: ${pageTitle}`);
    const bodyText = await page.textContent("body");
    if (bodyText) {
      console.log(
        `[Auth Helper] Body text preview: ${bodyText.substring(0, 200)}...`,
      );
    }
  } catch (error) {
    console.log(`[Auth Helper] Could not get page content: ${error}`);
  }

  if (!urlAfterNavigation.includes("/signin")) {
    console.log(
      `[Auth Helper] Already authenticated, redirected to: ${urlAfterNavigation}`,
    );
    return;
  }

  // Check if page shows "Loading..." which indicates authentication in progress
  const bodyText = await page.textContent("body");
  if (bodyText && bodyText.includes("Loading...")) {
    console.log(
      `[Auth Helper] Page shows "Loading...", waiting for redirect to dashboard...`,
    );
    try {
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      console.log(`[Auth Helper] Redirected to dashboard: ${page.url()}`);
      return;
    } catch (error) {
      console.log(
        `[Auth Helper] No redirect happened, proceeding with login form`,
      );
    }
  }

  try {
    console.log(`[Auth Helper] Waiting for email input...`);
    // Wait for email input to be visible
    await page.waitForSelector('input[type="email"]', {
      state: "visible",
      timeout: 10000,
    });
    console.log(`[Auth Helper] Email input found, filling...`);
    await page.fill('input[type="email"]', credentials.email);

    console.log(`[Auth Helper] Waiting for password input...`);
    await page.waitForSelector('input[type="password"]', {
      state: "visible",
      timeout: 5000,
    });
    console.log(`[Auth Helper] Password input found, filling...`);
    await page.fill('input[type="password"]', credentials.password);

    console.log(`[Auth Helper] Clicking submit button...`);
    await page.click('button[type="submit"]');
    console.log(`[Auth Helper] Submit clicked`);
  } catch (error) {
    console.error(`[Auth Helper] Login form interaction failed: ${error}`);
    throw error;
  }

  // Wait for redirect to dashboard
  await page.waitForURL("**/dashboard", { timeout: 15000 });

  await page.waitForLoadState("domcontentloaded");
  console.log(`[Auth Helper] ${role} login successful`);
}

/**
 * Save authentication state for faster test execution
 */
export async function saveAuthState(
  role: UserRole,
  page: any,
  filePath: string,
): Promise<void> {
  await loginAs(role, page);
  await page.context().storageState({ path: filePath });
  console.log(`[Auth Helper] Saved auth state for ${role} to ${filePath}`);
}

/**
 * Check if user should have access to a specific path
 * Returns true if access is expected, false if unauthorized
 */
export function shouldHaveAccess(role: UserRole, path: string): boolean {
  // Define access rules based on role
  const accessRules: Record<UserRole, RegExp[]> = {
    admin: [
      /^\/dashboard/,
      /^\/settings/,
      /^\/team/,
      /^\/clients/,
      /^\/dispatch/,
      /^\/diy-calculators/,
      /^\/standard-cycle/,
      /^\/refrigerant-comparison/,
      /^\/estimate-builder/,
      /^\/troubleshooting/,
      /^\/profile/,
      /^\/web-stories/,
    ],
    technician: [
      /^\/dashboard/,
      /^\/dispatch/,
      /^\/clients\/[^\/]+\/assets/,
      /^\/diy-calculators/,
      /^\/standard-cycle/,
      /^\/refrigerant-comparison/,
      /^\/estimate-builder/,
      /^\/troubleshooting/,
      /^\/profile/,
    ],
    client: [
      /^\/dashboard/,
      /^\/clients\/[^\/]+/, // Only their own client page
      /^\/profile/,
    ],
    student: [
      /^\/diy-calculators/,
      /^\/standard-cycle/,
      /^\/refrigerant-comparison/,
      /^\/troubleshooting/,
      /^\/web-stories/,
    ],
  };

  const rules = accessRules[role] || [];
  return rules.some((rule) => rule.test(path));
}
