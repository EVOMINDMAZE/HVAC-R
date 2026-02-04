import { test, expect } from '@playwright/test';

test('Debug Job Creation Visibility', async ({ page }) => {
    // Forward Browser Logs
    page.on('console', msg => {
        console.log(`[BROWSER ${msg.type()}]: ${msg.text()}`);
    });

    // 1. Setup Network Logging
    page.on('response', async (response) => {
        if (response.url().includes('/rest/v1/')) {
            console.log(`>> [NET RESPONSE] ${response.request().method()} ${response.url()} -> ${response.status()}`);
        }
    });

    page.on('request', request => {
        if (request.url().includes('/rest/v1/')) {
            console.log(`>> [NET REQUEST] ${request.method()} ${request.url()}`);
        }
    });

    try {
        // 2. Login
        console.log('Starting Login...');
        await page.goto('/signin');
        await page.fill('input#email', 'admin@admin.com');
        await page.fill('input#password', 'password1');

        await page.click('button[type="submit"]');
        await expect(page).toHaveURL(/.*dashboard/, { timeout: 15000 });
        console.log('Login Successful');

        // 3. Create Client (Fixes missing Company/Client data)
        console.log('Navigating to Clients to create new client...');
        await page.goto('/dashboard/clients');

        // Wait for page to fully load or timeout
        await expect(page.getByText('Client Management')).toBeVisible({ timeout: 15000 });
        console.log('On Clients Page');

        // Click "Add New Client" or "Add Your First Client"
        const addClientBtn = page.getByRole('button', { name: /Add.*Client/i }).first();
        await addClientBtn.click();

        await expect(page.getByRole('dialog')).toBeVisible();

        const clientName = `Test Client ${Date.now()}`;
        await page.fill('input#name', clientName);
        await page.fill('input#email', `client${Date.now()}@test.com`);
        await page.fill('input#address', '123 Test St');
        await page.fill('input#phone', '555-0123');

        await page.click('button:has-text("Register Client")');

        // Wait for success
        await expect(page.getByText(`${clientName} has been successfully registered`)).toBeVisible({ timeout: 30000 });
        console.log('Client Created Successfully');

        // 4. Navigate to Dispatch to Create Job
        console.log('Navigating to Dispatch...');
        await page.goto('/dashboard/dispatch', { timeout: 30000 });

        // Wait for page title to verify load
        await expect(page.getByText(/Dispatch Center/i)).toBeVisible({ timeout: 30000 });

        // Click "New Job"
        const newJobBtn = page.locator('button:has-text("New Job")');
        await newJobBtn.waitFor({ state: 'visible', timeout: 30000 });
        await newJobBtn.click();

        await expect(page.getByRole('dialog')).toBeVisible();

        // 5. Fill Job Form
        console.log('Waiting for client list to populate...');
        await expect(page.locator('select#client option')).not.toHaveCount(1, { timeout: 15000 });

        await page.locator('select#client').selectOption({ index: 1 });
        const selectedClient = await page.locator('select#client option:nth-child(2)').textContent();
        console.log(`Selected Client: ${selectedClient}`);

        await page.fill('input#title', `Job for ${clientName}`);

        // Submit
        console.log('Clicking Dispatch Job button...');
        const dispatchBtn = page.getByRole('button', { name: /Dispatch Job/i });
        await expect(dispatchBtn).toBeEnabled({ timeout: 10000 });
        await dispatchBtn.click();
        console.log('Clicked Dispatch Job button.');

        // 6. Verify Job Creation
        await expect(page.getByRole('dialog')).toBeHidden({ timeout: 15000 });
        console.log('Job Creation Dialog Closed');

    } catch (e) {
        console.log('TEST FAILED AT URL:', page.url());
        try {
            await page.screenshot({ path: 'test_failure.png' });
        } catch (dumpErr) {
            console.log('Failed to capture error state:', dumpErr);
        }
        throw e;
    }
});
