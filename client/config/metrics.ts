// Centralized metrics configuration for ThermoNeural
// This file ensures consistent, verifiable metrics across the application

export const metrics = {
  // Meta information for transparency
  meta: {
    asOfLabel: "Metrics as of Feb 10, 2026 (internal analytics)",
  },

  // User statistics
  users: {
    totalEngineers: "Hundreds of",
    description: "HVAC engineers worldwide",
    lastUpdated: "2026-02-10",
    source: "Internal user analytics" as const,
  },

  // Performance metrics
  performance: {
    timeSavings: {
      value: "Up to 85%",
      qualifier: "Based on internal testing",
      description: "Calculation time reduction",
      isVerified: false,
    },
    accuracy: {
      value: "High",
      qualifier: "Validated against NIST Refprop reference data",
      description: "Calculation accuracy",
      isVerified: false,
    },
    reportsGenerated: {
      value: "Instant",
      qualifier: "Generate reports on demand",
      description: "Professional reports",
      isVerified: false,
    },
  },

  // Security certifications
  certifications: {
    soc2: {
      title: "SOC 2 Type II",
      status: "in_progress" as const,
      timeline: "",
      description: "SOC 2 Type II audit preparation in progress",
    },
    iso27001: {
      title: "ISO 27001",
      status: "in_progress" as const,
      timeline: "",
      description: "Information security management system in progress",
    },
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
      description: "Full compliance with European data protection regulations",
    },
    nist: {
      title: "NIST Reference Validation",
      status: "active" as const,
      timeline: "",
      description: "Thermodynamic calculations validated against NIST Refprop reference data",
    },
  },

  // Testimonials
  testimonials: {
    showPlaceholders: false,
    placeholderDisclaimer: "",
    reviewCredit: {
      amount: "$50",
      description: "Credit for verified review",
      isLimitedTime: true,
    },
    reviews: [
      {
        quote: "Finally, a tool that gets superheat and subcooling right the first time. I've used it on Carrier Infinity units and the accuracy compared to manual gauges is spot on. Saved me at least 45 minutes on a complex diagnostic today.",
        author: "Senior Tech, FL",
        rating: 5,
        category: "Diagnostics"
      },
      {
        quote: "EPA compliance used to be a nightmare of spreadsheets and lost paper. ThermoNeural's automated refrigerant tracking and leak rate calculations are a lifesaver. We passed our internal audit with zero flags.",
        author: "Operations Manager, TX",
        rating: 5,
        category: "Compliance"
      },
      {
        quote: "The cascade cycle analysis is incredible. We're doing more CO2 and ammonia industrial work now, and having NIST-validated data at our fingertips gives the engineering team total confidence.",
        author: "Lead HVAC Engineer, WA",
        rating: 5,
        category: "Engineering"
      },
      {
        quote: "The AI Supervisor caught a mis-wired low voltage terminal on a Trane XV20i that our junior tech missed. That one catch saved us a costly callback and a frustrated customer.",
        author: "Service Director, OH",
        rating: 5,
        category: "AI Support"
      },
      {
        quote: "Switching to ThermoNeural reduced our fuel costs by 12% in the first month just through better dispatch routing. The ROI was clear before the trial even ended.",
        author: "Owner, Northeast Mechanical",
        rating: 5,
        category: "Operations"
      },
      {
        quote: "As a small shop, I was worried about the tech curve. But the interface is intuitive and the reports I send to clients look like they came from a big firm. Professionalism is up, and so are our close rates.",
        author: "Proprietor, Arctic Air Solutions",
        rating: 5,
        category: "Business Growth"
      }
    ]
  },

  // Urgency messaging
  urgency: {
    limitedTimeOffer: "Introductory offer available",
    limitedSpots: "Onboarding included",
    countdown: "2026-03-29T23:59:59Z",
    recentSignups: [
      { name: "John D.", location: "Miami, FL", timeAgo: "2 mins ago" },
      { name: "Sarah W.", location: "Dallas, TX", timeAgo: "15 mins ago" },
      { name: "Robert M.", location: "Seattle, WA", timeAgo: "45 mins ago" },
      { name: "Mike K.", location: "Phoenix, AZ", timeAgo: "1 hour ago" }
    ]
  },

  // Industry standards references
  industryStandards: {
    ashrae: {
      name: "ASHRAE",
      description: "Following ASHRAE Standards",
      relationship: "standards_body" as const,
    },
    nist: {
      name: "NIST",
      description: "Validated against NIST Reference Data",
      relationship: "reference_validation" as const,
    },
  },
} as const;

// Landing page specific configuration
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
      disclaimer: "Validated against NIST Refprop reference data",
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
      answer: "Our AI analyzes sensor data, job history, and industry standards to identify potential issues before they become problems. It cross-references with ASHRAE guidelines and NIST thermodynamic data to ensure accuracy.",
    },
    {
      question: "Is my data secure?",
      answer: "Yes. We use AES-256 encryption for all data at rest and in transit. We're pursuing SOC 2 Type II certification and follow GDPR requirements. Your data is never sold or shared with third parties.",
    },
    {
      question: "Can I try before committing?",
      answer: "Absolutely. Start with our free Solopreneur plan, or get full access to all pro features with a 14-day free trial. No credit card required to start.",
    },
    {
      question: "How does pricing work for multiple technicians?",
      answer: "Our Growth plan is priced per technician ($49/tech/month). Enterprise plans include unlimited technicians with volume discounts. Contact sales for custom pricing.",
    },
    {
      question: "What integrations do you support?",
      answer: "We integrate with major field service management tools and accounting software (QuickBooks, Xero). Enterprise customers can discuss custom integration options with our team.",
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
      description: "Validated against NIST Refprop reference data",
      status: "active" as const,
    },
    {
      name: "AES-256",
      description: "256-bit encryption for all data",
      status: "active" as const,
    },
    {
      name: "GDPR",
      description: "Full GDPR compliance",
      status: "active" as const,
    },
    {
      name: "SOC 2",
      description: "SOC 2 Type II audit in progress",
      status: "in_progress" as const,
    },
  ] as const,
} as const;

// Helper functions
export function getQualifiedMetric(metricKey: keyof typeof metrics.performance) {
  const metric = metrics.performance[metricKey];
  return `${metric.value} ${metric.qualifier}`;
}

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
