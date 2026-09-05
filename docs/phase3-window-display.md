# Phase 3 — Window Display (public `/try` AI demo)

**Status: SHIPPED 2026-09-05** (`58bc0fb` UI+function · `1e82f09` durable cap · `8c54f7a` storage contract fix · `8963300` diag · `0ae536f` clean prod build) — all CI runs green, evidence below.

## What shipped

- **`thermoneural.com/try`** — public "window display": symptom form (text + role + optional equipment) → AI sample verdict card (summary, top 2 causes, first 2 steps, urgency, demo note). No signup. CTA → `/signup`.
- **`try-demo` edge function** — public POST, CORS, no auth. Mirrors the auth'd `ai-troubleshoot` machinery (same system prompt skeleton, same ai-gateway contract, same JSON normalizer, same safety guidelines) in demo-shortened form. Role-adaptive language (homeowner plain / technician standard / engineer ranges).
- **Rate cap: 3 runs per IP per 24h** — enforced **durably** via a private Supabase Storage bucket (`try-demo-caps`), one JSON object per SHA-256-hashed IP (`caps/<hash>.json`), sliding 24h window, upsert after each successful AI round-trip. Runs only burn quota on success (AI failures don't count). IPs are never stored raw — only salted SHA-256 hashes.
- **Nav entry** — "Try Free" in the shared public header (single nav; umbrella `/` inherits it with zero `/` page edits; no auth CTAs on `/` itself).
- **Analytics** — `try_demo_run` (submit) + `try_demo_result` (verdict shown) events in `marketingAnalytics`. Also fixed a pre-existing bug: `action` was typed in the payload but never forwarded.

## Evidence (live, 2026-09-05)

- `/try` → **200**, title "Try the AI Troubleshooter Free | ThermoNeural", 117th precache chunk in the PWA build.
- Function cap sequence (same IP): **200 `runs_left=2` → 200 `runs_left=1` → 200 `runs_left=0` → 429 `daily_limit_reached`**.
- **Durability proof**: immediately after a full function redeploy (`0ae536f`), the same IP got **429 on every attempt** — cap state survives isolates and deploys (bucket-persisted, not in-memory).
- Screenshot (capped visitor): form + limit card with "Get full access →" CTA rendered on-brand.

## Honest limitations (by design, documented in `SPEC-try-window.md`)

- **Read-then-write race**: a same-IP burst inside the read→write window can overshoot the cap by a few runs (bounded by concurrent requests, not unbounded). Acceptable: this is a loss-leader demo, not billing.
- **Fails open**: if Storage is unreachable, the demo serves without the cap rather than blocking legitimate visitors (availability over strict quota); errors are logged server-side.
- Diagnostics used during bring-up (`cap_debug`, key-shape probe) were stripped before close (`0ae536f`); the debug commits remain in history — no secrets, no key values, shapes only.

## Debugging trail (for future reference)

The in-memory cap was a no-op in prod (Supabase isolates don't share memory) — replaced with Storage-backed state. Storage rejected raw `Authorization`-only fetches (`Invalid Compact JWS`); the working contract is **multipart/form-data upload + both `apikey` and `Authorization` headers** (mirrors what supabase-js sends), bucket auto-created on first run (409-duplicate tolerated). Injected key is new-format (`sb_…`); rest/v1 + storage/v1 both accept it.

## Carried items

- Phase 2's single open item (Supabase OTP `email_address_invalid` config check) remains user-gated — unchanged, unrelated to this phase.
