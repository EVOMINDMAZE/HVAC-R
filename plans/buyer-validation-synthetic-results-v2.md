# Buyer Validation Synthetic Results V2 (Proxy User Round)

## Scope
Second proxy-user panel run using the same 5-persona mix from `plans/buyer-validation-script-v1.md`, plus fresh UX automation evidence:
- `output/playwright/ux/ux_run.mjs`
- `output/playwright/ux/hero-density-audit-v2.json`
- `output/playwright/ux/page-density-audit-v2.json`

## Objective Signals
- Landing hero first section word count: `99`
- Landing first-section interactive targets: `10`
- Features first section word count: `90`
- Pricing first section word count: `78`
- Desktop/mobile hero CTA visibility: `pass`
- Tracking checks: `pass`
- Accessibility/reduced-motion smoke: `pass`

## Synthetic Sessions (5)

### 1) Owner/Manager (desktop)
- 3-second understanding: clear that this is ops + engineering.
- CTA preference: `Book Ops Demo`.
- Objections:
  - Too many things to read before the click.
  - Wants faster "what happens after demo" confidence cue.

### 2) Owner/Manager (mobile)
- 3-second understanding: clear main promise.
- CTA preference: `Book Ops Demo`.
- Objections:
  - Snapshot detail is below initial text and feels secondary.
  - Wants stronger ops-specific urgency cue near CTA.

### 3) Technician/Lead Tech (desktop)
- 3-second understanding: understands diagnostics + engineering fit.
- CTA preference: `Start Free`.
- Objections:
  - Capability panel still reads like a management panel first.
  - Wants stronger technician outcome language (fewer office words).

### 4) Technician/Lead Tech (mobile)
- 3-second understanding: headline and CTA are readable.
- CTA preference: `Start Free`.
- Objections:
  - Microcopy line under CTA still long for fast scanning.
  - Wants one visual cue that this is also for field execution.

### 5) Entrepreneur/New shop (desktop)
- 3-second understanding: sees free-start path.
- CTA preference: `Start Free`.
- Objections:
  - Unsure when exactly to move from free to ops.
  - Wants one clear milestone-based upgrade trigger.

## Additional Issues Found in Round 2

### High severity (blocks or delays first click)
1. Hero still exceeds ideal scan density for a 2-3 second decision.
   - Evidence: `99` words and `10` interactive targets in first section.
2. Header navigation still competes with conversion intent.
   - Evidence: `14-15` header interactive targets across key pages.
3. Role-specific urgency is still implicit, not explicit, at CTA moment.
   - Impact: owner/manager hesitates between start vs demo.

### Medium severity (reduces confidence)
4. Field-tech proof is present but less prominent than ops proof in hero hierarchy.
5. Upgrade trigger language is not milestone-driven enough (still generic "when you scale").
6. Capability snapshot communicates breadth, but not enough "which outcome happens first" ordering.

### Low severity (polish)
7. Supporting copy rhythm between landing/features/pricing is aligned but still verbose for speed-reading.
8. Trust strip chips are factual but can be more differentiated (current chips read similarly).

## Frequency x Severity Ranking
1. Hero scan density (`4/5`, high)
2. CTA decision clarity by role (`4/5`, high)
3. Header distraction load (`3/5`, high)
4. Upgrade trigger ambiguity (`3/5`, medium)
5. Technician prominence (`2/5`, medium)

## What to Fix Next (single batch)
- Reduce landing hero copy by another 20-30% and keep max 8 hero interactive targets.
- Collapse header links on marketing pages to a tighter set during hero exposure.
- Add role-switch helper near CTA:
  - "Owner/Manager: Book Ops Demo"
  - "Tech/Entrepreneur: Start Free"
- Add one milestone-based upgrade trigger sentence with concrete threshold language.
- Reorder capability snapshot detail so first line is immediate operational outcome, second line tools.

## Status
Round 2 complete. Additional blockers documented and ready for one combined implementation pass.
