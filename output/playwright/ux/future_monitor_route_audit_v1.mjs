import fs from "fs/promises";
import path from "path";
import { launchChromium } from "./_chromium.mjs";

const baseUrl = process.env.BASE_URL || "http://localhost:8090";
const outDir = process.env.OUT_DIR || path.resolve("output/playwright/ux");
const headed = ["1", "true", "yes"].includes(
  String(process.env.HEADED || "").toLowerCase(),
);

function normalizeTheme(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "light") return "light";
  if (normalized === "dark") return "dark";
  if (normalized === "system") return "system";
  return null;
}

function resolveThemeOverride() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--theme") {
      const value = args[i + 1];
      const normalized = normalizeTheme(value);
      if (normalized) return normalized;
      continue;
    }

    if (arg.startsWith("--theme=")) {
      const normalized = normalizeTheme(arg.split("=")[1]);
      if (normalized) return normalized;
    }
  }

  return normalizeTheme(process.env.MONITOR_THEME);
}

function normalizeSkin(value) {
  if (value == null) return null;
  const normalized = String(value).trim().toLowerCase();
  if (!normalized) return null;
  if (normalized === "classic") return "classic";
  if (normalized === "hud") return "hud";
  return null;
}

function resolveSkinOverride() {
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--skin") {
      const value = args[i + 1];
      const normalized = normalizeSkin(value);
      if (normalized) return normalized;
      continue;
    }

    if (arg.startsWith("--skin=")) {
      const normalized = normalizeSkin(arg.split("=")[1]);
      if (normalized) return normalized;
    }
  }

  return normalizeSkin(process.env.MONITOR_SKIN);
}

const monitorSkin = resolveSkinOverride() || "classic";
const monitorTheme = resolveThemeOverride();

const viewports = [
  { name: "desktop", width: 1280, height: 800 },
  { name: "mobile", width: 390, height: 844 },
];

function withQuery(route, query) {
  const separator = route.includes("?") ? "&" : "?";
  return `${route}${separator}${query}`;
}

function slugify(value) {
  return value
    .replace(/^\/+/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function makeUrl(route, bypass = false, monitorEnabled = true, skin = monitorSkin) {
  const parts = [];
  if (bypass) parts.push("bypassAuth=1");
  parts.push(`uiFuture=${monitorEnabled ? "1" : "0"}`);
  if (skin) parts.push(`uiFutureSkin=${skin}`);
  return withQuery(route, parts.join("&"));
}

const monitoredRouteMatrix = [
  {
    group: "public",
    routes: [
      "/",
      "/triage",
      "/a2l-resources",
      "/features",
      "/pricing",
      "/about",
      "/blog",
      "/blog/monitor-preview",
      "/stories",
      "/podcasts",
      "/contact",
      "/documentation",
      "/help",
      "/help-center",
      "/privacy",
      "/terms",
      "/connect-provider",
      "/callback/demo-provider",
    ],
    bypass: false,
  },
  {
    group: "auth",
    routes: [
      { path: "/signin", bypass: false },
      { path: "/signup", bypass: false },
      { path: "/select-company", bypass: true },
      { path: "/join-company", bypass: true },
      { path: "/invite/monitor-demo", bypass: true },
      { path: "/create-company", bypass: true },
      { path: "/invite-team", bypass: true },
    ],
    bypass: false,
  },
  {
    group: "operations",
    routes: [
      "/dashboard",
      "/dashboard/dispatch",
      "/dashboard/triage",
      "/dashboard/fleet",
      "/dashboard/jobs",
      "/dashboard/jobs/demo",
      "/dashboard/projects",
      "/dashboard/clients",
      "/dashboard/clients/demo",
      "/portal",
      "/track-job/demo",
      "/tech",
      "/tech/jobs/demo",
      "/history",
      "/profile",
      "/settings/company",
      "/settings/team",
      "/career",
    ],
    bypass: true,
  },
  {
    group: "tools",
    routes: [
      "/advanced-reporting",
      "/troubleshooting",
      "/diy-calculators",
      "/estimate-builder",
      "/tools/standard-cycle",
      "/tools/refrigerant-comparison",
      "/tools/cascade-cycle",
      "/tools/refrigerant-report",
      "/tools/refrigerant-inventory",
      "/tools/leak-rate-calculator",
      "/tools/warranty-scanner",
      "/tools/iaq-wizard",
      "/ai/pattern-insights",
    ],
    bypass: true,
  },
  {
    group: "debug",
    routes: ["/stripe-debug", "/agent-sandbox"],
    bypass: false,
  },
  {
    group: "fallback",
    routes: ["/__monitor_not_found_test__"],
    bypass: false,
  },
];

const controlChecks = [
  { route: "/dashboard", bypass: true, expectVisible: false, skin: monitorSkin },
  { route: "/dashboard", bypass: true, expectVisible: true, skin: "classic" },
  { route: "/dashboard", bypass: true, expectVisible: true, skin: "hud" },
];

async function captureRoute(page, route, bypass, expectVisible, skin = monitorSkin, viewport) {
  const url = `${baseUrl}${makeUrl(route, bypass, expectVisible, skin)}`;
  let passed = true;
  let reason = "ok";
  let data = null;
  let screenshotPath = null;

  try {
    if (viewport) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
    }

    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(600);

    data = await page.evaluate(() => {
      const root = document.documentElement;
      const body = document.body;
      const monitorShell = document.querySelector("[data-monitor-shell]");
      const monitorDock = document.querySelector("[data-monitor-dock-layer]");
      const header = document.querySelector("header");
      const main = document.querySelector("main");
      const appShell = document.querySelector(".app-shell");
      const children = appShell ? Array.from(appShell.children) : [];
      const dockIndex = monitorDock && appShell ? children.indexOf(monitorDock) : -1;
      const headerIndex = header && appShell ? children.indexOf(header) : -1;
      const sidebarNavIndex = appShell ? children.findIndex((el) => el.tagName === "NAV") : -1;
      const mainIndex = main && appShell ? children.indexOf(main) : -1;
      const dockAfterHeader =
        headerIndex !== -1 && dockIndex !== -1 ? dockIndex > headerIndex : null;
      const dockAfterSidebar =
        sidebarNavIndex === -1 ? true : dockIndex !== -1 ? dockIndex > sidebarNavIndex : null;
      const dockBeforeMain =
        mainIndex !== -1 && dockIndex !== -1 ? dockIndex < mainIndex : null;
      const dockRect = monitorDock ? monitorDock.getBoundingClientRect() : null;
      const headerRect = header ? header.getBoundingClientRect() : null;
      const sidebarNavRect = sidebarNavIndex !== -1 ? children[sidebarNavIndex]?.getBoundingClientRect?.() : null;
      const monitorHost =
        monitorShell?.closest?.("[data-monitor-skin]") ||
        document.querySelector(".monitor-dock-layer[data-monitor-skin]") ||
        document.querySelector(".monitor-route-layer[data-monitor-skin]") ||
        document.querySelector("[data-monitor-skin]");
      const monitorTitle =
        document.querySelector("[data-testid='monitor-shell'] h2")?.textContent?.trim() || null;
      return {
        finalUrl: window.location.href,
        hasMonitorShell: Boolean(monitorShell),
        hasMonitorDock: Boolean(monitorDock),
        hasMain: Boolean(document.querySelector("main")),
        textLength: (body?.innerText || "").trim().length,
        hasHorizontalOverflow: root.scrollWidth > window.innerWidth,
        monitorSkin: monitorHost?.getAttribute?.("data-monitor-skin") || null,
        monitorShellSkin: monitorShell?.getAttribute?.("data-skin") || null,
        monitorCompact: monitorShell?.getAttribute?.("data-compact") || null,
        monitorTitle,
        dockAfterHeader,
        dockAfterSidebar,
        dockBeforeMain,
        dockBelowHeader: dockRect && headerRect ? dockRect.top >= headerRect.bottom - 1 : null,
        dockBelowSidebar: dockRect && sidebarNavRect ? dockRect.top >= sidebarNavRect.bottom - 1 : null,
      };
    });

    if (expectVisible && !data.hasMonitorShell) {
      passed = false;
      reason = "monitor_shell_missing";
    } else if (expectVisible && !data.hasMonitorDock) {
      passed = false;
      reason = "monitor_dock_missing";
    } else if (!expectVisible && data.hasMonitorShell) {
      passed = false;
      reason = "monitor_shell_present_when_disabled";
    } else if (
      expectVisible &&
      skin &&
      data.monitorShellSkin &&
      data.monitorShellSkin !== skin
    ) {
      passed = false;
      reason = "monitor_shell_skin_mismatch";
    } else if (expectVisible && skin && data.monitorSkin && data.monitorSkin !== skin) {
      passed = false;
      reason = "monitor_skin_mismatch";
    } else if (
      expectVisible &&
      (data.dockAfterHeader === false || data.dockAfterSidebar === false || data.dockBeforeMain === false)
    ) {
      passed = false;
      reason = "monitor_dock_order_incorrect";
    } else if (data.hasHorizontalOverflow) {
      passed = false;
      reason = "horizontal_overflow";
    } else if (!data.hasMain && data.textLength < 20) {
      passed = false;
      reason = "insufficient_rendered_content";
    }

    screenshotPath = path.join(
      outDir,
      `future-monitor-${slugify(route)}-${expectVisible ? "on" : "off"}-${skin || "auto"}-${viewport?.name || "viewport"}.png`,
    );
    await page.screenshot({ path: screenshotPath, fullPage: false });
  } catch (error) {
    passed = false;
    reason = `navigation_error:${String(error)}`;
  }

  return {
    route,
    bypass,
    expectVisible,
    skin,
    url,
    passed,
    reason,
    screenshotPath,
    ...(data || {}),
  };
}

(async () => {
  await fs.mkdir(outDir, { recursive: true });
  const reportPath = path.join(
    outDir,
    monitorSkin === "classic"
      ? "future-monitor-route-audit-v1.json"
      : `future-monitor-route-audit-v1-${monitorSkin}.json`,
  );

  const { browser, fallback, executablePath } = await launchChromium({ headed });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  if (monitorTheme) {
    await context.addInitScript((theme) => {
      try {
        localStorage.setItem("vite-ui-theme", String(theme));
      } catch {
        // ignore
      }
    }, monitorTheme);
  }
  const page = await context.newPage();

  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });

  page.on("pageerror", (err) => {
    pageErrors.push(String(err));
  });

  const results = [];

  for (const group of monitoredRouteMatrix) {
    for (const entry of group.routes) {
      const route = typeof entry === "string" ? entry : entry.path;
      const bypass = typeof entry === "string" ? group.bypass : (entry.bypass ?? group.bypass);
      for (const viewport of viewports) {
        const result = await captureRoute(page, route, bypass, true, monitorSkin, viewport);
        results.push({ group: group.group, viewport: viewport.name, ...result });
      }
    }
  }

  const controlResults = [];
  for (const check of controlChecks) {
    for (const viewport of viewports) {
      const result = await captureRoute(
        page,
        check.route,
        check.bypass,
        check.expectVisible,
        check.skin,
        viewport,
      );
      controlResults.push({ group: "control", viewport: viewport.name, ...result });
    }
  }

  await browser.close();

  const grouped = {};
  for (const item of [...results, ...controlResults]) {
    if (!grouped[item.group]) grouped[item.group] = { total: 0, passed: 0 };
    grouped[item.group].total += 1;
    if (item.passed) grouped[item.group].passed += 1;
  }

  const report = {
    timestamp: new Date().toISOString(),
    baseUrl,
    skin: monitorSkin,
    theme: monitorTheme,
    executablePath,
    usedFallbackBinary: fallback,
    totals: {
      checked: results.length + controlResults.length,
      passed: [...results, ...controlResults].filter((item) => item.passed).length,
      failed: [...results, ...controlResults].filter((item) => !item.passed).length,
    },
    grouped,
    results,
    controlResults,
    consoleErrors,
    pageErrors,
    passed:
      [...results, ...controlResults].every((item) => item.passed) &&
      pageErrors.length === 0,
  };

  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.log(`FUTURE_MONITOR_ROUTE_AUDIT=${reportPath}`);
  console.log(`FUTURE_MONITOR_ROUTE_AUDIT_PASSED=${report.passed}`);
  console.log(
    `FUTURE_MONITOR_ROUTE_AUDIT_TOTALS=${report.totals.checked}/${report.totals.passed}/${report.totals.failed}`,
  );
})();
