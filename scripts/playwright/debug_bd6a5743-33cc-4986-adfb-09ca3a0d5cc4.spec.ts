
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('Debug_2026-02-06', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:3001');

    // Navigate to URL
    await page.goto('http://localhost:3001/join-company');

    // Take screenshot
    await page.screenshot({ path: 'join-page.png' });

    // Fill input field
    await page.fill('[aria-label="Enter 8-character invite code"]', 'TEST8888');

    // Fill input field
    await page.fill('#email', 'test@example.com');

    // Fill input field
    await page.fill('#password', 'password');

    // Click element
    await page.click('button[type="submit"]');

    // Take screenshot
    await page.screenshot({ path: 'current-page.png' });

    // Fill input field
    await page.fill('#email', 'tech@test.com');

    // Fill input field
    await page.fill('#password', 'Password123!');

    // Click element
    await page.click('button[type="submit"]');

    // Click element
    await page.click('text=Join Existing Team');

    // Fill input field
    await page.fill('input[type="text"]', 'TEST8888');

    // Fill input field
    await page.fill('input', 'TEST8888');

    // Click element
    await page.click('text=INITIALIZE CONNECTION');

    // Click element
    await page.click('div.flex.gap-1.justify-center > div:first-child');

    // Click element
    await page.click('input[data-input-otp="true"]');

    // Click element
    await page.click('text=INITIALIZE CONNECTION');

    // Click element
    await page.click('text=tech@test.com');

    // Click element
    await page.click('text=Sign Out');

    // Click element
    await page.click('text=Create Organization');

    // Click element
    await page.click('text=Create New Workspace');

    // Navigate to URL
    await page.goto('http://localhost:3001/create-company');
});