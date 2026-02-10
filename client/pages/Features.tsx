import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import {
  Thermometer,
  Gauge,
  Layers,
  Shield,
  FileText,
  Users,
  Sparkles,
  LineChart,
  Database,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const coreFeatures = [
  {
    icon: Users,
    title: "Dispatch + triage control",
    description:
      "Run intake, assignment, and job priorities from one board shared across office and field teams.",
  },
  {
    icon: Shield,
    title: "Compliance-ready records",
    description:
      "Keep EPA 608 logs, leak-rate calculations, and report exports tied to active service workflows.",
  },
  {
    icon: Thermometer,
    title: "Engineering decision support",
    description:
      "Use standard, refrigerant, and cascade tools to validate assumptions before field execution.",
  },
];

const platformFeatures = [
  {
    icon: FileText,
    title: "Report-ready outputs",
    description:
      "Export branded PDF and CSV reports for bids, audits, and compliance reviews.",
  },
  {
    icon: Database,
    title: "Calculation history",
    description:
      "Keep a searchable library of project calculations and revisions.",
  },
  {
    icon: Shield,
    title: "Data protection",
    description:
      "Encrypted storage with role-based access controls built for professional teams.",
  },
  {
    icon: Users,
    title: "Team collaboration",
    description:
      "Share projects, review assumptions, and stay aligned across locations.",
  },
  {
    icon: LineChart,
    title: "Scenario comparison",
    description:
      "Evaluate equipment and refrigerant alternatives side-by-side with report-ready outputs.",
  },
  {
    icon: Sparkles,
    title: "Guided workflows",
    description:
      "Structured inputs reduce handoff friction and keep teams aligned from intake to closeout.",
  },
];

const technicalSpecs = [
  {
    title: "Operations truth",
    items: [
      "Dispatch + triage workflow control",
      "Client and job history continuity",
      "Field-to-office handoff visibility",
    ],
  },
  {
    title: "Engineering + compliance",
    items: [
      "Cycle and refrigerant decision tools",
      "Leak-rate and refrigerant tracking",
      "Audit-ready PDF and CSV exports",
    ],
  },
  {
    title: "Deployment support",
    items: [
      "Onboarding and workflow setup",
      "Email and in-app support",
      "Team enablement for new operators",
    ],
  },
];

export function Features() {
  useEffect(() => {
    trackMarketingEvent("features_view", { section: "hero" });
  }, []);

  return (
    <div className="app-shell min-h-screen bg-background text-foreground">
      <Header variant="landing" />

      <main>
        <SEO
          title="Features"
          description="Explore ThermoNeural's operations + engineering workflows for HVAC&R contractors, owners, and field teams."
        />

        <section className="px-4 pt-8 pb-10 md:pt-10 md:pb-12 lg:min-h-[calc(100svh-88px)] lg:flex lg:items-center">
          <div className="max-w-6xl mx-auto w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Platform Features</p>
              <h1 className="mt-4 text-4xl md:text-[3.25rem] leading-[1.04] font-semibold">
                Operations and engineering in one HVAC&R workflow system.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Coordinate dispatch, field diagnostics, compliance, and engineering from one platform built for contractor teams.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  onClick={() =>
                    trackMarketingEvent("features_primary_click", {
                      section: "hero",
                      destination: "/signup",
                    })
                  }
                >
                  <Button size="lg">Start Engineering Free</Button>
                </Link>
                <Link
                  to="/contact"
                  onClick={() =>
                    trackMarketingEvent("features_secondary_click", {
                      section: "hero",
                      destination: "/contact",
                    })
                  }
                >
                  <Button size="lg" variant="outline">Book an Ops Demo</Button>
                </Link>
              </div>
            </div>
            <div className="grid gap-3">
              {coreFeatures.map((feature) => (
                <Card key={feature.title} className="border-border/60 rounded-2xl">
                  <CardHeader className="pb-2 pt-5">
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

        <section className="px-4 py-16 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Capability Suite</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold">
                Built for daily service execution, not disconnected tools.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Every module is designed to reduce rework and move your team from intake to closeout with cleaner handoffs.
              </p>
            </div>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {platformFeatures.map((feature) => (
                <Card key={feature.title} className="border-border/60">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-3 text-lg">
                      <feature.icon className="h-5 w-5 text-primary" />
                      {feature.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-sm text-muted-foreground">
                    {feature.description}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16">
          <div className="max-w-6xl mx-auto grid gap-6 md:grid-cols-3">
            {technicalSpecs.map((spec) => (
              <div key={spec.title} className="rounded-2xl border border-border/60 bg-background p-6">
                <h3 className="text-lg font-semibold">{spec.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  {spec.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="px-4 pb-20">
          <div className="max-w-6xl mx-auto rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-10 md:p-14">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Ready to start</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold">
                Give your team one system for field execution and engineering decisions.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Start engineering free now, then book an operations walkthrough for your dispatch and compliance rollout.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to="/signup"
                  onClick={() =>
                    trackMarketingEvent("features_primary_click", {
                      section: "final_cta",
                      destination: "/signup",
                    })
                  }
                >
                  <Button size="lg">Start Engineering Free</Button>
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
                  <Button size="lg" variant="outline">Book an Ops Demo</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
