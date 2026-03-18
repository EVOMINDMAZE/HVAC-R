import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';

dotenv.config();

async function run() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
  });
  const page = await context.newPage();
  
  // Login
  await page.goto('/signin');
  await page.fill('input#email', 'admin@admin.com');
  await page.fill('input#password', 'ThermoAdmin$2026!');
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/, { timeout: 15000 });
  console.log('Logged in');
  
  // Get session from localStorage
  const session = await page.evaluate(() => {
    const key = Object.keys(localStorage).find(k => k.includes('auth-token'));
    if (key) return localStorage.getItem(key);
    return null;
  });
  console.log('Session key exists:', !!session);
  
  // Evaluate the Supabase auth state
  const authState = await page.evaluate(() => {
    return window.__SUPABASE_AUTH_STATE__; // maybe not exposed
  });
  console.log('Auth state:', authState);
  
  // Check if user and session are available via useSupabaseAuth
  const supabaseAuth = await page.evaluate(() => {
    // @ts-ignore
    const { useSupabaseAuth } = window.__APP_CONTEXT__ || {};
    return useSupabaseAuth ? useSupabaseAuth() : null;
  });
  console.log('Supabase auth hook:', supabaseAuth ? 'found' : 'not found');
  
  // Navigate to team page
  await page.goto('/settings/team');
  await page.waitForTimeout(2000);
  
  // Check for any errors in console
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
  });
  
  // Listen for network requests
  page.on('request', request => {
    if (request.url().includes('/api/team')) {
      console.log('REQUEST to team API:', request.method(), request.url());
    }
  });
  page.on('response', response => {
    if (response.url().includes('/api/team')) {
      console.log('RESPONSE from team API:', response.status(), response.url());
    }
  });
  
  // Wait a bit more
  await page.waitForTimeout(5000);
  
  // Take screenshot
  await page.screenshot({ path: 'debug_team_fetch.png' });
  
  // Evaluate if team members are rendered
  const teamMembers = await page.evaluate(() => {
    const rows = document.querySelectorAll('table tbody tr');
    return rows.length;
  });
  console.log('Team member rows:', teamMembers);
  
  // Get page text
  const text = await page.locator('body').innerText();
  console.log('Body text (first 500 chars):', text.substring(0, 500));
  
  await browser.close();
}

run().catch(console.error);