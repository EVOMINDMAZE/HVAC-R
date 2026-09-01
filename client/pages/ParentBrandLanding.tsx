import { useState } from "react";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { Link } from "react-router-dom";
import {
  Snowflake,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Layers,
  Globe,
  Waves,
  Building2,
} from "lucide-react";

// ── ThermoNeural — Parent Brand Landing ────────────────────────────────────
// The one professional face for the whole product family. Presents each product
// with a real "Learn More" link to its live app. Dark-first, single orange accent
// accent (matches the suite's design hard-bar), no mock/placeholder content.

type Product = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  status: "Live" | "Beta" | "In development";
  icon: typeof Snowflake;
};

const PRODUCTS: Product[] = [
  {
    id: "phasepoint",
    name: "PhasePoint",
    tagline: "Refrigeration engineering, proven",
    description:
      "The professional refrigeration-cycle analysis suite — standard, cascade, two-stage and cryogenic systems on real CoolProp physics, with P-h diagrams, refrigerant comparison, AHRI compressor-map import and client-ready PDF reports.",
    url: "https://simulateon.vercel.app",
    status: "Live",
    icon: Snowflake,
  },
  {
    id: "vanclass",
    name: "VanClass",
    tagline: "HVAC&R certification, audio-first",
    description:
      "Audio-first HVAC&R certification training built for the field — lessons you can learn on the drive to the job, with a complete curriculum that takes a technician from apprentice to certified.",
    url: "https://vanclass-app.vercel.app",
    status: "Beta",
    icon: GraduationCap,
  },
  {
    id: "cryovo",
    name: "Cryovo",
    tagline: "Cold-chain compliance",
    description:
      "Enterprise cold-chain and F-gas compliance — leak-rate tracking, refrigerant obligations and audit-ready records for facilities that can't afford a compliance gap.",
    url: "https://cryovo.vercel.app",
    status: "Beta",
    icon: ShieldCheck,
  },
  {
    id: "platform",
    name: "HVAC Business Platform",
    tagline: "Dispatch, invoicing and AI, in one box",
    description:
      "The operations suite for the HVAC&R business — dispatch, invoicing, client relationships and live AI diagnostics in a single source of truth, built to scale a growing contracting company.",
    url: "/platform",
    status: "Live",
    icon: Layers,
  },
];

const PILLARS = [
  {
    title: "One engine, every calculation",
    body: "Every number across the suite traces to CoolProp — the same open reference library used in refrigeration research. No lookup tables, no vendor coefficients hidden in the math.",
    icon: Waves,
  },
  {
    title: "Built for the working engineer",
    body: "From a technician charging a system on site to a plant engineer sizing a cascade, each product is anchored to a real job — not a feature list.",
    icon: Layers,
  },
  {
    title: "Across the whole lifecycle",
    body: "Design, analyse, certify and comply — one platform that follows the refrigerant from the first calculation to the compliance record.",
    icon: Globe,
  },
];

function ProductCard({ product }: { product: Product }) {
  const Icon = product.icon;
  const isInternal = product.url.startsWith("/");
  const inner = (
    <>
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-primary/15 p-3 text-primary">
          <Icon className="h-6 w-6" />
        </div>
        <Badge status={product.status} />
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{product.name}</h3>
      <p className="mt-0.5 text-sm font-medium text-primary">{product.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{product.description}</p>
      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-primary">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </>
  );
  const cls =
    "group relative flex flex-col rounded-2xl border border-white/10 bg-card/50 p-7 transition hover:border-primary/50 hover:bg-card/80";
  return isInternal ? (
    <Link to={product.url} className={cls}>
      {inner}
    </Link>
  ) : (
    <a href={product.url} target="_blank" rel="noopener noreferrer" className={cls}>
      {inner}
    </a>
  );
}

function Badge({ status }: { status: Product["status"] }) {
  const cls =
    status === "Live"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "Beta"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return (
    <span className={`rounded-full border px-2.5 py-1 text-xs font-medium ${cls}`}>
      {status}
    </span>
  );
}

export function ParentBrandLanding() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<null | "success" | "error">(null);

  const submitContact = async () => {
    if (!email.includes("@") || submitting) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch("https://formsubmit.co/evomindmaze@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: "[ThermoNeural] Contact from the parent landing page",
          _template: "table",
          _captcha: "false",
          email,
        }),
      });
      setStatus(res.ok ? "success" : "error");
      if (res.ok) setSubmitted(true);
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PublicPageShell>
      <div className="dark bg-[#0f0f1a] text-white antialiased">

      {/* Hero */}
      <section className="mx-auto max-w-7xl px-6 pb-20 pt-16 text-center">
        <p className="mx-auto mb-5 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          The ThermoNeural platform
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Thermal engineering,{" "}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            as one platform.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/60">
          Design, analyse, certify and comply — one product family built on one
          physics engine and the real work of refrigeration engineers. Explore the
          suite below.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#products"
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
          >
            See the products
          </a>
          <a
            href="#contact"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-primary/50 hover:text-white"
          >
            Talk to the team
          </a>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">The product family</h2>
            <p className="mt-2 text-white/60">
              Four products. One engineering story, from the first calculation to the compliance record.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Platform pillars */}
      <section id="platform" className="mx-auto max-w-7xl px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">Why it holds together</h2>
          <p className="mx-auto mt-2 max-w-2xl text-white/60">
            The products are separate because the jobs are different. The engine and the
            standards are not.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {PILLARS.map((p) => {
            const Icon = p.icon;
            return (
              <div key={p.title} className="rounded-2xl border border-white/10 bg-card/40 p-7">
                <Icon className="h-6 w-6 text-primary" />
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Cross-product flow — one unit, one lifecycle (backed by the shared registry) */}
      <section className="mx-auto max-w-7xl px-6 pb-4">
        <div className="rounded-3xl border border-white/10 bg-card/30 p-8 sm:p-10">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">One unit, one lifecycle</h2>
            <p className="mx-auto mt-2 max-w-2xl text-white/60">
              A single piece of equipment is shared across the whole family through one registry —
              so the unit you dispatch on is the unit we calculate on is the unit we prove compliance for.
            </p>
          </div>

          <div className="mt-10 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
            {[
              { icon: Waves, step: "1", title: "The Box", body: "Dispatch a job on the asset.", accent: "text-orange-300" },
              { icon: Globe, step: "2", title: "PhasePoint", body: "Run the physics on the same asset.", accent: "text-sky-300" },
              { icon: ShieldCheck, step: "3", title: "Cryovo", body: "Prove cold-chain & F-gas compliance.", accent: "text-teal-300" },
            ].map(({ icon: Icon, step, title, body, accent }, i) => (
              <div key={title} className="contents">
                {i > 0 && (
                  <div className="hidden items-center justify-center md:flex">
                    <ArrowRight className="h-6 w-6 text-white/30" />
                  </div>
                )}
                <div className="rounded-2xl border border-white/10 bg-background/50 p-6">
                  <div className="flex items-center justify-between">
                    <Icon className={`h-6 w-6 ${accent}`} />
                    <span className="text-xs font-bold text-white/30">Step {step}</span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-white/60">{body}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-white/50">
            Shared equipment identity across The Box, PhasePoint and Cryovo — one record, no re-entry, no silos.
            <span className="block mt-1">ThermoNeural is a system, not three tools.</span>
          </p>
        </div>
      </section>

      {/* For enterprises — BD / investor positioning */}
      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="mb-4 inline-block rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              For enterprises & partners
            </p>
            <h2 className="text-3xl font-bold text-white sm:text-4xl">
              Compliance is not optional. <br className="hidden sm:block" />
              Neither is the gap it leaves.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-relaxed text-white/60">
              With the EU F-gas quota tightening every year, a facility that can't show
              its leak-rate and refrigerant obligations on demand is exposing itself to
              fines, downtime and lost contracts. Cryovo turns that exposure into an
              audit-ready record — and the platform that produces the calculation behind
              it gives you the numbers to back it up.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://cryovo.vercel.app"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90"
              >
                Explore Cryovo
              </a>
              <a
                href="#contact"
                className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-primary/50 hover:text-white"
              >
                Talk to sales
              </a>
            </div>
          </div>

          <div className="grid gap-4">
            {[
              { k: "Regulatory risk", v: "F-gas quota, leak-rate and reporting obligations — on an audit-ready record" },
              { k: "Downstream value", v: "The engineering engine behind the compliance number, so every figure is provable" },
              { k: "Deployment", v: "Cloud, no-install; scoped to a facility, a fleet, or a whole enterprise" },
              { k: "Built to scale", v: "From a single site to a national cold-chain network" },
            ].map((item) => (
              <div key={item.k} className="flex items-start gap-4 rounded-xl border border-white/10 bg-card/40 p-5">
                <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <div className="text-sm font-bold text-white">{item.k}</div>
                  <div className="mt-1 text-sm text-white/60">{item.v}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="mx-auto max-w-7xl px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-primary/20 to-[#0f0f1a] p-10 text-center">
          <h2 className="text-2xl font-bold text-white sm:text-3xl">
            Building the future of thermal engineering
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/60">
            For business development, partnerships and investment enquiries, the team
            would love to hear from you.
          </p>
          <div className="mx-auto mt-6 flex max-w-md flex-col gap-3 sm:flex-row">
            {submitted ? (
              <div className="mx-auto rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-6 py-3 text-sm text-emerald-300">
                Thanks — we'll be in touch.
              </div>
            ) : (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-primary focus:outline-none"
                />
                <button
                  onClick={submitContact}
                  disabled={submitting}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Contact us"}
                </button>
              </>
            )}
            {status === "error" && (
              <p className="text-xs text-red-400 sm:absolute sm:-bottom-5">Something went wrong — please email us directly.</p>
            )}
          </div>
        </div>
      </section>

      </div>
    </PublicPageShell>
  );
}
