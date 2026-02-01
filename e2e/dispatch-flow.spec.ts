import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Setup Supabase Admin Client for Test Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Dispatch Flow (Admin -> Tech)', () => {
    let techUserId: string;

    test.beforeAll(async () => {
        // 1. Ensure Technician User Exists using Admin API
        const techEmail = 'tech@test.com';
        const techPassword = 'Password123!';

        // Check if user exists
        const { data: users, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) {
            console.error('[Test Setup] Failed to list users:', listError);
            throw listError;
        }

        let techUser = users.users.find(u => u.email === techEmail);

        if (!techUser) {
            console.log(`[Test Setup] Creating missing tech user: ${techEmail}`);
            const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                email: techEmail,
                password: techPassword,
                email_confirm: true
            });
            if (createError) throw createError;
            techUser = newUser.user;
        } else {
            // Ensure password is correct
            await supabase.auth.admin.updateUserById(techUser.id, { password: techPassword });
        }

        if (!techUser) throw new Error("Failed to find or create tech user");
        techUserId = techUser.id;

        // 2. Ensure Profile exists and has correct role
        // Note: Trigger usually handles creation, but we update to ensure role.
        const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
                id: techUserId,
                email: techEmail,
                role: 'technician',
                full_name: 'Test Technician'
            });

        if (profileError) {
            console.log('[Test Setup] Warning: ensuring profile failed (RLS?):', profileError);
            // Might fail if triggers conflict, but essential for role.
        }

        // 3. Ensure Admin Password is correct
        const adminUser = users.users.find(u => u.email === 'admin@admin.com');
        if (adminUser) {
            await supabase.auth.admin.updateUserById(adminUser.id, { password: 'password1' });
        }

        // 4. Ensure at least one Client exists
        const { count, error: countError } = await supabase
            .from('clients')
            .select('*', { count: 'exact', head: true });

        if (countError) console.log('[Test Setup] Warning checking clients:', countError);
        console.log(`[Test Setup] Found ${count} clients.`);

        if (count === 0) {
            console.log('[Test Setup] No clients found. Seeding test client...');
            const { error: insertError } = await supabase.from('clients').insert({
                name: 'Test Client',
                email: 'client@test.com',
                phone: '555-0100',
                address: '123 Test St'
            });
            if (insertError) {
                console.error('[Test Setup] FAILED to seed client:', insertError);
                throw insertError;
            }
            console.log('[Test Setup] Client seeded successfully.');
        }
    });

    test('full dispatch lifecycle', async ({ page }) => {
        // Monitor console early
        page.on('console', msg => console.log(`[Browser] ${msg.text()}`));

        // Prevent Onboarding Guide Modal
        await page.addInitScript(() => {
            window.localStorage.setItem('thermoneural:onboarding-complete', 'true');
        });

        // --- ADMIN: CREATE JOB ---
        await page.goto('/signin');
        await page.fill('input[type="email"]', 'admin@admin.com');
        await page.fill('input[type="password"]', 'password1');
        await page.click('button[type="submit"]');
        await page.waitForURL('/dashboard');

        // Go to Dispatch Board
        await page.click('a[href="/dashboard/dispatch"]');

        // Open Create Job Dialog
        await page.click('button:has-text("New Job")');

        // Generate unique job title
        const jobTitle = `Fix AC Unit ${Date.now()}`;
        await page.fill('input#title', jobTitle);

        // Select Client (We ensured at least one exists)
        const clientSelect = page.locator('select#client');
        await clientSelect.waitFor();


        // Wait for options to populate (Index 0 is Select Client, Index 1 is first client)
        await expect(async () => {
            const optionCount = await clientSelect.locator('option').count();
            if (optionCount < 2) {
                const options = await clientSelect.locator('option').allTextContents();
                console.log(`[Test Debug] Waiting for clients... Count: ${optionCount}`);
                throw new Error('Client list pending...');
            }
        }).toPass({ timeout: 15000 });

        // Select the second option (index 1)
        await clientSelect.selectOption({ index: 1 });

        // Verify selection
        const selectedValue = await clientSelect.inputValue();
        console.log(`[Test Debug] Selected Client ID: ${selectedValue}`);
        if (!selectedValue) {
            console.log('[Test Debug] Selection failed, trying force selection of last option...');
            // Fallback: select last option
            const count = await clientSelect.locator('option').count();
            await clientSelect.selectOption({ index: count - 1 });
        }
        await expect(clientSelect).not.toHaveValue('');

        await page.fill('input[type="date"]', new Date().toISOString().split('T')[0]);
        await page.fill('input[type="time"]', '10:00');

        // Select Tech (We ensured tech exists)
        // Try selecting by techUserId which we have
        const techSelect = page.locator('select#tech');
        await techSelect.waitFor();

        // Check if our specific tech is in the list
        const optionExists = await page.locator(`select#tech option[value="${techUserId}"]`).count() > 0;
        if (optionExists) {
            await techSelect.selectOption({ value: techUserId });
        } else {
            // Fallback to first if specific not found (should not happen with setup)
            await techSelect.selectOption({ index: 1 });
        }

        // Wait for button to be enabled
        const submitBtn = page.locator('button:has-text("Dispatch Job")');
        await expect(submitBtn).toBeEnabled({ timeout: 5000 });


        // Submit
        await page.click('button:has-text("Dispatch Job")');
        // Wait for URL or Modal close. The original test waited for URL but also modal behaviors.
        // It seems the "New Job" button is on /dashboard/dispatch, so URL might not change if we are already there.
        // But the original test verified /dashboard/dispatch.

        // Wait for Dispatch page to load completely (refreshing list)
        await expect(page.locator('text=Loading Dispatch Board...')).toBeHidden({ timeout: 10000 });
        const header = page.locator('h1', { hasText: 'Dispatch Center' });
        await expect(header).toBeVisible();

        // Check if job appears in the list
        await expect(page.getByText(jobTitle).first()).toBeVisible();

        // Logout
        const signOutBtn = page.locator('button:has-text("Sign Out"), button:has-text("Logout"), [aria-label="Sign out"]').first();
        if (await signOutBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
            await signOutBtn.click();
            await page.waitForURL('**/signin', { timeout: 5000 }).catch(() => { });
        }

        // Safe Logout / Clear Storage
        await page.goto('/auth');
        await page.evaluate(() => {
            localStorage.clear();
            sessionStorage.clear();
        });

        // --- TECH: PROCESS JOB ---
        await page.goto('/signin');
        await page.waitForLoadState('domcontentloaded');

        // Give the page a moment to render
        await page.waitForTimeout(1000);

        const emailInput = page.locator('input[type="email"]');
        await emailInput.fill('tech@test.com');
        await page.fill('input[type="password"]', 'Password123!');
        await page.click('button[type="submit"]');

        // Techs are redirected to /tech
        await page.waitForURL('**/tech', { timeout: 10000 });

        // Access Job Board
        // (Already on /tech)

        // Give Supabase client time to initialize
        await page.waitForTimeout(2000);

        // Find the Job
        const jobLocator = page.locator(`text=${jobTitle}`).first();
        await expect(jobLocator).toBeVisible({ timeout: 20000 });
        await jobLocator.click();

        // Active Job View - Verify Status Flow

        // 1. Accept Assignment
        await page.click('button:has-text("Accept Assignment")');
        await expect(page.locator('text=Ready to head out?')).toBeVisible();

        // 2. Start Travel
        await page.click('button:has-text("Start Travel (En Route)")');
        await expect(page.locator('text=Sharing location with client...')).toBeVisible();

        // 3. Arrive
        await page.click('button:has-text("I Have Arrived")');
        await expect(page.locator('button:has-text("Complete Job")')).toBeVisible();

        // 4. Complete
        await page.click('button:has-text("Complete Job")');
        await expect(page.getByText('Job Done')).toBeVisible({ timeout: 10000 });

        // Verify it's removed or marked completed in list
        await page.goto('/tech');
        // It might still be visible but marked as completed, depending on filter.
        // Assuming default filter hides completed or moves them.
        // The original check was to be hidden.
        await expect(page.locator(`text=${jobTitle}`).first()).toBeHidden();
    });
});
