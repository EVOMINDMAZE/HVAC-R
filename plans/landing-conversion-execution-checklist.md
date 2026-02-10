# Landing Conversion Execution Checklist

## Scope
- Cross-page consistency
- Tracking verification
- Performance + accessibility
- Stability cleanup
- Buyer validation + V5 iteration

## Status
- [x] Cross-page consistency pass
- [x] Tracking verification (instrumentation + browser event checks)
- [x] Performance + accessibility pass (core checks)
- [x] Stability cleanup (`npm run typecheck` baseline)
- [ ] Real buyer validation (requires user interviews)
- [ ] V5 iteration from buyer interview findings

## Completed Work

### 1) Cross-page consistency (`/features`, `/pricing`)
- Updated `/features` and `/pricing` narrative to a unified operations + engineering message.
- Standardized conversion CTAs to:
  - `Start Engineering Free`
  - `Book an Ops Demo`
- Verified page copy/CTA in browser audit:
  - `output/playwright/ux/cross-page-audit.json`

### 2) Tracking verification
- Added centralized marketing event helper:
  - `client/lib/marketingAnalytics.ts`
- Added unit tests:
  - `client/lib/marketingAnalytics.test.ts`
- Verified in browser:
  - Landing hero primary => `landing_hero_primary_click`
  - Landing hero secondary => `landing_hero_secondary_click`
  - Landing view-all-tools => `landing_view_all_tools_click`
  - Pricing primary CTA => `pricing_plan_cta_click`
  - Features primary/secondary => `features_primary_click`, `features_secondary_click`
- Evidence:
  - `output/playwright/ux/landing-audit.json`
  - `output/playwright/ux/cross-page-audit.json`

### 3) Performance + accessibility pass
- Hero media behavior:
  - Reduced-motion users get image fallback instead of autoplay video.
  - Media uses poster and metadata preload.
- Focus visibility styles added on landing interactions.
- Verified:
  - No hero internal scroll on desktop.
  - No desktop/mobile horizontal overflow.
  - Mobile CTA stack behavior is correct.
  - Skip link receives keyboard focus first.
- Evidence:
  - `output/playwright/ux/landing-desktop-viewport.png`
  - `output/playwright/ux/landing-desktop-full.png`
  - `output/playwright/ux/landing-mobile-viewport.png`
  - `output/playwright/ux/landing-mobile-full.png`
  - `output/playwright/ux/landing-desktop-reduced-motion.png`
  - `output/playwright/ux/landing-audit.json`

### 4) Stability cleanup
- Fixed baseline type issues across frontend/server observability and middleware typing.
- Fixed docs and podcasts TypeScript issues.
- Fixed privacy route tests for handler signatures.
- Result:
  - `npm run typecheck` passes.

## Open Work (Needs Your Input/Coordination)

### 5) Real buyer validation (required to complete this checklist)
- Recruit 5 participants:
  - 2 owners/managers
  - 2 technicians/lead techs
  - 1 entrepreneur/new shop
- Script:
  - 3-second clarity test
  - CTA choice test
  - Objection capture
  - Pricing-fit comprehension
- Output format:
  - Objections list (ranked by frequency/severity)
  - Confusion points map (section + quote)
  - Suggested copy/design deltas for V5

### 6) V5 iteration
- Build one focused V5 release from top 3 interview objections.
- Re-run same landing audit and CTA event checks.

