# Design Document: Light Mode Refinement & "Technical Blue" Pivot

**Status:** Approved
**Design Depth:** Deep
**Task Complexity:** Medium

## 1. Problem Statement
The ThermoNeural frontend currently suffers from significant UI/UX inconsistencies in Light Mode, specifically around the lack of contrast for the brand cyan and "senseless" hardcoded gray areas. This undermines the "Precision Engineering Hub" identity.

## 2. Requirements

### Functional
- **REQ-1 (Teal Pivot)**: Pivot primary light mode accent from Cyan to deep Technical Blue/Teal for high-intent actions.
- **REQ-2 (Gray Purge)**: Replace hardcoded `gray-*` classes with themed neutrals.
- **REQ-3 (Contrast AA)**: All new pairings must meet WCAG 2.1 AA (4.5:1).

### Non-Functional
- **REQ-4 (Dark Mode Integrity)**: Dark mode HUD must remain 100% unchanged.
- **REQ-5 (Visual Cohesion)**: Maintain brand identity during the pivot.

### Constraints
- **CON-1**: Implement at the component level to avoid cascading regressions.

## 3. Selected Approach (Surgical Utility Variables)
Introduce a targeted "Polish" layer in the CSS variable system specifically for light-mode contexts.

### Key Decisions
1. **Semantic "Polish" Tokens**: Define tokens like `--light-brand-accent` and `--light-neutral-focus` in `global.css`. (Rationale: Centralizes new palette, simplifies component logic).
2. **"Not-Dark" Selector Strategy**: Use `:root:not(.dark)` or similar logic. (Rationale: Direct preservation of dark mode HUD).
3. **"Technical Hub" Grayscale**: Derived from the `steel` brand palette. (Rationale: Communicates precision).

## 4. Architecture

### global.css
- `:root`: Define new `--light-*` semantic tokens.
- `.dark`: Retain original values exactly.

### Tailwind Config
- Extend `tailwind.config.ts` with the new tokens (e.g., `text-light-accent`).

### Component Logic
- Identify `cyan` and `gray` usage via grep.
- Replace with the new semantic tokens surgically.

## 5. Risk Assessment
- **Risk 1: Selective Omission**: (Mitigation: Use exhaustive grep for `gray-`).
- **Risk 2: Color Collision**: (Mitigation: Verify new accent against status colors Red/Yellow/Green).
- **Risk 3: Build Overhead**: (Mitigation: Negligible impact on performance).

## 6. Success Criteria
- Primary buttons in light mode use high-contrast Technical Blue/Teal.
- No "senseless" generic gray areas remain in the UI.
- Dark mode HUD is identical to its state prior to these changes.
- `npm run test:ux:suite` passes with the new colors.
