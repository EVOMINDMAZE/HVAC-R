import { test, expect } from '@playwright/test';
import { loginAs } from './helpers/auth';

test('debug create company loading', async ({ page }) => {
  // Listen for console logs
  page.on('console', msg => {
    console.log(`[Browser] ${msg.type()}: ${msg.text()}`);
  });

  // Login as admin (has no companies)
  await loginAs('admin', page);
  
  // Navigate directly to create-company
  await page.goto('/create-company');
  
  // Wait for either the loading spinner or the page content
  // First, check if there's a loading spinner with text "Verifying Community Status..."
  const loadingSelector = 'text=Verifying Community Status...';
  const accessRestrictedSelector = 'text=Access Restricted';
  const createFormSelector = 'text=Create New Organization';
  
  // Wait for any of these to appear
  await Promise.race([
    page.waitForSelector(loadingSelector, { timeout: 5000 }).catch(() => null),
    page.waitForSelector(accessRestrictedSelector, { timeout: 5000 }).catch(() => null),
    page.waitForSelector(createFormSelector, { timeout: 5000 }).catch(() => null),
  ]);
  
  // Take screenshot for debugging
  await page.screenshot({ path: 'debug-create-company.png', fullPage: true });
  
  // Determine what's shown
  const isLoading = await page.isVisible(loadingSelector);
  const isAccessRestricted = await page.isVisible(accessRestrictedSelector);
  const isCreateForm = await page.isVisible(createFormSelector);
  
  console.log('State:', { isLoading, isAccessRestricted, isCreateForm });
  
  // If loading persists after 5 seconds, something is wrong
  if (isLoading) {
    console.error('Page stuck on loading spinner');
    // Wait a bit more and see if it changes
    await page.waitForTimeout(2000);
    const stillLoading = await page.isVisible(loadingSelector);
    if (stillLoading) {
      throw new Error('Create company page stuck on loading');
    }
  }
});