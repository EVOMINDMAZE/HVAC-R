import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/glass-card";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { MiniAppPlayground } from "@/components/landing/MiniAppPlayground";
import { ValuePropositionGrid } from "@/components/landing/ValuePropositionGrid";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { SecuritySection } from "@/components/ui/security-section";
import { PricingSection } from "@/components/landing/PricingSection";
import { TestimonialsSection } from "@/components/ui/testimonials-section";
import {
  ArrowRight,
  Calculator,
  Shield,
  BarChart,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useRef, useState } from "react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/seo/StructuredData";



const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
    },
  },
};







function FAQSection() {
  return (
    <section className="py-32 px-4 relative overflow-hidden">
      {/* Futuristic Background */}
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute bottom-1/2 right-1/4 w-64 h-64 bg-highlight/5 rounded-full blur-[120px] -z-20" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--foreground)/0.02)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.02)_1px,transparent_1px)] bg-[size:40px_40px] -z-10" />
      
      <div className="max-w-3xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <Badge
            variant="outline"
            className="mb-4 px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary backdrop-blur-md glass-futuristic font-mono tracking-widest uppercase text-[10px] sm:text-xs"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            SYSTEM INQUIRIES
          </Badge>
          <h2 className="text-4xl sm:text-6xl font-bold mb-6 tracking-tight font-mono">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary/80 to-primary">
              COMMAND PROTOCOLS
            </span>
          </h2>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-light">
            Essential operational queries for system integration and deployment.
          </p>
        </motion.div>

        <GlassCard variant="command" className="rounded-2xl p-1 border border-primary/20" glow={true}>
          <Accordion type="single" collapsible className="w-full">
            {[
              {
                q: "IS THERMONEURAL FREE TO TRY?",
                a: "Yes! We offer a generous free tier that lets you perform standard cycle calculations and explore the platform's capabilities.",
              },
              {
                q: "CAN I EXPORT MY DATA?",
                a: "Absolutely. Pro plans allow you to export your calculations to PDF and CSV formats for use in reports and other tools.",
              },
              {
                q: "WHAT REFRIGERANTS ARE SUPPORTED?",
                a: "We support over 50+ common refrigerants including R410A, R134a, R32, R744 (CO2), R717 (Ammonia) and many new low-GWP alternatives.",
              },
              {
                q: "IS IT SUITABLE FOR STUDENTS?",
                a: "Yes, ThermoNeural is an excellent tool for thermodynamics students to visualize cycles and verify manual calculations.",
              },
            ].map((faq, i) => (
              <AccordionItem key={i} value={`item-${i}`}>
                <AccordionTrigger className="text-left text-lg font-medium p-6 hover:bg-primary/5 hover:text-primary transition-all rounded-xl font-mono border-b border-primary/10">
                  <div className="flex items-center">
                    <div className="w-2 h-2 rounded-full bg-primary mr-4" />
                    <span className="text-muted-foreground hover:text-primary">{faq.q}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base p-6 pt-2 font-light bg-card/30 rounded-b-xl">
                  <div className="flex">
                    <div className="w-2 h-2 rounded-full bg-primary/50 mr-4 mt-2 flex-shrink-0" />
                    <p>{faq.a}</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </GlassCard>
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-background -z-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] -z-20" />

      <div className="max-w-4xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <Badge
            variant="outline"
            className="mb-6 px-4 py-1.5 rounded-full border-primary/50 bg-primary/10 text-primary text-xs"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Start Free Today
          </Badge>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 tracking-tight">
            Ready to streamline your
            <span className="text-primary"> HVAC calculations?</span>
          </h2>

          <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of engineers who save hours every week with ThermoNeural.
            No credit card required.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full sm:w-auto h-14 px-8 text-lg bg-primary hover:bg-primary/90"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/contact" className="w-full sm:w-auto">
              <Button
                size="lg"
                variant="outline"
                className="w-full sm:w-auto h-14 px-8 text-lg"
              >
                Contact Sales
              </Button>
            </Link>
          </div>

          <div className="flex justify-center gap-6 mt-10 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span>Free 14-day trial</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>No credit card</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-highlight" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen w-full bg-background text-foreground selection:bg-primary/20 selection:text-primary flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>
      <Header variant="landing" />

      <main id="main-content" className="flex-grow">
        <SEO
          title="ThermoNeural | AI-Powered HVAC&R Thermodynamic Analysis Platform"
          description="ThermoNeural: AI-powered thermodynamic analysis platform for HVAC&R engineers. Simulate refrigeration cycles, optimize system performance, and generate professional reports with 99.8% accuracy. Start your free trial today."
        />
        <StructuredData />
        <HeroSection />
        <MiniAppPlayground />
        <ValuePropositionGrid />
        <HowItWorks />
        <SecuritySection />
        <PricingSection />
        <FAQSection />
        <TestimonialsSection />
        <CTASection />
      </main>

      <Footer />
    </div>
  );
}
