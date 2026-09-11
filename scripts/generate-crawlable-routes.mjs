#!/usr/bin/env node
/**
 * generate-crawlable-routes.mjs — give every public route of the umbrella its own
 * crawlable HTML document.
 *
 * Why this exists: thermoneural.com is a Vite SPA behind a Netlify
 * `/* → /index.html` rewrite. Before this, /pricing, /platform, /catalog,
 * /features, /about and /contact ALL served the same 6.8 kB document — one
 * generic h1, no prices anywhere. A search engine saw the identical page six
 * times, and the pricing page (where the whole cross-sell ladder lives) was
 * invisible.
 *
 * This writes dist/spa/<route>/index.html from the built shell, with a
 * route-specific <title>, meta description, canonical, social tags and a real
 * copy block between the CRAWLABLE markers inside #root. Netlify serves an
 * existing file ahead of a non-forced rewrite, so /pricing now returns the
 * pricing document. React still mounts over the static block on load, exactly as
 * it did with the single hand-written block — visitors see no difference.
 *
 * Every number below is copied from source of truth (client/lib/stripe.ts PLANS
 * for The Box, client/pages/ParentBrandLanding.tsx PRODUCTS for the family).
 * Run automatically as part of `npm run build:client`.
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DIST = join(ROOT, "dist", "spa");
const ORIGIN = "https://thermoneural.com";
const START = "<!--CRAWLABLE:START-->";
const END = "<!--CRAWLABLE:END-->";

const shell = readFileSync(join(DIST, "index.html"), "utf8");
if (!shell.includes(START) || !shell.includes(END)) {
  throw new Error(
    `index.html is missing the ${START} / ${END} markers — this generator would have nothing to replace.`
  );
}

const LINK = 'style="color:#4ea1ff"';
const H2 = 'style="font-size:18px;margin:26px 0 10px"';
const UL = 'style="line-height:1.9;color:#c7d3e6;padding-left:20px"';
const P = 'style="color:#93a4bd;line-height:1.6;margin:0 0 20px"';

/** The five live products, with the prices the front door advertises. */
const FAMILY = `
      <h2 ${H2}>The product family</h2>
      <ul ${UL}>
        <li><strong>PhasePoint</strong> — refrigeration engineering on real CoolProp physics, from $29/month. <a ${LINK} href="https://simulateon.vercel.app">simulateon.vercel.app</a></li>
        <li><strong>VanClass</strong> — EPA Section 608 certification you study by listening, from $7/month, five languages. <a ${LINK} href="https://vanclass-app.vercel.app">vanclass-app.vercel.app</a></li>
        <li><strong>Cryovo</strong> — cold-chain and F-gas excursions turned into audit-ready evidence, $149/month. <a ${LINK} href="https://cryovo.vercel.app">cryovo.vercel.app</a></li>
        <li><strong>The Box</strong> — HVAC&amp;R business operations, from $49/month. <a ${LINK} href="/platform">/platform</a></li>
        <li><strong>The Cold Standard</strong> — free weekly verified cold-economy intelligence. <a ${LINK} href="https://cold-standard.vercel.app">cold-standard.vercel.app</a></li>
      </ul>`;

const PAGES = [
  {
    path: "/pricing",
    title: "Pricing — ThermoNeural",
    description:
      "ThermoNeural pricing: The Box is free to start, Pro $49/month, Business Ops $199/month (yearly is two months free). Family products start at $29/month for PhasePoint, $7/month for VanClass and $149/month for Cryovo.",
    must: ["Pricing", "$49", "$199"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">ThermoNeural pricing</h1>
      <p ${P}>
        Five products, one account. Every product has a free tier you can use without a
        card; paid plans are monthly with yearly billing at two months free.
      </p>
      <h2 ${H2}>The Box — business operations</h2>
      <ul ${UL}>
        <li><strong>Free</strong> — $0: 10 calculations a month, standard cycle analysis, dashboard.</li>
        <li><strong>Pro</strong> — $49/month ($490/year, two months free): unlimited calculations, every analysis tool, PDF export, advanced reporting, 10 saved projects.</li>
        <li><strong>Business Ops</strong> — $199/month ($1,990/year, two months free): everything in Pro plus the client portal, automation engine, team collaboration for 5 users, advanced analytics and a priority SLA.</li>
      </ul>
      <h2 ${H2}>Starting prices across the family</h2>
      <ul ${UL}>
        <li><strong>PhasePoint</strong> — from $29/month (Solo, one engineer, unlimited calculations). Pro is $79/month, or the $29/month founding rate while the first 100 customers last.</li>
        <li><strong>VanClass</strong> — Study $7/month or Pro $19/month; yearly billing takes 42% and 57% off respectively.</li>
        <li><strong>Cryovo</strong> — $149/month (about $4.90 a day), or $1,490/year, which is two months free. The free tier covers one asset.</li>
        <li><strong>The Cold Standard</strong> — free, weekly, unsubscribe in one click.</li>
      </ul>
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/signup">Start free — no credit card</a> ·
        <a ${LINK} href="/catalog">Product datasheets</a> ·
        <a ${LINK} href="mailto:hello@thermoneural.com">hello@thermoneural.com</a>
      </p>`,
  },
  {
    path: "/platform",
    title: "The Box — run the whole HVAC&R shop | ThermoNeural",
    description:
      "The Box runs HVAC&R business operations: jobs, dispatch, clients, invoices, warranty and fleet — with the verified engineering toolkit attached, so the calculation and the job ticket live in one place. Free to start, Pro $49/month.",
    must: ["The Box", "dispatch", "$49"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">The Box — run the whole HVAC&amp;R shop</h1>
      <p ${P}>
        Jobs, dispatch, clients, invoices, warranty and fleet for HVAC&amp;R contractors.
        The engineering toolkit is attached, so the calculation and the job ticket live
        in one place instead of three.
      </p>
      <h2 ${H2}>What it covers</h2>
      <ul ${UL}>
        <li>Jobs and dispatch, with a technician view and job history</li>
        <li>Clients, estimates and invoices</li>
        <li>Warranty tracking and fleet records</li>
        <li>Standard cycle, cascade, refrigerant comparison, psychrometrics and load calculations on the same CoolProp engine as PhasePoint</li>
        <li>PDF reports and a client portal</li>
      </ul>
      <p ${P}>Free to start — 10 calculations a month, no card. Pro is $49/month; Business Ops is $199/month.</p>
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/signup">Start free</a> ·
        <a ${LINK} href="/pricing">Pricing</a> ·
        <a ${LINK} href="/catalog">Datasheets</a>
      </p>`,
  },
  {
    path: "/catalog",
    title: "Product catalog & datasheets — ThermoNeural",
    description:
      "Datasheets for every ThermoNeural product: PhasePoint (refrigeration engineering), VanClass (EPA 608 certification), Cryovo (cold-chain compliance), The Box (HVAC&R business operations) and The Cold Standard.",
    must: ["Product catalog", "datasheet (PDF)"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">Product catalog</h1>
      <p ${P}>One page per product: what it does, what it costs, and the datasheet as a PDF.</p>
      <ul ${UL}>
        <li><strong>PhasePoint</strong> — <a ${LINK} href="/catalog/phasepoint.pdf">datasheet (PDF)</a> · refrigeration cycle design on CoolProp physics</li>
        <li><strong>VanClass</strong> — <a ${LINK} href="/catalog/vanclass.pdf">datasheet (PDF)</a> · EPA 608 certification by listening, five languages</li>
        <li><strong>Cryovo</strong> — <a ${LINK} href="/catalog/cryovo.pdf">datasheet (PDF)</a> · cold-chain and F-gas excursion evidence</li>
        <li><strong>The Box</strong> — <a ${LINK} href="/catalog/hvac-business-platform.pdf">datasheet (PDF)</a> · HVAC&amp;R business operations</li>
        <li><strong>The Cold Standard</strong> — <a ${LINK} href="/catalog/the-cold-standard.pdf">datasheet (PDF)</a> · free weekly verified intelligence</li>
      </ul>
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/pricing">Pricing</a> ·
        <a ${LINK} href="mailto:hello@thermoneural.com">hello@thermoneural.com</a>
      </p>`,
  },
  {
    path: "/features",
    title: "Features — engineering tools and automations | ThermoNeural",
    description:
      "ThermoNeural features: standard cycle analysis, refrigerant comparison across 19 fluids, cascade and CO₂ systems, psychrometrics, pipe sizing, commercial load calculations, plus business automations.",
    must: ["Features", "Standard Cycle"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">Features</h1>
      <p ${P}>Every calculation runs on the same verified CoolProp engine — no lookup tables, no interpolation guesswork.</p>
      <h2 ${H2}>Engineering tools</h2>
      <ul ${UL}>
        <li>Standard Cycle — COP, refrigeration effect and state points</li>
        <li>Refrigerant Comparison — 19 fluids side by side at identical conditions</li>
        <li>Cascade Cycle — two-stage analysis for ultra-low temperature</li>
        <li>CO₂ transcritical, economizer, IHX and two-stage systems</li>
        <li>Psychrometrics and interactive state analysis</li>
        <li>Pipe sizing with real pressure drops and velocity checks</li>
        <li>Commercial block load calculations</li>
        <li>DIY field calculators</li>
      </ul>
      <h2 ${H2}>Automations</h2>
      <ul ${UL}>
        <li>Review Hunter and Invoice Chaser</li>
        <li>Warranty lookup and job history</li>
        <li>Client portal and PDF reporting</li>
      </ul>
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/signup">Start free</a> ·
        <a ${LINK} href="/pricing">Pricing</a>
      </p>`,
  },
  {
    path: "/about",
    title: "About ThermoNeural — verified refrigeration engineering",
    description:
      "ThermoNeural builds five products on one verified refrigeration physics engine: PhasePoint, VanClass, Cryovo, The Box and The Cold Standard. Every number traces to CoolProp; nothing is estimated.",
    must: ["About ThermoNeural", "CoolProp"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">About ThermoNeural</h1>
      <p ${P}>
        We build engineering and operations software for the cold economy — refrigeration,
        HVAC, cold chain and cryogenics. Five products, one account, one physics engine
        underneath. Every number traces to CoolProp; nothing here is estimated.
      </p>
      <p ${P}>
        The Cold Standard, our weekly intelligence briefing, holds the same line: no story
        runs until two independent publishers confirm it.
      </p>${FAMILY}
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/contact">Contact</a> ·
        <a ${LINK} href="/pricing">Pricing</a> ·
        <a ${LINK} href="mailto:hello@thermoneural.com">hello@thermoneural.com</a>
      </p>`,
  },
  {
    path: "/contact",
    title: "Contact ThermoNeural",
    description:
      "Talk to us about PhasePoint, VanClass, Cryovo, The Box or The Cold Standard — evaluation, crew plans, or a question about a calculation. hello@thermoneural.com.",
    must: ["Contact ThermoNeural", "hello@thermoneural.com"],
    body: `
      <h1 style="font-size:28px;line-height:1.25;margin:0 0 12px">Contact ThermoNeural</h1>
      <p ${P}>Questions about a calculation, a crew plan, or one of the five products — email is the fastest route and a human answers.</p>
      <ul ${UL}>
        <li>General and sales: <a ${LINK} href="mailto:hello@thermoneural.com">hello@thermoneural.com</a></li>
        <li>The Cold Standard corrections: <a ${LINK} href="mailto:corrections@thecoldstandard.app">corrections@thecoldstandard.app</a></li>
      </ul>
      <p style="margin:26px 0 0;line-height:1.9">
        <a ${LINK} href="/pricing">Pricing</a> ·
        <a ${LINK} href="/catalog">Catalog</a>
      </p>`,
  },
];

function buildDocument(page) {
  const canonicalUrl = `${ORIGIN}${page.path}`;
  let html = shell;

  // Route head: title, description, canonical, social tags.
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${page.title}</title>`);
  html = html.replace(
    /<meta name="description"[\s\S]*?\/>/,
    `<meta name="description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta property="og:title"[\s\S]*?\/>/,
    `<meta property="og:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta property="og:url"[\s\S]*?\/>/,
    `<meta property="og:url" content="${canonicalUrl}" />`
  );
  html = html.replace(
    /<meta property="og:description"[\s\S]*?\/>/,
    `<meta property="og:description" content="${page.description}" />`
  );
  html = html.replace(
    /<meta name="twitter:title"[\s\S]*?\/>/,
    `<meta name="twitter:title" content="${page.title}" />`
  );
  html = html.replace(
    /<meta name="twitter:description"[\s\S]*?\/>/,
    `<meta name="twitter:description" content="${page.description}" />`
  );
  if (/<link rel="canonical"/.test(html)) {
    html = html.replace(/<link rel="canonical"[\s\S]*?\/>/, `<link rel="canonical" href="${canonicalUrl}" />`);
  } else {
    html = html.replace("</head>", `  <link rel="canonical" href="${canonicalUrl}" />\n</head>`);
  }

  // Route body between the markers.
  const body = `    <div style="max-width:900px;margin:0 auto;padding:48px 24px;font-family:Inter,system-ui,sans-serif;color:#e6edf7;background:#0a0f17;min-height:100vh">
${page.body}
    </div>`;
  const start = html.indexOf(START) + START.length;
  const end = html.indexOf(END);
  if (start <= 0 || end < start) throw new Error(`marker damage for ${page.path}`);
  html = html.slice(0, start) + "\n" + body + "\n    " + html.slice(end);

  // Sanity: the document must actually carry this route's content.
  const text = html.replace(/<[^>]+>/g, " ");
  const missing = page.must.filter((m) => !text.includes(m));
  if (missing.length) throw new Error(`${page.path}: rendered document missing ${missing.join(" | ")}`);
  if (!new RegExp(`<link rel="canonical" href="${canonicalUrl.replace(/[/.]/g, "\\$&")}"`).test(html)) {
    throw new Error(`${page.path}: canonical not set`);
  }
  return html;
}

let n = 0;
for (const page of PAGES) {
  const html = buildDocument(page);
  const dir = join(DIST, page.path.replace(/^\//, ""));
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "index.html"), html);
  n += 1;
  console.log(
    `  ✓ ${page.path.padEnd(11)} ${String(Buffer.byteLength(html)).padStart(6)} bytes  title="${page.title}"`
  );
}
console.log(`✓ crawlable routes: ${n} route document(s) written to dist/spa/<route>/index.html`);
