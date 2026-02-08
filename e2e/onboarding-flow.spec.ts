import { test, expect } from "@playwright/test";

test.describe("Onboarding Flow", () => {
  test.skip("Create Company page loads without hanging", async ({ page }) => {
    // Sign in as admin (has existing company)
    await page.goto("/signin");
    await page.fill('input[type="email"]', "admin@admin.com");
    await page.fill('input[type="password"]', "ThermoAdmin$2026!");
    await page.click('button[type="submit"]');
    
    // Wait for dashboard redirect (user already has company)
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    
    // Navigate directly to create-company page
    await page.goto("/create-company");
    
    // Verify we're either on create-company page or redirected appropriately
    // The page should not hang on loading spinner
    // Wait for any of these conditions:
    // 1. Redirected to dashboard (if user already has company)
    // 2. Shows create company form (now always available)
    // 3. Shows loading spinner that disappears within 15 seconds (our timeout)
    
    // Wait for page to stabilize - check that loading spinner is not present after reasonable time
    const loadingSpinner = page.locator("text=Loading...");
    
    // Wait for spinner to disappear within 20 seconds (generous)
    await expect(loadingSpinner).not.toBeVisible({ timeout: 20000 });
    
    // Now verify we see one of the expected states
    const pageUrl = page.url();
    
    if (pageUrl.includes("/dashboard")) {
      // User was redirected because they already have a company
      console.log("User redirected to dashboard (already has company)");
      await expect(page).toHaveURL(/\/dashboard/);
    } else if (pageUrl.includes("/create-company")) {
      // Still on create-company page, check for form title
      const formTitle = page.locator("h1, h2").filter({ hasText: /Create New Organization/ });
      await expect(formTitle).toBeVisible({ timeout: 5000 });
      console.log("Create Company page shows form");
    }
  });

  test("Invitation link page works with valid slug", async ({ page }) => {
    // Sign in as a new user without companies (use student account)
    await page.goto("/signin");
    await page.fill('input[type="email"]', "student@test.com");
    await page.fill('input[type="password"]', "Password123!");
    await page.click('button[type="submit"]');
    
    // User should be redirected to select-company page if they have no companies
    // Wait for either dashboard (if they have company) or select-company
    try {
      await page.waitForURL("**/select-company", { timeout: 10000 });
    } catch {
      // Might already have a company and go to dashboard
      await page.waitForURL("**/dashboard", { timeout: 10000 });
      console.log("Student already has a company, skipping invitation test");
      return;
    }
    
    // Navigate to invitation link page (join-company still works for backward compatibility)
    await page.goto("/join-company");
    
    // Verify page loads
    await expect(page.locator("h1, h2").filter({ hasText: /Join Organization/ })).toBeVisible();
    
    // Enter a test invite slug (using a known test slug if available)
    // For now, just verify the input field exists
    await expect(page.locator('label').filter({ hasText: /Invitation Code/ })).toBeVisible();
    
    // Note: We can't test actual join without a valid invitation slug
    // This test at least verifies the page loads and UI is interactive
  });

  test.skip("Sign out clears session", async ({ page }) => {
    // Sign in first
    await page.goto("/signin");
    await page.fill('input[type="email"]', "admin@admin.com");
    await page.fill('input[type="password"]', "ThermoAdmin$2026!");
    await page.click('button[type="submit"]');
    await page.waitForURL("**/dashboard", { timeout: 15000 });
    
    // Click avatar dropdown
    const avatarButton = page.locator('button[type="button"]').filter({ has: page.locator('div.bg-gradient-to-br') });
    await avatarButton.click();
    
    // Wait for dropdown to appear
    const signOutButton = page.locator('button', { hasText: "Sign Out" }).first();
    await expect(signOutButton).toBeVisible();
    
    // Click sign out
    await signOutButton.click();
    
    // Should be redirected to signin page
    await page.waitForURL("**/signin", { timeout: 10000 });
    
    // Verify session is cleared - trying to access dashboard should redirect to signin
    await page.goto("/dashboard");
    await page.waitForURL("**/signin", { timeout: 5000 });
  });
});