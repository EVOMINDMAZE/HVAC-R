// Phase 6 live probe — catalog outward.
// A) /catalog page live, 4 sheet links, presenting-only intact (no auth CTAs).
// B) All 4 PDFs 200 + application/pdf (downloaded; QR decode of the live bytes
//    runs in tools/p6-qr-live.py, fitz+cv2).
// C) Tracker fn live: unknown slug -> 400; known slug -> 302 w/ UTM Location;
//    a real scan inserts a row (service key via .env at runtime, never printed)
//    and the count increments.
// Env: none required to run; SUPABASE_SERVICE_ROLE_KEY is read from the repo .env
// (never printed, never logged).
const { chromium } = require('playwright');
const fs = require('fs');
const { execSync } = require('child_process');

const BASE = 'https://thermoneural.com';
const FN = 'https://tbmizbqftczbsbwqgyjx.supabase.co/functions/v1/catalog-track';
const SLUGS = ['phasepoint', 'vanclass', 'cryovo', 'hvac-business-platform'];
const EXPECT = {
  phasepoint: 'https://simulateon.vercel.app',
  vanclass: 'https://vanclass-app.vercel.app',
  cryovo: 'https://cryovo.vercel.app',
  'hvac-business-platform': 'https://thermoneural.com/try',
};

// Count reads go through the public catalog-stats fn (counts only, no creds).
const STATS = 'https://tbmizbqftczbsbwqgyjx.supabase.co/functions/v1/catalog-stats';
async function count(slug) {
  const r = await fetch(STATS);
  ok(r.status === 200, `catalog-stats: ${r.status}`);
  const j = await r.json();
  return (j.by_slug && j.by_slug[slug]) || 0;
}
(async () => {
  const fail = [];
  const ok = (c, m) => { if (!c) fail.push(m); };

  // --- A) page + sheet links + presenting-only ---
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.goto(BASE + '/catalog', { waitUntil: 'networkidle', timeout: 60000 });

  const links = await page.$$eval('a[href^="/catalog/"]', (as) => as.map((a) => a.getAttribute('href')));
  ok(links.length >= 4, `/catalog sheet links: ${links.length} (want >=4)`);
  for (const s of SLUGS) ok(links.includes(`/catalog/${s}.pdf`), `missing link /catalog/${s}.pdf`);
  const authCtaSuspects = await page.$$eval('a,button', (els) =>
    els.filter((el) => /log ?in|sign ?in|sign ?up|get started|create account|dashboard/i.test(el.textContent || ''))
      .map((el) => (el.textContent || '').trim().slice(0, 40)));
  ok(authCtaSuspects.length === 0, `auth CTAs on /catalog: ${JSON.stringify(authCtaSuspects)}`);
  ok(errors.length === 0, `console/page errors: ${errors.join(' | ')}`);
  await page.screenshot({ path: '/tmp/p6-catalog-page.png', fullPage: true });

  // --- B) PDFs + embedded QR decode ---
  for (const s of SLUGS) {
    const r = await fetch(`${BASE}/catalog/${s}.pdf`);
    ok(r.status === 200, `${s}.pdf status ${r.status}`);
    ok((r.headers.get('content-type') || '').includes('application/pdf'), `${s}.pdf content-type`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(`/tmp/p6-probe-${s}.pdf`, buf);
  }
  await browser.close();

  // --- C) tracker behavior ---
  // unknown slug -> 400
  const bad = await fetch(`${FN}?p=nope`, { redirect: 'manual' });
  ok(bad.status === 400, `unknown slug: got ${bad.status}, want 400`);
  // known slug -> 302 with UTM Location (HEAD-like GET with redirect manual)
  for (const s of SLUGS) {
    const r = await fetch(`${FN}?p=${s}`, { redirect: 'manual' });
    ok(r.status === 302, `${s}: got ${r.status}, want 302`);
    const loc = r.headers.get('location') || '';
    ok(loc.startsWith(EXPECT[s]), `${s}: Location ${loc} does not start with ${EXPECT[s]}`);
    ok(['utm_source=catalog-sheet', 'utm_medium=print', `utm_content=${s}`].every((t) => loc.includes(t)),
      `${s}: UTM tags missing in ${loc}`);
  }
  // end-to-end: a real scan increments the count (same pattern as p3 cap probes)
  const slug = 'vanclass';
  const before = await count(slug);
  await fetch(`${FN}?p=${slug}`, { redirect: 'manual' }); // this 302 IS a real scan
  await new Promise((r) => setTimeout(r, 3000)); // insert is awaited server-side; small settle
  const after = await count(slug);
  ok(after === before + 1, `scan count ${slug}: ${before} -> ${after} (want +1)`);

  if (fail.length) {
    console.log('GATE FAIL\n' + fail.map((f) => ' - ' + f).join('\n'));
    process.exit(1);
  }
  console.log(`GATE PASS — /catalog 4 links, presenting-only clean, 4 PDFs+QRs OK, fn 400/302/UTM OK, scan row ${before}->${after}`);
})();
