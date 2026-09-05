// Catalog — the mall's print counter (Phase 6, Catalog Outward).
// Public page: every department sheet in one place, with a plain-language
// explainer of what the sheets are for and what a scan records.
// Presenting-only: no auth CTAs (regression gate in tools/p6-verify.cjs).

import { FileText, QrCode, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";

type Sheet = {
  id: string;
  // Tracker slug in catalog_scans — equals the id EXCEPT the platform sheet
  // (its PDF filename and tracker slug are "hvac-business-platform").
  slug: string;
  name: string;
  department: string;
  tagline: string;
  sheet: string;
};

// Live scan counter served by the public catalog-stats Edge Function
// (counts only — no rows, no user agents). Null = still loading;
// failed = fn unreachable, rendered as an honest offline note, never a fake 0.
type Stats = { total: number; by_slug: Record<string, number> };

// Mirrors PRODUCTS in ParentBrandLanding.tsx (sheets only — keep in sync).
const SHEETS: Sheet[] = [
  {
    id: "phasepoint",
    slug: "phasepoint",
    name: "PhasePoint",
    department: "Simulation & Engineering",
    tagline: "Refrigeration engineering, proven",
    sheet: "/catalog/phasepoint.pdf",
  },
  {
    id: "vanclass",
    slug: "vanclass",
    name: "VanClass",
    department: "Training & Certification",
    tagline: "HVAC&R certification, audio-first",
    sheet: "/catalog/vanclass.pdf",
  },
  {
    id: "cryovo",
    slug: "cryovo",
    name: "Cryovo",
    department: "Cold Chain Compliance",
    tagline: "Cold-chain compliance",
    sheet: "/catalog/cryovo.pdf",
  },
  {
    id: "platform",
    slug: "hvac-business-platform",
    name: "HVAC Business Platform",
    department: "Business Operations",
    tagline: "Dispatch, invoicing and AI, in one box",
    sheet: "/catalog/hvac-business-platform.pdf",
  },
];

const STATS_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/catalog-stats`;

export default function Catalog() {
  // Real scan counts from the catalog-stats fn. Null = loading ("—"),
  // failed = fn unreachable → honest offline note, never a fabricated 0.
  const [stats, setStats] = useState<Stats | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(STATS_URL)
      .then((r) =>
        r.ok
          ? (r.json() as Promise<Stats>)
          : Promise.reject(new Error(`HTTP ${r.status}`)),
      )
      .then((s) => {
        if (!cancelled) setStats(s);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <PublicPageShell brand="umbrella">
      <div className="dark bg-[#0f0f1a] text-white antialiased">
        {/* Hero */}
        <section className="mx-auto max-w-7xl px-6 pb-12 pt-16 text-center">
          <p className="mx-auto mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            The ThermoNeural catalog
          </p>
          <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            One page per product.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Honest prices in print.
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-white/60">
            Each sheet is a one-page department leaflet — what the product does,
            what it costs, and the guarantee in writing. Print it, hand it to a
            technician, pin it in the break room.
          </p>
        </section>

        {/* Sheets grid */}
        <section className="mx-auto max-w-7xl px-6 pb-16">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {SHEETS.map((s) => (
              <div
                key={s.id}
                className="flex flex-col rounded-2xl border border-white/10 bg-card/50 p-7 transition hover:border-primary/50 hover:bg-card/80"
              >
                <FileText className="h-6 w-6 text-primary" />
                <h2 className="mt-4 text-lg font-bold text-white">{s.name}</h2>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-white/45">
                  {s.department}
                </p>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">
                  {s.tagline}
                </p>
                <a
                  href={s.sheet}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition hover:text-primary/80"
                >
                  <FileText className="h-4 w-4" />
                  Open the sheet (PDF)
                </a>
              </div>
            ))}
          </div>

          {/* Live scan counter — real numbers from catalog-stats, or an honest offline note */}
          <div className="mt-10 rounded-2xl border border-white/10 bg-card/50 p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white">
                  QR scans counted so far
                </div>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  Live from the sheet tracker — every scan of a printed QR
                  adds one. Counts only, never personal data.
                </p>
              </div>
              <div className="text-4xl font-extrabold text-white tabular-nums">
                {failed ? "—" : (stats?.total ?? 0).toLocaleString()}
              </div>
            </div>
            {failed ? (
              <p className="mt-4 text-sm text-white/50">
                Counter is offline right now — the sheets still work, and
                every scan is still recorded.
              </p>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {SHEETS.map((s) => (
                  <div
                    key={s.slug}
                    className="rounded-xl border border-white/10 bg-card/40 px-4 py-3"
                  >
                    <div className="truncate text-xs font-semibold text-white/60">
                      {s.name}
                    </div>
                    <div className="mt-0.5 text-2xl font-bold tabular-nums text-white">
                      {stats ? (stats.by_slug[s.slug] ?? 0).toLocaleString() : "—"}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Print counter explainer */}
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card/40 p-6">
              <QrCode className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-bold text-white">
                  Every printed sheet has a QR code
                </div>
                <div className="mt-1 text-sm leading-relaxed text-white/60">
                  Scanning it opens the product's free tier — no card, no
                  account first. That's the whole trick: the paper walks into
                  shops, the free tier does the selling.
                </div>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-card/40 p-6">
              <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <div>
                <div className="text-sm font-bold text-white">
                  What a scan records
                </div>
                <div className="mt-1 text-sm leading-relaxed text-white/60">
                  Only that a sheet was scanned — which product, the browser's
                  user agent, nothing else. No personal data, no tracking
                  cookies, and your visit to the product stays between you and
                  it.
                </div>
              </div>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-white/50">
            Walk in free, try before you buy, leave with your data.
          </p>
        </section>
      </div>
    </PublicPageShell>
  );
}
