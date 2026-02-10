import { Helmet } from "react-helmet-async";

export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "ThermoNeural",
    description:
      "Business-in-a-Box HVAC operations and engineering platform for contractors, refrigeration teams, and cryogenic facilities.",
    url: "https://thermoneural.com",
    logo: "https://thermoneural.com/logo.png",
    sameAs: [
      "https://linkedin.com/company/thermoneural",
      "https://twitter.com/thermoneural",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "support@thermoneural.com",
      availableLanguage: "English",
    },
    founder: "ThermoNeural Team",
  };

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "ThermoNeural Platform",
    description:
      "HVAC&R operations and engineering system to run dispatch, compliance, diagnostics, and reporting in one operating workflow.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://thermoneural.com",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "199",
      priceCurrency: "USD",
      offerCount: "4",
    },
    featureList: [
      "Work operations board",
      "Field diagnostics workflows",
      "Engineering cycle tools",
      "EPA 608 compliance tracking",
      "Client-ready reporting",
      "Free-start engineering with Business Ops expansion",
    ],
    screenshot: "https://thermoneural.com/screenshot.png",
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "ThermoNeural",
    description:
      "HVAC operations and engineering platform with Business-in-a-Box workflows for dispatch, compliance, and reporting.",
    brand: "ThermoNeural",
    sku: "TN-OPS-2026",
    offers: {
      "@type": "AggregateOffer",
      lowPrice: "0",
      highPrice: "199",
      priceCurrency: "USD",
      offerCount: "4",
      offers: [
        {
          "@type": "Offer",
          price: "0",
          priceCurrency: "USD",
          name: "Engineering Free",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          price: "49",
          priceCurrency: "USD",
          name: "Engineering Pro",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          price: "199",
          priceCurrency: "USD",
          name: "Business Ops",
          availability: "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          price: "Custom",
          priceCurrency: "USD",
          name: "Enterprise",
          availability: "https://schema.org/InStock",
        },
      ],
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is ThermoNeural?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "ThermoNeural is an HVAC operations and engineering platform that combines dispatch, compliance, and advanced calculations in one workspace.",
        },
      },
      {
        "@type": "Question",
        name: "Is there a free plan?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Start Engineering Free, then expand into Business Ops at $199 per month when your team needs dispatch and compliance workflows.",
        },
      },
      {
        "@type": "Question",
        name: "Does ThermoNeural support compliance reporting?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Refrigerant logs, leak-rate tracking, and audit-ready exports are built into Business Ops and Pro plans.",
        },
      },
      {
        "@type": "Question",
        name: "Can I export reports?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Generate professional PDF reports, compliance summaries, and CSV exports for clients and auditors.",
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organization)}</script>
      <script type="application/ld+json">{JSON.stringify(webApplication)}</script>
      <script type="application/ld+json">{JSON.stringify(product)}</script>
      <script type="application/ld+json">{JSON.stringify(faq)}</script>
    </Helmet>
  );
}
