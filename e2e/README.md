# Playwright E2E Tests

## Overview

End-to-end tests are organized by user role to test authenticated workflows:

- **admin/** - Admin-only functionality (team management, client management)
- **technician/** - Technician workflows (dispatch, job assignments)
- **client/** - Client portal features (asset viewing, requests)
- **student/** - Learning tools access
- **shared/** - Cross-role tests (authentication, navigation)
- **helpers/** - Shared utilities (authentication helpers)

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

Tests run automatically in CI with persisted authentication states. Ensure `PLAYWRIGHT_BASE_URL` is set correctly for your environment.

## Writing New Tests

1. Place tests in the appropriate role directory
2. Use `loginAs` helper for authentication
3. Include both positive (authorized access) and negative (unauthorized access) tests
4. Use descriptive test names that include the role and functionality
5. Follow existing patterns for consistency

## Debugging

- Failed tests generate traces, screenshots, and videos in `test-results/`
- Use `npx playwright show-trace` to analyze failures
- Check browser console logs in test output
