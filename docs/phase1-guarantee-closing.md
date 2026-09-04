# Phase 1 — The Guarantee (CLOSING RECORD)

**Status: GO — COMPLETE. All 4 products live. Gate passed 2026-09-04.**

## Planned vs ACTUAL

| Item | Planned | Actual |
|---|---|---|
| Box footers | GuaranteeStrip in Footer + UmbrellaFooter | ✅ Shipped `8f6ec44` (Terms §3 `#guarantee`, sections renumbered 1–10) |
| PhasePoint footer | strip + terms section | ✅ LIVE — strip in Footer.tsx L207, Terms §3 inserted, stale §16 "no payments processed" rewritten to live-checkout refund wording |
| VanClass footer | verbatim 3-clause strip | ✅ LIVE — **honest 2-clause strip** (cancel + 30-day); export clause OMITTED because no CSV-export tool exists in VanClass |
| Cryovo footer | verbatim 3-clause strip | ✅ LIVE — 3 clauses (signed reports + CSV export ✅ real, portal cancel ✅ real, 30-day ✅) |
| Terms sections | 4 apps | ✅ Box §3, PhasePoint §3, VanClass §3 strengthened, Cryovo §4 strengthened |
| Live probe | 4 domains | ✅ 5 surfaces (umbrella + platform counted separately) — strip anchor + `/terms#guarantee` link verified in footer text on every surface, zero real console errors (probe: /tmp/g2-probe.cjs, screenshots /tmp/g2-*.png, g1 cryovo/vanclass) |

## Clause truth matrix (no-mock rule applied)

- **Box**: data export ✅ / cancel ✅ / 30-day ✅ — all backed
- **PhasePoint**: portal ✅ / CSV export ✅ / 30-day ✅
- **VanClass**: portal ✅ / **no export claim** ✅ honest / 30-day ✅
- **Cryovo**: signed reports + CSV ✅ / portal cancel ✅ (**built new `/api/portal` + "Manage billing" button — terms claimed cancel-anytime with no backing feature; built rather than weakened copy**) / 30-day ✅

## Deploys

- Box: `8f6ec44` → Netlify git-integration → thermoneural.com (verified live via footer text)
- PhasePoint: committed + `vercel --prod --yes` (tsc 0 errors, 115/115 tests)
- VanClass: committed + `vercel --prod --yes` (next build exit 0)
- Cryovo: `88eb7ac` "phase1: ThermoNeural Guarantee — Stripe billing portal (/api/portal + Manage billing), guarantee strip in footer, terms §4 one-click cancel path" + `vercel --prod --yes` (dpl_D72cnj9qPcxUXwLGqw9DvUn46XKQ, build exit 0, /api/portal in route list)

## Lessons learned

1. **Playwright probes: never slice text before matching.** First gate run showed 3 false FAILs purely because the probe truncated footer innerText at 300 chars. Match against full text, report tails.
2. **`require()` resolves from the script's own path, not cwd** — /tmp scripts need `NODE_PATH=<repo>/node_modules node script.cjs` (run from a repo that has playwright).
3. **"Deployed" ≠ "aliased"**: first `vercel --prod --yes` for Cryovo returned early with next-steps JSON; re-running produced the full build + "Aliased" confirmation. Re-run until `readyState: READY` + alias line.
4. **No-mock forces feature builds, not copy edits** — Cryovo's unbacked "cancel from your account" claim became a real billing-portal route. Cost: ~1 hour; benefit: terms are now true on every product.
5. **Honesty per product beats verbatim copy** — VanClass (no export tool) ships 2 clauses; the guarantee reads different across products but every word is true.

## Next steps → Phase 2 initiation trigger

**Phase 2 (The Handoff — one login, surfaced) is triggered by this closing record.** Charter:
- **Goal**: signed-in Box user lands on PhasePoint (and ideally VanClass/Cryovo) and is recognized — or honestly one-clicks via magic link. Document the REAL SSO truth (same Supabase project ≠ shared cookies across different domains).
- **Deep search first**: verify whether supabase-js session storage is shared/localStorage-per-domain across the 4 domains; probe an actual QA session cross-domain.
- **Gate**: recorded walkthrough — QA user signed into Box lands on PhasePoint recognized (or one-click) — screenshot evidence; no fake SSO claims.
- **Out of scope**: new Supabase projects, migrating auth providers, umbrella dashboard.
