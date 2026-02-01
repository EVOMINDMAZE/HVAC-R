import { test, expect } from '@playwright/test';

test.describe('Smoke Test - Headless Optimization', () => {
    test('should load the landing page successfully', async ({ page }) => {
        // Navigate to the base URL
        await page.goto('/');

        // Verify the page title (using the custom timeout from our config)
        await expect(page).toHaveTitle(/ThermoNeural/);

        // Take a screenshot to verify the view
        await page.screenshot({ path: 'smoke-test-success.png' });
    });

    test('demonstrate failure & trace recording', async ({ page }) => {
        await page.goto('/');

        // This will deliberately fail to show how the "trace" and "screenshot on failure" work
        await expect(page.locator('text=This Element Does Not Exist')).toBeVisible({ timeout: 2000 });
    });
});
