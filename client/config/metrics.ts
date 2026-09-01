// Centralized metrics configuration for ThermoNeural
// This file ensures consistent, verifiable metrics across the application

export const metrics = {
  // Meta information for transparency
  meta: {
    asOfLabel: "Product information as of August 31, 2026",
  },

  // User statistics
  users: {
    totalEngineers: "Growing",
    description: "HVAC&R engineers and technicians",
    lastUpdated: "2026-08-31",
    source: "Product adoption" as const,
  },

  // Security certifications
  certifications: {
    encryption: {
      title: "256-bit Encryption",
      status: "active" as const,
      timeline: "",
      description: "AES-256 encryption for all data at rest and in transit",
    },
    ashrae: {
      title: "ASHRAE Standards",
      status: "active" as const,
      timeline: "",
      description: "Calculations follow ASHRAE standards and guidelines",
    },
    gdpr: {
      title: "GDPR Ready",
      status: "active" as const,
      timeline: "",
      description: "Consent management and data-rights controls in place",
    },
    nist: {
      title: "CoolProp Thermodynamic Engine",
      status: "active" as const,
      timeline: "",
      description: "Calculations powered by the open-source CoolProp fluid-property library",
    },
  },
} as const;

export const landingConfig = {
  // ROI Stats displayed on landing page
  roiStats: [
    {
      value: "2.4 hrs",
      label: "Saved Per Ticket",
      disclaimer: "Based on internal technician workflow audits",
    },
    {
      value: "12%",
      label: "Fuel Cost Reduction",
      disclaimer: "Average reduction in fleet fuel consumption",
    },
    {
      value: "99.8%",
      label: "Calculation Accuracy",
      disclaimer: "Thermodynamics powered by the CoolProp engine",
    },
  ] as const,

  // Pricing tiers (synced with actual pricing from Pricing.tsx)
  pricing: [
    {
      name: "Engineering Free",
      price: "$0",
      period: "",
      description: "For entrepreneurs and teams starting with core HVAC&R analysis.",
      features: [
        "Up to 10 calculations per month",
        "Standard cycle analysis (basic parameters)",
        "Basic refrigerant comparison (2 refrigerants max)",
        "Compliance reference (read-only)",
        "Dashboard with usage tracking",
        "Email support",
      ],
      cta: "Start Free",
      link: "/signup",
      popular: false,
    },
    {
      name: "Engineering Pro",
      price: "$49",
      period: "per month",
      description: "For technicians and engineers who need advanced cycle and refrigerant tools.",
      features: [
        "Unlimited calculations",
        "All analysis tools (cascade, advanced cycles)",
        "Advanced refrigerant comparison (unlimited)",
        "PDF export & advanced reporting",
        "Priority email support",
      ],
      cta: "Upgrade to Pro",
      link: "/pricing",
      popular: true,
    },
    {
      name: "Business Ops",
      price: "$199",
      period: "per month",
      description: "For contractors running dispatch, compliance, and multi-crew execution.",
      features: [
        "Everything in Pro",
        "Team collaboration (up to 5 users included)",
        "White-label branding (company logo, colors, domain)",
        "Client portal for customer access",
        "Automation engine (Review Hunter, Invoice Chaser)",
        "Advanced analytics & business dashboards",
      ],
      cta: "Book Ops Demo",
      link: "/contact",
      popular: false,
    },
  ] as const,

  // Strategic pillars for the interactive section
  strategicPillars: [
    {
      title: "The AI Supervisor",
      subtitle: "Scale Without Technician Overload",
      description: "Solving the technician turnover crisis. Give your best tech a virtual twin that supervises every job site in real-time, ensuring perfection without the burnout.",
      icon: "/assets/landing/hvac_modern_heatpump.jpg",
      size: "large",
      painpoint: "Tech Turnover & Inconsistency",
    },
    {
      title: "Profit Guard",
      subtitle: "Protect Every Billable Minute",
      description: "Callbacks are hidden margin killers. AI validates diagnostic accuracy before the truck leaves, ensuring every call is a profit, not a liability.",
      icon: "/assets/landing/hvac_control_finger.mp4",
      size: "small",
      painpoint: "Lost Margin on Callbacks",
    },
    {
      title: "Audit-Ready Ledger",
      subtitle: "Invisible EPA Compliance",
      description: "Eliminate the fear of a surprise audit. Our system generates audit-ready EPA & OSHA records automatically in the background, paperwork-free.",
      icon: "/assets/landing/hvac_legacy_bw.mp4",
      size: "small",
      painpoint: "Compliance & Legal Risk",
    },
    {
      title: "Intelligence Dispatch",
      subtitle: "Fleet Efficiency Reimagined",
      description: "Stop driving in circles. Dynamic dispatching prioritizes jobs based on technician skill matching and live distance optimization for maximum fleet ROI.",
      icon: "/assets/landing/hvac_professional_consult.jpg",
      size: "large",
      painpoint: "Operational Waste & Fuel Costs",
    },
  ] as const,

  // Social proof
  socialProof: {
    contractorCount: "growing contractors",
    disclaimer: "(pilot program)",
  },

  // FAQ for landing page
  faq: [
    {
      question: "How does the AI diagnostics system work?",
      answer: "Calculations run on the CoolProp thermodynamic engine, the industry-standard open-source fluid-property library, so results are physically grounded and reproducible.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use AES-256 encryption for all data at rest and in transit, and we follow GDPR requirements for privacy and consent. Your data is never sold or shared with third parties.",
    },
    {
      question: "Can I try before committing?",
      answer: "Yes. The Free plan includes 10 calculations per month with watermarked exports — no credit card and no trial timer. Upgrade to Engineering Pro ($49/mo) or Business Ops ($199/mo) whenever you're ready.",
    },
    {
      question: "How does pricing work for multiple technicians?",
      answer: "Engineering Pro is $49/month per account ($39/mo billed annually). Business Ops is $199/month ($159/mo billed annually) and covers your whole company. For larger teams, contact us.",
    },
    {
      question: "What integrations do you support?",
      answer: "ThermoNeural exports professional PDF and CSV reports that import cleanly into the tools you already use. Native integrations are on the roadmap — tell us your stack and we'll prioritize it.",
    },
  ] as const,

  // Trust badges / industry standards
  trustBadges: [
    {
      name: "ASHRAE",
      description: "Calculations follow ASHRAE standards",
      status: "active" as const,
    },
    {
      name: "NIST",
      description: "Thermodynamics powered by the CoolProp engine",
      status: "active" as const,
    },
    {
      name: "AES-256",
      description: "256-bit encryption for all data",
      status: "active" as const,
    },
    {
      name: "GDPR",
      description: "GDPR-aligned data handling and EU data-rights support",
      status: "active" as const,
    },
  ] as const,
} as const;

// Helper functions

export function getCertificationStatus(certKey: keyof typeof metrics.certifications) {
  const cert = metrics.certifications[certKey];
  const statusMap = {
    planned: cert.timeline ? `Planned for ${cert.timeline}` : cert.description,
    in_progress: cert.timeline ? `In progress - ${cert.timeline}` : cert.description,
    active: cert.description,
  };
  return {
    title: cert.title,
    status: cert.status,
    description: statusMap[cert.status],
  };
}

// Export types for TypeScript
export type Metric = typeof metrics;
export type CertificationStatus = "planned" | "in_progress" | "active";
