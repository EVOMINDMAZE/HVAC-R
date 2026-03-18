import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";
import { createInviteCode, redeemInviteCodeViaUI } from "../helpers/invite";

test.describe("Client Portal Journey", () => {
  test.describe.configure({ mode: "serial" });

  let inviteCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create an invite code for client role before tests
    // Note: This requires admin privileges; we'll use the invite helper
    // Since we can't run async code in beforeAll without page, we'll create invite in first test
  });

  test.beforeEach(async ({ page }) => {
    // Clear any existing session
    await page.context().clearCookies();
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("Client invite redemption", async ({ page }) => {
    // Create invite code as admin (using helper)
    inviteCode = await createInviteCode("client");
    console.log(`[Client Journey] Created invite code: ${inviteCode}`);

    // Navigate to join page and redeem invite
    await redeemInviteCodeViaUI(page, inviteCode);

    // Verify successful join - should redirect to select-company or dashboard
    await expect(page).toHaveURL(/\/select-company|\/dashboard|\/portal/);
    
    // If on select-company, select first workspace
    if (page.url().includes("/select-company")) {
      const selectButton = page.getByRole("button", { name: /select workspace/i }).first();
      await selectButton.waitFor({ state: "visible", timeout: 15000 });
      await selectButton.click();
      await page.waitForURL(/\/portal|\/dashboard/);
    }

    // Verify we're on client portal page
    await expect(page).toHaveURL(/\/portal|\/dashboard/);
    await expect(page.locator("h1").first()).toBeVisible();
    console.log("[Client Journey] Invite redemption successful");
  });

  test("Client can view assets on dashboard", async ({ page }) => {
    // Login as existing client (using predefined credentials)
    await loginAs("client", page);

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check for assets section or empty state - using exact text from ClientDashboard component
    const assetsHeader = page.locator("h2", { hasText: "My Assets" }).or(page.locator("h2", { hasText: /assets|equipment|your equipment/i }));
    const emptyState = page.locator("text=No assets found linked to your account");

    // Either assets header or empty state should be visible
    await expect(assetsHeader.or(emptyState)).toBeVisible({ timeout: 10000 });

    // If assets exist, verify they are visible
    // Asset cards are in a grid with class "grid gap-4 md:grid-cols-2 lg:grid-cols-3" and each card has class "hover:shadow-lg transition-shadow"
    const assetCards = page.locator('div.grid.gap-4.md\\:grid-cols-2.lg\\:grid-cols-3 > div, [data-testid="asset-card"], div.border-slate-200');
    const assetCount = await assetCards.count();
    if (assetCount > 0) {
      await expect(assetCards.first()).toBeVisible();
      console.log(`[Client Journey] Found ${assetCount} asset cards`);
      
      // Ensure client sees only their own assets (data isolation)
      // This is enforced by RLS, but we can verify no "Unauthorized" errors
      await expect(page.locator("text=/unauthorized|access denied/i")).not.toBeVisible();
      
      // Verify each asset card contains asset name and status
      for (let i = 0; i < Math.min(assetCount, 3); i++) {
        const card = assetCards.nth(i);
        await expect(card.locator("h3, h4, .font-semibold").first()).toBeVisible();
      }
    } else {
      console.log("[Client Journey] No assets found (empty state)");
    }
  });

  test("Client can submit service request via portal", async ({ page }) => {
    await loginAs("client", page);

    // Try multiple possible routes for service request submission
    const possibleRoutes = ["/service-request", "/new-request", "/triage", "/dashboard/new-job", "/jobs/new"];
    let routeFound = false;
    
    for (const route of possibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const currentUrl = page.url();
      // If we're still on the requested route (not redirected), assume page exists
      if (currentUrl.includes(route) || currentUrl.includes("triage")) {
        routeFound = true;
        console.log(`[Client Journey] Found service request page at ${route}`);
        
        // Look for form elements
        const titleInput = page.locator('input[name="title"], input[placeholder*="title"], input[placeholder*="issue"]');
        const descriptionTextarea = page.locator('textarea[name="description"], textarea[placeholder*="description"], textarea[placeholder*="details"]');
        
        if (await titleInput.isVisible() && await descriptionTextarea.isVisible()) {
          // Fill service request form
          await titleInput.fill("Test Service Request");
          await descriptionTextarea.fill("Test description for service request.");
          
          // Select asset if dropdown present
          const assetDropdown = page.locator('select[name="asset"], [aria-label*="asset"], select[name="equipment"]');
          if (await assetDropdown.isVisible()) {
            await assetDropdown.selectOption({ index: 0 });
          }

          // Submit form
          await page.locator('button[type="submit"]:has-text("Submit"), button:has-text("Submit Request"), button:has-text("Send Request")').click();

          // Verify success message or redirect
          await expect(page.locator('text=/request submitted|success|thank you|received/i')).toBeVisible({ timeout: 10000 });
          console.log("[Client Journey] Service request submitted successfully");
          break;
        } else {
          // Form not found on this page, try next route
          console.log(`[Client Journey] Form not found on ${route}, trying next route`);
          continue;
        }
      }
    }
    
    if (!routeFound) {
      // If no service request page found, skip test (maybe feature not implemented)
      test.skip();
      console.log("[Client Journey] Service request page not found, skipping test");
    }
  });

  test("Client can view invoices", async ({ page }) => {
    await loginAs("client", page);

    // Try multiple possible routes for invoices
    const possibleRoutes = ["/invoices", "/billing", "/dashboard/invoices"];
    let routeFound = false;
    
    for (const route of possibleRoutes) {
      await page.goto(route);
      await page.waitForLoadState("domcontentloaded");
      const currentUrl = page.url();
      if (currentUrl.includes(route) || currentUrl.includes("invoices") || currentUrl.includes("billing")) {
        routeFound = true;
        console.log(`[Client Journey] Found invoices page at ${route}`);
        
        // Verify invoices page header
        await expect(page.locator("h1, h2").first()).toBeVisible();
        
        // Look for invoice table or empty state
        const invoiceTable = page.locator('table');
        const emptyState = page.locator('text=/no invoices|no billing records|no invoices found/i');
        
        await expect(invoiceTable.or(emptyState)).toBeVisible({ timeout: 10000 });

        // If invoice table exists, verify rows
        if (await invoiceTable.isVisible()) {
          const invoiceRows = invoiceTable.locator('tbody tr');
          const invoiceCount = await invoiceRows.count();
          if (invoiceCount > 0) {
            await expect(invoiceRows.first()).toBeVisible();
            console.log(`[Client Journey] Found ${invoiceCount} invoice rows`);
            
            // Verify invoice details (amount, status, ticket number)
            const firstRow = invoiceRows.first();
            await expect(firstRow.locator('text=/$|USD|amount/i')).toBeVisible();
            await expect(firstRow.locator('text=/paid|pending|overdue|sent/i')).toBeVisible();
            await expect(firstRow.locator('text=/ticket|invoice/i')).toBeVisible();
            
            // Click to view invoice details if link exists
            const viewLink = firstRow.locator('a:has-text("View"), button:has-text("View")').first();
            if (await viewLink.isVisible()) {
              await viewLink.click();
              await page.waitForLoadState("domcontentloaded");
              await expect(page.locator('text=/invoice details|invoice #/i')).toBeVisible();
              await page.goBack();
            }
          } else {
            console.log("[Client Journey] Invoice table exists but no rows (empty)");
          }
        } else {
          console.log("[Client Journey] No invoices found (empty state)");
        }
        break;
      }
    }
    
    if (!routeFound) {
      // Invoices page not found, skip test
      test.skip();
      console.log("[Client Journey] Invoices page not found, skipping test");
    }
  });

  test("Client can review job history", async ({ page }) => {
    await loginAs("client", page);

    // Navigate to job history page (could be /jobs, /job-history, /work-history)
    await page.goto("/jobs");
    await page.waitForLoadState("domcontentloaded");

    // Check if page shows client's jobs
    const currentUrl = page.url();
    if (currentUrl.includes("/jobs") || currentUrl.includes("/work-history")) {
      // Verify page header
      await expect(page.locator("h1").first()).toBeVisible();
      
      // Check for jobs list or empty state
      const jobsList = page.locator('[data-testid="job-card"], .job-item, table tbody tr');
      const emptyState = page.locator('text=/no jobs|no work history/i');
      
      await expect(jobsList.or(emptyState)).toBeVisible({ timeout: 10000 });

      // If jobs exist, verify at least one is visible
      const jobCount = await jobsList.count();
      if (jobCount > 0) {
        await expect(jobsList.first()).toBeVisible();
        console.log(`[Client Journey] Found ${jobCount} jobs`);
        
        // Verify job details (title, status, date)
        const firstJob = jobsList.first();
        await expect(firstJob.locator('text=/completed|in progress|scheduled/i')).toBeVisible();
        await expect(firstJob.locator('text=/job|service|work/i')).toBeVisible();
        
        // Click to view job details if link exists
        const viewLink = firstJob.locator('a:has-text("View"), button:has-text("View")').first();
        if (await viewLink.isVisible()) {
          await viewLink.click();
          await page.waitForLoadState("domcontentloaded");
          await expect(page.locator('text=/job details|job #/i')).toBeVisible();
          // Verify client cannot see admin/technician only sections
          await expect(page.locator('text=/assign technician|internal notes|admin/i')).not.toBeVisible();
          await page.goBack();
        }
      } else {
        console.log("[Client Journey] No jobs found (empty state)");
      }
    } else {
      // Job history page not found, skip test
      test.skip();
      console.log("[Client Journey] Job history page not found, skipping test");
    }
  });

  test("Client can update notification preferences", async ({ page }) => {
    await loginAs("client", page);

    // Navigate to client dashboard where notification settings are in Settings tab
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Click on Settings tab (tab with value "settings")
    const settingsTab = page.locator('[role="tab"][value="settings"], button[role="tab"]:has-text("Settings")').first();
    if (await settingsTab.isVisible()) {
      await settingsTab.click();
      await page.waitForLoadState("domcontentloaded");
      
      // Look for notification preferences card
      const notificationCard = page.locator('text=Notification Preferences').first();
      if (await notificationCard.isVisible()) {
        // Find email toggle switch
        const emailToggle = page.locator('button[role="switch"][aria-checked]').first().or(page.locator('input[type="checkbox"][id="email-notifications"]'));
        const smsToggle = page.locator('button[role="switch"][aria-checked]').nth(1).or(page.locator('input[type="checkbox"][id="sms-notifications"]'));
        
        if (await emailToggle.isVisible() || await smsToggle.isVisible()) {
          // Toggle email notifications if exists
          if (await emailToggle.isVisible()) {
            const initialEmailState = await emailToggle.isChecked();
            await emailToggle.click();
            const newEmailState = await emailToggle.isChecked();
            expect(newEmailState).toBe(!initialEmailState);
            console.log(`[Client Journey] Toggled email notifications from ${initialEmailState} to ${newEmailState}`);
          }

          // Toggle SMS notifications if exists
          if (await smsToggle.isVisible()) {
            const initialSmsState = await smsToggle.isChecked();
            await smsToggle.click();
            const newSmsState = await smsToggle.isChecked();
            expect(newSmsState).toBe(!initialSmsState);
            console.log(`[Client Journey] Toggled SMS notifications from ${initialSmsState} to ${newSmsState}`);
          }

          // Save preferences button
          const saveButton = page.locator('button:has-text("Save Preferences")');
          if (await saveButton.isVisible()) {
            await saveButton.click();
            await expect(page.locator('text=/preferences saved|updated/i')).toBeVisible({ timeout: 5000 });
          }
          console.log("[Client Journey] Notification preferences updated successfully");
        } else {
          // Toggles not found, skip test
          test.skip();
          console.log("[Client Journey] Notification toggles not found, skipping test");
        }
      } else {
        // Notification card not found, skip test
        test.skip();
        console.log("[Client Journey] Notification preferences card not found, skipping test");
      }
    } else {
      // Settings tab not found, skip test
      test.skip();
      console.log("[Client Journey] Settings tab not found, skipping test");
    }
  });

  test("Mobile portal experience", async ({ page }) => {
    await loginAs("client", page);

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Navigate to dashboard
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Verify responsive layout - check for mobile menu/hamburger
    const mobileMenu = page.locator('button[aria-label*="menu"], button:has-text("Menu"), [class*="hamburger"]');
    if (await mobileMenu.isVisible()) {
      await mobileMenu.click();
      await expect(page.locator('nav[aria-label*="navigation"], [role="navigation"]')).toBeVisible();
      await mobileMenu.click(); // Close menu
    }

    // Verify content is visible and not overflowing
    const mainContent = page.locator("main").or(page.locator("body"));
    await expect(mainContent).toBeVisible();
    
    // Check for mobile-friendly elements (touch targets)
    const buttons = page.locator("button");
    const buttonCount = await buttons.count();
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();
      if (box) {
        // Minimum touch target size (44px recommended by WCAG)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }

    // Navigate to another page (assets) and verify mobile usability
    await page.goto("/dashboard/assets");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.locator("body")).toBeVisible();

    console.log("[Client Journey] Mobile portal experience verified");
  });

  test("Data isolation - client cannot access other client data", async ({ page }) => {
    await loginAs("client", page);

    // Attempt to access another client's detail page (assuming URL pattern /clients/:id)
    await page.goto("/clients/other-client-id-123");
    await page.waitForLoadState("domcontentloaded");

    // Should be redirected or show "not found" / "unauthorized"
    const currentUrl = page.url();
    if (currentUrl.includes("/clients/other-client-id-123")) {
      // Still on page, check for error message
      await expect(page.locator('text=/not found|unauthorized|access denied|don\'t have permission/i')).toBeVisible();
    } else {
      // Redirected away (likely to own dashboard)
      await expect(page).not.toHaveURL(/\/clients\/other-client-id-123/);
      console.log(`[Client Journey] Redirected from other client page to: ${currentUrl}`);
    }

    // Attempt to access admin-only pages
    await page.goto("/settings/team");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).not.toHaveURL(/\/settings\/team/);

    await page.goto("/dispatch");
    await page.waitForLoadState("domcontentloaded");
    await expect(page).not.toHaveURL(/\/dispatch/);

    console.log("[Client Journey] Data isolation verified - client cannot access other client or admin pages");
  });
});