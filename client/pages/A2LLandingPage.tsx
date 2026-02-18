import A2LCalculator from "@/components/calculators/A2LCalculator";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";
import { PublicPageShell } from "@/components/public/PublicPageShell";

export function A2LLandingPage() {
  return (
    <PublicPageShell mainClassName="pt-24">
        <SEO
          title="A2L Refrigerant Charge Calculator"
          description="Calculate A2L refrigerant charge limits aligned with modern safety standards."
        />

        <section className="px-4 py-16">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-primary">A2L Calculator</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-semibold">
              A2L refrigerant charge limits, simplified.
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Calculate maximum allowable charge limits for R32, R454B, and other A2L refrigerants
              with workflows aligned to modern safety guidance.
            </p>
          </div>
        </section>

        <section className="px-4 pb-16">
          <div className="max-w-5xl mx-auto">
            <div className="rounded-3xl border border-border/60 bg-background p-6 md:p-10 shadow-sm">
              <A2LCalculator saveCalculation={() => {}} />
            </div>
          </div>
        </section>

        <section className="px-4 py-16 bg-secondary/30">
          <div className="max-w-5xl mx-auto grid gap-8 md:grid-cols-2">
            <div>
              <h2 className="text-3xl font-semibold">Why use ThermoNeural?</h2>
              <p className="mt-4 text-muted-foreground">
                Move beyond static PDFs and spreadsheets. Get consistent, validated calculations with
                exportable documentation for your team.
              </p>
              <ul className="mt-6 space-y-3 text-sm text-muted-foreground">
                {[
                  "Instant, error-checked calculations",
                  "Safety reporting aligned with IEC standards",
                  "Mobile-ready workflows for the field",
                  "Exportable documentation",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-6">
                <Link to="/features">
                  <Button>
                    Explore the platform
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
            <div className="rounded-2xl border border-border/60 bg-background p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Validated workflows</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Calculations follow modern safety standards to support compliance and audit readiness.
                  </p>
                </div>
              </div>
              <div className="mt-6 rounded-xl border border-border/60 bg-secondary/40 p-4">
                <p className="text-sm text-muted-foreground">
                  "The A2L calculator makes it easy to document safety limits for every job."
                </p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-muted-foreground">
                  Field Engineering Team
                </p>
              </div>
            </div>
          </div>
        </section>
    </PublicPageShell>
  );
}
