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
