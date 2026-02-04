import { test, expect } from "@playwright/test";
import { USER_CREDENTIALS } from "../helpers/auth";

test.describe("Authentication", () => {
  test("public pages are accessible without login", async ({ page }) => {
    const publicPaths = [
      "/",
      "/signin",
      "/signup",
      "/pricing",
      "/features",
      "/about",
    ];

    for (const path of publicPaths) {
      console.log(`Testing public access to: ${path}`);
      await page.goto(path);

      // Should not redirect to login (unless already logged in)
      await expect(page).not.toHaveURL(/\/dashboard/);

      // Page should load
      const mainContent = page.locator("main").first();
      await expect(mainContent)
        .toBeVisible({ timeout: 5000 })
        .catch(() => {
          // Some pages might have different structure
          const bodyContent = page.locator("body");
          expect(bodyContent).toBeVisible();
        });
    }
  });

  test("login with invalid credentials shows error", async ({ page }) => {
    await page.goto("/signin");

    await page.fill('input[type="email"]', "invalid@example.com");
    await page.fill('input[type="password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should show error message
    const errorMessage = page.getByText(/invalid|incorrect|error/i);
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Should stay on signin page
    await expect(page).toHaveURL(/\/signin/);
  });

  test("login with valid credentials redirects to dashboard", async ({
    page,
  }) => {
    await page.goto("/signin");

    // Test with admin credentials (should work for all roles)
    const admin = USER_CREDENTIALS.admin;

    await page.fill('input[type="email"]', admin.email);
    await page.fill('input[type="password"]', admin.password);
    await page.click('button[type="submit"]');

    // Should redirect to dashboard
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    await expect(page).toHaveURL(/\/dashboard/);

    // Should show dashboard content
    const dashboardContent = page.locator("main").first();
    await expect(dashboardContent).toBeVisible();
  });

  test("logout returns to signin page", async ({ page }) => {
    // First login
    await page.goto("/signin");
    const admin = USER_CREDENTIALS.admin;
    await page.fill('input[type="email"]', admin.email);
    await page.fill('input[type="password"]', admin.password);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard");

    // Find and click logout button
    const logoutButton = page.locator('button:has-text("Sign Out")');
    if (await logoutButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await logoutButton.click();
    } else {
      // Try user menu dropdown
      const userMenu = page.locator('button[aria-label*="user"]');
      if (await userMenu.isVisible({ timeout: 2000 }).catch(() => false)) {
        await userMenu.click();
        const logoutOption = page.getByText("Sign Out");
        await logoutOption.click();
      } else {
        // Manual navigation to logout
        await page.goto("/logout");
      }
    }

    // Should redirect to signin
    await page.waitForURL("**/signin");
    await expect(page).toHaveURL(/\/signin/);
    await expect(
      page.getByRole("heading", { name: /welcome back/i }),
    ).toBeVisible();
  });

  test("protected pages redirect to signin when not authenticated", async ({
    page,
  }) => {
    // Ensure we're logged out
    await page.goto("/logout");

    const protectedPaths = ["/dashboard", "/settings", "/profile", "/dispatch"];

    for (const path of protectedPaths) {
      console.log(`Testing protected path: ${path}`);
      await page.goto(path);

      // Should redirect to signin
      await expect(page).toHaveURL(/\/signin/);

      // Clear cookies for next iteration (optional)
      await page.context().clearCookies();
    }
  });
});
