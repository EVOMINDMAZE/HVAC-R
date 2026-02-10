import { Helmet } from "react-helmet-async";

export function StructuredData() {
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "ThermoNeural",
    "description": "Professional‑grade HVAC&R thermodynamic calculation platform",
    "url": "https://thermoneural.com",
    "logo": "https://thermoneural.com/logo.png",
    "sameAs": [
      "https://linkedin.com/company/thermoneural",
      "https://twitter.com/thermoneural",
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "contactType": "customer support",
      "email": "support@thermoneural.com",
      "availableLanguage": "English",
    },
    "founder": "ThermoNeural Team",
  };

  const webApplication = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "ThermoNeural Platform",
    "description": "AI‑powered thermodynamic calculations for HVAC&R engineers",
    "applicationCategory": "EngineeringApplication",
    "operatingSystem": "Web",
    "url": "https://thermoneural.com",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD",
      "availability": "https://schema.org/InStock",
    },
    "featureList": [
      "Standard cycle analysis",
      "Performance reports",
      "Secure cloud‑based platform",
      "AI‑powered optimization",
      "Professional PDF reports",
    ],
    "screenshot": "https://thermoneural.com/screenshot.png",
  };

  const product = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "ThermoNeural Pro",
    "description": "Professional‑grade HVAC&R calculation software with AI‑powered insights",
    "brand": "ThermoNeural",
    "sku": "TN-PRO-2025",
    "offers": {
      "@type": "AggregateOffer",
      "lowPrice": "49",
      "highPrice": "Custom",
      "priceCurrency": "USD",
      "offerCount": "3",
      "offers": [
        {
          "@type": "Offer",
          "price": "0",
          "priceCurrency": "USD",
          "name": "Free Plan",
          "availability": "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          "price": "49",
          "priceCurrency": "USD",
          "name": "Pro Plan",
          "availability": "https://schema.org/InStock",
        },
        {
          "@type": "Offer",
          "price": "Custom",
          "priceCurrency": "USD",
          "name": "Enterprise Plan",
          "availability": "https://schema.org/InStock",
        },
      ],
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.9",
      "ratingCount": "1200",
      "bestRating": "5",
      "worstRating": "1",
    },
  };

  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      {
        "@type": "Question",
        "name": "What is ThermoNeural?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "ThermoNeural is a professional‑grade HVAC&R thermodynamic calculation platform that uses AI to simplify complex calculations, saving engineers significant time while maintaining high accuracy.",
        },
      },
      {
        "@type": "Question",
        "name": "Is there a free trial?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we offer a 14‑day free trial of our Pro plan with no credit card required. You can explore all features during this period.",
        },
      },
      {
        "@type": "Question",
        "name": "Is my data secure?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, we use 256‑bit encryption, are SOC 2 Type II compliant (in progress), and follow ASHRAE and NIST standards to ensure your data remains private and secure.",
        },
      },
      {
        "@type": "Question",
        "name": "Can I export reports?",
        "acceptedAnswer": {
          "@type": "Answer",
          "text": "Yes, ThermoNeural generates professional PDF reports with P‑h diagrams, state points, and system performance metrics. You can export in PDF, CSV, and other formats.",
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