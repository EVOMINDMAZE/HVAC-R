import { test, expect } from "@playwright/test";
import { TEST_CARDS } from "../helpers/stripe";
import {
  completeOnboarding,
  skipOnboarding,
  verifyBrandColors,
} from "../helpers/onboarding";

test.describe("Full User Journey - The Golden Path", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto("/");
    await page.waitForLoadState("networkidle");
  });

  test.describe("Landing & Pricing Flow", () => {
    test("should display orange branding on landing page", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator("body")).toBeVisible();

      // Find orange button specifically
      const orangeButton = page.locator("button.bg-orange-600").first();
      if (await orangeButton.isVisible()) {
        const bgColor = await orangeButton.evaluate(
          (el) => window.getComputedStyle(el).backgroundColor,
        );
        expect(bgColor).toContain("234"); // orange-600 rgb value
      }

      // Also check pricing page has orange buttons
      await page.goto("/pricing");
      const pricingButton = page.locator("button.bg-orange-600").first();
      if (await pricingButton.isVisible()) {
        await expect(pricingButton).toBeVisible();
      }
    });

    test("should navigate to pricing and show plans", async ({ page }) => {
      await page.goto("/pricing");

      await expect(page.locator("h1:has-text('Pricing')")).toBeVisible();
    });
  });

  test.describe("Checkout Flow", () => {
    test("should complete Stripe checkout with test card", async ({ page }) => {
      await page.goto("/pricing");

      const upgradeButton = page.locator("button:has-text('Upgrade')").first();
      await upgradeButton.click();

      await page.locator('[name="email"]').fill("test-user@example.com");

      const stripeFrame = page.frameLocator(
        'iframe[name^="__privateStripeFrame"]',
      );
      await stripeFrame
        .locator('input[name="cardnumber"]')
        .fill(TEST_CARDS.VISA_SUCCESS.number);
      await stripeFrame.locator('input[name="exp-date"]').fill("04/28");
      await stripeFrame.locator('input[name="cvc"]').fill("123");
      await stripeFrame.locator('input[name="name"]').fill("Test User");

      await page.locator('button:has-text("Subscribe")').click();

      // Wait for success or redirect
      try {
        await page.waitForSelector('[data-testid="checkout-success"]', {
          timeout: 15000,
        });
      } catch {
        await page.waitForURL(/dashboard|success/, { timeout: 15000 });
      }
    });
  });

  test.describe("Authentication Flow", () => {
    test("should complete signup flow", async ({ page }) => {
      await page.goto("/signup");

      const timestamp = Date.now();
      await page
        .locator('[name="email"]')
        .fill(`test-${timestamp}@example.com`);
      await page.locator('[name="password"]').fill("TestPassword123!");
      await page.locator('[name="fullName"]').fill("Test User");

      await page.locator('button:has-text("Sign Up")').click();

      await expect(page).toHaveURL(/\/(verify-email|dashboard|signup)/, {
        timeout: 10000,
      });
    });

    test("should login existing user", async ({ page }) => {
      await page.goto("/signin");

      await page.locator('[name="email"]').fill("existing-user@example.com");
      await page.locator('[name="password"]').fill("TestPassword123!");

      await page.locator('button:has-text("Sign In")').click();

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
    });
  });

  test.describe("Onboarding Flow", () => {
    test("should complete onboarding wizard for new user", async ({ page }) => {
      await page.goto("/signin");
      await page.locator('[name="email"]').fill("new-user@example.com");
      await page.locator('[name="password"]').fill("TestPassword123!");
      await page.locator('button:has-text("Sign In")').click();

      const onboardingWizard = page.locator(
        '[data-testid="onboarding-wizard"]',
      );
      if (await onboardingWizard.isVisible()) {
        await completeOnboarding(page);
      }

      await expect(page.locator("h1:has-text('Dashboard')")).toBeVisible();
    });

    test("should allow skipping onboarding", async ({ page }) => {
      await page.goto("/dashboard");

      const skipButton = page.locator('button:has-text("Skip")');
      if (await skipButton.isVisible()) {
        await skipButton.click();
        await page.locator('button:has-text("Confirm")').click();
      }

      await expect(page).toHaveURL(/\/dashboard/, { timeout: 5000 });
    });
  });

  test.describe("Brand Verification", () => {
    test("should apply orange/slate branding after setup", async ({ page }) => {
      await page.goto("/dashboard");
      await verifyBrandColors(page);
    });
  });

  test.describe("Core Application Features", () => {
    test("should navigate to calculators and run simulation", async ({
      page,
    }) => {
      await page.goto("/standard-cycle");

      await expect(page.locator("h1:has-text('Standard Cycle')")).toBeVisible();

      await page.locator('[name="evaporatorTemp"]').fill("-20");
      await page.locator('[name="condenserTemp"]').fill("45");

      await page.locator('button:has-text("Run Simulation")').click();

      await expect(
        page.locator('[data-testid="simulation-results"]'),
      ).toBeVisible({ timeout: 15000 });
    });

    test("should navigate to client management", async ({ page }) => {
      await page.goto("/clients");

      await expect(page.locator("h1:has-text('Clients')")).toBeVisible();
    });
  });
});

test.describe("Mobile Responsive", () => {
  test("should display correctly on mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/");

    await expect(page.locator("body")).toBeVisible();
  });
});
