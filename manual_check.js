import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
    storageState: 'playwright/.auth/admin.json'
  });
  const page = await context.newPage();
  
  // Listen to network responses
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/team') || url.includes('/rest/v1/') || url.includes('/auth/v1/')) {
      console.log(`[${response.status()}] ${response.request().method()} ${url}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log('Error body:', body.substring(0, 500));
        } catch (e) {}
      }
    }
  });
  
  // Go to dashboard to check if logged in
  await page.goto('/dashboard');
  await page.waitForTimeout(2000);
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);
  
  // Check for user email in page
  const userEmail = await page.locator('text=admin@admin.com').first();
  if (await userEmail.isVisible()) {
    console.log('User email displayed, logged in');
  } else {
    console.log('User email not found, may need login');
    // Let's login manually
    await page.goto('/signin');
    await page.waitForSelector('input#email');
    await page.fill('input#email', 'admin@admin.com');
    await page.fill('input#password', 'ThermoAdmin$2026!');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*dashboard|select-company/, { timeout: 15000 });
    console.log('Logged in, current URL:', page.url());
  }
  
  // Now navigate to team page
  console.log('Navigating to /settings/team');
  await page.goto('/settings/team');
  
  // Wait for any content
  await page.waitForTimeout(3000);
  
  // Take screenshot
  await page.screenshot({ path: 'manual_team_page.png' });
  console.log('Screenshot saved');
  
  // Get page content
  const content = await page.content();
  // Write to file for inspection
  const fs = await import('fs');
  fs.writeFileSync('team_page.html', content);
  console.log('HTML saved to team_page.html');
  
  // Check for specific elements
  const teamHeader = await page.locator('text=Team Management').first();
  if (await teamHeader.isVisible()) {
    console.log('Team Management header found');
  } else {
    console.log('Team Management header NOT found');
  }
  
  const errorMsg = await page.locator('text="Unable to load team members"').first();
  if (await errorMsg.isVisible()) {
    console.log('ERROR: Unable to load team members error displayed');
  } else {
    console.log('No error message displayed');
  }
  
  const table = await page.locator('table').first();
  if (await table.isVisible()) {
    console.log('Table visible');
    const rows = await page.locator('table tbody tr').count();
    console.log(`Table rows: ${rows}`);
  } else {
    console.log('Table NOT visible');
  }
  
  // Wait for user to press Enter in terminal before closing
  console.log('Press Enter in terminal to close browser...');
  const readline = await import('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  await new Promise(resolve => rl.question('', resolve));
  rl.close();
  
  await browser.close();
}

run().catch(console.error);