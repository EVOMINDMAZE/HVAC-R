# Funnel Tracking QA

Status: pass (source + runtime automation verified)

## Required Events
- landing_view
- landing_hero_primary_click
- landing_hero_secondary_click
- landing_view_all_tools_click
- landing_inventory_toggle
- landing_pricing_cta_click
- pricing_view
- pricing_plan_cta_click
- features_view
- features_primary_click
- features_secondary_click

## Checks Performed
- Source-of-truth: `client/lib/marketingAnalytics.ts`
- Event hooks verified in route pages using exact token checks:
  - `landing_view`: 1
  - `landing_hero_primary_click`: 3
  - `landing_hero_secondary_click`: 3
  - `landing_view_all_tools_click`: 1
  - `landing_inventory_toggle`: 1
  - `landing_pricing_cta_click`: 1
  - `pricing_view`: 1
  - `pricing_plan_cta_click`: 3
  - `features_view`: 1
  - `features_primary_click`: 2
  - `features_secondary_click`: 2
- UX smoke run: hero/inventory/pricing navigation succeeded without console errors.
- Added runtime event sink fallback in `client/lib/marketingAnalytics.ts`:
  - `window.dataLayer` auto-init
  - `window.__MARKETING_EVENTS__` auto-init and push
  - `sessionStorage.__MARKETING_EVENTS__` persistence for cross-route QA runs
- Browser automation run completed:
  - `output/playwright/ux/tracking_verify.mjs`
  - `output/playwright/ux/tracking-verification.json` (`TRACKING_PASSED=true`)

## Remaining Steps
- [x] Capture event payloads in browser QA sink (desktop).
- [x] Validate required events fire at least once per key interaction set.
- [ ] Validate production analytics backend receives events with expected payload fields.
- [ ] Run one additional mobile-only tracking capture pass in production-like environment.

## Blockers
- No blocker for local automation run after escalation-enabled browser launch.
- Production analytics ingestion still requires deployment-side verification.

## Quick Manual Script
1) Open landing (desktop, incognito). Click primary CTA, secondary CTA, inventory toggle (expand/collapse), “See full tool list”, pricing CTA.
2) Open pricing page; click each plan CTA.
3) Open features page; click hero CTAs.
4) Record `window.__MARKETING_EVENTS__` (if available) or network payloads in `plans/funnel-tracking-qa.md`.
