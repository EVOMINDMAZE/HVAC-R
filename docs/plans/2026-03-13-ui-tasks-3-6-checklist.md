# UI Task Checklist: Tasks 1-6

## Scope
- Signed-in operations pages
- Form and table state messaging
- Keyboard and retry interaction paths
- Focused UI verification

## Task Status
- [x] Task 1: Baseline signed-in UX smoke
- [x] Task 2: Future-monitor route audit coverage
- [x] Task 3: Audit pages for visual drift and state behavior
- [x] Task 4: Remove visual drift in high-touch form/list surfaces
- [x] Task 5: Unify form/table messaging and add retry paths
- [x] Task 6: Verify keyboard interaction paths and run focused UI tests

## Task 3 Audit Coverage
- [x] `client/pages/Clients.tsx` reviewed for mixed legacy color classes and inconsistent empty/error states
- [x] `client/pages/settings/Team.tsx` reviewed for table empty/error/retry behavior gaps
- [x] `client/components/shared/DataTable.tsx` reviewed for row keyboard handling and state copy consistency
- [x] `client/pages/Profile.tsx` and `client/pages/CompanySettings.tsx` sampled for cross-surface visual parity

## Task 4-6 Implementation Notes
- [x] Normalized drifted utility colors in clients dialog, cards, and empty states to token-driven variants
- [x] Added explicit load-failure panel + retry button for clients page
- [x] Added explicit load-failure panel + retry button for team table workflow
- [x] Standardized table copy to "No records match your filters" and "Unable to load table data"
- [x] Added keyboard activation (`Enter`/`Space`) to clickable data-table rows
- [x] Preserved accessible status/alert semantics on table error state
