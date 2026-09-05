# Phase 5 — The Catalog

**Status:** CLOSED 2026-09-05 · **Commit:** `1c8e0d9` · **Branch:** `main`

## Charter

The mall's "printable leaflet" moment: a one-page A4 **department sheet per product** —
what it does, honest prices, the guarantee, a QR code — served from
`/catalog/<slug>.pdf` and linked from each landing-page card. A visitor can walk in
free, take a leaflet, and hand it to a boss or a client.

**ITTO**
- Input: price/feature truth from each product's own source (billing code, pricing pages)
- Tools: pdf-studio design system (`build_css`+`render_section`+page-footer), qrcode, pypdf, Playwright
- Outputs: 4 PDFs + `Catalog sheet (PDF)` link on every card
- Gate: PDF page count == 1 (deterministic); vision QA; build; secret scan; CI; live probe

## Truth source (verbatim, no invented numbers)

| Product | Prices on sheet | Source file |
|---|---|---|
| PhasePoint | Free $0 · Pro $79/mo · Pro yearly $654/yr · Founding $29/mo (locked 12 mo, first 100) | `simulateon/client/lib/tiers.ts` |
| VanClass | Free lesson $0 · Study $7/mo · Pro $19/mo · EPA 608 Pass Kit $29 once | `vanclass-app/app/pricing/page.tsx` |
| Cryovo | Free $0 forever · Pro $149/mo · Enterprise Custom | `cryovo/app/pricing/page.tsx` |
| Box | Free $0 · Pro $49/mo · Precision Engineering Hub $199/mo | `HVAC-R/client/lib/stripe.ts` PLANS |

Guarantee clauses quoted from `docs/GUARANTEE.md` (verbatim). URLs verified live
(4× HTTP 200) before printing. QRs regenerated every build into `/tmp/p5-qr/` —
never cached across URL changes (pdf-studio skill pitfall).

## Build notes

- `render_pdf()` forces a cover → sheets assemble pdf-studio's real CSS + section
  renderers + page-footer **directly** (same design system, no fake cover).
- Adaptive fit: probe body height at zoom 1 → zoom = 1085/h → render → **page count
  is the only truth**; on 2 pages shrink 7% and retry (≤5). Final zooms 0.97–1.06.
  Lesson: `body{zoom}` scales paddings+footer-spacer too — measure the whole body,
  not `.page`.
- Fill achieved with TRUE content only (get-started steps, support contact), never filler.
- No nested anchors: card refactored to a `div.flex.flex-col` wrapper, main card
  anchor (`flex-1` for equal height) + sibling `Catalog sheet (PDF)` anchor below.

## Gate evidence

- Page counts: 4/4 one-page (`pypdf` assert, exit 0)
- Vision QA (4 sheets): prices/tables/QR/footers correct, no clipping, ~82% fill, clean whitespace
- `npm run build:client` PASS · PWA precache 117 · secret scan CLEAN
- Commit `1c8e0d9` pushed; **CI green** — run `33983048028` (watched via `proc_3ef9006d4482`)
- **Live probe GATE PASS** (first attempt, 2026-09-05): linkCount 4, unique set
  {phasepoint, vanclass, cryovo, hvac-business-platform}.pdf, all 4 HTTP 200 with
  `content-type: application/pdf`, authCtaSuspects `[]`, console errors `[]`
- Links on cards: sibling anchors, `target=_blank rel=noopener noreferrer`
- Auth-CTA regression: `/` remains presenting-only (probe asserts zero suspects)

## Autoresponder / one-liner for sharing

"Here's our catalog — one page per product, honest prices, and the ThermoNeural
guarantee in writing: your data is yours, cancel anytime, 30-day money-back.
Scan a QR and you're in the free tier in under a minute."

## Handoff to Phase 6 (per mall plan)

Phase 6 turns the catalog outward — placement/distribution: sheets as real leaflets
(QR → UTM-tagged free-tier entry), catalog page on `/`, and measurement (downloads,
QR scans) so the walk-in is countable. Nothing in Phase 5 blocks it: sheets are
static assets; a catalog index page can list the same PDFs.
