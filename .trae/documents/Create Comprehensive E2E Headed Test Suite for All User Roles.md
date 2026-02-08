## Overview
Create a comprehensive end-to-end test suite that runs in headed browser mode to test all user roles (admin, technician, client, student, manager) with a focus on company creation and joining flows using tokens/invite codes.

## Detailed Plan

### 1. Analysis & Setup
- Review existing E2E tests (`e2e/`) to identify coverage gaps for each role.
- Decide on mocking strategy for Skool verification (`verify_skool_subscription` RPC) to enable company creation tests without actual subscriptions.
- Add npm script `test:e2e:headed` to run Playwright with `--headed` flag.

### 2. Skool Verification Mocking Helper
- Create a helper function `mockSkoolVerification(page: Page)` that intercepts calls to the Supabase RPC endpoint for `verify_skool_subscription` and returns `true`.
- The helper will use Playwright's `page.route` to mock the network request.
- Ensure the mock can be conditionally applied per test.

### 3. Comprehensive Test Suite: `e2e/all-users-journey.spec.ts`
- Single test file that orchestrates sequential user journeys:
  - **Admin Flow**:
    - Login as admin, verify dashboard.
    - Enable Skool mock, navigate to `/create-company`, create a new company.
    - Generate invite codes for technician and client roles via UI (`/invite-team`).
    - Create a test job (reuse existing job creation pattern).
  - **Technician Flow**:
    - Login as technician (or new user), redeem invite code via `/join-company`.
    - Verify company assignment and access to technician-specific pages (`/tech`, `/dashboard/jobs`).
    - View and update job status.
  - **Client Flow**:
    - Login as client (or new user), redeem invite code.
    - Verify client portal access (`/dashboard`, `/clients`).
    - Submit a service request (if UI exists).
  - **Student Flow**:
    - Login as student, verify access to learning tools (`/diy-calculators`, `/standard-cycle`, etc.).
    - Negative tests for restricted pages (dashboard, dispatch).
  - **Manager Flow** (if applicable):
    - Login as manager, verify company management capabilities.
- Ensure tests are isolated and clean up test data where possible.

### 4. Enhance Existing Role‑Based Tests
- Update existing test files (`admin/`, `technician/`, `client/`, `student/`) to optionally use the Skool mocking helper where needed.
- Ensure consistency with new helper functions and improve robustness.

### 5. Playwright Configuration Update
- Add a new project `headed` in `playwright.config.ts` that duplicates existing role‑based projects but sets `headless: false`.
- Alternatively, rely on the CLI flag `--headed` without modifying the config (simpler). Document the recommended command.

### 6. Documentation
- Update `e2e/README.md` with instructions for running headed tests and explanation of Skool mocking.
- Add a section about the new comprehensive test suite.

### 7. Validation
- Run the new test suite in headed mode to visually verify browser interactions.
- Ensure all tests pass and no regressions in existing tests.

## Deliverables
1. New helper for Skool RPC mocking.
2. Comprehensive test file `e2e/all-users-journey.spec.ts`.
3. Updated npm script `test:e2e:headed`.
4. Updated documentation.
5. Successful execution of the new test suite in headed mode.