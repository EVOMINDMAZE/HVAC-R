import { test, expect } from '@playwright/test';

test('Check landing page components', async ({ page }) => {
  // Capture errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.error(`[CONSOLE ERROR] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  await page.goto('http://localhost:8080');
  await page.waitForLoadState('networkidle');
  
  // Wait for React to mount
  await page.waitForTimeout(1000);
  
  // Check hero section
  await expect(page.locator('h1')).toContainText('Transform Your HVAC');
  
  // Scroll down 500px to trigger in-view detection
  await page.evaluate(() => window.scrollTo(0, 500));
  await page.waitForTimeout(500);
  
  // Check ValuePropositionGrid
  await expect(page.locator('text=Time Savings')).toBeVisible();
  await expect(page.locator('text=Unmatched Accuracy')).toBeVisible();
  await expect(page.locator('text=Professional Reports')).toBeVisible();
  
  // Scroll more
  await page.evaluate(() => window.scrollTo(0, 1000));
  await page.waitForTimeout(500);
  
  // Check HowItWorks
  await expect(page.locator('text=From input to insight in')).toBeVisible();
  await expect(page.locator('text=Step 1')).toBeVisible();
  
  // Check PricingSection
  await expect(page.locator('text=Pricing')).toBeVisible();
  await expect(page.locator('text=Free')).toBeVisible();
  await expect(page.locator('text=Pro')).toBeVisible();
  await expect(page.locator('text=Enterprise')).toBeVisible();
  
  // Check TestimonialsSection (placeholder)
  await expect(page.locator('text=What Our Users Say')).toBeVisible();
  
  console.log('All components found');
});