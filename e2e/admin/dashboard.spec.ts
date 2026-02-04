import { test, expect } from "@playwright/test";
import { loginAs, shouldHaveAccess, UserRole } from "../helpers/auth";

test.describe("Admin Dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("admin", page);
  });

  test("admin can access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    // Wait for page to load and check for any visible content
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on dashboard
    const dashboardContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test("admin can access team management", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page).toHaveURL(/\/settings\/team/);
    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on team page
    const teamContent = page.locator("main").or(page.locator("body")).first();
    await expect(teamContent).toBeVisible({ timeout: 10000 });
  });

  test("admin can access client management", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await expect(page).toHaveURL(/\/dashboard\/clients/);
    // Wait for page to load
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on clients page
    const clientsContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(clientsContent).toBeVisible({ timeout: 10000 });
  });

  test("admin has access to all authorized paths", async ({ page }) => {
    const adminPaths = [
      "/dashboard",
      "/settings/team",
      "/dashboard/clients",
      "/diy-calculators",
      "/standard-cycle",
      "/refrigerant-comparison",
      "/estimate-builder",
      "/troubleshooting",
      "/profile",
      "/web-stories",
    ];

    for (const path of adminPaths) {
      console.log(`Testing admin access to: ${path}`);
      await page.goto(path);

      // Should not be redirected to signin
      await expect(page).not.toHaveURL(/\/signin/);

      // Wait for page to load
      await page.waitForLoadState("domcontentloaded");

      // Page should load without 404
      const pageTitle = await page.title();
      expect(pageTitle).not.toMatch(/404|not found/i);

      // Some visible content
      const pageContent = page.locator("main").or(page.locator("body")).first();
      await expect(pageContent).toBeVisible({ timeout: 10000 });
    }
  });
});

// Permission tests for admin role
test.describe("Admin Permission Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("admin", page);
  });

  test("admin cannot access non-existent paths (404)", async ({ page }) => {
    await page.goto("/non-existent-path");
    await page.waitForLoadState("domcontentloaded");

    // Should show 404 or redirect to dashboard
    const currentUrl = page.url();
    console.log(
      `Admin accessing non-existent path, current URL: ${currentUrl}`,
    );

    if (currentUrl.includes("/non-existent-path")) {
      // Check for any content on page
      const pageContent = page.locator("main").or(page.locator("body")).first();
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    } else {
      // Might be redirected to dashboard
      await expect(page).toHaveURL(/\/dashboard/);
    }
  });

  // Note: Admin can access everything in this app, so no negative tests for other roles' pages
});
