import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Shield,
  Play,
  Zap,
  ImageOff,
  BadgeCheck,
  Clock,
  Layout,
  BarChart3,
  FileCheck2,
  Send,
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import "@/landing.css";

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
import { landingConfig } from "@/config/metrics";
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

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] as any } 
    },
  };

  const stagger = {
    visible: {
      transition: prefersReducedMotion ? undefined : { staggerChildren: 0.1 },
    },
  };

  const pillarIcons = [Layout, BarChart3, FileCheck2, Send];

  return (
    <PublicPageShell className="landing-page bg-background" mainId="main-content" skipToMain>
      <SEO
        title="ThermoNeural | Engineering Operations at Scale"
        description="Equip your HVAC&R technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching."
      />
      <StructuredData />

      {/* Hero Section */}
      <section className="relative bg-slate-50 dark:bg-[#111827] pt-20 sm:pt-28 pb-16 sm:pb-20 lg:pt-40 lg:pb-32 overflow-hidden hero-gradient">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.05] text-primary pointer-events-none" />

        {/* Background Image - Full Width, Faded Center */}
        <div className="absolute inset-0 z-0 hidden sm:block">
          <img
            src="/assets/landing/create_image_like_202603191616.png"
            alt=""
            className="w-full h-full object-cover opacity-20 blur-sm scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-transparent dark:to-transparent" style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 50%, transparent 0%, transparent 100%)',
          }} />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-transparent hidden dark:block" style={{
            background: 'radial-gradient(ellipse 60% 100% at 50% 50%, transparent 0%, #111827 100%)',
          }} />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center justify-center text-center">
          <motion.div
            initial="hidden"
            animate={isVisible ? "visible" : "hidden"}
            variants={stagger}
            className="max-w-4xl mx-auto flex flex-col items-center"
          >
            <motion.h1
              variants={fadeInUp}
              className="text-foreground dark:text-white text-5xl sm:text-6xl md:text-7xl lg:text-[72px] font-display font-extrabold tracking-tight leading-[1.05] mb-6"
            >
              Engineering <br className="hidden sm:block" />
              <span className="landing-heading-accent">
                Operations
                <img
                  src="/assets/landing-figma/mmxud1sh-eiwbik6.svg"
                  alt=""
                  className="landing-heading-underline"
                />
              </span>{" "}
              at Scale.
            </motion.h1>
            <motion.p
              variants={fadeInUp}
              className="text-muted-foreground text-lg sm:text-xl lg:text-2xl max-w-2xl mb-10 leading-relaxed"
            >
              Stop trading time for money. Equip your technicians with AI-driven diagnostics, automated compliance, and profit-focused dispatching.
            </motion.p>
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto"
            >
              <Link to="/signup" className="landing-btn-primary w-full sm:w-auto h-14 text-lg">
                Start Your Free Trial
              </Link>
              <Link to="/demo" className="landing-btn-secondary w-full sm:w-auto h-14 text-lg">
                <Play className="w-5 h-5 mr-2 fill-current" />
                Watch Strategy Video
              </Link>
            </motion.div>
          </motion.div>

          {/* Hero Visual */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full max-w-[1024px] mt-16 relative perspective-1000"
          >
            <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-2xl bg-card transform rotate-x-2 translate-y-2 hover:rotate-x-0 hover:translate-y-0 transition-transform duration-500 ease-out">
              <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent z-10 pointer-events-none" />
              <LandingImage
                src="/assets/landing-figma/mmxud1ss-7algalc.png"
                alt="ThermoNeural Dashboard Interface"
                className="w-full h-auto object-cover relative z-0"
                loading="eager"
              />
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-6 top-1/4 hidden md:flex items-center gap-3 bg-card border border-border p-4 rounded-xl shadow-xl z-20 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <div className="text-2xl font-black font-display text-foreground">2.4x</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Efficiency Gain</div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-6 bottom-1/4 hidden md:flex items-center gap-3 bg-card border border-border p-4 rounded-xl shadow-xl z-20 backdrop-blur-md"
            >
              <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <div className="text-2xl font-black font-display text-foreground">Zero</div>
                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Callback Rate</div>
              </div>
            </motion.div>

            {/* Glow Effects */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-primary/20 blur-[100px] -z-10 rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* Problem / Pillars Section - Redesigned */}
      <section className="py-24 bg-muted/20 relative overflow-hidden border-t border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-display leading-tight">
              Your technicians are excellent.<br />
              <span className="text-muted-foreground">Your systems are the bottleneck.</span>
            </h2>
            <p className="text-lg text-muted-foreground tracking-wide font-medium">
              FOUR PILLARS OF OPERATIONAL EXCELLENCE
            </p>
          </div>

          <div className="flex flex-col gap-24">
            {/* Pillar 1: AI Supervisor */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative rounded-xl border border-border/50 shadow-2xl overflow-hidden bg-card transform transition-transform hover:scale-[1.02] duration-500">
                <LandingImage
                  src="/assets/landing-figma/mmxud1ss-7algalc.png"
                  alt="AI Supervisor Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="order-1 lg:order-2 flex flex-col items-start lg:pl-12">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 border border-blue-500/20">
                  <img src="/assets/landing-figma/mmxud1sh-xxzt3zf.svg" alt="AI Supervisor" className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4 font-display">AI Supervisor</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Real-time AI monitoring catches issues before they become callbacks. Pattern recognition analyzes equipment history to predict failures, so you can fix problems before the customer even notices.
                </p>
                <Link to="/ai-diagnostics" className="landing-btn-secondary h-12">
                  Deploy Module <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Pillar 2: Profit Guard */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-start lg:pr-12">
                <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center mb-6 border border-green-500/20">
                  <img src="/assets/landing-figma/mmxud1sh-c7hjy0c.svg" alt="Profit Guard" className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4 font-display">Profit Guard</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Automated pricing intelligence ensures every job is quoted at optimal margins. Real-time cost tracking prevents scope creep and protects your bottom line on every truck roll.
                </p>
                <Link to="/pricing-intelligence" className="landing-btn-secondary h-12">
                  Deploy Module <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="relative rounded-xl border border-border/50 shadow-2xl overflow-hidden bg-card transform transition-transform hover:scale-[1.02] duration-500">
                <LandingImage
                  src="/assets/landing-figma/mmxud1ss-u3lvasl.png"
                  alt="Profit Guard Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Pillar 3: Audit-Ready Ledger */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="order-2 lg:order-1 relative rounded-xl border border-border/50 shadow-2xl overflow-hidden bg-card transform transition-transform hover:scale-[1.02] duration-500">
                <LandingImage
                  src="/assets/landing-figma/mmxud1ss-aosmrt7.png"
                  alt="Audit-Ready Ledger Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
              <div className="order-1 lg:order-2 flex flex-col items-start lg:pl-12">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center mb-6 border border-purple-500/20">
                  <img src="/assets/landing-figma/mmxud1sh-2fjyt2y.svg" alt="Audit-Ready Ledger" className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4 font-display">Audit-Ready Ledger</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  Every invoice, every part, every labor hour documented and organized. Generate EPA compliance reports in seconds, completely eliminating administrative panic during audits.
                </p>
                <Link to="/compliance" className="landing-btn-secondary h-12">
                  Deploy Module <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>

            {/* Pillar 4: Intelligence Dispatch */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="flex flex-col items-start lg:pr-12">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 border border-orange-500/20">
                  <img src="/assets/landing-figma/mmxud1sh-7grxmjd.svg" alt="Intelligence Dispatch" className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-4 font-display">Intelligence Dispatch</h3>
                <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                  AI-powered routing considers traffic, technician skills, truck inventory, and customer preferences to build the most profitable schedule automatically.
                </p>
                <Link to="/dispatch" className="landing-btn-secondary h-12">
                  Deploy Module <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
              <div className="relative rounded-xl border border-border/50 shadow-2xl overflow-hidden bg-card transform transition-transform hover:scale-[1.02] duration-500">
                <LandingImage
                  src="/assets/landing-figma/mmxud1ss-8dx10dv.png"
                  alt="Intelligence Dispatch Dashboard"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pillars of Operational Excellence Metrics Strip */}
      <section className="py-12 border-y border-border bg-card/50 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] text-primary pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">
            {/* Metrics Group */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-12 w-full lg:w-auto">
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">30%</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Increase in Ticket Value</span>
              </div>
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">Zero</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Compliance Fines</span>
              </div>
              <div className="flex flex-col items-center lg:items-start group">
                <span className="text-4xl md:text-5xl font-black text-primary font-display tracking-tight transition-transform group-hover:scale-110 duration-300">2hrs</span>
                <span className="text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-[0.2em] mt-2 text-center lg:text-left">Saved Per Job</span>
              </div>
            </div>

            {/* Vertical Divider (Desktop Only) */}
            <div className="hidden lg:block w-px h-16 bg-border/40" />

            {/* Badges Group */}
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-10">
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
                <div className="w-7 h-7 rounded-full bg-blue-500/10 border-2 border-blue-400 flex items-center justify-center">
                  <span className="text-blue-500 text-[7px] font-bold">EU</span>
                </div>
                <span className="font-bold text-foreground text-xs">GDPR</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-[0.02] text-primary pointer-events-none" />
        <div className="max-w-[1024px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-display mb-4">Transparent Pricing for Every Stage</h2>
            <p className="text-lg text-muted-foreground">Start free, upgrade when you're ready to scale.</p>
          </div>

          <div className="flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-8 lg:gap-6">
            {landingConfig.pricing.map((plan, idx) => (
              <div
                key={idx}
                className={`flex flex-col rounded-2xl border bg-card transition-all duration-300 relative ${
                  plan.popular
                    ? "border-primary shadow-2xl scale-100 lg:scale-105 z-10 w-full max-w-[380px]"
                    : "border-border/50 hover:shadow-xl hover:-translate-y-1 w-full max-w-[340px]"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <span className="bg-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase py-1 px-4 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="p-8 flex flex-col flex-grow">
                  <div className="mb-8 text-center border-b border-border/50 pb-8">
                    <h3 className="text-2xl font-bold text-foreground mb-4 font-display">
                      {plan.name}
                    </h3>
                    <div className="flex flex-col items-center justify-center">
                      <span className="text-[48px] font-bold text-foreground font-display leading-none mb-2">
                        {plan.price}
                      </span>
                      <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-5 mb-8 flex-grow">
                    {plan.features.map((feature, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-3 text-sm text-muted-foreground">
                        <CheckCircle2 className={`w-5 h-5 flex-shrink-0 mt-0.5 ${plan.popular ? 'text-primary' : 'text-muted-foreground/50'}`} />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    to={plan.link || "/signup"}
                    className={`block w-full py-4 px-6 text-[16px] font-bold rounded-xl text-center transition-all ${
                      plan.popular
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 hover:scale-[1.02]'
                        : 'bg-muted hover:bg-muted/80 text-foreground border border-border/50'
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-muted/20 border-t border-border/50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground font-display mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about the product and billing.</p>
          </div>
          <Accordion type="single" collapsible className="space-y-4">
            {landingConfig.faq.map((item, idx) => (
              <AccordionItem 
                key={idx} 
                value={`item-${idx}`}
                className="bg-card rounded-2xl border border-border/50 overflow-hidden px-6 transition-all duration-200 hover:shadow-md data-[state=open]:border-primary/30 data-[state=open]:shadow-md"
              >
                <AccordionTrigger className="text-left font-bold text-lg text-foreground hover:no-underline py-6">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground text-base leading-relaxed pb-6 pr-12">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="relative py-24 md:py-32 overflow-hidden border-t border-border group">
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-6xl font-black text-foreground mb-8 tracking-tight leading-[1.1] font-display">
              Equip your fleet with <br className="hidden sm:block" />
              <span className="text-primary">Decision Intelligence</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
              Join the growing number of HVAC&R contractors who are scaling their businesses with ThermoNeural's operational OS.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-7 rounded-full text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all group"
              >
                Get Started Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="glass-button-dark px-8 py-7 rounded-full text-lg font-semibold shadow-xl shadow-foreground/10 hover:scale-105 transition-all group"
              >
                <Play className="mr-2 w-5 h-5 fill-current" />
                Watch Strategy Video
              </Button>
            </div>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-xs font-bold text-muted-foreground uppercase tracking-widest">
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
            </div>
          </motion.div>
        </div>
      </section>

      {/* Mobile Sticky CTA */}
      <div className={`fixed bottom-6 left-4 right-4 z-40 md:hidden transition-all duration-300 transform ${showMobileCta ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
        <Button asChild className="w-full bg-primary hover:bg-primary/90 text-primary-foreground h-14 rounded-xl shadow-2xl text-lg font-bold">
          <Link to="/signup">Start Free Trial</Link>
        </Button>
      </div>
    </PublicPageShell>
  );
}
