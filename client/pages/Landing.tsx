import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useState, useRef } from "react";

import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Play,
  ImageOff,
  BadgeCheck,
  Layout,
  BarChart3,
  FileCheck2,
  Send,
} from "lucide-react";
import { Link } from "react-router-dom";

import { HeroSection } from "@/components/landing/HeroSection";
import { MiniAppPlayground } from "@/components/landing/MiniAppPlayground";
import { PricingSection } from "@/components/landing/PricingSection";
import { ValuePropositionGrid } from "@/components/landing/ValuePropositionGrid";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { SEO } from "@/components/SEO";
import { StructuredData } from "@/components/seo/StructuredData";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { SectionNumber } from "@/components/ui/SectionNumber";
import { landingConfig } from "@/config/metrics";
import { hudFadeIn, staggerChildren } from "@/lib/animations/landingVariants";
import { trackMarketingEvent } from "@/lib/marketingAnalytics";

function LandingImage({
  src,
  alt,
  className,
  loading
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager"
}) {
  const [error, setError] = useState(false);
  const isVideo = src.toLowerCase().endsWith('.mp4');

  useEffect(() => {
    setError(false);
  }, [src]);

  if (error) {
    return (
      <div className={`${className} bg-muted flex items-center justify-center`}>
        <ImageOff className="w-8 h-8 text-muted-foreground opacity-50" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        src={src}
        className={className}
        autoPlay
        loop
        muted
        playsInline
        onError={() => setError(true)}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setError(true)}
    />
  );
}

export function Landing() {
  const [isVisible, setIsVisible] = useState(false);
  const [showMobileCta, setShowMobileCta] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  useEffect(() => {
    setIsVisible(true);
    trackMarketingEvent("landing_view", { section: "hero_redesign" });
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const heroHeight = window.innerHeight * 0.9;
      setShowMobileCta(scrollY > heroHeight);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const pillarIcons = [Layout, BarChart3, FileCheck2, Send];

  return (
    <PublicPageShell mainId="main-content" skipToMain>
      <SEO
        title="ThermoNeural | Engineering Operations at Scale"
        description="Equip your HVAC&R technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching."
      />
      <StructuredData />

      <HeroSection />

      <ValuePropositionGrid />

      {/* Technical Tools Section */}
      <section className="py-[var(--space-24)] bg-transparent relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] text-slate-500 pointer-events-none" />
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerChildren}
        >
          <motion.div variants={hudFadeIn} className="relative mb-[var(--space-16)] pt-8">
            <SectionNumber number="03" className="absolute -top-8 -left-4 lg:-top-12 lg:-left-8" />
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-display">Included Technical Tools.</h2>
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground font-display">Empower your technicians.</h2>
            <div className="w-24 h-1 bg-primary mt-8" />
            <p className="mt-8 text-muted-foreground font-semibold tracking-wide uppercase text-sm">Secondary Feature Set</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {landingConfig.strategicPillars.map((pillar, idx) => {
              const Icon = pillarIcons[idx] || Layout;
              return (
                <motion.div 
                  key={idx}
                  variants={hudFadeIn}
                  whileHover={{ y: -8 }}
                  className="border border-border rounded-2xl p-6 flex flex-col h-full bg-card/50 backdrop-blur-sm landing-pillars-card group"
                  onClick={() => trackMarketingEvent("landing_pillar_click", { pillar: pillar.title })}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-6 transition-all duration-300 bg-orange-100 dark:bg-[#fff7ed] text-orange-600 dark:text-[#ea580c] group-hover:bg-orange-600 dark:group-hover:bg-[#ea580c] group-hover:text-white`}>
                    <Icon className="w-6 h-6 transition-transform duration-300" />
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{pillar.title}</h3>
                  <p className="text-muted-foreground text-sm mb-6 flex-grow leading-relaxed">
                    {pillar.description}
                  </p>
                  <Link 
                    to="/signup" 
                    className="text-primary font-semibold text-sm hover:underline flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      trackMarketingEvent("landing_pillar_click", { pillar: pillar.title, action: "deploy" });
                    }}
                  >
                    Deploy Module <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                  <div className="mt-6 pt-6 border-t border-border overflow-hidden rounded-lg">
                    <div className="bg-muted rounded-lg h-32 w-full relative overflow-hidden">
                      <LandingImage 
                        src={pillar.icon} 
                        alt={pillar.title} 
                        className="w-full h-full object-cover opacity-80 mix-blend-multiply dark:mix-blend-overlay group-hover:scale-110 transition-transform duration-500 ease-out" 
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-primary/5" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </section>

      {/* Interactive System Playground */}
      <section className="py-[var(--space-24)] bg-transparent relative overflow-hidden border-y border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerChildren}
          >
            <motion.div variants={hudFadeIn} className="relative mb-[var(--space-16)] pt-8">
              <SectionNumber number="04" className="absolute -top-8 -left-4 lg:-top-12 lg:-left-8" />
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4 font-display uppercase tracking-tight">Interactive Platform Experience</h2>
              <div className="w-24 h-1 bg-primary mt-8" />
              <p className="mt-8 text-muted-foreground font-semibold tracking-wide uppercase text-sm">Experience the ThermoNeural workflow</p>
            </motion.div>

            <motion.div variants={hudFadeIn}>
              <MiniAppPlayground />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pillars of Operational Excellence Metrics Strip */}
      <section className="py-[var(--space-12)] border-y border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] text-primary pointer-events-none" />
        <motion.div 
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Metrics Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
              <motion.div variants={hudFadeIn} className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">30%</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Increase in Ticket Value</span>
              </motion.div>
              <motion.div variants={hudFadeIn} className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">Zero</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Compliance Fines</span>
              </motion.div>
              <motion.div variants={hudFadeIn} className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">2hrs</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Saved Per Job</span>
              </motion.div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden lg:block w-px h-16 bg-border/40" />

            {/* Badges Group */}
            <motion.div variants={hudFadeIn} className="flex flex-wrap justify-center items-center gap-8 md:gap-10">
              {/* ASHRAE */}
              <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-[#1a3a5c] flex items-center justify-center">
                  <span className="text-slate-600 dark:text-white text-[5px] font-black leading-none text-center">ASHRAE</span>
                </div>
                <span className="font-black text-foreground text-sm tracking-tight">ASHRAE</span>
              </div>
              {/* NIST */}
              <div className="flex items-center gap-2 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <span className="font-black text-foreground text-sm tracking-tight">NIST</span>
                <Shield className="w-5 h-5 text-emerald-500 fill-emerald-500/20" />
              </div>
              {/* AES-256 */}
              <div className="flex items-center gap-1 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-7 h-7 rounded-full bg-teal-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-teal-500" />
                </div>
                <span className="font-bold text-foreground text-xs">AES 256</span>
              </div>
              {/* GDPR */}
              <div className="flex items-center gap-1 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all duration-300 cursor-default">
                <div className="w-7 h-7 rounded-full bg-orange-500/10 border-2 border-orange-400 flex items-center justify-center">
                  <span className="text-orange-500 text-[7px] font-bold">EU</span>
                </div>
                <span className="font-bold text-foreground text-xs">GDPR</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <PricingSection />

      {/* FAQ Section */}
      <section className="py-[var(--space-24)] bg-muted/30">
        <motion.div 
          className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerChildren}
        >
          <motion.h2 variants={hudFadeIn} className="text-4xl font-bold text-foreground text-center mb-12 font-display">Frequently Asked Questions</motion.h2>
          <motion.div variants={hudFadeIn}>
            <Accordion type="single" collapsible className="space-y-4">
              {landingConfig.faq.map((item, idx) => (
                <AccordionItem 
                  key={idx} 
                  value={`item-${idx}`}
                  className="bg-card rounded-xl border border-border overflow-hidden px-4 transition-all duration-200 hover:shadow-lg hover:border-primary/20"
                >
                  <AccordionTrigger 
                    className="text-left font-semibold text-foreground hover:no-underline py-6 px-2"
                    onClick={() => trackMarketingEvent("landing_faq_expand", { question: item.question })}
                  >
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-6 px-2">
                    {item.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </motion.div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-[var(--space-24)] md:py-[var(--space-24)] overflow-hidden border-t border-border group">
        <div className="absolute inset-0 z-0">
          <LandingImage 
            src="/assets/landing/hvac_office_team.jpg" 
            alt="ThermoNeural Team" 
            className="w-full h-full object-cover opacity-20 transition-transform duration-[5s] group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/85 to-background/95" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
          >
            <motion.h2 variants={hudFadeIn} className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tight leading-[1.1] font-display">
              Equip your fleet with <br className="hidden sm:block" />
              <span className="text-primary">Decision Intelligence</span>
            </motion.h2>
            <motion.p variants={hudFadeIn} className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the growing number of HVAC&R contractors who are scaling their businesses with ThermoNeural's operational OS.
            </motion.p>
            <motion.div variants={hudFadeIn} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                asChild
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-7 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
                onClick={() => trackMarketingEvent("landing_pricing_cta_click", { section: "final_cta", destination: "/signup" })}
              >
                <Link to="/signup?plan=business" className="flex items-center">
                  Get Started Now
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button 
                asChild
                size="lg" 
                variant="outline" 
                className="glass-button-dark px-8 py-7 rounded-full text-lg font-semibold shadow-xl shadow-foreground/10 hover:scale-105 transition-all group"
                onClick={() => trackMarketingEvent("landing_hero_secondary_click", { section: "final_cta", destination: "/demo" })}
              >
                <Link to="/demo" className="flex items-center">
                  <Play className="mr-2 w-5 h-5 fill-current" />
                  Watch Strategy Video
                </Link>
              </Button>
            </motion.div>
            <motion.div variants={hudFadeIn} className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                No credit card
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                14-day full access
              </div>
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-primary" />
                Live in 5 mins
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className={`fixed bottom-6 left-4 right-4 z-40 md:hidden transition-all duration-300 transform ${showMobileCta ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <Button 
          asChild 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-xl shadow-2xl text-lg font-bold"
          onClick={() => trackMarketingEvent("landing_hero_primary_click", { section: "sticky_mobile", destination: "/signup" })}
        >
          <Link to="/signup?plan=business">Start Business Trial</Link>
        </Button>
      </div>
    </PublicPageShell>
  );
}
