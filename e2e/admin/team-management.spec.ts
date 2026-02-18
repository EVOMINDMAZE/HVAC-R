import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe("Team Management", () => {
  test.beforeEach(async ({ page }) => {
    // Log setup
    page.on("console", (msg) => console.log(`[Browser Console] ${msg.text()}`));
    page.on("request", (request) =>
      console.log(`[Network Request] ${request.method()} ${request.url()}`),
    );
    page.on("response", async (response) => {
      if (response.url().includes("supabase.co")) {
        const url = response.url().split("/").pop();
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

    // Login as admin using auth helper
    await loginAs("admin", page);
  });

  test("Admin can view team and invite new member", async ({ page }) => {
    // 1. Navigate to Team Settings
    console.log("Navigating to Team Settings...");
    await page.goto("/settings/team");

    // 2. Verify Page Load
    await expect(page.getByText("Team Management")).toBeVisible({
      timeout: 10000,
    });

    // 3. Verify Team List Loads (RPC Call checks in background, UI check here)
    // Adjust selector based on your Table implementation
    await expect(page.locator("table")).toBeVisible();

    // 4. Invite User Flow
    const testEmail = `test_invite_${Date.now()}@thermoneural.com`;
    const testName = "Test Automator";

    console.log(`Inviting user: ${testEmail}`);

    await page.fill('input[placeholder*="john@example.com"]', testEmail);
    await page.fill('input[placeholder*="John Doe"]', testName);

    // Select Role (assuming Select component)
    const roleTrigger = page.locator("form").locator('button[role="combobox"]');
    if (await roleTrigger.isVisible()) {
      await roleTrigger.click();
      await page.getByLabel("Manager").click(); // or exact text "Manager"
    } else {
      // Fallback for native select if changed
      const selectOptions = page.locator("select");
      if (await selectOptions.isVisible()) {
        await selectOptions.selectOption("manager");
      }
    }

    // 5. Submit
    const inviteBtn = page.locator('button:has-text("Send Invite")');
    await inviteBtn.click();

    // 6. Verify Success Toast
    // "Invitation sent to..."
    const toast = page.getByText("Invitation Sent", { exact: true }).first();
    await expect(toast).toBeVisible({ timeout: 10000 });

    console.log("Invitation success verified.");
  });

  test("Admin can invite a client portal user (client role)", async ({ page }) => {
    await page.goto("/settings/team");
    await expect(page.getByText("Team Management")).toBeVisible({
      timeout: 10000,
    });

    const testEmail = `test_client_${Date.now()}@thermoneural.com`;
    const testName = "Test Client";

    await page.fill('input[placeholder*="john@example.com"]', testEmail);
    await page.fill('input[placeholder*="John Doe"]', testName);

    // Select Client role. Server will resolve/create the client record by email if needed.
    const roleTrigger = page.locator("form").locator('button[role="combobox"]');
    if (await roleTrigger.isVisible()) {
      await roleTrigger.click();
      await page.getByLabel("Client").click();
    } else {
      const selectOptions = page.locator("select");
      if (await selectOptions.isVisible()) {
        await selectOptions.selectOption("client");
      }
    }

    await page.locator('button:has-text("Send Invite")').click();

    const toast = page.getByText("Invitation Sent", { exact: true }).first();
    await expect(toast).toBeVisible({ timeout: 10000 });
  });
});
