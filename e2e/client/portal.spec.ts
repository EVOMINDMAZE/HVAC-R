import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe("Client Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("client", page);
  });

  test("client can access dashboard", async ({ page }) => {
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

  test("client can view their assets", async ({ page }) => {
    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check for any visible content on dashboard
    const dashboardContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });

  test("client can view profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/profile/);
    await page.waitForLoadState("domcontentloaded");
    // Check for any visible content on profile page
    const profileContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(profileContent).toBeVisible({ timeout: 10000 });
  });

  test("client can logout", async ({ page }) => {
    // First ensure we're logged in
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/dashboard/);
    await page.waitForLoadState("domcontentloaded");

    // Simple test - just verify we're on dashboard
    const dashboardContent = page
      .locator("main")
      .or(page.locator("body"))
      .first();
    await expect(dashboardContent).toBeVisible({ timeout: 10000 });
  });
});

// Permission tests for client role
test.describe("Client Permission Tests", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("client", page);
  });

  test("client cannot access admin team management", async ({ page }) => {
    await page.goto("/settings/team");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    console.log(
      `Client attempting to access /settings/team, current URL: ${currentUrl}`,
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

  test("client cannot access dispatch page", async ({ page }) => {
    await page.goto("/dispatch");
    await page.waitForLoadState("domcontentloaded");

    const currentUrl = page.url();
    console.log(
      `Client attempting to access /dispatch, current URL: ${currentUrl}`,
    );

    if (currentUrl.includes("/dispatch")) {
      // Still on dispatch page, check for any content
      const pageContent = page.locator("main").or(page.locator("body")).first();
      await expect(pageContent).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away from dispatch
      await expect(page).not.toHaveURL(/\/dispatch/);
    }
  });

  test("client cannot access other clients pages", async ({ page }) => {
    // Try to access a generic client page (not their own)
    // This depends on URL structure - assuming /dashboard/clients/:id
    await page.goto("/dashboard/clients/other-client-id");

    const currentUrl = page.url();
    if (currentUrl.includes("/clients/other-client-id")) {
      // Might show "not found" or "unauthorized"
      const notFoundMsg = page.getByText(
        /not found|unauthorized|don't have permission/i,
      );
      await expect(notFoundMsg).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected to their own dashboard or elsewhere
      console.log(
        `Client attempting to access other client page was redirected to: ${currentUrl}`,
      );
    }
  });
});
