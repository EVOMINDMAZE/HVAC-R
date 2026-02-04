import { Page, expect } from "@playwright/test";

// Helper functions for onboarding and brand setup
export async function completeOnboarding(page: Page) {
  // Start onboarding if this is a new user
  await page.goto("/dashboard");

  // Check if onboarding is shown
  const onboardingWizard = page.locator('[data-testid="onboarding-wizard"]');
  if (await onboardingWizard.isVisible()) {
    // Step 1: Company Information
    await onboardingWizard
      .locator('[data-testid="company-name-input"]')
      .fill("Test HVAC Company");
    await onboardingWizard
      .locator('[data-testid="company-address-input"]')
      .fill("123 Test Street, Test City, TS 12345");
    await onboardingWizard
      .locator('[data-testid="company-phone-input"]')
      .fill("+1-555-0123");
    await onboardingWizard.locator('[data-testid="next-button"]').click();

    // Step 2: Brand Customization
    await onboardingWizard.locator('[data-testid="brand-color-input"]').click();
    await onboardingWizard.locator('[data-testid="color-orange"]').click();
    await onboardingWizard
      .locator('[data-testid="brand-logo-upload"]')
      .setInputFiles("test-assets/logo.png");
    await onboardingWizard.locator('[data-testid="next-button"]').click();

    // Step 3: Service Areas
    await onboardingWizard
      .locator('[data-testid="service-area-input"]')
      .fill("Test City, State");
    await onboardingWizard.locator('[data-testid="add-service-area"]').click();
    await onboardingWizard.locator('[data-testid="next-button"]').click();

    // Step 4: Complete
    await onboardingWizard
      .locator('[data-testid="complete-onboarding"]')
      .click();

    // Wait for dashboard to load
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  }
}

export async function setupTestBrand(page: Page) {
  // Navigate to company settings
  await page.goto("/company-settings");

  // Update brand settings
  await page.locator('[data-testid="brand-settings-tab"]').click();

  // Change brand colors to test configuration
  await page.locator('[data-testid="primary-color-input"]').click();
  await page.locator('[data-testid="color-orange-600"]').click();

  await page.locator('[data-testid="secondary-color-input"]').click();
  await page.locator('[data-testid="color-slate-600"]').click();

  // Upload test logo if file input exists
  const logoUpload = page.locator('[data-testid="logo-upload"]');
  if (await logoUpload.isVisible()) {
    await logoUpload.setInputFiles("test-assets/company-logo.png");
  }

  // Save settings
  await page.locator('[data-testid="save-brand-settings"]').click();

  // Wait for success message
  await expect(
    page.locator('[data-testid="brand-settings-success"]'),
  ).toBeVisible();
}

export async function skipOnboarding(page: Page) {
  const onboardingWizard = page.locator('[data-testid="onboarding-wizard"]');
  const skipButton = onboardingWizard.locator(
    '[data-testid="skip-onboarding"]',
  );

  if (await skipButton.isVisible()) {
    await skipButton.click();
    await expect(page.locator('[data-testid="confirm-skip"]')).toBeVisible();
    await page.locator('[data-testid="confirm-skip"]').click();
  }
}

export async function createTestUser(page: Page) {
  // Navigate to signup
  await page.goto("/signup");

  // Fill signup form
  await page
    .locator('[data-testid="email-input"]')
    .fill("test-user@example.com");
  await page.locator('[data-testid="password-input"]').fill("TestPassword123!");
  await page
    .locator('[data-testid="confirm-password-input"]')
    .fill("TestPassword123!");
  await page.locator('[data-testid="full-name-input"]').fill("Test User");

  // Submit form
  await page.locator('[data-testid="signup-button"]').click();

  // Wait for verification email page or redirect to dashboard
  await expect(
    page.locator(
      '[data-testid="verification-prompt"], [data-testid="dashboard-header"]',
    ),
  ).toBeVisible();
}

export async function loginUser(page: Page) {
  // Navigate to login
  await page.goto("/signin");

  // Fill login form
  await page
    .locator('[data-testid="email-input"]')
    .fill("test-user@example.com");
  await page.locator('[data-testid="password-input"]').fill("TestPassword123!");

  // Submit form
  await page.locator('[data-testid="signin-button"]').click();

  // Wait for dashboard to load
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

export async function verifyBrandColors(page: Page) {
  // Check if orange/slate brand colors are applied
  const primaryButton = page.locator('[data-testid="primary-button"]');
  if (await primaryButton.isVisible()) {
    await expect(primaryButton).toHaveCSS(
      "background-color",
      /rgb\(254, 120, 0\)/,
    ); // orange-600
  }

  const secondaryElement = page.locator('[data-testid="secondary-element"]');
  if (await secondaryElement.isVisible()) {
    await expect(secondaryElement).toHaveCSS("color", /rgb\(71, 85, 105\)/); // slate-600
  }
}

export { expect };
