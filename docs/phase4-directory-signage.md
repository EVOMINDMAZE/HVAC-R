# Phase 4 — Directory Signage (Store Map Homepage)

> Lifecycle record per `phase-gated-delivery`. Initiated 2026-09-05 from the
> Phase 3 close (`docs/phase3-window-display.md`, fix `5420348` + `099b1dc`).
> Plan source: `~/.hermes/plans/2026-09-03_081500-thermoneural-mall.md` Phase 4.

## INITIATING — Charter

- **Project:** Phase 4 — Directory Signage (Boucicaut: "Directory / store map").
- **Sponsor:** Riad (CEO). **Builder:** Hermes.
- **Problem:** `/` shows four product cards but no department identity — a first-time
  visitor can't tell which shop solves which job, and the mall's promise (free entry,
  honest prices, data ownership) isn't signage anywhere on the page.
- **In scope:** department label on each of the 4 product cards; one mall tagline;
  the "One ID · Honest prices · Your data is yours" trust strip. Nothing else on `/`.
- **Out of scope (firewall):** renaming cards; auth CTAs on `/` (presenting-only rule
  from `8f661da` regression); footer changes; Phase 5 department sheets; new pages.
- **SMART objective:** signage + tagline + strip live on thermoneural.com `/` today,
  verified by live probe with SW cache-bust + screenshot.
- **Gate (go/no-go, pre-committed):**
  1. Live `/` shows all 4 department labels + mall tagline + trust strip.
  2. No-auth-CTA regression holds (0 of 7 suspect strings present).
  3. Zero console errors on `/`.
  4. `npm run build:client` green; secret-scan clean; commit names the phase.
- **Stakeholders:** visitors (clarity), Riad (brand), 4 product teams (copy accuracy).

## DEEP SEARCH — findings (verified 2026-09-05, live + source)

- **F1 — Cards source:** `client/pages/ParentBrandLanding.tsx` `PRODUCTS[4]` —
  PhasePoint (simulateon.vercel.app, Live), VanClass (Beta), Cryovo (Beta),
  HVAC Business Platform (The Box, `/platform`, Live). `ProductCard` renders
  icon + status Badge + name + tagline + description. No department concept exists.
- **F2 — Live baseline probe** (`/tmp/p4-baseline.cjs`, 2026-09-05): all 4 names
  present; department strings ABSENT (as expected); tagline/strip ABSENT;
  **auth-CTA suspects 0/7 present**; console errors 0. Screenshot `/tmp/p4-baseline.png`.
- **F3 — Trust copy ground truth:** `docs/GUARANTEE.md` backs "your data is yours"
  (CSV/PDF export, self-serve cancel, no delete path) and "honest prices" (public
  pricing, Stripe live from Phase 0). "One ID" = one shared Supabase `tbmizbqftczbsbwqgyjx`
  across all 4 apps (plan F10); Phase 2 documented the honest cross-domain fallback —
  the strip is the mall's promise wording pre-approved in the master plan.
- **F4 — Copy plan mapping (verbatim from master plan):** The Box = "Business Operations";
  PhasePoint = "Simulation & Engineering"; VanClass = "Training & Certification";
  Cryovo = "Cold Chain Compliance". Mall tagline: "Walk in free, try before you buy,
  leave with your data." Strip: "One ID · Honest prices · Your data is yours".
- **F5 — Design hard-bar:** dark first, SINGLE orange accent (no rainbow), no mock
  content; labels never truncate (memory: cards fit content).

## ITTOs

- **Inputs:** F1–F5, GUARANTEE.md, master plan Phase 4 row.
- **Tools & techniques:** TypeScript/React patch (additive `department` field),
  Playwright live probe with cache-bust, secret-scan via saved-script pattern.
- **Outputs:** patched `ParentBrandLanding.tsx`, this doc (charter→closing), live
  evidence (probe JSON + screenshots), phase commit on `main`.

## PLANNING — WBS

1. Add `department` to `Product` type + 4 verbatim labels (F4).
2. Render department as an overline in `ProductCard` (uppercase, tracking, primary
   accent; fits card, no truncation).
3. Mall tagline line in the hero (muted, under the sub-paragraph).
4. Trust strip band under the product grid ("One ID · Honest prices · Your data is
   yours", single accent, no rainbow).
5. Gates: build → secret-scan → commit `phase4: …` → push → CI → live probe (SW-bust)
   → screenshot → closing section below.

## RISKS

- R1 copy drift → all strings verbatim from F4/GUARANTEE.md, single source.
- R2 layout squeeze on 4-col grid → overline is 1-line, card already fits content.
- R3 SW staleness → probe uses `?p4bust=` cache-bust + fresh bundle check.

## EXECUTING

(Build notes appended during execution.)

## MONITORING & CONTROL

- Tripwire: any gate fail = no phase advance; recorded here.
- Regression harness: `/tmp/p4-baseline.cjs` re-run post-deploy as `/tmp/p4-verify.cjs`
  with signage assertions flipped to REQUIRED.

## TESTING — Gate evidence

(Appended post-deploy.)

## CLOSING

(Appended at close: ACTUAL vs planned, lessons, Phase 5 handoff.)
