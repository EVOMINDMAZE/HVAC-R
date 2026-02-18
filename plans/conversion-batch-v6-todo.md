# Conversion Batch V6 TODO (Work on All Blockers at Once)

## Goal
Implement one focused conversion batch that resolves all high-priority blockers found in synthetic round 2.

## Priority A: 2-3 second hero clarity
- [x] Reduce hero first-section words from ~99 to <=70.
- [x] Keep exactly one headline, one short subhead, and max 2 support lines.
- [x] Remove one non-critical hero interaction to bring first-section targets from 10 to <=8.
- [x] Keep CTA pair but add explicit role helper line directly below CTA row.

## Priority B: CTA decision confidence
- [x] Add role-specific CTA hint copy:
  - Owner/Manager -> Book Ops Demo
  - Tech/Entrepreneur -> Start Free
- [x] Add milestone-based upgrade trigger copy (e.g., job volume/team size threshold).
- [x] Keep CTA labels consistent on `/`, `/features`, `/pricing`.

## Priority C: Header distraction control
- [x] Marketing header: reduce visible links during first viewport (desktop) to key conversion paths only.
- [x] Keep full sitemap links accessible via compact menu/dropdown.
- [x] Ensure mobile menu remains complete and usable.

## Priority D: Snapshot and proof hierarchy
- [x] Reorder snapshot detail content to outcome-first then tools.
- [x] Make one field-first proof cue visually equal to ops proof near hero.
- [x] Tighten trust strip chips to avoid repetitive phrasing.

## Priority E: Verification
- [x] Re-run:
  - `node output/playwright/ux/tracking_verify.mjs`
  - `node output/playwright/ux/hero_viewport_check.mjs`
  - `node output/playwright/ux/accessibility_smoke.mjs`
  - `node output/playwright/ux/hero_density_audit_v2.mjs`
  - `node output/playwright/ux/page_density_audit_v2.mjs`
- [x] Pass criteria:
  - hero first-section words <= 70
  - first-section targets <= 8
  - no clipping/overflow across 1536x960, 1280x800, 390x844
  - required tracking events still pass

## Release Readiness
- [x] `npm run typecheck`
- [x] `npm run build:client`
- [x] `npm run test`
- [x] Capture final screenshots for desktop + mobile hero

## Current Verification Snapshot (2026-02-11)
- Hero density: `56` words, `8` visible interactive targets.
- Viewport checks: pass on `1536x960`, `1280x800`, `390x844`.
- Tracking checks: pass, including `landing_view_all_tools_click` and `landing_hero_category_focus`.
- Accessibility smoke: pass (skip link, naming, reduced-motion behavior).
