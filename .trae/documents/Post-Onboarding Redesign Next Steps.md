# Post-Onboarding Redesign Implementation Plan

## Current Status
We have successfully implemented the onboarding redesign with:
- ✅ Direct invitation links (slugs) replacing 8-character codes
- ✅ Auto-company creation for users with zero companies (Free tier, 3 seats)
- ✅ Skool verification removed from frontend
- ✅ Database migration applied locally
- ✅ Key E2E tests updated and passing
- ✅ Backward compatibility maintained for existing `/join-company?code=` URLs

## Phase 1: Comprehensive E2E Testing & Fixes
**Objective**: Ensure the onboarding changes don't break existing user journeys

### Tasks:
1. **Run full E2E test suite**:
   ```bash
   PLAYWRIGHT_BASE_URL=http://localhost:8081 npx playwright test --reporter=line
   ```
2. **Fix any test failures**:
   - Update remaining E2E files with new terminology:
     - `live_navigation_verification.spec.ts` (references "invite code")
     - `multi-company.spec.ts` (references "invite code")
   - Update any other files referencing "Join Company" → "Join Organization"
3. **Clean up Skool references in test helpers**:
   - Review `e2e/helpers/seed-skool.ts`, `mock-skool.ts`, `seed-company.ts`, `mock-create-company.ts`
   - Determine if these are still needed or can be simplified
4. **Update scripts**:
   - `scripts/test_new_user_flow.ts` and `scripts/test_skool_rpc.ts` - assess if still needed

## Phase 2: Database Migration & Cleanup
**Objective**: Ensure database changes are properly deployed and remove Skool verification from backend

### Tasks:
1. **Apply migration to remote database** (once network connectivity restored):
   ```bash
   supabase db push
   ```
2. **Optional: Remove Skool verification from database functions**:
   - Examine `skool_gate` and `skool_integration` migrations
   - Determine if Skool verification still exists in `create_company` or other RPCs
   - Create migration to remove Skool checks if no longer needed
3. **Verify new RPC functions work correctly**:
   - Test `validate_invitation_link`, `use_invitation_link`, `create_invitation_link`

## Phase 3: Unit Test Improvements
**Objective**: Improve test coverage for critical components, especially authentication

### Tasks:
1. **Implement proper tests for `useSupabaseAuth` hook**:
   - Test cache behavior (1-minute TTL)
   - Test sign-in/sign-out flows
   - Test company switching and auto-company creation
   - Test multi-company authentication context
2. **Add unit tests for new components**:
   - `InviteLink.tsx` - invitation validation and redemption
   - `SelectCompany.tsx` - auto-company creation logic
3. **Run existing unit tests**:
   ```bash
   npm test
   ```

## Phase 4: Quality Assurance
**Objective**: Ensure code quality and perform manual validation

### Tasks:
1. **Run linting and type checking**:
   ```bash
   npm run lint
   npm run typecheck
   ```
2. **Manual testing of key flows**:
   - New user signup → auto-company creation
   - Existing user with zero companies → auto-company creation
   - Invitation link creation and redemption
   - Backward compatibility: `/join-company?code=ABC123`
3. **Cross-browser testing** (if applicable)

## Phase 5: Deployment
**Objective**: Safely deploy the changes

### Tasks:
1. **Create deployment checklist** based on test results
2. **Monitor for any regressions** post-deployment
3. **Update documentation** if needed (API changes, new invitation system)

## Success Criteria
- All E2E tests pass
- No TypeScript errors
- No linting warnings
- Manual verification of all onboarding flows
- Successful remote database migration

## Estimated Effort
- Phase 1: 2-3 hours (depending on test failures)
- Phase 2: 1 hour
- Phase 3: 3-4 hours
- Phase 4: 1-2 hours
- Phase 5: 1 hour

## Risks & Mitigations
- **Network connectivity issues**: Use local Supabase for testing, deploy migration when connectivity restored
- **Breaking changes in E2E tests**: Update test expectations incrementally
- **Skool verification dependencies**: Ensure no backend functions still require Skool checks

This plan provides a systematic approach to validate, clean up, and deploy the onboarding redesign changes while improving overall test coverage.