import { chromium } from "@playwright/test";
import fs from "fs/promises";
import path from "path";
import os from "os";

async function fileExists(maybePath) {
  if (!maybePath) return false;
  try {
    await fs.access(maybePath);
    return true;
  } catch {
    return false;
  }
}

export async function resolveChromiumExecutablePath() {
  // Allows forcing system Chrome or a custom binary.
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;

  // In some environments, Playwright can resolve x64 paths on Apple Silicon.
  // Prefer Playwright's executablePath but fall back to arm64 variants when needed.
  const candidate = chromium.executablePath();
  const variants = [
    candidate,
    candidate?.replace("mac-x64", "mac-arm64"),
    candidate?.replace("chrome-mac-x64", "chrome-mac-arm64"),
    candidate?.replace(
      "chrome-headless-shell-mac-x64",
      "chrome-headless-shell-mac-arm64",
    ),
  ].filter(Boolean);

  for (const variant of variants) {
    if (await fileExists(variant)) return variant;
  }

  return undefined;
}

export async function resolveChromiumHeadlessShellPath() {
  const home = os.homedir();
  const root = path.join(home, "Library", "Caches", "ms-playwright");

  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return undefined;
  }

  const candidates = entries
    .filter((ent) => ent.isDirectory() && ent.name.startsWith("chromium_headless_shell-"))
    .map((ent) => ent.name)
    .sort((a, b) => {
      const aNum = Number(a.split("-").pop() || 0);
      const bNum = Number(b.split("-").pop() || 0);
      return bNum - aNum;
    });

  for (const dir of candidates) {
    const base = path.join(root, dir);
    const possibleBins = [
      path.join(base, "chrome-headless-shell-mac-arm64", "chrome-headless-shell"),
      path.join(base, "chrome-headless-shell-mac-x64", "chrome-headless-shell"),
    ];
    for (const maybeBin of possibleBins) {
      if (await fileExists(maybeBin)) return maybeBin;
    }
  }

  return undefined;
}

export async function launchChromium({ headed }) {
  const fullExecutable = await resolveChromiumExecutablePath();

  try {
    const browser = await chromium.launch(
      fullExecutable
        ? { executablePath: fullExecutable, headless: !headed }
        : { headless: !headed },
    );
    return { browser, executablePath: fullExecutable, fallback: false };
  } catch (error) {
    // In sandboxed runs, headed Chromium can crash when Crashpad cannot write to
    // user Library locations. Fall back to the headless-shell binary to still
    // collect screenshots + metrics.
    const headlessShell = await resolveChromiumHeadlessShellPath();
    if (!headlessShell) throw error;

    const browser = await chromium.launch({
      executablePath: headlessShell,
      headless: true,
    });
    return { browser, executablePath: headlessShell, fallback: true };
  }
}
