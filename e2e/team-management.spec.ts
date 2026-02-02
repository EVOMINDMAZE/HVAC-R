import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = 'password1';

test.describe('Team Management', () => {
    test.beforeEach(async ({ page }) => {
        // Log setup
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        page.on('request', request => console.log(`[Network Request] ${request.method()} ${request.url()}`));
        page.on('response', async response => {
            if (response.url().includes('supabase.co')) {
                const url = response.url().split('/').pop();
                if (response.status() >= 400) {
                    try {
                        const body = await response.json();
                        console.error(`[Error Response] ${url}:`, JSON.stringify(body));
                    } catch (e) {
                        console.error(`[Error Response] ${url}: ${response.status()}`);
                    }
                } else {
                    console.log(`[Response] ${url}: ${response.status()}`);
                }
            }
        });

        // Login Flow
        await page.goto('/signin');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('Admin can view team and invite new member', async ({ page }) => {
        // 1. Navigate to Team Settings
        console.log('Navigating to Team Settings...');
        await page.goto('/settings/team');

        // 2. Verify Page Load
        await expect(page.getByText('Team Management')).toBeVisible({ timeout: 10000 });

        // 3. Verify Team List Loads (RPC Call checks in background, UI check here)
        // Adjust selector based on your Table implementation
        await expect(page.locator('table')).toBeVisible();

        // 4. Invite User Flow
        const testEmail = `test_invite_${Date.now()}@thermoneural.com`;
        const testName = 'Test Automator';

        console.log(`Inviting user: ${testEmail}`);

        await page.fill('input[placeholder*="john@example.com"]', testEmail);
        await page.fill('input[placeholder*="John Doe"]', testName);

        // Select Role (assuming Select component)
        const roleTrigger = page.locator('form').locator('button[role="combobox"]');
        if (await roleTrigger.isVisible()) {
            await roleTrigger.click();
            await page.getByLabel('Manager').click(); // or exact text "Manager"
        } else {
            // Fallback for native select if changed
            const selectOptions = page.locator('select');
            if (await selectOptions.isVisible()) {
                await selectOptions.selectOption('manager');
            }
        }

        // 5. Submit
        const inviteBtn = page.locator('button:has-text("Send Invite")');
        await inviteBtn.click();

        // 6. Verify Success Toast
        // "Invitation sent to..."
        const toast = page.getByText('Invitation Sent', { exact: true }).first();
        await expect(toast).toBeVisible({ timeout: 10000 });

        console.log('Invitation success verified.');
    });
});
