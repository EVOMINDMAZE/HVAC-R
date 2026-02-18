# Buyer Validation Synthetic Results V3 (Proxy User Round)

## Scope
Round 3 proxy-user pass after V6 hero refinements, using:
- `output/playwright/ux/ux_run.mjs`
- `output/playwright/ux/tracking_verify.mjs`
- `output/playwright/ux/hero_viewport_check.mjs`
- `output/playwright/ux/accessibility_smoke.mjs`
- `output/playwright/ux/hero-density-audit-v2.json`
- `output/playwright/ux/page-density-audit-v2.json`

## Objective Signals (Current)
- Landing hero first-section words: `56`
- Landing first-section interactive targets: `8`
- Features first-section words: `90`
- Pricing first-section words: `78`
- Hero viewport checks: `pass`
- Tracking verification: `pass`
- Accessibility smoke (including reduced motion): `pass`

## Synthetic Sessions (5)

### 1) Owner / Manager (desktop)
- 3-second read: clear system promise and next action.
- CTA preference: `Book Ops Demo`.
- Objections:
  - Wants one line explaining implementation timeline.
  - Wants stronger proof of reliability/security for multi-crew operations.

### 2) Owner / Manager (mobile)
- 3-second read: clear headline and CTA.
- CTA preference: `Book Ops Demo`.
- Objections:
  - Wants pricing fit cue earlier than current scroll depth.
  - Wants one short statement about onboarding effort.

### 3) Technician / Lead Tech (desktop)
- 3-second read: sees field + engineering intent.
- CTA preference: `Start Free`.
- Objections:
  - Hero still feels office-leaning before field-first proof row.
  - Wants stronger "what tech gets today" line in first viewport.

### 4) Technician / Lead Tech (mobile)
- 3-second read: clear and scannable.
- CTA preference: `Start Free`.
- Objections:
  - Snapshot rows are useful but still dense for mobile first pass.
  - Wants faster visual differentiation between category rows.

### 5) Entrepreneur / New Shop (desktop)
- 3-second read: understands free-start path.
- CTA preference: `Start Free`.
- Objections:
  - Upgrade threshold is better but still wants one concrete example scenario.
  - Wants clearer "what is included free vs paid" in one short matrix.

## Additional Issues (Ranked)

### High severity
1. Features/Pricing hero sections still verbose versus landing.
   - Evidence: first-section words `90` and `78`.
2. Marketing header still carries high interaction load outside landing.
   - Evidence: header target count `10` on `/features` and `/pricing`.

### Medium severity
3. Field-tech credibility appears one row later than owner-ops messaging.
4. Upgrade trigger copy is present but not yet scenario-based.

### Low severity
5. Snapshot card density on mobile can be reduced by stronger row contrast and tighter copy.
6. Trust microcopy can be harmonized further across `/`, `/features`, and `/pricing`.

## Recommended Next Batch (V7 Focus)
- Apply hero word-count ceiling (`<=65`) to `/features` and `/pricing`.
- Add one short onboarding expectation line near demo CTA.
- Add one free-vs-ops micro matrix (3 rows max) directly above pricing section.
- Increase field-first emphasis in hero proof line order for technician resonance.

## Status
Round 3 complete. Hero-critical conversion blockers are reduced; remaining issues are now cross-page consistency and confidence detail, not first-screen clarity.
