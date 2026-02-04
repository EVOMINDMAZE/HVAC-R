import { test, expect } from "@playwright/test";
import { loginAs } from "./helpers/auth";

test("DEBUG: Navigate to admin dispatch page", async ({ page }) => {
  await loginAs("admin", page);

  console.log("Navigating to /dashboard/dispatch...");
  await page.goto("/dashboard/dispatch");
  await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {
    console.log("Network did not become idle, continuing...");
  });

  console.log("Current URL:", page.url());

  // Wait for loading to finish
  console.log("Waiting for loading spinner to disappear...");
  await page
    .waitForSelector("text=Loading...", { state: "hidden", timeout: 15000 })
    .catch(() => {
      console.log("Loading spinner still visible after 15s");
    });

  // Take screenshot
  await page.screenshot({ path: "dispatch-screenshot.png", fullPage: true });
  console.log("Screenshot saved to dispatch-screenshot.png");

  // Log page content
  const bodyText = await page.textContent("body");
  console.log("Page content preview:", bodyText?.substring(0, 1000));

  // Keep browser open for 20 seconds for viewing
  console.log("Browser will stay open for 20 seconds...");
  await page.waitForTimeout(20000);
});
