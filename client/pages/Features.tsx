import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Thermometer,
  Shield,
  FileText,
  Users,
  Sparkles,
  LineChart,
  Database,
} from "lucide-react";
import { SEO } from "@/components/SEO";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";
import { PublicPageShell } from "@/components/public/PublicPageShell";

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
        title="Features"
        description="Explore ThermoNeural's operations + engineering workflows for HVAC&R contractors, owners, and field teams."
      />

        <section className="px-4 pt-8 pb-10 md:pt-10 md:pb-12 lg:min-h-[calc(100svh-88px)] lg:flex lg:items-center">
          <div className="max-w-6xl mx-auto w-full grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Operations + Engineering</p>
              <h1 className="mt-4 text-4xl md:text-[3.25rem] leading-[1.04] font-semibold">
                One operating system for dispatch, compliance, and engineering execution.
              </h1>
              <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
                Coordinate field and office work from intake through closeout with route-backed workflows your team can run daily.
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                Start free for engineering tools, then add Business Ops when dispatch and compliance workflows become daily priorities.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
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
                    Book Ops Demo
                  </Link>
                </Button>
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

        <section id="use-cases" className="scroll-mt-28 px-4 py-16 bg-secondary/30">
          <div className="max-w-6xl mx-auto">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-primary">Use Cases</p>
              <h2 className="mt-4 text-3xl md:text-4xl font-semibold">
                Built for owner/manager visibility and technician execution.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Use these workflows to keep dispatch organized, compliance audit-ready, and engineering analysis tied to live service work.
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
                Start free for engineering now, then expand to Business Ops control.
              </h2>
              <p className="mt-4 text-muted-foreground">
                Keep the same operating model as the homepage: one primary path to start free, one secondary path to book an ops rollout.
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
                  <Button size="lg" variant="outline">Book Ops Demo</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
    </PublicPageShell>
  );
}
