# Phase 6 — Catalog Outward

**Status:** CLOSED 2026-09-05 · **Commits:** `d806732` `27b42da` `72b6b7e` `d3926b2` · **Branch:** `main`

## Charter

Phase 5 printed the leaflets; Phase 6 hands them out and counts who takes them.
The sheet QRs no longer point straight at the products — they point at a
**tracker** that records the scan and then redirects, so a real-world handout
becomes a countable funnel event: sheet → scan → product visit (UTM-tagged).
A new public `/catalog` page is the mall's print counter: every department
sheet in one place with a plain-language explainer.

**ITTO**
- Input: the four Phase 5 PDFs (unchanged content, new QR target)
- Tools: qrcode, fitz/PyMuPDF, cv2, Playwright probe, Supabase Edge Functions, Management API
- Outputs: `catalog_scans` table, `catalog-track` + `catalog-stats` fns,
  4 regenerated PDFs, `/catalog` page, probe tooling in `tools/`
- Gate: QR decode on live bytes; tracker 400/302/UTM; row insert with count
  verified before/after; build; secret scan; CI; live probe

## How the tracking works

- QR encodes `https://<sb-ref>.supabase.co/functions/v1/catalog-track?p=<slug>`
  (slugs: phasepoint, vanclass, cryovo, hvac-business-platform).
- `catalog-track` (public GET): inserts one row (slug, user-agent, referer,
  truncated to 300 chars) via the service role → 302 to the product URL with
  `utm_source=catalog-sheet&utm_medium=print&utm_content=<slug>`. Unknown slug
  → 400. Insert failures log but never dead-end the redirect.
- Visible footer text keeps the **plain product URL** — typed visits land
  correctly, just untracked.
- `catalog_scans`: RLS enabled, zero policies (default deny-all, matching
  `20260901000000_rls_lockdown.sql`); only the service role writes.
- `catalog-stats` (public GET): counts-only aggregate `{total, by_slug}` —
  gives probes (and later the page) a read path without any credential.

## Build notes

- **`supabase db push` cannot run against the shared project**: remote history
  contains `001…018` + sibling-repo migrations (VanClass ×3, Cold-Standard ×1,
  all 2026-09-05). The repo now carries verbatim copies of the four sibling
  files for history readability, but push still refuses. The blessed path per
  the workflow's own comment is *manual* application — automated as a one-shot
  workflow (`apply-p6-migration.yml`) calling the Management API
  `POST /v1/projects/{ref}/database/query`. **The query endpoint returns 201
  (Success Content), not 200** — first run "failed" while actually succeeding.
  Idempotent DDL (`if not exists` throughout), so re-runs are safe.
- **QR verification lesson:** `cv2.QRCodeDetector` cannot decode the busy
  full-page A4 raster (tried dpi 110–200, footer crops, inversion, 3× upscale,
  Otsu — all fail). Extracting the **embedded QR PNG** with fitz `get_images`
  decodes instantly. Extract, don't rasterize. (`tools/p6-qr-live.py`)
- `catalog-track` uses supabase-js, which **returns errors instead of
  throwing** — `catch` alone never fired; the insert error is checked and
  logged explicitly.
- Probe counts read through `catalog-stats`, not a local service key: the
  service key correctly lives only server-side.

## Gate evidence (2026-09-05)

- `tools/catalog-sheets.py` regenerated all 4 sheets; **page count 4/4 = 1**;
  vision QA on rasterized finals PASS (QR intact, no clipping, ~85% fill)
- **QR-LIVE PASS**: all 4 QRs decode from the live-downloaded PDF bytes to the
  tracker URL (embedded-image extraction)
- **GATE PASS** (probe `tools/p6-verify.cjs`): `/catalog` 4 sheet links,
  presenting-only clean (`authCtaSuspects: []`), console errors `[]`, 4× PDF
  HTTP 200 `application/pdf`, unknown slug → 400, known slugs → 302 with all
  three UTM tags, **scan count vanclass 1 → 2** (real insert, counted)
- `npm run build:client` PASS · PWA precache 118 · secret scans CLEAN (×3 pushes;
  env NAMES only per try-demo/ingest-telemetry precedent, zero values)
- CI: `33986193632` green (after transient `invite-user` CLI-setup rate limit);
  `33987236448` green except the same transient on `validate-import`;
  `catalog-track` + `catalog-stats` deployed ✓ in both; one-shot DDL run
  `33988227516` — HTTP 201, table live (`{"total":0,"by_slug":{}}` → then real rows)

## Honest limits

- Counts prove scans, not humans: one curl = one row (the probe's own +1 is in
  the table). UA/referer are stored to make obvious bot traffic excludable later.
- The one-shot wrapper is retained as the record of how `catalog_scans` was
  applied; delete it whenever the shared-history story changes.
- Phase 5's honest limits carry over: print = best effort (no closed-loop proof
  of physical placement); measurement starts the moment someone scans.

## Handoff

Leaflets are now a funnel, not a flyer. Next multiplier options: show the live
scan counter on `/catalog` (data already public via catalog-stats), put QRs on
in-app "print this catalog" surfaces, or move to the next mall plan item.
Nothing in Phase 6 blocks further phases: all new surface is additive
(2 fns, 1 table, 1 page, same 4 PDFs).
