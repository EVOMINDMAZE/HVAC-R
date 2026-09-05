# SPEC — Phase 3: Window Display (`/try` public AI demo, ≤3 runs/IP/day)

## Goal
Public "window display" for The Box: a no-signup AI troubleshooter demo at `thermoneural.com/try`.
Walk in free, try before you buy. 3 free runs per IP per 24h, then an honest limit message.
CTA: "full version inside The Box" → `/signup`. No auth anywhere on this surface.

## Investigation findings (verbatim-verified 2026-09-05)
- `supabase/functions/ai-troubleshoot/index.ts` (486 L): auth-gated (401 w/o JWT). Reusable
  machinery: CORS builder (L5–20), SYSTEM_PROMPT (L40), ROLE_INSTRUCTIONS (L43),
  SAFETY_GUIDELINES (L52), payload hygiene (L122–240), `callAIGateway` → ai-gateway
  `mode:"general"` with service-role bearer (L377–402), `normalizeOllamaResponse` JSON
  extraction (L404–469), response keys: summary/probable_causes/steps/urgency/
  explanation/follow_up_questions.
- `ingest-telemetry/index.ts`: **proves every edge fn auto-injects SUPABASE_URL +
  SUPABASE_SERVICE_ROLE_KEY** (used at L24–27, zero secrets setup needed).
- Rate limiting: **no existing anon/rate-limit table or pattern exists anywhere** in
  functions or migrations (grep: 0 hits). Plan's "existing anon table" assumption is
  FALSE. Plan also says "YAGNI: no new infra" and migrations are manual-apply only
  (no local PAT; `supabase link` unlinked; deploy.yml runs `db push` only on
  workflow_dispatch with GH secrets).
- Deploy: `git push main` → GH Actions matrix deploys every function in
  `.github/workflows/deploy.yml` JOB 3 (`--no-verify-jwt` for all — anon-capable by
  default). Frontend → Netlify.
- Client call pattern: `client/lib/api.ts` L357 fetches `${SUPABASE_URL}/functions/v1/ai-troubleshoot`;
  public fn needs no Authorization — supabase-js `functions.invoke` sends apikey (anon) automatically.
- Route table `client/App.tsx`: `/try` UNCLAIMED (routes L327–346, `/signup` L358).
- Header entry: `client/hooks/useAppNavigation.tsx` L61 `landingLinks` (public header nav
  consumed by `client/components/Header.tsx` L166) → insert Try link.
- Analytics: `client/lib/marketingAnalytics.ts` L1–22 union — add `try_demo_run`,
  `try_demo_result` (typed, not cast — Phase 2 precedent).

## Wiring decisions (numbered)
1. **New edge fn** `supabase/functions/try-demo/index.ts` — Deno.serve, POST-only,
   CORS mirror of ai-troubleshoot. NO auth check. Payload: `{ symptom: string,
   role?: "homeowner"|"technician"|"engineer", equipment?: string }`. Validates
   symptom ≥ 10 chars. Builds messages with a DEMO system prompt (short-form verdict:
   summary + top 2 probable causes + first 2 steps + urgency — a sample, not the full
   wizard), calls ai-gateway via service role (same contract), normalizes with the same
   JSON-extraction logic, returns `{ demo: true, …result }`.
2. **Rate cap (honest, in-memory)**: Map<ip, timestamp[]> in module scope; sliding
   window 24h; max 3. IP = `x-forwarded-for` first hop. 429 response: JSON
   `{ error: "daily_limit_reached", message: "You've used all 3 free demos for today. The full troubleshooter is inside The Box." }`.
   **Honest limitation (documented everywhere): in-memory cap resets on function
   restart/redeploy and is per-isolate, NOT a hard global quota.** It stops casual
   abuse; cost is bounded by ai-gateway model pricing. Dashboard/DB-based hard cap is a
   follow-up (needs manual migration apply — user-gated).
3. **deploy.yml**: add `try-demo` to the JOB 3 function matrix (alphabetical, after
   stripe-webhook).
4. **New page** `client/pages/TryWindow.tsx` at route `/try` (public, registered in
   App.tsx next to `/triage`). Mounts public `<Header />`. UI: hero ("Try the AI
   troubleshooter — free, no signup"), textarea (symptom) + role select + equipment
   input, "Run demo" button → result card (summary, causes, steps, urgency chip) +
   runs-left indicator + honest CTA card → `/signup`. On 429: amber honest block
   message with the CTA (never a raw error). On other errors: honest red error + retry.
5. **Header link**: `landingLinks` gains `{ to: "/try", label: "Try Free", icon: PlayCircle }`
   after "Features".
6. **Analytics**: `try_demo_run` (on click, payload {method:"window"}) and
   `try_demo_result` (payload {action:"ok"|"limit"|"error"}); union extended.
7. **Copy rule**: zero jargon, "sample" framing, no fake claims (cap described as
   "3 free demos per day per visitor").

## Verification
- Gates: `npx tsc --noEmit` = 0; `npm run build:client` exit 0; secret-scan clean.
- Deploy: git push → GH Actions matrix deploys `try-demo` → Netlify frontend.
- Live probe (curl, no auth): OPTIONS preflight 200; 3× POST → 200 `{demo:true,…}`;
  4th POST → 429 daily_limit_reached; `thermoneural.com/try` → 200 + screenshot
  (header link visible, form, CTA).
- Honest caveat recorded in phase doc: in-memory cap (soft, per-isolate).
