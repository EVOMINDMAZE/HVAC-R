# Stability Baseline

Last run: `npm run typecheck`, `npm run test`, `npm run build:client` (pass)

## Commands
- `npm run typecheck` → pass
- `npm run test` → pass (93 tests)
- `npm run build:client` → pass

## Watchpoints
- Vitest warnings in `useSupabaseAuth` test (expected mock limitations)
- React Router future warnings in `ConsentBanner` tests (harmless)

## Next
- Keep this file updated when CI baseline changes.
