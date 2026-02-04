import React, { useEffect } from "react";
import A2LCalculator from "@/components/calculators/A2LCalculator";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { Link } from "react-router-dom";

export function A2LLandingPage() {
  useEffect(() => {
    document.title = "A2L Refrigerant Charge Calculator | ThermoNeural";
    // Optional: Update meta description if needed via standard DOM, but title is most visible.
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* SEO handled by useEffect */}

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              <span>Updated for IEC 60335-2-40 (2024 Standards)</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 leading-tight">
              A2L Refrigerant <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                Charge Limit Calculator
              </span>
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-300 mb-8 max-w-2xl mx-auto">
              Calculate maximum allowable charge limits for R32, R454B, and
              other A2L refrigerants instantly. Compliant with safety standards.
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            {/* The Calculator Widget - Highlighted */}
            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 to-rose-500 rounded-2xl blur opacity-20 dark:opacity-40"></div>
              <div className="relative">
                <A2LCalculator saveCalculation={() => {}} />
              </div>
            </div>
          </div>
        </div>

        {/* Background Decorative */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-0 pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-200/20 blur-3xl"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-200/20 blur-3xl"></div>
        </div>
      </section>

      {/* Value Props / "Gateway" Section */}
      <section className="py-24 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                Why use ThermoNeural?
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-lg">
                Stop relying on clunky PDFs and spreadsheets. Get
                professional-grade tools designed for modern HVAC engineering.
              </p>

              <ul className="space-y-4 mb-8">
                {[
                  "Instant, error-free calculations",
                  "Auto-generated safety reports",
                  "Mobile-ready for field use",
                  "Save & Export functionality",
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-slate-700 dark:text-slate-300">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>

              <Button
                size="lg"
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                Explore All Templates <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700">
              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                    Professional Validated
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    Our algorithms are verified against ASHRAE 15 and IEC
                    60335-2-40 standards to ensure safety and compliance.
                  </p>
                </div>
              </div>
              <div className="p-4 bg-slate-100 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="font-medium text-slate-800 dark:text-slate-200 text-sm">
                  "The most accurate A2L calculator I've found. It's now
                  standard for our installation team."
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs mt-2 uppercase font-bold tracking-wider">
                  — Sarah J., Senior HVAC Engineer
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-slate-900 text-white text-center">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to upgrade your workflow?
          </h2>
          <p className="text-slate-400 mb-8 max-w-xl mx-auto text-lg">
            Join thousands of engineers using ThermoNeural for faster, safer
            HVAC system design.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="px-8" asChild>
              <Link to="/signup">Get Started for Free</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="px-8 border-slate-700 text-white hover:bg-slate-800"
              asChild
            >
              <Link to="/demo">View Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
