import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export interface DocsSourceOfTruthResult {
  ok: boolean;
  endpointCount: number;
  prefixes: string[];
  mismatches: string[];
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b));
}

function extractOpenApiPaths(openApiContent: string): string[] {
  const matches = openApiContent.matchAll(/^\s{2}(\/api\/[^:\s]+):\s*$/gm);
  return uniqueSorted(Array.from(matches, (match) => match[1]));
}

function extractApiPrefixes(paths: string[]): string[] {
  const prefixes = paths
    .map((apiPath) => {
      const segments = apiPath.split("/").filter(Boolean);
      return segments.length >= 2 ? `/api/${segments[1]}` : "";
    })
    .filter(Boolean);

  return uniqueSorted(prefixes);
}

function extractDocApiPaths(docContent: string): string[] {
  const matches = docContent.matchAll(/\/api\/[a-z0-9-]+(?:\/[a-z0-9-{}]+)*/gi);
  return uniqueSorted(Array.from(matches, (match) => match[0].toLowerCase()));
}

function containsOpenApiReference(docContent: string): boolean {
  return (
    docContent.includes("docs/api/openapi.yaml") ||
    docContent.includes("./docs/api/openapi.yaml") ||
    docContent.includes("../docs/api/openapi.yaml")
  );
}

export async function checkDocsSourceOfTruth(options: {
  rootDir: string;
}): Promise<DocsSourceOfTruthResult> {
  const readmePath = path.join(options.rootDir, "README.md");
  const navigationPath = path.join(
    options.rootDir,
    "docs/documentation-navigation.md",
  );
  const openApiPath = path.join(options.rootDir, "docs/api/openapi.yaml");

  const [readmeContent, navigationContent, openApiContent] = await Promise.all([
    readFile(readmePath, "utf8"),
    readFile(navigationPath, "utf8"),
    readFile(openApiPath, "utf8"),
  ]);

  const openApiPaths = extractOpenApiPaths(openApiContent);
  const requiredPrefixes = extractApiPrefixes(openApiPaths);
  const readmePaths = extractDocApiPaths(readmeContent);
  const navigationPaths = extractDocApiPaths(navigationContent);
  const mismatches: string[] = [];

  if (openApiPaths.length === 0) {
    mismatches.push("OpenAPI spec has no /api/* paths.");
  }

  if (!containsOpenApiReference(readmeContent)) {
    mismatches.push("README.md is missing a docs/api/openapi.yaml reference.");
  }

  if (!containsOpenApiReference(navigationContent)) {
    mismatches.push(
      "docs/documentation-navigation.md is missing a docs/api/openapi.yaml reference.",
    );
  }

  for (const prefix of requiredPrefixes) {
    const inReadme = readmePaths.some((docPath) => docPath.startsWith(prefix));
    if (!inReadme) {
      mismatches.push(`README.md is missing API prefix ${prefix}.`);
    }

    const inNavigation = navigationPaths.some((docPath) =>
      docPath.startsWith(prefix),
    );
    if (!inNavigation) {
      mismatches.push(
        `docs/documentation-navigation.md is missing API prefix ${prefix}.`,
      );
    }
  }

  return {
    ok: mismatches.length === 0,
    endpointCount: openApiPaths.length,
    prefixes: requiredPrefixes,
    mismatches,
  };
}

async function runCli(): Promise<void> {
  const result = await checkDocsSourceOfTruth({ rootDir: process.cwd() });
  if (result.ok) {
    console.log(
      `Docs source-of-truth check passed. endpoints=${result.endpointCount} prefixes=${result.prefixes.join(",")}`,
    );
    return;
  }

  for (const mismatch of result.mismatches) {
    console.error(mismatch);
  }
  process.exit(1);
}

const isEntryFile = process.argv[1]
  ? path.resolve(process.argv[1]) ===
    path.resolve(fileURLToPath(import.meta.url))
  : false;

if (isEntryFile) {
  runCli().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
