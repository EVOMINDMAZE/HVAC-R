// Centralized metrics configuration for ThermoNeural
// This file ensures consistent, verifiable metrics across the application

export const metrics = {
  // User statistics
  users: {
    totalEngineers: "1,200+",
    description: "HVAC engineers worldwide",
    lastUpdated: "2025-02-01", // Example date - update when real data available
    source: "Internal user analytics" as const,
  },

  // Performance metrics
  performance: {
    timeSavings: {
      value: "85%",
      qualifier: "Average time reduction based on internal testing",
      description: "Calculation time reduction",
      isVerified: false,
    },
    accuracy: {
      value: "99.8%",
      qualifier: "Validated against industry reference data",
      description: "Calculation accuracy",
      isVerified: false,
    },
    reportsGenerated: {
      value: "10k+",
      qualifier: "Reports generated to date",
      description: "Professional reports",
      isVerified: false,
    },
  },

  // Security certifications
  certifications: {
    soc2: {
      title: "SOC 2 Type II",
      status: "planned" as const,
      timeline: "Q2 2025",
      description: "Security controls implementation in progress",
    },
    iso27001: {
      title: "ISO 27001",
      status: "in_progress" as const,
      timeline: "Certification process initiated",
      description: "Information security management system",
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
    showPlaceholders: true,
    placeholderDisclaimer: "Example testimonials - Real customer reviews coming soon!",
    reviewCredit: {
      amount: "$50",
      description: "Credit for verified review",
      isLimitedTime: true,
    },
  },

  // Urgency messaging
  urgency: {
    limitedTimeOffer: "Introductory offer",
    limitedSpots: "Special introductory offer",
    countdown: null as string | null, // Specific countdown removed for transparency
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
    hvacInsider: {
      name: "HVAC Insider",
      description: "Industry Publication",
      relationship: "industry_media" as const,
    },
    engineerWeekly: {
      name: "Engineer Weekly",
      description: "Engineering News",
      relationship: "industry_media" as const,
    },
    refrigerationNews: {
      name: "Refrigeration News",
      description: "Global Industry News",
      relationship: "industry_media" as const,
    },
  },
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