import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { checkDocsSourceOfTruth } from "../../scripts/check-docs-sot";

const cleanupDirs: string[] = [];

async function makeFixture(files: Record<string, string>): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), "docs-sot-"));
  cleanupDirs.push(root);

  for (const [relativePath, content] of Object.entries(files)) {
    const fullPath = path.join(root, relativePath);
    await mkdir(path.dirname(fullPath), { recursive: true });
    await writeFile(fullPath, content, "utf8");
  }

  return root;
}

afterEach(async () => {
  await Promise.all(
    cleanupDirs.splice(0).map((dirPath) =>
      rm(dirPath, { recursive: true, force: true }),
    ),
  );
});

describe("checkDocsSourceOfTruth", () => {
  it("passes when docs reference all OpenAPI prefixes", async () => {
    const rootDir = await makeFixture({
      "docs/api/openapi.yaml": `
paths:
  /api/auth/signin:
    post: {}
  /api/reports/generate:
    post: {}
`,
      "README.md": `
# Project
[OpenAPI](./docs/api/openapi.yaml)
- /api/auth
- /api/reports
`,
      "docs/documentation-navigation.md": `
# Docs
[Canonical OpenAPI](../docs/api/openapi.yaml)
- /api/auth
- /api/reports
`,
    });

    const result = await checkDocsSourceOfTruth({ rootDir });
    expect(result.ok).toBe(true);
    expect(result.endpointCount).toBe(2);
    expect(result.mismatches).toEqual([]);
  });

  it("fails when a prefix exists in OpenAPI but is missing in docs", async () => {
    const rootDir = await makeFixture({
      "docs/api/openapi.yaml": `
paths:
  /api/auth/signin:
    post: {}
  /api/team/invite:
    post: {}
`,
      "README.md": `
# Project
[OpenAPI](./docs/api/openapi.yaml)
- /api/auth
`,
      "docs/documentation-navigation.md": `
# Docs
[Canonical OpenAPI](../docs/api/openapi.yaml)
- /api/auth
`,
    });

    const result = await checkDocsSourceOfTruth({ rootDir });
    expect(result.ok).toBe(false);
    expect(result.mismatches.some((mismatch) => mismatch.includes("/api/team"))).toBe(true);
  });
});
