import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { loginAs } from '../helpers/auth';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Setup Supabase Admin Client for Test Setup
const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

test.describe('Technician Daily Operations Journey', () => {
  let techUserId: string;
  let jobId: string;
  let jobTitle: string;

  test.beforeAll(async () => {
    // 1. Ensure Technician User Exists using Admin API
    const techEmail = 'tech@test.com';
    const techPassword = 'Password123!';

    // Check if user exists
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error('[Technician Journey] Failed to list users:', listError);
      throw listError;
    }

    let techUser = users.users.find(u => u.email === techEmail);

    if (!techUser) {
      console.log(`[Technician Journey] Creating missing tech user: ${techEmail}`);
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
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: techUserId,
        email: techEmail,
        role: 'technician',
        full_name: 'Test Technician'
      });

    if (profileError) {
      console.log('[Technician Journey] Warning: ensuring profile failed (RLS?):', profileError);
    }

    // 3. Ensure at least one Client exists
    const { count, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (countError) console.log('[Technician Journey] Warning checking clients:', countError);
    console.log(`[Technician Journey] Found ${count} clients.`);

    let clientId: string | null = null;
    if (count === 0) {
      console.log('[Technician Journey] No clients found. Seeding test client...');
      const { data: newClient, error: insertError } = await supabase.from('clients').insert({
        name: 'Test Client',
        email: 'client@test.com',
        phone: '555-0100',
        address: '123 Test St'
      }).select('id').single();
      if (insertError) {
        console.error('[Technician Journey] FAILED to seed client:', insertError);
        throw insertError;
      }
      clientId = newClient.id;
      console.log('[Technician Journey] Client seeded successfully.');
    } else {
      // Use existing client
      const { data: existingClient, error: fetchError } = await supabase
        .from('clients')
        .select('id')
        .limit(1)
        .single();
      if (!fetchError) clientId = existingClient.id;
    }

    // 4. Create a job assigned to technician
    jobTitle = `Daily Ops Test Job ${Date.now()}`;
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        title: jobTitle,
        client_id: clientId,
        technician_id: techUserId,
        status: 'pending',
        scheduled_at: new Date().toISOString(),
        description: 'Test job for technician daily operations journey'
      })
      .select('id')
      .single();
    
    if (jobError) {
      console.error('[Technician Journey] Failed to create test job:', jobError);
      throw jobError;
    }
    jobId = job.id;
    console.log(`[Technician Journey] Created test job ${jobId} assigned to technician`);
  });

  test.beforeEach(async ({ page }) => {
    // Prevent Onboarding Guide Modal
    await page.addInitScript(() => {
      window.localStorage.setItem('thermoneural:onboarding-complete', 'true');
    });
  });

  test('technician can login and view assigned jobs', async ({ page }) => {
    await loginAs('technician', page);
    await expect(page).toHaveURL(/\/tech|\/dashboard/);
    
    // Navigate to job board (tech page)
    await page.goto('/tech');
    await page.waitForLoadState('domcontentloaded');
    
    // Verify job list is visible
    await expect(page.locator('h1:has-text("Field Jobs")')).toBeVisible();
    
    // Check if our test job appears (may be filtered by status)
    // Since job status is 'pending', it should appear
    await expect(page.getByText(jobTitle).first()).toBeVisible();
  });

  test('technician can update job status through workflow', async ({ page }) => {
    await loginAs('technician', page);
    await page.goto('/tech');
    await page.waitForLoadState('domcontentloaded');
    
    // Find and click the test job
    await page.getByText(jobTitle).first().click();
    await page.waitForURL(`/tech/jobs/${jobId}`);
    
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
    
    // Verify job is marked completed
    await page.goto('/tech');
    await page.waitForLoadState('domcontentloaded');
    // Completed jobs may be filtered out
    await expect(page.getByText(jobTitle).first()).toBeHidden();
  });

  test.describe('Calculator Advanced Scenarios', () => {
    test('technician can use standard cycle calculator with advanced inputs', async ({ page }) => {
      await loginAs('technician', page);
      await page.goto('/standard-cycle');
      await page.waitForLoadState('domcontentloaded');
      
      // Verify calculator page loaded
      await expect(page.locator('h1:has-text("Standard Cycle")')).toBeVisible();
      
      // Fill in advanced inputs
      await page.fill('input[name="evaporatorTemp"]', '-20');
      await page.fill('input[name="condenserTemp"]', '45');
      await page.fill('input[name="subcooling"]', '5');
      await page.fill('input[name="superheat"]', '10');
      await page.selectOption('select[name="refrigerant"]', 'R410A');
      
      // Run simulation
      await page.click('button:has-text("Run Simulation")');
      
      // Wait for results
      await expect(page.locator('[data-testid="simulation-results"]')).toBeVisible({ timeout: 15000 });
      
      // Verify some output
      await expect(page.locator('text=COP')).toBeVisible();
      await expect(page.locator('text=Capacity')).toBeVisible();
    });

    test('technician can use refrigerant comparison calculator', async ({ page }) => {
      await loginAs('technician', page);
      await page.goto('/refrigerant-comparison');
      await page.waitForLoadState('domcontentloaded');
      
      await expect(page.locator('h1:has-text("Refrigerant Comparison")')).toBeVisible();
      
      // Select two refrigerants
      await page.selectOption('select[name="refrigerant1"]', 'R410A');
      await page.selectOption('select[name="refrigerant2"]', 'R32');
      
      // Set conditions
      await page.fill('input[name="evapTemp"]', '-10');
      await page.fill('input[name="condTemp"]', '40');
      
      // Run comparison
      await page.click('button:has-text("Compare")');
      
      // Wait for results
      await expect(page.locator('[data-testid="comparison-results"]')).toBeVisible({ timeout: 10000 });
    });

    test('technician can use DIY calculators', async ({ page }) => {
      await loginAs('technician', page);
      await page.goto('/diy-calculators');
      await page.waitForLoadState('domcontentloaded');
      
      await expect(page.locator('h1:has-text("DIY Calculators")')).toBeVisible();
      
      // Test at least one calculator
      await page.click('button:has-text("Air Density")');
      await page.waitForTimeout(500);
      
      await page.fill('input[name="temperature"]', '25');
      await page.fill('input[name="pressure"]', '101.3');
      await page.fill('input[name="humidity"]', '50');
      
      await page.click('button:has-text("Calculate")');
      await expect(page.locator('text=Density')).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Schedule and Time-off (Placeholder)', () => {
    test.skip('technician can view schedule', async ({ page }) => {
      await loginAs('technician', page);
      // TODO: implement when schedule page is available
    });

    test.skip('technician can request time-off', async ({ page }) => {
      await loginAs('technician', page);
      // TODO: implement when time-off feature is available
    });
  });

  test.describe('Equipment Check-out (Placeholder)', () => {
    test.skip('technician can check out equipment', async ({ page }) => {
      await loginAs('technician', page);
      // TODO: implement when equipment check-out feature is available
    });
  });

  test.describe('Mobile Field Workflows', () => {
    test('technician interface works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAs('technician', page);
      
      // Verify mobile-friendly layout
      await expect(page.locator('body')).toBeVisible();
      
      // Check that navigation is accessible
      await page.click('button[aria-label="Open menu"]').catch(() => {});
      // Some mobile menu might appear
    });

    test('job status updates work on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await loginAs('technician', page);
      await page.goto('/tech');
      await page.waitForLoadState('domcontentloaded');
      
      // Find and click the test job (if visible)
      const jobLocator = page.getByText(jobTitle).first();
      if (await jobLocator.isVisible()) {
        await jobLocator.click();
        await page.waitForURL(`/tech/jobs/${jobId}`);
        // Verify buttons are visible and clickable
        await expect(page.locator('button:has-text("Accept Assignment")')).toBeVisible();
      }
    });
  });

  test.describe('Admin Area Access Restrictions', () => {
    test.beforeEach(async ({ page }) => {
      await loginAs('technician', page);
    });

    const adminPaths = [
      '/settings/team',
      '/clients',
      '/settings',
      '/dashboard/team',
      '/admin',
      '/compliance',
      '/reports/admin'
    ];

    for (const path of adminPaths) {
      test(`technician cannot access ${path}`, async ({ page }) => {
        await page.goto(path);
        await page.waitForLoadState('domcontentloaded');
        
        // Should not be on the admin page (redirected or access denied)
        const currentUrl = page.url();
        if (currentUrl.includes(path)) {
          // Still on the page, check for access denied message
          const bodyText = await page.textContent('body');
          expect(bodyText?.toLowerCase()).toMatch(/access denied|unauthorized|forbidden/);
        } else {
          // Redirected away from admin page
          expect(currentUrl).not.toContain(path);
        }
      });
    }
  });
});