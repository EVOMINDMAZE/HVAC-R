import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe("AI Pattern Recognition - Pattern Creation", () => {
  test("technician can create troubleshooting patterns", async ({ page }) => {
    await loginAs("technician", page);

    // Navigate to troubleshooting
    await page.goto("/troubleshooting");
    await expect(page).toHaveTitle(/Troubleshooting/);

    // Enter symptoms
    await page.selectOption('[data-testid="symptom-select"]', "no_cooling");
    await page.click('button:has-text("Add Symptom")');

    // Add measurements
    await page.fill('[placeholder="Suction Pressure (kPa)"]', "40");
    await page.fill('[placeholder="Head Pressure (kPa)"]', "350");

    // Click AI Troubleshoot
    await page.click('button:has-text("AI Troubleshoot")');

    // Verify enhanced troubleshooting loads
    await expect(page.locator('[data-testid="pattern-panel"]')).toBeVisible();

    // Submit feedback
    await page.click('button:has-text("Helpful")');
    await expect(page.locator("text=Feedback Submitted")).toBeVisible();
  });

  test("patterns appear in insights dashboard", async ({ page }) => {
    await loginAs("admin", page);
    await page.goto("/ai/pattern-insights");
    await expect(page.locator("text=Pattern Insights")).toBeVisible();

    // Verify patterns loaded
    await expect(
      page.locator('[data-testid="total-patterns"]').first(),
    ).toHaveText(/^\d+$/);
  });
});
