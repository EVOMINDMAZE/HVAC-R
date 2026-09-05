# Phase 2 — The Handoff (cross-shop identity)

**Status:** SHIPPED 2026-09-04 (Box `0315649`, PhasePoint `aa6d640` + `2bf4a64`) · one open config item, below.
**Tagline:** *walk in free, try before you buy, leave with your data.*

## The SSO truth (probe-verified, 2026-09-04)

All four ThermoNeural shops use **one Supabase project** (`tbmizbqftczbsbwqgyjx`), but a
Supabase session **never crosses domains** — browser storage is per-domain by design.
Verified live: signed the QA user into The Box, opened PhasePoint in the same browser
context → PhasePoint saw `sbKeys: []` (zero session keys). There is **no automatic SSO**,
and we do not claim any.

Storage reality per shop:
- The Box (thermoneural.com): localStorage (`sb-…-auth-token`), `detectSessionInUrl:false`
- PhasePoint (simulateon.vercel.app): localStorage, Supabase auth flag ON in prod
- VanClass / Cryovo: @supabase/ssr cookie-based (server-side sessions)

## What shipped

**1. The Box — `/platform` identity panel** (signed-in users only)
"Your ID works in every shop" — shows the signed-in email, explains that other shops
recognize it by address (not by shared session), and offers:
- **PhasePoint: "Continue in PhasePoint"** → `simulateon.vercel.app/signin?continue={email}`
- VanClass + Cryovo: plain product links (their auth is cookie-SSR; a "continue"
  button there would be false — so there isn't one).
- New analytics event: `platform_id_handoff`.

**2. PhasePoint — one-tap continue receiver** (`/signin?continue={email}`)
- Validates the email, prefills the form, cleans the URL, shows
  "Continue as {email}" with a one-tap magic-link button (`signInWithOtp`, added to
  the auth stack: `lib/api.ts` → `usePocketbaseAuth` → `SignIn.tsx`).
- **Graceful failure contract:** if Supabase rejects the send (address validation or
  hourly email quota), the panel shows an amber notice pointing to the prefilled
  password form below. The user is never dead-ended and never sees a raw API error.

## Evidence (live, 2026-09-04)

- QA user signed into The Box → `/dashboard` ✓
- `/platform` panel link carries the email: `/signin?continue={email}` ✓ (DOM-verified)
- PhasePoint receiver renders "Continue as {email}" + one-tap button ✓ (screenshot-verified)
- Gates: PhasePoint `tsc 0` · **115/115 tests** · client build ✓; Box `tsc 0` · build ✓
- Secret-scans clean on every commit; deploys: Netlify (Box) + `vercel --prod` (PhasePoint), `/signin` 200.

## Open item — Supabase-side email send (config, user-gated)

First live one-tap click: Supabase returned **`400 email_address_invalid`** for an
existing, valid Gmail address that password sign-in accepts. Source analysis
(supabase/auth `mail.go` → `mailer/validateclient`): this code is emitted by the
**email validation layer at send time** — extended checks (format, denylist,
**gmail local-part ≥ 6 chars**, DNS/MX reachability) and/or a configured validation
service. Retests hit the built-in SMTP **hourly quota** (`429 over_email_send_rate_limit`),
so the final verdict is **BLOCKED-CONFIG: validation layer rejects sends; dashboard
check required**. Retest (~20:00 ET, window reset) probe pattern across three
addresses: fresh gmail → `200 {}` (send itself works); QA gmail → **`400
email_address_invalid`** (rejected by the per-address validation layer at send
time); example.com probe → `429 over_email_send_rate_limit` (hourly quota,
consumed by the fresh-gmail send). Conclusion: the send path is functional, but
the validation layer selectively rejects the QA gmail address — this is
configuration, not a transient failure.

**Action (dashboard, ~2 min):** Supabase Dashboard → Authentication → Settings:
check extended email validation / validation service toggles; verify Site URL +
Redirect URLs include `https://simulateon.vercel.app/**`. For production volumes,
add custom SMTP (built-in service is rate-limited by design).

**Fallback meanwhile:** password form is prefilled; users can always sign in normally.
