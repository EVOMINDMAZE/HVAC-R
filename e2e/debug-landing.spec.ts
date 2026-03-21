import { test, expect } from '@playwright/test';

test('Landing page loads without errors', async ({ page }) => {
  // Capture console errors
  const consoleErrors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  // Capture page errors
  const pageErrors: string[] = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
  });

  await page.goto('http://localhost:3001');
  
  // Wait for page to settle
  await page.waitForLoadState('networkidle');
  
  // Check for hero text
  await expect(page.locator('h1')).toContainText('Engineering Operations');
  
  // Take light mode screenshot
  await page.emulateMedia({ colorScheme: 'light' });
  await page.screenshot({ path: 'test-results/landing-light.png', fullPage: true });
  
  // Take dark mode screenshot
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.screenshot({ path: 'test-results/landing-dark.png', fullPage: true });

  // Log any errors
  if (consoleErrors.length > 0) {
    console.error('Console errors:', consoleErrors);
  }
  if (pageErrors.length > 0) {
    console.error('Page errors:', pageErrors);
  }
  
  // Assert no errors
  expect(consoleErrors).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
});