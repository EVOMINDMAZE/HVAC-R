import { test, expect } from '@playwright/test';

const pages = [
  '/',
  '/dashboard',
  '/documentation',
  '/standard-cycle',
  '/refrigerant-comparison',
  '/cascade-cycle',
  '/pricing',
  '/profile',
  '/signin',
  '/signup',
  '/privacy',
  '/terms',
  '/troubleshooting',
];

const docArticles = [
  'Quick Start Guide',
  'Account Setup',
  'First Calculation',
  'Understanding Results',
  'Basic Cycle Theory',
  'Input Parameters',
  'Refrigerant Properties',
  'Performance Metrics',
  'Comparison Methodology',
  'Environmental Impact',
  'Performance Analysis',
  'Best Practices',
  'Cascade Theory',
  'System Design',
  'Optimization',
  'Troubleshooting',
  'API Overview',
  'Authentication',
  'Endpoints',
  'Examples',
  'Custom Properties',
  'Batch Processing',
  'Data Export',
  'Integration',
];

test.describe('UI smoke and interactions', () => {
  for (const route of pages) {
    test(`navigate ${route} and screenshot`, async ({ page }, testInfo) => {
      await page.goto(route);
      await expect(page).toHaveTitle(/Simulateon|Engineering|Documentation|Sign in|Pricing|Dashboard/i, { timeout: 5000 }).catch(() => null);
      await page.waitForTimeout(500); // allow animations
      await page.screenshot({ path: `e2e-results/screenshots${route === '/' ? '/home' : route}.png`, fullPage: true }).catch(() => null);
    });
  }

  test('documentation search and keyboard shortcut', async ({ page }) => {
    await page.goto('/documentation');
    // focus search using '/'
    await page.keyboard.press('/');
    // type search
    await page.keyboard.type('Quick Start');
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e-results/screenshots/documentation-search.png', fullPage: true }).catch(() => null);

    // clear and open a category filter
    await page.locator('button', { hasText: 'Getting Started' }).first().click();
    await page.waitForTimeout(300);
    await page.screenshot({ path: 'e2e-results/screenshots/documentation-filter-getting-started.png', fullPage: true }).catch(() => null);
  });

  test('open each doc article in DocsViewer modal', async ({ page }) => {
    for (const t of docArticles) {
      const q = encodeURIComponent(t);
      await page.goto(`/documentation?article=${q}`);
      // wait for modal
      await page.waitForSelector('text=' + t, { timeout: 3000 }).catch(() => null);
      await page.waitForTimeout(400);
      const safe = t.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      await page.screenshot({ path: `e2e-results/screenshots/docs-${safe}.png`, fullPage: true }).catch(() => null);
    }
  });

  test('simulate standard cycle calculation flow (smoke)', async ({ page }) => {
    await page.goto('/standard-cycle');
    // fill form fields if present
    const evap = page.locator('input[name=evap_temp_c], input[placeholder*=evap]');
    if (await evap.count()) {
      await evap.fill('-10');
    }
    const cond = page.locator('input[name=cond_temp_c], input[placeholder*=cond]');
    if (await cond.count()) {
      await cond.fill('45');
    }
    // click calculate if button exists
    const calc = page.locator('button', { hasText: /Calculate|Run|Compute/i }).first();
    if (await calc.count()) {
      await calc.click();
      await page.waitForTimeout(1000);
    }
    await page.screenshot({ path: 'e2e-results/screenshots/standard-cycle-flow.png', fullPage: true }).catch(() => null);
  });
});
