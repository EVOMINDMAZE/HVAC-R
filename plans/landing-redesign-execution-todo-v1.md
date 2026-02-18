# Landing Redesign Execution TODO (All 5 Tracks)

## 1) Cross-page consistency pass
- [x] Align `/features` hero narrative to the same operations + engineering message used on landing.
- [x] Align `/pricing` hero narrative and CTA framing to free-start-first + ops demo secondary path.
- [x] Standardize marketing CTA naming to `Start Free` (primary) and `Book Ops Demo` (secondary).
- [x] Fix `Use Cases` nav behavior by anchoring to landing `#use-cases` and adding the section id.

## 2) Tracking verification
- [x] Verify landing hero primary click event.
- [x] Verify landing hero secondary click event.
- [x] Verify `landing_view_all_tools_click` event.
- [x] Verify pricing CTA event path.
- [x] Verify new `landing_hero_category_focus` event.
- [x] Persist report to `output/playwright/ux/tracking-verification.json`.

## 3) Performance + accessibility pass
- [x] Run viewport clipping/overflow checks for 1536x960, 1280x800, 390x844.
- [x] Ensure hero card has no internal scroll.
- [x] Confirm reduced-motion behavior disables transitions.
- [x] Confirm keyboard-first entry reaches skip link.
- [x] Add accessible labels to unnamed interactive controls.
- [x] Add async image decoding for non-critical landing media.
- [x] Persist reports:
  - `output/playwright/ux/hero-viewport-check.json`
  - `output/playwright/ux/accessibility-smoke.json`

## 4) Stability cleanup
- [x] Run repo-wide `npm run typecheck` and ensure green baseline.
- [x] Run `npm run test` and ensure green baseline.
- [x] Run `npm run build:client` and ensure production build success.
- [ ] Repo-wide lint cleanup deferred: current lint debt is broad and not limited to landing-critical scope.

## 5) Real buyer validation + focused V5
- [x] Keep buyer interview script as source of truth (`plans/buyer-validation-script-v1.md`).
- [x] Run 5 synthetic persona walkthroughs as interim signal while real interviews are pending.
- [x] Rank objections by conversion impact.
- [x] Apply one focused V5 iteration on hero comprehension.
- [x] Document synthetic findings in `plans/buyer-validation-synthetic-results-v1.md`.

