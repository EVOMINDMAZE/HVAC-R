import { test, expect } from "@playwright/test";

test.describe("Debug JSON errors", () => {
  test.beforeEach(async ({ page }) => {
    // Enable authentication bypass for development
    await page.addInitScript(() => {
      window.localStorage.setItem("DEBUG_BYPASS", "1");
    });
  });

  test("should redirect /clients to /dashboard/clients", async ({ page }) => {
    // Capture console errors
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to /clients
    await page.goto("/clients");
    
    // Wait for navigation
    await page.waitForURL(/\/dashboard\/clients/, { timeout: 5000 });
    
    // Verify we're on the correct page
    await expect(page).toHaveURL(/\/dashboard\/clients/);
    
    // Check for any console errors
    expect(consoleErrors).toEqual([]);
  });

  test("should load team members without JSON parsing errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
      }
    });

    // Navigate to team settings page
    await page.goto("/settings/team");
    
    // Wait for page to load
    await expect(page.getByText("Team Management", { exact: false })).toBeVisible({ timeout: 10000 });
    
    // Check for specific error messages
    const hasJsonError = consoleErrors.some(error => 
      error.includes("Unexpected token '<'") || 
      error.includes("is not valid JSON") ||
      error.includes("Unable to load team members")
    );
    
    expect(hasJsonError).toBe(false);
  });

  test("should load clients without JSON parsing errors", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(msg.text());
        console.log(`[Console Error] ${msg.text()}`);
      }
    });

    // Navigate to clients page (should redirect)
    await page.goto("/dashboard/clients");
    
    // Wait for page to load - wait for either "Total Clients" or "No clients found" or "Loading clients" to disappear
    await page.waitForLoadState("networkidle");
    
    // Check if any of the expected content appears
    const hasContent = await Promise.any([
      page.getByText("Total Clients").waitFor({ timeout: 5000 }).then(() => true).catch(() => false),
      page.getByText("No clients found").waitFor({ timeout: 5000 }).then(() => true).catch(() => false),
      page.getByRole("heading", { name: "Clients", exact: true }).waitFor({ timeout: 5000 }).then(() => true).catch(() => false),
    ]);
    
    expect(hasContent).toBe(true);
    
    // Check for specific error messages
    const hasJsonError = consoleErrors.some(error => 
      error.includes("Cannot coerce the result to a single JSON object") ||
      error.includes("Unable to load clients") ||
      error.includes("Unexpected token '<'")
    );
    
    if (hasJsonError) {
      console.log("Console errors:", consoleErrors);
    }
    
    expect(hasJsonError).toBe(false);
  });
});