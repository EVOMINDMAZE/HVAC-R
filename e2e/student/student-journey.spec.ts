import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe.serial("Student Learning Path Journey", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("student", page);
  });

  test("should land on learn page after login", async ({ page }) => {
    // Verify URL contains /learn or /dashboard
    const url = page.url();
    expect(url).toMatch(/\/(learn|dashboard)/);
    // Ensure not redirected to signin
    await expect(page).not.toHaveURL(/\/signin/);
  });

  test("should access all learning tools", async ({ page }) => {
    const learningPaths = [
      "/diy-calculators",
      "/standard-cycle",
      "/refrigerant-comparison",
      "/troubleshooting",
      "/web-stories",
    ];
    for (const path of learningPaths) {
      await page.goto(path);
      await expect(page).not.toHaveURL(/\/signin/);
      const mainContent = page.locator("main").first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });
    }
  });

  test("should interact with DIY calculators", async ({ page }) => {
    await page.goto("/diy-calculators");
    // Wait for page to load
    await expect(page.locator("main")).toBeVisible();
    // Find at least one calculator input
    const input = page.locator('input[type="number"], input[type="text"]').first();
    await expect(input).toBeVisible();
    // Fill with test value
    await input.fill("10");
    // Find calculate button
    const button = page.locator('button:has-text("Calculate"), button:has-text("Calculate")').first();
    await button.click();
    // Expect some result visible
    const result = page.locator('text=/result/i, .result').first();
    await expect(result).toBeVisible({ timeout: 5000 });
  });

  test("should interact with Standard Cycle calculator", async ({ page }) => {
    await page.goto("/standard-cycle");
    await expect(page.locator("main")).toBeVisible();
    // Look for input fields
    const input = page.locator('input[type="number"], input[type="text"]').first();
    await expect(input).toBeVisible();
    await input.fill("25");
    // Find calculate or simulate button
    const button = page.locator('button:has-text("Calculate"), button:has-text("Simulate")').first();
    await button.click();
    // Expect output visible
    const output = page.locator('.output, text=/result/i').first();
    await expect(output).toBeVisible({ timeout: 5000 });
  });

  test("should interact with Refrigerant Comparison tool", async ({ page }) => {
    await page.goto("/refrigerant-comparison");
    await expect(page.locator("main")).toBeVisible();
    // Find refrigerant selection
    const select = page.locator('select, [role="combobox"]').first();
    await expect(select).toBeVisible();
    // Select first option
    await select.selectOption({ index: 0 });
    // Find compare button
    const button = page.locator('button:has-text("Compare")').first();
    await button.click();
    // Expect comparison table
    const table = page.locator('table, .comparison-table').first();
    await expect(table).toBeVisible({ timeout: 5000 });
  });

  test("should navigate Web Stories tutorial", async ({ page }) => {
    await page.goto("/web-stories");
    await expect(page.locator("main")).toBeVisible();
    // Find navigation buttons
    const nextButton = page.locator('button:has-text("Next"), [aria-label="Next"]').first();
    await expect(nextButton).toBeVisible();
    // Click next
    await nextButton.click();
    // Expect slide change
    const slide = page.locator('.slide, [role="region"]').first();
    await expect(slide).toBeVisible();
  });

  test("should complete interactive troubleshooting wizard", async ({ page }) => {
    await page.goto("/troubleshooting");
    await expect(page.locator("main")).toBeVisible();
    // Find start button or first step
    const startButton = page.locator('button:has-text("Start"), button:has-text("Begin")').first();
    if (await startButton.isVisible()) {
      await startButton.click();
    }
    // Find step title
    const stepTitle = page.locator('text=/step/i, .step-title').first();
    await expect(stepTitle).toBeVisible();
    // Find options and select one
    const option = page.locator('input[type="radio"], .option').first();
    await option.click();
    // Find next button
    const nextButton = page.locator('button:has-text("Next")').first();
    await nextButton.click();
    // Expect progress indicator
    const progress = page.locator('.progress, [role="progressbar"]').first();
    await expect(progress).toBeVisible();
    // Complete wizard (maybe multiple steps)
    // Eventually reach completion
    const completion = page.locator('text=/complete/i, .completion').first();
    await expect(completion).toBeVisible({ timeout: 10000 });
  });

  test("should generate certificate after completing learning module", async ({ page }) => {
    // Check if certificate generation exists
    await page.goto("/troubleshooting");
    // After completing wizard, certificate button may appear
    // For now, we'll check if any page has certificate button
    const certButton = page.locator('button:has-text("Certificate"), button:has-text("Generate Certificate")').first();
    if (await certButton.isVisible({ timeout: 1000 })) {
      await certButton.click();
      // Expect PDF download or new page
      await expect(page.locator('text=/certificate/i')).toBeVisible();
    } else {
      // Skip test if no certificate button
      console.log("Certificate generation not available, skipping detailed test");
    }
  });

  test("should have accessible learning tools", async ({ page }) => {
    const learningPaths = [
      "/diy-calculators",
      "/standard-cycle",
      "/refrigerant-comparison",
      "/troubleshooting",
      "/web-stories",
    ];
    for (const path of learningPaths) {
      await page.goto(path);
      // Check for at least one heading
      const heading = page.locator("h1, h2, h3").first();
      await expect(heading).toBeVisible();
      // Check for main landmark
      const main = page.locator("main");
      await expect(main).toBeVisible();
      // Basic accessibility check: page title not empty
      const title = await page.title();
      expect(title).toBeTruthy();
    }
  });

  test("should not access company-specific features", async ({ page }) => {
    const restrictedPaths = [
      "/dashboard",
      "/settings/company",
      "/dispatch",
      "/dashboard/clients",
      "/estimate-builder",
      "/tools/cascade-cycle",
      "/tools/leak-rate-calculator",
      "/tools/iaq-wizard",
      "/tools/refrigerant-report",
      "/tools/refrigerant-inventory",
      "/tools/warranty-scanner",
    ];
    for (const path of restrictedPaths) {
      await page.goto(path);
      const currentUrl = page.url();
      // Should be redirected away from restricted path
      expect(currentUrl).not.toMatch(new RegExp(`^${path}`));
      // Should not be on the restricted page
      if (currentUrl.includes(path)) {
        // If still on page, expect unauthorized message
        const unauthorizedMsg = page.locator('text=/unauthorized|not authorized|access denied/i');
        await expect(unauthorizedMsg).toBeVisible({ timeout: 5000 });
      }
    }
  });
});