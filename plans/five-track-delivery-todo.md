# Five-Track Delivery TODO (Execution Order)

## 1) Cross-page consistency pass
- [x] Align `/`, `/features`, `/pricing` to the same operations + engineering narrative.
- [x] Normalize CTA language to `Start Free` + `Book Ops Demo`.
- [x] Keep CTA destination logic consistent (`/signup`, `/contact`, `/pricing`).
- [x] Fix landing header `Use Cases` hash navigation reliability.
- [x] Keep route-backed tool terminology consistent with landing capability map.

Evidence:
- `client/pages/Landing.tsx`
- `client/pages/Features.tsx`
- `client/pages/Pricing.tsx`
- `client/components/Header.tsx`
- `client/hooks/useAppNavigation.tsx`

## 2) Tracking verification
- [x] Verify event wiring in source for landing/features/pricing CTA paths.
- [x] Add persistent QA sink in `sessionStorage` for multi-page event capture.
- [x] Run browser automation tracking verifier across key CTA interactions.
- [x] Confirm required events fire at least once in run.

Evidence:
- `client/lib/marketingAnalytics.ts`
- `client/lib/marketingAnalytics.test.ts`
- `output/playwright/ux/tracking_verify.mjs`
- `output/playwright/ux/tracking-verification.json`

## 3) Performance + accessibility pass
- [x] Respect `prefers-reduced-motion` in landing animations.
- [x] Keep focus-visible affordances on landing interactions.
- [x] Run desktop/mobile UX smoke screenshots and CTA usability checks.
- [x] Keep hero and pillar card behavior stable (no clipped/scrollable hero internals).
- [ ] Lighthouse score capture (blocked by environment package/network constraints).

Evidence:
- `client/pages/Landing.tsx`
- `client/landing.css`
- `output/playwright/ux/ux_run.mjs`
- `output/playwright/ux/01-hero-desktop.png`
- `output/playwright/ux/70-hero-mobile.png`

## 4) Stability cleanup
- [x] Re-run `typecheck`, `test`, and `build:client` after landing updates.
- [x] Document remaining lint baseline status.
- [ ] Eliminate all repo-wide lint errors (large pre-existing backlog, not limited to landing scope).

Evidence:
- `plans/stability-baseline.md`

## 5) Real buyer validation + focused V5/V53 iteration
- [x] Run five proxy non-purchase validation sessions (owner/manager/tech/entrepreneur mix).
- [x] Aggregate objections and define top iteration priorities.
- [x] Implement focused iteration changes:
  - setup/migration clarity in hero
  - stronger upgrade-path clarity
  - mobile field-proof module row
- [ ] Run external real-buyer sessions (recommended before final conversion lock).

Evidence:
- `plans/non-purchase-validation-report-v52.md`
- `plans/buyer-validation-exec-log.md`
- `client/pages/Landing.tsx`
