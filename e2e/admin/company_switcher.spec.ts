import { test, expect } from '@playwright/test';

const EMAIL = 'admin@admin.com';
const PASSWORD = 'password1';

test.describe('Multi-Tenancy Company Switcher', () => {
    test('User can switch between companies', async ({ page }) => {
        // 1. Login
        console.log('Logging in...');
        await page.goto('/signin');
        await page.fill('input#email', EMAIL);
        await page.fill('input#password', PASSWORD);
        await page.click('button[type="submit"]');

        // Wait for dashboard
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
        await page.waitForLoadState('networkidle');
        console.log('Login successful.');

        // 2. Identify switcher (building icon button)
        // We filter to ensure we get the Company Switcher, not Job Selector
        const switcherBtn = page.locator('button[role="combobox"]').filter({ hasNotText: 'Select Active Job' }).first();

        await expect(switcherBtn).toBeVisible({ timeout: 10000 });
        const initialText = await switcherBtn.textContent();
        console.log(`Initial Company: ${initialText}`);

        // 3. Open Switcher
        await switcherBtn.click();

        // Wait for popover content to be mounted
        await expect(page.locator('input[placeholder="Find team..."]')).toBeVisible({ timeout: 5000 });

        // 4. Select "Alternative Test Company"
        const targetCompany = 'Alternative Test Company';

        // Skip filtering which can be flaky in headless - just find the item
        // Note: cmdk items usually have role="option"
        const targetOption = page.locator('[role="option"]').filter({ hasText: targetCompany }).first();

        // Wait for dropdown visibility 
        await expect(targetOption).toBeVisible({ timeout: 10000 });

        console.log(`Switching to: ${targetCompany} (found via search)`);
        await targetOption.click();

        // 5. Verify Switch & Reload
        // The app performs a full window reload on switch
        await page.waitForTimeout(2000);
        await page.waitForLoadState('domcontentloaded');

        // Fetch button again from fresh DOM
        const newSwitcherBtn = page.locator('button[role="combobox"]').filter({ hasNotText: 'Select Active Job' }).first();

        // Validation - flexible match for Name (ignoring Initials/Role)
        await expect(newSwitcherBtn).toHaveText(new RegExp(targetCompany), { timeout: 15000 });

        console.log('Switch verified: Active company updated.');
    });
});
