import { test, expect } from "@playwright/test";
import { chromium } from "playwright";

test.describe("Full Site Validation - All Pages & Roles", () => {
  test.beforeEach(async ({ page }) => {
    // Forward browser logs for errors
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        console.log(`[BROWSER ERROR] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      console.log(`[PAGE ERROR] ${err.message}`);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        console.log(`[NET ERROR] ${response.status()} ${response.url()}`);
      }
    });
  });

  // Public pages - no login required
  test.describe("Public Pages", () => {
    const publicRoutes = [
      "/",
      "/triage",
      "/a2l-resources",
      "/features",
      "/pricing",
      "/about",
      "/blog",
      "/stories",
      "/podcasts",
      "/contact",
      "/documentation",
      "/help",
      "/privacy",
      "/terms",
      "/connect-provider",
      "/signin",
      "/signup",
    ];

    for (const route of publicRoutes) {
      test(`Public page loads: ${route}`, async ({ page }) => {
        await page.goto(route);
        await expect(page.locator("h1, title")).toContainText(
          /HVAC|Thermo|Sign|Triage/,
        );
        await expect(page.locator("body")).not.toHaveClass(/hidden|loading/);
      });
    }
  });

  // Admin validation
  test.describe("Admin Role Access", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/signin");
      await page.fill('input[type="email"]', "admin@admin.com");
      await page.fill('input[type="password"]', "ThermoAdmin$2026!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/dashboard/);
    });
    // Dynamic login below

    const adminRoutes = [
      "/dashboard",
      "/profile",
      "/settings/company",
      "/settings/team",
      "/history",
      "/dashboard/jobs",
      "/dashboard/dispatch",
      "/dashboard/triage",
      "/dashboard/fleet",
      "/dashboard/clients",
      "/tools/standard-cycle",
      "/tools/refrigerant-comparison",
    ];

    for (const route of adminRoutes) {
      test(`Admin can access: ${route}`, async ({ page }) => {
        await page.goto(route);
        await expect(
          page.locator("[data-page-content] , main, .page-container"),
        ).toBeVisible({ timeout: 10000 });
      });
    }

    // Verify client routes redirect for admin
    test("Admin redirected from client portal", async ({ page }) => {
      await page.goto("/portal");
      await expect(page).toHaveURL(/dashboard/);
    });
  });

  // Tech validation
  test.describe("Technician Role Access", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/signin");
      await page.fill('input[type="email"]', "tech@test.com");
      await page.fill('input[type="password"]', "Password123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/tech/);
    });
    // Dynamic login below

    const techRoutes = [
      "/tech",
      "/tech/jobs/any",
      "/tools/*",
      "/profile",
      "/troubleshooting",
    ];

    test("Tech can access job board", async ({ page }) => {
      await page.goto("/tech");
      await expect(page.locator("main, body > *:first-child")).toBeVisible();
    });

    test("Tech redirected from dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/tech/);
    });
  });

  // Client validation
  test.describe("Client Role Access", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/signin");
      await page.fill('input[type="email"]', "client@test.com");
      await page.fill('input[type="password"]', "Password123!");
      await page.click('button[type="submit"]');
      await expect(page).toHaveURL(/portal/);
    });
    // Dynamic login below

    test("Client can access portal", async ({ page }) => {
      await page.goto("/portal");
      await expect(page.locator("main, body > *:first-child")).toBeVisible();
    });

    test("Client redirected from dashboard", async ({ page }) => {
      await page.goto("/dashboard");
      await expect(page).toHaveURL(/portal/);
    });
  });
});
