import { test, expect } from '@playwright/test';

test.describe('Jobs Page Buttons', () => {
  test('should load Jobs page and verify buttons are clickable', async ({ page }) => {
    // Navigate to Jobs page
    await page.goto('http://localhost:8081/dashboard/jobs');
    
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    // Collect console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Wait a bit for any async errors
    await page.waitForTimeout(2000);
    
    // Verify page loaded - check for h1 element
    const h1Element = page.locator('h1').first();
    await expect(h1Element).toBeVisible();
    
    // Check for "New Job" button
    const newJobButton = page.locator('button:has-text("New Job")');
    await expect(newJobButton).toBeVisible();
    
    // Click "New Job" button
    await newJobButton.click();
    
    // Verify dialog opened
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Check for form fields
    await expect(dialog.locator('input#client-name')).toBeVisible();
    await expect(dialog.locator('input#job-name')).toBeVisible();
    
    // Close dialog
    await dialog.locator('button:has-text("Cancel")').click();
    await page.waitForTimeout(500);
    
    // Verify dialog closed
    await expect(dialog).not.toBeVisible();
    
    // Check for console errors (filter out common non-critical warnings)
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('Warning:') && 
      !err.includes('DeprecationWarning')
    );
    
    expect(criticalErrors.length).toBe(0);
  });
  
  test('should have working FileText icon button on job cards', async ({ page }) => {
    // This test requires authenticated user with existing jobs
    await page.goto('http://localhost:8081/dashboard/jobs');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
    
    // The FileText button should be present (may need hover to see)
    const fileTextButton = page.locator('svg.lucide-file-text').first();
    await expect(fileTextButton).toBeVisible();
  });
});
