# Future Monitor Infographic Route TODO (V1)

## Purpose
Track page-by-page validation for the new infographic monitor layer (titles, KPI semantics, chart narrative, diagram narrative, empty/loading states, and responsive behavior).

## Global Checks
- [x] Confirm flag path works: `?uiFuture=1` shows monitor on all route groups.
- [x] Confirm rollback path works: `?uiFuture=0` hides monitor.
- [ ] Confirm no fake metrics are displayed on any page.
- [x] Confirm empty-state copy appears when no real data exists.
- [x] Confirm reduced-motion preference disables non-essential animation.
- [ ] Confirm no horizontal overflow on `1280x800`, `1536x960`, and `390x844`.

## Public and Content Routes
- [x] `/`
- [x] `/triage`
- [x] `/a2l-resources`
- [x] `/features`
- [x] `/pricing`
- [x] `/about`
- [x] `/blog`
- [x] `/blog/:slug`
- [x] `/stories`
- [x] `/podcasts`
- [x] `/contact`
- [x] `/documentation`
- [x] `/help`
- [x] `/help-center`
- [x] `/privacy`
- [x] `/terms`
- [x] `/connect-provider`
- [x] `/career`

## Auth and Onboarding Routes
- [x] `/signin`
- [x] `/signup`
- [x] `/select-company`
- [x] `/join-company`
- [x] `/invite/:slug`
- [x] `/create-company`
- [x] `/invite-team`
- [x] `/callback/:provider`

## Operations Routes
- [x] `/dashboard`
- [x] `/dashboard/dispatch`
- [x] `/dashboard/triage`
- [x] `/dashboard/fleet`
- [x] `/dashboard/jobs`
- [x] `/dashboard/jobs/:id`
- [x] `/dashboard/projects`
- [x] `/dashboard/clients`
- [x] `/dashboard/clients/:id`
- [x] `/portal`
- [x] `/track-job/:id`
- [x] `/tech`
- [x] `/tech/jobs/:id`
- [x] `/history`
- [x] `/profile`
- [x] `/settings/company`
- [x] `/settings/team`

## Tools and Engineering Routes
- [x] `/advanced-reporting`
- [x] `/troubleshooting`
- [x] `/diy-calculators`
- [x] `/estimate-builder`
- [x] `/tools/standard-cycle`
- [x] `/tools/refrigerant-comparison`
- [x] `/tools/cascade-cycle`
- [x] `/tools/refrigerant-report`
- [x] `/tools/refrigerant-inventory`
- [x] `/tools/leak-rate-calculator`
- [x] `/tools/warranty-scanner`
- [x] `/tools/iaq-wizard`
- [x] `/ai/pattern-insights`

## Debug and Fallback Routes
- [x] `/stripe-debug`
- [x] `/agent-sandbox`
- [x] `*` (NotFound)

## Route Acceptance Criteria (apply to every route above)
- [ ] Route-level monitor title fits page intent.
- [ ] KPI labels are semantically matched to route context.
- [ ] KPI values come from real data/runtime telemetry only.
- [ ] Chart title/description match page intent.
- [ ] Diagram title/flow nodes match page context.
- [ ] Empty/loading/error states are clear and professional.
- [ ] Light and dark themes remain readable and consistent.

## Validation Notes (2026-02-12)
- Full route audit executed with `node output/playwright/ux/future_monitor_route_audit_v1.mjs`.
- Audit result: `60/60` pass (all route groups + rollback control route).
- Report artifact:
  - `output/playwright/ux/future-monitor-route-audit-v1.json`
- Screenshot artifacts per route:
  - `output/playwright/ux/future-monitor-*-on.png`
  - `output/playwright/ux/future-monitor-dashboard-off.png`
- Component/unit evidence:
  - `client/lib/featureFlags.test.ts` validates query override and flag persistence across redirects.
  - `client/components/__tests__/MonitorComponents.test.tsx` validates loading/empty and reduced-motion behavior.
  - `client/config/monitorRegistry.test.ts` validates route semantics and monitor model shaping.
- Redirect caveats captured by audit:
  - `/invite-team` redirects to `/dashboard` when company context is missing.
  - `/advanced-reporting` redirects to `/pricing` when tier requirement is not met.
  - UI flags are now preserved during these redirects, so monitor visibility remains consistent.
