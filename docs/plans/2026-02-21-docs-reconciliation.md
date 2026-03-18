# Documentation Source-of-Truth Reconciliation

**Date:** 2026-02-21  
**Phase:** Phase 3 Batch 2  
**Scope:** Documentation consistency and accuracy alignment

## Summary

This document summarizes the documentation alignment performed as part of Phase 3 Batch 2. The objective was to ensure all documentation sources are mutually consistent and reflect the current state after completed Phases 1–3 Batch 1.

## Files Changed

| File | Changes Made |
|------|--------------|
| `docs/api/INVENTORY.md` | Updated to reflect OpenAPI spec exists and is complete; changed documentation status from "Missing" to "Documented in OpenAPI" |
| `e2e/README.md` | Added CI/E2E execution modes section; documented `ci-smoke` project; clarified smoke vs full E2E distinction; added Node.js version requirement |
| `skills/03_development/developer_guide.md` | Updated Node.js requirement to 20+; added CI test gates section; updated testing strategy with Vitest; added E2E project table |
| `README.md` | Added CI quality gates section; added smoke test command; updated last modified date |

## Contradictions Resolved

### 1. API Documentation Status

**Previous State:** `docs/api/INVENTORY.md` stated "0% documented" and "Zero API documentation exists"

**Actual State:** `docs/api/openapi.yaml` contains complete OpenAPI 3.0.3 specification with 27 endpoints documented

**Resolution:** Updated INVENTORY.md to reflect that all 27 endpoints are documented in the OpenAPI spec, with links to the canonical source

### 2. E2E Test Execution Model

**Previous State:** `e2e/README.md` implied all E2E tests run in CI without distinction

**Actual State:** CI workflow (`.github/workflows/ci.yml`) has two separate jobs:
- `e2e-smoke`: Runs automatically on every PR (deterministic, public pages only)
- `e2e-full`: Manual dispatch only (requires Supabase + seeded users)

**Resolution:** Added explicit "CI/E2E Execution Modes" section documenting the distinction between smoke tests (automatic) and full suite (manual)

### 3. Node.js Version Requirement

**Previous State:** `skills/03_development/developer_guide.md` stated "Node.js 18+ (recommended: 20+)"

**Actual State:** `.github/workflows/ci.yml` uses `NODE_VERSION: "20"` as the required version

**Resolution:** Updated prerequisite to "Node.js 20+ (required; CI uses Node 20)"

### 4. Testing Framework

**Previous State:** Developer guide stated "Unit Tests: Jest + Testing Library"

**Actual State:** Project uses Vitest (per `package.json` and test commands)

**Resolution:** Updated to "Unit Tests: Vitest + Testing Library"

### 5. CI Workflow File Reference

**Previous State:** Developer guide referenced `.github/workflows/deploy.yml` for CI/CD

**Actual State:** CI pipeline is in `.github/workflows/ci.yml`

**Resolution:** Updated reference to correct workflow file

## Current Source-of-Truth References

### Node.js/Runtime Baseline
- **Source:** `.github/workflows/ci.yml` line 11: `NODE_VERSION: "20"`
- **Documented in:** `skills/03_development/developer_guide.md`, `e2e/README.md`

### CI Quality Gates
- **Source:** `.github/workflows/ci.yml`
- **Gates:**
  1. `quality` job: lint, typecheck, unit tests
  2. `e2e-smoke` job: deterministic public-page tests
  3. `e2e-full` job: manual dispatch only
- **Documented in:** `skills/03_development/developer_guide.md`, `README.md`

### E2E Test Projects
- **Source:** `playwright.config.ts`
- **Projects:** ci-smoke, chromium, admin, technician, client, student
- **Documented in:** `e2e/README.md`, `skills/03_development/developer_guide.md`

### API Documentation
- **Source:** `docs/api/openapi.yaml` (canonical)
- **Inventory:** `docs/api/INVENTORY.md` (cross-reference)
- **Route Definitions:** `server/index.ts`, `server/routes/*.ts`

### Test Commands
- **Source:** `package.json` scripts section
- **Documented in:** `README.md`, `skills/03_development/developer_guide.md`, `e2e/README.md`

## Remaining Documentation Gaps (Deferred)

The following documentation gaps were identified but are out of scope for this batch:

1. **Interactive API Playground** - Consider adding Swagger UI at `/api/docs`
2. **SDK/Client Library Generation** - Can be generated from OpenAPI spec
3. **API Versioning Strategy** - Currently v2.0.0; deprecation policy needed
4. **Deployment Workflow Documentation** - Need to verify `deploy.yml` vs `ci.yml` distinction

## 2026-03-13 Backlog Update

Completed in Task 12 follow-up:

1. Added automated docs source-of-truth validation (`scripts/check-docs-sot.ts`)
2. Added regression tests for docs source-of-truth checker (`tests/docs/check-docs-sot.test.ts`)
3. Updated README and documentation navigation with explicit API prefix map
4. Wired docs source-of-truth checks into CI workflows

Still open:

1. API portal build step still performs a no-op self-copy in `.github/workflows/api-validation.yml`
2. Manual endpoint count messaging in workflow logs can drift from OpenAPI unless generated
3. Legacy docs still reference mixed CI/deploy workflow responsibilities

## Verification

Cross-document consistency was validated by:

1. Checking Node.js version references match CI workflow
2. Verifying E2E test descriptions match playwright.config.ts projects
3. Confirming API endpoint count matches between INVENTORY.md and openapi.yaml
4. Validating test commands match package.json scripts

---

**Completed:** 2026-02-21  
**Next Review:** After Phase 3 completion or significant CI/runtime changes
