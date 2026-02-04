import { Page, test as baseTest, expect } from "@playwright/test";

// Test helper for Stripe checkout flows
export const TEST_CARDS = {
  VISA_SUCCESS: {
    number: "4242424242424242",
    expiry: "04/25",
    cvc: "123",
    name: "Test User",
  },
  VISA_DECLINED: {
    number: "4000000000000002",
    expiry: "04/25",
    cvc: "123",
    name: "Test User",
  },
  VISA_INSUFFICIENT: {
    number: "4000000000009995",
    expiry: "04/25",
    cvc: "123",
    name: "Test User",
  },
};

// Helper functions for Stripe testing
export async function fillStripeForm(
  page: Page,
  card: typeof TEST_CARDS.VISA_SUCCESS = TEST_CARDS.VISA_SUCCESS,
) {
  // Wait for Stripe iframe to load
  await page.waitForSelector('iframe[name^="__privateStripeFrame"]', {
    timeout: 10000,
  });

  // Get Stripe iframe context
  const stripeFrame = page.frameLocator('iframe[name^="__privateStripeFrame"]');

  // Fill card details
  await stripeFrame.locator('input[name="cardnumber"]').fill(card.number);
  await stripeFrame.locator('input[name="exp-date"]').fill(card.expiry);
  await stripeFrame.locator('input[name="cvc"]').fill(card.cvc);
  await stripeFrame.locator('input[name="name"]').fill(card.name);
}

export async function completeCheckout(
  page: Page,
  card: typeof TEST_CARDS.VISA_SUCCESS = TEST_CARDS.VISA_SUCCESS,
) {
  // Navigate to pricing page
  await page.goto("/pricing");

  // Click "Start Free Trial" button
  await page.locator('[data-testid="start-free-trial"]').click();

  // Wait for Stripe checkout form
  await page.waitForSelector('[data-testid="stripe-checkout-form"]');

  // Fill Stripe form
  await fillStripeForm(page, card);

  // Click submit button
  await page.locator('[data-testid="stripe-submit-button"]').click();

  // Wait for success or error
  await expect(
    page.locator(
      '[data-testid="checkout-success"], [data-testid="checkout-error"]',
    ),
  ).toBeVisible();
}

// Helper function for setting up Stripe test mode
export async function setupStripeTestMode(page: Page) {
  // Set Stripe test mode flag
  await page.context().addCookies([
    {
      name: "stripe_test_mode",
      value: "true",
      domain: "localhost",
      path: "/",
    },
  ]);
}

// Helper to verify payment status
export async function verifyPaymentStatus(
  page: Page,
  status: "success" | "declined" | "insufficient",
) {
  const statusElement = page.locator('[data-testid="payment-status"]');
  await expect(statusElement).toHaveAttribute("data-status", status);
}

// Helper to handle 3D Secure flow
export async function handle3DSecure(page: Page) {
  // Look for 3D Secure popup
  const threeDSFrame = page.frameLocator('iframe[name*="3ds"]');
  if ((await threeDSFrame.locator("iframe").count()) > 0) {
    await threeDSFrame.locator('button[type="submit"]').click();
  }
}

export { expect };
