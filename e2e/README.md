# Playwright E2E Tests

## Overview

End-to-end tests are organized by user role to test authenticated workflows:

- **admin/** - Admin-only functionality (team management, client management)
- **technician/** - Technician workflows (dispatch, job assignments)
- **client/** - Client portal features (asset viewing, requests)
- **student/** - Learning tools access
- **shared/** - Cross-role tests (authentication, navigation)
- **flows/** - CI-specific test flows (deterministic smoke tests)
- **helpers/** - Shared utilities (authentication helpers)

## CI/E2E Execution Modes

### Smoke E2E (Automated on every PR)

The `e2e-smoke` CI job runs automatically on every pull request. It uses the `ci-smoke` project which targets **deterministic public-page tests only** - tests that don't require authentication or external services.

```bash
# Runs automatically in CI via .github/workflows/ci.yml
# Test file: e2e/flows/ci-reliability-smoke.spec.ts
# Project: ci-smoke (chromium)
# Retries: 2
```

**Characteristics:**
- Runs on every PR to `main`
- No Supabase or seeded users required
- Tests public pages only (landing, login, pricing, etc.)
- Fast execution (~30 seconds)
- Deterministic and reliable

### Full E2E Suite (Manual Dispatch)

The `e2e-full` CI job requires manual workflow dispatch and needs Supabase with seeded test users.

```bash
# Trigger via GitHub Actions UI: Actions → CI → Run workflow
# Requires: Supabase instance + seeded test users
```

**Characteristics:**
- Manual trigger only (`workflow_dispatch`)
- Tests all authenticated workflows
- Requires test users and authentication state
- Longer execution time

## Setup

### 1. Test Users

Ensure test users exist in your Supabase database. Run the setup script:

```bash
npm run test:setup-auth
```

This creates/saves authentication states for each role in `playwright/.auth/`.

### 2. Environment Variables

Add to your `.env` file:

```env
# Test User Credentials
TEST_ADMIN_EMAIL=admin@admin.com
TEST_ADMIN_PASSWORD=ThermoAdmin$2026!
TEST_TECHNICIAN_EMAIL=tech@test.com
TEST_TECHNICIAN_PASSWORD=Password123!
TEST_CLIENT_EMAIL=client@test.com
TEST_CLIENT_PASSWORD=Password123!
TEST_STUDENT_EMAIL=student@test.com
TEST_STUDENT_PASSWORD=Password123!

# Playwright Configuration
PLAYWRIGHT_BASE_URL=http://localhost:3001
```

### 3. Running Tests

**Run all tests:**

```bash
npm run test:e2e
```

**Run CI smoke tests (deterministic, no auth required):**

```bash
npm run test:e2e -- --project=ci-smoke
```

**Run tests by role:**

```bash
npm run test:e2e -- --project=admin
npm run test:e2e -- --project=technician
npm run test:e2e -- --project=client
npm run test:e2e -- --project=student
```

**Run specific test file:**

```bash
npx playwright test e2e/admin/dashboard.spec.ts
```

**Run with UI:**

```bash
npx playwright test --ui
```

### 4. Authentication Helpers

Use the `loginAs` helper in your tests:

```typescript
import { loginAs } from "./helpers/auth";

test.beforeEach(async ({ page }) => {
  await loginAs("admin", page);
});
```

### 5. Test Data Management

- Tests should create unique data (using timestamps) to avoid conflicts
- Clean up test data after tests when possible
- Use the `scripts/create_test_users.ts` to create test users if needed

### 6. CI/CD Integration

**Automated Smoke Tests:**
- Smoke tests run automatically in CI on every PR
- Uses `ci-smoke` project targeting `e2e/flows/ci-reliability-smoke.spec.ts`
- No external dependencies required

**Full E2E Suite:**
- Requires manual workflow dispatch
- Ensure `PLAYWRIGHT_BASE_URL` is set correctly for your environment
- Requires Supabase instance with seeded test users

## Writing New Tests

1. Place tests in the appropriate role directory
2. Use `loginAs` helper for authentication
3. Include both positive (authorized access) and negative (unauthorized access) tests
4. Use descriptive test names that include the role and functionality
5. Follow existing patterns for consistency

### CI-Safe Tests

For tests that should run in CI without external dependencies:

1. Place in `e2e/flows/` directory
2. Target public pages only (no authentication)
3. Use the `ci-smoke` project pattern
4. Avoid external API calls or mock them appropriately

## Running Tests in Headed Mode

You can run E2E tests in headed (visible) browser mode for debugging purposes:

```bash
npm run test:e2e:headed
```

This runs all tests with the `--headed` flag, which opens a visible browser window. You can also combine with project filters:

```bash
npm run test:e2e:headed -- --project=admin
```

## Mocking Skool Verification

Some features (e.g., company creation) require a valid Skool subscription. To test these workflows without actual subscriptions, use the `mockSkoolVerification` helper:

```typescript
import { mockSkoolVerification } from "./helpers/mock-skool";

test("admin can create company", async ({ page }) => {
  await mockSkoolVerification(page);
  // ... navigate to /create-company and submit
});
```

The helper intercepts the `verify_skool_subscription` RPC call and returns `true`. This allows company creation tests to proceed.

## Troubleshooting Common Test Failures

### 1. Supabase Connection Issues
- Ensure local Supabase instance is running: `curl http://localhost:54321`
- Verify `.env` variables `VITE_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correct
- The test helpers use `VITE_SUPABASE_URL`; ensure it matches your local Supabase URL (default `http://localhost:54321`)

### 2. Test Data Seeding Failures
- Some tests require admin user with a company and Skool subscription
- Use the `ensureAdminCompany()` and `seedSkoolSubscriptionForAdmin()` helpers in `test.beforeAll`
- If seeding fails (e.g., service role key missing), tests will fall back to mocks

### 3. Authentication Cache Interference
- The auth hook caches companies for 1 minute; use `clearAuthCache()` helper before tests
- The helper skips non-HTTP URLs (e.g., `about:blank`) to avoid security errors

### 4. Mocking External Dependencies
- Skool subscription verification: use `mockSkoolVerification(page)`
- Company creation: use `mockCompaniesInsert(page)` to bypass Skool trigger
- User companies RPC: use `mockUserCompaniesRPC(page)` to provide test companies
- Always apply mocks **before** navigating to pages that make RPC calls

### 5. Role-Based Access Control (RBAC) Test Adjustments
- The actual RBAC behavior may differ from expectations; adjust test assertions based on observed behavior
- Use Playwright's headed mode (`npm run test:e2e:headed`) to visually debug access issues

### 6. Dev Server Port Mismatch
- By default, the dev server runs on port 3001, but may fall back to 8080/8081
- Set `PLAYWRIGHT_BASE_URL=http://localhost:8081` environment variable to match the dev server port
- Ensure the dev server is running before executing tests

### 7. CI Smoke Test Failures
- CI smoke tests should be deterministic; if they fail, check for:
  - Network timeouts (increase timeout in `playwright.config.ts`)
  - Missing wait conditions for page elements
  - External service dependencies (should be avoided in smoke tests)

## Debugging

- Failed tests generate traces, screenshots, and videos in `test-results/`
- Use `npx playwright show-trace` to analyze failures
- Check browser console logs in test output

## Project Configuration

The `playwright.config.ts` defines the following projects:

| Project | Purpose | Authentication |
|---------|---------|----------------|
| `ci-smoke` | CI smoke tests (deterministic) | None (public pages) |
| `chromium` | Default project (public pages) | None |
| `admin` | Admin role tests | `playwright/.auth/admin.json` |
| `technician` | Technician role tests | `playwright/.auth/technician.json` |
| `client` | Client role tests | `playwright/.auth/client.json` |
| `student` | Student role tests | `playwright/.auth/student.json` |

---
**Last Updated:** 2026-02-21  
**Node.js Version:** 20 (as defined in `.github/workflows/ci.yml`)
