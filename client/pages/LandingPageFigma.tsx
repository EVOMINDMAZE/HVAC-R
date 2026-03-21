import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ChevronDown,
  ArrowRight,
  Check,
  Play,
  Menu,
  X,
  Twitter,
  Linkedin,
  Github,
  Youtube,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import "@/figma-landing.css";

const ASSETS_BASE = "/assets/landing-figma";

const LOGO_SVG = `${ASSETS_BASE}/mmxud1sh-q93t345.svg`;
const UNDERLINE_SVG = `${ASSETS_BASE}/mmxud1sh-eiwbik6.svg`;
const PLAY_ICON_SVG = `${ASSETS_BASE}/mmxud1sh-kmu623z.svg`;
const FOOTER_LOGO_SVG = `${ASSETS_BASE}/mmxud1sh-sim2zgh.svg`;

const PILLAR_ICONS = {
  aiSupervisor: `${ASSETS_BASE}/mmxud1sh-xxzt3zf.svg`,
  profitGuard: `${ASSETS_BASE}/mmxud1sh-c7hjy0c.svg`,
  auditReady: `${ASSETS_BASE}/mmxud1sh-2fjyt2y.svg`,
  intelligenceDispatch: `${ASSETS_BASE}/mmxud1sh-7grxmjd.svg`,
};

const PILLAR_DASHBOARDS = {
  aiSupervisor: `${ASSETS_BASE}/mmxud1ss-7algalc.png`,
  profitGuard: `${ASSETS_BASE}/mmxud1ss-u3lvasl.png`,
  auditReady: `${ASSETS_BASE}/mmxud1ss-aosmrt7.png`,
  intelligenceDispatch: `${ASSETS_BASE}/mmxud1ss-8dx10dv.png`,
};

const NAV_LINKS = [
  { label: "Features", href: "/features" },
  { label: "Use Cases", href: "/use-cases" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Help", href: "/help" },
  { label: "Support", href: "/support" },
];

const PILLARS = [
  {
    icon: PILLAR_ICONS.aiSupervisor,
    iconBgClass: "pillar-icon-bg-blue",
    title: "AI Supervisor",
    description:
      "Real-time AI monitoring catches issues before they become callbacks. Pattern recognition analyzes equipment history to predict failures.",
    dashboard: PILLAR_DASHBOARDS.aiSupervisor,
  },
  {
    icon: PILLAR_ICONS.profitGuard,
    iconBgClass: "pillar-icon-bg-green",
    title: "Profit Guard",
    description:
      "Automated pricing intelligence ensures every job is quoted at optimal margins. Real-time cost tracking prevents scope creep.",
    dashboard: PILLAR_DASHBOARDS.profitGuard,
  },
  {
    icon: PILLAR_ICONS.auditReady,
    iconBgClass: "pillar-icon-bg-purple",
    title: "Audit-Ready Ledger",
    description:
      "Every invoice, every part, every labor hour documented and organized. Generate compliance reports in seconds.",
    dashboard: PILLAR_DASHBOARDS.auditReady,
  },
  {
    icon: PILLAR_ICONS.intelligenceDispatch,
    iconBgClass: "pillar-icon-bg-orange",
    title: "Intelligence Dispatch",
    description:
      "AI-powered routing considers traffic, technician skills, and customer preferences for optimal scheduling.",
    dashboard: PILLAR_DASHBOARDS.intelligenceDispatch,
  },
];

const PRICING_PLANS = [
  {
    name: "Solopreneur",
    price: "$0",
    period: "Free forever",
    features: [
      "1 user",
      "Basic AI diagnostics",
      "Email support",
      "10 calculations/month",
    ],
    cta: "Get Started",
    highlighted: false,
  },
  {
    name: "Growth",
    price: "$49",
    period: "per month",
    popularBadge: true,
    features: [
      "Up to 5 technicians",
      "Advanced AI patterns",
      "Priority support",
      "Unlimited calculations",
      "Compliance reports",
    ],
    cta: "Start Free Trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "Contact us",
    features: [
      "Unlimited technicians",
      "Custom AI training",
      "24/7 phone support",
      "Unlimited everything",
      "Dedicated success manager",
      "On-premise deployment",
    ],
    cta: "Contact Sales",
    highlighted: false,
  },
];

const FAQ_ITEMS = [
  {
    question: "What is the modern HVAC/R operations app?",
    answer:
      "ThermoNeural is an AI-powered platform designed specifically for HVAC/R professionals. It combines diagnostic assistance, compliance tracking, and intelligent dispatch to help your team work more efficiently and profitably.",
  },
  {
    question: "How does ThermoNeural spot problems before they happen?",
    answer:
      "Our AI analyzes equipment history, usage patterns, and real-time sensor data to identify anomalies that typically precede failures. You'll get alerts about potential issues before they cause a breakdown or callback.",
  },
  {
    question: "Can I integrate ThermoNeural with my existing tools?",
    answer:
      "Yes! ThermoNeural integrates with popular field service software, accounting systems, and inventory platforms. Our API also allows custom integrations for enterprise workflows.",
  },
  {
    question: "How secure is my data with ThermoNeural?",
    answer:
      "Security is our top priority. We use bank-level encryption, SOC 2 compliant infrastructure, and regular third-party audits. Your customer and business data is never shared or used to train models without explicit consent.",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Tools & Workflows",
    links: [
      { label: "AI Diagnostics", href: "/ai-diagnostics" },
      { label: "Compliance Tracker", href: "/compliance" },
      { label: "Dispatch Manager", href: "/dispatch" },
      { label: "Invoice Generator", href: "/invoices" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "/about" },
      { label: "Careers", href: "/careers" },
      { label: "Blog", href: "/blog" },
      { label: "Press", href: "/press" },
    ],
  },
  {
    title: "Get in touch",
    links: [
      { label: "Contact Sales", href: "/contact-sales" },
      { label: "Support", href: "/support" },
      { label: "Documentation", href: "/docs" },
      { label: "Status", href: "/status" },
    ],
  },
];

export function LandingPageFigma() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="landing-figma-root">
      {/* Hero Section */}
      <section className="hero-figma">
        <div className="overlay">
          <header className="header">
            <div className="logo-container">
              <img src={LOGO_SVG} alt="ThermoNeural" className="logo-placeholder" />
              <span className="logo-text">ThermoNeural</span>
            </div>

            <nav className="nav">
              {NAV_LINKS.map((link, index) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`nav-link ${index === 0 ? "nav-link-first" : ""}`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="header-actions">
              <Link to="/signin" className="btn-login">
                Sign In
              </Link>
              <div className="btn-signup">
                <Button asChild size="sm" className="btn-signup-link">
                  <Link to="/signup">Start Free</Link>
                </Button>
              </div>
            </div>
          </header>

          <div className="hero-content">
            <div className="hero-heading">
              <div className="heading-line">
                Engineering
              </div>
              <div className="heading-line heading-line-accent" style={{ position: "relative" }}>
                Operations
                <img
                  src={UNDERLINE_SVG}
                  alt=""
                  className="heading-underline"
                />
              </div>
              <div className="heading-line">
                at Scale.
              </div>
            </div>

            <div className="hero-description">
              <p className="description-text">
                Stop trading time for money. Equip your technicians with AI-driven diagnostics,
                automated compliance, and profit-focused dispatching.
              </p>
            </div>

            <div className="cta-buttons">
              <Button asChild size="lg" className="btn-primary">
                <Link to="/signup">Start Your Free Trial</Link>
              </Button>
              <div className="btn-secondary">
                <Link to="/strategy-video" className="btn-secondary-link">
                  <img src={PLAY_ICON_SVG} alt="" style={{ width: 16, height: 16 }} />
                  Watch Strategy Video
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars Section */}
      <section className="pillars-section">
        <div className="pillars-header">
          <div className="pillars-heading">
            <h2 className="pillars-heading-text">
              Your technicians are excellent. Your systems are the bottleneck.
            </h2>
          </div>
          <div className="pillars-subheading">
            <span className="pillars-subheading-text">
              Four Pillars of Operational Excellence
            </span>
          </div>
        </div>

        <div className="pillars-container">
          {PILLARS.map((pillar) => (
            <div key={pillar.title} className="pillar-card">
              <div className="pillar-card-icon">
                <div className={`pillar-icon-bg ${pillar.iconBgClass}`}>
                  <img src={pillar.icon} alt={pillar.title} style={{ width: 24, height: 24 }} />
                </div>
              </div>
              <h3 className="pillar-card-title">{pillar.title}</h3>
              <p className="pillar-card-description">{pillar.description}</p>
              <Link to={`/${pillar.title.toLowerCase().replace(/\s+/g, "-")}`} className="pillar-card-link">
                <span className="pillar-card-link-text">Deploy Module</span>
                <ArrowRight size={14} style={{ color: "#2563eb" }} />
              </Link>
              <img
                src={pillar.dashboard}
                alt={`${pillar.title} Dashboard`}
                style={{ width: "100%", borderRadius: 8, marginTop: 8 }}
              />
            </div>
          ))}
        </div>
      </section>

      {/* Metrics Strip */}
      <section className="metrics-strip">
        <div className="metrics-group">
          <div className="metrics-column">
            <div className="metric-value">
              <span className="metric-number">30%</span>
              <span className="metric-label">Efficiency Gain</span>
            </div>
          </div>
          <div className="metrics-column">
            <div className="metric-value">
              <span className="metric-number" style={{ color: "#111827" }}>Zero</span>
              <span className="metric-label">Callback Rate</span>
            </div>
          </div>
          <div className="metrics-column">
            <div className="metric-value">
              <span className="metric-number" style={{ color: "#111827" }}>2hrs</span>
              <span className="metric-label">Saved Daily</span>
            </div>
          </div>
        </div>

        <div className="metrics-logos">
          <span className="metrics-logo-text">ASHRAE</span>
          <span className="metrics-logo-text">NIST</span>
          <span className="metrics-logo-text">CERT</span>
          <span className="metrics-logo-text">EPA</span>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="pricing-section">
        <div className="pricing-heading">
          <h2 className="pricing-heading-text">Transparent Pricing for Every Stage</h2>
        </div>

        <div className="pricing-container">
          {PRICING_PLANS.map((plan) => (
            <div
              key={plan.name}
              className={plan.highlighted ? "pricing-card-growth" : "pricing-card-enterprise"}
              style={{ width: plan.highlighted ? 320 : 280 }}
            >
              {plan.popularBadge && (
                <div className="pricing-popular-badge">
                  <span className="pricing-popular-text">Most Popular</span>
                </div>
              )}
              <div className="pricing-growth-content">
                <div className="pricing-growth-header">
                  <div className="pricing-growth-title">
                    <span className="pricing-plan-title" style={{ fontSize: 20, fontWeight: 700 }}>
                      {plan.name}
                    </span>
                  </div>
                  <div className="pricing-growth-price">
                    <span className="pricing-price" style={{ fontSize: plan.price === "Custom" ? 36 : 48 }}>
                      {plan.price}
                    </span>
                  </div>
                  <div className="pricing-growth-period">
                    <span style={{ fontSize: 14, color: "#6b7280" }}>{plan.period}</span>
                  </div>
                </div>

                <div className="pricing-growth-features">
                  {plan.features.map((feature) => (
                    <div key={feature} className="pricing-growth-feature">
                      <Check size={16} style={{ color: "#2563eb", flexShrink: 0 }} />
                      <span className="pricing-growth-feature-text">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button
                  asChild
                  className={`pricing-growth-cta ${plan.highlighted ? "" : "w-full mt-auto"}`}
                  variant={plan.highlighted ? "default" : "outline"}
                >
                  <Link to={plan.name === "Enterprise" ? "/contact-sales" : "/signup"}>
                    {plan.cta}
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="faq-heading">
          <h2 className="faq-heading-text">Frequently Asked Questions</h2>
        </div>

        <Accordion type="single" collapsible className="faq-list">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="faq-item">
              <AccordionTrigger className="faq-question">{item.question}</AccordionTrigger>
              <AccordionContent className="faq-answer">{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <img src={FOOTER_LOGO_SVG} alt="ThermoNeural" className="footer-logo-bg" />
            <span className="footer-logo-text">ThermoNeural</span>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title} className="footer-column">
              <h4 className="footer-column-title">{column.title}</h4>
              <div className="footer-links">
                {column.links.map((link) => (
                  <Link key={link.label} to={link.href} className="footer-link">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            © 2024 ThermoNeural. All rights reserved.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <Link to="/privacy" className="footer-link">Privacy Policy</Link>
            <Link to="/terms" className="footer-link">Terms of Service</Link>
          </div>

          <div className="footer-social">
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <Twitter size={16} />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <Linkedin size={16} />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <Github size={16} />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="footer-social-link">
              <Youtube size={16} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
