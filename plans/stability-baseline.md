# Stability Baseline

Last updated: 2026-03-13

## Remaining Tasks 8-10
- [x] Task 8: Auth/session edge cases and cache invalidation hardening.
- [x] Task 9: CSP compatibility updates and Fast Refresh/lint hotspot cleanup.
- [x] Task 10: RBAC/privacy/vulnerability automation command and CI workflow coverage.

## Verification Commands
- `npm run lint` → pass (0 errors, 0 warnings).
- `npm run typecheck` → fail on pre-existing unrelated issues in:
  - `client/components/dashboard/OpsMissions.test.ts`
  - `client/hooks/useDashboardCommandCenter.ts`
  - `client/components/PageContainer.tsx`
  - `server/routes/__tests__/auth.validation.test.ts`
- `npm run test -- server/utils/__tests__/supabase-auth-compat.test.ts server/middleware/__tests__/securityHeaders.test.ts` → pass (7 tests).
- `npm run test:policy:automation` → pass (38 tests across privacy/RBAC/security policy suites).

## Delivered Scope
- Auth middleware now handles malformed/whitespace/lowercase Bearer headers deterministically.
- Auth provider now clears stale company caches on sign-out, user changes, and company switches.
- Security headers are now active in server bootstrap with CSP report endpoint wired.
- CSP now allows websocket/dev connectivity and keeps upgrade-insecure-requests production-only.
- CI now includes a dedicated RBAC/privacy/security policy automation job.
- Lint hotspots addressed for Fast Refresh export patterns and previous parser/useless-assignment failures.
