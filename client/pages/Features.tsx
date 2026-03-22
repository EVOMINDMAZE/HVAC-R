import {
  Thermometer,
  Shield,
  FileText,
  Users,
  LineChart,
  Database,
  ClipboardCheck,
  Gauge,
  Wallet,
  Zap,
  MessageCircle,
  HardHat,
  Calculator
} from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { BlueprintGrid } from "@/components/ui/BlueprintGrid";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MeasurementLabel } from "@/components/ui/MeasurementLabel";
import { MotionReduced } from "@/components/ui/MotionReduced";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const operationsFeatures = [
  {
    icon: Users,
    title: "Client & CRM Hub",
    description:
      "Maintain continuity across service relationships with searchable customer records and complete job histories.",
  },
  {
    icon: Wallet,
    title: "Invoicing & Estimates",
    description:
      "Generate professional quotes and invoices in the field, get paid faster with integrated payment links.",
  },
  {
    icon: ClipboardCheck,
    title: "Dispatch & Scheduling",
    description:
      "Run intake, assignment, and job priorities from one board shared across office and field teams.",
  },
];

const automationsFeatures = [
  {
    icon: Zap,
    title: "Smart Follow-ups",
    description:
      "Automatically engage customers after service calls or send reminders for seasonal maintenance.",
  },
  {
    icon: Shield,
    title: "Compliance Workflows",
    description:
      "Automate EPA 608 compliance logs and leak-rate calculations, keeping records tied to active jobs.",
  },
  {
    icon: Database,
    title: "Data Sync",
    description:
      "Seamlessly push invoices, payments, and expenses to your accounting software without manual entry.",
  },
];

const communityFeatures = [
  {
    icon: MessageCircle,
    title: "Private Contractor Network",
    description:
      "Connect with other HVAC&R professionals, share insights, and discuss business growth strategies.",
  },
  {
    icon: FileText,
    title: "Resource Library",
    description:
      "Access pre-built templates, pricing strategies, and business playbooks created by industry experts.",
  },
  {
    icon: HardHat,
    title: "Expert Q&A",
    description:
      "Get answers to complex technical or business questions from a vetted community of peers.",
  },
];

const engineeringFeatures = [
  {
    icon: Thermometer,
    title: "Load Calculations",
    description:
      "Accurate heating and cooling load calculations to size equipment confidently before installation.",
  },
  {
    icon: Gauge,
    title: "Psychrometrics & Cycle Analysis",
    description:
      "Calculate superheat, subcooling, and capacity metrics across multiple refrigerant types.",
  },
  {
    icon: Calculator,
    title: "Quick Calculators",
    description:
      "Handy pocket calculators for duct sizing, pipe sizing, and unit conversions while in the field.",
  },
];

export function Features() {
  const location = useLocation();

  useEffect(() => {
    trackMarketingEvent("features_view", { section: "hero" });
  }, []);

  useEffect(() => {
    if (!location.hash) return;

    const targetId = location.hash.replace("#", "");
    let frameId = 0;
    let attempts = 0;

    const scrollToHashTarget = () => {
      const target = document.getElementById(targetId);
      if (!target && attempts < 10) {
        attempts += 1;
        frameId = requestAnimationFrame(scrollToHashTarget);
        return;
      }
      if (!target) return;

      const stickyHeaderOffset = 92;
      const top =
        target.getBoundingClientRect().top + window.scrollY - stickyHeaderOffset;
      window.scrollTo({ top, behavior: "smooth" });
    };

    frameId = requestAnimationFrame(scrollToHashTarget);
    return () => cancelAnimationFrame(frameId);
  }, [location.hash]);

  return (
    <PublicPageShell>
      <SEO
        title="Features - Precision Engineering Hub"
        description="Explore ThermoNeural's complete operating system for HVAC&R contractors: Business Operations, Automations, Community, and Engineering Tools."
      />

      <section className="relative min-h-[calc(100svh-88px)] flex items-center bg-slate-900 dark:bg-[#111827] px-4 pt-8 pb-10 md:pt-10 md:pb-12 overflow-hidden">
        <BlueprintGrid opacity={0.03} className="text-primary" />
        <SectionNumber number="01" className="top-8 -left-4 md:top-12 md:-left-8" />
        <div className="max-w-6xl mx-auto w-full grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-center relative z-10">
          <div>
            <MeasurementLabel className="text-primary">Precision Engineering Hub</MeasurementLabel>
            <h1 className="mt-6 text-display font-display font-black tracking-tight leading-[0.95]">
              The complete operating system for modern HVAC&R businesses.
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-muted-foreground max-w-xl">
              Everything you need to run your operations, automate workflows, and connect with a community of professionals. Oh, and we included the best engineering calculators, too.
            </p>
            <p className="mt-4 text-sm text-muted-foreground max-w-xl">
              Start free today and grow your business with tools built specifically for the trade.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link
                  to="/signup"
                  onClick={() =>
                    trackMarketingEvent("features_primary_click", {
                      section: "hero",
                      destination: "/signup",
                    })
                  }
                >
                  Start Free
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link
                  to="/contact"
                  onClick={() =>
                    trackMarketingEvent("features_secondary_click", {
                      section: "hero",
                      destination: "/contact",
                    })
                  }
                >
                  Book a Demo
                </Link>
              </Button>
            </div>
          </div>
          <div className="grid gap-4">
            {operationsFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-3 pt-5">
                  <CardTitle className="flex items-center gap-3 text-lg">
                    <feature.icon className="h-5 w-5 text-primary" />
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-5 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="operations" className="scroll-mt-28 px-4 py-20 bg-secondary/20 relative overflow-hidden">
        <BlueprintGrid opacity={0.02} className="text-slate-500" />
        <SectionNumber number="02" className="top-6 -right-4 md:top-12 md:-right-8" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <MeasurementLabel>Business Operations</MeasurementLabel>
            <h2 className="mt-4 text-h2 font-display font-semibold tracking-tight">
              Run your business from anywhere, effortlessly.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From the first phone call to the final invoice, streamline your entire workflow with tools built specifically for HVAC&R.
            </p>
          </div>
          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {operationsFeatures.map((feature) => (
              <MotionReduced
                key={feature.title}
                animationClassName="animate-fade-in-up"
                fallbackClassName="opacity-100"
              >
                <Card className="border-border/60 bg-card/60 backdrop-blur-sm h-full">
                  <CardHeader className="pb-4">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <feature.icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-base">{feature.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </CardContent>
                </Card>
              </MotionReduced>
            ))}
          </div>
        </div>
      </section>

      <section id="automations" className="scroll-mt-28 px-4 py-20 bg-slate-900 dark:bg-[#111827] relative overflow-hidden">
        <BlueprintGrid opacity={0.03} className="text-primary" />
        <SectionNumber number="03" className="top-6 -left-4 md:top-12 md:-left-8" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <MeasurementLabel className="text-primary">Automations</MeasurementLabel>
            <h2 className="mt-4 text-h2 font-display font-semibold tracking-tight text-white dark:text-white">
              Put your repetitive tasks on autopilot.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Save hours each week by automating follow-ups, compliance tracking, and data entry.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {automationsFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/60 bg-card/80 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <CardTitle className="text-base text-white">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="community" className="scroll-mt-28 px-4 py-20 bg-secondary/30 relative overflow-hidden">
        <BlueprintGrid opacity={0.02} className="text-slate-500" />
        <SectionNumber number="04" className="top-6 -right-4 md:top-12 md:-right-8" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <MeasurementLabel>Community</MeasurementLabel>
            <h2 className="mt-4 text-h2 font-display font-semibold tracking-tight">
              You're in business for yourself, but not by yourself.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Join a network of forward-thinking contractors sharing knowledge, templates, and support.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {communityFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/60 bg-card/60 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <feature.icon className="h-5 w-5 text-primary flex-shrink-0" />
                    </div>
                    <CardTitle className="text-base">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="engineering" className="scroll-mt-28 px-4 py-20 bg-slate-900/5 dark:bg-slate-900/20 relative overflow-hidden border-t border-border/40">
        <BlueprintGrid opacity={0.01} className="text-slate-400" />
        <SectionNumber number="05" className="top-6 -left-4 md:top-12 md:-left-8 opacity-50" />
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="max-w-2xl">
            <MeasurementLabel className="text-muted-foreground">Included Side Tools</MeasurementLabel>
            <h2 className="mt-4 text-h2 font-display font-semibold tracking-tight">
              Engineering calculators, right in your pocket.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              We started as an engineering tool, and those powerful calculators are still integrated into the hub to help you validate assumptions and size equipment perfectly.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {engineeringFeatures.map((feature) => (
              <Card key={feature.title} className="border-border/40 bg-card/40 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <feature.icon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                    <CardTitle className="text-base text-muted-foreground">{feature.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 text-sm text-muted-foreground/80 leading-relaxed">
                  {feature.description}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="max-w-6xl mx-auto rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-10 md:p-14 relative overflow-hidden">
          <BlueprintGrid opacity={0.02} className="text-primary" />
          <div className="max-w-2xl relative z-10">
            <MeasurementLabel>Ready to Start</MeasurementLabel>
            <h2 className="mt-4 text-h2 font-display font-semibold tracking-tight">
              Deploy your Precision Engineering Hub today.
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Start free to explore the platform, or book a demo to see how our operations, automations, and community can help you scale.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/signup"
                onClick={() =>
                  trackMarketingEvent("features_primary_click", {
                    section: "final_cta",
                    destination: "/signup",
                  })
                }
              >
                <Button size="lg">Start Free</Button>
              </Link>
              <Link
                to="/contact"
                onClick={() =>
                  trackMarketingEvent("features_secondary_click", {
                    section: "final_cta",
                    destination: "/contact",
                  })
                }
              >
                <Button size="lg" variant="outline">Book a Demo</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
