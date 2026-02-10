# Landing V5 Iteration Plan

## Objective
Ship one focused conversion iteration after buyer validation with minimal scope and measurable impact.

## Inputs
- Interview notes from 5 sessions (`plans/buyer-validation-script-v1.md`)
- Event baseline from:
  - `output/playwright/ux/landing-audit.json`
  - `output/playwright/ux/cross-page-audit.json`

## V5 Change Budget
- Max 3 conversion changes.
- No backend or route changes.
- Keep CTA pair and analytics contract.

## Candidate Change Buckets

### 1) Hero clarity
- Tighten headline/subhead if users still miss “ops + engineering”.
- Keep sentence count and visual density unchanged.

### 2) Capability pillar trust
- Swap or reorder hero tool badges based on role confusion.
- Keep 5-row structure; only adjust tool emphasis.

### 3) Pricing comprehension
- Clarify plan-fit helper lines if users mis-pick track.
- Preserve existing plan actions and destinations.

## Acceptance Criteria
- 2-3 second clarity improved from baseline in follow-up checks.
- No increase in cognitive load above fold.
- CTA event firing unchanged:
  - `landing_hero_primary_click`
  - `landing_hero_secondary_click`
  - `landing_view_all_tools_click`
  - `landing_pricing_cta_click`

## Verification Checklist
- `npm run typecheck`
- `npx eslint` on touched files
- Playwright screenshots desktop/mobile
- Event checks for hero + pricing CTA

