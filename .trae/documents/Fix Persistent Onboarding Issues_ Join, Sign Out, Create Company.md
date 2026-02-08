# Plan: Fix Persistent Onboarding Issues

## Issues Identified
1. **Join Organization button stays greyed out** - Validation RPC bug comparing boolean strings incorrectly
2. **Sign Out button not working** - Possible auth state listener or local state clearing issue
3. **Create Company flow not working** - Potential Skool verification failure or database constraint issue

## Root Causes
### 1. Join Organization Validation Bug
- **File**: `supabase/migrations/20260205200000_multi_company_core.sql`
- **Problem**: SQL functions `validate_invite_code` and `use_invite_code` compare JSON boolean values as text strings `'TRUE'`/`'FALSE'` instead of `'true'`/`'false'`
- **Impact**: Validation always returns `valid: false`, keeping the "INITIALIZE CONNECTION" button disabled
- **Fix**: Update string comparisons to use lowercase `'true'`/`'false'`

### 2. Sign Out Button Issue
- **File**: `client/hooks/useSupabaseAuth.tsx` and `client/components/Header.tsx`
- **Potential Causes**:
  - `supabase.auth.signOut()` not triggering auth state change
  - Local state not clearing properly
  - Event handler binding issue
- **Investigation Needed**: Browser console logs, network requests, auth listener debugging

### 3. Create Company Flow Issues
- **Files**: `client/pages/CreateCompany.tsx`, `supabase/migrations/20260205210000_skool_integration.sql`
- **Potential Causes**:
  - `verify_skool_subscription` RPC returns `false` (user not subscribed)
  - `companies` table `UNIQUE(user_id)` constraint still exists (should be dropped)
  - Insertion error due to missing columns or RLS policies
- **Investigation Needed**: Check Skool subscriptions table, verify constraint removal, test insertion directly

## Implementation Steps

### Phase 1: Fix Join Organization Validation
1. **Update SQL Functions**:
   - Modify `validate_invite_code` to compare `v_invite->>'valid' = 'true'`
   - Modify `use_invite_code` to compare `v_validation->>'valid' != 'true'`
   - Update both functions in the latest migration file
2. **Test Validation**:
   - Use browser dev tools to verify RPC returns `valid: true` for valid invite codes
   - Confirm UI button becomes enabled when validation passes
3. **Verify End-to-End Join Flow**:
   - Test with a valid invite code from `invite_codes` table
   - Ensure role-based redirection works correctly

### Phase 2: Fix Sign Out Functionality
1. **Add Debug Logging**:
   - Enhance `signOut` function with detailed console logs
   - Log Supabase auth response and auth state changes
2. **Verify Auth Listener**:
   - Check `onAuthStateChange` listener handles `SIGNED_OUT` event
   - Ensure local state (`companies`, `activeCompany`) clears properly
3. **Test Sign Out Flow**:
   - Click sign out button, monitor console for errors
   - Verify redirect to home page occurs
   - Confirm session is cleared (no authenticated requests possible)

### Phase 3: Fix Create Company Flow
1. **Verify Skool Subscription**:
   - Check `skool_subscriptions` table for test user data
   - If empty, create test subscription for development
   - Ensure `verify_skool_subscription` RPC returns `true`
2. **Confirm Constraint Removal**:
   - Verify `companies_user_id_key` constraint is dropped in database
   - Run direct SQL check if needed
3. **Test Company Creation**:
   - Submit create company form with valid name
   - Monitor network requests for errors
   - Verify company appears in `companies` table and user roles
4. **Handle Edge Cases**:
   - Form validation for empty company name
   - Error messaging for Skool verification failure

### Phase 4: Browser-Based Verification
1. **Use Playwright/DevTools**:
   - Inspect UI state and console errors
   - Monitor network requests to identify failed RPC calls
   - Take screenshots for visual confirmation
2. **Test All Three Flows**:
   - Join organization with valid code
   - Sign out from authenticated state
   - Create new organization (with Skool subscription)

### Phase 5: End-to-End Testing
1. **Run Existing E2E Tests**:
   - Execute `multi-company.spec.ts` and `auth.spec.ts`
   - Ensure no regressions in other functionality
2. **Manual Verification**:
   - Walk through complete user onboarding journey
   - Verify role-based routing works correctly

## Success Criteria
- ✅ Join Organization button enables when valid 8-character code entered
- ✅ "INITIALIZE CONNECTION" successfully joins company and redirects
- ✅ Sign Out button clears session and redirects to home page
- ✅ Create Company form creates organization and redirects to dashboard
- ✅ No console errors during any of these flows

## Risks & Mitigation
- **Risk**: SQL migration may not apply immediately
  - **Mitigation**: Run migration check script, verify function definitions
- **Risk**: Skool subscription requirement blocks testing
  - **Mitigation**: Temporarily bypass or seed test subscription data
- **Risk**: Auth state inconsistencies between local and Supabase
  - **Mitigation**: Enhanced logging and state synchronization checks

## Estimated Effort
- **High Priority Fixes**: 1-2 hours
- **Testing & Verification**: 1 hour
- **Total**: 2-3 hours

This plan addresses all three persistent issues with targeted fixes and systematic verification.