## Overview
Complete redesign of the user onboarding and organization creation system to eliminate token complexity, implement three-tier subscriptions, automate Skool integration, and simplify the user journey.

## Current System Analysis
- **Token-based invitation system**: 8-character codes stored in `invite_codes` table with validation/redemption RPC functions
- **Organization selection flow**: Separate "Join Team" vs "Create Organization" paths causing navigation deadlock
- **Subscription tiers**: Existing `free`, `pro`, `enterprise` tiers with seat limit enforcement
- **Skool integration**: `skool_subscriptions` table and verification functions, currently required for company creation
- **Invitation management**: Supabase Auth email invites + custom invite codes

## Proposed Architecture

### 1. Remove Token-Based Invitation System
- **Drop** `invite_codes` table and related RPC functions (`validate_invite_code`, `use_invite_code`, `create_invite_code`)
- **Remove** all UI components referencing invite codes (JoinCompany.tsx, code parameters in SignUp.tsx)
- **Keep** Supabase Auth email invitation system for backward compatibility

### 2. Implement Direct Invitation Link System
- **Create** `invitation_links` table:
  ```sql
  id UUID PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  company_id UUID REFERENCES companies,
  role TEXT CHECK (role IN ('admin', 'manager', 'tech', 'client')),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER DEFAULT 1,
  current_uses INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ DEFAULT NOW()
  ```
- **New RPC functions**: `create_invitation_link`, `validate_invitation_link`, `use_invitation_link`
- **Frontend route**: `/invite/{slug}` validates link and redirects to signup/login with auto-join
- **Admin UI**: Generate shareable links with role assignment and usage limits

### 3. Three-Tier Subscription Model
- **Rename tier**: Change `enterprise` → `business` in `subscription_tier` CHECK constraint
- **Seat limits per tier** (as specified):
  - Free: 3 seats
  - Pro: 1 seat (consider revisiting based on business needs)
  - Business: 10 seats
- **Update** `seat_limit` column default logic to map from subscription tier
- **Feature gating**: Update existing feature checks to use `subscription_tier`

### 4. Automated Skool Integration
- **Create Skool webhook endpoint** (new Edge Function) to receive subscription events
- **On Skool subscription**:
  - Create/update `skool_subscriptions` record
  - If user has no company: auto-create organization with Business tier
  - Send welcome email with direct signup link
  - Pre-configure organization settings based on Skool community data
- **Remove Skool requirement** from company creation flow (CreateCompany.tsx)
- **Business tier assignment**: Automatically grant Business tier to Skool subscribers

### 5. Simplified Organization Selection Flow
- **Remove** "Join a Team" vs "Create Organization" choice from SelectCompany.tsx
- **New user flow**:
  - Sign up → Check for invitation link → If present, join company
  - If no invitation: auto-create company (Free tier, or Business tier if Skool subscriber)
  - Redirect directly to dashboard
- **Existing users**: Show company switcher only if they have multiple companies
- **Eliminate navigation deadlock** by removing the choice architecture

### 6. Invitation Management System
- **Enhance** existing InviteTeam.tsx to generate shareable links alongside email invites
- **Seat limit enforcement**: Prevent creating invitations when seat limit reached
- **Link management**: View active links, revoke, track usage
- **Email invitations**: Continue using Supabase Auth `inviteUserByEmail` for direct email invites

### 7. Seamless User Journeys
- **New users**: Signup → Auto-create org → Access appropriate tier
- **Existing users**: Login → Access their organization → Manage team
- **Invited users**: Click link → Signup/login → Auto-join company → Dashboard

## Implementation Phases

### Phase 1: Database Migrations (Day 1)
1. Create migration to drop `invite_codes` and related functions
2. Create `invitation_links` table
3. Update `subscription_tier` constraint and seat limit defaults
4. Update RLS policies

### Phase 2: Backend RPC & Edge Functions (Day 2)
1. Implement new invitation link RPC functions
2. Update seat limit checking logic
3. Create Skool webhook Edge Function
4. Update Stripe webhook for tier mapping

### Phase 3: Frontend UI Overhaul (Day 3-4)
1. Remove JoinCompany page, create InviteLink redemption page
2. Update SignUp flow for auto-company creation
3. Simplify SelectCompany page
4. Update CreateCompany page (remove Skool requirement)
5. Enhance InviteTeam page with link generation

### Phase 4: Integration & Testing (Day 5)
1. Write migration script for existing invite codes
2. Update E2E tests for new flows
3. Test Skool webhook integration
4. Validate seat limit enforcement
5. Run comprehensive test suite

## Files to Modify/Create
**Database Migrations:**
- New migration file for schema changes
- Update existing seat limits migration

**Backend:**
- Supabase RPC functions (new and modified)
- Edge Functions: `invite-user` updates, new `skool-webhook`
- Server routes: subscription updates

**Frontend:**
- `client/pages/JoinCompany.tsx` → replace with `InviteLink.tsx`
- `client/pages/SignUp.tsx` → add auto-company creation logic
- `client/pages/SelectCompany.tsx` → simplify UI
- `client/pages/CreateCompany.tsx` → remove Skool verification
- `client/pages/InviteTeam.tsx` → add link generation
- `client/hooks/useSupabaseAuth.tsx` → update company fetching logic

## Risks & Mitigations
- **Data migration**: Existing invite codes must be converted to links → create backup script
- **User experience**: Changing familiar flows may confuse existing users → provide clear guidance
- **Skool integration**: Webhook reliability → implement retry logic and logging
- **Testing**: Comprehensive E2E testing required to ensure no regression

## Success Metrics
- Elimination of all token generation/validation code
- Successful Skool subscription → Business tier auto-provisioning
- Seat limits correctly enforced per tier
- New users can sign up and access organization without manual selection
- Existing users experience no disruption

This plan delivers a streamlined onboarding experience, automated Skool integration, and clear tier-based access control while eliminating token complexity.