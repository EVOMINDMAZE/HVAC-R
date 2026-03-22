# Implementation Plan: Light Mode Refinement & "Technical Blue" Pivot

**Status:** Draft
**Design Document:** `plans/2026-03-22-light-mode-refinement-design.md`
**Task Complexity:** Medium

## 1. Plan Overview
This plan executes a surgical makeover of the ThermoNeural Light Mode. We pivot the primary accent from vibrant Cyan to a professional Technical Blue/Teal and purge inconsistent generic grays in favor of a refined "Steel" industrial palette.

- **Total Phases**: 5
- **Agents Involved**: `ux_designer`, `coder`, `tester`, `code_reviewer`
- **Estimated Effort**: 2-3 hours

## 2. Dependency Graph
```
Phase 1: Foundation (Tokens & Config)
    |
Phase 2: Core UI Polish (Buttons & Badges)
    |
Phase 3: Dashboard & Visualizations (The Technical Blue Pivot)
    |
Phase 4: Global Gray Purge (Neutrals & Docs)
    |
Phase 5: Validation (UX Suite Pass)
```

## 3. Execution Strategy Table

| Phase | Stage | Agent | Mode | Parallel? |
|-------|-------|-------|------|-----------|
| 1 | Foundation | `coder` | Sequential | No |
| 2 | Core UI | `ux_designer` | Sequential | No |
| 3 | Dashboard | `ux_designer` | Sequential | No |
| 4 | Gray Purge | `coder` | Sequential | No |
| 5 | Validation | `tester` | Sequential | No |

## 4. Phase Details

### Phase 1: Foundation (Tokens & Config)
**Objective**: Establish the new "Polish" variables in `global.css` and extend the Tailwind theme.

- **Agent**: `coder`
- **Files to Modify**:
  - `client/global.css`: Define `--light-brand-accent` (Technical Blue HSL) and `--light-neutral-focus` (Refined Steel HSL) in the `:root` block. Ensure they are isolated using `:root:not(.dark)`.
  - `tailwind.config.ts`: Add `light-accent` and `light-neutral` to the `colors` extension.
- **Validation**: 
  - `npm run typecheck`
  - Verify variables are injectable via browser devtools.

### Phase 2: Core UI Polish (Buttons & Badges)
**Objective**: Refine the basic building blocks of the UI using the new tokens.

- **Agent**: `ux_designer`
- **Files to Modify**:
  - `client/components/ui/buttonVariants.ts`: Update 'default' and 'outline' variants to use `light-accent` when in light mode.
  - `client/components/ui/badgeVariants.ts`: Refine badge contrast.
- **Validation**: 
  - Visual check of all button states in Light Mode.
  - Confirm Dark Mode buttons remain unchanged.

### Phase 3: Dashboard & Visualizations (The Technical Blue Pivot)
**Objective**: Update the high-visibility "HUD" elements in Light Mode.

- **Agent**: `ux_designer`
- **Files to Modify**:
  - `client/pages/ClientDashboard.tsx`: Replace hardcoded `cyan-500` and `slate-100` with semantic tokens.
  - `client/components/CycleVisualization.tsx`: Refine SVG stroke colors and overlay backgrounds for better light-mode clarity.
- **Validation**: 
  - Visual regression audit of the dashboard.
  - Snapshot comparison of visualizations.

### Phase 4: Global Gray Purge (Neutrals & Docs)
**Objective**: Systematically eliminate generic grays.

- **Agent**: `coder`
- **Files to Modify**:
  - `client/components/CalculationDetailsModal.tsx`: Replace `gray-700/500` with themed steel scales.
  - `client/components/DocsViewer.tsx`: Refine documentation typography contrast.
  - `client/components/ErrorBoundary.tsx`: Update fallback UI colors.
- **Validation**: 
  - `grep -r "gray-" client/` (should show significant reduction).

### Phase 5: Validation (UX Suite Pass)
**Objective**: Final technical and visual sign-off.

- **Agent**: `tester`
- **Tasks**:
  - Execute `npm run test:ux:suite`.
  - Manual audit of contrast ratios on primary text using AXE or similar.
- **Validation**: 
  - 100% pass rate on `test:ux:a11y`.

## 5. Cost Estimation

| Phase | Agent | Model | Est. Input | Est. Output | Est. Cost |
|-------|-------|-------|-----------|------------|----------|
| 1 | `coder` | Pro | 5K | 1K | $0.09 |
| 2 | `ux_designer` | Pro | 8K | 2K | $0.16 |
| 3 | `ux_designer` | Pro | 12K | 3K | $0.24 |
| 4 | `coder` | Pro | 10K | 2K | $0.18 |
| 5 | `tester` | Pro | 15K | 1K | $0.19 |
| **Total** | | | **50K** | **9K** | **$0.86** |

## 6. Risk Classification

| Phase | Risk | Level | Rationale |
|-------|------|-------|-----------|
| 3 | Data Vis Clarity | MEDIUM | Changing visualization colors can impact functional legibility of charts. |
| 4 | Selective Omission | LOW | Generic grays are widespread; some might be missed in this turn. |

## 7. Execution Profile
- Total phases: 5
- Parallelizable phases: 0 (Strict sequential order to ensure visual consistency)
- Estimated wall time: 2.5 hours

Note: Native parallel execution is disabled for this session to prioritize visual precision over speed.
