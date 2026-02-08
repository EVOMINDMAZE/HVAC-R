import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

/**
 * Debug Test: Check console errors during job creation
 */

test("Debug: Job creation with console error logging", async ({ page }) => {
  console.log("\n=== DEBUG: Job Creation with Console Logging ===");

  // Capture console errors
  const consoleErrors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(`[${msg.type()}] ${msg.text()}`);
    }
    // Also log network errors
    if (
      msg.text().includes("Failed to load resource") ||
      msg.text().includes("Error")
    ) {
      consoleErrors.push(`[NETWORK/ERROR] ${msg.text()}`);
    }
  });

  // Capture page errors
  const pageErrors: string[] = [];
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });

  // Login as admin
  await loginAs("admin", page);

  // Go to jobs page
  await page.goto("/dashboard/jobs");
  await page.waitForLoadState("networkidle");

  // Open dialog
  const newJobBtn = page.locator('button:has-text("New Job")').first();
  await newJobBtn.click();
  await page.waitForTimeout(500);

  // Fill form
  const testJobName = `Console Debug Job ${Date.now()}`;
  await page.fill('input[id="client-name"]', "Console Debug Client");
  await page.fill('input[id="job-name"]', testJobName);
  await page.fill('input[id="address"]', "456 Console Debug St");

  // Submit
  const createBtn = page.locator('button[type="submit"]:visible').first();
  await createBtn.click();

  // Wait for any errors
  await page.waitForTimeout(3000);

  // Print errors
  console.log("\n--- Console Errors ---");
  if (consoleErrors.length === 0) {
    console.log("No console errors detected");
  } else {
    consoleErrors.forEach((err) => console.log(err));
  }

  console.log("\n--- Page Errors ---");
  if (pageErrors.length === 0) {
    console.log("No page errors detected");
  } else {
    pageErrors.forEach((err) => console.log(err));
  }

  // Check current URL and page state
  console.log("\n--- Page State ---");
  console.log("Current URL:", page.url());

  // Check if we're still on the jobs page or got redirected
  const pageContent = await page.content();
  const hasError =
    pageContent.includes("Error") || pageContent.includes("error");
  console.log("Page contains 'Error':", hasError);

  // Check for job list
  const jobListVisible = await page.locator("text=Job Management").isVisible();
  console.log("Job Management heading visible:", jobListVisible);

  // Check for dialog (if it's still open)
  const dialogVisible = await page.locator('text="Create New Job"').isVisible();
  console.log("Dialog still visible:", dialogVisible);

  // Go to jobs list to verify
  await page.goto("/dashboard/jobs");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1000);

  const jobVisible = await page.locator(`text="${testJobName}"`).isVisible();
  console.log(`\nJob "${testJobName}" created and visible: ${jobVisible}`);
});
