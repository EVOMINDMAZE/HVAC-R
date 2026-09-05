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

- Commit `16b4603` — `phase4: directory signage — department labels, mall tagline,
  trust strip on /` (2 files: `ParentBrandLanding.tsx`, this doc).
- Build: 4 sequential patches (type+4 labels → card overline → hero tagline →
  trust strip); TS required-field errors on the 3 not-yet-labeled products appeared
  transiently mid-wave and were cleared by the label patches (expected wave behavior).
- No copy invented: every string verbatim from master plan F4 / GUARANTEE.md.

## MONITORING & CONTROL

- Tripwire never fired; CI run `33981163670` green on first watch.

## TESTING — Gate evidence (live probe `/tmp/p4-verify.cjs`, 2026-09-05, cache-bust `?p4bust=`)

| Gate | Result |
|---|---|
| G1: 4 department labels live | ✅ Business Operations / Simulation & Engineering / Training & Certification / Cold Chain Compliance all present |
| G1: mall tagline live | ✅ "Walk in free, try before you buy, leave with your data." |
| G1: trust strip live | ✅ One ID · Honest prices · Your data is yours |
| G2: no-auth-CTA regression (7 suspects) | ✅ 0/7 present |
| G3: console errors | ✅ 0 |
| G4: build green / secret-scan clean / phase commit | ✅ `16b4603`, scan CLEAN |
| Visual (vision-checked `/tmp/p4-signage.png`) | ✅ labels uppercase orange over names, untruncated, single accent; cookie-consent popup = first-visit gate, not a defect |

## CLOSING

- **GO.** Planned vs ACTUAL: scope shipped exactly as chartered, same day, zero
  scope creep; only surprise was the 600s foreground cap on `gh run watch`
  (moved to background — process hygiene, not a project risk).
- **Lessons:** (1) additive required fields make the compiler enforce the full
  label wave — better than optional-and-maybe-forget; (2) probe-first baseline
  (assertions absent) + verify probe (assertions required) is a cheap, strong
  before/after pair; (3) cookie-consent popup will overlay screenshots on every
  fresh profile — note it in evidence, don't chase it as a bug.
- **KPI note:** signage is the mall map for Phase 5 — the department sheets must
  reuse these exact 4 department names.
- **Handoff:** Phase 4 close triggers **Phase 5 initiation — The Catalog
  (department sheets)**: 4 printable A4 sheets (what it does, honest price,
  guarantee, QR/link) via pdf-studio, offered from `/` cards + contact-form
  autoresponder; gate = PDFs delivered in-chat, links live, no fabricated specs.
