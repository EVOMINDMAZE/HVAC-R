import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@admin.com";
const ADMIN_PASSWORD = "ThermoAdmin$2026!";

test.describe("Company selection bug scenario", () => {
  test("admin selects Demo Company and switcher shows Demo Company", async ({ page }) => {
    console.log("\n=== TEST: Company selection bug scenario ===\n");

    // 1. Sign In
    await page.goto("/signin");
    await page.fill('input[type="email"]', ADMIN_EMAIL);
    await page.fill('input[type="password"]', ADMIN_PASSWORD);
    await page.click('button[type="submit"]');

    // 2. Wait for select-company page
    await page.waitForURL("**/select-company", { timeout: 15000 });

    // 3. Select Demo Company
    await page.locator('h3:has-text("Demo Company")').click();
    await page.waitForURL("**/dashboard", { timeout: 15000 });

    // 4. Find company switcher combobox button (exclude job selector)
    const switcherBtn = page.locator('button[role="combobox"]').filter({ hasNotText: 'Select Active Job' }).first();
    await expect(switcherBtn).toBeVisible({ timeout: 10000 });

    // 5. Verify switcher shows Demo Company (not ThermoTech HVAC)
    const buttonText = await switcherBtn.textContent();
    console.log(`Company switcher text: ${buttonText}`);
    expect(buttonText).toMatch(/Demo Company/i);
  });
});