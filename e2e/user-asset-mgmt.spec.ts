import { test, expect } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || 'admin@admin.com';
const ADMIN_PASSWORD = 'password1';

test.describe('User & Asset Management', () => {
    test.beforeEach(async ({ page }) => {
        // Log setup
        page.on('console', msg => console.log(`[Browser Console] ${msg.text()}`));
        page.on('response', async response => {
            if (response.url().includes('supabase.co')) {
                if (response.status() >= 400) {
                    try {
                        const body = await response.json();
                        console.error(`[Error Response] ${response.url()}:`, JSON.stringify(body));
                    } catch (e) {
                        console.error(`[Error Response] ${response.url()}: ${response.status()}`);
                    }
                }
            }
        });

        // Login Flow
        await page.goto('http://localhost:8085/signin');
        await page.fill('input[type="email"]', ADMIN_EMAIL);
        await page.fill('input[type="password"]', ADMIN_PASSWORD);
        await page.click('button[type="submit"]');
        await page.waitForURL('**/dashboard', { timeout: 15000 });
    });

    test('Admin can invite a technician and update their role', async ({ page }) => {
        await page.goto('http://localhost:8085/settings/team');
        await expect(page.getByText('Team Management')).toBeVisible();

        const testEmail = `tech_${Date.now()}@thermoneural.com`;
        const testName = 'Tech Automator';

        console.log(`Inviting technician: ${testEmail}`);

        await page.getByLabel('Email Address').fill(testEmail);
        await page.getByLabel('Full Name').fill(testName);

        // Select 'tech' role
        await page.getByLabel('Role').click();
        await page.getByRole('option', { name: 'Technician' }).click();

        // Prepare to capture response
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('invite-user'),
            { timeout: 15000 }
        );

        await page.getByRole('button', { name: 'Send Invite' }).click();

        const response = await responsePromise;
        if (response.status() >= 400) {
            const errorBody = await response.json();
            console.error(`[Edge Function Error]:`, JSON.stringify(errorBody));
        }

        // Check success toast
        await expect(page.getByText('Invitation Sent')).toBeVisible({ timeout: 15000 });

        // Wait for member to appear in table
        await expect(page.getByRole('cell', { name: testEmail })).toBeVisible({ timeout: 15000 });

        // Role check
        const row = page.locator('table tr').filter({ hasText: testEmail });
        await expect(row).toBeVisible();

        // Update role to Manager
        const roleSelect = row.getByRole('combobox');
        await roleSelect.click();
        // Wait for popover
        await page.getByRole('option', { name: 'Manager' }).waitFor({ state: 'visible' });
        await page.getByRole('option', { name: 'Manager' }).click();

        await expect(page.getByText('Role Updated')).toBeVisible({ timeout: 10000 });
        await expect(roleSelect).toContainText('Manager'); // Check updated text
    });

    test('Admin can edit an asset on a client page', async ({ page }) => {
        // Navigate to clients page
        await page.goto('http://localhost:8085/dashboard/clients');

        // Use the card-based layout: Click "View Profile" on the first card
        const firstClient = page.getByRole('link', { name: 'View Profile' }).first();
        await firstClient.click();

        await expect(page.url()).toContain('/dashboard/clients/');

        // Ensure we're on the Assets tab
        await page.getByRole('tab', { name: 'Assets' }).click();

        // Wait for assets to load or "No assets found" to appear
        const noAssetsMsg = page.getByText('No assets found');
        const assetCardLocator = page.getByTestId('asset-card');

        // Wait for either using a race check or simply ensuring the query finished.
        // The most robust way in Playwright is to wait for the state we expect or check counts.
        await expect(noAssetsMsg.or(assetCardLocator.first())).toBeVisible({ timeout: 10000 });

        // Check if there are assets, if not create one
        if (await noAssetsMsg.isVisible()) {
            await page.getByRole('button', { name: 'Create First Asset' }).click();
            await expect(page.getByText('Register New Asset')).toBeVisible({ timeout: 10000 });

            await page.getByPlaceholder('e.g. Walk-in Cooler').fill('Test Asset');
            await page.getByPlaceholder('Optional').fill('SN-TEST-123');
            await page.getByRole('button', { name: 'Register Asset' }).click();
            await expect(page.getByText('Asset created successfully')).toBeVisible({ timeout: 15000 });
            // Wait for dialog to close
            await expect(page.getByText('Register New Asset')).not.toBeVisible();
        }

        // Find an asset and edit it
        const assetCard = page.getByTestId('asset-card').first();
        await assetCard.hover();
        const editButton = assetCard.getByRole('button', { name: 'Edit Asset' });
        // Force click because of the hover state potentially not being stable in headless
        await editButton.click({ force: true });

        // Wait for dialog to be visible using specific role
        const editDialog = page.getByRole('dialog', { name: 'Edit Asset' });
        await expect(editDialog).toBeVisible({ timeout: 10000 });

        // Ensure input field is ready before interacting
        const nameInput = page.getByLabel('Asset Name');
        await expect(nameInput).toBeVisible();

        const newName = `Updated Asset ${Date.now()}`;
        await nameInput.fill(newName);
        await page.getByRole('button', { name: 'Save Changes' }).click();

        // The toast title is "Asset Updated"
        await expect(page.getByText('Asset Updated')).toBeVisible({ timeout: 10000 });
        await expect(page.getByText(newName)).toBeVisible();
    });

    test('Admin can invite a new client user', async ({ page }) => {
        await page.goto('http://localhost:8085/dashboard/clients');

        // Use the card-based layout: Click "View Profile" on the first card
        const firstClient = page.getByRole('link', { name: 'View Profile' }).first();
        await firstClient.click();

        await expect(page.url()).toContain('/dashboard/clients/');

        await page.getByRole('tab', { name: 'Settings' }).click();
        await page.getByRole('button', { name: 'Invite User' }).click();

        await expect(page.getByText('Manage Client Access')).toBeVisible({ timeout: 10000 });

        // Ensure "Invite New" tab is active
        const inviteTab = page.getByRole('tab', { name: 'Invite New' });
        await inviteTab.click();

        // Fill in the form and send invitation
        await page.getByLabel('Full Name').fill('Test Client User');
        const testEmail = `client_${Date.now()}@thermoneural.com`;
        await page.getByLabel('Email Address').fill(testEmail);

        // Prepare to capture response
        const responsePromise = page.waitForResponse(response =>
            response.url().includes('invite-user'),
            { timeout: 15000 }
        );

        await page.getByRole('button', { name: 'Send Invitation' }).click();

        const response = await responsePromise;
        if (response.status() >= 400) {
            const errorBody = await response.json();
            console.error(`Invite Client User failed: ${JSON.stringify(errorBody)}`);
        }

        await expect(page.getByText('Invitation Sent')).toBeVisible({ timeout: 15000 });
    });
});
