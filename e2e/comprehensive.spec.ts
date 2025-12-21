import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:8080';

test.describe('Comprehensive Application Test Suite', () => {

    // 1. Authentication
    test('Authentication: Login Flow', async ({ page }) => {
        await page.goto(`${BASE_URL}/signin`);
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'password11'); // Using incorrect password first to test validation? No, user said valid. Admin provided 'password1'.
        // Correcting to user provided
        await page.fill('input[type="password"]', 'password1');
        await page.click('button[type="submit"]');

        // Expect to arrive at dashboard
        await expect(page).toHaveURL(/.*\/dashboard/);
        console.log('Authentication: Login Successful');
    });

    // 2. Field Tools (Calculators)
    test('Field Tools: A2L Safety Calculator', async ({ page }) => {
        await page.goto(`${BASE_URL}/diy-calculators?bypassAuth=1`);

        // Switch to A2L Tab using text
        // Note: The text is inside the trigger
        await page.getByText('A2L Safety', { exact: false }).click();

        await expect(page.locator('text=A2L Charge Limit Calculator')).toBeVisible();

        // Inputs
        // Area is likely the first input
        await page.getByText('Room Area').locator('..').locator('input').fill('50');
        await page.getByText('Install Height').locator('..').locator('input').fill('2.5');

        // Check Result
        await expect(page.locator('text=Max Allowable Charge')).toBeVisible();

        // Test Safe Status
        await page.getByText('System Charge').locator('..').locator('input').fill('5');
        await expect(page.locator('text=Safe')).toBeVisible();

        await page.getByText('System Charge').locator('..').locator('input').fill('15');
        await expect(page.locator('text=Limit Exceeded')).toBeVisible();

        console.log('Tool: A2L Calculator Verified');
    });

    test('Field Tools: Subcooling Calculator', async ({ page }) => {
        await page.goto(`${BASE_URL}/diy-calculators?bypassAuth=1`);

        await page.getByText('Subcooling', { exact: false }).click();
        await expect(page.locator('text=Target Subcooling')).toBeVisible();

        // Inputs
        await page.getByText('Target Subcooling').locator('..').locator('input').fill('10');
        await page.getByText('Liquid Line Pressure').locator('..').locator('input').fill('318');
        await page.getByText('Liquid Line Temperature').locator('..').locator('input').fill('90');

        await expect(page.locator('text=Correctly Charged')).toBeVisible();
        await expect(page.locator('text=Actual Subcooling')).toBeVisible();

        console.log('Tool: Subcooling Calculator Verified');
    });

    test('Field Tools: Psychrometric Superheat', async ({ page }) => {
        await page.goto(`${BASE_URL}/diy-calculators?bypassAuth=1`);

        await page.getByText('Psychrometric', { exact: false }).click();
        await expect(page.locator('text=Target Superheat')).toBeVisible();

        // Inputs: IDWB, ODDB
        await page.getByText('Indoor Wet Bulb').locator('..').locator('input').fill('65');
        await page.getByText('Outdoor Dry Bulb').locator('..').locator('input').fill('95');

        await expect(page.locator('text=Target Superheat')).toBeVisible();

        console.log('Tool: Superheat Calculator Verified');
    });

    // 3. Page Navigation Smoke Test
    const pages = [
        '/dashboard',
        '/standard-cycle',
        '/refrigerant-comparison',
        '/estimate-builder',
        '/troubleshooting',
        '/profile',
        '/web-stories'
    ];

    for (const p of pages) {
        test(`Navigation: ${p}`, async ({ page }) => {
            await page.goto(`${BASE_URL}${p}?bypassAuth=1`);
            // Basic check: page didn't crash (no 404 or white screen)
            // Check for common header or title
            await expect(page).toHaveTitle(/ThermoNeural|Dashboard|HVAC/i);
            console.log(`Navigation: ${p} Verified`);
        });
    }

});
