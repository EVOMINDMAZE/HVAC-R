#!/usr/bin/env python3
"""Phase 5 — ThermoNeural department sheets (4 one-page A4 PDFs).
Uses the real pdf-studio design system (build_css + render_section + page-footer
fragment) assembled WITHOUT the forced cover — a catalog sheet is one page.
Every fact traced to source: HVAC-R client/lib/stripe.ts PLANS, simulateon
client/lib/tiers.ts, vanclass-app pricing page, cryovo pricing page,
HVAC-R docs/GUARANTEE.md (verbatim guarantee copy).
"""
import sys, json
sys.path.insert(0, "/Users/riad/projects/gumroad-pipeline")
sys.path.insert(0, "/Users/riad/projects/gumroad-pipeline/products")
import pdf_studio_loader  # noqa: F401  (hyphen-safe import of pdf-studio.py)
from pdf_studio import build_css, render_section, _render_with_playwright, BASE
from pathlib import Path

OUT = Path("/Users/riad/projects/HVAC-R/public/catalog")
OUT.mkdir(parents=True, exist_ok=True)

GUARANTEE_STRIP = ("The ThermoNeural Guarantee: your data is yours — export everything, "
                   "cancel anytime, 30-day money-back.")
GUARANTEE_CLAUSES = [
    "Your data is yours. Everything you build in a ThermoNeural product can be exported in open formats — CSV and PDF — with one click. If you cancel, your account continues on the Free plan and nothing you created is deleted.",
    "Cancel anytime. You can manage or cancel your subscription yourself, from your profile, in one place. No phone calls, no emails, no retention scripts. Cancellation takes effect at the end of your current billing period.",
    "30-day money-back. If your first invoice on any paid plan doesn't earn its keep, email support@thermoneural.com within 30 days of payment for a full refund. No forms, no interrogation.",
]
MALL_STRIP = [["Walk in free", "try before you buy, leave with your data"],
              ["One ID", "Honest prices · Your data is yours"]]

PRODUCTS = [
    dict(slug="phasepoint", name="PhasePoint", dept="Simulation & Engineering",
         status="Live", url="https://simulateon.vercel.app",
         one="The professional refrigeration-cycle analysis suite on real CoolProp physics.",
         table=dict(headers=["Plan", "Price", "What you get"], num_cols=[1], rows=[
             ["Free", "$0", "20 calculation runs per month — standard cycle, refrigerant comparison, save & export"],
             ["Pro", "$79/mo", "Everything unlimited — all refrigerants, interactive P-h diagrams, pipe sizing, cascade cycles, A2L charge limits, rack staging, reports, AI troubleshooting"],
             ["Pro (yearly)", "$654/yr", "Same as Pro, two months free"],
             ["Founding rate", "$29/mo", "Pro for $29/mo, locked 12 months — first 100 customers, then $79/mo"],
         ]),
         callout="The founding rate is real and bounded: $29/mo locked for 12 months for the first 100 paying customers. Every number in PhasePoint traces to CoolProp — the same library the pros use.",
         features=["Standard, cascade, two-stage and cryogenic cycle analysis",
                   "Interactive pressure-enthalpy (P-h) diagrams",
                   "Refrigerant comparison across the full library",
                   "A2L charge limits, rack staging and pipe sizing",
                   "Client-ready PDF reports",
                   "Every calculation runs on real CoolProp physics — never canned values"],
         qr_label="Scan — try PhasePoint free"),
    dict(slug="vanclass", name="VanClass", dept="Training & Certification",
         status="Beta", url="https://vanclass-app.vercel.app",
         one="Audio-first HVAC&R certification training built for the drive to the job.",
         table=dict(headers=["Plan", "Price", "What you get"], num_cols=[1], rows=[
             ["Free lesson", "$0", "Start with a complete free lesson — no card"],
             ["Study", "$7/mo", "The full course, audio-first — or $49/yr (2 months free)"],
             ["Pro", "$19/mo", "All 9 modules plus the CEU tracker to keep your certification current"],
             ["EPA 608 Pass Kit", "$29 once", "One-time purchase — everything you need to pass EPA 608"],
         ]),
         callout="Built for technicians: lessons you can learn on the drive to the job, from apprentice to certified. Crew seats for teams are part of the $199/mo plan.",
         features=["Complete curriculum — apprentice to certified",
                   "Audio-first lessons designed for the road",
                   "EPA 608 Pass Kit — one-time $29",
                   "CEU tracker keeps certifications current (Pro)",
                   "Crew plan for teams ($199/mo)"],
         qr_label="Scan — start the free lesson"),
    dict(slug="cryovo", name="Cryovo", dept="Cold Chain Compliance",
         status="Beta", url="https://cryovo.vercel.app",
         one="Enterprise cold-chain and F-gas compliance with audit-ready records.",
         table=dict(headers=["Plan", "Price", "What you get"], num_cols=[1], rows=[
             ["Free", "$0 forever", "1 equipment asset, CSV ingestion, excursion detection, compliance score"],
             ["Pro", "$149/mo", "Unlimited assets, API ingestion, PDF audit-trail reports, email alerts, multi-user"],
             ["Enterprise", "Custom", "Multi-site, F-gas & FSMA 204 workflows, Part 11-aligned e-signatures, dedicated support"],
         ]),
         callout="Compliance that pays for itself the first time it keeps you out of a finding. Start free on one asset — scale to a whole operation when you're ready.",
         features=["Excursion detection across your assets",
                   "Leak-rate tracking and refrigerant obligations",
                   "PDF audit-trail reports for inspectors",
                   "API ingestion for existing sensors (Pro)",
                   "FSMA 204 workflows and Part 11-aligned records (Enterprise)"],
         qr_label="Scan — try Cryovo free"),
    dict(slug="hvac-business-platform", name="HVAC Business Platform", dept="Business Operations",
         status="Live", url="https://thermoneural.com/platform",
         one="The operations suite for the HVAC&R business — dispatch, invoicing, clients and AI diagnostics.",
         table=dict(headers=["Plan", "Price", "What you get"], num_cols=[1], rows=[
             ["Free", "$0", "Up to 10 calculations per month, standard cycle analysis, 1 saved project"],
             ["Pro", "$49/mo", "Unlimited calculations, all analysis tools, PDF export & advanced reporting, 10 saved projects — or $490/yr"],
             ["Precision Engineering Hub", "$199/mo", "White-labeled Pro app, automation engine (Review Hunter, Invoice Chaser), team up to 5 users, client portal, Skool access, SLA — or $1,990/yr"],
         ]),
         callout="One source of truth for a growing contracting company: dispatch, invoicing, client relationships and live AI diagnostics in a single box.",
         features=["Dispatch and job tracking",
                   "Invoicing and client relationships",
                   "Live AI diagnostics on real jobs",
                   "White-label app and client portal (Hub)",
                   "Automation engine: Review Hunter & Invoice Chaser (Hub)"],
         qr_label="Scan — see The Box"),
]

def build_sheet(p):
    S = []
    S.append({"type": "h1", "text": f"{p['name']}  ·  {p['status']}"})
    S.append({"type": "text", "text": f"<b>{p['dept']}</b> — {p['one']}"})
    S.append({"type": "h2", "text": "Honest prices"})
    S.append({"type": "table", **p["table"]})
    S.append({"type": "callout", "kind": "tip", "text": p["callout"]})
    S.append({"type": "h2", "text": "What it does"})
    S.append({"type": "list", "items": p["features"]})
    S.append({"type": "h2", "text": "The ThermoNeural Guarantee"})
    S.append({"type": "list", "items": GUARANTEE_CLAUSES})
    S.append({"type": "h2", "text": "Get started in three steps"})
    S.append({"type": "list", "items": [
        f"Scan the QR code below or visit {p['url'].replace('https://','')}",
        "Create a free account — no credit card needed",
        "Your data is yours: export it anytime, cancel anytime",
    ]})
    S.append({"type": "text", "text": "Questions? <b>support@thermoneural.com</b> &middot; thermoneural.com"})
    S.append({"type": "microstrip", "items": MALL_STRIP})
    return S

def sheet_html(p, zoom=1.0):
    css = build_css("hvac")  # hvac theme = orange/navy mall look
    sections = "".join(render_section(s, "hvac") for s in build_sheet(p))
    # adaptive fill: zoom typography so the sheet uses the page (no fake filler)
    override = f"<style>body{{zoom:{zoom}}}</style>" if zoom != 1.0 else ""
    # QR — always regenerate into private dir (skill pitfall: stale cache per URL+slug).
    # Phase 6: encode the TRACKER URL so scans are countable (302 → product URL
    # with UTM tags). The printed footer line stays the plain product URL — a
    # human who types it still lands right, just untracked.
    import qrcode
    tracker = f"https://tbmizbqftczbsbwqgyjx.supabase.co/functions/v1/catalog-track?p={p['slug']}"
    qr_path = Path("/tmp/p5-qr") / f"qr-{p['slug']}.png"
    qr_path.parent.mkdir(parents=True, exist_ok=True)
    qrcode.make(tracker, border=4).resize((300, 300)).save(qr_path)
    rules = f"<span><b>Department</b>{p['dept']}</span><span><b>Free tier</b>Yes</span><span><b>Status</b>{p['status']}</span>"
    footer = f"""<div class="page-footer">
  <div class="qr"><img src="file://{qr_path}"><span class="qr-label">{p['qr_label']}</span></div>
  <div class="foot-rules">{rules}</div>
  <div class="foot-brand"><b>ThermoNeural</b><br>{p['url'].replace('https://','')} &middot; catalog v1.0</div>
</div>"""
    return f"""<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>{p['name']} — ThermoNeural Catalog</title><style>{css}</style>{override}</head>
<body class="bp-body"><div class="page">{sections}<div class="footer-spacer"></div></div>{footer}</body></html>"""

from pypdf import PdfReader

# Adaptive zoom: largest typography that still fits ONE page (fill rate target ≥85%)
FIT_W, FIT_H = 794, 1050  # printable body inside footer reserve (A4 @96dpi: 1123 - 20mm footer ≈ 1047)

def fit_zoom(p):
    """Zoom from FULL body height at zoom=1 (zoom scales paddings+spacer too)."""
    import subprocess
    probe = Path(f"/tmp/p5-z1-{p['slug']}.html")
    probe.write_text(sheet_html(p, 1.0))
    out = subprocess.run(
        ["node", "-e", """
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage({ viewport: { width: 794, height: 1123 } });
  await pg.goto('file://' + process.argv[1], { waitUntil: 'networkidle' });
  const r = await pg.evaluate(() => Math.max(document.body.scrollHeight, document.querySelector('.page').getBoundingClientRect().height));
  console.log(r);
  await b.close();
})();
""", str(probe)], cwd="/Users/riad/projects/HVAC-R",
        env={**__import__("os").environ, "NODE_PATH": "/Users/riad/projects/HVAC-R/node_modules"},
        capture_output=True, text=True, timeout=90)
    h = float(out.stdout.strip().splitlines()[-1])
    return max(1.0, min(1.45, 1085 / h)), h

summary = []
for p in PRODUCTS:
    zoom, h1 = fit_zoom(p)
    html_path = Path(f"/tmp/p5-{p['slug']}.html")
    out_path = OUT / f"{p['slug']}.pdf"
    import pdfqa
    n, zoom_used, log = 99, zoom, ""
    for attempt in range(5):
        html = sheet_html(p, round(zoom_used, 3))
        def render_fn(html_text, _hp=html_path, _op=out_path, _p=p):
            _render_with_playwright(html_text, _hp, _op, theme="hvac", doc_title=f"{_p['name']} — ThermoNeural Catalog")
        pages, log = pdfqa.render_pdf(html, html_path, out_path, render_fn)
        n = len(PdfReader(str(out_path)).pages)
        if n == 1:
            break
        zoom_used *= 0.93  # deterministic shrink; page count is the only truth
    ok = (n == 1)
    summary.append((p["slug"], out_path, n, ok, zoom_used, h1))
    print(f"{p['slug']}: pages={n} ok={ok} zoom={round(zoom_used,3)} (fit calc {round(zoom,3)}) base_body_h={int(h1)}")

bad = [s for s in summary if not s[3]]
print("ALL ONE-PAGE" if not bad else f"PAGE OVERFLOW: {[s[0] for s in bad]}")
sys.exit(1 if bad else 0)
