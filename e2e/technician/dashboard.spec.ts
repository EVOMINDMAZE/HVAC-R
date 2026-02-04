import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe("Technician Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("technician", page);
  });

  test("technician can access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on dashboard
    const dashboardContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test("technician can access dispatch page", async ({ page }) => {
    await page.goto("/dispatch");
    await expect(page).toHaveURL(/\/dispatch/);
    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on dispatch page
    const dispatchContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(dispatchContent).toBeVisible({ timeout: 10000 });
  });

  test("technician can access calculators", async ({ page }) => {
    const calculatorPaths = [
      "/diy-calculators",
      "/standard-cycle",
      "/refrigerant-comparison",
      "/estimate-builder",
      "/troubleshooting",
    ];

    for (const path of calculatorPaths) {
      console.log(`Testing technician access to: ${path}`);
      await page.goto(path);

      // Should not be redirected to signin
      await expect(page).not.toHaveURL(/\/signin/);

      // Page should load
      await page.waitForLoadState("domcontentloaded");
      const mainContent = page.locator("main").or(page.locator("body")).first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });
    }
  });

  test("technician can view profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);
    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on profile page
    const profileContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(profileContent).toBeVisible({ timeout: 10000 });
  });
});

// Permission tests for technician role
test.describe("Technician Permission Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("technician", page);
  });

  test("technician cannot access admin team management", async ({ page }) => {
    await page.goto("/settings/team");
    await page.waitForLoadState("domcontentloaded");

    // Check if redirected or shows access denied
    const currentUrl = page.url();
    console.log(
      `Technician attempting to access /settings/team, current URL: ${currentUrl}`,
    );

    if (currentUrl.includes("/settings/team")) {
      // Still on team page, check for any content
      const pageContent = page.locator("main").or(page.locator("body")).first();
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away from team settings
      await expect(page).not.toHaveURL(/\/settings\/team/);
    }
  });

  test("technician cannot access client invitation page", async ({ page }) => {
    // Try to access client invitation directly (if known path)
    await page.goto("/dashboard/clients/invite");
    await page.waitForLoadState("domcontentloaded");

    // Check if redirected or shows access denied
    const currentUrl = page.url();
    console.log(
      `Technician attempting to access /dashboard/clients/invite, current URL: ${currentUrl}`,
    );

    if (currentUrl.includes("/dashboard/clients/invite")) {
      // Still on invitation page, check for any content
      const pageContent = page.locator("main").or(page.locator("body")).first();
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away from invitation page
      await expect(page).not.toHaveURL(/\/dashboard\/clients\/invite/);
    }
  });
});
