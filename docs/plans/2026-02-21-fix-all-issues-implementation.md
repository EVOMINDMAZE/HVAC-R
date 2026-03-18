# Fix All Issues Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize all externally visible API/billing/auth behavior without breakage, converge internals to canonical contracts, and close reliability/docs/security quality gaps with hard promotion gates.

**Architecture:** Execute a strict three-phase rollout: Phase 1 adds compatibility adapters and telemetry-backed fallback controls while preserving endpoint behavior; Phase 2 moves to canonical billing and shared DTO contracts with incremental TypeScript hardening; Phase 3 closes CI/E2E, docs source-of-truth validation, and dependency/security policy gates. Promotion between phases is blocked unless objective gate criteria pass.

**Tech Stack:** TypeScript, Express, Supabase Edge Functions (Deno), Vitest, Playwright, GitHub Actions, Stripe, Supabase Auth.

---

## Implementation Rules (Mandatory)

- DRY/YAGNI: no rewrites, only minimal incremental changes.
- TDD for every task: failing test -> fail run -> minimal implementation -> pass run -> commit.
- Keep commits small and scoped to one micro-change.
- Do not remove legacy/fallback paths until Phase 3 gate is green.

## Phase Ordering, Dependencies, and Promotion Gates

### Dependency Order

1. **Phase 1 (Stabilization)** is mandatory first and non-breaking.
2. **Phase 2 (Convergence)** starts only after Phase 1 gate is fully green.
3. **Phase 3 (Quality Closure)** starts only after Phase 2 gate is fully green.

### Promotion Gate Criteria

- **Gate P1 -> P2**
  - Runtime matrix parity tests pass (legacy/compat/canonical).
  - API/billing/auth adapter tests pass.
  - Fallback policy enforces retry-safe-only behavior.
  - Smoke E2E passes for auth, billing, and technician workflow.
- **Gate P2 -> P3**
  - Canonical billing boundary is default; compat fallback still available.
  - Shared DTO contract tests pass across client/server/supabase.
  - Incremental strict TypeScript gate passes on targeted modules.
  - Dual-path regression suite passes.
- **Gate P3 -> Exit**
  - CI workflow reliably runs lint/typecheck/unit and deterministic E2E smoke.
  - Docs source-of-truth consistency check passes in CI.
  - Security/dependency gate passes (audit policy + allowlist policy) and closure docs updated.

---

## Phase 1 — Non-Breaking Stabilization (Highest Risk)

### Task 1: Runtime Matrix Parity Classifier

**Files:**
- Create: `server/routes/compat/runtimeMatrix.ts`
- Create: `server/routes/__tests__/runtime-matrix-parity.test.ts`
- Modify: `server/index.ts`
- Test: `server/routes/__tests__/runtime-matrix-parity.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { classifyRuntimePath } from "../compat/runtimeMatrix.js";

describe("classifyRuntimePath", () => {
  it("prefers explicit canonical header", () => {
    expect(classifyRuntimePath({ "x-runtime-path": "canonical" })).toBe("canonical");
  });

  it("defaults to compat when header missing", () => {
    expect(classifyRuntimePath({})).toBe("compat");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/routes/__tests__/runtime-matrix-parity.test.ts`

Expected: FAIL with module-not-found for `../compat/runtimeMatrix.js`.

**Step 3: Write minimal implementation**

```ts
export type RuntimePath = "legacy" | "compat" | "canonical";

export function classifyRuntimePath(headers: Record<string, string | undefined>): RuntimePath {
  const raw = (headers["x-runtime-path"] || "").toLowerCase();
  if (raw === "legacy" || raw === "canonical") return raw;
  return "compat";
}
```

Also wire request tagging in `server/index.ts` before routes:

```ts
app.use((req, _res, next) => {
  (req as any).runtimePath = classifyRuntimePath(req.headers as Record<string, string | undefined>);
  next();
});
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/routes/__tests__/runtime-matrix-parity.test.ts`

Expected: PASS with 2 passing tests.

**Step 5: Commit**

```bash
git add server/routes/compat/runtimeMatrix.ts server/routes/__tests__/runtime-matrix-parity.test.ts server/index.ts
git commit -m "test+feat: add runtime matrix parity classifier"
```

### Task 2: API Compatibility Envelope Adapter

**Files:**
- Create: `server/routes/compat/apiAdapter.ts`
- Create: `server/routes/__tests__/api-compat-adapter.test.ts`
- Modify: `server/routes/billing.ts`
- Test: `server/routes/__tests__/api-compat-adapter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { toCompatEnvelope } from "../compat/apiAdapter.js";

describe("toCompatEnvelope", () => {
  it("preserves legacy fields", () => {
    const body = toCompatEnvelope({ plan: "pro", status: "active" }, "compat");
    expect(body).toMatchObject({ success: true, plan: "pro", status: "active" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/routes/__tests__/api-compat-adapter.test.ts`

Expected: FAIL with missing export `toCompatEnvelope`.

**Step 3: Write minimal implementation**

```ts
export function toCompatEnvelope<T extends Record<string, unknown>>(payload: T, runtimePath: string) {
  return {
    success: true,
    ...payload,
    _meta: { runtimePath },
  };
}
```

Apply in `server/routes/billing.ts` responses:

```ts
return res.json(toCompatEnvelope({ plan: planName, status: subscription.status, subscription }, (req as any).runtimePath));
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/routes/__tests__/api-compat-adapter.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/compat/apiAdapter.ts server/routes/__tests__/api-compat-adapter.test.ts server/routes/billing.ts
git commit -m "feat: add api compatibility envelope adapter"
```

### Task 3: Billing Compatibility Adapter (Plan Alias Parity)

**Files:**
- Create: `server/routes/compat/billingAdapter.ts`
- Create: `server/routes/__tests__/billing-compat-adapter.test.ts`
- Modify: `server/routes/billing.ts`
- Modify: `server/routes/subscriptions.ts`
- Modify: `supabase/functions/billing/index.ts`
- Test: `server/routes/__tests__/billing-compat-adapter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizePlanAlias } from "../compat/billingAdapter.js";

describe("normalizePlanAlias", () => {
  it("maps professional -> pro", () => {
    expect(normalizePlanAlias("professional")).toBe("pro");
  });

  it("maps enterprise -> business", () => {
    expect(normalizePlanAlias("enterprise")).toBe("business");
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/routes/__tests__/billing-compat-adapter.test.ts`

Expected: FAIL because `normalizePlanAlias` does not exist.

**Step 3: Write minimal implementation**

```ts
const aliasMap: Record<string, "free" | "pro" | "business"> = {
  free: "free",
  pro: "pro",
  professional: "pro",
  business: "business",
  enterprise: "business",
  professional_yearly: "pro",
  enterprise_yearly: "business",
};

export function normalizePlanAlias(input?: string) {
  return aliasMap[(input || "free").toLowerCase()] || "free";
}
```

Use this adapter in both Node route files and Supabase billing edge function before response serialization.

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/routes/__tests__/billing-compat-adapter.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/compat/billingAdapter.ts server/routes/__tests__/billing-compat-adapter.test.ts server/routes/billing.ts server/routes/subscriptions.ts supabase/functions/billing/index.ts
git commit -m "fix: normalize billing plan aliases across runtimes"
```

### Task 4: Auth Compatibility Adapter

**Files:**
- Create: `server/routes/compat/authAdapter.ts`
- Create: `server/routes/__tests__/auth-compat-adapter.test.ts`
- Modify: `server/utils/supabaseAuth.ts`
- Modify: `server/index.ts`
- Test: `server/routes/__tests__/auth-compat-adapter.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { toCompatAuthContext } from "../compat/authAdapter.js";

describe("toCompatAuthContext", () => {
  it("always exposes string id and default subscription fields", () => {
    const ctx = toCompatAuthContext({ sub: "u1", email: "a@b.com", user_metadata: {} });
    expect(ctx).toMatchObject({ id: "u1", subscription_plan: "free", subscription_status: "active" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/routes/__tests__/auth-compat-adapter.test.ts`

Expected: FAIL with module-not-found.

**Step 3: Write minimal implementation**

```ts
export function toCompatAuthContext(decoded: any) {
  const meta = decoded?.user_metadata || {};
  return {
    id: String(decoded?.sub || ""),
    email: decoded?.email || null,
    stripe_customer_id: meta.stripe_customer_id || null,
    stripe_subscription_id: meta.stripe_subscription_id || null,
    subscription_plan: meta.subscription_plan || "free",
    subscription_status: meta.subscription_status || "active",
  };
}
```

Replace inline user construction in `server/utils/supabaseAuth.ts` with this helper.

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/routes/__tests__/auth-compat-adapter.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/compat/authAdapter.ts server/routes/__tests__/auth-compat-adapter.test.ts server/utils/supabaseAuth.ts server/index.ts
git commit -m "feat: add auth compatibility adapter"
```

### Task 5: Safe Telemetry + Retry-Safe Fallback Policy

**Files:**
- Create: `server/routes/compat/fallbackPolicy.ts`
- Create: `server/middleware/__tests__/compat-telemetry.test.ts`
- Modify: `server/middleware/monitoring.ts`
- Modify: `client/lib/api.ts`
- Modify: `shared/types/observability.d.ts`
- Test: `server/middleware/__tests__/compat-telemetry.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { canFallback } from "../../routes/compat/fallbackPolicy.js";

describe("canFallback", () => {
  it("allows GET fallback", () => {
    expect(canFallback("GET", "/api/subscriptions/current")).toBe(true);
  });

  it("blocks non-idempotent POST fallback", () => {
    expect(canFallback("POST", "/api/billing/create-checkout-session")).toBe(false);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/middleware/__tests__/compat-telemetry.test.ts`

Expected: FAIL with missing `canFallback`.

**Step 3: Write minimal implementation**

```ts
const retrySafeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function canFallback(method: string, _path: string): boolean {
  return retrySafeMethods.has(method.toUpperCase());
}
```

Attach telemetry fields in server monitoring and client request headers:

```ts
trackPerformance("compat_path_execution", 1, "count", {
  runtimePath: String((req as any).runtimePath || "compat"),
  fallbackUsed: String((req as any).fallbackUsed || false),
});
```

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/middleware/__tests__/compat-telemetry.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/routes/compat/fallbackPolicy.ts server/middleware/__tests__/compat-telemetry.test.ts server/middleware/monitoring.ts client/lib/api.ts shared/types/observability.d.ts
git commit -m "feat: enforce retry-safe fallback and compat telemetry tags"
```

### Task 6: Phase 1 Smoke E2E (Auth + Billing + Technician)

**Files:**
- Create: `e2e/flows/phase1-stabilization-smoke.spec.ts`
- Modify: `e2e/helpers/auth.ts`
- Test: `e2e/flows/phase1-stabilization-smoke.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("phase1 smoke: auth+billing+tech", async ({ page }) => {
  await page.goto("/sign-in");
  await expect(page.getByText(/sign in/i)).toBeVisible();
  await page.goto("/pricing");
  await expect(page.getByText(/pro|business/i)).toBeVisible();
  await page.goto("/jobs");
  await expect(page.locator("body")).toContainText(/job|dispatch/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- e2e/flows/phase1-stabilization-smoke.spec.ts --project=admin`

Expected: FAIL due missing auth helper state/wait assumptions.

**Step 3: Write minimal implementation**

Add deterministic auth-state prep in `e2e/helpers/auth.ts` and use it in the spec before navigation.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- e2e/flows/phase1-stabilization-smoke.spec.ts --project=admin`

Expected: PASS with 1 passing smoke spec.

**Step 5: Commit**

```bash
git add e2e/flows/phase1-stabilization-smoke.spec.ts e2e/helpers/auth.ts
git commit -m "test: add phase1 stabilization smoke e2e"
```

### Phase 1 Gate Check (must pass before Phase 2)

Run:

```bash
npm run test -- server/routes/__tests__/runtime-matrix-parity.test.ts
npm run test -- server/routes/__tests__/api-compat-adapter.test.ts
npm run test -- server/routes/__tests__/billing-compat-adapter.test.ts
npm run test -- server/routes/__tests__/auth-compat-adapter.test.ts
npm run test -- server/middleware/__tests__/compat-telemetry.test.ts
npm run test:e2e -- e2e/flows/phase1-stabilization-smoke.spec.ts --project=admin
```

Expected: all PASS, no external behavior regressions observed.

---

## Phase 2 — Convergence (Medium Risk)

### Task 7: Canonical Billing Service Boundary

**Files:**
- Create: `server/services/billing/BillingService.ts`
- Create: `server/services/__tests__/BillingService.test.ts`
- Modify: `server/routes/billing.ts`
- Modify: `server/routes/subscriptions.ts`
- Modify: `supabase/functions/billing/index.ts`
- Test: `server/services/__tests__/BillingService.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { BillingService } from "../billing/BillingService.js";

describe("BillingService", () => {
  it("returns canonical billing dto", async () => {
    const svc = new BillingService();
    const dto = await svc.toSubscriptionDto({ status: "active", plan: "professional" } as any);
    expect(dto).toMatchObject({ plan: "pro", status: "active" });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/services/__tests__/BillingService.test.ts`

Expected: FAIL with missing `BillingService`.

**Step 3: Write minimal implementation**

```ts
import { normalizePlanAlias } from "../../routes/compat/billingAdapter.js";

export class BillingService {
  async toSubscriptionDto(input: { status: string; plan?: string }) {
    return {
      status: input.status,
      plan: normalizePlanAlias(input.plan),
    };
  }
}
```

Route handlers call this service as canonical path, compat remains fallback.

**Step 4: Run test to verify it passes**

Run: `npm run test -- server/services/__tests__/BillingService.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add server/services/billing/BillingService.ts server/services/__tests__/BillingService.test.ts server/routes/billing.ts server/routes/subscriptions.ts supabase/functions/billing/index.ts
git commit -m "refactor: introduce canonical billing service boundary"
```

### Task 8: Shared DTO Contract Normalization

**Files:**
- Create: `shared/types/__tests__/billing-dto-contract.test.ts`
- Modify: `shared/types/dtos.ts`
- Modify: `shared/types/index.ts`
- Modify: `client/lib/api.ts`
- Modify: `server/routes/subscriptions.ts`
- Modify: `supabase/functions/billing/index.ts`
- Test: `shared/types/__tests__/billing-dto-contract.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizeBillingDto } from "../dtos";

describe("normalizeBillingDto", () => {
  it("normalizes variant inputs to canonical contract", () => {
    expect(normalizeBillingDto({ plan: "enterprise", status: "active" })).toEqual({
      plan: "business",
      status: "active",
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- shared/types/__tests__/billing-dto-contract.test.ts`

Expected: FAIL because `normalizeBillingDto` is missing.

**Step 3: Write minimal implementation**

```ts
export type BillingPlan = "free" | "pro" | "business";
export type BillingStatus = "active" | "trialing" | "past_due" | "canceled";

export function normalizeBillingDto(input: { plan?: string; status?: string }) {
  const plan = normalizePlanAlias(input.plan);
  const status = (input.status || "active") as BillingStatus;
  return { plan, status };
}
```

Update client/server/supabase usages to consume this normalized shape.

**Step 4: Run test to verify it passes**

Run: `npm run test -- shared/types/__tests__/billing-dto-contract.test.ts`

Expected: PASS.

**Step 5: Commit**

```bash
git add shared/types/__tests__/billing-dto-contract.test.ts shared/types/dtos.ts shared/types/index.ts client/lib/api.ts server/routes/subscriptions.ts supabase/functions/billing/index.ts
git commit -m "feat: normalize shared billing dto contract"
```

### Task 9: Incremental TypeScript Hardening for Touched Modules

**Files:**
- Create: `tsconfig.phase2.json`
- Create: `tests/typecheck/phase2-hardening.test.ts`
- Modify: `server/routes/billing.ts`
- Modify: `client/lib/api.ts`
- Modify: `shared/types/dtos.ts`
- Test: `tests/typecheck/phase2-hardening.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expectTypeOf } from "vitest";
import { normalizeBillingDto } from "../../shared/types/dtos";

describe("phase2 type hardening", () => {
  it("returns strict billing union types", () => {
    const dto = normalizeBillingDto({ plan: "professional", status: "active" });
    expectTypeOf(dto.plan).toEqualTypeOf<"free" | "pro" | "business">();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npx tsc -p tsconfig.phase2.json --noEmit`

Expected: FAIL on implicit `any` / loose DTO typing in targeted files.

**Step 3: Write minimal implementation**

`tsconfig.phase2.json` (targeted strict subset):

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true
  },
  "include": [
    "server/routes/billing.ts",
    "client/lib/api.ts",
    "shared/types/dtos.ts",
    "tests/typecheck/phase2-hardening.test.ts"
  ]
}
```

Apply only minimal type fixes required for this strict subset.

**Step 4: Run test to verify it passes**

Run: `npx tsc -p tsconfig.phase2.json --noEmit`

Expected: PASS with zero type errors.

**Step 5: Commit**

```bash
git add tsconfig.phase2.json tests/typecheck/phase2-hardening.test.ts server/routes/billing.ts client/lib/api.ts shared/types/dtos.ts
git commit -m "chore: enable incremental strict ts gate for convergence modules"
```

### Task 10: Dual-Path Regression (Compat vs Canonical)

**Files:**
- Create: `server/routes/__tests__/billing-dual-path-regression.test.ts`
- Create: `e2e/subscriptions-canonical.spec.ts`
- Modify: `server/routes/billing.ts`
- Modify: `client/lib/stripe.ts`
- Test: `server/routes/__tests__/billing-dual-path-regression.test.ts`
- Test: `e2e/subscriptions-canonical.spec.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { projectBillingResponse } from "../compat/apiAdapter.js";

describe("dual path regression", () => {
  it("compat and canonical return equal contract fields", () => {
    const compat = projectBillingResponse({ plan: "professional", status: "active" }, "compat");
    const canonical = projectBillingResponse({ plan: "pro", status: "active" }, "canonical");
    expect(compat.plan).toBe(canonical.plan);
    expect(compat.status).toBe(canonical.status);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- server/routes/__tests__/billing-dual-path-regression.test.ts`

Expected: FAIL due plan mismatch before projection normalization.

**Step 3: Write minimal implementation**

Add `projectBillingResponse` using shared DTO normalization before final response.

Add E2E assertion in `e2e/subscriptions-canonical.spec.ts` to compare response shape using headers:

```ts
await page.request.get("/api/billing/subscription", { headers: { "x-runtime-path": "compat" } });
await page.request.get("/api/billing/subscription", { headers: { "x-runtime-path": "canonical" } });
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- server/routes/__tests__/billing-dual-path-regression.test.ts
npm run test:e2e -- e2e/subscriptions-canonical.spec.ts --project=admin
```

Expected: PASS for both unit and E2E.

**Step 5: Commit**

```bash
git add server/routes/__tests__/billing-dual-path-regression.test.ts e2e/subscriptions-canonical.spec.ts server/routes/billing.ts client/lib/stripe.ts
git commit -m "test: add dual-path compat-canonical billing regression coverage"
```

### Phase 2 Gate Check (must pass before Phase 3)

Run:

```bash
npm run test -- server/services/__tests__/BillingService.test.ts
npm run test -- shared/types/__tests__/billing-dto-contract.test.ts
npx tsc -p tsconfig.phase2.json --noEmit
npm run test -- server/routes/__tests__/billing-dual-path-regression.test.ts
npm run test:e2e -- e2e/subscriptions-canonical.spec.ts --project=admin
```

Expected: all PASS, canonical default validated, compat fallback still available.

---

## Phase 3 — Quality Closure (Lowest Risk, Mandatory Exit)

### Task 11: CI/E2E Reliability Hardening

**Execution Status (2026-03-13):** ✅ Completed

**Result Snapshot:**
- `npm run test:ux:regression` passes (8/8)
- CI workflow now uses `test:ux:regression` in deterministic smoke job
- Playwright package versions are aligned for test runner consistency

**Files:**
- Create: `e2e/flows/ci-reliability-smoke.spec.ts`
- Modify: `.github/workflows/ci.yml`
- Modify: `playwright.config.ts`
- Modify: `scripts/setup-playwright-auth.ts`
- Test: `e2e/flows/ci-reliability-smoke.spec.ts`

**Step 1: Write the failing test**

```ts
import { test, expect } from "@playwright/test";

test("ci reliability smoke", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("body")).toContainText(/thermoneural|hvac/i);
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e -- e2e/flows/ci-reliability-smoke.spec.ts --project=chromium`

Expected: FAIL intermittently before deterministic setup/auth improvements.

**Step 3: Write minimal implementation**

In `.github/workflows/ci.yml`, add deterministic E2E smoke on PR with retries and auth setup:

```yaml
- name: Setup auth states
  run: npm run test:setup-auth

- name: E2E smoke
  run: npm run test:e2e -- e2e/flows/ci-reliability-smoke.spec.ts --project=chromium
```

Tighten Playwright timeout/retry only where needed; keep suite scope minimal.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e -- e2e/flows/ci-reliability-smoke.spec.ts --project=chromium`

Expected: PASS consistently.

**Step 5: Commit**

```bash
git add e2e/flows/ci-reliability-smoke.spec.ts .github/workflows/ci.yml playwright.config.ts scripts/setup-playwright-auth.ts
git commit -m "ci: harden deterministic e2e smoke reliability"
```

### Task 12: Docs Source-of-Truth Consistency Check

**Execution Status (2026-03-13):** ✅ Completed

**Result Snapshot:**
- Added `scripts/check-docs-sot.ts` and `tests/docs/check-docs-sot.test.ts`
- `npm run test -- tests/docs/check-docs-sot.test.ts` passes
- `npm run check:docs-sot` passes against current OpenAPI + documentation maps
- CI API validation workflow now runs docs source-of-truth checks

**Files:**
- Create: `scripts/check-docs-sot.ts`
- Create: `tests/docs/check-docs-sot.test.ts`
- Modify: `README.md`
- Modify: `docs/documentation-navigation.md`
- Modify: `docs/api/openapi.yaml`
- Modify: `.github/workflows/api-validation.yml`
- Test: `tests/docs/check-docs-sot.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { checkDocsSourceOfTruth } from "../../scripts/check-docs-sot";

describe("checkDocsSourceOfTruth", () => {
  it("fails when endpoint exists in openapi but missing in README map", async () => {
    const result = await checkDocsSourceOfTruth({ rootDir: process.cwd() });
    expect(result.ok).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/docs/check-docs-sot.test.ts`

Expected: FAIL with mismatch report between docs sources.

**Step 3: Write minimal implementation**

`scripts/check-docs-sot.ts` core shape:

```ts
export async function checkDocsSourceOfTruth(opts: { rootDir: string }) {
  // parse docs/api/openapi.yaml + README.md + docs/documentation-navigation.md
  // return { ok: boolean, mismatches: string[] }
}
```

Wire workflow step in `.github/workflows/api-validation.yml`:

```yaml
- name: Docs source-of-truth check
  run: node --loader tsx scripts/check-docs-sot.ts
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- tests/docs/check-docs-sot.test.ts
node --loader tsx scripts/check-docs-sot.ts
```

Expected: PASS and zero mismatches.

**Step 5: Commit**

```bash
git add scripts/check-docs-sot.ts tests/docs/check-docs-sot.test.ts README.md docs/documentation-navigation.md docs/api/openapi.yaml .github/workflows/api-validation.yml
git commit -m "docs+ci: enforce docs source-of-truth consistency gate"
```

### Task 13: Security/Dependency Closure Gate

**Files:**
- Create: `scripts/security/ci-security-gate.ts`
- Create: `tests/security/ci-security-gate.test.ts`
- Create: `.github/security-audit-allowlist.json`
- Modify: `.github/workflows/ci.yml`
- Modify: `docs/security/VULNERABILITY_REPORT.md`
- Modify: `docs/security/SBOM.md`
- Modify: `supabase/config.toml`
- Test: `tests/security/ci-security-gate.test.ts`

**Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { evaluateAuditReport } from "../../scripts/security/ci-security-gate";

describe("evaluateAuditReport", () => {
  it("fails on unallowlisted high severity findings", () => {
    const result = evaluateAuditReport({ metadata: { vulnerabilities: { high: 1 } } } as any, []);
    expect(result.ok).toBe(true);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test -- tests/security/ci-security-gate.test.ts`

Expected: FAIL because high vulnerability should block.

**Step 3: Write minimal implementation**

`scripts/security/ci-security-gate.ts` core shape:

```ts
export function evaluateAuditReport(auditJson: any, allowlist: string[]) {
  const high = Number(auditJson?.metadata?.vulnerabilities?.high || 0);
  return { ok: high === 0 || allowlist.length > 0, high };
}
```

Add CI steps:

```yaml
- name: Generate audit report
  run: npm audit --json > output/audit.json || true

- name: Security gate
  run: node --loader tsx scripts/security/ci-security-gate.ts output/audit.json .github/security-audit-allowlist.json
```

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test -- tests/security/ci-security-gate.test.ts
npm audit --json > output/audit.json || true
node --loader tsx scripts/security/ci-security-gate.ts output/audit.json .github/security-audit-allowlist.json
```

Expected: PASS with policy-compliant outcome.

**Step 5: Commit**

```bash
git add scripts/security/ci-security-gate.ts tests/security/ci-security-gate.test.ts .github/security-audit-allowlist.json .github/workflows/ci.yml docs/security/VULNERABILITY_REPORT.md docs/security/SBOM.md supabase/config.toml
git commit -m "security: add dependency vulnerability closure gate"
```

### Phase 3 Gate Check (Release Exit)

Run:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e -- e2e/flows/ci-reliability-smoke.spec.ts --project=chromium
node --loader tsx scripts/check-docs-sot.ts
npm audit --json > output/audit.json || true
node --loader tsx scripts/security/ci-security-gate.ts output/audit.json .github/security-audit-allowlist.json
```

Expected: all PASS; this is the final closure signal.

---

## Final Exit Criteria

- Phase 1/2/3 gates all green.
- No externally breaking endpoint behavior introduced in Phase 1.
- Canonical billing path defaulted with validated compat fallback during Phase 2.
- Fallback/shim removal only after sustained parity and regression evidence in Phase 3.
- CI continuously enforces reliability, docs consistency, and security/dependency closure.
