# Overview
After analyzing the current user journey for account creation and invite acceptance, I've identified several pain points and opportunities for improvement. This plan outlines a streamlined experience that reduces steps, eliminates confusion, and provides a seamless onboarding flow.

## Current State Analysis

### Existing Flows
1. **Sign-up without invite**: Form → dashboard redirect → auto-company creation → select-company page → dashboard
2. **Sign-up with invite**: Form → join-company page → validation → company join → select-company page → dashboard
3. **Sign-in**: Form → role-based redirect → possible company selection → dashboard
4. **Invite acceptance (authenticated)**: Join-company page → validation → join → redirect

### Key Issues Identified
- Race condition in auto-company creation (partially fixed)
- Duplicate invite acceptance components (`JoinCompany.tsx` vs `InviteLink.tsx`)
- Inconsistent role mapping and role-based routing
- No handling for email confirmation flows
- Google OAuth users don't get auto-company creation
- Multiple redirects causing slow experience
- Remnant "skool" references in codebase
- Complex ProtectedRoute logic

## Proposed Improvements

### Phase 1: Foundation & Cleanup
1. **Consolidate invite acceptance**
   - Merge `JoinCompany.tsx` and `InviteLink.tsx` into single `AcceptInvite.tsx`
   - Create unified backend RPC `accept_invite` (or keep separate with shared validation)
   - Update routes: `/join-company` and `/invite/:slug` both use new component

2. **Remove skool references**
   - Clean up `skool_subscription_required` from database schema
   - Remove skool checks from validation functions and UI

3. **Standardize role system**
   - Define canonical roles: `admin`, `manager`, `technician`, `client`, `owner`
   - Map `tech` → `technician` consistently
   - Update `UserRole` type and all role checks

### Phase 2: Streamlined Onboarding Logic
4. **Centralized auto-company creation service**
   - Extract logic from `SelectCompany.tsx` into `useAutoCompanyCreation` hook
   - Trigger automatically after first sign-up/sign-in when user has zero companies
   - Handle race conditions with robust locking (already improved)

5. **Email confirmation handling**
   - Add `EmailConfirmation` page for post-sign-up flow
   - Integrate with Supabase email confirmation status
   - Allow resend confirmation email

6. **Google OAuth company creation**
   - Detect first-time OAuth sign-in via `user.created_at` or metadata
   - Trigger auto-company creation for new OAuth users

### Phase 3: Improved Routing & Navigation
7. **Role-based routing hook**
   - Create `useRoleRedirect()` that returns appropriate target path based on active company role
   - Use in ProtectedRoute and sign-in/sign-up navigation

8. **Simplify ProtectedRoute**
   - Refactor decision tree: auth → company selection → role routing
   - Eliminate multiple redirects by computing final destination once
   - Add loading skeletons instead of full-page spinners

9. **Eliminate unnecessary redirects**
   - Skip SelectCompany page when user has exactly one company
   - Remember last active company via user metadata
   - Direct navigation to appropriate dashboard after sign-in

### Phase 4: Enhanced User Experience
10. **Unified invite flow**
    - Single page with clear validation feedback
    - Preview company and role before joining
    - Success toast with option to switch context immediately

11. **Welcome onboarding guide**
    - Optional guided tour for new users
    - Highlight key features based on role
    - Can be dismissed

12. **Improved loading states**
    - Skeleton screens for dashboard loading
    - Progressive enhancement for company fetching

## Technical Implementation Details

### Backend Changes
- Update `validate_invite_code` and `validate_invitation_link` to return consistent schema
- Consider merging into single function with type parameter
- Ensure seat limit enforcement works correctly
- Add logging for onboarding events

### Frontend Changes
- New hooks: `useAutoCompanyCreation`, `useRoleRedirect`
- Consolidated components: `AcceptInvite`, `EmailConfirmation`
- Updated `ProtectedRoute` logic
- Enhanced `SignIn`/`SignUp` to wait for role determination before navigation
- Add post-sign-up confirmation screen

### Database Migrations
- Remove `skool_subscription_required` column from `invite_codes`
- Ensure role enum consistency across tables
- Add optional onboarding completion flag to user metadata

## Expected Outcomes
- Reduced time-to-dashboard for new users (2-3 steps → 1-2 steps)
- Eliminated duplicate code and confusion
- Consistent role-based experience
- Better handling of edge cases (email confirmation, OAuth)
- Cleaner codebase ready for future features

## Risks & Mitigations
- **Risk**: Breaking existing invite links/codes
  - **Mitigation**: Keep backward compatibility with separate RPCs initially
- **Risk**: Complex refactoring of auth flow
  - **Mitigation**: Implement incrementally with thorough testing (existing E2E tests)
- **Risk**: Performance impact from additional hooks
  - **Mitigation**: Optimize re-renders with useCallback/memo

## Next Steps
1. Get approval for this plan
2. Implement Phase 1 (cleanup) first
3. Add comprehensive tests for new flows
4. Deploy incrementally with feature flags if needed

This plan will create a seamless user experience that matches modern SaaS onboarding expectations while maintaining the robust multi-company architecture.