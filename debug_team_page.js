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
  
  // Navigate to team page directly (should be logged in via storageState)
  await page.goto('/settings/team');
  
  // Wait for any network activity
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('/api/') || url.includes('/rest/v1/')) {
      console.log(`[${response.status()}] ${response.request().method()} ${url}`);
      if (response.status() >= 400) {
        try {
          const body = await response.text();
          console.log('Error body:', body.substring(0, 500));
        } catch (e) {}
      }
    }
  });
  
  // Wait for either Team Management text or error message
  try {
    await page.waitForSelector('text=Team Management', { timeout: 10000 });
    console.log('Team Management header found');
  } catch (e) {
    console.log('Team Management not found, checking for error...');
    const errorEl = await page.locator('text="Unable to load team members"').first();
    if (await errorEl.isVisible()) {
      console.log('ERROR: Unable to load team members error displayed');
    } else {
      console.log('No error found, taking screenshot');
      await page.screenshot({ path: 'debug_team_page.png' });
    }
  }
  
  // Check for table
  const table = await page.locator('table');
  if (await table.isVisible()) {
    console.log('Table visible');
    const rows = await page.locator('table tbody tr').count();
    console.log(`Found ${rows} team members`);
  } else {
    console.log('Table not visible');
  }
  
  // Wait for user to close browser
  await page.waitForTimeout(10000);
  await browser.close();
}

run().catch(console.error);