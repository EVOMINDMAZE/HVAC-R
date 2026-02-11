import "@/landing.css";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Building2,
  HardHat,
  Rocket,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import {
  RolePathCards,
  type RolePathItem,
} from "@/components/landing/RolePathCards";
import { HeroMedia } from "@/components/landing/HeroMedia";
import { capabilityInventory, totalCapabilityCount } from "@/content/capabilityMap";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

const trustStrip = [
  "Dispatch + triage connected to one execution board",
  "EPA 608 log workflows built into daily operations",
  "Leak-rate tracking with export-ready records",
  "Client updates and closeout reports from one timeline",
] as const;

const segmentCards: readonly RolePathItem[] = [
  {
    title: "Owner / Manager",
    promise: "Control scheduling, compliance status, and team visibility from one operating system.",
    proof: "Dispatch, triage, jobs, and client records stay aligned end to end.",
    cta: "Book Ops Demo",
    link: "/contact",
    icon: Building2,
    eventKey: "owner_manager",
    image: "/landing/segment-owner.png",
  },
  {
    title: "Technician / Lead Tech",
    promise: "Diagnose and document in one field flow without duplicate entry.",
    proof: "Troubleshooting, IAQ, warranty, and pattern insights stay in one handoff path.",
    cta: "Start Free",
    link: "/signup",
    icon: HardHat,
    eventKey: "technician",
    image: "/landing/segment-technician.png",
  },
  {
    title: "Entrepreneur / New Shop",
    promise: "Start free on engineering tools and expand into full Business Ops as you grow.",
    proof: "Day-one engineering capability with dispatch and compliance expansion ready.",
    cta: "Start Free",
    link: "/signup",
    icon: Rocket,
    eventKey: "entrepreneur",
    image: "/landing/segment-entrepreneur.png",
  },
];

const workflow = [
  {
    step: "01",
    title: "Intake & Dispatch",
    description:
      "Capture requests, triage urgency, and assign work from a single board.",
    image: "/landing/workflow-intake.png",
    modules: [
      { name: "Public Triage", route: "/triage" },
      { name: "Dispatch", route: "/dashboard/dispatch" },
      { name: "Jobs", route: "/dashboard/jobs" },
    ],
  },
  {
    step: "02",
    title: "Diagnose & Document",
    description:
      "Run diagnostics and engineering checks while creating field-ready documentation.",
    image: "/landing/workflow-diagnose.png",
    modules: [
      { name: "Troubleshooting", route: "/troubleshooting" },
      { name: "Pattern Insights", route: "/ai/pattern-insights" },
      { name: "Standard Cycle", route: "/tools/standard-cycle" },
    ],
  },
  {
    step: "03",
    title: "Report & Follow-up",
    description:
      "Close with compliance exports, client-ready updates, and complete job history.",
    image: "/landing/workflow-report.png",
    modules: [
      { name: "Compliance Report", route: "/tools/refrigerant-report" },
      { name: "History", route: "/history" },
      { name: "Client Portal", route: "/portal" },
    ],
  },
] as const;

const toolInventory = capabilityInventory;
const totalToolCount = totalCapabilityCount;

const pricingTracks = [
  {
    title: "Engineering Suite",
    price: "From $0",
    badge: "Start free",
    audience: "Best for entrepreneurs and engineering-first teams.",
    details: [
      "Free plan for core calculations",
      "Pro at $49/mo for advanced tools",
      "Enterprise options for larger teams",
      "Stay on this track until you need dispatch and compliance operations",
    ],
    cta: "Start Free",
    link: "/pricing",
    eventKey: "engineering_suite",
  },
  {
    title: "Business Ops",
    price: "$199/mo",
    badge: "Business in a Box",
    audience: "Best for contractors running dispatch and compliance at scale.",
    details: [
      "Dispatch board + triage workflow",
      "Jobs, clients, and records in one system",
      "Compliance ledger + reporting exports",
      "Automation workflows for follow-up",
      "Includes 5 team seats with expansion options",
    ],
    cta: "Book Ops Demo",
    link: "/contact",
    eventKey: "business_ops",
  },
] as const;

const motionUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export function Landing() {
  const shouldReduceMotion = useReducedMotion();
  const [showFullInventory, setShowFullInventory] = useState(false);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const easedTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.45, ease: "easeOut" as const };
  const quickTransition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: "easeOut" as const };

  useEffect(() => {
    trackMarketingEvent("landing_view", { section: "hero" });
    trackMarketingEvent("landing_capability_matrix_view", {
      section: "hero_command_center",
    });

    const handleScroll = () => {
      const triggerPoint = window.innerHeight * 0.7;
      setShowMobileCta(window.scrollY > triggerPoint);
    };

    let workflowTracked = false;
    const workflowElement = document.getElementById("workflow-proof");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || workflowTracked) return;

          workflowTracked = true;
          trackMarketingEvent("landing_workflow_view", { section: "workflow" });
        });
      },
      { threshold: 0.45 },
    );

    if (workflowElement) observer.observe(workflowElement);

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const toggleInventory = () => {
    const expanded = !showFullInventory;
    setShowFullInventory(expanded);
    trackMarketingEvent("landing_inventory_toggle", {
      section: "tool_inventory",
      segment: expanded ? "expanded" : "condensed",
    });
  };

  const handleJumpToInventory = () => {
    trackMarketingEvent("landing_view_all_tools_click", {
      section: "hero_command_center",
      destination: "#tool-inventory",
    });
  };

  return (
    <div className="app-shell landing-page min-h-screen bg-background text-foreground selection:bg-primary/10 selection:text-primary">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <Header variant="landing" />

      <main id="main-content">
        <SEO
          title="ThermoNeural | HVAC&R Operations + Engineering"
          description="Run dispatch, compliance, and engineering analysis in one HVAC&R system built for contractors, owners, and growing service businesses."
        />
        <StructuredData />

        <section className="landing-section landing-hero relative overflow-hidden px-4">
          <div className="landing-hero-gradient" aria-hidden="true" />

          <motion.div
            variants={motionUp}
            initial="hidden"
            animate="visible"
            transition={easedTransition}
            className="relative mx-auto grid max-w-6xl items-start gap-5 lg:grid-cols-[1fr_1.02fr]"
          >
            <div className="max-w-xl">
              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="landing-kicker text-primary">Business in a Box for HVAC&R Operators</span>
              </div>

              <h1 className="landing-heading landing-hero-title mt-5 text-4xl font-semibold md:text-[2.95rem] md:leading-[1.01] lg:text-[3.2rem] lg:leading-[0.99]">
                Run HVAC jobs, compliance, and engineering from one system.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-muted-foreground">
                Reduce handoff friction, keep EPA records audit-ready, and deliver cleaner closeout documentation across every job.
              </p>

              <p className="mt-3 text-sm font-semibold text-foreground/90">
                27 workflow-linked tools in one login.
              </p>

              <p className="mt-2 text-xs text-muted-foreground">
                Designed for EPA-regulated HVAC&R teams running field and office workflows.
              </p>

              <div className="mt-4 rounded-xl border border-border/70 bg-card/70 px-3 py-2.5">
                <p className="text-xs font-semibold text-foreground/90">Implementation path</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start in one day with active jobs first, then add clients and templates as your team scales.
                </p>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  onClick={() =>
                    trackMarketingEvent("landing_hero_primary_click", {
                      section: "hero",
                      destination: "/signup",
                    })
                  }
                >
                  <Button size="lg" className="h-12 px-6">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link
                  to="/contact"
                  onClick={() =>
                    trackMarketingEvent("landing_hero_secondary_click", {
                      section: "hero",
                      destination: "/contact",
                    })
                  }
                >
                  <Button size="lg" variant="outline" className="h-12 px-6">
                    Book Ops Demo
                  </Button>
                </Link>
              </div>

              <p className="mt-3 text-xs text-muted-foreground">
                Start free for engineering now. Add Business Ops when dispatch volume and compliance complexity increase.
              </p>

              <p className="mt-5 text-sm text-muted-foreground">
                Dispatch control • Audit-ready records • Report-ready closeout
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2 md:hidden">
                <span className="landing-module-tag w-full justify-center">Field Jobs</span>
                <span className="landing-module-tag w-full justify-center">Troubleshooting</span>
                <span className="landing-module-tag w-full justify-center">Compliance Log</span>
              </div>
            </div>

            <HeroMedia
              totalTools={totalToolCount}
              categories={toolInventory}
              onViewAllTools={handleJumpToInventory}
            />
          </motion.div>
        </section>

        <section className="landing-section px-4 pt-0">
          <motion.div
            variants={motionUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            transition={quickTransition}
            className="mx-auto grid max-w-6xl gap-3 text-sm md:grid-cols-3 lg:grid-cols-5"
          >
            {trustStrip.map((item) => (
              <div key={item} className="landing-chip rounded-xl px-4 py-2.5 text-center">
                {item}
              </div>
            ))}
          </motion.div>
        </section>

        <section className="landing-section px-4 bg-secondary/30">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="landing-kicker text-primary">Pick Your Path</p>
              <h2 className="landing-heading mt-3 text-3xl font-semibold md:text-4xl">
                Choose the operating track that matches your team stage.
              </h2>
            </div>

            <RolePathCards
              segments={segmentCards}
              onTrack={(segment, destination) =>
                trackMarketingEvent("landing_segment_path_click", {
                  section: "pick_path",
                  segment,
                  destination,
                })
              }
            />
          </div>
        </section>

        <section id="tool-inventory" className="landing-section px-4 bg-secondary/30">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="landing-kicker text-primary">What&apos;s Inside</p>
              <h2 className="landing-heading mt-3 text-3xl font-semibold md:text-4xl">
                Workflow-linked modules used in real HVAC operations.
              </h2>
            </div>

            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
              Workflow-linked modules used in real HVAC operations. Start with key tools, then expand to the full stack when needed.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {toolInventory.map((group) => {
                const visibleItems = showFullInventory
                  ? group.tools
                  : group.tools.slice(0, group.previewCount);

                return (
                  <div key={group.title} className="landing-surface rounded-2xl p-6">
                    <h3 className="text-lg font-semibold">{group.title}</h3>
                    <p className="mt-1 text-xs text-muted-foreground">{group.outcomeLine}</p>
                    <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                      {visibleItems.map((item) => (
                        <li key={item.route} className="flex items-start gap-2">
                          <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                          <span>{item.name}</span>
                        </li>
                      ))}
                    </ul>

                    {!showFullInventory && group.tools.length > group.previewCount && (
                      <p className="mt-3 text-xs text-muted-foreground">
                        +{group.tools.length - group.previewCount} more in this group
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={toggleInventory}
                aria-expanded={showFullInventory}
                className="min-w-56"
              >
                {showFullInventory ? (
                  <>
                    Show Condensed Tool List
                    <ChevronUp className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    See Full {totalToolCount}-Tool List
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </section>

        <section id="workflow-proof" className="landing-section px-4">
          <div className="mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="landing-kicker text-primary">Workflow Proof</p>
              <h2 className="landing-heading mt-3 text-3xl font-semibold md:text-4xl">
                Intake, diagnose, report. One continuous HVAC&R workflow.
              </h2>
            </div>

            <div className="landing-surface mt-6 rounded-2xl p-4 md:p-5">
              <p className="text-sm text-foreground/90">
                Service requests enter triage, dispatch assigns work, technicians document findings, compliance records update automatically, and client-ready closeout reports are delivered from the same job timeline.
              </p>
            </div>

            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {workflow.map((item) => (
                <motion.div
                  key={item.step}
                  variants={motionUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  transition={quickTransition}
                  className="landing-surface rounded-2xl p-5"
                >
                  <div className="landing-workflow-media-wrap">
                    <img
                      src={item.image}
                      alt={`${item.title} module preview`}
                      className="landing-workflow-media"
                      loading="lazy"
                    />
                  </div>
                  <span className="mt-4 inline-block text-xs font-semibold text-primary">{item.step}</span>
                  <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.modules.map((module) => (
                      <span key={module.route} className="landing-module-tag">
                        {module.name}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing-decision" className="landing-section landing-pricing-section px-4">
          <div className="landing-pricing-texture" aria-hidden="true" />

          <div className="relative mx-auto max-w-6xl">
            <div className="max-w-2xl">
              <p className="landing-kicker text-primary">Pricing Decision</p>
              <h2 className="landing-heading mt-3 text-3xl font-semibold md:text-4xl">
                Start with engineering now. Add Business Ops when dispatch and compliance scale.
              </h2>
            </div>

            <p className="mt-4 max-w-3xl text-sm text-muted-foreground">
              Solo operators can stay on Engineering as long as needed. Move to Business Ops when you need dispatch control, EPA log workflows, and team visibility.
            </p>

            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {pricingTracks.map((track) => (
                <div key={track.title} className="landing-pricing-card rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{track.title}</h3>
                    <span className="rounded-full bg-primary/10 px-3 py-1 text-xs text-primary">
                      {track.badge}
                    </span>
                  </div>

                  <p className="mt-3 text-3xl font-semibold">{track.price}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{track.audience}</p>

                  <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                    {track.details.map((detail) => (
                      <li key={detail} className="flex items-start gap-2">
                        <CheckCircle className="mt-0.5 h-4 w-4 text-success" />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-6">
                    <Link
                      to={track.link}
                      onClick={() =>
                        trackMarketingEvent("landing_pricing_cta_click", {
                          section: "pricing",
                          segment: track.eventKey,
                          destination: track.link,
                        })
                      }
                    >
                      <Button variant={track.title === "Business Ops" ? "default" : "outline"} className="w-full">
                        {track.cta}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-section px-4 pt-0">
          <div className="mx-auto max-w-6xl rounded-3xl border border-border/60 bg-gradient-to-br from-primary/5 via-background to-background p-10 md:p-14">
            <div className="max-w-3xl">
              <p className="landing-kicker text-primary">Final CTA</p>
              <h2 className="landing-heading mt-3 text-3xl font-semibold md:text-4xl">
                Start free now. Add Business Ops when your team is ready.
              </h2>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <Link
                  to="/signup"
                  onClick={() =>
                    trackMarketingEvent("landing_hero_primary_click", {
                      section: "final_cta",
                      destination: "/signup",
                    })
                  }
                >
                  <Button size="lg" className="h-12 px-6">
                    Start Free
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>

                <Link
                  to="/contact"
                  onClick={() =>
                    trackMarketingEvent("landing_hero_secondary_click", {
                      section: "final_cta",
                      destination: "/contact",
                    })
                  }
                >
                  <Button size="lg" variant="outline" className="h-12 px-6">
                    Book Ops Demo
                  </Button>
                </Link>
              </div>

              <p className="mt-6 text-sm text-muted-foreground">
                Built for contractors, managers, and teams scaling HVAC&R operations.
              </p>
            </div>
          </div>
        </section>
      </main>

      <div className={`landing-mobile-cta ${showMobileCta ? "is-visible" : ""}`}>
        <div className="landing-mobile-cta-inner">
          <Link
            to="/signup"
            className="flex-1"
            onClick={() =>
              trackMarketingEvent("landing_hero_primary_click", {
                section: "mobile_sticky",
                destination: "/signup",
              })
            }
          >
            <Button className="h-11 w-full">Start Free</Button>
          </Link>

          <Link
            to="/contact"
            onClick={() =>
              trackMarketingEvent("landing_hero_secondary_click", {
                section: "mobile_sticky",
                destination: "/contact",
              })
            }
          >
            <Button variant="outline" className="h-11 px-4">
              Book Ops Demo
            </Button>
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}
