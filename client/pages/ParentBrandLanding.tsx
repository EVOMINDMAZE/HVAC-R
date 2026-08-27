import { useState } from "react";
import {
  Snowflake,
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  Layers,
  Globe,
  Waves,
} from "lucide-react";

// ── ThermoNeural — Parent Brand Landing ────────────────────────────────────
// The one professional face for the whole product family. Presents each product
// with a real "Learn More" link to its live app. Dark-first, single indigo
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
    url: "https://github.com/EVOMINDMAZE/cryovo",
    status: "In development",
    icon: ShieldCheck,
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
  const statusColor =
    product.status === "Live"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : product.status === "Beta"
        ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
        : "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return (
    <a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex flex-col rounded-2xl border border-white/10 bg-card/50 p-7 transition hover:border-indigo-500/50 hover:bg-card/80"
    >
      <div className="flex items-center justify-between">
        <div className="rounded-lg bg-indigo-600/15 p-3 text-indigo-300">
          <Icon className="h-6 w-6" />
        </div>
        <Badge status={product.status} />
      </div>
      <h3 className="mt-5 text-xl font-bold text-white">{product.name}</h3>
      <p className="mt-0.5 text-sm font-medium text-indigo-300">{product.tagline}</p>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-white/60">{product.description}</p>
      <div className="mt-6 flex items-center gap-1.5 text-sm font-semibold text-white/80 group-hover:text-indigo-300">
        Learn more
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
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
    <div className="min-h-screen bg-[#0f0f1a] text-white antialiased">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-indigo-600 p-1.5">
            <Layers className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">ThermoNeural</span>
        </div>
        <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
          <a href="#products" className="hover:text-white">Products</a>
          <a href="#platform" className="hover:text-white">Platform</a>
          <a href="/platform" className="hover:text-white">Business platform</a>
          <a href="#contact" className="hover:text-white">Contact</a>
        </nav>
        <a
          href="#products"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-500"
        >
          Explore the suite
        </a>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-16 text-center">
        <p className="mx-auto mb-5 inline-block rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-300">
          The ThermoNeural platform
        </p>
        <h1 className="mx-auto max-w-3xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl md:text-6xl">
          Thermal engineering,{" "}
          <span className="bg-gradient-to-r from-indigo-400 to-indigo-600 bg-clip-text text-transparent">
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
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            See the products
          </a>
          <a
            href="#contact"
            className="rounded-lg border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 transition hover:border-indigo-500/50 hover:text-white"
          >
            Talk to the team
          </a>
        </div>
      </section>

      {/* Products */}
      <section id="products" className="mx-auto max-w-6xl px-6 py-16">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white sm:text-3xl">The product family</h2>
            <p className="mt-2 text-white/60">
              Four products. One engineering story, from the first calculation to the compliance record.
            </p>
          </div>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Platform pillars */}
      <section id="platform" className="mx-auto max-w-6xl px-6 py-16">
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
                <Icon className="h-6 w-6 text-indigo-300" />
                <h3 className="mt-4 text-lg font-bold text-white">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">{p.body}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Contact / CTA */}
      <section id="contact" className="mx-auto max-w-6xl px-6 py-16">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-indigo-600/20 to-[#0f0f1a] p-10 text-center">
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
                  className="w-full rounded-lg border border-white/15 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  onClick={submitContact}
                  disabled={submitting}
                  className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-60"
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

      {/* Footer */}
      <footer className="border-t border-white/10 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-white/40 md:flex-row">
          <div className="flex items-center gap-2">
            <span className="text-white/60">ThermoNeural</span>
            <span>·</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#products" className="hover:text-white/70">Products</a>
            <a href="/platform" className="hover:text-white/70">Business platform</a>
            <a href="https://simulateon.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              <ArrowUpRight className="inline h-3.5 w-3.5" /> PhasePoint
            </a>
            <a href="https://vanclass-app.vercel.app" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              VanClass
            </a>
            <a href="https://www.linkedin.com/company/thermoneural" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              LinkedIn
            </a>
            <a href="https://twitter.com/thermoneural" target="_blank" rel="noopener noreferrer" className="hover:text-white/70">
              X/Twitter
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
