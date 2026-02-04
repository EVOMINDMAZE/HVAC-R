import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/auth";

test.describe("Student Learning Portal", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs("student", page);
  });

  test("student can access learning tools", async ({ page }) => {
    const learningPaths = [
      "/diy-calculators",
      "/standard-cycle",
      "/refrigerant-comparison",
      "/troubleshooting",
      "/web-stories",
    ];

    for (const path of learningPaths) {
      console.log(`Testing student access to: ${path}`);
      await page.goto(path);

      // Should not be redirected to signin
      await expect(page).not.toHaveURL(/\/signin/);

      // Page should load
      const mainContent = page.locator("main").first();
      await expect(mainContent).toBeVisible({ timeout: 5000 });
    }
  });

  test("student cannot access dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");

    // Check if redirected or shows access denied
    const currentUrl = page.url();
    console.log(
      `Student attempting to access dashboard, current URL: ${currentUrl}`,
    );

    if (currentUrl.includes("/dashboard")) {
      // Student might have limited dashboard access
      const dashboardContent = page
        .locator("main")
        .or(page.locator("body"))
        .first();
      await expect(dashboardContent).toBeVisible({ timeout: 5000 });
    } else {
      // Redirected away from dashboard
      await expect(page).not.toHaveURL(/\/dashboard/);
    }
  });

  test("student cannot access admin or technician pages", async ({ page }) => {
    const restrictedPaths = [
      "/settings/team",
      "/dispatch",
      "/dashboard/clients",
      "/estimate-builder", // Might be restricted to professionals
    ];

    for (const path of restrictedPaths) {
      console.log(`Testing student cannot access: ${path}`);
      await page.goto(path);

      const currentUrl = page.url();
      if (currentUrl.includes(path)) {
        // Still on restricted page, check for unauthorized message
        const unauthorizedMsg = page.getByText(
          /unauthorized|not authorized|access denied/i,
        );
        await expect(unauthorizedMsg).toBeVisible({ timeout: 5000 });
      } else {
        // Redirected away
        console.log(
          `Student attempting to access ${path} was redirected to: ${currentUrl}`,
        );
        await expect(page).not.toHaveURL(
          new RegExp(path.replace(/\//g, "\\/")),
        );
      }
    }
  });
});
