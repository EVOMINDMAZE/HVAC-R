# Funnel Tracking QA

Status: in-progress (events verified via code instrumentation; pipeline confirmation pending)

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
- Event hooks present at hero CTAs, inventory toggle, pricing CTAs, features CTAs.
- UX smoke run: hero/inventory/pricing navigation succeeded without console errors.

## Remaining Steps
- [ ] Capture event payloads in browser console (desktop + mobile).
- [ ] Validate no duplicate fires per interaction.
- [ ] Verify events received in analytics backend (or mock sink) with correct fields `{ section, destination, segment? }`.
- [ ] Document pass/fail with timestamps and URLs.

## Quick Manual Script
1) Open landing (desktop, incognito). Click primary CTA, secondary CTA, inventory toggle (expand/collapse), “See full tool list”, pricing CTA.
2) Open pricing page; click each plan CTA.
3) Open features page; click hero CTAs.
4) Record `window.__MARKETING_EVENTS__` (if available) or network payloads in `plans/funnel-tracking-qa.md`.
