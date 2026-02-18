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
  },

  // Urgency messaging
  urgency: {
    limitedTimeOffer: "Introductory offer available",
    limitedSpots: "Onboarding included",
    countdown: null as string | null,
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
      value: "30%",
      label: "Increase in Ticket Value",
      disclaimer: "Based on pilot program data",
    },
    {
      value: "Zero",
      label: "Compliance Fines",
      disclaimer: "Based on pilot program data",
    },
    {
      value: "2hrs",
      label: "Saved Per Job",
      disclaimer: "Based on pilot program data",
    },
  ] as const,

  // Pricing tiers
  pricing: [
    {
      name: "Solopreneur",
      price: "$0",
      period: "forever",
      description: "For owner-operators just starting out.",
      features: [
        "Basic Cycle Analysis",
        "Job History (7 Days)",
        "Standard Exports",
        "Community Support",
      ],
      cta: "Start Free",
      link: "/signup",
      popular: false,
    },
    {
      name: "Growth",
      price: "$49",
      period: "/tech/mo",
      description: "For growing fleets that need standardization.",
      features: [
        "Advanced AI Diagnostics",
        "Unlimited Job History",
        "Performance Analytics",
        "Priority Dispatching",
        "Custom Branding",
      ],
      cta: "Start Free Trial",
      link: "/pricing",
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/mo",
      description: "For full operations management.",
      features: [
        "API Access",
        "Dedicated Account Mgr",
        "SLA Guarantees",
        "Advanced Compliance Ledger",
        "Multi-Org Support",
      ],
      cta: "Contact Sales",
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
      description: "Eliminate the fear of a surprise audit. Our system generates audit-proof EPA & OSHA records automatically in the background, paperwork-free.",
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
      answer: "We integrate with major field service management tools, accounting software (QuickBooks, Xero), and offer API access for custom integrations on Enterprise plans.",
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
