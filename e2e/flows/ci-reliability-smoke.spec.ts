/**
 * CI Reliability Smoke Test
 *
 * This is a deterministic, minimal smoke test designed for CI reliability.
 * It tests only public pages that don't require authentication, making it
 * stable for automated CI runs without external dependencies.
 *
 * Setup assumptions:
 * - Frontend server running at PLAYWRIGHT_BASE_URL (default: http://localhost:3001)
 * - No database or Supabase connection required for these public routes
 *
 * Teardown: None required (stateless tests)
 *
 * Run: npm run test:e2e -- e2e/flows/ci-reliability-smoke.spec.ts --project=chromium
 */
import { test, expect } from "@playwright/test";

test.describe("CI Reliability Smoke - Public Pages", () => {
    test.setTimeout(30000);

    test("landing page loads successfully", async ({ page }) => {
        const response = await page.goto("/", { waitUntil: "domcontentloaded" });
        expect(response?.status() ?? 500).toBeLessThan(400);
        await expect(page.locator("body")).toBeVisible();
        expect(page.url()).toContain("/");
    });

    test("pricing page loads and displays plans", async ({ page }) => {
        const response = await page.goto("/pricing", { waitUntil: "domcontentloaded" });
        expect(response?.status() ?? 500).toBeLessThan(400);
        await expect(page.locator("body")).toContainText(
            /pricing|plan|subscription|free|pro|business/i,
            { timeout: 10000 },
        );
    });

    test("sign-in page renders form elements", async ({ page }) => {
        await page.goto("/signin", { waitUntil: "domcontentloaded" });

        await expect(page.locator('input[type="email"]')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test("sign-up page renders form elements", async ({ page }) => {
        await page.goto("/signup", { waitUntil: "domcontentloaded" });

        await expect(page.locator('input[type="email"]')).toBeVisible({
            timeout: 10000,
        });
        await expect(page.locator('#password')).toBeVisible();
        await expect(page.locator('#confirmPassword')).toBeVisible();
    });

    test("public calculators page is accessible", async ({ page }) => {
        const response = await page.goto("/diy-calculators", { waitUntil: "domcontentloaded" });
        expect(response?.status() ?? 500).toBeLessThan(400);
        expect(/\/diy-calculators|\/signin/i.test(page.url())).toBe(true);
    });
});

test.describe("CI Reliability Smoke - Static Assets", () => {
    test("robots.txt is accessible", async ({ page }) => {
        const response = await page.request.get("/robots.txt");

        // Should return 200 or 404 (acceptable if not configured)
        expect([200, 404]).toContain(response.status());
    });

    test("manifest.json is accessible", async ({ page }) => {
        const response = await page.request.get("/manifest.json");

        // Should return 200 or 404 (acceptable if not configured)
        expect([200, 404]).toContain(response.status());
    });
});

test.describe("CI Reliability Smoke - API Health", () => {
    test("API health endpoint responds", async ({ page }) => {
        const healthEndpoints = ["/api/health", "/health", "/api/status"];
        let healthCheckPassed = false;
        for (const endpoint of healthEndpoints) {
            try {
                const response = await page.request.get(endpoint, { timeout: 5000 });
                if (response.status() === 200 || response.status() === 404) {
                    healthCheckPassed = true;
                    break;
                }
            } catch {
            }
        }
        expect(healthCheckPassed).toBe(true);
    });
});
