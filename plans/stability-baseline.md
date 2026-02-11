# Stability Baseline

Last run: `npm run typecheck`, `npm run test`, `npm run build:client` (pass), `npm run lint` (fails on existing repo-wide backlog)

## Commands
- `npm run typecheck` → pass
- `npm run test` → pass (93 tests)
- `npm run build:client` → pass
- `npm run lint` → fail (190 errors, 37 warnings; mostly pre-existing outside landing scope)

## Watchpoints
- Vitest warnings in `useSupabaseAuth` test (expected mock limitations)
- React Router future warnings in `ConsentBanner` tests (harmless)
- ESLint backlog includes archived generated assets and legacy modules; not introduced by current landing conversion work.

## Next
- Keep this file updated when CI baseline changes.
- Performance note: build warns about large chunks (`react-pdf.browser` and chart/pdf bundles); not a blocker for correctness, but should be addressed in optimization iteration.
- Create a dedicated lint-reduction campaign scoped by directories (`archive/`, legacy calculators, hooks purity rules) before enforcing lint-as-gate.
