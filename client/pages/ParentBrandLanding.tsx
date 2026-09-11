import { PublicPageShell } from "@/components/public/PublicPageShell";
import { Link } from "react-router-dom";
import {
  Snowflake,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  FileText,
  Layers,
  Newspaper,
} from "lucide-react";

// ── ThermoNeural — Parent Brand Landing (Direction B · Instrument, 2026-09-10) ──
// The one professional face for the product family. Design rules applied here:
//   • Products and REAL prices visible without scrolling — the page's job is to
//     sell, not to be a poster.
//   • No emoji anywhere. No invented proof: every number below is a verified
//     engine output or a real published price.
//   • Pricing psychology that is HONEST — anchors we honour, a cap we actually
//     enforce server-side, per-day framing, annual savings that are arithmetically
//     true.
//   • Works in light AND dark: all surfaces use design tokens; the instrument
//     panel stays dark in both modes because it represents a dark instrument.
//   • Section anchors (#products, #contact) preserved for existing deep links.

type Product = {
  id: string;
  name: string;
  department: string;
  tagline: string;
  description: string;
  url: string;
  status: "Live" | "Beta" | "In development";
  sheet: string; // printable one-page department sheet (catalog PDF)
  icon: typeof Snowflake;
  /** entry price shown on the card — the "starting at" number */
  from: string;
  fromNote: string;
  /** honest anchor: what it costs after the intro offer, and why it's lower now */
  anchor?: string;
  /** a true, checkable capability chip */
  chips: string[];
  accent?: boolean; // render as the flagship card
};

const PRODUCTS: Product[] = [
  {
    id: "phasepoint",
    name: "PhasePoint",
    department: "Simulation & Engineering",
    tagline: "Refrigeration engineering, proven",
    description:
      "Cycle design and proof on real CoolProp physics — interactive P-h diagrams, pipe sizing, 19 refrigerants and a 12-tool advanced set including cascade, two-stage, IHX and transcritical CO₂.",
    url: "https://simulateon.vercel.app",
    status: "Live",
    sheet: "/catalog/phasepoint.pdf",
    icon: Snowflake,
    from: "$29",
    fromNote: "per month · full Pro for the first 100 customers",
    anchor: "Pro is $79/month — the founding rate is $29 while the first 100 last",
    chips: ["COP 2.3392 verified", "19 refrigerants", "Free tier"],
    accent: true,
  },
  {
    id: "vanclass",
    name: "VanClass",
    department: "Training & Certification",
    tagline: "Pass the EPA 608 by listening",
    description:
      "Audio tutor sessions with real quizzes for EPA Section 608 — Universal Core plus Types I, II and III — in five languages, built to be studied on the drive between jobs.",
    url: "https://vanclass-app.vercel.app",
    status: "Live",
    sheet: "/catalog/vanclass.pdf",
    icon: GraduationCap,
    from: "$7",
    fromNote: "per month · about 23¢ a day · lesson 1 free",
    anchor: "Save 57% billed yearly — $99/year for Pro — or start with lesson 1 free",
    chips: ["5 languages", "9 courses", "Free lesson 1"],
  },
  {
    id: "cryovo",
    name: "Cryovo",
    department: "Cold Chain & F-Gas",
    tagline: "Turn temperature logs into evidence",
    description:
      "Every out-of-band excursion detected, timed and documented — the audit-ready record for cold-chain and F-gas regulated facilities. Ingests the loggers you already own.",
    url: "https://cryovo.vercel.app",
    status: "Live",
    sheet: "/catalog/cryovo.pdf",
    icon: ShieldCheck,
    from: "$149",
    fromNote: "per month · first asset free, no card",
    anchor: "No hardware to buy — your existing logs are the input",
    chips: ["No hardware", "PDF audit trail", "Free tier"],
  },
  {
    id: "platform",
    name: "The Box",
    department: "Business Operations",
    tagline: "Run the whole shop",
    description:
      "Jobs, dispatch, clients, invoices, warranty and fleet for HVAC&R contractors — the engineering toolkit attached, so the calculation and the job ticket live in one place.",
    url: "/platform",
    status: "Live",
    sheet: "/catalog/hvac-business-platform.pdf",
    icon: Layers,
    from: "$49",
    fromNote: "per month · free tier covers 10 calculations",
    anchor: "Business Ops is $199/month · yearly billing is two months free",
    chips: ["Jobs → invoices", "Warranty & fleet", "Free tier"],
  },
  {
    id: "cold-standard",
    name: "The Cold Standard",
    department: "Industry Intelligence",
    tagline: "Verified cold-economy intelligence, free weekly",
    description:
      "The weekly briefing for the cold economy — refrigeration, HVAC, cold chain, cryogenics. Every story confirmed by two independent publishers before it runs.",
    url: "https://cold-standard.vercel.app",
    status: "Live",
    sheet: "/catalog/the-cold-standard.pdf",
    icon: Newspaper,
    from: "Free",
    fromNote: "weekly · unsubscribe in one click",
    chips: ["Two-source rule", "No press releases"],
  },
];

// Real, checkable numbers — engine outputs and published prices only.
const PROOF = [
  { value: "2.3392", label: "R410A COP at −10 / 45 °C, η 0.70 — CoolProp" },
  { value: "19", label: "refrigerants incl. R-717, R-744 and A2L" },
  { value: "5", label: "languages of certification training" },
  { value: "$0", label: "hardware to buy — software only" },
];

// Deadlines already in force or dated. Verified against 40 CFR 84 and FSMA 204.
const DEADLINES = [
  { when: "IN FORCE · JAN 1 2025", what: "Residential and light-commercial AC/heat pumps above GWP 700 — manufacture, import and installation restricted." },
  { when: "IN FORCE · JAN 1 2026", what: "The same GWP 700 cutoff extends to new VRF systems." },
  { when: "JUL 20 2028", what: "FSMA 204 traceability — lot-level records for food moving through the cold chain." },
];

export function ParentBrandLanding() {
  return (
    <PublicPageShell mainId="main-content" skipToMain>
      {/* ── HERO: promise left, working instrument right ─────────────────── */}
      <section className="mx-auto max-w-[1280px] px-6 pt-14 pb-8 lg:pt-20">
        <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
              Verified refrigeration engineering
            </span>
            <h1 className="mt-4 text-4xl font-bold leading-[1.06] tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem]">
              Every number traceable. <span className="text-primary">Every record defensible.</span>
            </h1>
            <p className="mt-5 max-w-[56ch] text-base leading-relaxed text-muted-foreground sm:text-lg">
              Five tools for the people who design, certify and run refrigeration systems — one
              physics engine underneath, one account across all of them. Nothing here is estimated.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Start free — no credit card
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="https://simulateon.vercel.app/demo"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                Run a real cycle
              </a>
            </div>
            <p className="mt-4 font-mono text-[11.5px] uppercase tracking-wider text-muted-foreground">
              Free tiers on all five · paid plans from $7/month · cancel in one click
            </p>
          </div>

          {/* The instrument stays dark in both themes: it represents a dark tool. */}
          <div className="rounded-2xl border border-border bg-[#0e1626] p-5 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-[#1d2a3e] pb-3 font-mono text-[11px] text-[#8ba0bb]">
              <span className="h-[7px] w-[7px] rounded-full bg-[#3ddc97]" />
              PHASEPOINT · R410A · EVAP −10 °C / COND 45 °C · η 0.70
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { k: "COP", v: "2.3392", u: "" },
                { k: "Capacity", v: "15.68", u: "kW" },
                { k: "Discharge", v: "77.0", u: "°C" },
                { k: "Evap P", v: "933", u: "kPa" },
                { k: "Cond P", v: "2734", u: "kPa" },
                { k: "Mass flow", v: "0.10", u: "kg/s" },
              ].map((s) => (
                <div key={s.k} className="rounded-lg border border-[#1d2a3e] bg-[#0a1220] px-3 py-2.5">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#8ba0bb]">{s.k}</div>
                  <div className="mt-1 font-mono text-lg tracking-tight text-[#eaf1fb]">
                    {s.v}
                    {s.u && <span className="ml-1 text-[11px] text-[#8ba0bb]">{s.u}</span>}
                  </div>
                </div>
              ))}
            </div>
            <div className="relative mt-3 h-[104px] overflow-hidden rounded-lg border border-[#1d2a3e] bg-[#0a1220]">
              <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 104" preserveAspectRatio="none">
                <path
                  d="M8 92 L96 30 L188 30 L262 62 L340 62 L392 20"
                  fill="none"
                  stroke="#ff7a18"
                  strokeWidth="2"
                />
                <path
                  d="M8 92 L96 30 L188 30 L262 62 L340 62 L392 20 L392 100 L8 100 Z"
                  fill="rgba(255,122,24,0.08)"
                />
                <circle cx="96" cy="30" r="3.2" fill="#ff7a18" />
                <circle cx="262" cy="62" r="3.2" fill="#ff7a18" />
              </svg>
            </div>
            <p className="mt-3 font-mono text-[10.5px] text-[#8ba0bb]">
              Real CoolProp output — open the same cycle free, no signup.
            </p>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS: real prices, visible without scrolling ─────────────── */}
      <section id="products" className="mx-auto max-w-[1280px] px-6 pb-4 pt-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Start with the free tier
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Five products, every one with something free. Pick the one that matches today's problem.
            </p>
          </div>
          <Link
            to="/pricing"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Compare all plans
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PRODUCTS.map((p) => {
            const Icon = p.icon;
            const external = p.url.startsWith("http");
            return (
              <div
                key={p.id}
                className={
                  "flex flex-col rounded-2xl border p-6 transition hover:shadow-lg " +
                  (p.accent
                    ? "border-primary/40 bg-card ring-1 ring-primary/15"
                    : "border-border bg-card/60")
                }
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-bold text-foreground">{p.name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                      {p.department}
                    </div>
                  </div>
                  {p.accent && (
                    <span className="ml-auto rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary">
                      Flagship
                    </span>
                  )}
                </div>

                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{p.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.chips.map((c) => (
                    <span
                      key={c}
                      className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-[10.5px] text-foreground/80"
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                      starting at
                    </span>
                    <span className="font-mono text-3xl font-bold tracking-tight text-foreground">
                      {p.from}
                    </span>
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">{p.fromNote}</p>
                  {p.anchor && (
                    <p className="mt-2 text-[12.5px] text-foreground/70">{p.anchor}</p>
                  )}
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {external ? (
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Open {p.name}
                      <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ) : (
                    <Link
                      to={p.url}
                      className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
                    >
                      Open {p.name}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                  <a
                    href={p.sheet}
                    className="inline-flex items-center gap-1.5 text-[13px] font-medium text-muted-foreground transition hover:text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    One-page sheet
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── PROOF STRIP ───────────────────────────────────────────────────── */}
      <section className="mt-10 border-y border-border bg-muted/30">
        <div className="mx-auto grid max-w-[1280px] gap-6 px-6 py-8 text-center sm:grid-cols-2 lg:grid-cols-4">
          {PROOF.map((s) => (
            <div key={s.label}>
              <div className="font-mono text-2xl font-bold tracking-tight text-foreground">{s.value}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── THE DEADLINES (why this matters now) ──────────────────────────── */}
      <section className="mx-auto max-w-[1280px] px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              The rules changed. The paperwork did not get easier.
            </h2>
            <p className="mt-4 max-w-[58ch] text-sm leading-relaxed text-muted-foreground">
              Each deadline below asks a named person for a specific calculation, a specific
              certificate, or a specific record — and that person usually has a van to load first.
              That is the work these five products exist to do.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                Start free
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                See pricing
              </Link>
            </div>
          </div>
          <div className="space-y-4 border-l-2 border-primary pl-5">
            {DEADLINES.map((d) => (
              <div key={d.when}>
                <div className="font-mono text-[11.5px] tracking-wide text-primary">{d.when}</div>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{d.what}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CLOSING CTA / CONTACT ─────────────────────────────────────────── */}
      <section id="contact" className="mx-auto max-w-[1280px] px-6 pb-16">
        <div className="rounded-2xl border border-border bg-card p-8 sm:p-10">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
                Questions about a specific system?
              </h2>
              <p className="mt-2 max-w-[54ch] text-sm text-muted-foreground">
                Built by an M.Sc. refrigeration engineer. Ask about a cycle, a compliance
                obligation, or which product fits — you will get a real answer, not a sales call.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href="mailto:hello@thermoneural.com"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
              >
                hello@thermoneural.com
              </a>
              <a
                href="/catalog"
                className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-muted"
              >
                <FileText className="h-4 w-4" />
                Printable catalog
              </a>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}

export default ParentBrandLanding;
