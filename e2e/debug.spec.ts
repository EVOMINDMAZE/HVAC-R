import { test, expect } from '@playwright/test';

test('debug landing page', async ({ page }) => {
  // Capture all console logs
  page.on('console', msg => {
    console.log(`[${msg.type()}] ${msg.text()}`);
  });
  page.on('pageerror', error => {
    console.error(`[PAGE ERROR] ${error.message}`);
  });

  await page.goto('http://localhost:8080');
  
  // Wait for React to mount
  await page.waitForTimeout(2000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug-landing.png', fullPage: true });
  
  // Get page content
  const html = await page.content();
  console.log('HTML length:', html.length);
  
  // Check for hero text
  const hasHero = await page.locator('h1').count();
  console.log('Has h1:', hasHero);
  if (hasHero) {
    const heroText = await page.locator('h1').textContent();
    console.log('Hero text:', heroText);
  }
  
  // List all script errors
  const scriptErrors = await page.evaluate(() => {
    const errors = [];
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src && script.onerror) {
        // can't capture cross-origin errors easily
      }
    });
    return errors;
  });
  
  console.log('Test complete');
});