# Complete Implementation Plan: Onboarding Redesign with Testing

## Current Status
✅ **Completed:**
- Database migration SQL file created (`20260207200000_redesign_onboarding.sql`)
- Invitation link redemption page created (`InviteLink.tsx`)

⚠️ **Pending Implementation:**
- App.tsx routing updates
- SignUp flow modification  
- SelectCompany page simplification
- InviteTeam page updates
- CreateCompany page Skool removal
- Database migration application
- Testing and validation

## Phase 1: Core Implementation (Immediate)

### 1. Update App.tsx Routing
**Changes:**
- Replace `/join-company` route with `InviteLink` component
- Add new route `/invite/:slug` for direct invitation links
- Update ProtectedRoute logic to reference new routes
- Ensure backward compatibility: `/join?code=` should still work via query param handling in InviteLink.tsx

**Files:** `client/App.tsx`

### 2. Update SignUp Flow for Auto-Company Creation
**Changes:**
- Modify `SignUp.tsx` to auto-create company when user signs up without invitation
- Remove navigation to `/join-company` when no invite code
- Instead, create company automatically with Free tier (3 seats)
- Update to use new RPC function for company creation

**Files:** `client/pages/SignUp.tsx`

### 3. Simplify SelectCompany Page
**Changes:**
- Remove the "Join a Team" vs "Create Organization" choice cards
- Show only the companies list for users with existing companies
- For users with zero companies: auto-create Free tier company (handled in SignUp)
- Update UI to be cleaner and focused

**Files:** `client/pages/SelectCompany.tsx`

### 4. Update InviteTeam Page
**Changes:**
- Replace `create_invite_code` RPC with `create_invitation_link`
- Update UI to show invitation links instead of codes
- Update copy functionality to share full URLs
- Maintain same role selection, expiration, and usage limits

**Files:** `client/pages/InviteTeam.tsx`

### 5. Remove Skool Verification from CreateCompany Page
**Changes:**
- Remove `verify_skool_subscription` RPC call
- Remove Skool verification loading states
- Update UI to show subscription tier-based creation limits
- Allow company creation based on subscription tier seat limits

**Files:** `client/pages/CreateCompany.tsx`

## Phase 2: Database Migration

### 1. Apply Migration
**Steps:**
- Run `supabase db push` once network connectivity is restored
- Verify migration applies successfully
- Test new RPC functions in Supabase dashboard

**File:** `supabase/migrations/20260207200000_redesign_onboarding.sql`

## Phase 3: Comprehensive Testing

### 1. Unit Tests
- Run `npm test` to execute existing Vitest unit tests
- Update `useSupabaseAuth.test.ts` to test new invitation link logic
- Create new tests for InviteLink component if needed
- Fix any test failures due to API changes

### 2. E2E Tests
- Run `npm run test:e2e` to execute Playwright tests
- Update `onboarding-flow.spec.ts`:
  - Update "Join Company page works with valid invite code" test to use invitation links
  - Add test for `/invite/:slug` route
  - Update test for auto-company creation in SignUp flow
- Run full test suite to validate all user journeys still work

### 3. Manual Testing Checklist
- [ ] Sign up without invitation → auto-creates company
- [ ] Sign up with invitation link → joins company
- [ ] Direct `/invite/:slug` link works
- [ ] InviteTeam page generates invitation links
- [ ] CreateCompany page works without Skool verification
- [ ] SelectCompany page shows clean company list
- [ ] Role-based redirection still works
- [ ] Subscription tier seat limits enforced

## Phase 4: Future Integration (Post-MVP)

### 1. Skool Webhook Edge Function
- Create Edge Function to handle Skool subscription webhooks
- Auto-update user Skool subscription status
- Trigger company creation for verified members

### 2. Stripe Webhook Updates
- Update existing Stripe webhook to set `subscription_tier` and `seat_limit`
- Map Stripe plans to tiers: Free (3), Pro (1), Business (10)

### 3. Edge Function Updates
- Update `invite-user` Edge Function to generate invitation links

## Risk Assessment

### Breaking Changes
1. **Backward Compatibility**: Existing invitation codes will be migrated to slugs, maintaining 8-character format
2. **URL Changes**: `/join-company` → `/invite` with slug parameter
3. **API Changes**: RPC functions renamed but similar signatures

### Migration Strategy
- Data migration preserves existing invitations
- Graceful degradation: Old invite codes continue to work via migration
- UI maintains similar patterns for user familiarity

## Success Criteria
1. All existing tests pass
2. New invitation link system works end-to-end
3. Auto-company creation for new users
4. Simplified user onboarding flow
5. Subscription tier seat limits enforced

## Estimated Effort
- **Phase 1**: 2-3 hours implementation
- **Phase 2**: 30 minutes (dependent on network)
- **Phase 3**: 1-2 hours testing and fixes
- **Total**: 4-6 hours

Ready to begin implementation once plan is approved.