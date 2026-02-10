import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";

const baseUrl = process.env.BASE_URL || "http://localhost:8081/";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");

function slugify(text) {
  return (
    text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "section"
  );
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });

  const executablePath =
    process.env.CHROME_PATH ||
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

  const browser = await chromium.launch({ executablePath, headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
  });
  const page = await context.newPage();

  const notes = [];
  const consoleErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);

  await page.screenshot({
    path: path.join(outDir, "01-hero-desktop.png"),
    fullPage: false,
  });

  const heroPrimary = page.getByRole("link", { name: /^Start Engineering Free$/i }).first();
  const heroSecondary = page.getByRole("link", { name: /^Book an Ops Demo$/i }).first();

  notes.push(`Hero primary CTA href: ${await heroPrimary.getAttribute("href")}`);
  notes.push(`Hero secondary CTA href: ${await heroSecondary.getAttribute("href")}`);

  const trustChips = page.locator("text=EPA 608 compliant logs");
  notes.push(`Compliance trust strip visible: ${(await trustChips.count()) > 0}`);

  const sections = page.locator("main > section");
  const sectionCount = await sections.count();
  notes.push(`Main section count: ${sectionCount}`);

  for (let i = 0; i < sectionCount; i++) {
    const section = sections.nth(i);
    await section.scrollIntoViewIfNeeded();
    await page.waitForTimeout(250);

    let heading = `section-${i + 1}`;
    const headingLoc = section.locator("h1, h2, h3").first();
    if ((await headingLoc.count()) > 0) {
      heading = (await headingLoc.innerText()).trim();
    }

    const label = `${String(i + 2).padStart(2, "0")}-${slugify(heading)}`;
    await section.screenshot({ path: path.join(outDir, `${label}.png`) });
  }

  const inventoryButton = page
    .getByRole("button", { name: /View Full Inventory|Show Condensed Inventory/i })
    .first();

  await inventoryButton.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);

  const beforeExpand = await inventoryButton.getAttribute("aria-expanded");
  notes.push(`Inventory toggle initial aria-expanded: ${beforeExpand}`);

  await inventoryButton.click();
  await page.waitForTimeout(350);

  const expandedButton = page
    .getByRole("button", { name: /Show Condensed Inventory/i })
    .first();

  const afterExpand = await expandedButton.getAttribute("aria-expanded");
  notes.push(`Inventory toggle after expand aria-expanded: ${afterExpand}`);

  await page.screenshot({
    path: path.join(outDir, "50-inventory-expanded.png"),
    fullPage: false,
  });

  await expandedButton.click();
  await page.waitForTimeout(250);
  notes.push("Inventory toggle collapse action: success");

  const pricingCta = page.getByRole("link", { name: /See Engineering Pricing/i }).first();
  const pricingHref = await pricingCta.getAttribute("href");
  notes.push(`Pricing CTA href: ${pricingHref}`);

  await pricingCta.click();
  await page.waitForURL(/\/pricing/);
  notes.push(`Pricing CTA navigation URL: ${page.url()}`);
  await page.screenshot({ path: path.join(outDir, "60-pricing-page.png"), fullPage: false });

  await page.goBack({ waitUntil: "networkidle" });
  await page.waitForTimeout(300);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.screenshot({ path: path.join(outDir, "70-hero-mobile.png"), fullPage: false });

  const mobilePrimaryVisible = await page
    .getByRole("link", { name: /^Start Engineering Free$/i })
    .first()
    .isVisible();
  const mobileSecondaryVisible = await page
    .getByRole("link", { name: /^Book an Ops Demo$/i })
    .first()
    .isVisible();

  notes.push(`Mobile hero primary CTA visible: ${mobilePrimaryVisible}`);
  notes.push(`Mobile hero secondary CTA visible: ${mobileSecondaryVisible}`);

  const footer = page.locator("footer").first();
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(250);
  await footer.screenshot({ path: path.join(outDir, "99-footer-mobile.png") });

  if (consoleErrors.length > 0) {
    notes.push(`Console errors captured: ${consoleErrors.length}`);
    for (const err of consoleErrors.slice(0, 10)) {
      notes.push(`Console error: ${err}`);
    }
  } else {
    notes.push("Console errors captured: 0");
  }

  await browser.close();

  console.log("UX_NOTES_START");
  for (const n of notes) {
    console.log(n);
  }
  console.log("UX_NOTES_END");
})();
