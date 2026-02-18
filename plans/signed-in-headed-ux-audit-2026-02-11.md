# Signed-In Headed UX Audit (Real Login)

Date: 2026-02-11  
Base URL: `http://localhost:8090`  
Method: Headed Playwright with **real login sessions** (admin, technician, client), route-by-route screenshots, route-level console/network capture.

## Artifacts
- Raw JSON: `output/playwright/ux/signed-in-real-audit.json`
- Screenshots: `output/playwright/ux/real-*.png`
- Audit runner: `output/playwright/ux/signed_in_real_audit.mjs`

## Role Coverage
- `admin`: login=`true`, checked=`26`, passed=`26`, failed=`0`, consoleWarnings/errors=`112`
- `technician`: login=`true`, checked=`6`, passed=`6`, failed=`0`, consoleWarnings/errors=`26`
- `client`: login=`true`, checked=`4`, passed=`4`, failed=`0`, consoleWarnings/errors=`19`

## Critical Findings (Highest Priority)
1. Role landing is wrong after sign-in for non-admin roles.
- Evidence: technician/client logins both ended at `/dashboard` instead of role home.
- Source: `output/playwright/ux/signed-in-real-audit.json` (`roles[].login.finalUrl`).
- Code risk: `signIn()` always returns `role: null` in `client/hooks/useSupabaseAuth.tsx:338`, while `SignIn` routes by returned role in `client/pages/SignIn.tsx:124`.

2. Client role experience is functionally inconsistent with role intent.
- Evidence: client `/portal` renders operations dashboard style with owner/manager workflow blocks (`real-client--portal.png`).
- Source route: `/portal`, screenshot `output/playwright/ux/real-client--portal.png`.
- Code risk: role fallback defaults to admin in nav (`effectiveRole = role || "admin"`) at `client/hooks/useAppNavigation.tsx:54`.

3. Multiple signed-in pages have backend/API errors visible in UX.
- `settings/company`: missing RPC function (404).
- `settings/team`: unauthorized API (401).
- `ai/pattern-insights`: unauthorized analyze API (401).
- `tools/refrigerant-inventory`: edge function unauthorized (401).
- `advanced-reporting`: subscriptions query returns 406.
- `dashboard/fleet`: network refused and blocking modal.

4. Signed-in shell is visually noisy and repetitive.
- Duplicate company switcher appears in both top header and secondary nav.
- Evidence in screenshots and code:
  - header switcher `client/components/Header.tsx:174`
  - sidebar switcher `client/components/Sidebar.tsx:129`

5. Consent banner blocks primary workflow controls across pages.
- Fixed bottom-right banner overlays actions/content in many screenshots.
- Code: `client/components/ConsentBanner.tsx:85` fixed positioning with `z-50`.

## Route Matrix (All Logged-In Routes Tested)

| Role | Route | H1 | Text Len | Result | Screenshot |
|---|---|---|---:|---|---|
| `admin` | `/dashboard` | `Operations Dashboard, admin` | 1320 | `ok` | `output/playwright/ux/real-admin--dashboard.png` |
| `admin` | `/dashboard/dispatch` | `Dispatch Board` | 754 | `ok` | `output/playwright/ux/real-admin--dashboard-dispatch.png` |
| `admin` | `/dashboard/triage` | `Triage Leads` | 762 | `ok` | `output/playwright/ux/real-admin--dashboard-triage.png` |
| `admin` | `/dashboard/jobs` | `Open Jobs` | 733 | `ok` | `output/playwright/ux/real-admin--dashboard-jobs.png` |
| `admin` | `/dashboard/jobs/demo` | `` | 659 | `ok` | `output/playwright/ux/real-admin--dashboard-jobs-demo.png` |
| `admin` | `/dashboard/clients` | `Clients` | 1421 | `ok` | `output/playwright/ux/real-admin--dashboard-clients.png` |
| `admin` | `/dashboard/clients/demo` | `` | 540 | `ok` | `output/playwright/ux/real-admin--dashboard-clients-demo.png` |
| `admin` | `/dashboard/projects` | `Projects` | 967 | `ok` | `output/playwright/ux/real-admin--dashboard-projects.png` |
| `admin` | `/dashboard/fleet` | `Fleet Dashboard` | 1007 | `ok` | `output/playwright/ux/real-admin--dashboard-fleet.png` |
| `admin` | `/estimate-builder` | `Estimate Builder` | 892 | `ok` | `output/playwright/ux/real-admin--estimate-builder.png` |
| `admin` | `/history` | `Calculation History` | 1356 | `ok` | `output/playwright/ux/real-admin--history.png` |
| `admin` | `/profile` | `Profile Settings` | 871 | `ok` | `output/playwright/ux/real-admin--profile.png` |
| `admin` | `/settings/company` | `Company Settings` | 1054 | `ok` | `output/playwright/ux/real-admin--settings-company.png` |
| `admin` | `/settings/team` | `Team Management` | 843 | `ok` | `output/playwright/ux/real-admin--settings-team.png` |
| `admin` | `/troubleshooting` | `Diagnostic Wizard` | 1130 | `ok` | `output/playwright/ux/real-admin--troubleshooting.png` |
| `admin` | `/ai/pattern-insights` | `` | 733 | `ok` | `output/playwright/ux/real-admin--ai-pattern-insights.png` |
| `admin` | `/tools/iaq-wizard` | `Indoor Health Wizard` | 795 | `ok` | `output/playwright/ux/real-admin--tools-iaq-wizard.png` |
| `admin` | `/tools/warranty-scanner` | `Warranty Auto-Pilot` | 966 | `ok` | `output/playwright/ux/real-admin--tools-warranty-scanner.png` |
| `admin` | `/diy-calculators` | `HVAC Field Tools` | 978 | `ok` | `output/playwright/ux/real-admin--diy-calculators.png` |
| `admin` | `/tools/standard-cycle` | `ENHANCED STANDARD CYCLE` | 2285 | `ok` | `output/playwright/ux/real-admin--tools-standard-cycle.png` |
| `admin` | `/tools/refrigerant-comparison` | `Refrigerant Comparison` | 1201 | `ok` | `output/playwright/ux/real-admin--tools-refrigerant-comparison.png` |
| `admin` | `/tools/cascade-cycle` | `Enhanced Cascade System` | 1886 | `ok` | `output/playwright/ux/real-admin--tools-cascade-cycle.png` |
| `admin` | `/tools/refrigerant-inventory` | `Refrigerant Bank ❄️` | 853 | `ok` | `output/playwright/ux/real-admin--tools-refrigerant-inventory.png` |
| `admin` | `/tools/leak-rate-calculator` | `EPA Leak Rate Calculator` | 796 | `ok` | `output/playwright/ux/real-admin--tools-leak-rate-calculator.png` |
| `admin` | `/tools/refrigerant-report` | `EPA Compliance Log 📋` | 671 | `ok` | `output/playwright/ux/real-admin--tools-refrigerant-report.png` |
| `admin` | `/advanced-reporting` | `Operations + engineering pricing built for HVAC&R growth stages.` | 2884 | `ok` | `output/playwright/ux/real-admin--advanced-reporting.png` |
| `technician` | `/tech` | `Field Jobs` | 674 | `ok` | `output/playwright/ux/real-technician--tech.png` |
| `technician` | `/tech/jobs/demo` | `` | 538 | `ok` | `output/playwright/ux/real-technician--tech-jobs-demo.png` |
| `technician` | `/troubleshooting` | `Diagnostic Wizard` | 1130 | `ok` | `output/playwright/ux/real-technician--troubleshooting.png` |
| `technician` | `/diy-calculators` | `HVAC Field Tools` | 978 | `ok` | `output/playwright/ux/real-technician--diy-calculators.png` |
| `technician` | `/history` | `Calculation History` | 1356 | `ok` | `output/playwright/ux/real-technician--history.png` |
| `technician` | `/profile` | `Profile Settings` | 870 | `ok` | `output/playwright/ux/real-technician--profile.png` |
| `client` | `/portal` | `Operations Dashboard, client` | 1323 | `ok` | `output/playwright/ux/real-client--portal.png` |
| `client` | `/track-job/demo` | `` | 540 | `ok` | `output/playwright/ux/real-client--track-job-demo.png` |
| `client` | `/profile` | `Profile Settings` | 874 | `ok` | `output/playwright/ux/real-client--profile.png` |
| `client` | `/history` | `Calculation History` | 1358 | `ok` | `output/playwright/ux/real-client--history.png` |

## Route-Level HTTP Errors
- `admin /dashboard`
  - [404] `http://localhost:54321/rest/v1/triage_uploads?select=*`
- `admin /dashboard/jobs/demo`
  - [400] `http://localhost:54321/rest/v1/jobs?select=*&id=eq.demo`
- `admin /dashboard/clients/demo`
  - [400] `http://localhost:54321/rest/v1/clients?select=*&id=eq.demo`
- `admin /settings/company`
  - [404] `http://localhost:54321/rest/v1/rpc/get_company_subscription`
- `admin /settings/team`
  - [401] `http://localhost:8090/api/team`
- `admin /ai/pattern-insights`
  - [401] `http://localhost:8090/api/ai/patterns/analyze`
- `admin /tools/refrigerant-inventory`
  - [401] `http://localhost:54321/functions/v1/analyze-selling-points`
- `admin /advanced-reporting`
  - [406] `http://localhost:54321/rest/v1/subscriptions?select=status%2Cplan&user_id=eq.1cab6dd6-c9c1-4bf6-9efd-699a106d13a5`
- `technician /tech/jobs/demo`
  - [400] `http://localhost:54321/rest/v1/jobs?select=*%2Cclient%3Aclients%28name%2Caddress%2Ccontact_phone%29%2Casset%3Aassets%28name%2Ctype%2Cserial_number%29%2Cjob_timeline%28status%2Ccreated_at%29&id=eq.demo`
- `client /portal`
  - [404] `http://localhost:54321/rest/v1/triage_uploads?select=*`
- `client /track-job/demo`
  - [400] `http://localhost:54321/rest/v1/jobs?select=*%2Ctechnician%3Atechnician_id%28email%29%2Ccompany%3Acompanies%28name%29%2Cjob_timeline%28status%2Ccreated_at%29&id=eq.demo&job_timeline.order=created_at.desc&job_timeline.limit=1`

## Route-Level Console Errors (Actionable Only)
(React Router future warnings and HTTP Stripe warning excluded below)
- `admin /dashboard`
  - Failed to load resource: the server responded with a status of 404 (Not Found)
  - 🚨 JSON.parse FAILED: {error: Unexpected end of JSON input, source: Unknown, textPreview: , textLength: 0, isHTML: false}
- `admin /dashboard/jobs/demo`
  - Failed to load resource: the server responded with a status of 400 (Bad Request)
  - [JobDetails] Job query error details: {message: invalid input syntax for type uuid: "demo", code: 22P02, details: null, hint: null}
  - [JobDetails] Error fetching job: {code: 22P02, details: null, hint: null, message: invalid input syntax for type uuid: "demo"}
- `admin /dashboard/clients/demo`
  - Failed to load resource: the server responded with a status of 400 (Bad Request)
  - Error fetching details: {code: 22P02, details: null, hint: null, message: invalid input syntax for type uuid: "demo"}
- `admin /dashboard/fleet`
  - Failed to load resource: net::ERR_CONNECTION_REFUSED
  - API request failed: TypeError: Failed to fetch
    at ApiClient.request (http://localhost:8090/client/lib/api.ts:68:36)
    at async fetchFleetData (http://localhost:8090/client/pages/dashboard/FleetDashboard.tsx?t=1770840226457:49:50)
  - Failed to fetch fleet data: Network error
- `admin /settings/company`
  - Failed to load resource: the server responded with a status of 404 (Not Found)
  - Error fetching settings: {code: PGRST202, details: Searched for the function public.get_company_subsc…r, but no matches were found in the schema cache., hint: Perhaps you meant to call the function public.get_company_subscription(p_company_id), message: Could not find the function public.get_company_subscription(company_uuid) in the schema cache}
- `admin /settings/team`
  - Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - Error fetching team Error: Failed to fetch team
    at fetchTeam (http://localhost:8090/client/pages/settings/Team.tsx?t=1770844872642:63:37)
- `admin /ai/pattern-insights`
  - Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - Error analyzing patterns: Error: HTTP error! status: 401
    at AIPatternsAPI.analyzePatterns (http://localhost:8090/client/lib/ai-patterns.ts:22:23)
    at async loadPatternData (http://localhost:8090/client/pages/ai/PatternInsights.tsx:53:38)
  - Error loading pattern data: Error: HTTP error! status: 401
    at AIPatternsAPI.analyzePatterns (http://localhost:8090/client/lib/ai-patterns.ts:22:23)
    at async loadPatternData (http://localhost:8090/client/pages/ai/PatternInsights.tsx:53:38)
- `admin /tools/refrigerant-inventory`
  - Failed to load resource: the server responded with a status of 401 (Unauthorized)
  - Analysis Failed: FunctionsHttpError: Edge Function returned a non-2xx status code
    at FunctionsClient.<anonymous> (http://localhost:8090/node_modules/.vite/deps/@supabase_supabase-js.js?v=819677b3:166:17)
    at Generator.next (<anonymous>)
    at fulfilled (http://localhost:8090/node_modules/.vite/deps/chunk-QGEQHYSX.js?v=819677b3:55:24)
- `admin /advanced-reporting`
  - Failed to load resource: the server responded with a status of 406 (Not Acceptable)
- `technician /tech`
  - Error fetching projects: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at http://localhost…ost:8090/client/components/JobSelector.tsx:45:33), hint: , code: }
  - Error fetching jobs: {message: TypeError: Failed to fetch, details: TypeError: Failed to fetch
    at http://localhost…nt/pages/tech/JobBoard.tsx?t=1770840586392:58:37), hint: , code: }
- `technician /tech/jobs/demo`
  - Failed to load resource: the server responded with a status of 400 (Bad Request)
  - Error fetching job: {code: 22P02, details: null, hint: null, message: invalid input syntax for type uuid: "demo"}
- `client /portal`
  - Failed to load resource: the server responded with a status of 404 (Not Found)
  - 🚨 JSON.parse FAILED: {error: Unexpected end of JSON input, source: Unknown, textPreview: , textLength: 0, isHTML: false}
- `client /track-job/demo`
  - WebSocket connection to 'ws://localhost:54321/realtime/v1/websocket?apikey=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH&vsn=1.0.0' failed: WebSocket is closed before the connection is established.
  - Failed to load resource: the server responded with a status of 400 (Bad Request)

## Design/UX Problems Found

### Shell and Navigation
- Two-tier nav + repeated controls creates cognitive load (job selector + company selector + resources + account split across header and nav rows).
- Role affordances are weak: technician/client can visually see owner-centric model in top-level shell, reducing trust and clarity.
- Search affordance is low-contrast and visually deprioritized against decorative controls.

### Visual Consistency Drift
- Operations pages are light/neutral while engineering tools still use dark neon/cyber idioms (for example `Standard Cycle`, `Cascade Cycle`, older gradients, pulse effects).
- Typography hierarchy is inconsistent across modules (some all-caps and oversized lab-like headings versus clean operational headers).
- Multiple pages use modal overlays/onboarding popups that interrupt first action (e.g., standard cycle welcome tour).

### Content and Task Clarity
- Several pages lack immediate "what to do next" in empty states (`/tech`, `/history`), especially for first-time users.
- Dynamic detail routes with invalid IDs fail with raw backend errors instead of guided fallback UX.
- Client journey has weak separation from owner dashboard mental model.

### Accessibility/Interaction
- Consent banner can hide bottom-right controls and map actions on small/short viewports.
- Some pages rely on low-contrast secondary text over light surfaces, reducing scan speed.

## Improvement Backlog (Prioritized)

### P0 (Fix now)
- Fix role return path at login (`signIn` should resolve role/company before navigate or SignIn should defer navigation until auth context role is ready).
- Remove `effectiveRole = role || "admin"` fallback from navigation and gate rendering until role is known.
- Resolve failing APIs/RPCs listed above so core pages stop showing runtime errors.
- Add resilient invalid-ID handling pages for `/dashboard/jobs/:id`, `/dashboard/clients/:id`, `/tech/jobs/:id`, `/track-job/:id`.

### P1 (High UX impact)
- Consolidate shell controls: keep one company switcher and one primary navigation row.
- Split role-specific shells (owner/manager vs technician vs client) to avoid mixed mental models.
- Make empty states action-oriented with one primary CTA per page (create job, start triage, run first calculation).
- Move consent to less intrusive presentation on signed-in pages (dock style with collision avoidance).

### P2 (Design quality)
- Standardize tool page visual language to the operations console system (remove neon gradients/pulse where not essential).
- Normalize heading system, spacing rhythm, and contrast tokens across all signed-in pages.
- Remove recurring onboarding modal unless first-run only and dismiss state is persisted by user and tool.

## Notes About Test Validity
- Previous signed-in smoke scripts used `?bypassAuth=1`; this report is based on a new real-login headed runner to avoid false confidence.
- Dynamic routes were tested with `demo` IDs to verify failure UX and error handling behavior.
